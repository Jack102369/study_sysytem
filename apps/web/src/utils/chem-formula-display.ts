/** 前端化学式规范显示（与后端规则对齐的轻量版） */

const SUB: Record<string, string> = {
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
const SUP: Record<string, string> = {
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

function toAscii(s: string): string {
  return s
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => SUB_TO_ASCII[c] || c)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, (c) => SUP_TO_ASCII[c] || c)
}

function toSub(digits: string): string {
  return digits
    .split('')
    .map((d) => SUB[d] || d)
    .join('')
}

function toSup(chars: string): string {
  return chars
    .split('')
    .map((c) => SUP[c] || c)
    .join('')
}

export function formatChemFormulaDisplay(raw: string): string {
  let s = String(raw ?? '').trim()
  if (!s) return s
  s = s.replace(/\^\{?(\d+)\}?([+-])/g, '$1$2').replace(/\^([+-])/g, '$1')
  s = toAscii(s)

  let body = s
  let charge = ''
  // 优先带数字的电荷（2-），再试单独 +/-；主体可以下标数字结尾（SO4）
  if (/[+-]$/.test(s)) {
    for (const re of [/^(.*)(\d[+-])$/, /^(.*)([+-])$/]) {
      const m = s.match(re)
      if (m && m[1] && /[A-Za-z0-9)]$/.test(m[1])) {
        body = m[1]
        charge = m[2]
        break
      }
    }
  }

  let out = ''
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (/\d/.test(ch)) {
      let j = i
      while (j < body.length && /\d/.test(body[j])) j++
      const digits = body.slice(i, j)
      const prev = out.slice(-1)
      out += /[a-zA-Z)]/.test(prev) ? toSub(digits) : digits
      i = j - 1
      continue
    }
    out += ch
  }
  if (charge) out += toSup(charge)
  return out
}

export function formatChemTextDisplay(raw: string): string {
  const text = String(raw ?? '')
  if (!text) return text
  const parts = text.split(/(\s*(?:→|⟶|⇌|↔|=)\s*|\s*\+\s*)/)
  return parts
    .map((part) => {
      if (!part) return part
      if (/^(?:\s*(?:→|⟶|⇌|↔|=)\s*|\s*\+\s*)$/.test(part)) return part
      const token = part.trim()
      const m = token.match(/^(\d+)([A-Z(].*)$/)
      if (m) return m[1] + formatChemFormulaDisplay(m[2])
      if (token.length <= 40 && /[A-Za-z]/.test(token) && /^[A-Za-z0-9()^+−\-⁻⁺₀-₉\s]+$/.test(token)) {
        return formatChemFormulaDisplay(token)
      }
      return part
    })
    .join('')
}

/** 预览：不改正大小写，仅做下标/电荷显示尝试 */
export function previewChemFormulaInput(raw: string): string {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  return formatChemFormulaDisplay(s)
}
