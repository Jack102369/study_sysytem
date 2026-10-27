import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { baseItem, appRubric, normStem, CRUTCH_RE } from './_rebuild_core.mjs'

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
    rebuildAction: 'iso_final',
    dedupVerdict: 'DISTINCT',
  })
  if (CRUTCH_RE.test(item.stem)) throw new Error('crutch')
  Object.assign(c, item)
}
function R(t1, c1, t2, c2, max = 8) {
  return appRubric(
    [
      { key: 'p1', title: t1, score: Math.floor(max / 2), criterion: c1 },
      { key: 'p2', title: t2, score: max - Math.floor(max / 2), criterion: c2 },
    ],
    max,
  )
}

apply('CAND-G4A-401', {
  sectionCode: '4.4',
  sectionName: '对数函数',
  stem: '函数 $y=\\log_{3}x$ 的定义域是',
  options: { A: '$(0,+\\infty)$', B: '$\\mathbb{R}$', C: '$[0,+\\infty)$', D: '$(1,+\\infty)$' },
  answer: 'A',
  analysis: '真数大于 0。',
  authorMathNote: '(0,+∞)',
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

apply('CAND-G4A-303', {
  sectionCode: '7.3',
  sectionName: '复数的三角形式初步',
  stem: '设 $z=5-12\\mathrm{i}$。\n（1）求 $|z|$；（2）求 $z\\overline{z}$。',
  options: null,
  answer: '（1）13；（2）169。',
  analysis: '模与模方。',
  authorMathNote: '13;169',
  ...R('模', '13', '乘共轭', '169'),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

apply('CAND-G4A-389', {
  sectionCode: '8.3',
  sectionName: '空间几何体的表面积与体积',
  stem: '圆柱底面半径 $2$、高 $6$。\n（1）求体积（含 $\\pi$）；（2）求侧面积（含 $\\pi$）。',
  options: null,
  answer: '（1）$24\\pi$；（2）$24\\pi$。',
  analysis: '$V=\\pi r^2 h$，$S_{侧}=2\\pi r h$。',
  authorMathNote: '24π;24π',
  ...R('体积', '24π', '侧面积', '24π'),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

apply('CAND-G4A-422', {
  sectionCode: '8.1',
  sectionName: '空间几何体',
  stem: '用斜二测画法说明：水平放置的正方形直观图通常变成什么形状？并指出平行于 $y$ 轴的边如何取长度。',
  options: null,
  answer: '变为平行四边形（菱形类）；平行 y 轴边取原长一半。',
  analysis: '斜二测规则。',
  authorMathNote: '斜二测',
  ...R('形状', '平行四边形', '长度', '一半'),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

apply('CAND-G4A-438', {
  sectionCode: '8.5',
  sectionName: '空间直线、平面的平行',
  stem: '叙述线面平行的判定定理，并在长方体中指出一组满足条件的直线与平面。',
  options: null,
  answer: '平面外直线平行平面内一直线⇒线面平行；例如 $A_1B_1\\parallel$ 平面 ABCD。',
  analysis: '判定+例子。',
  authorMathNote: '判定',
  ...R('定理', '正确', '例子', '长方体'),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

apply('CAND-G4A-449', {
  sectionCode: '8.4',
  sectionName: '空间点、直线、平面之间的位置关系',
  stem: '空间两直线有哪三种位置关系？分别举正方体中棱或对角线的例子各一。',
  options: null,
  answer: '相交、平行、异面；例如交于顶点、相对侧棱平行、异面棱。',
  analysis: '概念+例子。',
  authorMathNote: '三种',
  ...R('分类', '三种', '例子', '正方体'),
  diagramRequirement: 'NOT_NEEDED',
  noDiagramReason: '文字条件充分，无需图示。',
})

// 243 kept as cone volume exemplar

candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(path.join(__dirname, `g4a_group0${g}.mjs`), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`)
}
fs.writeFileSync(path.join(root, 'candidates-g4a-500.mjs'), `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`)

const chMap = new Map()
const exact = new Map()
for (const c of candidates) {
  const k = `${c.chapterNo}|${normStem(c.stem)}`
  if (!chMap.has(k)) chMap.set(k, [])
  chMap.get(k).push(c.id)
  const e = String(c.stem).replace(/\s+/g, '')
  if (!exact.has(e)) exact.set(e, [])
  exact.get(e).push(c.id)
}
console.log({
  fams: [...chMap.values()].filter((x) => x.length >= 2).length,
  exactDup: [...exact.values()].filter((x) => x.length >= 2),
})
