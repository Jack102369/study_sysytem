/**
 * PHASE_E2-B2：案例「有效审核状态」解析。
 * - 不改写 fixture 原始 draft/unverified
 * - 仅当覆盖层为当前 contentHash 的合法 approve_for_publish 时，才授予正式发布可用的有效态
 */
import type { IndustrialCase } from './industrial-case.types'
import { validateIndustrialCase } from './industrial-case.validate'
import {
  loadIndustrialCaseReviewOverlay,
  type IndustrialCaseReviewOverlay,
} from './industrial-case-review.store'

export type IndustrialCaseEffectiveReview = {
  caseCode: string
  caseVersion: string
  caseContentHash: string
  rawReviewStatus: string
  rawHasVerifiedSource: boolean
  overlayPresent: boolean
  overlayDecision: string | null
  effectiveReviewStatus: string
  effectiveSourceVerification: 'unverified' | 'verified' | 'incomplete'
  reviewedContentHash: string | null
  reviewerId: string | null
  reviewedAt: string | null
  isCurrent: boolean
  publishEligible: boolean
  grantsEffectivePublishEligibility: boolean
  blockingReasons: string[]
  elevatesFixtureToPublished: false
}

function sourcesAllVerifiedByAdmin(overlay: IndustrialCaseReviewOverlay): boolean {
  if (!overlay.sourceNotes?.length) return false
  return overlay.sourceNotes.every(
    (s) =>
      s.outcome === 'verified_by_admin' &&
      String(s.evidenceNote || '').trim().length >= 8,
  )
}

/**
 * 解析案例有效审核态（只读聚合）。
 */
export function resolveIndustrialCaseEffectiveReview(
  industrialCase: IndustrialCase,
  cwd = process.cwd(),
  overlay?: IndustrialCaseReviewOverlay | null,
): IndustrialCaseEffectiveReview {
  const ov =
    overlay === undefined
      ? loadIndustrialCaseReviewOverlay(industrialCase.caseCode, cwd)
      : overlay
  const rawHasVerified = industrialCase.sourceReferences.some(
    (s) => s.verificationStatus === 'verified',
  )
  const structure = validateIndustrialCase(industrialCase)
  const blockers: string[] = []

  if (!structure.ok) {
    blockers.push(...structure.errors.slice(0, 6).map((e) => `STRUCTURE:${e}`))
  }

  const base: IndustrialCaseEffectiveReview = {
    caseCode: industrialCase.caseCode,
    caseVersion: industrialCase.version,
    caseContentHash: industrialCase.contentHash,
    rawReviewStatus: industrialCase.reviewStatus,
    rawHasVerifiedSource: rawHasVerified,
    overlayPresent: !!ov,
    overlayDecision: ov?.decision || null,
    effectiveReviewStatus: industrialCase.reviewStatus,
    effectiveSourceVerification: rawHasVerified ? 'verified' : 'unverified',
    reviewedContentHash: industrialCase.reviewedContentHash ?? null,
    reviewerId: null,
    reviewedAt: null,
    isCurrent: false,
    publishEligible: false,
    grantsEffectivePublishEligibility: false,
    blockingReasons: blockers,
    elevatesFixtureToPublished: false,
  }

  if (!ov) {
    blockers.push('NO_CASE_REVIEW_OVERLAY')
    if (industrialCase.reviewStatus === 'draft') blockers.push('RAW_CASE_DRAFT')
    if (!rawHasVerified) blockers.push('RAW_SOURCE_UNVERIFIED')
    base.blockingReasons = [...new Set(blockers)]
    return base
  }

  const isCurrent = ov.contentHashAtReview === industrialCase.contentHash
  base.isCurrent = isCurrent
  base.reviewerId = ov.reviewedBy
  base.reviewedAt = ov.reviewedAt
  base.overlayDecision = ov.decision

  if (!isCurrent) {
    blockers.push('OVERLAY_STALE_CONTENT_HASH')
    base.blockingReasons = [...new Set(blockers)]
    return base
  }

  if (ov.decision === 'approve_for_publish') {
    if (!sourcesAllVerifiedByAdmin(ov)) {
      blockers.push('SOURCE_NOTES_NOT_ALL_VERIFIED_WITH_EVIDENCE')
    }
    if (!String(ov.note || '').trim()) {
      blockers.push('APPROVE_NOTE_REQUIRED')
    }
    if (!ov.reviewedBy) blockers.push('REVIEWER_MISSING')
    if (blockers.some((b) => b.startsWith('STRUCTURE:'))) {
      base.blockingReasons = [...new Set(blockers)]
      return base
    }
    if (blockers.includes('SOURCE_NOTES_NOT_ALL_VERIFIED_WITH_EVIDENCE')) {
      base.blockingReasons = [...new Set(blockers)]
      return base
    }
    if (blockers.includes('APPROVE_NOTE_REQUIRED') || blockers.includes('REVIEWER_MISSING')) {
      base.blockingReasons = [...new Set(blockers)]
      return base
    }

    // 有效态：fixture 仍 draft；有效审核 = approved + sources verified + hash 绑定
    base.effectiveReviewStatus = 'approved'
    base.effectiveSourceVerification = 'verified'
    base.reviewedContentHash = industrialCase.contentHash
    base.grantsEffectivePublishEligibility = true
    base.publishEligible = structure.ok
    base.blockingReasons = structure.ok ? [] : [...new Set(blockers)]
    return base
  }

  // 非升格决策：仅记录意见
  blockers.push(`OVERLAY_DECISION_NOT_APPROVE:${ov.decision}`)
  if (industrialCase.reviewStatus === 'draft') blockers.push('RAW_CASE_DRAFT')
  if (!rawHasVerified) blockers.push('RAW_SOURCE_UNVERIFIED')
  base.blockingReasons = [...new Set(blockers)]
  return base
}

/**
 * 投影「质检/正式闸门」用的案例视图：不修改 fixture 文件。
 * 仅覆盖 reviewStatus / reviewedContentHash（二者不参与 contentHash）。
 * 来源 verified / 课程 approved 不得写入投影：二者参与语义哈希，改写会导致 contentHash mismatch。
 * 来源与课程可信度由 resolveIndustrialCaseEffectiveReview + 质检/闸门显式读取。
 */
export function projectIndustrialCaseForPublishGates(
  industrialCase: IndustrialCase,
  cwd = process.cwd(),
): IndustrialCase {
  const eff = resolveIndustrialCaseEffectiveReview(industrialCase, cwd)
  if (!eff.grantsEffectivePublishEligibility || !eff.publishEligible) {
    return industrialCase
  }
  return {
    ...industrialCase,
    reviewStatus: 'approved',
    reviewedContentHash: industrialCase.contentHash,
  }
}
