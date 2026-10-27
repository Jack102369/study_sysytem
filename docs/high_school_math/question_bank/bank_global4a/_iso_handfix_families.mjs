/**
 * Keep first member of each remaining chapter-scoped family; rewrite the rest.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { baseItem, appRubric, normStem, CRUTCH_RE } from './_rebuild_core.mjs'
import { buildEmergency } from './_iso_emergency.mjs'
import { buildDistinct } from './_iso_distinct_pool.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const priorStruct = new Set((prior.stemsNorm || []).map((s) => normStem(s)))

const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const byId = new Map(candidates.map((c) => [c.id, c]))

const chMap = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!chMap.has(k)) chMap.set(k, [])
  chMap.get(k).push(c.id)
}
const families = [...chMap.values()].filter((ids) => ids.length >= 2)

const usedStruct = new Set()
const usedExact = new Set()
for (const c of candidates) {
  usedStruct.add(`${c.chapterNo}|${normStem(c.stem)}`)
  usedExact.add(c.stem)
}
for (const p of priorStruct) usedStruct.add(`prior|${p}`)

const discard = []
const keep = []
for (const ids of families) {
  // prefer keep difficulty 3 if any
  const sorted = [...ids].sort((a, b) => byId.get(b).difficulty - byId.get(a).difficulty || a.localeCompare(b))
  keep.push(sorted[0])
  discard.push(...sorted.slice(1))
}

console.log('families', families.length, 'keep', keep.length, 'discard', discard.length)

// free discard slots
for (const id of discard) {
  const c = byId.get(id)
  usedStruct.delete(`${c.chapterNo}|${normStem(c.stem)}`)
}

let replaced = 0
const failed = []
for (const id of discard) {
  const c = byId.get(id)
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
      .filter((k) => k.startsWith(`${c.chapterNo}|`) || k.startsWith('prior|'))
      .map((k) => k.replace(/^(?:\d+\||prior\|)/, '')),
  )
  let r = null
  for (let s = 0; s < 15 && !r; s++) {
    const cand = buildDistinct(slot, parseInt(id.slice(-3), 10) + 100 + s * 19, raw, usedExact)
    if (!cand) continue
    const st = normStem(cand.item.stem)
    if (usedStruct.has(`${c.chapterNo}|${st}`) || priorStruct.has(st) || CRUTCH_RE.test(cand.item.stem)) continue
    r = cand
  }
  for (let s = 0; s < 30 && !r; s++) {
    const cand = buildEmergency(slot, parseInt(id.slice(-3), 10) + 200 + s * 29, raw, usedExact)
    if (!cand) continue
    const st = normStem(cand.item.stem)
    if (usedStruct.has(`${c.chapterNo}|${st}`) || priorStruct.has(st) || CRUTCH_RE.test(cand.item.stem)) continue
    r = cand
  }
  if (!r) {
    failed.push(id)
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
  usedExact.add(normExactSafe(c.stem))
  raw.add(normStem(c.stem))
  replaced++
}

function normExactSafe(s) {
  return String(s || '')
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

// Manual uniques for any failures
const MANUAL = {
  'CAND-G4A-272': {
    qtype: 'application',
    sectionCode: '8.3',
    sectionName: '空间几何体的表面积与体积',
    stem: '正四面体棱长为 $2$。求其体积（可用公式 $V=\\dfrac{\\sqrt{2}}{12}a^{3}$）。写出代入过程与结果。',
    options: null,
    answer: '$V=\\dfrac{\\sqrt{2}}{3}$。',
    analysis: '代入 a=2。',
    authorMathNote: '√2/3',
    ...appRubric(
      [
        { key: 'p1', title: '公式', score: 4, criterion: '选用正确' },
        { key: 'p2', title: '计算', score: 4, criterion: '结果' },
      ],
      8,
    ),
  },
  'CAND-G4A-300': {
    qtype: 'application',
    sectionCode: '8.6',
    sectionName: '空间直线、平面的垂直',
    stem: '说明：若直线垂直于平面内两条相交直线，则可判定线面垂直。并举正方体中一例。',
    options: null,
    answer: '线面垂直判定定理；如 AA1⊥AB 且 AA1⊥AD。',
    analysis: '判定+例子。',
    authorMathNote: '判定',
    ...appRubric(
      [
        { key: 'p1', title: '定理', score: 4, criterion: '表述' },
        { key: 'p2', title: '例子', score: 4, criterion: '正方体' },
      ],
      8,
    ),
  },
}

for (const id of failed) {
  if (!MANUAL[id]) continue
  const c = byId.get(id)
  const slot = {
    id: c.id,
    book: c.book,
    chapterNo: c.chapterNo,
    specialtyCode: c.specialtyCode,
    qtype: c.qtype,
    difficulty: c.difficulty,
    kpHint: { code: c.kpCode, name: c.kpName },
  }
  const { item } = baseItem(slot, {
    ...MANUAL[id],
    sourceEvidence: '同构清理整题重设计；非高考真题',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
  }, { rebuildAction: 'iso_manual', dedupVerdict: 'DISTINCT' })
  Object.assign(c, item)
  replaced++
  failed.splice(failed.indexOf(id), 1)
}

candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(path.join(__dirname, `g4a_group0${g}.mjs`), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`)
}
fs.writeFileSync(path.join(root, 'candidates-g4a-500.mjs'), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`)

const chMap2 = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!chMap2.has(k)) chMap2.set(k, [])
  chMap2.get(k).push(c.id)
}
const fams2 = [...chMap2.values()].filter((ids) => ids.length >= 2)
const ph = candidates.filter((c) => priorStruct.has(normStem(c.stem))).map((c) => c.id)
console.log(JSON.stringify({ replaced, failed, familiesLeft: fams2.length, members: new Set(fams2.flat()).size, priorHits: ph, keep }, null, 2))
