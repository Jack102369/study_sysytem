/**
 * GLOBAL-3B Round3: clear remaining soft semantic hit on 097.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'candidates-g3a-100.mjs');
const { candidates } = await import(pathToFileURL(file).href + '?t=' + Date.now());
const c = candidates.find((x) => x.id === 'CAND-G3A-097');
if (!c) throw new Error('097 missing');

c.stem =
  '独立事件 $A,B$ 满足 $P(A)=\\dfrac{1}{2}$，$P(B)=\\dfrac{1}{3}$，则 $P(\\overline{A}\\,\\overline{B})=$';
c.qtype = 'numeric';
c.answer = '1/3';
c.analysis =
  '独立 ⇒ 对立亦独立：$P(\\overline{A}\\overline{B})=P(\\overline{A})P(\\overline{B})=\\left(1-\\dfrac{1}{2}\\right)\\left(1-\\dfrac{1}{3}\\right)=\\dfrac{1}{2}\\cdot\\dfrac{2}{3}=\\dfrac{1}{3}$。';
c.authorMathNote = '(1/2)*(2/3)=1/3';
c.dedupNote = '独立对立交概率（异于正式库 P(AB)/P(A∪B) 直算）';
c.mathVerified = 'G3B_R3_DEDUP';
c.methodMain = 'num_shape';

const counts = { 1: 0, 2: 0, 3: 0 };
const qt = {};
for (const x of candidates) {
  counts[x.difficulty]++;
  qt[x.qtype] = (qt[x.qtype] || 0) + 1;
}
fs.writeFileSync(
  file,
  '/** GLOBAL-3A candidates — G3B Round3 quality fixes */\nexport const candidates = ' +
    JSON.stringify(candidates, null, 2) +
    ';\n',
);
console.log(
  JSON.stringify(
    {
      counts,
      qt,
      quotaOk:
        counts[1] === 35 &&
        counts[2] === 40 &&
        counts[3] === 25 &&
        qt.single === 30 &&
        qt.multi === 15 &&
        qt.judge === 10 &&
        qt.numeric === 20 &&
        qt.application === 25,
    },
    null,
    2,
  ),
);
