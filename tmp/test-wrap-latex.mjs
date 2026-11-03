const CMD_AT = /^\\[a-zA-Z]+\b(?:[ \t]*\{[^{}]*\}){0,2}/

function isMathyChar(ch) {
  return /[0-9A-Za-z+\-*/=<>()[\].,:_^{}|]/.test(ch)
}

function findBareLatexRanges(plain) {
  const ranges = []
  const cmdRe = /\\[a-zA-Z]+\b/g
  let m
  while ((m = cmdRe.exec(plain))) {
    let start = m.index
    let end = m.index + m[0].length
    const fullCmd = CMD_AT.exec(plain.slice(m.index))
    if (fullCmd) end = m.index + fullCmd[0].length

    for (;;) {
      while (start > 0 && isMathyChar(plain[start - 1])) start--
      if (start > 0 && /[ \t]/.test(plain[start - 1])) {
        let j = start - 1
        while (j >= 0 && /[ \t]/.test(plain[j])) j--
        if (j >= 0 && /[A-Za-z0-9)\]}]/.test(plain[j])) {
          start = j
          while (start > 0 && isMathyChar(plain[start - 1])) start--
          continue
        }
      }
      break
    }

    for (;;) {
      while (end < plain.length && isMathyChar(plain[end])) end++
      if (end < plain.length && /[ \t]/.test(plain[end])) {
        let j = end
        while (j < plain.length && /[ \t]/.test(plain[j])) j++
        if (j < plain.length && plain[j] === '\\') {
          const more = CMD_AT.exec(plain.slice(j))
          if (more) {
            end = j + more[0].length
            continue
          }
        }
        if (j < plain.length && /[0-9A-Za-z(]/.test(plain[j])) {
          end = j
          continue
        }
      }
      if (end < plain.length && plain[end] === '\\') {
        const more = CMD_AT.exec(plain.slice(end))
        if (more) {
          end += more[0].length
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
  const merged = [ranges[0]]
  for (let i = 1; i < ranges.length; i++) {
    const cur = ranges[i]
    const last = merged[merged.length - 1]
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1])
    else merged.push(cur)
  }
  return merged
}

function wrapBareLatexInPlain(plain) {
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

function wrapBareLatexSegments(raw) {
  const text = String(raw || '')
  if (!text.includes('\\')) return text
  const PH = '\uE000'
  const held = []
  const protectedText = text.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, (m) => {
    held.push(m)
    return `${PH}${held.length - 1}${PH}`
  })
  const wrapped = protectedText
    .split(/(\n)/)
    .map((part) => (part === '\n' ? part : wrapBareLatexInPlain(part)))
    .join('')
  return wrapped.replace(new RegExp(`${PH}(\\d+)${PH}`, 'g'), (_, i) => {
    return held[Number(i)] ?? ''
  })
}

const samples = [
  '(1) (0,1); (2) m \\in (0, 2-\\sqrt{2}]',
  '对称中心为 (-1,-1)。其中 m \\in (0,1]',
  'already $m \\in [0,1]$ ok',
  'no math here',
  'f(x)=\\frac{1}{a}+\\sqrt{2}',
]

for (const s of samples) {
  console.log('IN ', s)
  console.log('OUT', wrapBareLatexSegments(s))
  console.log('---')
}
