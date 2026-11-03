import fs from 'fs'
import { createRequire } from 'module'

const require = createRequire(new URL('../apps/web/package.json', import.meta.url))
const katex = require('katex')
const mysql = createRequire(new URL('../apps/api/package.json', import.meta.url))(
  'mysql2/promise',
)

const CMD_AT = /^\\[a-zA-Z]+(?![a-zA-Z])(?:[ \t]*\{[^{}]*\}){0,2}/
const CMD_GLOBAL = /\\[a-zA-Z]+(?![a-zA-Z])/g

function isMathyChar(ch) {
  return /[0-9A-Za-z+\-*/=<>()[\].,:_^{}|]/.test(ch)
}

function findBareLatexRanges(plain) {
  const ranges = []
  const cmdRe = new RegExp(CMD_GLOBAL.source, 'g')
  let m
  while ((m = cmdRe.exec(plain))) {
    let start = m.index
    let end = m.index + m[0].length
    const fullCmd = CMD_AT.exec(plain.slice(m.index))
    if (fullCmd) end = m.index + fullCmd[0].length
    for (;;) {
      while (start > 0 && isMathyChar(plain[start - 1])) start--
      if (start > 0 && plain[start - 1] === '\\') {
        start--
        continue
      }
      if (start > 0 && /[ \t]/.test(plain[start - 1])) {
        let j = start - 1
        while (j >= 0 && /[ \t]/.test(plain[j])) j--
        if (j >= 0 && /[A-Za-z0-9=+\-*/)\]}\\]/.test(plain[j])) {
          start = j
          continue
        }
      }
      break
    }
    for (;;) {
      while (end < plain.length && isMathyChar(plain[end])) end++
      if (end < plain.length && plain[end] === '\\') {
        const more = CMD_AT.exec(plain.slice(end))
        if (more) {
          end += more[0].length
          continue
        }
        break
      }
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
    .map((line) => {
      if (line === '\n') return line
      return line
        .split(/(;)/)
        .map((part) => (part === ';' ? part : wrapBareLatexInPlain(part)))
        .join('')
    })
    .join('')
  return wrapped.replace(new RegExp(`${PH}(\\d+)${PH}`, 'g'), (_, i) => held[Number(i)] ?? '')
}

function loadEnv(file) {
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1)
    env[line.slice(0, i).trim()] = v
  }
  return env
}

const env = loadEnv('apps/api/.env')
const conn = await mysql.createConnection({
  host: '127.0.0.1',
  user: 'study_user',
  password: env.DB_PASSWORD,
  database: 'study_system',
})
const [rows] = await conn.query('SELECT ai_answer_text FROM ai_ocr_analyses WHERE id=24')
await conn.end()
const ans = String(rows[0].ai_answer_text)
const wrapped = wrapBareLatexSegments(ans)
console.log('IN ', ans)
console.log('OUT', wrapped)

const re = /\$([^$]+)\$/g
let mm
let fail = 0
while ((mm = re.exec(wrapped))) {
  try {
    katex.renderToString(mm[1], { throwOnError: true })
    console.log('OK ', mm[1].slice(0, 70))
  } catch (e) {
    fail++
    console.log('FAIL', mm[1].slice(0, 70), e.message)
  }
}
console.log('raw leftover', wrapped.replace(/\$[^$]+\$/g, '§').includes('\\'))
process.exit(fail ? 1 : 0)
