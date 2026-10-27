/**
 * GLOBAL-3B Round1: fix math/rubric/dedup/difficulty (offline only).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'candidates-g3a-100.mjs');
const { candidates } = await import(pathToFileURL(file).href + '?t=' + Date.now());

const byId = Object.fromEntries(candidates.map((c) => [c.id, c]));

function must(id) {
  const c = byId[id];
  if (!c) throw new Error('missing ' + id);
  return c;
}

// --- 045: wrong rubric + semantic near-dup of G2A sector ---
{
  const c = must('CAND-G3A-045');
  c.stem =
    '半径为 $4$ 的圆中，圆心角为 $\\dfrac{\\pi}{3}$ 的扇形。\n（1）求弧长 $l$；\n（2）求扇形面积 $S$。';
  c.answer = '（1）$l=\\dfrac{4\\pi}{3}$；（2）$S=\\dfrac{8\\pi}{3}$。';
  c.analysis =
    '（1）$l=r\\theta=4\\cdot\\dfrac{\\pi}{3}=\\dfrac{4\\pi}{3}$。\n（2）$S=\\dfrac{1}{2}r^2\\theta=\\dfrac{1}{2}\\cdot16\\cdot\\dfrac{\\pi}{3}=\\dfrac{8\\pi}{3}$。';
  c.authorMathNote = 'r=4,θ=π/3；l=4π/3；S=8π/3。';
  c.dedupNote = 'r=4、θ=π/3 扇形；异于正式库 r=6/单位圆扇形';
  c.rubric = [
    { key: 'arc', title: '弧长', score: 4, criterion: '得 $l=\\dfrac{4\\pi}{3}$（公式正确亦可部分给分）' },
    {
      key: 'area',
      title: '扇形面积',
      score: 4,
      criterion: '得 $S=\\dfrac{8\\pi}{3}$（可用 $\\dfrac12 rl$ 等价）',
    },
  ];
  c.diagramSpecification = {
    purpose: '半径4圆上标注圆心角π/3扇形区域',
    elements: ['圆', '圆心O', '圆心角π/3', '两条半径与劣弧'],
    mustNotReveal: '不得直接标注弧长或扇形面积数值',
  };
  c.mathVerified = 'G3B_R1_RESOLVED';
}

// --- 084: near-dup of formal line-plane parallel theorem ---
{
  const c = must('CAND-G3A-084');
  c.stem = '若直线与平面平行，则该直线与平面内任意一条直线都平行。';
  c.answer = 'false';
  c.analysis =
    '线面平行仅保证直线与平面无交点；平面内可存在与该直线异面或相交方向无关的直线，并不要求与平面内每条直线都平行。故命题错误。';
  c.authorMathNote = '线面平行⇏与面内任一直线平行；反例：面内相交直线。';
  c.dedupNote = '线面平行性质辨析（非判定定理原文复述）';
  c.mathVerified = 'G3B_R1_RESOLVED';
}

// --- 097: same numbers as formal independent-events numeric ---
{
  const c = must('CAND-G3A-097');
  c.stem = '独立事件 $A,B$ 满足 $P(A)=0.3$，$P(B)=0.6$，则 $P(AB)=$';
  c.answer = '0.18';
  c.analysis = '独立 ⇒ $P(AB)=P(A)P(B)=0.3\\times0.6=0.18$。';
  c.authorMathNote = '0.3*0.6=0.18';
  c.dedupNote = '独立交概率0.18（异于正式库0.4×0.5）';
  c.mathVerified = 'G3B_R1_RESOLVED';
}

// --- difficulty authenticity: demote padded d=3, promote real harder d=2 ---
const demote = {
  'CAND-G3A-015': 2, // 顶点区间最值，基础
  'CAND-G3A-038': 1, // 指数右移1，基础
  'CAND-G3A-054': 2, // cos→cos2x 伸缩，常规
  'CAND-G3A-056': 2, // R=√(a²+b²) 公式，常规
  'CAND-G3A-093': 1, // 频率估计一次乘法，过易
};
const promote = {
  'CAND-G3A-032': 3, // 换元指数方程求较大根
  'CAND-G3A-041': 3, // 对数方程+定义域
  'CAND-G3A-027': 3, // 利润二次最值建模
  'CAND-G3A-058': 3, // 潮汐模型综合
  'CAND-G3A-087': 3, // 面面平行判定多选
};
for (const [id, d] of Object.entries(demote)) {
  must(id).difficulty = d;
  must(id).mathVerified = 'G3B_R1_DIFF_ADJUST';
}
for (const [id, d] of Object.entries(promote)) {
  must(id).difficulty = d;
  must(id).mathVerified = 'G3B_R1_DIFF_ADJUST';
}

// --- 042 rubric wording: mono on R not only [1,2] ---
{
  const c = must('CAND-G3A-042');
  const r = (c.rubric || []).find((x) => x.key === 'mono');
  if (r) r.criterion = '说明 $f$ 在 $\\mathbb{R}$ 上单调递增（或等价）';
  c.mathVerified = 'G3B_R1_RUBRIC_TWEAK';
}

const counts = { 1: 0, 2: 0, 3: 0 };
for (const c of candidates) counts[c.difficulty]++;

const out =
  '/** GLOBAL-3A candidates — G3B Round1 quality fixes */\nexport const candidates = ' +
  JSON.stringify(candidates, null, 2) +
  ';\n';
fs.writeFileSync(file, out);
fs.writeFileSync(
  path.join(__dirname, '_g3b_round1_patch_report.json'),
  JSON.stringify({ demote, promote, difficultyCounts: counts, fixed: ['045', '084', '097', '042'] }, null, 2),
);
console.log(JSON.stringify({ difficultyCounts: counts, ok: counts[1] === 35 && counts[2] === 40 && counts[3] === 25 }, null, 2));
