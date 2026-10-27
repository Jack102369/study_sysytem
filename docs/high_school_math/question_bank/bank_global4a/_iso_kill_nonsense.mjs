/**
 * Kill remaining nonsense / wrong-chapter templates in one pass.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { normStem, normExact, CRUTCH_RE } from './_rebuild_core.mjs'
import { buildDistinct } from './_iso_distinct_pool.mjs'
import { buildEmergency } from './_iso_emergency.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const priorStruct = new Set((prior.stemsNorm || []).map((s) => normStem(s)))
const priorExact = new Set((prior.stemsNorm || []).map((s) => normExact(s)))

const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))

function isNonsense(c) {
  const st = String(c.stem)
  if (/已知参数\s*\$?p/.test(st) && /个位数/.test(st)) return true
  if (/多选；章\s*\d/.test(st) || /章\s*\d\s*专项/.test(st)) return true
  if (/研究需要/.test(st)) return true
  if (/正整数参数\s*\$?k/.test(st) && /则\s*\$?k\+/.test(st)) return true
  if (/整数\s*\$?\d+\s*与\s*\$?\d+\s*的差等于/.test(st)) return true
  if (/n\^\{2\}-\(n-1\)\^\{2\}/.test(st)) return true
  // AM-GM x+k/x application parked on non-ch2
  if (c.qtype === 'application' && c.chapterNo !== 2 && /目标式\s*\$x\+\\dfrac\{/.test(st)) return true
  if (c.qtype === 'application' && c.chapterNo !== 2 && /（章\s*\d）已知正实数/.test(st)) return true
  // vector |u+v|^2 on non-ch6
  if (c.chapterNo !== 6 && /\\vec [uvpq]/.test(st) && /\|\\vec.+\+\\vec.+ \|\^\{2\}/.test(st.replace(/\s/g, ''))) return true
  if (c.chapterNo !== 6 && /设\s*\$\|\\vec/.test(st) && /则\s*\$\|\\vec/.test(st)) return true
  return false
}

const usedStruct = new Set()
const usedExact = new Set(priorExact)
for (const p of prior.stemsNorm || []) usedStruct.add(normStem(p))
for (const c of candidates) {
  if (!isNonsense(c)) {
    usedStruct.add(`${c.chapterNo}|${normStem(c.stem)}`)
    usedExact.add(normExact(c.stem))
  }
}

const targets = candidates.filter(isNonsense)
console.log('nonsense targets', targets.length)

let replaced = 0
let failed = []
for (const c of targets) {
  const slot = {
    id: c.id,
    book: c.book,
    chapterNo: c.chapterNo,
    specialtyCode: c.specialtyCode,
    qtype: c.qtype,
    difficulty: c.difficulty,
    kpHint: { code: c.kpCode, name: c.kpName },
  }
  const raw = new Set(
    [...usedStruct]
      .filter((k) => k.startsWith(`${c.chapterNo}|`) || !k.includes('|'))
      .map((k) => k.replace(/^\d+\|/, '')),
  )
  // also block prior structs
  for (const p of priorStruct) raw.add(p)

  let r = null
  for (let s = 0; s < 12 && !r; s++) {
    r = buildDistinct(slot, parseInt(c.id.slice(-3), 10) + s * 17, raw, usedExact)
    if (r && (usedStruct.has(`${c.chapterNo}|${normStem(r.item.stem)}`) || priorStruct.has(normStem(r.item.stem)))) r = null
  }
  for (let s = 0; s < 20 && !r; s++) {
    r = buildEmergency(slot, parseInt(c.id.slice(-3), 10) + s * 23, raw, usedExact)
    if (r && (usedStruct.has(`${c.chapterNo}|${normStem(r.item.stem)}`) || priorStruct.has(normStem(r.item.stem)))) r = null
  }
  if (!r || CRUTCH_RE.test(r.item.stem)) {
    failed.push(c.id)
    continue
  }
  r.item.id = c.id
  r.item.chapterNo = c.chapterNo
  r.item.specialtyCode = c.specialtyCode
  r.item.kpCode = c.kpCode
  r.item.kpName = c.kpName
  r.item.qtype = c.qtype
  r.item.difficulty = c.difficulty
  r.item.book = c.book
  Object.assign(c, r.item)
  usedStruct.add(`${c.chapterNo}|${normStem(c.stem)}`)
  usedExact.add(normExact(c.stem))
  raw.add(normStem(c.stem))
  replaced++
}

candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`,
  )
}
fs.writeFileSync(
  path.join(root, 'candidates-g4a-500.mjs'),
  `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`,
)

const left = candidates.filter(isNonsense).map((c) => c.id)
const chMap = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!chMap.has(k)) chMap.set(k, [])
  chMap.get(k).push(c.id)
}
const fams = [...chMap.values()].filter((ids) => ids.length >= 2)
const ph = candidates.filter((c) => priorStruct.has(normStem(c.stem))).map((c) => c.id)
console.log(
  JSON.stringify(
    {
      replaced,
      failed: failed.length,
      failedIds: failed.slice(0, 30),
      nonsenseLeft: left.length,
      chapterFamilies: fams.length,
      chapterFamilyMembers: new Set(fams.flat()).size,
      priorHits: ph,
      crutch: candidates.filter((c) => CRUTCH_RE.test(c.stem)).length,
    },
    null,
    2,
  ),
)
