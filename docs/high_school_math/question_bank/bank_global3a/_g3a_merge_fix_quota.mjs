/**
 * Merge ch01-05 + ch06-10, fix global quotas, write candidates-g3a-100.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const a = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g3a_part_ch01_05.json'), 'utf8'),
)
const b = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g3a_part_ch06_10.json'), 'utf8'),
)
const all = [...a, ...b]
const byId = Object.fromEntries(all.map((x) => [x.id, x]))

// d2 → d1 (5): basic plug-in / definition items
for (const id of [
  'CAND-G3A-010', // AM-GM equality x=2
  'CAND-G3A-021', // parabola mono interval
  'CAND-G3A-046', // cos from coords
  'CAND-G3A-088', // line-plane perp criterion
  'CAND-G3A-006', // quantifier negation
]) {
  byId[id].difficulty = 1
  byId[id].authorMathNote =
    (byId[id].authorMathNote || '') + ' [quota: d2→d1 基础题]'
}

// judge → single (1): 037 inverse function symmetry（保持 d2）
{
  const x = byId['CAND-G3A-037']
  x.qtype = 'single'
  x.difficulty = 2
  x.options = {
    A: '关于原点对称',
    B: '关于直线 $y=x$ 对称',
    C: '关于 $x$ 轴对称',
    D: '关于 $y$ 轴对称',
  }
  x.answer = 'B'
  x.stem =
    '函数 $y=10^x$ 与 $y=\\lg x$ 的图象（在各自定义域上）的位置关系是'
  x.analysis =
    '互为反函数的两个函数图象关于直线 $y=x$ 对称。$y=10^x$ 与 $y=\\lg x$ 互为反函数，故选 B。'
  x.authorMathNote = '反函数图象关于 y=x；quota judge→single 保持d2'
  x.dedupNote = '指数对数反函数对称单选'
}

const candidates = all.map((x) => byId[x.id])

function hist(key) {
  const h = {}
  for (const c of candidates) h[c[key]] = (h[c[key]] || 0) + 1
  return h
}
const d = hist('difficulty')
const qt = hist('qtype')
const ch = hist('chapterNo')
const req = candidates
  .filter((c) => c.diagramRequirement === 'REQUIRED')
  .map((c) => c.id)

const ok =
  candidates.length === 100 &&
  d[1] === 35 &&
  d[2] === 40 &&
  d[3] === 25 &&
  qt.single === 30 &&
  qt.multi === 15 &&
  qt.judge === 10 &&
  qt.numeric === 20 &&
  qt.application === 25 &&
  ch[1] === 6 &&
  ch[2] === 10 &&
  ch[3] === 12 &&
  ch[4] === 14 &&
  ch[5] === 16 &&
  ch[6] === 14 &&
  ch[7] === 4 &&
  ch[8] === 14 &&
  ch[9] === 4 &&
  ch[10] === 6 &&
  req.length === 7

const outMjs = path.join(qb, 'candidates-g3a-100.mjs')
fs.writeFileSync(
  outMjs,
  `/** GLOBAL-3A candidates — quota-fixed merge */\nexport const candidates = ${JSON.stringify(
    candidates,
    null,
    2,
  )};\n`,
)
fs.writeFileSync(
  path.join(__dirname, '_g3a_merge_quota_report.json'),
  JSON.stringify({ ok, d, qt, ch, req, n: candidates.length }, null, 2),
)
console.log(JSON.stringify({ ok, d, qt, ch, req, outMjs }, null, 2))
if (!ok) process.exit(1)
