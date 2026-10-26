/**
 * 高一数学答案协议（04 定稿 + APPLICATION-1）。
 * 标准答案与学生作答分类型。
 */

export type HsMathOptionItem = {
  id: string
  text: string
}

export type HsMathOptionsJson = {
  options: HsMathOptionItem[]
}

/** 题库 / 会话快照中的标准答案 */
export type HsMathSingleAnswerPayload = {
  kind: 'single'
  optionId: string
}

export type HsMathMultiAnswerPayload = {
  kind: 'multi'
  optionIds: string[]
}

export type HsMathJudgeAnswerPayload = {
  kind: 'judge'
  value: boolean
}

/**
 * numeric 标准答案：value 为规范数字/分数字符串；
 * toleranceAbs / toleranceRel 缺省按 0 理解。
 */
export type HsMathNumericAnswerPayload = {
  kind: 'numeric'
  value: string
  toleranceAbs?: number
  toleranceRel?: number
}

/** 应用题评分项（整数分，避免浮点误差） */
export type HsMathApplicationRubricItem = {
  key: string
  title: string
  maxScore: number
  criteria: string
}

/** 应用题标准答案 + 评分标准（均在 answer_payload_json） */
export type HsMathApplicationAnswerPayload = {
  kind: 'application'
  standardAnswer: string
  maxScore: number
  rubric: HsMathApplicationRubricItem[]
}

export type HsMathAnswerPayload =
  | HsMathSingleAnswerPayload
  | HsMathMultiAnswerPayload
  | HsMathJudgeAnswerPayload
  | HsMathNumericAnswerPayload
  | HsMathApplicationAnswerPayload

/** 学生覆盖作答 */
export type HsMathSingleUserAnswerPayload = {
  kind: 'single'
  optionId: string
}

export type HsMathMultiUserAnswerPayload = {
  kind: 'multi'
  optionIds: string[]
}

export type HsMathJudgeUserAnswerPayload = {
  kind: 'judge'
  value: boolean
}

export type HsMathNumericUserAnswerPayload = {
  kind: 'numeric'
  input: string
}

/**
 * APPLICATION-1/2C/3E-1：纯文字 / 纯图片 / 文图混合。
 * text 与 imageIds 至少其一有效；旧数据仅有 text。
 * imageIds 为题库 session_item_images.id 的十进制字符串（兼容 bigint）。
 * gradingProvider：qwen | deepseek；缺省兼容旧数据；新保存默认 qwen。
 */
export type HsMathApplicationUserAnswerPayload = {
  kind: 'application'
  text?: string
  imageIds?: string[]
  gradingProvider?: 'qwen' | 'deepseek'
}

export type HsMathUserAnswerPayload =
  | HsMathSingleUserAnswerPayload
  | HsMathMultiUserAnswerPayload
  | HsMathJudgeUserAnswerPayload
  | HsMathNumericUserAnswerPayload
  | HsMathApplicationUserAnswerPayload
