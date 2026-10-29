/**
 * PHASE_E2-B 自检：审核工作流就绪；不冒充真实管理员通过；不写 formal DB。
 * pnpm --filter api run chem:industrial-phase-e2b-selftest
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { buildIndustrialAdminReviewPacket } from './industrial-admin-review-packet'
import {
  recordIndustrialCaseReview,
  loadIndustrialCaseReviewOverlay,
} from './industrial-case-review.store'
import { CASE_SALT_PURIFICATION } from './industrial-case.fixtures'
import {
  humanReviewIndustrialCandidate,
  recordIndustrialAdminChecklist,
  patchIndustrialReview,
} from './industrial-review.service'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { E2A_CANDIDATE_IDS, E2A_TARGET_BATCH } from './industrial-phase-e2a-revise'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

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

async function main() {
  const cwd = apiCwd()
  const root = repoRoot()

  // A. 真实 E1 候选材料包（只读）
  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)
    assert(!!rec, `missing ${id}`)
    assert(rec!.humanDecision === null, `${id} must not be auto-approved`)
    assert(rec!.reviewStatus === 'pending_human_review', `${id} pending`)
    assert(!(rec as any).importedItemCode, `${id} not imported`)
    const packet = buildIndustrialAdminReviewPacket(rec!)
    assert(packet.readyForHumanReview === true, `${id} ready HR`)
    assert(packet.readyForFormalImport === false, `${id} not formal`)
    assert(
      (packet.formalImportBlockers as string[]).length >= 1,
      `${id} has formal blockers`,
    )
    assert(
      (packet.quality as any).unknownChecks.length > 0,
      `${id} unknowns visible`,
    )
    assert(
      (packet.workflowFlags as any).HUMAN_REVIEW_NOT_EXECUTED === true,
      `${id} HUMAN_REVIEW_NOT_EXECUTED`,
    )
    assert(
      (packet.workflowFlags as any).REVIEW_WORKFLOW_READY === true,
      `${id} workflow ready`,
    )
  }

  // B. 临时副本：清单 / 退回 / 批准阻断 / 哈希失效（不污染生产候选）
  const tmp = join(cwd, 'var', `_e2b_selftest_${Date.now()}`)
  mkdirSync(join(tmp, 'var', 'industrial-review'), { recursive: true })
  mkdirSync(join(tmp, 'var', 'industrial-case-review'), { recursive: true })
  mkdirSync(join(tmp, 'uploads', 'industrial-svg'), { recursive: true })
  try {
    const srcId = E2A_CANDIDATE_IDS[0]
    const src = loadIndustrialReviewRecord(srcId, cwd)!
    const cloneId = `cand_e2btest${String(Date.now()).slice(-8)}`
    const clone = {
      ...JSON.parse(JSON.stringify(src)),
      candidateId: cloneId,
    }
    writeFileSync(
      join(tmp, 'var', 'industrial-review', `${cloneId}.json`),
      `${JSON.stringify(clone, null, 2)}\n`,
      'utf8',
    )
    // 复制 svg 以便 hash 校验路径存在（可选）
    const svgSrc = join(
      cwd,
      'uploads',
      'industrial-svg',
      `${src.svgContentHash}.svg`,
    )
    if (existsSync(svgSrc)) {
      writeFileSync(
        join(tmp, 'uploads', 'industrial-svg', `${src.svgContentHash}.svg`),
        readFileSync(svgSrc),
      )
    }

    const before = loadIndustrialReviewRecord(cloneId, tmp)!
    assert(before.qualityReport?.overallStatus === 'failed_automatic_checks', 'failed qc')

    // reject 允许在质检失败时执行
    const rejected = humanReviewIndustrialCandidate(
      cloneId,
      {
        decision: 'needs_revision',
        note: 'e2b selftest return',
        reviewerUserId: 'admin_selftest',
        expectedRevision: before.revision,
      },
      tmp,
    )
    assert(rejected.reviewStatus === 'needs_revision', 'needs_revision ok')
    assert(rejected.humanReviewedBy === 'admin_selftest', 'server sets reviewer')
    assert(!!rejected.humanReviewedAt, 'server sets time')

    // 重新拉回 pending：改题干会使质检清空；这里直接改状态测 approve 阻断需有 quality
    // 用另一克隆测 approve 阻断
    const cloneId2 = `cand_e2bapr${String(Date.now()).slice(-8)}`
    const clone2 = {
      ...JSON.parse(JSON.stringify(src)),
      candidateId: cloneId2,
      reviewStatus: 'pending_human_review',
      humanDecision: null,
      humanReviewedBy: null,
      humanReviewedAt: null,
      humanReviewedAuditHash: null,
    }
    writeFileSync(
      join(tmp, 'var', 'industrial-review', `${cloneId2}.json`),
      `${JSON.stringify(clone2, null, 2)}\n`,
      'utf8',
    )
    let blocked = false
    try {
      humanReviewIndustrialCandidate(
        cloneId2,
        {
          decision: 'approve',
          note: 'should block',
          reviewerUserId: 'admin_selftest',
          expectedRevision: clone2.revision,
        },
        tmp,
      )
    } catch (e) {
      blocked = String((e as Error).message).includes('APPROVE_FOR_IMPORT_BLOCKED')
    }
    assert(blocked, 'approve blocked by case/source gates')

    // 清单不升格
    const listed = recordIndustrialAdminChecklist(
      cloneId2,
      {
        expectedRevision: loadIndustrialReviewRecord(cloneId2, tmp)!.revision,
        reviewerUserId: 'admin_selftest',
        sourceOutcome: 'cannot_verify',
        caseOutcome: 'acknowledge_draft',
        kbPlanOk: false,
        kbPlanNote: 'plan only',
        unknownAcknowledgedCheckIds: ['CHEM_ENGINE_SCOPE'],
        note: 'checklist only',
      },
      tmp,
    )
    assert(listed.reviewStatus !== 'approved_for_import', 'checklist no import')
    assert((listed as any).adminChecklist?.elevatesToApprovedForImport === false, 'flag')
    assert((listed as any).adminChecklist?.kbLinksWritten === false, 'no kb write')

    // 案例覆盖层不升格
    const ov = recordIndustrialCaseReview({
      caseCode: CASE_SALT_PURIFICATION.caseCode,
      contentHashAtReview: CASE_SALT_PURIFICATION.contentHash,
      decision: 'acknowledge_draft',
      note: 'e2b overlay',
      sourceNotes: [
        {
          sourceTitle: CASE_SALT_PURIFICATION.sourceReferences[0].sourceTitle,
          outcome: 'cannot_verify',
          evidenceNote: 'no textbook page',
        },
      ],
      reviewedBy: 'admin_selftest',
      cwd: tmp,
    })
    assert(ov.elevatesToPublished === false, 'case not published')
    const loaded = loadIndustrialCaseReviewOverlay(
      CASE_SALT_PURIFICATION.caseCode,
      tmp,
    )
    assert(!!loaded, 'overlay persisted')
    assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'fixture still draft')

    // 内容变更使人审失效
    const patched = await patchIndustrialReview(
      cloneId2,
      {
        expectedRevision: listed.revision,
        stem: `${listed.candidate.stem}（e2b patch）`,
      },
      tmp,
    )
    assert(patched.humanDecision === null, 'human cleared on patch')
    assert(patched.qualityReport === null, 'quality cleared on patch')
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }

  // C. PHASE_D 未改
  const phaseD = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'acceptance_batches',
    'industrial_acceptance_20261029_121220',
    'summary.json',
  )
  if (existsSync(phaseD)) {
    const j = JSON.parse(readFileSync(phaseD, 'utf8')) as { batchId?: string }
    assert(j.batchId === 'industrial_acceptance_20261029_121220', 'phase D intact')
  }

  // D. 生产候选仍未人审通过
  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.reviewStatus === 'pending_human_review', `${id} still pending`)
    assert(rec.humanDecision === null, `${id} no decision`)
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        batchId: E2A_TARGET_BATCH,
        REVIEW_WORKFLOW_READY: true,
        HUMAN_REVIEW_NOT_EXECUTED: true,
        formalImport: 'NOT_EXECUTED',
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
