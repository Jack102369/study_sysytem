/**
 * APPLICATION-3D-8：含图应用题提交后的状态映射 / stale grading 判定（纯函数）。
 * 不外发、不扫库。
 */
import {
  HS_MATH_VISION_GRADING_TIMEOUT_MS,
  HS_MATH_VISION_STALE_GRADING_BUFFER_MS,
} from '../hs-math.constants'

export type HsMathApplicationSubmitRoute =
  | 'text_ai'
  | 'vision_ai'
  | 'empty'
  | 'none'

export type HsMathVisionSubmitGradeOutcome = {
  gradeResult: 'pending_ai' | 'review_required'
  gradeReason: string
  /** 是否应在事务提交后 scheduleVisionGrading */
  shouldScheduleVision: boolean
}

/**
 * 含图（vision_ai）提交时：开关开 → pending_ai 并调度；关 → review_required 不调度。
 * 非 vision_ai 路由勿调用。
 */
export function resolveApplicationVisionSubmitState(
  visionOutboundEnabled: boolean,
): HsMathVisionSubmitGradeOutcome {
  if (visionOutboundEnabled) {
    return {
      gradeResult: 'pending_ai',
      gradeReason: 'awaiting_vision_ai',
      shouldScheduleVision: true,
    }
  }
  return {
    gradeResult: 'review_required',
    gradeReason: 'awaiting_multimodal',
    shouldScheduleVision: false,
  }
}

/** submit 时按路由分流：vision / text / 其它 */
export function classifySubmitAiQueues(input: {
  qtype: string
  syncGradeResult: string | null | undefined
  route: HsMathApplicationSubmitRoute
  visionOutboundEnabled: boolean
}): {
  textQueue: boolean
  visionQueue: boolean
  gradeResult: 'pending_ai' | 'review_required' | null
  gradeReason: string | null
} {
  if (input.qtype !== 'application' || input.syncGradeResult !== 'pending_ai') {
    return {
      textQueue: false,
      visionQueue: false,
      gradeResult: null,
      gradeReason: null,
    }
  }
  if (input.route === 'vision_ai') {
    const o = resolveApplicationVisionSubmitState(input.visionOutboundEnabled)
    return {
      textQueue: false,
      visionQueue: o.shouldScheduleVision,
      gradeResult: o.gradeResult,
      gradeReason: o.gradeReason,
    }
  }
  if (input.route === 'text_ai') {
    return {
      textQueue: true,
      visionQueue: false,
      gradeResult: null,
      gradeReason: null,
    }
  }
  return {
    textQueue: false,
    visionQueue: false,
    gradeResult: null,
    gradeReason: null,
  }
}

export function visionStaleGradingThresholdMs(
  timeoutMs = HS_MATH_VISION_GRADING_TIMEOUT_MS,
  bufferMs = HS_MATH_VISION_STALE_GRADING_BUFFER_MS,
): number {
  return timeoutMs + bufferMs
}

/** claim 写入：ai_grading:<epochMs>；兼容旧值 ai_grading */
export const AI_GRADING_REASON_PREFIX = 'ai_grading'

export function formatAiGradingReason(startedAtMs = Date.now()): string {
  return `${AI_GRADING_REASON_PREFIX}:${startedAtMs}`
}

export function parseAiGradingStartedMs(
  gradeReason: string | null | undefined,
): number | null {
  if (!gradeReason) return null
  if (gradeReason === AI_GRADING_REASON_PREFIX) return null
  const m = /^ai_grading:(\d+)$/.exec(gradeReason.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/**
 * 进程崩溃后 grading 可卡住：超过阈值则应就地 grading_failed（不外发）。
 * 优先 gradeReason 内嵌时间；否则回退 startedAtFallback（如 session.submittedAt）。
 */
export function isStaleGradingState(input: {
  gradeResult: string | null | undefined
  gradeReason?: string | null
  startedAtFallback?: Date | string | null
  now?: Date
  thresholdMs?: number
}): boolean {
  if (input.gradeResult !== 'grading') return false
  let t = parseAiGradingStartedMs(input.gradeReason)
  if (t == null && input.startedAtFallback != null) {
    const raw = input.startedAtFallback
    t = raw instanceof Date ? raw.getTime() : new Date(raw).getTime()
  }
  if (t == null || !Number.isFinite(t)) return false
  const now = (input.now ?? new Date()).getTime()
  const thr = input.thresholdMs ?? visionStaleGradingThresholdMs()
  return now - t >= thr
}

/** claim 可认领的状态（不含历史 review_required） */
export function isClaimableAiGradeResult(
  gradeResult: string | null | undefined,
): boolean {
  return (
    gradeResult === 'pending_ai' ||
    gradeResult === 'grading_failed' ||
    gradeResult === 'grading'
  )
}

export function shouldRejectClaim(
  gradeResult: string | null | undefined,
): { reject: true; reason: string } | { reject: false } {
  if (gradeResult === 'graded') return { reject: true, reason: 'already_graded' }
  if (gradeResult === 'review_required') {
    return { reject: true, reason: 'review_required' }
  }
  if (!isClaimableAiGradeResult(gradeResult)) {
    return { reject: true, reason: `state_${gradeResult || 'null'}` }
  }
  return { reject: false }
}
