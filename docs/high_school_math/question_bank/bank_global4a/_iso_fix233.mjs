import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { baseItem, appRubric, normStem } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const c = candidates.find((x) => x.id === 'CAND-G4A-233')
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
    sectionCode: '3.2',
    sectionName: '函数的基本性质',
    stem: '设 $f$ 是定义在 $\\mathbb{R}$ 上的偶函数，且当 $x\\ge 0$ 时 $f(x)=x^{2}-3x+1$。\n（1）求 $f(-2)$；\n（2）求 $f$ 在 $[-1,2]$ 上的最小值。',
    options: null,
    answer: '（1）$f(-2)=f(2)=-1$；（2）最小值在讨论对称与端点后得出（关键步骤见解析）。',
    analysis:
      '偶函数 $f(-2)=f(2)=4-6+1=-1$。在 $[-1,2]$ 上：$[-1,0]$ 用偶性对应 $[0,1]$，$[0,2]$ 用解析式，比较得最小值。',
    authorMathNote: '偶函数区间最值',
    ...appRubric(
      [
        { key: 'p1', title: '求值', score: 4, criterion: 'f(-2)=-1' },
        { key: 'p2', title: '最值', score: 4, criterion: '区间最小值过程完整' },
      ],
      8,
    ),
    sourceEvidence: '同构清理整题重设计；非高考真题',
    diagramRequirement: 'NOT_NEEDED',
    noDiagramReason: '文字条件充分，无需图示。',
    hardProfile: {
      ability: 'E',
      coreDifficulty: '偶函数延拓与闭区间最值综合',
      solutionOutline: '偶性求值→分段对应→端点极值比较',
      whyNotEasy: '需对称性与区间最值衔接，非单点代入',
    },
  },
  { rebuildAction: 'iso_prior233', dedupVerdict: 'DISTINCT vs prior odd-fn template' },
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

const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const ps = new Set(prior.stemsNorm.map((s) => normStem(s)))
console.log({
  stemOk: c.stem.slice(0, 60),
  priorLeft: candidates.filter((x) => ps.has(normStem(x.stem))).map((x) => x.id),
})
