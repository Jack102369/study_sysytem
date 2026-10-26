/**
 * APPLICATION-3D-9：Vision 自动批改 fail-closed 范围（纯函数 + 进程内 HTTP 预算）。
 * 不外发、不扫库。
 */

export type HsMathVisionLiveScopeConfig = {
  /** 全局开关（ENABLED + URL/KEY 已由调用方确认时可传 true） */
  outboundEnabled: boolean
  /** 空 = 不限制用户；有值则必须匹配 */
  testUserId: string
  /** 逗号分隔；testUserId 有值且本列表空 → 禁止一切自动 Vision */
  testSessionIdsRaw: string
  /**
   * APPLICATION-4C-3：可选 sessionItem allowlist。
   * - 未设 / 空：不额外限制 item（兼容 3E）
   * - 非空：必须匹配 sessionItemId
   */
  testSessionItemIdsRaw?: string
}

export type HsMathVisionLiveScopeDecision = {
  allowed: boolean
  reason: string
}

export function parseVisionTestSessionIds(raw: string): Set<string> {
  const out = new Set<string>()
  for (const part of String(raw || '').split(/[,;\s]+/)) {
    const id = part.trim()
    if (id) out.add(id)
  }
  return out
}

/**
 * 自动调度 / 真实 HTTP 前闸门。
 * - outboundEnabled=false → 禁止
 * - testUserId 非空且 userId 不符 → 禁止
 * - testUserId 非空且 session allowlist 为空 → 禁止（fail-closed）
 * - testUserId 非空且 session 不在 allowlist → 禁止
 * - testSessionItemIds 非空且 item 不符 / 缺失 → 禁止
 * - testUserId 空 → 仅依赖 outboundEnabled（生产无 allowlist 模式）
 */
export function canAutoVisionGrade(
  cfg: HsMathVisionLiveScopeConfig,
  userId: string,
  sessionId: string,
  sessionItemId?: string | null,
): HsMathVisionLiveScopeDecision {
  if (!cfg.outboundEnabled) {
    return { allowed: false, reason: 'vision_disabled' }
  }
  const uid = String(userId || '').trim()
  const sid = String(sessionId || '').trim()
  if (!uid || !sid) {
    return { allowed: false, reason: 'missing_ids' }
  }
  const testUser = String(cfg.testUserId || '').trim()
  if (!testUser) {
    return { allowed: true, reason: 'ok_no_test_scope' }
  }
  if (uid !== testUser) {
    return { allowed: false, reason: 'user_not_allowlisted' }
  }
  const sessions = parseVisionTestSessionIds(cfg.testSessionIdsRaw)
  if (!sessions.size) {
    return { allowed: false, reason: 'session_allowlist_empty' }
  }
  if (!sessions.has(sid)) {
    return { allowed: false, reason: 'session_not_allowlisted' }
  }
  const itemRaw = cfg.testSessionItemIdsRaw
  if (itemRaw !== undefined && String(itemRaw).trim() !== '') {
    const items = parseVisionTestSessionIds(itemRaw)
    const iid = String(sessionItemId ?? '').trim()
    // 调度层可能尚未带 itemId：仅 session 闸；HTTP/重批带 itemId 时强制匹配
    if (iid && !items.has(iid)) {
      return { allowed: false, reason: 'session_item_not_allowlisted' }
    }
  }
  return { allowed: true, reason: 'ok_allowlisted' }
}

/** 含图 submit：是否按「可自动 Vision」处理（pending_ai+调度） */
export function resolveApplicationVisionSubmitStateScoped(input: {
  outboundEnabled: boolean
  testUserId: string
  testSessionIdsRaw: string
  userId: string
  sessionId: string
}): {
  gradeResult: 'pending_ai' | 'review_required'
  gradeReason: string
  shouldScheduleVision: boolean
  scopeReason: string
} {
  const d = canAutoVisionGrade(
    {
      outboundEnabled: input.outboundEnabled,
      testUserId: input.testUserId,
      testSessionIdsRaw: input.testSessionIdsRaw,
    },
    input.userId,
    input.sessionId,
  )
  if (d.allowed) {
    return {
      gradeResult: 'pending_ai',
      gradeReason: 'awaiting_vision_ai',
      shouldScheduleVision: true,
      scopeReason: d.reason,
    }
  }
  return {
    gradeResult: 'review_required',
    gradeReason:
      d.reason === 'vision_disabled'
        ? 'awaiting_multimodal'
        : `awaiting_multimodal:${d.reason}`,
    shouldScheduleVision: false,
    scopeReason: d.reason,
  }
}

/**
 * 进程内真实 HTTP 预算（失败也计数）。
 * budgetMax<=0 或未设 → 不限制。
 */
export class HsMathVisionLiveHttpBudget {
  private used = 0

  constructor(private readonly budgetMax: number) {}

  get max(): number {
    return this.budgetMax
  }

  get usedCount(): number {
    return this.used
  }

  remaining(): number | null {
    if (this.budgetMax <= 0) return null
    return Math.max(0, this.budgetMax - this.used)
  }

  /** @returns true 若允许发出（并已占用 1 次）；false 若超限 */
  tryConsume(): boolean {
    if (this.budgetMax <= 0) {
      this.used += 1
      return true
    }
    if (this.used >= this.budgetMax) return false
    this.used += 1
    return true
  }
}

export function parseVisionLiveHttpBudget(raw: string): number {
  const t = String(raw || '').trim()
  if (!t) return 0
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}
