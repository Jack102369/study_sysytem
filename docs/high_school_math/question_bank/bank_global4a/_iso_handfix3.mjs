import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { baseItem, normStem, CRUTCH_RE } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const byId = new Map(candidates.map((c) => [c.id, c]))

function apply(id, partial) {
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
  const { item } = baseItem(
    slot,
    { ...partial, sourceEvidence: '同构清理整题重设计；非高考真题' },
    { rebuildAction: 'iso_handfix3', dedupVerdict: 'DISTINCT' },
  )
  if (CRUTCH_RE.test(item.stem)) throw new Error('crutch')
  Object.assign(c, item)
}

apply('CAND-G4A-161', {
  sectionCode: '4.2',
  sectionName: '指数函数',
  stem: '若 $0.5^{m}>0.5^{n}$，比较 $m$ 与 $n$：若 $m>n$ 填 $1$，若 $m=n$ 填 $0$，若 $m<n$ 填 $-1$，则应填',
  options: null,
  answer: '-1',
  analysis: '底数 $0.5\\in(0,1)$，指数函数递减，故 $m<n$，填 $-1$。',
  authorMathNote: '-1',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

apply('CAND-G4A-197', {
  sectionCode: '4.3',
  sectionName: '对数',
  stem: '$\\log_{2}8+\\log_{2}4=$',
  options: null,
  answer: '5',
  analysis: '$3+2=5$。',
  authorMathNote: '5',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

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

const map = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!map.has(k)) map.set(k, [])
  map.get(k).push(c.id)
}
const fams = [...map.values()].filter((ids) => ids.length >= 2)
const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const ps = new Set(prior.stemsNorm.map((s) => normStem(s)))
const ph = candidates.filter((c) => ps.has(normStem(c.stem))).map((c) => c.id)
console.log({
  families: fams.length,
  priorHits: ph,
  stem161: byId.get('CAND-G4A-161').stem,
  stem197: byId.get('CAND-G4A-197').stem,
})
