/**
 * 人工审核 → 正式批准 纯逻辑门禁（P1-0F-C3B）。
 * 不连库；供 Service 与 selftest 共用。
 */
import type { HsMathReviewStatus } from '../hs-math.constants'

export type ReviewGateRow = {
  reviewStatus: HsMathReviewStatus | string
  contentVersion: number
  contentFingerprint: string
  reviewComment: string
  reviewerUserId: string
  reviewedAt: Date | string | null
}

export type ReviewGateItemSnapshot = {
  status: string
  pool: string
  isActive: boolean
  contentVersion: number
  contentFingerprint: string
}

export type ReviewGateResult =
  | { ok: true; reason: 'passed_match' }
  | { ok: false; code: string; message: string }

/**
 * 取同一 content_version 下最新一条审核（调用方已按 reviewed_at DESC 排序过滤到当前版本）。
 * 规则：以最新一条为准；必须为 passed 且指纹一致、意见非空、审核人/时间有效。
 */
export function evaluateLatestReviewForPublish(opts: {
  item: ReviewGateItemSnapshot
  /** 当前 content_version 下按 reviewed_at DESC 的审核列表（可含其他版本，函数会过滤） */
  reviewsForItem: ReviewGateRow[]
  requireConfirmPublish: boolean
  confirmPublish?: boolean
}): ReviewGateResult {
  const { item, reviewsForItem, requireConfirmPublish, confirmPublish } = opts

  if (item.status !== 'draft') {
    return {
      ok: false,
      code: 'NOT_DRAFT',
      message: '仅 draft 题目可正式批准',
    }
  }
  if (item.pool !== 'formal') {
    return {
      ok: false,
      code: 'POOL_NOT_FORMAL',
      message: '仅 formal 池题目可正式批准',
    }
  }
  if (!item.isActive) {
    return {
      ok: false,
      code: 'INACTIVE',
      message: '停用题目不可正式批准',
    }
  }
  if (requireConfirmPublish && confirmPublish !== true) {
    return {
      ok: false,
      code: 'CONFIRM_REQUIRED',
      message: '正式批准须明确确认（confirmPublish=true）',
    }
  }

  const sameVersion = reviewsForItem.filter(
    (r) => Number(r.contentVersion) === Number(item.contentVersion),
  )
  if (!sameVersion.length) {
    return {
      ok: false,
      code: 'NO_REVIEW',
      message: '需要先完成当前版本人工审核',
    }
  }

  const latest = sameVersion[0]
  if (!latest) {
    return {
      ok: false,
      code: 'NO_REVIEW',
      message: '需要先完成当前版本人工审核',
    }
  }

  if (String(latest.reviewStatus) !== 'passed') {
    return {
      ok: false,
      code: 'LATEST_NOT_PASSED',
      message: `当前版本最新审核结论为 ${latest.reviewStatus}，禁止批准`,
    }
  }

  if (
    String(latest.contentFingerprint) !== String(item.contentFingerprint)
  ) {
    return {
      ok: false,
      code: 'FINGERPRINT_MISMATCH',
      message: '审核记录内容指纹与当前题目不一致，须重新审核',
    }
  }

  if (!String(latest.reviewComment || '').trim()) {
    return {
      ok: false,
      code: 'EMPTY_COMMENT',
      message: '有效审核意见不能为空',
    }
  }

  if (!String(latest.reviewerUserId || '').trim()) {
    return {
      ok: false,
      code: 'NO_REVIEWER',
      message: '审核人无效',
    }
  }

  if (!latest.reviewedAt) {
    return {
      ok: false,
      code: 'NO_REVIEWED_AT',
      message: '审核时间无效',
    }
  }

  return { ok: true, reason: 'passed_match' }
}

/** 队列/面板用的当前审核态（绑定当前版本+指纹） */
export type CurrentReviewSummary = {
  /** none | passed | rejected | deferred | stale */
  currentReviewStatus: 'none' | 'passed' | 'rejected' | 'deferred' | 'stale'
  reviewIsStale: boolean
  currentReviewerUserId: string | null
  currentReviewedAt: Date | string | null
  currentReviewComment: string | null
  /** 当前版本下最新一条（若存在且未 stale 判定前） */
  latestSameVersionStatus: string | null
}

/**
 * reviewsForItem 须已按 reviewed_at DESC, id DESC 排序。
 * 旧版本 passed → stale，不得显示为当前 passed。
 */
export function summarizeCurrentReview(opts: {
  contentVersion: number
  contentFingerprint: string
  reviewsForItem: ReviewGateRow[]
}): CurrentReviewSummary {
  const cv = Number(opts.contentVersion)
  const fp = String(opts.contentFingerprint)
  const sameVersion = opts.reviewsForItem.filter(
    (r) => Number(r.contentVersion) === cv,
  )
  const latestSame = sameVersion[0]
  const latestAny = opts.reviewsForItem[0]

  if (!latestSame) {
    const staleFromOlder =
      !!latestAny && Number(latestAny.contentVersion) !== cv
    return {
      currentReviewStatus: staleFromOlder ? 'stale' : 'none',
      reviewIsStale: staleFromOlder,
      currentReviewerUserId: null,
      currentReviewedAt: null,
      currentReviewComment: null,
      latestSameVersionStatus: null,
    }
  }

  const fpMatch = String(latestSame.contentFingerprint) === fp
  if (!fpMatch) {
    return {
      currentReviewStatus: 'stale',
      reviewIsStale: true,
      currentReviewerUserId: String(latestSame.reviewerUserId || '') || null,
      currentReviewedAt: latestSame.reviewedAt,
      currentReviewComment: latestSame.reviewComment || null,
      latestSameVersionStatus: String(latestSame.reviewStatus),
    }
  }

  const st = String(latestSame.reviewStatus)
  const normalized =
    st === 'passed' || st === 'rejected' || st === 'deferred' ? st : 'stale'

  return {
    currentReviewStatus: normalized,
    reviewIsStale: false,
    currentReviewerUserId: String(latestSame.reviewerUserId || '') || null,
    currentReviewedAt: latestSame.reviewedAt,
    currentReviewComment: latestSame.reviewComment || null,
    latestSameVersionStatus: st,
  }
}

/** 将门禁结果转为前端可读阻断原因列表 */
export function publishBlockReasonsFromGate(
  gate: ReviewGateResult,
): string[] {
  if (gate.ok) return []
  return [gate.message]
}

export function assertReviewDecisionInput(opts: {
  decision: string
  comment: string
  /** 客户端不得传；若传入则拒绝 */
  reviewerIdFromClient?: unknown
  reviewedAtFromClient?: unknown
}): { decision: HsMathReviewStatus; comment: string } {
  if (
    opts.reviewerIdFromClient !== undefined &&
    opts.reviewerIdFromClient !== null
  ) {
    throw Object.assign(new Error('禁止客户端指定 reviewerId'), {
      gateCode: 'CLIENT_REVIEWER_FORBIDDEN',
    })
  }
  if (
    opts.reviewedAtFromClient !== undefined &&
    opts.reviewedAtFromClient !== null
  ) {
    throw Object.assign(new Error('禁止客户端指定 reviewedAt'), {
      gateCode: 'CLIENT_REVIEWED_AT_FORBIDDEN',
    })
  }
  const decision = String(opts.decision || '').trim()
  if (!['passed', 'rejected', 'deferred'].includes(decision)) {
    throw Object.assign(new Error('非法审核结论'), {
      gateCode: 'INVALID_DECISION',
    })
  }
  const comment = String(opts.comment || '').trim()
  if (!comment) {
    throw Object.assign(new Error('审核意见不能为空'), {
      gateCode: 'EMPTY_COMMENT',
    })
  }
  if (comment.length > 2000) {
    throw Object.assign(new Error('审核意见过长'), {
      gateCode: 'COMMENT_TOO_LONG',
    })
  }
  return { decision: decision as HsMathReviewStatus, comment }
}
