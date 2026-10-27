import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { normStem, CRUTCH_RE, appRubric, baseItem } from './_rebuild_core.mjs'

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
  const { item } = baseItem(slot, { ...partial, sourceEvidence: '同构清理整题重设计；非高考真题' }, {
    rebuildAction: 'iso_handfix2',
    dedupVerdict: 'handfix2 DISTINCT',
  })
  if (CRUTCH_RE.test(item.stem)) throw new Error('crutch ' + id)
  Object.assign(c, item)
}

// 161 numeric: was wrongly given MCQ
apply('CAND-G4A-161', {
  sectionCode: '4.3',
  sectionName: '对数',
  stem: '$\\log_5 125=$',
  options: null,
  answer: '3',
  analysis: '$5^3=125$。',
  authorMathNote: '3',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

// 197 numeric
apply('CAND-G4A-197', {
  sectionCode: '4.1',
  sectionName: '指数与指数幂的运算',
  stem: '$9^{3/2}=$',
  options: null,
  answer: '27',
  analysis: '$(3^2)^{3/2}=3^3=27$。',
  authorMathNote: '27',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

// 436 prior-structure hit: change to different exp/log modeling (not same proof template)
apply('CAND-G4A-436', {
  sectionCode: '4.5',
  sectionName: '指数函数与对数函数的应用',
  stem: '放射性样品初始 $640\\,g$，每小时质量变为原来的 $\\dfrac{1}{2}$。\n（1）写出 $t$ 小时后质量 $n(t)$；（2）求使 $n(t)=40$ 的 $t$。',
  options: null,
  answer: '$n=640\\cdot(1/2)^{t}$；$t=4$。',
  analysis: '$640/16=40$。',
  authorMathNote: 't=4',
  ...appRubric(
    [
      { key: 'p1', title: '模型', score: 4, criterion: '解析式正确' },
      { key: 'p2', title: '求解', score: 4, criterion: 't=4' },
    ],
    8,
  ),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(path.join(__dirname, `g4a_group0${g}.mjs`), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`)
}
fs.writeFileSync(path.join(root, 'candidates-g4a-500.mjs'), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`)

const structMap = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!structMap.has(k)) structMap.set(k, [])
  structMap.get(k).push(c.id)
}
const fams = [...structMap.entries()].filter(([, ids]) => ids.length >= 2)
const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const priorStruct = new Set((prior.stemsNorm || []).map((s) => normStem(s)))
const priorHits = candidates.filter((c) => priorStruct.has(normStem(c.stem))).map((c) => c.id)
const numericBad = candidates.filter((c) => c.qtype === 'numeric' && (c.options || !/^[+-]?(\d+(\.\d+)?|\d+\/[1-9]\d*)$/.test(String(c.answer).trim())))
console.log(JSON.stringify({ familiesLeft: fams.length, famMembers: fams.map(([, ids]) => ids), priorHits, numericBad: numericBad.map((c) => c.id), crutch: candidates.filter((c) => CRUTCH_RE.test(c.stem)).length }, null, 2))
