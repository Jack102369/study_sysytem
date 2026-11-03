import katex from 'katex'
import 'katex/dist/katex.min.css'

/** OCR 偶发 $m\_1$；下标应写作 $m_1$ */
export function normalizeOcrLatexEscapes(raw: string): string {
  const text = String(raw || '')
  if (!text) return ''
  const fixSeg = (s: string) => s.replace(/\\_/g, '_')
  return text.replace(
    /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g,
    (_full, display: string | undefined, inline: string | undefined) => {
      if (display != null) return `$$${fixSeg(display)}$$`
      return `$${fixSeg(inline || '')}$`
    },
  )
}

/**
 * 命令名后可能直接跟 _ 下标（如 \\mu_2），不能用 \\b（_ 也是单词字符）。
 * 允许紧跟 0~2 个 {…} 参数（\\frac{a}{b}）。
 */
const CMD_AT =
  /^\\[a-zA-Z]+(?![a-zA-Z])(?:[ \t]*\{[^{}]*\}){0,2}/

const CMD_GLOBAL = /\\[a-zA-Z]+(?![a-zA-Z])/g

function isMathyChar(ch: string): boolean {
  return /[0-9A-Za-z+\-*/=<>()[\].,:_^{}|]/.test(ch)
}

/** 从 \\command 向两侧扩展，得到应包进 $...$ 的区间 */
function findBareLatexRanges(plain: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  const cmdRe = new RegExp(CMD_GLOBAL.source, 'g')
  let m: RegExpExecArray | null
  while ((m = cmdRe.exec(plain))) {
    let start = m.index
    let end = m.index + m[0].length
    const fullCmd = CMD_AT.exec(plain.slice(m.index))
    if (fullCmd) end = m.index + fullCmd[0].length

    // 向左：运算符/括号/数字字母；越过空白吞标识符；务必吃掉命令前的 \
    for (;;) {
      while (start > 0 && isMathyChar(plain[start - 1]!)) start--
      if (start > 0 && plain[start - 1] === '\\') {
        start--
        continue
      }
      if (start > 0 && /[ \t]/.test(plain[start - 1]!)) {
        let j = start - 1
        while (j >= 0 && /[ \t]/.test(plain[j]!)) j--
        // 含 = 以便收进 f_{block} = \frac{...}
        if (j >= 0 && /[A-Za-z0-9=+\-*/)\]}\\]/.test(plain[j]!)) {
          start = j
          continue
        }
      }
      break
    }

    // 向右：数学字符、空白后的后续 \\command / 标识符
    for (;;) {
      while (end < plain.length && isMathyChar(plain[end]!)) end++
      if (end < plain.length && plain[end] === '\\') {
        const more = CMD_AT.exec(plain.slice(end))
        if (more) {
          end += more[0].length
          continue
        }
        break
      }
      if (end < plain.length && /[ \t]/.test(plain[end]!)) {
        let j = end
        while (j < plain.length && /[ \t]/.test(plain[j]!)) j++
        if (j < plain.length && plain[j] === '\\') {
          const more = CMD_AT.exec(plain.slice(j))
          if (more) {
            end = j + more[0].length
            continue
          }
        }
        if (j < plain.length && /[0-9A-Za-z(]/.test(plain[j]!)) {
          end = j
          continue
        }
      }
      break
    }

    ranges.push([start, end])
    cmdRe.lastIndex = Math.max(cmdRe.lastIndex, end)
  }

  if (!ranges.length) return []
  ranges.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = [ranges[0]!]
  for (let i = 1; i < ranges.length; i++) {
    const cur = ranges[i]!
    const last = merged[merged.length - 1]!
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1])
    else merged.push(cur)
  }
  return merged
}

function wrapBareLatexInPlain(plain: string): string {
  if (!/\\[a-zA-Z]+/.test(plain)) return plain
  const ranges = findBareLatexRanges(plain)
  if (!ranges.length) return plain
  let out = ''
  let last = 0
  for (const [start, end] of ranges) {
    out += plain.slice(last, start)
    const core = plain.slice(start, end).trim()
    if (core) out += `$${core}$`
    else out += plain.slice(start, end)
    last = end
  }
  out += plain.slice(last)
  return out
}

/**
 * AI 解答常输出裸 LaTeX（如 m \\in、\\sqrt{2}）而无 $...$。
 * 在非数学片段中，把含 \\command 的数学串自动包成 $...$。
 */
export function wrapBareLatexSegments(raw: string): string {
  const text = String(raw || '')
  if (!text.includes('\\')) return text

  const PH = '\uE000'
  const held: string[] = []
  const protectedText = text.replace(
    /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g,
    (m) => {
      held.push(m)
      return `${PH}${held.length - 1}${PH}`
    },
  )

  // 按行处理，避免跨行误包；分号分段避免整行粘连
  const wrapped = protectedText
    .split(/(\n)/)
    .map((line) => {
      if (line === '\n') return line
      return line
        .split(/(;)/)
        .map((part) => (part === ';' ? part : wrapBareLatexInPlain(part)))
        .join('')
    })
    .join('')

  return wrapped.replace(new RegExp(`${PH}(\\d+)${PH}`, 'g'), (_, i: string) => {
    return held[Number(i)] ?? ''
  })
}

/** 将文本中的 $...$ / $$...$$ 渲染为 HTML（其余转义） */
export function renderMathHtml(raw: string): string {
  const text = normalizeOcrLatexEscapes(
    wrapBareLatexSegments(String(raw || '')),
  )
  if (!text) return ''

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const parts: string[] = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    parts.push(escapeHtml(text.slice(last, m.index)).replace(/\n/g, '<br/>'))
    const display = m[1] != null
    const latex = (display ? m[1] : m[2] || '').trim()
    try {
      parts.push(
        katex.renderToString(latex, {
          throwOnError: false,
          displayMode: display,
        }),
      )
    } catch {
      parts.push(escapeHtml(m[0]))
    }
    last = m.index + m[0].length
  }
  parts.push(escapeHtml(text.slice(last)).replace(/\n/g, '<br/>'))
  return parts.join('')
}
