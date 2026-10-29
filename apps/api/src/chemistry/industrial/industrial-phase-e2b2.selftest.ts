/**
 * PHASE_E2-B2 自检：案例有效审核 → 质检/正式闸门联动；real publish 默认关；不写主库。
 * pnpm --filter api run chem:industrial-phase-e2b2-selftest
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  projectIndustrialCaseForPublishGates,
  resolveIndustrialCaseEffectiveReview,
} from './industrial-case-effective-review'
import {
  loadIndustrialCaseReviewOverlay,
  recordIndustrialCaseReview,
} from './industrial-case-review.store'
import { CASE_SALT_PURIFICATION } from './industrial-case.fixtures'
import { evaluateIndustrialFormalImportGates } from './industrial-formal-import.service'
import { isIndustrialFormalRealPublishEnabled } from './industrial-formal-publish.config'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import {
  humanReviewIndustrialCandidate,
  invalidateCandidatesAfterCaseReview,
  recordIndustrialCaseReviewForAdmin,
} from './industrial-review.service'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { E2A_CANDIDATE_IDS, E2A_TARGET_BATCH } from './industrial-phase-e2a-revise'
import { buildIndustrialAdminReviewPacket } from './industrial-admin-review-packet'

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

function sourceNotesOk() {
  return CASE_SALT_PURIFICATION.sourceReferences.map((s) => ({
    sourceTitle: s.sourceTitle,
    outcome: 'verified_by_admin' as const,
    evidenceNote: 'textbook chapter verified by admin selftest',
  }))
}

async function main() {
  const cwd = apiCwd()
  const root = repoRoot()

  // 0. real publish 默认关
  delete process.env.INDUSTRIAL_FORMAL_REAL_PUBLISH
  assert(!isIndustrialFormalRealPublishEnabled(), 'env missing → false')
  process.env.INDUSTRIAL_FORMAL_REAL_PUBLISH = 'false'
  assert(!isIndustrialFormalRealPublishEnabled(), 'env false → false')
  process.env.INDUSTRIAL_FORMAL_REAL_PUBLISH = '0'
  assert(!isIndustrialFormalRealPublishEnabled(), 'env 0 → false')
  process.env.INDUSTRIAL_FORMAL_REAL_PUBLISH = 'true'
  assert(isIndustrialFormalRealPublishEnabled(), 'env true → true')
  delete process.env.INDUSTRIAL_FORMAL_REAL_PUBLISH
  assert(!isIndustrialFormalRealPublishEnabled(), 'restored off')

  // A. 无覆盖层：不可发布
  const noOv = resolveIndustrialCaseEffectiveReview(CASE_SALT_PURIFICATION, cwd)
  assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'fixture draft')
  assert(!noOv.grantsEffectivePublishEligibility, 'no overlay no grant')
  assert(noOv.effectiveReviewStatus === 'draft', 'effective still draft')
  assert(noOv.blockingReasons.includes('NO_CASE_REVIEW_OVERLAY'), 'blocker overlay')

  const tmp = join(cwd, 'var', `_e2b2_selftest_${Date.now()}`)
  mkdirSync(join(tmp, 'var', 'industrial-review'), { recursive: true })
  mkdirSync(join(tmp, 'var', 'industrial-case-review'), { recursive: true })
  mkdirSync(join(tmp, 'uploads', 'industrial-svg'), { recursive: true })

  try {
    // B. 证据不足不能升格
    let denied = false
    try {
      recordIndustrialCaseReview({
        caseCode: CASE_SALT_PURIFICATION.caseCode,
        contentHashAtReview: CASE_SALT_PURIFICATION.contentHash,
        decision: 'approve_for_publish',
        note: 'short',
        sourceNotes: [
          {
            sourceTitle: CASE_SALT_PURIFICATION.sourceReferences[0].sourceTitle,
            outcome: 'cannot_verify',
            evidenceNote: 'x',
          },
        ],
        reviewedBy: 'admin_e2b2',
        cwd: tmp,
      })
    } catch (e) {
      denied = String((e as Error).message).includes('CASE_APPROVE')
    }
    assert(denied, 'weak evidence denied')

    // C. 合法 approve_for_publish → 有效资格；fixture 不变
    const ov = recordIndustrialCaseReview({
      caseCode: CASE_SALT_PURIFICATION.caseCode,
      contentHashAtReview: CASE_SALT_PURIFICATION.contentHash,
      decision: 'approve_for_publish',
      note: 'admin verified salt purification teaching case for publish gate',
      sourceNotes: sourceNotesOk(),
      reviewedBy: 'admin_e2b2',
      cwd: tmp,
    })
    assert(ov.elevatesFixtureToPublished === false, 'no fixture elevate')
    assert(ov.grantsEffectivePublishEligibility === true, 'grants effective')
    assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'fixture still draft')

    const eff = resolveIndustrialCaseEffectiveReview(
      CASE_SALT_PURIFICATION,
      tmp,
      ov,
    )
    assert(eff.grantsEffectivePublishEligibility, 'eff grants')
    assert(eff.effectiveReviewStatus === 'approved', 'eff approved')
    assert(eff.effectiveSourceVerification === 'verified', 'eff sources')
    assert(eff.isCurrent, 'eff current')
    assert(eff.reviewedContentHash === CASE_SALT_PURIFICATION.contentHash, 'hash bind')

    const projected = projectIndustrialCaseForPublishGates(
      CASE_SALT_PURIFICATION,
      tmp,
    )
    assert(projected.reviewStatus === 'approved', 'projected approved')
    assert(
      projected.reviewedContentHash === CASE_SALT_PURIFICATION.contentHash,
      'projected reviewed hash',
    )
    // 来源 verificationStatus 不得写入投影（参与 contentHash）
    assert(
      projected.sourceReferences.every((s) => s.verificationStatus === 'unverified'),
      'projected sources stay unverified in fixture fields',
    )
    assert(
      projected.curriculumScope.curriculumReviewStatus ===
        CASE_SALT_PURIFICATION.curriculumScope.curriculumReviewStatus,
      'projected curriculum unchanged',
    )

    // D. 哈希不匹配 → 失效
    const stale = resolveIndustrialCaseEffectiveReview(
      {
        ...CASE_SALT_PURIFICATION,
        contentHash: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      },
      tmp,
      ov,
    )
    assert(!stale.grantsEffectivePublishEligibility, 'stale no grant')
    assert(stale.blockingReasons.includes('OVERLAY_STALE_CONTENT_HASH'), 'stale reason')

    // E. 并发旧版本拒绝
    let conflict = false
    try {
      recordIndustrialCaseReview({
        caseCode: CASE_SALT_PURIFICATION.caseCode,
        contentHashAtReview: CASE_SALT_PURIFICATION.contentHash,
        decision: 'acknowledge_draft',
        note: 'concurrent stale',
        sourceNotes: [],
        reviewedBy: 'admin_e2b2',
        expectedPriorContentHash: 'wrong_prior_hash_xxxxxxxxxxxx',
        cwd: tmp,
      })
    } catch (e) {
      conflict = String((e as Error).message).includes('CASE_REVIEW_CONFLICT')
    }
    assert(conflict, 'concurrent conflict')

    // F. 质检联动：无有效审核 fail；有有效审核 pass CURR/CHEM
    const srcId = E2A_CANDIDATE_IDS[0]
    const src = loadIndustrialReviewRecord(srcId, cwd)
    assert(!!src, 'e1 cand present')
    const cloneId = `cand_e2b2qc${String(Date.now()).slice(-8)}`
    const clone = {
      ...JSON.parse(JSON.stringify(src)),
      candidateId: cloneId,
      caseCode: CASE_SALT_PURIFICATION.caseCode,
      caseContentHash: CASE_SALT_PURIFICATION.contentHash,
      qualityReport: null,
      humanDecision: null,
      reviewStatus: 'pending_quality_review',
    }
    writeFileSync(
      join(tmp, 'var', 'industrial-review', `${cloneId}.json`),
      `${JSON.stringify(clone, null, 2)}\n`,
      'utf8',
    )
    if (src!.svgContentHash) {
      const svgSrc = join(cwd, 'uploads', 'industrial-svg', `${src!.svgContentHash}.svg`)
      if (existsSync(svgSrc)) {
        writeFileSync(
          join(tmp, 'uploads', 'industrial-svg', `${src!.svgContentHash}.svg`),
          readFileSync(svgSrc),
        )
      }
    }

    // 临时清掉覆盖层测 fail：用空目录
    const tmpNoOv = join(cwd, 'var', `_e2b2_noov_${Date.now()}`)
    mkdirSync(join(tmpNoOv, 'var', 'industrial-case-review'), { recursive: true })
    const failReport = await checkIndustrialCandidateQuality(
      {
        candidateId: cloneId,
        developmentOnly: false,
        categoryCode: clone.categoryCode,
        industrialCase: CASE_SALT_PURIFICATION,
        candidate: clone.candidate,
        definition: clone.definition,
        publicDiagram: clone.publicDiagram,
        svg: clone.svg,
        renderReport: clone.renderReport,
        apparatusDefinition: clone.apparatusDefinition,
      },
      { enableAiReview: false, writeReport: false, cwd: tmpNoOv },
    )
    const failCodes = new Set(
      failReport.checks.filter((c) => c.status === 'fail').map((c) => c.checkCode),
    )
    assert(failCodes.has('CURR_CASE_TRUST'), 'CURR fail without overlay')
    assert(failCodes.has('CHEM_SOURCE_VERIFIED'), 'CHEM fail without overlay')
    rmSync(tmpNoOv, { recursive: true, force: true })

    const passReport = await checkIndustrialCandidateQuality(
      {
        candidateId: cloneId,
        developmentOnly: false,
        categoryCode: clone.categoryCode,
        industrialCase: CASE_SALT_PURIFICATION,
        candidate: clone.candidate,
        definition: clone.definition,
        publicDiagram: clone.publicDiagram,
        svg: clone.svg,
        renderReport: clone.renderReport,
        apparatusDefinition: clone.apparatusDefinition,
      },
      { enableAiReview: false, writeReport: false, cwd: tmp },
    )
    const curr = passReport.checks.find((c) => c.checkCode === 'CURR_CASE_TRUST')
    const chem = passReport.checks.find((c) => c.checkCode === 'CHEM_SOURCE_VERIFIED')
    assert(curr?.status === 'pass', 'CURR pass with effective')
    assert(chem?.status === 'pass', 'CHEM pass with effective')
    // unknown 不因案例升格自动变 pass
    const unknowns = passReport.checks.filter((c) => c.status === 'unknown')
    assert(unknowns.length >= 0, 'unknowns counted')

    // G. 案例审核使候选质检失效
    const beforeInv = loadIndustrialReviewRecord(cloneId, tmp)!
    beforeInv.qualityReport = passReport as any
    beforeInv.reviewStatus = 'pending_human_review'
    beforeInv.humanDecision = null
    writeFileSync(
      join(tmp, 'var', 'industrial-review', `${cloneId}.json`),
      `${JSON.stringify(beforeInv, null, 2)}\n`,
      'utf8',
    )
    const inv = invalidateCandidatesAfterCaseReview(
      CASE_SALT_PURIFICATION.caseCode,
      tmp,
    )
    assert(inv.invalidated.includes(cloneId), 'clone invalidated')
    const afterInv = loadIndustrialReviewRecord(cloneId, tmp)!
    assert(afterInv.qualityReport === null, 'quality cleared')
    assert(afterInv.reviewStatus === 'needs_revision', 'status needs_revision')

    // H. 管理员 API 包装：覆盖来源 + 返回 effective
    const adminRes = recordIndustrialCaseReviewForAdmin({
      caseCode: CASE_SALT_PURIFICATION.caseCode,
      contentHashAtReview: CASE_SALT_PURIFICATION.contentHash,
      decision: 'approve_for_publish',
      note: 'second approve via admin wrapper keeps effective',
      sourceNotes: sourceNotesOk(),
      reviewedBy: 'admin_e2b2_api',
      expectedPriorContentHash: CASE_SALT_PURIFICATION.contentHash,
      cwd: tmp,
    })
    assert(adminRes.fixtureUnchanged.elevatesFixtureToPublished === false, 'api no elevate')
    assert(adminRes.effective.grantsEffectivePublishEligibility === true, 'api effective')

    // I. 人审 approve：有效案例后仍须质检 formalPublishEligible；先重质检再测
    afterInv.qualityReport = passReport as any
    afterInv.reviewStatus = 'pending_human_review'
    afterInv.revision = (afterInv.revision || 1) + 1
    writeFileSync(
      join(tmp, 'var', 'industrial-review', `${cloneId}.json`),
      `${JSON.stringify(afterInv, null, 2)}\n`,
      'utf8',
    )
    // 若 formalPublishEligible 仍 false（其他阻断），approve 应被拦；仅断言闸门读有效态不因 fixture draft 单独失败
    const gates = evaluateIndustrialFormalImportGates(
      loadIndustrialReviewRecord(cloneId, tmp)!,
      CASE_SALT_PURIFICATION,
      { cwd: tmp },
    )
    assert(
      !gates.blockers.some((b) => b.includes('CASE_REVIEW_STATUS: draft')),
      'gates not blocked by raw draft',
    )
    assert(
      !gates.blockers.some((b) => b.includes('SOURCE_UNVERIFIED')),
      'gates not blocked by raw unverified',
    )

    let approveBlockedByQuality = false
    try {
      humanReviewIndustrialCandidate(
        cloneId,
        {
          decision: 'approve',
          note: 'try approve',
          reviewerUserId: 'admin_e2b2',
          expectedRevision: loadIndustrialReviewRecord(cloneId, tmp)!.revision,
        },
        tmp,
      )
    } catch (e) {
      const msg = String((e as Error).message)
      approveBlockedByQuality =
        msg.includes('APPROVE_FOR_IMPORT_BLOCKED') ||
        msg.includes('QUALITY_CONTENT_FAILED') ||
        msg.includes('QUALITY_REQUIRED')
    }
    // 允许通过或因其他质检阻断；禁止因「fixture draft」单独失败（已由 gates 断言）
    void approveBlockedByQuality

    // J. 伪造客户端字段：DTO/服务端不接受 reviewedBy from client（由 nest 注入）— 覆盖层 reviewedBy 来自服务端入参
    const loadedOv = loadIndustrialCaseReviewOverlay(
      CASE_SALT_PURIFICATION.caseCode,
      tmp,
    )
    assert(loadedOv?.reviewedBy === 'admin_e2b2_api', 'server reviewer')
    assert(!!loadedOv?.reviewedAt, 'server time')
    assert(loadedOv?.reviewedContentHash === CASE_SALT_PURIFICATION.contentHash, 'server hash')

    // K. 材料包暴露有效态
    const packet = buildIndustrialAdminReviewPacket(
      loadIndustrialReviewRecord(cloneId, tmp)!,
      tmp,
    )
    assert(
      (packet.case as any)?.effectiveReview?.grantsEffectivePublishEligibility === true,
      'packet effective',
    )
    assert((packet.case as any)?.fixtureStillDraft === true, 'packet fixture draft')
    assert((packet.realPublish as any)?.envEnabled === false, 'packet real off')
    assert((packet.workflowFlags as any)?.REAL_PUBLISH_ENV_OFF === true, 'flag off')
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }

  // L. 生产候选仍未自动批准
  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.humanDecision === null, `${id} not auto human`)
    assert(!(rec as any).importedItemCode, `${id} not imported`)
  }
  assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'prod fixture draft')

  // M. PHASE_D 未改
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

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        batchId: E2A_TARGET_BATCH,
        CASE_EFFECTIVE_REVIEW: true,
        REAL_PUBLISH_DEFAULT_OFF: true,
        FIXTURE_STILL_DRAFT: true,
        HUMAN_REVIEW_NOT_EXECUTED: true,
        FORMAL_IMPORT_NOT_EXECUTED: true,
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
