import type { HsMathGradeResult, HsMathQtype } from '../hs-math.constants'
import type {
  HsMathAnswerPayload,
  HsMathOptionsJson,
  HsMathUserAnswerPayload,
} from '../types/answer-protocol'

export type HsMathGradeOutput = {
  result: HsMathGradeResult
  reason?: string
}

export type HsMathGradeInput = {
  qtype: HsMathQtype
  optionsJson: HsMathOptionsJson | null
  standard: HsMathAnswerPayload | null | undefined
  user: HsMathUserAnswerPayload | null | undefined
}

/** 有理数：n/d，d>0；符号在 n */
type Rational = { n: bigint; d: bigint }

const MAX_DECIMAL_PLACES = 8
/** 超出后 Number 不可靠 → pending_review */
const MAX_ABS_NUMERATOR = 10n ** 15n

function pending(reason: string): HsMathGradeOutput {
  return { result: 'pending_review', reason }
}

function pendingAi(reason: string): HsMathGradeOutput {
  return { result: 'pending_ai', reason }
}

function correct(): HsMathGradeOutput {
  return { result: 'correct' }
}

function wrong(reason?: string): HsMathGradeOutput {
  return { result: 'wrong', reason }
}

function optionIdSet(optionsJson: HsMathOptionsJson | null): Set<string> {
  return new Set((optionsJson?.options ?? []).map((o) => o.id))
}

function gcdBig(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) {
    const t = x % y
    x = y
    y = t
  }
  return x
}

function simplify(n: bigint, d: bigint): Rational {
  if (d < 0n) {
    n = -n
    d = -d
  }
  if (d === 0n) throw new Error('den0')
  const g = gcdBig(n, d)
  return { n: n / g, d: d / g }
}

/**
 * 解析 numeric 字符串为有理数。
 * 支持：整数、小数（≤8位）、简单分数 a/b、可选 +/-。
 * 拒绝：科学计数法、空、非法、Infinity/NaN。
 */
export function parseNumericToRational(
  raw: string,
): { ok: true; value: Rational } | { ok: false; reason: string } {
  const s = String(raw ?? '').trim()
  if (!s) return { ok: false, reason: 'empty' }
  if (/[eE]/.test(s)) return { ok: false, reason: 'scientific_notation' }
  if (!/^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/.test(s)) {
    return { ok: false, reason: 'invalid_format' }
  }

  let sign = 1n
  let body = s
  if (body[0] === '+' || body[0] === '-') {
    if (body[0] === '-') sign = -1n
    body = body.slice(1)
  }

  try {
    if (body.includes('/')) {
      const [a, b] = body.split('/')
      if (!b || !/^\d+$/.test(a) || !/^\d+$/.test(b)) {
        return { ok: false, reason: 'invalid_fraction' }
      }
      const den = BigInt(b)
      if (den === 0n) return { ok: false, reason: 'zero_denominator' }
      const num = sign * BigInt(a)
      return { ok: true, value: simplify(num, den) }
    }

    if (body.includes('.')) {
      const [intPart, fracPart = ''] = body.split('.')
      if (fracPart.length > MAX_DECIMAL_PLACES) {
        return { ok: false, reason: 'too_many_decimals' }
      }
      const digits = `${intPart || '0'}${fracPart}`
      if (!/^\d+$/.test(digits)) return { ok: false, reason: 'invalid_format' }
      const den = 10n ** BigInt(fracPart.length)
      const num = sign * BigInt(digits)
      return { ok: true, value: simplify(num, den) }
    }

    if (!/^\d+$/.test(body)) return { ok: false, reason: 'invalid_format' }
    return { ok: true, value: simplify(sign * BigInt(body), 1n) }
  } catch {
    return { ok: false, reason: 'parse_error' }
  }
}

function rationalAbs(r: Rational): Rational {
  return { n: r.n < 0n ? -r.n : r.n, d: r.d }
}

function rationalEquals(a: Rational, b: Rational): boolean {
  return a.n * b.d === b.n * a.d
}

/** 转 Number；超出可靠范围返回 null */
function rationalToNumber(r: Rational): number | null {
  if (r.n > MAX_ABS_NUMERATOR || r.n < -MAX_ABS_NUMERATOR) return null
  if (r.d > MAX_ABS_NUMERATOR) return null
  const v = Number(r.n) / Number(r.d)
  if (!Number.isFinite(v)) return null
  return v
}

function gradeSingle(input: HsMathGradeInput): HsMathGradeOutput {
  const std = input.standard
  if (!std || std.kind !== 'single') {
    return pending('invalid_standard')
  }
  const ids = optionIdSet(input.optionsJson)
  if (!ids.has(std.optionId)) return pending('invalid_standard_option')

  const user = input.user
  if (!user || user.kind !== 'single') return pending('unanswered')
  if (typeof user.optionId !== 'string' || !user.optionId.trim()) {
    return pending('unanswered')
  }
  if (!ids.has(user.optionId)) return pending('invalid_option_id')
  return user.optionId === std.optionId ? correct() : wrong('option_mismatch')
}

function gradeMulti(input: HsMathGradeInput): HsMathGradeOutput {
  const std = input.standard
  if (!std || std.kind !== 'multi') return pending('invalid_standard')
  const ids = optionIdSet(input.optionsJson)
  for (const id of std.optionIds) {
    if (!ids.has(id)) return pending('invalid_standard_option')
  }

  const user = input.user
  if (!user || user.kind !== 'multi') return pending('unanswered')
  if (!Array.isArray(user.optionIds) || user.optionIds.length === 0) {
    return pending('unanswered')
  }

  // 04 定稿：去重后比较；含无效 id → pending
  const deduped: string[] = []
  const seen = new Set<string>()
  for (const id of user.optionIds) {
    if (typeof id !== 'string' || !id.trim()) return pending('invalid_option_id')
    if (!ids.has(id)) return pending('invalid_option_id')
    if (seen.has(id)) continue
    seen.add(id)
    deduped.push(id)
  }

  const stdSet = new Set(std.optionIds)
  if (deduped.length !== stdSet.size) return wrong('set_mismatch')
  for (const id of deduped) {
    if (!stdSet.has(id)) return wrong('set_mismatch')
  }
  return correct()
}

function gradeJudge(input: HsMathGradeInput): HsMathGradeOutput {
  const std = input.standard
  if (!std || std.kind !== 'judge') return pending('invalid_standard')
  if (typeof std.value !== 'boolean') return pending('invalid_standard')

  const user = input.user
  if (!user || user.kind !== 'judge') return pending('unanswered')
  if (typeof user.value !== 'boolean') return pending('invalid_type')
  return user.value === std.value ? correct() : wrong('value_mismatch')
}

function gradeNumeric(input: HsMathGradeInput): HsMathGradeOutput {
  const std = input.standard
  if (!std || std.kind !== 'numeric') return pending('invalid_standard')
  if (typeof std.value !== 'string') return pending('invalid_standard')

  const sParsed = parseNumericToRational(std.value)
  if (!sParsed.ok) return pending(`invalid_standard:${sParsed.reason}`)

  const tolAbs =
    typeof std.toleranceAbs === 'number' && Number.isFinite(std.toleranceAbs)
      ? std.toleranceAbs
      : 0
  const tolRel =
    typeof std.toleranceRel === 'number' && Number.isFinite(std.toleranceRel)
      ? std.toleranceRel
      : 0
  if (tolAbs < 0 || tolRel < 0) return pending('invalid_tolerance')

  const user = input.user
  if (!user || user.kind !== 'numeric') return pending('unanswered')
  if (typeof user.input !== 'string') return pending('invalid_type')
  const trimmed = user.input.trim()
  if (!trimmed) return pending('unanswered')

  const uParsed = parseNumericToRational(trimmed)
  if (!uParsed.ok) return pending(uParsed.reason)

  // 精确相等且无容差
  if (tolAbs === 0 && tolRel === 0) {
    return rationalEquals(sParsed.value, uParsed.value)
      ? correct()
      : wrong('numeric_mismatch')
  }

  const sNum = rationalToNumber(sParsed.value)
  const uNum = rationalToNumber(uParsed.value)
  if (sNum === null || uNum === null) {
    return pending('out_of_safe_range')
  }

  const diff = Math.abs(uNum - sNum)
  // 浮点边界：允许极小 ulp 误差，避免 1.1-1.0 > 0.1 这类假阴性
  const eps = 1e-12 * Math.max(1, Math.abs(sNum), Math.abs(uNum), Math.abs(tolAbs))
  const absOk = diff <= tolAbs + eps
  const relBound = tolRel * Math.max(Math.abs(sNum), Math.abs(uNum))
  const relOk = tolRel > 0 && diff <= relBound + eps
  // 04：diff <= tolAbs OR (tolRel>0 AND diff <= tolRel * max(|S|,|U|))
  if (absOk || relOk) return correct()
  return wrong('numeric_mismatch')
}

/**
 * 应用题：不调用字符串比对，不伪造分数（APPLICATION-1/2C）。
 * 有效文字或有效 imageIds → pending_ai；否则 pending_ai + unanswered（不计 wrong）。
 */
function gradeApplication(input: HsMathGradeInput): HsMathGradeOutput {
  const std = input.standard
  if (!std || std.kind !== 'application') {
    return pendingAi('invalid_standard')
  }
  const user = input.user
  if (!user || user.kind !== 'application') {
    return pendingAi('unanswered')
  }
  if (!hasApplicationContent(user)) {
    return pendingAi('unanswered')
  }
  return pendingAi('awaiting_ai')
}

function hasApplicationContent(user: {
  text?: string
  imageIds?: string[]
}): boolean {
  if (typeof user.text === 'string' && !!user.text.trim()) return true
  return Array.isArray(user.imageIds) && user.imageIds.length > 0
}

/** 纯函数判题：与 DB 无关 */
export function gradeHsMathAnswer(input: HsMathGradeInput): HsMathGradeOutput {
  if (!input.qtype) return pending('missing_qtype')
  switch (input.qtype) {
    case 'single':
      return gradeSingle(input)
    case 'multi':
      return gradeMulti(input)
    case 'judge':
      return gradeJudge(input)
    case 'numeric':
      return gradeNumeric(input)
    case 'application':
      return gradeApplication(input)
    default:
      return pending('unsupported_qtype')
  }
}

/** 是否视为「已作答」（用于 answered_count；与 grade 的 unanswered 略有不同：非法也算尝试过） */
export function hasUserAnswerPayload(
  user: HsMathUserAnswerPayload | null | undefined,
): boolean {
  if (!user || typeof user !== 'object') return false
  if (user.kind === 'single') {
    return typeof user.optionId === 'string' && !!user.optionId.trim()
  }
  if (user.kind === 'multi') {
    return Array.isArray(user.optionIds) && user.optionIds.length > 0
  }
  if (user.kind === 'judge') {
    return typeof user.value === 'boolean'
  }
  if (user.kind === 'numeric') {
    return typeof user.input === 'string' && !!user.input.trim()
  }
  if (user.kind === 'application') {
    if (typeof user.text === 'string' && !!user.text.trim()) return true
    return Array.isArray(user.imageIds) && user.imageIds.length > 0
  }
  return false
}
