/**
 * POST_STEP_13 PHASE_D：受控工业实验验收候选准备（文件级审核仓）。
 * pnpm --filter api run chem:industrial-phase-d-prepare
 *
 * - 不写 chem_train_items / formal / test pool
 * - 不写 chem_train_item_links
 * - 不创建会话 / 错题
 * - 不伪造人审通过
 * - SVG 经程序渲染后不可变落盘
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  CASE_SALT_PURIFICATION,
  CASE_SEAWATER_BASIC,
  CASE_METAL_RECOVERY,
} from './industrial-case.fixtures'
import type { IndustrialCase } from './industrial-case.types'
import {
  buildSaltPurificationDiagram,
  buildSeawaterDiagram,
  buildMetalRecoveryDiagram,
} from './industrial-diagram.fixtures'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'
import {
  APP_FILTER,
  APP_GAS_PURIFY_COLLECT,
} from './industrial-apparatus.fixtures'
import { projectIndustrialApparatusPublic } from './industrial-apparatus.project'
import { renderIndustrialApparatusSvg } from './industrial-apparatus-svg-renderer'
import { checkIndustrialApparatusSafety } from './industrial-apparatus-safety'
import { createIndustrialReviewRecord } from './industrial-review.service'
import { persistImmutableIndustrialSvg } from './industrial-svg-asset.service'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import { computeAuditContentHash } from './industrial-quality.hash'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'
import type { IndustrialAiCandidateQuestion } from './industrial-ai-generator.types'
import type { IndustrialDiagramDefinition } from './industrial-diagram.types'
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'
import { INDUSTRIAL_DIAGRAM_SCHEMA_VERSION } from './industrial-diagram.constants'
import { computeDiagramContentHash } from './industrial-diagram.hash'
import {
  loadIndustrialReviewRecord,
  saveIndustrialReviewRecord,
} from './industrial-review.store'

function repoRoot(): string {
  const cwd = process.cwd()
  for (const r of [cwd, join(cwd, '..'), join(cwd, '..', '..')]) {
    if (existsSync(join(r, 'db', 'init.sql'))) return r
  }
  return cwd
}

function apiCwd(): string {
  const root = repoRoot()
  const api = join(root, 'apps', 'api')
  return existsSync(api) ? api : process.cwd()
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function minimalFlowStub(caseCode: string): IndustrialDiagramDefinition {
  const draft = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: `flow_stub_${caseCode}`.slice(0, 48),
    caseCode,
    caseVersion: '1.0.0',
    caseContentHash: '0'.repeat(64),
    diagramVersion: '1.0.0',
    title: '流程占位（装置主图）',
    orientation: 'left_to_right' as const,
    nodes: [
      {
        id: 'n1',
        type: 'process' as const,
        displayLabel: '装置示意',
        displayRole: 'process' as const,
        internal: {},
      },
    ],
    edges: [],
    internalReferences: {
      caseCode,
      caseVersion: '1.0.0',
      caseContentHash: '0'.repeat(64),
    },
    reviewMetadata: { chemicallyReviewed: false, structureOnly: true },
  }
  return { ...draft, diagramContentHash: computeDiagramContentHash(draft) }
}

type Spec = {
  seq: number
  title: string
  difficulty: 1 | 2 | 3
  qtype: 'single' | 'judge' | 'blank'
  categoryCode: string
  industrialCase: IndustrialCase
  definition: IndustrialDiagramDefinition
  apparatus: IndustrialApparatusDefinition | null
  stem: string
  options: string[] | null
  answer: string
  explanation: string
  knowledgePoints: string[]
  diagramKinds: Array<'flow' | 'apparatus'>
}

async function main() {
  const cwd = apiCwd()
  const root = repoRoot()
  const now = new Date()
  const batchId = `industrial_acceptance_${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
  // code 规划（≤64）：iaacc_YYYYMMDD_HHMMSS_n
  const codePrefix = `iaacc_${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`

  const specs: Spec[] = [
    {
      seq: 1,
      title: '粗盐提纯流程识读',
      difficulty: 1,
      qtype: 'single',
      categoryCode: 'flow_diagram_read',
      industrialCase: CASE_SALT_PURIFICATION,
      definition: buildSaltPurificationDiagram(),
      apparatus: null,
      stem:
        '【验收A·基础】粗盐提纯教学流程图中，除去不溶性泥沙杂质的关键操作通常是？\n（acceptance_test_only；案例仍为 draft，不得当作已发布科学审核）',
      options: ['过滤', '蒸发结晶', '电解', '焰色反应'],
      answer: '过滤',
      explanation:
        '过滤用于固液分离除去不溶性杂质；蒸发结晶得到晶体。本流程不能除去可溶性杂质盐。',
      knowledgePoints: ['过滤', '溶解', '蒸发'],
      diagramKinds: ['flow'],
    },
    {
      seq: 2,
      title: '气体净化装置识读',
      difficulty: 1,
      qtype: 'single',
      categoryCode: 'industrial_apparatus_analysis',
      industrialCase: CASE_SALT_PURIFICATION,
      definition: minimalFlowStub(CASE_SALT_PURIFICATION.caseCode),
      apparatus: APP_GAS_PURIFY_COLLECT,
      stem:
        '【验收B·基础】教学装置示意图中，气体经过洗气瓶后再收集。下列说法更合理的是？\n（acceptance_test_only；示意图非工程施工图）',
      options: [
        '洗气与收集顺序应符合气体流向示意',
        '可任意颠倒连接且不影响气体路径',
        '装置比例必须等同工业现场',
        '可忽略导管是否插入液面',
      ],
      answer: '洗气与收集顺序应符合气体流向示意',
      explanation:
        '教学装置图强调流向与连接合理性；本图为 schematic，禁止当作工程施工依据。',
      knowledgePoints: ['气体净化', '洗气', '收集'],
      diagramKinds: ['apparatus', 'flow'],
    },
    {
      seq: 3,
      title: '提纯流程+过滤装置综合',
      difficulty: 2,
      qtype: 'single',
      categoryCode: 'industrial_separation_purification',
      industrialCase: CASE_SALT_PURIFICATION,
      definition: buildSaltPurificationDiagram(),
      apparatus: APP_FILTER,
      stem:
        '【验收C·提高】同时给出流程与过滤装置示意时，过滤操作主要目的是？\n（acceptance_test_only；双图）',
      options: [
        '除去不溶性杂质，实现固液分离',
        '除去所有可溶性杂质离子',
        '直接得到金属单质',
        '完成电解精炼',
      ],
      answer: '除去不溶性杂质，实现固液分离',
      explanation:
        '过滤针对不溶固体；可溶性杂质需另选化学除杂（本教学案例未覆盖）。双图：流程+装置。',
      knowledgePoints: ['过滤', '固液分离', '粗盐提纯'],
      diagramKinds: ['flow', 'apparatus'],
    },
    {
      seq: 4,
      title: '海水资源流程综合',
      difficulty: 3,
      qtype: 'blank',
      categoryCode: 'industrial_production_cases',
      industrialCase: CASE_SEAWATER_BASIC,
      definition: buildSeawaterDiagram(),
      apparatus: null,
      stem:
        '【验收D·挑战】阅读海水资源利用教学流程图，写出图中用于「固液分离」的核心单元操作名称（填空，acceptance_test_only）。',
      options: null,
      answer: '过滤',
      explanation:
        '教学流程中固液分离常用过滤；答案以图示与课程基础操作为准。案例 draft，需人工复核科学表述。',
      knowledgePoints: ['过滤', '海水资源', '分离'],
      diagramKinds: ['flow'],
    },
  ]

  // 确保 metal fixture 可被引用（挑战题备用校验）
  void CASE_METAL_RECOVERY
  void buildMetalRecoveryDiagram

  const batchDir = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'acceptance_batches',
    batchId,
  )
  mkdirSync(batchDir, { recursive: true })

  const items: Record<string, unknown>[] = []

  for (const spec of specs) {
    const plannedCode = `${codePrefix}_${pad2(spec.seq)}`
    if (plannedCode.length > 64) {
      throw new Error(`PLANNED_CODE_TOO_LONG: ${plannedCode.length}`)
    }

    const flowPub = projectIndustrialDiagramPublic(spec.definition)
    const flowRendered = renderIndustrialDiagramSvg(flowPub)

    const candidate: IndustrialAiCandidateQuestion = {
      qtype: spec.qtype,
      answerType: spec.qtype,
      stem: spec.stem,
      options: spec.options,
      answer: spec.answer,
      explanation: spec.explanation,
      knowledgePoints: spec.knowledgePoints,
      difficulty: spec.difficulty,
      requiresManualReview: true,
      referencedNodeIds: spec.definition.nodes
        .filter((n) => n.type === 'unknown')
        .map((n) => n.id),
      referencedLabels: spec.definition.nodes.map((n) => n.displayLabel).slice(0, 8),
    }

    let apparatusSvg: string | null = null
    let apparatusHash: string | null = null
    let apparatusRel: string | null = null
    let apparatusDef: IndustrialApparatusDefinition | null = null
    let apparatusPub = null
    let apparatusSafety = null

    if (spec.apparatus) {
      apparatusDef = spec.apparatus
      apparatusPub = projectIndustrialApparatusPublic(spec.apparatus)
      const ar = renderIndustrialApparatusSvg(apparatusPub)
      apparatusSvg = ar.svg
      const persisted = persistImmutableIndustrialSvg(ar.svg, cwd)
      apparatusHash = persisted.contentHash
      apparatusRel = persisted.relativePath
      apparatusSafety = checkIndustrialApparatusSafety(spec.apparatus)
    }

    const record = createIndustrialReviewRecord(
      {
        generationTaskId: `${batchId}_${pad2(spec.seq)}`,
        generationSource: 'mock_generated',
        developmentOnly: true,
        specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
        categoryCode: spec.categoryCode,
        industrialCase: spec.industrialCase,
        candidate,
        definition: spec.definition,
        publicDiagram: flowPub,
        svg: flowRendered.svg,
        renderReport: flowRendered.renderReport,
        qualityReport: null,
      },
      cwd,
    )

    const quality = await checkIndustrialCandidateQuality(
      {
        candidateId: record.candidateId,
        developmentOnly: true,
        categoryCode: spec.categoryCode,
        industrialCase: spec.industrialCase,
        candidate,
        definition: spec.definition,
        publicDiagram: flowPub,
        svg: record.svg,
        renderReport: flowRendered.renderReport,
        apparatusDefinition: apparatusDef || undefined,
      },
      { useMockAiReviewer: true, writeReport: false, enableAiReview: true },
    )

    const full = loadIndustrialReviewRecord(record.candidateId, cwd)!
    full.qualityReport = quality
    full.reviewStatus = 'pending_human_review'
    full.humanDecision = null
    full.humanReviewedBy = null
    full.humanReviewedAt = null
    full.humanReviewedAuditHash = null
    full.importedItemCode = null
    full.importedAt = null
    ;(full as Record<string, unknown>).acceptanceBatchId = batchId
    ;(full as Record<string, unknown>).acceptanceTestOnly = true
    ;(full as Record<string, unknown>).plannedItemCode = plannedCode
    ;(full as Record<string, unknown>).formalImportBlocked = true
    ;(full as Record<string, unknown>).diagramKinds = spec.diagramKinds

    if (apparatusDef && apparatusSvg && apparatusHash && apparatusRel) {
      full.apparatusDefinition = apparatusDef
      full.apparatusPublic = apparatusPub
      full.apparatusSvg = apparatusSvg.endsWith('\n') ? apparatusSvg : `${apparatusSvg}\n`
      full.apparatusSvgContentHash = apparatusHash
      full.apparatusSvgRelativePath = apparatusRel
      full.apparatusSafety = apparatusSafety
    }

    full.auditContentHash = computeAuditContentHash({
      industrialCase: spec.industrialCase,
      candidate,
      definition: spec.definition,
      publicDiagram: flowPub,
      apparatusContentHash: apparatusDef?.apparatusContentHash || null,
      apparatusPublicContentHash: apparatusPub?.publicContentHash || null,
    })
    full.updatedAt = new Date().toISOString()
    saveIndustrialReviewRecord(full, cwd)

    // 批次目录副本（不含完整超大冗余时可仍写精简元数据 + SVG 副本路径引用）
    const itemMeta = {
      batchId,
      seq: spec.seq,
      candidateId: full.candidateId,
      plannedItemCode: plannedCode,
      title: spec.title,
      qtype: spec.qtype,
      difficulty: spec.difficulty,
      categoryCode: spec.categoryCode,
      caseCode: spec.industrialCase.caseCode,
      caseReviewStatus: spec.industrialCase.reviewStatus,
      generationSource: full.generationSource,
      developmentOnly: full.developmentOnly,
      formalImportBlocked: true,
      reviewStatus: full.reviewStatus,
      humanDecision: full.humanDecision,
      qualityOverall: quality.overallStatus,
      qualityBlocking: quality.blockingIssues.length,
      qualityUnknown: quality.unknownIssues.length,
      requiresHumanReview: quality.requiresHumanReview,
      formalPublishEligible: quality.formalPublishEligible,
      flowSvgContentHash: full.svgContentHash,
      flowSvgRelativePath: full.svgRelativePath,
      apparatusSvgContentHash: apparatusHash,
      apparatusSvgRelativePath: apparatusRel,
      diagramKinds: spec.diagramKinds,
      dbTrainItemId: 'NOT_CREATED',
      dbAssetIds: 'NOT_CREATED',
      dbKbLinkIds: 'NOT_BOUND',
      pool: 'NOT_WRITTEN',
      createdAt: full.createdAt,
    }
    writeFileSync(
      join(batchDir, `${pad2(spec.seq)}_${full.candidateId}.meta.json`),
      `${JSON.stringify(itemMeta, null, 2)}\n`,
      'utf8',
    )
    writeFileSync(
      join(batchDir, `${pad2(spec.seq)}_flow.svg`),
      full.svg,
      'utf8',
    )
    if (apparatusSvg) {
      writeFileSync(join(batchDir, `${pad2(spec.seq)}_apparatus.svg`), apparatusSvg.endsWith('\n') ? apparatusSvg : `${apparatusSvg}\n`, 'utf8')
    }
    items.push(itemMeta)
  }

  const summary = {
    batchId,
    createdAt: now.toISOString(),
    apiCwd: cwd,
    reviewStoreDir: join(cwd, 'var', 'industrial-review'),
    batchDir,
    candidateCount: items.length,
    dbWrites: {
      chem_train_items: 'NOT_CREATED',
      chem_train_item_assets: 'NOT_CREATED',
      chem_train_item_links: 'NOT_BOUND',
      chem_train_sessions: 'NOT_CREATED',
      note: 'PHASE_D 仅文件级审核仓 + 不可变 SVG 落盘；正式 KB link 留 PHASE_E',
    },
    items,
    kbBindingPlan: [
      {
        plannedForSeq: 1,
        entityType: 'experiment',
        entityId: '20',
        entityName: '过滤操作',
        statusRequired: 'published',
        rationale: '粗盐提纯流程识读核心操作',
        bindWhen: 'formal_import_completed',
        currentLink: 'NOT_BOUND',
      },
      {
        plannedForSeq: 1,
        entityType: 'experiment',
        entityId: '19',
        entityName: '溶解与搅拌',
        statusRequired: 'published',
        rationale: '提纯前置溶解步骤',
        bindWhen: 'formal_import_completed',
        currentLink: 'NOT_BOUND',
      },
      {
        plannedForSeq: 2,
        entityType: 'knowledge',
        entityId: '61',
        entityName: '气体的洗涤与干燥',
        statusRequired: 'published',
        rationale: '气体净化装置题知识点',
        bindWhen: 'formal_import_completed',
        currentLink: 'NOT_BOUND',
      },
      {
        plannedForSeq: 3,
        entityType: 'experiment',
        entityId: '20',
        entityName: '过滤操作',
        statusRequired: 'published',
        rationale: '双图过滤综合',
        bindWhen: 'formal_import_completed',
        currentLink: 'NOT_BOUND',
      },
      {
        plannedForSeq: 3,
        entityType: 'concept',
        entityId: '2',
        entityName: '物质的分类',
        statusRequired: 'published',
        rationale: '固液分离与混合物认识（需人审确认相关性）',
        bindWhen: 'formal_import_completed_after_human_confirm',
        currentLink: 'NOT_BOUND',
      },
      {
        plannedForSeq: 4,
        entityType: 'experiment',
        entityId: '20',
        entityName: '过滤操作',
        statusRequired: 'published',
        rationale: '海水流程固液分离单元',
        bindWhen: 'formal_import_completed',
        currentLink: 'NOT_BOUND',
      },
    ],
  }
  writeFileSync(join(batchDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  writeFileSync(
    join(cwd, 'var', 'industrial-review', `_phase_d_latest_batch.json`),
    `${JSON.stringify({ batchId, batchDir, createdAt: now.toISOString(), itemCount: items.length }, null, 2)}\n`,
    'utf8',
  )

  console.log(JSON.stringify({ ok: true, batchId, count: items.length, batchDir }, null, 2))
  console.log('chem:industrial-phase-d-prepare: DONE (file-level candidates only; no DB items)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
