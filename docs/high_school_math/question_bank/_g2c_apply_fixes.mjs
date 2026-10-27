import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mjsPath = path.join(__dirname, 'candidates-g2a-100.mjs');
const { candidates } = await import(pathToFileURL(mjsPath).href);
const by = Object.fromEntries(candidates.map((c) => [c.id, c]));

by['CAND-G2A-025'].stem = '下列函数在所给定义域上是奇函数的有（多选）';
by['CAND-G2A-025'].analysis =
  '奇函数要求定义域关于原点对称，且 $f(-x)=-f(x)$。B 的定义域 $[0,+\\infty)$ 不关于原点对称，故不是奇函数。A：$f(-x)=-x-\\dfrac{1}{x}=-f(x)$，是奇函数。C：$f(-x)=(-x)|-x|=-x|x|=-f(x)$，是奇函数。D：定义域 $(-1,1)$ 对称，且 $f(-x)=\\ln\\dfrac{1+x}{1-x}=-\\ln\\dfrac{1-x}{1+x}=-f(x)$，是奇函数。故选 A、C、D。';
by['CAND-G2A-025'].authorMathNote =
  '先判定义域对称：仅 B 不对称；再验证 A/C/D 的 $f(-x)=-f(x)$。答案仍为 A,C,D。';
by['CAND-G2A-025'].dedupNote = '给定定义域下奇函数判定多选';

by['CAND-G2A-031'].stem =
  '下列指数运算正确的有（多选；涉及除法时默认底数 $a\\ne0$）';
by['CAND-G2A-031'].options = {
  A: '$a^3\\cdot a^2=a^5$',
  B: '$(a^2)^3=a^6$',
  C: '$\\dfrac{a^5}{a^2}=a^3$',
  D: '$(ab)^2=a^2+b^2$',
};
by['CAND-G2A-031'].analysis =
  'A：同底数幂相乘，指数相加，正确。B：幂的乘方，指数相乘，正确。C：同底数幂相除，指数相减（题干已声明 $a\\ne0$），正确。D：$(ab)^2=a^2b^2$，不是 $a^2+b^2$，错误。故 A、B、C。';
by['CAND-G2A-031'].authorMathNote =
  'A 去掉多余的 $a\\ne0$ 标注；除法条件收到题干统一说明。答案仍 A,B,C。';

Object.assign(by['CAND-G2A-034'], {
  sectionCode: '4.3',
  sectionName: '对数',
  kpCode: 'rja.4.3.03',
  kpName: '换底公式',
  methodMain: 'equiv_transform',
  methodAux: 'defn',
  qtype: 'numeric',
  difficulty: 3,
  stem: '求 $\\log_4 32$ 的值（可先化为同底指数或使用换底公式）。',
  options: null,
  answer: '$\\dfrac{5}{2}$',
  analysis:
    '法一（定义/同底）：设 $\\log_4 32=x$，则 $4^x=32$。因为 $4=2^2$、$32=2^5$，故 $(2^2)^x=2^5$，即 $2^{2x}=2^5$，所以 $2x=5$，$x=\\dfrac{5}{2}$。法二（换底）：$\\log_4 32=\\dfrac{\\log_2 32}{\\log_2 4}=\\dfrac{5}{2}$。',
  dedupNote: 'log4 32 换底得 5/2',
  authorMathNote:
    '独立：4^x=32⇒2^{2x}=2^5⇒x=5/2；异于 log3 81=4 与 log2 32=5。',
  noDiagramReason: '纯对数求值。',
  mathVerified: 'AUTHOR_CHECKED',
  mathCheck: 'PASS',
});

by['CAND-G2A-039'].stem =
  '某菌群初始数量 $N_0=100$，每小时变为原来的 $1.5$ 倍。设 $t$ 小时后数量为 $N(t)$。\n（1）写出 $N(t)$；\n（2）求使 $N(t)=100\\times 1.5^{4}$ 的 $t$。';
by['CAND-G2A-039'].answer =
  '（1）$N(t)=100\\cdot1.5^{t}$；（2）$4$ 小时。';
by['CAND-G2A-039'].analysis =
  '（1）指数增长：$N(t)=N_0\\cdot 1.5^{t}=100\\cdot 1.5^{t}$。\n（2）由 $100\\cdot 1.5^{t}=100\\cdot 1.5^{4}$，两边同除以 $100$ 得 $1.5^{t}=1.5^{4}$。指数函数 $y=1.5^{t}$ 在 $\\mathbb{R}$ 上单调，故 $t=4$。亦可用换底：$t=\\log_{1.5}(1.5^{4})=4$。';
by['CAND-G2A-039'].rubric = [
  {
    key: 'model',
    title: '写出增长模型',
    score: 3,
    criterion: '得 $N(t)=100\\cdot 1.5^{t}$（或等价写法）',
  },
  {
    key: 'eq',
    title: '建立方程',
    score: 3,
    criterion: '由 $N(t)=100\\cdot 1.5^{4}$ 得到 $1.5^{t}=1.5^{4}$（或等价方程）',
  },
  {
    key: 'solve',
    title: '求解 t',
    score: 2,
    criterion: '利用单调性/换底得出 $t=4$（须有推理，不得仅写“读指数”）',
  },
];
by['CAND-G2A-039'].maxScore = 8;
by['CAND-G2A-039'].dedupNote = '菌群指数增长解方程求 t';
by['CAND-G2A-039'].authorMathNote =
  'rubric 3+3+2=8；第(2)问要求列式+单调性/换底，不奖照抄题干指数。';

by['CAND-G2A-054'].difficulty = 2;
by['CAND-G2A-054'].authorMathNote =
  '独立重解：右移 π/4，形状周期不变；无纵向伸缩。属相位平移多选，标 difficulty=2 更符合实际复杂度（原标 3 偏高）。答案仍 A,C。';

by['CAND-G2A-072'].stem =
  '力 $\\vec F$ 的大小为 $10\\,\\mathrm{N}$。物体先沿与 $\\vec F$ 成 $60^\\circ$ 角的方向移动 $4\\,\\mathrm{m}$，再沿与 $\\vec F$ 成 $120^\\circ$ 角的方向移动 $2\\,\\mathrm{m}$。求力 $\\vec F$ 做的总功 $W$（单位：J）。';
by['CAND-G2A-072'].answer = '10';
by['CAND-G2A-072'].analysis =
  '分段计算：$W_1=|\\vec F||\\vec s_1|\\cos60^\\circ=10\\times4\\times\\dfrac12=20$；$W_2=|\\vec F||\\vec s_2|\\cos120^\\circ=10\\times2\\times\\left(-\\dfrac12\\right)=-10$。总功 $W=W_1+W_2=10$（J）。';
by['CAND-G2A-072'].dedupNote = '分段功60°与120°合计';
by['CAND-G2A-072'].authorMathNote =
  '20+(-10)=10；含钝角负功，两段合成，保留 difficulty=3 合理。';
by['CAND-G2A-072'].difficulty = 3;

const out = candidates.map((c) => by[c.id]);
const header =
  '/** GLOBAL-2A candidates — 2026-10-26; GLOBAL-2C fixes */\nexport const candidates = ';
fs.writeFileSync(mjsPath, header + JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(
  JSON.stringify(
    {
      n: out.length,
      '025': by['CAND-G2A-025'].stem,
      '031A': by['CAND-G2A-031'].options.A,
      '034': {
        stem: by['CAND-G2A-034'].stem,
        answer: by['CAND-G2A-034'].answer,
        d: by['CAND-G2A-034'].difficulty,
        kp: by['CAND-G2A-034'].kpCode,
      },
      '039rubricSum': by['CAND-G2A-039'].rubric.reduce((s, r) => s + r.score, 0),
      '054d': by['CAND-G2A-054'].difficulty,
      '072': by['CAND-G2A-072'].answer,
    },
    null,
    2,
  ),
);
