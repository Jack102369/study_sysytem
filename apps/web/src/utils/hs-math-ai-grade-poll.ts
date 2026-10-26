/**
 * APPLICATION-3D-8：结果页 AI 批改轮询条件（纯函数）。
 * 仅 pending_ai / grading；不对 review_required 轮询（避免开关关闭死循环）。
 */

export const HS_MATH_AI_GRADE_POLL_INTERVAL_MS = 4_000
export const HS_MATH_AI_GRADE_POLL_HIDDEN_INTERVAL_MS = 15_000
export const HS_MATH_AI_GRADE_POLL_MAX_TICKS = 90
export const HS_MATH_AI_GRADE_POLL_MAX_ERRORS = 5

const ACTIVE = new Set(['pending_ai', 'grading'])

export function isAiGradePollActiveResult(
  gradeResult: string | null | undefined,
): boolean {
  return !!gradeResult && ACTIVE.has(gradeResult)
}

export function sessionNeedsAiGradePoll(
  items: Array<{ gradeResult?: string | null }> | null | undefined,
): boolean {
  if (!items?.length) return false
  return items.some((i) => isAiGradePollActiveResult(i.gradeResult))
}

export function nextAiGradePollIntervalMs(documentHidden: boolean): number {
  return documentHidden
    ? HS_MATH_AI_GRADE_POLL_HIDDEN_INTERVAL_MS
    : HS_MATH_AI_GRADE_POLL_INTERVAL_MS
}

export function shouldStopAiGradePoll(input: {
  needsPoll: boolean
  tickCount: number
  errorCount: number
  maxTicks?: number
  maxErrors?: number
}): boolean {
  if (!input.needsPoll) return true
  const maxTicks = input.maxTicks ?? HS_MATH_AI_GRADE_POLL_MAX_TICKS
  const maxErrors = input.maxErrors ?? HS_MATH_AI_GRADE_POLL_MAX_ERRORS
  if (input.tickCount >= maxTicks) return true
  if (input.errorCount >= maxErrors) return true
  return false
}

/** 明确属于「识别不可靠」的 gradeReason（含库内历史别名） */
const RECOGNITION_UNRELIABLE_REASONS = new Set([
  'recognition_uncertain',
  'uncertain_recognition',
  'low_confidence',
  'critical_recognition_warning',
  'unknown_warning_scope',
  'warning_affects_scoring',
  'non_auxiliary_warning',
  'model_supplementation_suspected',
  'missing_recognized_work',
])

function normalizeGradeReason(
  gradeReason: string | null | undefined,
): string {
  return String(gradeReason || '').trim()
}

/** AI 开关关闭 / 未入队（非识别失败） */
export function isApplicationAiNotScheduledReason(
  gradeReason: string | null | undefined,
): boolean {
  const reason = normalizeGradeReason(gradeReason)
  if (!reason) return false
  if (reason === 'awaiting_multimodal') return true
  if (reason.startsWith('awaiting_multimodal:')) return true
  if (reason === 'awaiting_text_ai') return true
  return false
}

/** DeepSeek 日额度耗尽（业务限制，≠ 识别失败） */
export function isApplicationDeepseekQuotaExceededReason(
  gradeReason: string | null | undefined,
): boolean {
  const reason = normalizeGradeReason(gradeReason)
  return reason === 'deepseek_daily_quota_exceeded'
}

export function isApplicationRecognitionUnreliableReason(
  gradeReason: string | null | undefined,
): boolean {
  const reason = normalizeGradeReason(gradeReason)
  if (!reason) return false
  if (RECOGNITION_UNRELIABLE_REASONS.has(reason)) return true
  // 兼容带后缀的历史码
  if (reason.startsWith('critical_recognition_warning')) return true
  if (reason.startsWith('uncertain_recognition')) return true
  return false
}

/**
 * 结果页应用题 AI 状态文案（APPLICATION-4A / 4C-1）。
 * 按 gradeReason 区分：未调度 ≠ 识别失败。
 */
export function applicationAiStatusMessage(input: {
  gradeResult: string | null | undefined
  gradeReason?: string | null
}): string | null {
  const r = input.gradeResult
  if (r === 'pending_ai') {
    return '等待 AI 批改。'
  }
  if (r === 'grading') {
    return 'AI 正在批改。'
  }
  if (r === 'grading_failed') {
    if (isApplicationDeepseekQuotaExceededReason(input.gradeReason)) {
      return '今日 DeepSeek 批改次数已用完，请明天再试。'
    }
    return '本次 AI 批改未完成，暂时无法提供分数。'
  }
  if (r === 'review_required') {
    const reason = normalizeGradeReason(input.gradeReason)
    if (isApplicationAiNotScheduledReason(reason)) {
      if (reason === 'awaiting_text_ai') {
        return '本次提交时 AI 文字批改未启用，因此尚未进行批改。你的答案已保存，目前没有产生评分结果。'
      }
      return '本次提交时 AI 图片批改未启用，因此尚未进行批改。你的答案图片已保存，目前没有产生评分结果。'
    }
    if (isApplicationDeepseekQuotaExceededReason(reason)) {
      return '今日 DeepSeek 批改次数已用完，请明天再试。'
    }
    if (isApplicationRecognitionUnreliableReason(reason)) {
      return 'AI 未能可靠识别本次解答，因此没有给出分数。'
    }
    // 无 reason / 未知 reason：中性，不断言识别失败
    return '本次 AI 批改尚未得到有效评分结果。'
  }
  return null
}

/** 状态条样式：未调度用 info，真失败用 fail */
export function applicationAiStatusTone(input: {
  gradeResult: string | null | undefined
  gradeReason?: string | null
}): 'info' | 'warn' | 'fail' | null {
  const r = input.gradeResult
  if (r === 'pending_ai' || r === 'grading') return 'info'
  if (r === 'grading_failed') {
    if (isApplicationDeepseekQuotaExceededReason(input.gradeReason)) {
      return 'warn'
    }
    return 'fail'
  }
  if (r === 'review_required') {
    if (isApplicationAiNotScheduledReason(input.gradeReason)) return 'info'
    if (isApplicationDeepseekQuotaExceededReason(input.gradeReason)) {
      return 'warn'
    }
    if (isApplicationRecognitionUnreliableReason(input.gradeReason)) {
      return 'fail'
    }
    return 'warn'
  }
  return null
}

/** MathGradeTag 文案：review_required 按 reason 细分 */
export function applicationMathGradeTagLabel(input: {
  gradeResult: string | null | undefined
  gradeReason?: string | null
}): string | null {
  const r = input.gradeResult
  if (!r) return null
  if (r === 'correct') return '正确'
  if (r === 'wrong') return '错误'
  if (r === 'pending_review') return '待复核'
  if (r === 'pending_ai') return '等待 AI 批改'
  if (r === 'grading') return 'AI 正在批改'
  if (r === 'graded') return '已批改'
  if (r === 'grading_failed') {
    if (isApplicationDeepseekQuotaExceededReason(input.gradeReason)) {
      return '今日额度已用完'
    }
    return 'AI 批改未完成'
  }
  if (r === 'review_required') {
    if (isApplicationAiNotScheduledReason(input.gradeReason)) {
      return 'AI 未启用·未评分'
    }
    if (isApplicationDeepseekQuotaExceededReason(input.gradeReason)) {
      return '今日额度已用完'
    }
    if (isApplicationRecognitionUnreliableReason(input.gradeReason)) {
      return '识别不可靠·未评分'
    }
    return '暂无评分'
  }
  return '未判'
}

/**
 * APPLICATION-4C-2：结果页是否展示「重新申请 AI 批改」。
 * 仅 UI 提示；最终以服务端资格 + 开关校验为准。
 */
export function canRequestApplicationRegrade(input: {
  qtype?: string | null
  sessionStatus?: string | null
  gradeResult?: string | null
  gradeReason?: string | null
}): boolean {
  if (input.qtype !== 'application') return false
  if (input.sessionStatus !== 'completed') return false
  const gr = input.gradeResult
  if (gr === 'grading_failed') return true
  if (gr === 'review_required') {
    if (isApplicationRecognitionUnreliableReason(input.gradeReason)) {
      return false
    }
    return isApplicationAiNotScheduledReason(input.gradeReason)
  }
  return false
}
