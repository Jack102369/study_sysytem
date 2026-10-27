import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mjsPath = path.join(__dirname, 'candidates-g2a-100.mjs');
const { candidates } = await import(pathToFileURL(mjsPath).href + '?t=' + Date.now());
const by = Object.fromEntries(candidates.map((c) => [c.id, c]));

// ---- 034: mixed-base log equation (true multi-step) ----
Object.assign(by['CAND-G2A-034'], {
  sectionCode: '4.3',
  sectionName: '对数',
  kpCode: 'rja.4.3.03',
  kpName: '换底公式',
  methodMain: 'equiv_transform',
  methodAux: 'defn',
  qtype: 'numeric',
  difficulty: 3,
  stem:
    '已知 $\\log_4(x-1)+\\log_2(x-1)=3$，且 $x>1$。求 $x$ 的值。',
  options: null,
  answer: '5',
  analysis:
    '令 $t=\\log_2(x-1)$（因 $x>1$，有 $x-1>0$，对数有意义）。由换底公式 $\\log_4(x-1)=\\dfrac{\\log_2(x-1)}{\\log_2 4}=\\dfrac{t}{2}$。原方程化为 $\\dfrac{t}{2}+t=3$，即 $\\dfrac{3t}{2}=3$，故 $t=2$。于是 $\\log_2(x-1)=2$，得 $x-1=2^2=4$，所以 $x=5$。检验：代入后 $\\log_4 4+\\log_2 4=1+2=3$，成立。',
  dedupNote: '混底对数方程 log4+log2 求x',
  authorMathNote:
    '换底得 (1/2)t+t=3⇒t=2⇒x-1=4⇒x=5；两步关联（换底+解指数），非单次求值。',
  noDiagramReason: '纯对数方程求值。',
  mathCheck: 'PASS',
  mathVerified: 'AUTHOR_CHECKED',
  diagramRequirement: 'NOT_NEEDED',
  diagramSpecification: null,
});

// ---- 072: deepen work modeling to honestly support d=3 ----
Object.assign(by['CAND-G2A-072'], {
  sectionCode: '6.4',
  sectionName: '平面向量的应用',
  kpCode: 'rjb.6.4.03',
  kpName: '功的计算',
  methodMain: 'num_shape',
  methodAux: 'equiv_transform',
  qtype: 'numeric',
  difficulty: 3,
  stem:
    '已知力 $\\vec F=(3,4)$（单位 N）。质点从点 $A(1,2)$ 移动到点 $B(7,10)$（单位 m）。另有恒力 $\\vec G$ 与位移 $\\overrightarrow{AB}$ 方向相同，且 $|\\vec G|=5$（单位 N）。求合力 $\\vec F+\\vec G$ 对这段位移所做的总功 $W$（单位 J）。',
  options: null,
  answer: '100',
  analysis:
    '位移 $\\overrightarrow{AB}=(7-1,10-2)=(6,8)$，其模 $|\\overrightarrow{AB}|=\\sqrt{6^2+8^2}=10$。\n$\\vec F$ 做功：$W_F=\\vec F\\cdot\\overrightarrow{AB}=3\\cdot6+4\\cdot8=18+32=50$。\n$\\vec G$ 与 $\\overrightarrow{AB}$ 同向且模为 $5$，故 $\\vec G=5\\cdot\\dfrac{\\overrightarrow{AB}}{|\\overrightarrow{AB}|}=5\\cdot\\left(\\dfrac{6}{10},\\dfrac{8}{10}\\right)=(3,4)$。\n$W_G=\\vec G\\cdot\\overrightarrow{AB}=5\\cdot10=50$（同向时功等于 $|\\vec G||\\overrightarrow{AB}|$）。\n总功 $W=W_F+W_G=100$。亦可用 $(\\vec F+\\vec G)\\cdot\\overrightarrow{AB}=(6,8)\\cdot(6,8)=36+64=100$ 复核。',
  dedupNote: 'F点积加同向G的功',
  authorMathNote:
    'AB=(6,8),|AB|=10; WF=50; G=5*u= (3,4); WG=50; W=100。含位移建模+单位化+数量积，非两次余弦照抄。',
  noDiagramReason: '坐标已给，可用向量运算直接求。',
  mathCheck: 'PASS',
  mathVerified: 'AUTHOR_CHECKED',
  diagramRequirement: 'NOT_NEEDED',
  diagramSpecification: null,
});

const out = candidates.map((c) => by[c.id]);
const header =
  '/** GLOBAL-2A candidates — GLOBAL-2E round1 fixes (034/072) */\nexport const candidates = ';
fs.writeFileSync(mjsPath, header + JSON.stringify(out, null, 2) + '\n', 'utf8');

console.log(
  JSON.stringify(
    {
      '034': {
        stem: by['CAND-G2A-034'].stem,
        answer: by['CAND-G2A-034'].answer,
        d: by['CAND-G2A-034'].difficulty,
        kp: by['CAND-G2A-034'].kpCode,
      },
      '072': {
        stem: by['CAND-G2A-072'].stem.slice(0, 120),
        answer: by['CAND-G2A-072'].answer,
        d: by['CAND-G2A-072'].difficulty,
      },
    },
    null,
    2,
  ),
);
