/**
 * APPLICATION-4C-2：应用题「重新申请 AI 批改」资格与原子过渡规划（纯函数）。
 * 不调用真实 AI；不改答案 / imageIds / gradingProvider。
 */
import { HS_MATH_AI_GRADING_MAX_ATTEMPTS } from '../hs-math.constants'
import {
  dispatchApplicationGrade,
  type HsMathApplicationGradeDispatch,
} from './hs-math-application-grade-dispatch'
import { extractApplicationImageIds } from './hs-math-application-image-policy'

/** 识别不可靠类 reason：默认禁止用户主动重批 */
const RECOGNITION_BLOCK_REASONS = new Set([
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

export type HsMathRegradeRejectCode =
  | 'NOT_APPLICATION'
  | 'SESSION_NOT_COMPLETED'
  | 'FORBIDDEN_OWNER'
  | 'NO_ANSWER'
  | 'IMAGES_NOT_SUBMITTED'
  | 'ALREADY_GRADED'
  | 'ALREADY_PENDING'
  | 'ALREADY_GRADING'
  | 'RECOGNITION_BLOCKED'
  | 'NOT_ELIGIBLE'
  | 'MAX_ATTEMPTS'
  | 'EMPTY_ANSWER'
  | 'AI_GRADING_DISABLED'
  | 'DEEPSEEK_DAILY_QUOTA_EXCEEDED'
  | 'DISPATCH_NO_QUEUE'

export type HsMathRegradeEligibilityResult =
  | { ok: true }
  | { ok: false; code: HsMathRegradeRejectCode; message: string }

export type HsMathRegradePlanResult =
  | {
      ok: true
      dispatch: HsMathApplicationGradeDispatch
      nextGradeResult: 'pending_ai'
      nextGradeReason: string
    }
  | { ok: false; code: HsMathRegradeRejectCode; message: string }

function normalizeReason(gradeReason: string | null | undefined): string {
  return String(gradeReason || '').trim()
}

export function isAwaitingAiNotScheduledReason(
  gradeReason: string | null | undefined,
): boolean {
  const r = normalizeReason(gradeReason)
  if (!r) return false
  if (r === 'awaiting_multimodal') return true
  if (r.startsWith('awaiting_multimodal:')) return true
  if (r === 'awaiting_text_ai') return true
  return false
}

export function isRecognitionBlockedRegradeReason(
  gradeReason: string | null | undefined,
): boolean {
  const r = normalizeReason(gradeReason)
  if (!r) return false
  if (RECOGNITION_BLOCK_REASONS.has(r)) return true
  if (r.startsWith('critical_recognition_warning')) return true
  if (r.startsWith('uncertain_recognition')) return true
  return false
}

export type HsMathRegradeEligibilityInput = {
  qtype: string
  sessionStatus: string
  sessionUserId: string
  requestUserId: string
  gradeResult: string | null | undefined
  gradeReason: string | null | undefined
  aiAttemptCount: number
  maxAttempts?: number
  /** user_answer 是否存在且 kind=application */
  hasApplicationAnswer: boolean
  imageIds: string[]
  /** 库内图片行（只读校验） */
  images: Array<{
    id: string
    status: string
    userId: string
    sessionItemId: string
  }>
  sessionItemId: string
}

/**
 * 用户主动重批资格（不含 AI 开关；开关在 plan 阶段与状态写入同锁检查）。
 */
export function evaluateApplicationRegradeEligibility(
  input: HsMathRegradeEligibilityInput,
): HsMathRegradeEligibilityResult {
  if (input.qtype !== 'application') {
    return {
      ok: false,
      code: 'NOT_APPLICATION',
      message: '仅应用题支持重新申请 AI 批改',
    }
  }
  if (String(input.sessionUserId) !== String(input.requestUserId)) {
    return {
      ok: false,
      code: 'FORBIDDEN_OWNER',
      message: '无权操作该训练记录',
    }
  }
  if (input.sessionStatus !== 'completed') {
    return {
      ok: false,
      code: 'SESSION_NOT_COMPLETED',
      message: '仅已完成的训练可重新申请 AI 批改',
    }
  }
  if (!input.hasApplicationAnswer) {
    return {
      ok: false,
      code: 'NO_ANSWER',
      message: '没有可重批的应用题答案',
    }
  }

  const imageIds = input.imageIds.map(String)
  if (imageIds.length) {
    for (const id of imageIds) {
      const row = input.images.find((i) => String(i.id) === id)
      if (!row) {
        return {
          ok: false,
          code: 'IMAGES_NOT_SUBMITTED',
          message: '答案引用的图片不存在',
        }
      }
      if (String(row.userId) !== String(input.requestUserId)) {
        return {
          ok: false,
          code: 'FORBIDDEN_OWNER',
          message: '图片归属校验失败',
        }
      }
      if (String(row.sessionItemId) !== String(input.sessionItemId)) {
        return {
          ok: false,
          code: 'IMAGES_NOT_SUBMITTED',
          message: '图片不属于本题',
        }
      }
      if (row.status !== 'submitted') {
        return {
          ok: false,
          code: 'IMAGES_NOT_SUBMITTED',
          message: '图片尚未正式提交，无法重批',
        }
      }
    }
  }

  const gr = input.gradeResult
  if (gr === 'graded') {
    return { ok: false, code: 'ALREADY_GRADED', message: '已评分，不可重新批改' }
  }
  if (gr === 'pending_ai') {
    return {
      ok: false,
      code: 'ALREADY_PENDING',
      message: '正在等待 AI 批改，请勿重复申请',
    }
  }
  if (gr === 'grading') {
    return {
      ok: false,
      code: 'ALREADY_GRADING',
      message: 'AI 正在批改，请勿重复申请',
    }
  }

  const maxAttempts = input.maxAttempts ?? HS_MATH_AI_GRADING_MAX_ATTEMPTS
  const attempts = Number(input.aiAttemptCount) || 0

  if (gr === 'grading_failed') {
    if (attempts >= maxAttempts) {
      return {
        ok: false,
        code: 'MAX_ATTEMPTS',
        message: '已达到 AI 批改尝试上限',
      }
    }
    return { ok: true }
  }

  if (gr === 'review_required') {
    if (isRecognitionBlockedRegradeReason(input.gradeReason)) {
      return {
        ok: false,
        code: 'RECOGNITION_BLOCKED',
        message: '识别结果不可靠，请勿对同一答案反复申请批改',
      }
    }
    if (isAwaitingAiNotScheduledReason(input.gradeReason)) {
      if (attempts >= maxAttempts) {
        return {
          ok: false,
          code: 'MAX_ATTEMPTS',
          message: '已达到 AI 批改尝试上限',
        }
      }
      return { ok: true }
    }
    return {
      ok: false,
      code: 'NOT_ELIGIBLE',
      message: '当前状态不支持重新申请 AI 批改',
    }
  }

  return {
    ok: false,
    code: 'NOT_ELIGIBLE',
    message: '当前状态不支持重新申请 AI 批改',
  }
}

/**
 * 在资格通过后：结合开关计算队列。
 * 开关不足 → AI_GRADING_DISABLED（调用方不得写库）。
 */
export function planApplicationRegrade(input: {
  eligibility: HsMathRegradeEligibilityResult
  user: {
    kind?: string
    text?: string
    imageIds?: string[]
    gradingProvider?: string
  } | null
  visionReady: boolean
  textAiReady: boolean
}): HsMathRegradePlanResult {
  if (!input.eligibility.ok) {
    return {
      ok: false,
      code: input.eligibility.code,
      message: input.eligibility.message,
    }
  }
  const user = input.user
  if (!user || user.kind !== 'application') {
    return {
      ok: false,
      code: 'NO_ANSWER',
      message: '没有可重批的应用题答案',
    }
  }
  const ids = extractApplicationImageIds(user)
  const hasText = typeof user.text === 'string' && !!user.text.trim()
  if (!ids.length && !hasText) {
    return {
      ok: false,
      code: 'EMPTY_ANSWER',
      message: '答案为空，无法重批',
    }
  }

  const dispatch = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user,
    visionReady: input.visionReady,
    textAiReady: input.textAiReady,
  })

  if (dispatch.gradeResult === 'review_required' || !dispatch.queue) {
    return {
      ok: false,
      code: 'AI_GRADING_DISABLED',
      message: '当前 AI 批改暂未开放，请稍后再试。',
    }
  }
  if (dispatch.gradeResult !== 'pending_ai' || !dispatch.gradeReason) {
    return {
      ok: false,
      code: 'DISPATCH_NO_QUEUE',
      message: '无法规划 AI 批改队列',
    }
  }

  return {
    ok: true,
    dispatch,
    nextGradeResult: 'pending_ai',
    nextGradeReason: dispatch.gradeReason,
  }
}

/**
 * 模拟并发：两次申请对同一快照；第二次必须以第一次结果为输入。
 * 用于离线证明「不可双开」。
 */
export function simulateConcurrentRegradeAttempts(input: {
  base: HsMathRegradeEligibilityInput
  user: HsMathRegradePlanResult extends { ok: true }
    ? {
        kind?: string
        text?: string
        imageIds?: string[]
        gradingProvider?: string
      }
    : {
        kind?: string
        text?: string
        imageIds?: string[]
        gradingProvider?: string
      }
  visionReady: boolean
  textAiReady: boolean
}): {
  first: HsMathRegradePlanResult
  second: HsMathRegradePlanResult
} {
  const firstElig = evaluateApplicationRegradeEligibility(input.base)
  const first = planApplicationRegrade({
    eligibility: firstElig,
    user: input.user,
    visionReady: input.visionReady,
    textAiReady: input.textAiReady,
  })
  const afterFirst: HsMathRegradeEligibilityInput = first.ok
    ? {
        ...input.base,
        gradeResult: first.nextGradeResult,
        gradeReason: first.nextGradeReason,
      }
    : { ...input.base }
  const secondElig = evaluateApplicationRegradeEligibility(afterFirst)
  const second = planApplicationRegrade({
    eligibility: secondElig,
    user: input.user,
    visionReady: input.visionReady,
    textAiReady: input.textAiReady,
  })
  return { first, second }
}
