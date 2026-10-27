/**
 * Kill remaining GLOBAL low-value structure families (wrong-chapter templates).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { normStem, CRUTCH_RE, baseItem, appRubric } from './_rebuild_core.mjs'
import { buildEmergency } from './_iso_emergency.mjs'
import { buildDistinct } from './_iso_distinct_pool.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const priorStruct = new Set((prior.stemsNorm || []).map((s) => normStem(s)))

const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const byId = new Map(candidates.map((c) => [c.id, c]))

function chapterMismatch(c) {
  const st = String(c.stem)
  if (/设\s*\$k=\d+\$。正确的有（多选）/.test(st)) return true
  if (c.chapterNo !== 8 && /圆柱半径.*同底叠放.*圆锥/.test(st)) return true
  if (c.chapterNo !== 2 && /正实数\s*\$x,y\$\s*满足\s*\$x\+y=/.test(st) && /xy/.test(st)) return true
  if (![3, 5].includes(c.chapterNo) && /y=\d+\\sin x\+\d+\\cos x/.test(st)) return true
  if (c.chapterNo !== 3 && /奇函数\s*\$f\$\s*在/.test(st) && /dfrac/.test(st)) return true
  return false
}

const gMap = new Map()
for (const c of candidates) {
  const k = normStem(c.stem)
  if (!gMap.has(k)) gMap.set(k, [])
  gMap.get(k).push(c.id)
}

const replaceIds = new Set()
for (const ids of gMap.values()) {
  if (ids.length < 2 && !chapterMismatch(byId.get(ids[0]))) continue
  // keep best chapter-matched member if any
  const matched = ids.filter((id) => !chapterMismatch(byId.get(id)))
  const keep = matched[0] || null
  for (const id of ids) {
    if (id !== keep) replaceIds.add(id)
  }
}
for (const c of candidates) {
  if (chapterMismatch(c)) replaceIds.add(c.id)
}

const usedStruct = new Set([...priorStruct])
const usedExact = new Set()
for (const c of candidates) {
  if (!replaceIds.has(c.id)) {
    usedStruct.add(normStem(c.stem))
    usedExact.add(c.stem)
  }
}

let replaced = 0
const failed = []
for (const id of [...replaceIds].sort()) {
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
  let r = null
  for (let s = 0; s < 20 && !r; s++) {
    const cand = buildDistinct(slot, 500 + parseInt(id.slice(-3), 10) + s * 31, usedStruct, usedExact)
    if (!cand) continue
    const st = normStem(cand.item.stem)
    if (usedStruct.has(st) || priorStruct.has(st) || CRUTCH_RE.test(cand.item.stem)) continue
    if (chapterMismatch({ ...cand.item, chapterNo: c.chapterNo })) continue
    r = cand
  }
  for (let s = 0; s < 40 && !r; s++) {
    const cand = buildEmergency(slot, 900 + parseInt(id.slice(-3), 10) + s * 37, usedStruct, usedExact)
    if (!cand) continue
    const st = normStem(cand.item.stem)
    if (usedStruct.has(st) || priorStruct.has(st) || CRUTCH_RE.test(cand.item.stem)) continue
    if (chapterMismatch({ ...cand.item, chapterNo: c.chapterNo })) continue
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
  usedStruct.add(normStem(c.stem))
  usedExact.add(c.stem)
  replaced++
}

// manual fallbacks for stubborn ids
const MANUAL = {
  CAND: null,
}
function manual(id, partial) {
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
  const { item } = baseItem(slot, { ...partial, sourceEvidence: '同构清理整题重设计；非高考真题' }, {
    rebuildAction: 'iso_global_manual',
    dedupVerdict: 'DISTINCT',
  })
  Object.assign(c, item)
  usedStruct.add(normStem(c.stem))
}

const manuals = {
  'CAND-G4A-223': {
    sectionCode: '2.2',
    sectionName: '基本不等式',
    stem: '正实数 $x$ 使 $x+\\dfrac{9}{x}$ 取最小值时，$x$ 等于',
    options: { A: '3', B: '9', C: '1', D: '6' },
    answer: 'A',
    analysis: '等号 $x=3$。',
    authorMathNote: '3',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
  },
  'CAND-G4A-463': {
    sectionCode: '9.2',
    sectionName: '用样本估计总体',
    stem: '样本数据 $4,6,8,10$ 的平均数是',
    options: null,
    answer: '7',
    analysis: '$(4+6+8+10)/4=7$。',
    authorMathNote: '7',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
  },
  'CAND-G4A-368': {
    sectionCode: '9.1',
    sectionName: '随机抽样',
    stem: '从 $100$ 人中用简单随机抽样抽取 $10$ 人，每个个体被抽到的概率为',
    options: { A: '$0.1$', B: '$0.01$', C: '$10$', D: '$1$' },
    answer: 'A',
    analysis: '等概 $10/100$。',
    authorMathNote: '0.1',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
  },
  'CAND-G4A-157': {
    sectionCode: '6.2',
    sectionName: '向量的运算',
    stem: '设 $\\vec a=(3,4)$，则 $|\\vec a|=$',
    options: { A: '5', B: '7', C: '12', D: '1' },
    answer: 'A',
    analysis: '勾股。',
    authorMathNote: '5',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
  },
}

for (const id of failed) {
  if (manuals[id]) {
    manual(id, manuals[id])
    replaced++
    failed.splice(failed.indexOf(id), 1)
  }
}
// also force-replace remaining mismatch even if singleton after
for (const c of candidates) {
  if (chapterMismatch(c) && manuals[c.id]) {
    manual(c.id, manuals[c.id])
  } else if (chapterMismatch(c)) {
    // try emergency once more with high salt
    const slot = {
      id: c.id,
      book: c.book,
      chapterNo: c.chapterNo,
      specialtyCode: c.specialtyCode,
      qtype: c.qtype,
      difficulty: c.difficulty,
      kpHint: { code: c.kpCode, name: c.kpName },
    }
    usedStruct.delete(normStem(c.stem))
    const r = buildEmergency(slot, 2000 + parseInt(c.id.slice(-3), 10), usedStruct, usedExact)
    if (r && !chapterMismatch({ ...r.item, chapterNo: c.chapterNo })) {
      Object.assign(c, { ...r.item, id: c.id, chapterNo: c.chapterNo, qtype: c.qtype, difficulty: c.difficulty, kpCode: c.kpCode, kpName: c.kpName, specialtyCode: c.specialtyCode, book: c.book })
      usedStruct.add(normStem(c.stem))
      replaced++
    }
  }
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

const g2 = new Map()
for (const c of candidates) {
  const k = normStem(c.stem)
  if (!g2.has(k)) g2.set(k, [])
  g2.get(k).push(c.id)
}
const fams = [...g2.values()].filter((x) => x.length >= 2)
const mismatchLeft = candidates.filter(chapterMismatch).map((c) => c.id)
console.log(
  JSON.stringify(
    {
      replaced,
      failed,
      globalFams: fams.length,
      mismatchLeft,
      priorHits: candidates.filter((c) => priorStruct.has(normStem(c.stem))).map((c) => c.id),
    },
    null,
    2,
  ),
)
