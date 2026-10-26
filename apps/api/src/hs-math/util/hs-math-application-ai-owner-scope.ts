/**
 * APPLICATION-4C-4B：应用题 AI 访问模式（disabled / owner_only）与测试 allowlist 分流。
 * 纯函数；fail-closed。不外发、不写库。
 */
import {
  canAutoVisionGrade,
  type HsMathVisionLiveScopeDecision,
} from './hs-math-vision-live-scope'

export type HsMathApplicationAiMode = 'disabled' | 'owner_only'

export type HsMathApplicationAiModeParse =
  | { ok: true; mode: HsMathApplicationAiMode }
  | { ok: false; reason: string }

export type HsMathAllowedUserIdsParse =
  | { ok: true; ids: Set<string> }
  | { ok: false; reason: string }

export type HsMathApplicationAiAccessConfig = {
  /** HS_MATH_APPLICATION_AI_MODE；空/缺省 → disabled */
  modeRaw: string
  /** HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS；owner_only 必填 */
  allowedUserIdsRaw: string
  /** Vision 或文字开关已允许外发时由调用方传 true */
  outboundEnabled: boolean
  /** 测试模式：HS_MATH_VISION_GRADING_TEST_USER_ID */
  testUserId: string
  testSessionIdsRaw: string
  testSessionItemIdsRaw?: string
}

/**
 * 解析模式。仅接受 disabled | owner_only（大小写不敏感）。
 * 空 → disabled。其它值 → 非法（fail-closed）。
 */
export function parseApplicationAiMode(
  raw: string | null | undefined,
): HsMathApplicationAiModeParse {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (!t || t === 'disabled') {
    return { ok: true, mode: 'disabled' }
  }
  if (t === 'owner_only') {
    return { ok: true, mode: 'owner_only' }
  }
  return { ok: false, reason: 'mode_invalid' }
}

/**
 * 解析用户 allowlist。逗号/分号/空白分隔。
 * 空或无合法 id → fail；含非数字 token → fail。
 */
export function parseApplicationAiAllowedUserIds(
  raw: string | null | undefined,
): HsMathAllowedUserIdsParse {
  const parts = String(raw ?? '')
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (!parts.length) {
    return { ok: false, reason: 'allowed_user_ids_empty' }
  }
  const ids = new Set<string>()
  for (const p of parts) {
    if (!/^\d+$/.test(p)) {
      return { ok: false, reason: 'allowed_user_ids_invalid' }
    }
    // 规范化：去掉前导零（保留单独 "0" 非法用户场景仍拒绝业务）
    const n = String(BigInt(p))
    if (n === '0') {
      return { ok: false, reason: 'allowed_user_ids_invalid' }
    }
    ids.add(n)
  }
  if (!ids.size) {
    return { ok: false, reason: 'allowed_user_ids_empty' }
  }
  return { ok: true, ids }
}

/**
 * 应用题 AI 调度 / HTTP 前闸门。
 *
 * - outboundEnabled=false → 禁止
 * - mode 非法 → 禁止
 * - owner_only：必须合法非空 allowlist；仅匹配用户；不要求 session allowlist
 * - disabled：仅当配置了 TEST_USER 时走既有测试 allowlist；否则禁止（日常未启用）
 */
export function resolveApplicationAiAccess(
  cfg: HsMathApplicationAiAccessConfig,
  userId: string,
  sessionId: string,
  sessionItemId?: string | null,
): HsMathVisionLiveScopeDecision {
  if (!cfg.outboundEnabled) {
    return { allowed: false, reason: 'outbound_disabled' }
  }
  const mode = parseApplicationAiMode(cfg.modeRaw)
  if (!mode.ok) {
    return { allowed: false, reason: mode.reason }
  }

  const uid = String(userId || '').trim()
  const sid = String(sessionId || '').trim()
  if (!uid || !sid) {
    return { allowed: false, reason: 'missing_ids' }
  }

  if (mode.mode === 'owner_only') {
    const users = parseApplicationAiAllowedUserIds(cfg.allowedUserIdsRaw)
    if (!users.ok) {
      return { allowed: false, reason: users.reason }
    }
    // allowlist 存规范化数字串；请求侧也规范化
    let uidNorm = uid
    if (/^\d+$/.test(uid)) {
      uidNorm = String(BigInt(uid))
    }
    if (!users.ids.has(uidNorm)) {
      return { allowed: false, reason: 'user_not_owner' }
    }
    return { allowed: true, reason: 'ok_owner_only' }
  }

  // disabled → 测试模式：必须配置 TEST_USER，否则日常关闭
  const testUser = String(cfg.testUserId || '').trim()
  if (!testUser) {
    return { allowed: false, reason: 'mode_disabled' }
  }
  return canAutoVisionGrade(
    {
      outboundEnabled: true,
      testUserId: cfg.testUserId,
      testSessionIdsRaw: cfg.testSessionIdsRaw,
      testSessionItemIdsRaw: cfg.testSessionItemIdsRaw,
    },
    userId,
    sessionId,
    sessionItemId,
  )
}
