/**
 * APPLICATION-3A/3D-5：应用题 AI 批改结构化协议（存 ai_grade_json）。
 * 最终可保存数据必须以服务端 rubric 校验为准，不信任模型自报 maxScore。
 */

export type HsMathAiRubricScore = {
  /** 与题目 rubric.key 对齐 */
  rubricKey: string
  score: number
  maxScore: number
  feedback: string
}

export type HsMathAiInputModality = 'text' | 'image' | 'mixed'

export type HsMathAiGradeJson = {
  status: 'graded'
  totalScore: number
  /** 题目满分快照（来自标准答案，非 AI 覆盖） */
  maxScore: number
  rubricScores: HsMathAiRubricScore[]
  recognizedWork: string
  errors: string[]
  personalizedExplanation: string
  confidence: number | null
  model: string
  gradedAt: string
  /** APPLICATION-3D-5：可选扩展（无迁移，存 JSON） */
  inputModality?: HsMathAiInputModality
  imageCount?: number
  /**
   * APPLICATION-3E-8：兼容旧 string[] 与结构化 object[]（无迁移，存 JSON）。
   * 千问直评路径仍可能只写 string。
   */
  recognitionWarnings?: Array<
    | string
    | {
        pageIndex: number
        location: string
        category: string
        severity: string
        description: string
        affectsScoring: boolean
      }
  >
  /** APPLICATION-3E-1：批改链路元数据（无迁移） */
  gradingProvider?: 'qwen' | 'deepseek'
  visionModel?: string
  scoringModel?: string
  pipeline?:
    | 'qwen_vision'
    | 'qwen_text'
    | 'deepseek_text'
    | 'qwen_then_deepseek'
  /** 3E-2：双阶段调用次数（无迁移，存 JSON） */
  visionCallCount?: number
  scoringCallCount?: number
}

export type HsMathAiGradeValidateOk = {
  ok: true
  value: HsMathAiGradeJson
  /** 模型声明不确定或低置信（含图时由调用方转 review_required） */
  recognitionUncertain: boolean
}

export type HsMathAiGradeValidateErr = {
  ok: false
  code: string
  message: string
}

export type HsMathAiGradeValidateResult =
  | HsMathAiGradeValidateOk
  | HsMathAiGradeValidateErr
