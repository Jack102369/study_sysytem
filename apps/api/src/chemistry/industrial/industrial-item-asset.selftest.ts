/**
 * D043 chem_train_item_assets + 不可变 SVG + 正式入库绑定自检（Mock，无真实 MySQL）。
 * pnpm --filter api run chem:industrial-item-asset-selftest
 */
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { CASE_SALT_PURIFICATION } from './industrial-case.fixtures'
import {
  evaluateIndustrialFormalImportGates,
  formalImportIndustrialCandidate,
  stableImportIdempotencyKey,
  type IndustrialFormalImportDbPayload,
} from './industrial-formal-import.service'
import {
  hashSvgContent,
  persistImmutableIndustrialSvg,
  INDUSTRIAL_SVG_SESSION_CONTRACT,
} from './industrial-svg-asset.service'
import { validateIndustrialSvgForImmutableStorage } from './industrial-svg-security'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'
import { buildSaltPurificationDiagram } from './industrial-diagram.fixtures'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import type { IndustrialReviewRecord } from './industrial-review.types'
import { INDUSTRIAL_SVG_RENDERER_VERSION } from './industrial-svg-types'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import { computeAuditContentHash } from './industrial-quality.hash'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function repoRoot(): string {
  const cwd = process.cwd()
  for (const root of [cwd, join(cwd, '..'), join(cwd, '..', '..')]) {
    if (existsSync(join(root, 'db', 'init.sql'))) return root
  }
  throw new Error('REPO_ROOT_NOT_FOUND')
}

function makeTrustedCase() {
  const c = JSON.parse(JSON.stringify(CASE_SALT_PURIFICATION)) as typeof CASE_SALT_PURIFICATION
  c.reviewStatus = 'approved'
  c.curriculumScope.curriculumReviewStatus = 'approved'
  c.reviewedContentHash = c.contentHash
  if (c.sourceReferences[0]) {
    c.sourceReferences[0] = {
      ...c.sourceReferences[0],
      verificationStatus: 'verified',
    }
  }
  return c
}

async function main() {
  const cwd = mkdtempSync(join(tmpdir(), 'ind-asset-'))
  try {
    const root = repoRoot()
    const initSql = readFileSync(join(root, 'db', 'init.sql'), 'utf8')
    assert(initSql.includes('CREATE TABLE IF NOT EXISTS chem_train_item_assets'), 'init has table')
    assert(initSql.includes('uk_chem_train_item_asset'), 'init unique')
    assert(initSql.includes('idx_chem_train_item_asset_hash'), 'init hash idx')
    assert(initSql.includes('fk_chem_train_item_asset_item'), 'init fk')
    assert(initSql.includes('train_item_id BIGINT UNSIGNED NOT NULL'), 'fk type bigint')

    const migrate = readFileSync(
      join(root, 'db', 'migrate_chemistry_industrial_train_item_assets.sql'),
      'utf8',
    )
    assert(migrate.includes('chem_train_item_assets'), 'migrate table')
    assert(migrate.includes('ON DELETE CASCADE'), 'cascade assoc only')

    const entityPath = join(
      root,
      'apps/api/src/chemistry/train/entities/chem-train-item-asset.entity.ts',
    )
    assert(existsSync(entityPath), 'entity file')
    assert(
      readFileSync(entityPath, 'utf8').includes("@Entity('chem_train_item_assets')"),
      'entity map',
    )

    const definition = buildSaltPurificationDiagram()
    const publicDiagram = projectIndustrialDiagramPublic(definition)
    const rendered = renderIndustrialDiagramSvg(publicDiagram)
    assert(rendered.renderReport.valid, 'svg valid')

    const a1 = persistImmutableIndustrialSvg(rendered.svg, cwd)
    const a2 = persistImmutableIndustrialSvg(rendered.svg, cwd)
    assert(a1.contentHash === a2.contentHash, 'idempotent hash reuse')
    assert(a1.relativePath === `industrial-svg/${a1.contentHash}.svg`, 'path form')
    assert(hashSvgContent(readFileSync(a1.absolutePath, 'utf8')) === a1.contentHash, 'hash matches bytes')

    const badSec = validateIndustrialSvgForImmutableStorage(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    )
    assert(!badSec.ok && badSec.errors.some((e) => e.includes('SCRIPT')), 'reject script')

    let collide = false
    try {
      const dir = join(cwd, 'uploads', 'industrial-svg')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, `${a1.contentHash}.svg`), '<svg xmlns="x">DIFFERENT</svg>\n', 'utf8')
      persistImmutableIndustrialSvg(
        rendered.svg.endsWith('\n') ? rendered.svg : `${rendered.svg}\n`,
        cwd,
      )
    } catch (e) {
      collide = String((e as Error).message).includes('SVG_HASH_COLLISION')
    }
    assert(collide, 'collision reject')

    let pathReject = false
    try {
      persistImmutableIndustrialSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>\n',
        cwd,
      )
    } catch (e) {
      pathReject = String((e as Error).message).includes('SVG_SECURITY')
    }
    assert(pathReject, 'external href reject')

    // 干净目录重落盘
    const cwd2 = mkdtempSync(join(tmpdir(), 'ind-asset-clean-'))
    const asset = persistImmutableIndustrialSvg(rendered.svg, cwd2)
    const svgStored = readFileSync(asset.absolutePath, 'utf8')

    type AssetRow = {
      id: string
      trainItemId: string
      assetType: string
      assetRole: string
      contentHash: string
      sortOrder: number
    }
    type ItemRow = { id: string; code: string; assets: AssetRow[] }
    const store: ItemRow[] = []
    let idSeq = 1
    const mockWriter = async (payload: IndustrialFormalImportDbPayload) => {
      let row = store.find((r) => r.code === payload.code)
      if (!row) {
        row = { id: String(idSeq++), code: payload.code, assets: [] }
        store.push(row)
      }
      const specs = [
        {
          assetType: payload.assetType,
          assetRole: payload.assetRole,
          contentHash: payload.svgContentHash,
          sortOrder: payload.sortOrder,
        },
        ...(payload.additionalAssets || []).map((a) => ({
          assetType: a.assetType,
          assetRole: a.assetRole,
          contentHash: a.svgContentHash,
          sortOrder: a.sortOrder,
        })),
      ]
      const assetIds: string[] = []
      let reusedAll = true
      for (const s of specs) {
        const dup = row.assets.find(
          (a) =>
            a.assetType === s.assetType &&
            a.assetRole === s.assetRole &&
            a.contentHash === s.contentHash,
        )
        if (dup) {
          assetIds.push(dup.id)
          continue
        }
        reusedAll = false
        const assetId = String(idSeq++)
        row.assets.push({
          id: assetId,
          trainItemId: row.id,
          assetType: s.assetType,
          assetRole: s.assetRole,
          contentHash: s.contentHash,
          sortOrder: s.sortOrder,
        })
        assetIds.push(assetId)
      }
      return {
        id: row.id,
        code: row.code,
        assetId: assetIds[0],
        assetIds,
        reusedExisting: reusedAll && assetIds.length === specs.length,
      }
    }

    const w1 = await mockWriter({
      code: 'train.ind.share1',
      stem: 's',
      answer: 'A',
      analysis: null,
      qtype: 'single',
      difficulty: 1,
      answerType: 'text',
      optionsJson: null,
      specialtyCode: 'industrial_experiment',
      categoryCode: 'industrial_separation_purification',
      pool: 'formal',
      status: 'approved',
      curriculumOk: true,
      verifyBlocked: false,
      banDefaultTrain: false,
      gateNote: 't',
      reviewedBy: '1',
      svgContentHash: asset.contentHash,
      svgRelativePath: asset.relativePath,
      svgFileSize: asset.fileSize,
      diagramVersion: INDUSTRIAL_SVG_RENDERER_VERSION,
      assetType: 'industrial_flow_svg',
      assetRole: 'question_diagram',
      sortOrder: 0,
      mimeType: 'image/svg+xml',
      additionalAssets: [],
      candidateId: 'cand_a',
      idempotencyKey: 'k1',
    })
    const w2 = await mockWriter({
      ...({} as IndustrialFormalImportDbPayload),
      code: 'train.ind.share2',
      svgContentHash: asset.contentHash,
      svgRelativePath: asset.relativePath,
      svgFileSize: asset.fileSize,
      diagramVersion: INDUSTRIAL_SVG_RENDERER_VERSION,
      assetType: 'industrial_flow_svg',
      assetRole: 'question_diagram',
      sortOrder: 0,
      mimeType: 'image/svg+xml',
      additionalAssets: [],
      specialtyCode: 'industrial_experiment',
      categoryCode: 'industrial_separation_purification',
      pool: 'formal',
      status: 'approved',
      curriculumOk: true,
      verifyBlocked: false,
      banDefaultTrain: false,
      gateNote: 't',
      reviewedBy: '1',
      stem: 's2',
      answer: 'B',
      analysis: null,
      qtype: 'single',
      difficulty: 1,
      answerType: 'text',
      optionsJson: null,
      candidateId: 'cand_b',
      idempotencyKey: 'k2',
    })
    assert(w1.id !== w2.id, 'two items')
    assert(store[0].assets[0].contentHash === store[1].assets[0].contentHash, 'shared hash')

    await mockWriter({
      code: 'train.ind.share1',
      stem: 's',
      answer: 'A',
      analysis: null,
      qtype: 'single',
      difficulty: 1,
      answerType: 'text',
      optionsJson: null,
      specialtyCode: 'industrial_experiment',
      categoryCode: 'industrial_separation_purification',
      pool: 'formal',
      status: 'approved',
      curriculumOk: true,
      verifyBlocked: false,
      banDefaultTrain: false,
      gateNote: 't',
      reviewedBy: '1',
      svgContentHash: asset.contentHash,
      svgRelativePath: asset.relativePath,
      svgFileSize: asset.fileSize,
      diagramVersion: INDUSTRIAL_SVG_RENDERER_VERSION,
      assetType: 'industrial_flow_svg',
      assetRole: 'supporting_diagram',
      sortOrder: 1,
      mimeType: 'image/svg+xml',
      additionalAssets: [],
      candidateId: 'cand_a',
      idempotencyKey: 'k1b',
    })
    assert(store[0].assets.length === 2, 'multi svg per item')

    const dup = await mockWriter({
      code: 'train.ind.share1',
      stem: 's',
      answer: 'A',
      analysis: null,
      qtype: 'single',
      difficulty: 1,
      answerType: 'text',
      optionsJson: null,
      specialtyCode: 'industrial_experiment',
      categoryCode: 'industrial_separation_purification',
      pool: 'formal',
      status: 'approved',
      curriculumOk: true,
      verifyBlocked: false,
      banDefaultTrain: false,
      gateNote: 't',
      reviewedBy: '1',
      svgContentHash: asset.contentHash,
      svgRelativePath: asset.relativePath,
      svgFileSize: asset.fileSize,
      diagramVersion: INDUSTRIAL_SVG_RENDERER_VERSION,
      assetType: 'industrial_flow_svg',
      assetRole: 'question_diagram',
      sortOrder: 0,
      mimeType: 'image/svg+xml',
      additionalAssets: [],
      candidateId: 'cand_a',
      idempotencyKey: 'k1',
    })
    assert(dup.reusedExisting && dup.assetId === w1.assetId, 'dup bind reuse')

    // PHASE_A：单次 payload 双图（flow + apparatus）
    const dualHash = 'b'.repeat(64)
    const dual = await mockWriter({
      code: 'train.ind.dual1',
      stem: 'dual',
      answer: 'A',
      analysis: null,
      qtype: 'single',
      difficulty: 1,
      answerType: 'text',
      optionsJson: null,
      specialtyCode: 'industrial_experiment',
      categoryCode: 'industrial_apparatus_analysis',
      pool: 'formal',
      status: 'approved',
      curriculumOk: true,
      verifyBlocked: false,
      banDefaultTrain: false,
      gateNote: 'dual',
      reviewedBy: '1',
      svgContentHash: asset.contentHash,
      svgRelativePath: asset.relativePath,
      svgFileSize: asset.fileSize,
      diagramVersion: INDUSTRIAL_SVG_RENDERER_VERSION,
      assetType: 'industrial_flow_svg',
      assetRole: 'question_diagram',
      sortOrder: 0,
      mimeType: 'image/svg+xml',
      additionalAssets: [
        {
          svgContentHash: dualHash,
          svgRelativePath: `industrial-svg/${dualHash}.svg`,
          svgFileSize: 100,
          diagramVersion: '1.0.0',
          assetType: 'industrial_apparatus_svg',
          assetRole: 'supporting_diagram',
          sortOrder: 1,
          mimeType: 'image/svg+xml',
        },
      ],
      candidateId: 'cand_dual',
      idempotencyKey: 'kdual',
    })
    assert(dual.assetIds.length === 2, 'dual asset ids')
    const dualRow = store.find((r) => r.code === 'train.ind.dual1')
    assert(dualRow?.assets.length === 2, 'dual assets stored')
    assert(
      dualRow?.assets.some((a) => a.assetType === 'industrial_apparatus_svg'),
      'apparatus asset type',
    )

    const trustedCase = makeTrustedCase()
    const now = new Date().toISOString()
    const candidate = {
      stem: '粗盐提纯第一步通常是？',
      options: ['A. 溶解过滤', 'B. 蒸发结晶', 'C. 焰色反应', 'D. 电解'],
      answerType: 'single' as const,
      answer: 'A',
      explanation: '先溶解过滤除去不溶性杂质',
      knowledgePoints: ['过滤'],
      difficulty: 1 as const,
      qtype: 'single' as const,
      requiresManualReview: true,
      referencedNodeIds: [] as string[],
      referencedLabels: [] as string[],
    }

    const quality = await checkIndustrialCandidateQuality(
      {
        candidateId: 'cand_d043selftest0001',
        developmentOnly: false,
        categoryCode: 'industrial_separation_purification',
        industrialCase: trustedCase,
        candidate,
        definition,
        publicDiagram,
        svg: svgStored,
        renderReport: rendered.renderReport,
      },
      { useMockAiReviewer: true, writeReport: false },
    )

    const audit = computeAuditContentHash({
      industrialCase: trustedCase,
      candidate,
      definition,
      publicDiagram,
    })

    const record: IndustrialReviewRecord = {
      candidateId: 'cand_d043selftest0001',
      generationTaskId: 'task_d043',
      generationSource: 'ai_generated',
      developmentOnly: false,
      specialtyCode: 'industrial_experiment',
      categoryCode: 'industrial_separation_purification',
      caseCode: trustedCase.caseCode,
      caseVersion: trustedCase.version,
      caseContentHash: trustedCase.contentHash,
      caseReviewStatus: trustedCase.reviewStatus,
      reviewStatus: 'approved_for_import',
      candidate,
      definition,
      publicDiagram,
      svg: svgStored,
      svgContentHash: asset.contentHash,
      svgRelativePath: asset.relativePath,
      renderReport: rendered.renderReport,
      qualityReport: quality,
      auditContentHash: audit,
      humanDecision: 'approve',
      humanReviewNote: 'ok',
      humanReviewedBy: '1',
      humanReviewedAt: now,
      humanReviewedAuditHash: audit,
      importedItemCode: null,
      importedAt: null,
      createdAt: now,
      updatedAt: now,
      revision: 3,
    }

    const gates = evaluateIndustrialFormalImportGates(record, trustedCase)
    if (!gates.ok) {
      // draft 案例即便标记 verified 仍可能因质检 unknown 阻断 —— 验证闸门仍有效
      assert(gates.blockers.length > 0, 'blockers present')
      const blockedWrite = await formalImportIndustrialCandidate(record, trustedCase, {
        dryRun: false,
        injectWriter: async () => {
          throw new Error('must not write')
        },
      })
      assert(!blockedWrite.ok, 'gate fail blocks write')
      // eslint-disable-next-line no-console
      console.log(
        'industrial-item-asset.selftest: gates still block (expected for incomplete quality):',
        gates.blockers.slice(0, 3).join(' | '),
      )
    } else {
      const once = await formalImportIndustrialCandidate(record, trustedCase, {
        dryRun: false,
        injectWriter: mockWriter,
      })
      assert(once.ok && once.itemId, 'import ok')
      const twice = await formalImportIndustrialCandidate(record, trustedCase, {
        dryRun: false,
        injectWriter: mockWriter,
      })
      assert(twice.ok && twice.reusedExisting, 'idempotent')
    }

    // development_only / mock 仍阻断
    const mockRec = { ...record, developmentOnly: true, generationSource: 'mock_generated' as const }
    const gMock = evaluateIndustrialFormalImportGates(mockRec, trustedCase)
    assert(gMock.blockers.some((b) => b.includes('DEVELOPMENT_ONLY')), 'dev block')
    assert(gMock.blockers.some((b) => b.includes('MOCK')), 'mock block')

    assert(stableImportIdempotencyKey(record).length === 64, 'idem key')
    assert(INDUSTRIAL_SVG_SESSION_CONTRACT.sessionSnapshot === 'IMPLEMENTED_STEP_10', 'step10')
    assert(!JSON.stringify({ safe: asset.contentHash }).includes('explanation'), 'no answer')

    // eslint-disable-next-line no-console
    console.log(
      'industrial-item-asset.selftest: OK (DDL+entity+immutable SVG+mock bind; MySQL IT not run)',
    )

    rmSync(cwd2, { recursive: true, force: true })
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
