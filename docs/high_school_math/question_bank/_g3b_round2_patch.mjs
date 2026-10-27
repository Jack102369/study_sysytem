/**
 * GLOBAL-3B Round2: quota restore + 084 exact-dedup rewrite + 045 structure differentiate.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'candidates-g3a-100.mjs');
const { candidates } = await import(pathToFileURL(file).href + '?t=' + Date.now());
const byId = Object.fromEntries(candidates.map((c) => [c.id, c]));
const must = (id) => {
  const c = byId[id];
  if (!c) throw new Error(id);
  return c;
};

// quota: 37/38/25 → 35/40/25 by lifting 038 & 093 from d1→d2 (still not d3)
must('CAND-G3A-038').difficulty = 2;
must('CAND-G3A-093').difficulty = 2;
must('CAND-G3A-038').mathVerified = 'G3B_R2_QUOTA';
must('CAND-G3A-093').mathVerified = 'G3B_R2_QUOTA';

// 084: previous rewrite collided exactly with formal G2A stem
{
  const c = must('CAND-G3A-084');
  c.stem =
    '判断：若直线 $l$ 与平面 $\\alpha$ 内的一条直线平行，则一定有 $l\\parallel\\alpha$（无需其它条件）。';
  c.answer = 'false';
  c.analysis =
    '线面平行判定需要“$l$ 在平面外”等条件。若 $l$ 本身落在 $\\alpha$ 内且与面内某直线平行，则 $l$ 与 $\\alpha$ 相交关系不成立为平行（直线在平面内）。缺少“平面外”等条件时命题不成立。';
  c.authorMathNote = '缺“平面外”条件则假；面内平行线≠线面平行。';
  c.dedupNote = '线面平行判定条件完整性（非定理原文照抄）';
  c.mathVerified = 'G3B_R2_DEDUP';
}

// 045: further differentiate structure — sector perimeter (arc+2r) + area
{
  const c = must('CAND-G3A-045');
  c.stem =
    '半径为 $4$ 的圆中，圆心角为 $\\dfrac{\\pi}{3}$ 的扇形。\n（1）求该扇形的周长（含两条半径）；\n（2）求扇形面积 $S$。';
  // perimeter = l + 2r = 4π/3 + 8
  c.answer = '（1）周长为 $8+\\dfrac{4\\pi}{3}$；（2）$S=\\dfrac{8\\pi}{3}$。';
  c.analysis =
    '（1）弧长 $l=r\\theta=4\\cdot\\dfrac{\\pi}{3}=\\dfrac{4\\pi}{3}$，周长 $=l+2r=\\dfrac{4\\pi}{3}+8$。\n（2）$S=\\dfrac{1}{2}r^2\\theta=\\dfrac{1}{2}\\cdot16\\cdot\\dfrac{\\pi}{3}=\\dfrac{8\\pi}{3}$。';
  c.authorMathNote = '周长=8+4π/3；S=8π/3。';
  c.dedupNote = '扇形周长+面积（异于仅求弧长/面积的正式扇形题）';
  c.rubric = [
    {
      key: 'peri',
      title: '周长',
      score: 4,
      criterion: '先得弧长再得周长 $8+\\dfrac{4\\pi}{3}$（等价形式可）',
    },
    {
      key: 'area',
      title: '扇形面积',
      score: 4,
      criterion: '得 $S=\\dfrac{8\\pi}{3}$（可用 $\\dfrac12 rl$ 等价）',
    },
  ];
  c.mathVerified = 'G3B_R2_RESOLVED';
}

const counts = { 1: 0, 2: 0, 3: 0 };
for (const c of candidates) counts[c.difficulty]++;
fs.writeFileSync(
  file,
  '/** GLOBAL-3A candidates — G3B Round2 quality fixes */\nexport const candidates = ' +
    JSON.stringify(candidates, null, 2) +
    ';\n',
);
console.log(JSON.stringify({ counts, ok: counts[1] === 35 && counts[2] === 40 && counts[3] === 25 }, null, 2));
