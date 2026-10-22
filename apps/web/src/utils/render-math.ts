import katex from 'katex'
import 'katex/dist/katex.min.css'

/** 将文本中的 $...$ / $$...$$ 渲染为 HTML（其余转义） */
export function renderMathHtml(raw: string): string {
  const text = String(raw || '')
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
