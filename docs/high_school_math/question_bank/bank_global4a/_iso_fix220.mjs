import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { baseItem, appRubric, normStem } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const c = candidates.find((x) => x.id === 'CAND-G4A-220')
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
  {
    sectionCode: '4.5',
    sectionName: '指数函数与对数函数的应用',
    stem: '某菌群 $n(t)=80\\cdot 2^{t/2}$（$t$ 为小时）。\n（1）求 $t=4$ 时的数量；（2）求使 $n(t)=640$ 的 $t$。',
    options: null,
    answer: '（1）$320$；（2）$t=6$。',
    analysis: '$80\\cdot 2^{2}=320$；$80\\cdot 2^{t/2}=640\\Rightarrow 2^{t/2}=8\\Rightarrow t/2=3$。',
    authorMathNote: '320;6',
    ...appRubric(
      [
        { key: 'p1', title: '求值', score: 4, criterion: '320' },
        { key: 'p2', title: '反解', score: 4, criterion: 't=6' },
      ],
      8,
    ),
    sourceEvidence: '同构清理整题重设计；非高考真题',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
  },
  { rebuildAction: 'iso_fix220', dedupVerdict: 'DISTINCT' },
)
Object.assign(c, item)
candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((x) => {
    const n = parseInt(x.id.slice(-3), 10)
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
console.log('220', normStem(c.stem).slice(0, 50))
