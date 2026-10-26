/**
 * APPLICATION-3E-1：按 gradingProvider + 内容形态决定 submit 后入队与落库状态。
 */
import type { HsMathGradingProvider } from '../hs-math.constants'
import { extractApplicationImageIds } from './hs-math-application-image-policy'
import { resolveGradingProviderFromAnswer } from './user-answer.validate'

export type HsMathApplicationGradePipeline =
  | 'qwen_vision'
  | 'qwen_text'
  | 'deepseek_text'
  | 'qwen_then_deepseek'

export type HsMathApplicationGradeDispatch = {
  pipeline: HsMathApplicationGradePipeline | null
  /** 事务后调度队列 */
  queue: 'vision' | 'text' | 'dual' | null
  gradeResult: 'pending_ai' | 'review_required' | null
  gradeReason: string | null
}

/**
 * @param visionReady Vision 外发可用（含 allowlist）
 * @param textAiReady DeepSeek 文字批改可用
 */
export function dispatchApplicationGrade(input: {
  qtype: string
  syncGradeResult: string | null | undefined
  user: {
    kind?: string
    text?: string
    imageIds?: string[]
    gradingProvider?: string
  } | null
  visionReady: boolean
  textAiReady: boolean
}): HsMathApplicationGradeDispatch {
  if (input.qtype !== 'application' || input.syncGradeResult !== 'pending_ai') {
    return {
      pipeline: null,
      queue: null,
      gradeResult: null,
      gradeReason: null,
    }
  }
  const user = input.user
  if (!user || user.kind !== 'application') {
    return {
      pipeline: null,
      queue: null,
      gradeResult: null,
      gradeReason: null,
    }
  }

  const provider: HsMathGradingProvider =
    resolveGradingProviderFromAnswer(user)
  const hasImages = extractApplicationImageIds(user).length > 0
  const hasText =
    typeof user.text === 'string' && !!user.text.trim()

  if (!hasImages && !hasText) {
    return {
      pipeline: null,
      queue: null,
      gradeResult: 'review_required',
      gradeReason: 'empty_answer',
    }
  }

  if (provider === 'qwen') {
    if (!input.visionReady) {
      return {
        pipeline: hasImages ? 'qwen_vision' : 'qwen_text',
        queue: null,
        gradeResult: 'review_required',
        gradeReason: 'awaiting_multimodal',
      }
    }
    return {
      pipeline: hasImages ? 'qwen_vision' : 'qwen_text',
      queue: 'vision',
      gradeResult: 'pending_ai',
      gradeReason: hasImages ? 'awaiting_vision_ai' : 'awaiting_qwen_text_ai',
    }
  }

  // deepseek
  if (hasImages) {
    if (!input.visionReady || !input.textAiReady) {
      return {
        pipeline: 'qwen_then_deepseek',
        queue: null,
        gradeResult: 'review_required',
        gradeReason: !input.visionReady
          ? 'awaiting_multimodal'
          : 'awaiting_text_ai',
      }
    }
    return {
      pipeline: 'qwen_then_deepseek',
      queue: 'dual',
      gradeResult: 'pending_ai',
      gradeReason: 'awaiting_qwen_then_deepseek',
    }
  }

  // deepseek text-only
  if (!input.textAiReady) {
    return {
      pipeline: 'deepseek_text',
      queue: null,
      gradeResult: 'review_required',
      gradeReason: 'awaiting_text_ai',
    }
  }
  return {
    pipeline: 'deepseek_text',
    queue: 'text',
    gradeResult: 'pending_ai',
    gradeReason: 'awaiting_ai',
  }
}
