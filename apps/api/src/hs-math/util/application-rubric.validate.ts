/**
 * 应用题评分标准校验（APPLICATION-1）。
 * 分值强制为非负整数，避免浮点合计误差。
 */
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'

export type ApplicationRubricValidationOk = {
  ok: true
  maxScore: number
  rubric: HsMathApplicationRubricItem[]
  standardAnswer: string
}

export type ApplicationRubricValidationErr = {
  ok: false
  code: string
  message: string
}

export type ApplicationRubricValidationResult =
  | ApplicationRubricValidationOk
  | ApplicationRubricValidationErr

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0
}

/**
 * 校验 application 标准答案对象字段（不含 kind 比对；由调用方保证 kind）。
 */
export function validateApplicationAnswerFields(
  payload: Record<string, unknown>,
): ApplicationRubricValidationResult {
  const standardAnswer =
    typeof payload.standardAnswer === 'string'
      ? payload.standardAnswer.trim()
      : ''
  if (!standardAnswer) {
    return {
      ok: false,
      code: 'EMPTY_STANDARD',
      message: 'application 标准答案 standardAnswer 不能为空',
    }
  }

  if (!isNonNegInt(payload.maxScore) || payload.maxScore <= 0) {
    return {
      ok: false,
      code: 'BAD_MAX_SCORE',
      message: 'application maxScore 必须为正整数',
    }
  }
  const maxScore = payload.maxScore

  if (!Array.isArray(payload.rubric) || payload.rubric.length === 0) {
    return {
      ok: false,
      code: 'EMPTY_RUBRIC',
      message: 'application rubric 不能为空',
    }
  }

  const keys = new Set<string>()
  const rubric: HsMathApplicationRubricItem[] = []
  let sum = 0

  for (const raw of payload.rubric) {
    if (!isPlainObject(raw)) {
      return {
        ok: false,
        code: 'BAD_RUBRIC_ITEM',
        message: 'rubric 项必须为对象',
      }
    }
    const key = typeof raw.key === 'string' ? raw.key.trim() : ''
    const title = typeof raw.title === 'string' ? raw.title.trim() : ''
    const criteria =
      typeof raw.criteria === 'string' ? raw.criteria.trim() : ''
    if (!key) {
      return {
        ok: false,
        code: 'EMPTY_KEY',
        message: 'rubric.key 不能为空',
      }
    }
    if (keys.has(key)) {
      return {
        ok: false,
        code: 'DUP_KEY',
        message: `rubric.key 重复：${key}`,
      }
    }
    keys.add(key)
    if (!title) {
      return {
        ok: false,
        code: 'EMPTY_TITLE',
        message: `rubric[${key}].title 不能为空`,
      }
    }
    if (!criteria) {
      return {
        ok: false,
        code: 'EMPTY_CRITERIA',
        message: `rubric[${key}].criteria 不能为空`,
      }
    }
    if (!isNonNegInt(raw.maxScore) || raw.maxScore <= 0) {
      return {
        ok: false,
        code: 'BAD_ITEM_SCORE',
        message: `rubric[${key}].maxScore 必须为正整数`,
      }
    }
    sum += raw.maxScore
    rubric.push({
      key,
      title,
      maxScore: raw.maxScore,
      criteria,
    })
  }

  if (sum !== maxScore) {
    return {
      ok: false,
      code: 'SCORE_MISMATCH',
      message: `rubric 分值合计 ${sum} ≠ maxScore ${maxScore}`,
    }
  }

  return { ok: true, maxScore, rubric, standardAnswer }
}
