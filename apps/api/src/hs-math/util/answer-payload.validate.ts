import { BadRequestException } from '@nestjs/common'
import { HS_MATH_QTYPES, type HsMathQtype } from '../hs-math.constants'
import type {
  HsMathAnswerPayload,
  HsMathOptionsJson,
} from '../types/answer-protocol'
import { validateApplicationAnswerFields } from './application-rubric.validate'

export type ValidateAnswerContext = {
  qtype: HsMathQtype
  optionsJson: unknown
  answerPayload: unknown
}

const NUMERIC_VALUE_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function fail(message: string): never {
  throw new BadRequestException(message)
}

/** 解析 options_json；选择题必须有合法 options */
export function parseOptionsJson(
  qtype: HsMathQtype,
  optionsJson: unknown,
): HsMathOptionsJson | null {
  if (qtype === 'judge' || qtype === 'numeric' || qtype === 'application') {
    if (optionsJson === null || optionsJson === undefined) return null
    fail(`${qtype} 题型不应提供 options_json`)
  }

  if (!isPlainObject(optionsJson) || !Array.isArray(optionsJson.options)) {
    fail('选择题必须提供 options_json.options 数组')
  }
  if (optionsJson.options.length < 2) {
    fail('选择题至少需要 2 个选项')
  }

  const ids = new Set<string>()
  const options: { id: string; text: string }[] = []
  for (const raw of optionsJson.options) {
    if (!isPlainObject(raw)) fail('选项必须为对象')
    const id = raw.id
    const text = raw.text
    if (typeof id !== 'string' || !id.trim()) fail('选项 id 必须为非空字符串')
    if (typeof text !== 'string' || !text.trim()) {
      fail(`选项 ${id} 的 text 必须为非空字符串`)
    }
    if (ids.has(id)) fail(`选项 id 重复：${id}`)
    ids.add(id)
    options.push({ id, text })
  }
  return { options }
}

/** P0：不支持科学计数法（07_design_review）；支持整数/小数/负数/零/简单分数 */
export function assertValidNumericValueString(value: string): void {
  const trimmed = value.trim()
  if (!trimmed) fail('numeric 标准答案 value 不能为空')
  if (/[eE]/.test(trimmed)) {
    fail('P0 不支持科学计数法，请使用十进制或简单分数')
  }
  if (!NUMERIC_VALUE_RE.test(trimmed)) {
    fail('numeric 标准答案 value 格式非法（支持整数/小数/分数，小数位≤8）')
  }
  if (trimmed.includes('/')) {
    const unsigned = trimmed.replace(/^[+-]/, '')
    const [, b] = unsigned.split('/')
    if (!b || Number(b) === 0) fail('分数分母不能为 0')
  } else {
    const n = Number(trimmed)
    if (!Number.isFinite(n)) fail('numeric 标准答案不是有限数字')
  }
}

function assertNonNegFiniteTolerance(name: string, v: unknown): number {
  if (v === undefined || v === null) return 0
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    fail(`${name} 必须为有限数字`)
  }
  if (v < 0) fail(`${name} 不能为负数`)
  return v
}

export function validateAnswerPayload(ctx: ValidateAnswerContext): {
  optionsJson: HsMathOptionsJson | null
  answerPayload: HsMathAnswerPayload
} {
  if (!HS_MATH_QTYPES.includes(ctx.qtype)) {
    fail(`不支持的题型：${ctx.qtype}`)
  }

  const optionsJson = parseOptionsJson(ctx.qtype, ctx.optionsJson)
  const optionIdSet = new Set((optionsJson?.options ?? []).map((o) => o.id))

  if (!isPlainObject(ctx.answerPayload)) {
    fail('answer_payload_json 必须为对象')
  }
  const payload = ctx.answerPayload
  if (payload.kind !== ctx.qtype) {
    fail(`answer_payload_json.kind 必须与 qtype 一致（期望 ${ctx.qtype}）`)
  }

  if (ctx.qtype === 'single') {
    const optionId = payload.optionId
    if (typeof optionId !== 'string' || !optionId.trim()) {
      fail('single 答案 optionId 必须为非空字符串')
    }
    if (!optionIdSet.has(optionId)) {
      fail(`single 答案 optionId 不在选项中：${optionId}`)
    }
    return {
      optionsJson,
      answerPayload: { kind: 'single', optionId },
    }
  }

  if (ctx.qtype === 'multi') {
    const optionIdsRaw = payload.optionIds
    if (!Array.isArray(optionIdsRaw) || optionIdsRaw.length === 0) {
      fail('multi 答案 optionIds 必须为非空数组')
    }
    const seen = new Set<string>()
    const normalized: string[] = []
    for (const id of optionIdsRaw) {
      if (typeof id !== 'string' || !id.trim()) {
        fail('multi 答案 optionIds 项必须为非空字符串')
      }
      if (seen.has(id)) fail(`multi 答案包含重复选项：${id}`)
      if (!optionIdSet.has(id)) fail(`multi 答案包含不存在的选项：${id}`)
      seen.add(id)
      normalized.push(id)
    }
    return {
      optionsJson,
      answerPayload: { kind: 'multi', optionIds: normalized },
    }
  }

  if (ctx.qtype === 'judge') {
    if (typeof payload.value !== 'boolean') {
      fail('judge 答案 value 必须为 boolean（禁止字符串 true/false）')
    }
    return {
      optionsJson: null,
      answerPayload: { kind: 'judge', value: payload.value },
    }
  }

  if (ctx.qtype === 'application') {
    const checked = validateApplicationAnswerFields(payload)
    if (!checked.ok) fail(checked.message)
    return {
      optionsJson: null,
      answerPayload: {
        kind: 'application',
        standardAnswer: checked.standardAnswer,
        maxScore: checked.maxScore,
        rubric: checked.rubric,
      },
    }
  }

  if (typeof payload.value !== 'string') {
    fail('numeric 标准答案 value 必须为字符串')
  }
  assertValidNumericValueString(payload.value)
  const toleranceAbs = assertNonNegFiniteTolerance(
    'toleranceAbs',
    payload.toleranceAbs,
  )
  const toleranceRel = assertNonNegFiniteTolerance(
    'toleranceRel',
    payload.toleranceRel,
  )
  return {
    optionsJson: null,
    answerPayload: {
      kind: 'numeric',
      value: payload.value.trim(),
      toleranceAbs,
      toleranceRel,
    },
  }
}

export function assertNonEmptyStem(stem: unknown): string {
  if (typeof stem !== 'string' || !stem.trim()) {
    fail('题干 stem 不能为空')
  }
  return stem.trim()
}
