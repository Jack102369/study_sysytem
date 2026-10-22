/**
 * 化学式规范化显示与判题辅助。
 * - 比较：Unicode 下标 ↔ ASCII 数字等价；保留元素大小写
 * - 显示：公式内下标、电荷上标；反应系数不转下标
 * - 本阶段不做完整离子/方程式判题
 */

const SUB_TO_ASCII: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
}
const ASCII_TO_SUB: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
}
const SUP_TO_ASCII: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '-',
}
const ASCII_TO_SUP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
}

export type TrainAnswerType =
  | 'text'
  | 'chem_formula'
  | 'equation'
  | 'ionic'
  | 'numeric'

export function normalizeAnswerType(raw: unknown): TrainAnswerType {
  const s = String(raw || 'text').trim().toLowerCase()
  if (
    s === 'chem_formula' ||
    s === 'equation' ||
    s === 'ionic' ||
    s === 'numeric'
  ) {
    return s
  }
  return 'text'
}

/** 下标数字 → ASCII（比较用） */
export function subscriptsToAscii(s: string): string {
  return String(s ?? '').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUB_TO_ASCII[ch] || ch)
}

/** ASCII 数字 → 下标 */
export function asciiToSubscripts(digits: string): string {
  return String(digits ?? '')
    .split('')
    .map((d) => ASCII_TO_SUB[d] || d)
    .join('')
}

function superscriptsToAscii(s: string): string {
  return String(s ?? '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, (ch) => SUP_TO_ASCII[ch] || ch)
}

function asciiToSuperscripts(chars: string): string {
  return String(chars ?? '')
    .split('')
    .map((c) => ASCII_TO_SUP[c] || c)
    .join('')
}

/**
 * 比较用规范化：去首尾空白与内部空格；下标/部分上标转 ASCII；
 * `^2-` 电荷写法转为 `2-`；**保留大小写**。
 */
export function normalizeFormulaForCompare(input: string): string {
  let s = String(input ?? '').trim().replace(/\s+/g, '')
  s = subscriptsToAscii(s)
  s = superscriptsToAscii(s)
  // SO4^2- / SO4^{2-} → SO42-
  s = s.replace(/\^\{?(\d+)\}?([+-])/g, '$1$2')
  s = s.replace(/\^([+-])/g, '$1')
  return s
}

/**
 * 合法化学式（可含括号与下标数字；可选末尾电荷 2+ / + / ^2-）。
 * 元素必须以大写开头。
 */
export function isValidChemFormula(input: string): boolean {
  const s = normalizeFormulaForCompare(input)
  if (!s || s.length > 80) return false

  // 拆可选电荷：高中常见为末尾 1 位数字 + ±-，或单独 +/-
  // 避免 SO42- 被拆成 body=SO / charge=42-
  const split = splitFormulaCharge(s)
  const body = split.body
  const charge = split.charge

  if (charge && !/^(\d?[+-]|[+-])$/.test(charge)) return false

  // 主体：原子团 + 括号
  // 例：H2O, Ca(OH)2, Al2(SO4)3, CuSO4
  const atom = '(?:[A-Z][a-z]?)'
  const unit = `(?:${atom}\\d*)`
  const group = `(?:\\(${unit}+\\)\\d*)`
  const bodyRe = new RegExp(`^(?:${unit}|${group})+$`)
  if (!bodyRe.test(body)) return false
  // 拒绝全小写伪装
  if (!/[A-Z]/.test(body)) return false
  return true
}

/** 分离化学式主体与末尾电荷（电荷数字最多 1 位；优先带数字的电荷） */
function splitFormulaCharge(s: string): { body: string; charge: string } {
  if (!/[+-]$/.test(s)) return { body: s, charge: '' }
  // 先试 2- / 3+，再试单独 +/-（避免 SO42- 被拆成 body=SO42 charge=-）
  // 主体可合法以数字下标结尾（如 SO4），故允许 [A-Za-z0-9)]
  for (const re of [/^(.*)(\d[+-])$/, /^(.*)([+-])$/]) {
    const m = s.match(re)
    if (m && m[1] && /[A-Za-z0-9)]$/.test(m[1])) {
      return { body: m[1], charge: m[2] }
    }
  }
  return { body: s, charge: '' }
}

function looksLikeChemAttempt(s: string): boolean {
  const n = normalizeFormulaForCompare(s)
  if (!n) return false
  // 含字母+数字或括号，像在写化学式
  return /[A-Za-z]/.test(n) && (/[0-9()]/.test(n) || n.length <= 12)
}

export type ChemFormulaGrade = {
  result: 'correct' | 'wrong' | 'pending_review'
  reason?: string
}

/**
 * 化学式专用判题（严格大小写；下标形式等价）。
 */
export function gradeChemFormula(input: {
  standardAnswer: string
  aliases?: string[]
  userAnswer: string
}): ChemFormulaGrade {
  const userRaw = String(input.userAnswer ?? '').trim()
  if (!userRaw) {
    return { result: 'pending_review', reason: '未作答' }
  }

  const candidates = [
    String(input.standardAnswer ?? '').trim(),
    ...(input.aliases || []).map((a) => String(a).trim()),
  ].filter(Boolean)

  if (!candidates.length) {
    return { result: 'pending_review', reason: '缺少标准答案' }
  }

  const uNorm = normalizeFormulaForCompare(userRaw)
  const candNorms = candidates.map((c) => ({
    raw: c,
    norm: normalizeFormulaForCompare(c),
  }))

  // 精确（下标规范化后、大小写敏感）
  if (candNorms.some((c) => c.norm === uNorm)) {
    return { result: 'correct' }
  }

  // 仅大小写不同 → 明确判错
  const caseFoldHit = candNorms.find(
    (c) => c.norm.toLowerCase() === uNorm.toLowerCase(),
  )
  if (caseFoldHit) {
    return {
      result: 'wrong',
      reason: `化学元素符号大小写不规范。标准答案应为 ${formatChemFormulaDisplay(caseFoldHit.raw)}（请注意 H/O 等元素首字母大写）。`,
    }
  }

  const userValid = isValidChemFormula(uNorm)
  const stdValid = candNorms.some((c) => isValidChemFormula(c.norm))

  if (userValid && stdValid) {
    return {
      result: 'wrong',
      reason: `答案与标准化学式不符。标准答案：${formatChemFormulaDisplay(candidates[0])}。`,
    }
  }

  // 可识别的非法尝试（如 h2o 已在大小写分支；纯乱码）
  if (!userValid && looksLikeChemAttempt(uNorm) && stdValid) {
    // 若无法可靠解析为合法式，但明显在写化学式且与标准无关
    // 对明显错误大小写组合已覆盖；其余非法结构：若与标准字母集合接近则 wrong，否则 pending
    const stdLetters = candNorms[0].norm.replace(/[^A-Za-z]/g, '').toLowerCase()
    const userLetters = uNorm.replace(/[^A-Za-z]/g, '').toLowerCase()
    if (stdLetters && userLetters === stdLetters) {
      return {
        result: 'wrong',
        reason: `化学式书写不规范。标准答案：${formatChemFormulaDisplay(candidates[0])}。`,
      }
    }
    if (userLetters && stdLetters && userLetters !== stdLetters) {
      return {
        result: 'wrong',
        reason: `不是正确的化学式。标准答案：${formatChemFormulaDisplay(candidates[0])}。`,
      }
    }
  }

  // 复杂/无法可靠解析 → 待复核
  if (!userValid) {
    return {
      result: 'pending_review',
      reason: '答案表达较复杂或无法用化学式规则可靠判定，已进入待复核。',
    }
  }

  return {
    result: 'wrong',
    reason: `答案不正确。标准答案：${formatChemFormulaDisplay(candidates[0])}。`,
  }
}

/**
 * 将单个化学式 token 格式化为规范显示（不含反应系数）。
 * 支持末尾电荷：Fe2+、SO4^2-
 */
export function formatChemFormulaDisplay(raw: string): string {
  let s = String(raw ?? '').trim()
  if (!s) return s

  // 统一 ^电荷
  s = s.replace(/\^\{?(\d+)\}?([+-])/g, '$1$2')
  s = s.replace(/\^([+-])/g, '$1')
  s = subscriptsToAscii(s)
  s = superscriptsToAscii(s)

  const { body, charge } = splitFormulaCharge(s)

  // 主体：元素后数字、)后数字 → 下标
  let out = ''
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (/\d/.test(ch)) {
      // 数字串
      let j = i
      while (j < body.length && /\d/.test(body[j])) j++
      const digits = body.slice(i, j)
      const prev = out.slice(-1)
      // 仅当跟在元素或 ) 后才下标
      if (/[a-zA-Z)]/.test(prev)) {
        out += asciiToSubscripts(digits)
      } else {
        out += digits
      }
      i = j - 1
      continue
    }
    out += ch
  }

  if (charge) {
    out += asciiToSuperscripts(charge)
  }
  return out
}

/**
 * 格式化可能含反应式的文本：系数不转下标。
 * 例：2H2 + O2 → 2H2O → 2H₂ + O₂ → 2H₂O
 */
export function formatChemTextDisplay(raw: string): string {
  const text = String(raw ?? '')
  if (!text) return text

  // 按反应箭头与加号切分，保留分隔符
  const parts = text.split(/(\s*(?:→|⟶|⇌|↔|=)\s*|\s*\+\s*)/)
  return parts
    .map((part) => {
      if (!part) return part
      if (/^(?:\s*(?:→|⟶|⇌|↔|=)\s*|\s*\+\s*)$/.test(part)) return part
      return formatFormulaTokenWithCoefficient(part.trim())
    })
    .join('')
}

function formatFormulaTokenWithCoefficient(token: string): string {
  if (!token) return token
  // 前导系数：纯数字开头且后面是大写字母或 (
  const m = token.match(/^(\d+)([A-Z(].*)$/)
  if (m) {
    return m[1] + formatChemFormulaDisplay(m[2])
  }
  // 若整段像化学式则格式化，否则原样（避免误伤普通中文）
  const norm = normalizeFormulaForCompare(token)
  if (isValidChemFormula(norm) || /^[A-Za-z0-9()^+−\-⁻⁺₀-₉]+$/.test(token)) {
    // 对「几乎是化学式」的短 token 尝试格式化
    if (token.length <= 40 && /[A-Za-z]/.test(token)) {
      return formatChemFormulaDisplay(token)
    }
  }
  return token
}
