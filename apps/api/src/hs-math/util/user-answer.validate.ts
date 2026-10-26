import { BadRequestException } from '@nestjs/common'
import {
  HS_MATH_APPLICATION_IMAGE_MAX_COUNT,
  HS_MATH_APPLICATION_TEXT_MAX_CHARS,
  HS_MATH_GRADING_PROVIDER_DEFAULT,
  HS_MATH_GRADING_PROVIDERS,
  type HsMathGradingProvider,
  type HsMathQtype,
} from '../hs-math.constants'
import type {
  HsMathApplicationUserAnswerPayload,
  HsMathUserAnswerPayload,
} from '../types/answer-protocol'

/**
 * 保存答案时的形状校验（不判对错）。
 * null → 清空；非法形状 → 400。
 * 应用题图片属主校验在 Service 事务内完成（本函数只验形状）。
 */
export function parseUserAnswerPayloadForSave(
  qtype: HsMathQtype,
  raw: unknown,
): HsMathUserAnswerPayload | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestException('userAnswerPayload 必须为对象或 null')
  }
  const obj = raw as Record<string, unknown>
  if (obj.kind !== qtype) {
    throw new BadRequestException(
      `userAnswerPayload.kind 必须与题目类型一致（${qtype}）`,
    )
  }

  if (qtype !== 'application' && 'imageIds' in obj) {
    throw new BadRequestException('非应用题不可提交 imageIds')
  }
  if (qtype !== 'application' && 'gradingProvider' in obj) {
    throw new BadRequestException('非应用题不可提交 gradingProvider')
  }

  if (qtype === 'single') {
    assertNoUnknownKeys(obj, ['kind', 'optionId'], 'single')
    if (typeof obj.optionId !== 'string') {
      throw new BadRequestException('single 作答 optionId 必须为字符串')
    }
    return { kind: 'single', optionId: obj.optionId }
  }

  if (qtype === 'multi') {
    assertNoUnknownKeys(obj, ['kind', 'optionIds'], 'multi')
    if (!Array.isArray(obj.optionIds)) {
      throw new BadRequestException('multi 作答 optionIds 必须为数组')
    }
    for (const id of obj.optionIds) {
      if (typeof id !== 'string') {
        throw new BadRequestException('multi 作答 optionIds 项必须为字符串')
      }
    }
    return { kind: 'multi', optionIds: obj.optionIds as string[] }
  }

  if (qtype === 'judge') {
    assertNoUnknownKeys(obj, ['kind', 'value'], 'judge')
    if (typeof obj.value !== 'boolean') {
      throw new BadRequestException('judge 作答 value 必须为 boolean')
    }
    return { kind: 'judge', value: obj.value }
  }

  if (qtype === 'application') {
    return parseApplicationUserAnswer(obj)
  }

  assertNoUnknownKeys(obj, ['kind', 'input'], 'numeric')
  if (typeof obj.input !== 'string') {
    throw new BadRequestException('numeric 作答 input 必须为字符串')
  }
  return { kind: 'numeric', input: obj.input }
}

function assertNoUnknownKeys(
  obj: Record<string, unknown>,
  allowed: string[],
  label: string,
) {
  const allow = new Set(allowed)
  for (const k of Object.keys(obj)) {
    if (!allow.has(k)) {
      throw new BadRequestException(`${label} 作答含未知字段：${k}`)
    }
  }
}

function parseApplicationUserAnswer(
  obj: Record<string, unknown>,
): HsMathApplicationUserAnswerPayload {
  assertNoUnknownKeys(
    obj,
    ['kind', 'text', 'imageIds', 'gradingProvider'],
    'application',
  )

  let text: string | undefined
  if (obj.text !== undefined) {
    if (typeof obj.text !== 'string') {
      throw new BadRequestException('application 作答 text 必须为字符串')
    }
    if (obj.text.length > HS_MATH_APPLICATION_TEXT_MAX_CHARS) {
      throw new BadRequestException(
        `application 作答 text 不能超过 ${HS_MATH_APPLICATION_TEXT_MAX_CHARS} 字符`,
      )
    }
    text = obj.text
  }

  let imageIds: string[] | undefined
  if (obj.imageIds !== undefined) {
    imageIds = normalizeImageIds(obj.imageIds)
  }

  const hasText = typeof text === 'string' && !!text.trim()
  const hasImages = Array.isArray(imageIds) && imageIds.length > 0
  if (!hasText && !hasImages) {
    throw new BadRequestException(
      'application 作答不能为空（需文字或至少一张图片）',
    )
  }

  const gradingProvider = normalizeGradingProvider(obj.gradingProvider)

  const out: HsMathApplicationUserAnswerPayload = {
    kind: 'application',
    gradingProvider,
  }
  if (hasText) {
    out.text = text
  }
  if (hasImages) {
    out.imageIds = imageIds
  }
  return out
}

/** 缺省 → qwen；非法 → 400 */
export function normalizeGradingProvider(
  raw: unknown,
): HsMathGradingProvider {
  if (raw === undefined || raw === null || raw === '') {
    return HS_MATH_GRADING_PROVIDER_DEFAULT
  }
  if (typeof raw !== 'string') {
    throw new BadRequestException('gradingProvider 必须为字符串')
  }
  const v = raw.trim().toLowerCase()
  if (!(HS_MATH_GRADING_PROVIDERS as readonly string[]).includes(v)) {
    throw new BadRequestException(
      `gradingProvider 必须为 ${HS_MATH_GRADING_PROVIDERS.join(' | ')}`,
    )
  }
  return v as HsMathGradingProvider
}

/** 读取已存答案的 provider（旧数据无字段 → qwen，不改写库） */
export function resolveGradingProviderFromAnswer(
  user: { gradingProvider?: string } | null | undefined,
): HsMathGradingProvider {
  const raw = user?.gradingProvider
  if (raw === 'deepseek' || raw === 'qwen') return raw
  return HS_MATH_GRADING_PROVIDER_DEFAULT
}

/** 接受 number[] / 数字字符串[]，规范为十进制字符串 id，最多 5、唯一、正整数 */
export function normalizeImageIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    throw new BadRequestException('imageIds 必须为数组')
  }
  if (raw.length > HS_MATH_APPLICATION_IMAGE_MAX_COUNT) {
    throw new BadRequestException(
      `imageIds 最多 ${HS_MATH_APPLICATION_IMAGE_MAX_COUNT} 个`,
    )
  }
  const ids: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    let id: string
    if (typeof item === 'number') {
      if (!Number.isInteger(item) || item <= 0 || !Number.isSafeInteger(item)) {
        throw new BadRequestException('imageIds 必须为正整数')
      }
      id = String(item)
    } else if (typeof item === 'string') {
      const t = item.trim()
      if (!/^[1-9]\d*$/.test(t)) {
        throw new BadRequestException('imageIds 必须为正整数')
      }
      id = t
    } else {
      throw new BadRequestException('imageIds 必须为正整数')
    }
    if (seen.has(id)) {
      throw new BadRequestException('imageIds 不可重复')
    }
    seen.add(id)
    ids.push(id)
  }
  return ids
}
