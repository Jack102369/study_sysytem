import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { candidates } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g2a-100.mjs')).href +
    '?v=' +
    Date.now()
);
const { candidates: g1b } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g1b-100.mjs')).href
);
const lock = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g2e_lock_sha.json'), 'utf8'),
);
const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g2a_readonly_baseline.json'), 'utf8'),
);

function sha(o) {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}
function norm(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

const touch = new Set(['CAND-G2A-034', 'CAND-G2A-072']);
const issues = [];
const shaMismatch = [];
for (const c of candidates) {
  if (touch.has(c.id)) continue;
  if (lock.locked[c.id] !== sha(c)) shaMismatch.push(c.id);
}
if (shaMismatch.length) issues.push('sha98:' + shaMismatch.join(','));

const ch = {};
const diff = {};
const qt = {};
const chE = { 1: 6, 2: 10, 3: 12, 4: 14, 5: 16, 6: 14, 7: 4, 8: 14, 9: 4, 10: 6 };
const kpSet = new Set(base.kps.map((k) => k.code));
const methodSet = new Set(base.methods.map((m) => m.code));
for (const x of candidates) {
  ch[x.chapterNo] = (ch[x.chapterNo] || 0) + 1;
  diff[x.difficulty] = (diff[x.difficulty] || 0) + 1;
  qt[x.qtype] = (qt[x.qtype] || 0) + 1;
  if (!kpSet.has(x.kpCode)) issues.push('kp:' + x.id);
  if (!methodSet.has(x.methodMain)) issues.push('m:' + x.id);
  if (x.qtype === 'application') {
    const s = (x.rubric || []).reduce((a, r) => a + r.score, 0);
    if (s !== x.maxScore) issues.push('rubric:' + x.id);
  }
}
for (const [k, v] of Object.entries(chE)) if (ch[k] !== v) issues.push('ch' + k);
if (diff[1] !== 35 || diff[2] !== 40 || diff[3] !== 25)
  issues.push('diff:' + JSON.stringify(diff));
if (
  qt.single !== 30 ||
  qt.multi !== 15 ||
  qt.judge !== 10 ||
  qt.numeric !== 20 ||
  qt.application !== 25
)
  issues.push('qt');
const req = candidates.filter((c) => c.diagramRequirement === 'REQUIRED');
if (req.length !== 7) issues.push('req');

const c034 = candidates.find((c) => c.id === 'CAND-G2A-034');
const c072 = candidates.find((c) => c.id === 'CAND-G2A-072');

// Independent math checks encoded
const math034 = {
  derived: 5,
  match: c034.answer === '5',
  steps:
    't=log2(x-1); log4(x-1)=t/2; t/2+t=3 => t=2 => x-1=4 => x=5; check log4 4 + log2 4 = 1+2=3',
};
const math072 = {
  AB: [6, 8],
  mod: 10,
  WF: 50,
  G: [3, 4],
  WG: 50,
  W: 100,
  match: c072.answer === '100',
};

const dedup034 = {
  exactG1b: g1b.filter((g) => norm(g.stem) === norm(c034.stem)).map((g) => g.id),
  nearG1b: g1b
    .filter((g) => /log_4.*log_2|log_2.*log_4/.test(g.stem) || /混底|换底.*方程/.test(g.dedupNote || ''))
    .map((g) => g.id),
  batch: candidates
    .filter(
      (c) =>
        c.id !== 'CAND-G2A-034' &&
        (norm(c.stem) === norm(c034.stem) || c.dedupNote === c034.dedupNote),
    )
    .map((c) => c.id),
  vsOldLog432: !/\\log_4\s*32/.test(c034.stem),
};
const dedup072 = {
  exactG1b: g1b.filter((g) => norm(g.stem) === norm(c072.stem)).map((g) => g.id),
  batch: candidates
    .filter(
      (c) =>
        c.id !== 'CAND-G2A-072' &&
        (norm(c.stem) === norm(c072.stem) || c.dedupNote === c072.dedupNote),
    )
    .map((c) => c.id),
};

const difficultyJudge = {
  '034': {
    claimed: c034.difficulty,
    verdict: 'ACCEPT_D3',
    reason:
      'Requires change-of-base linking two logs with same argument, solve for t, then exponential; domain x>1; not single evaluation.',
  },
  '072': {
    claimed: c072.difficulty,
    verdict: 'ACCEPT_D3',
    reason:
      'Requires displacement from coordinates, F·s, construct same-direction G via unit vector, then WG and sum (or (F+G)·s). Multi-step modeling beyond two cos plugs.',
  },
};

const out = {
  ok: issues.length === 0 && math034.match && math072.match,
  issues,
  sha98Ok: shaMismatch.length === 0,
  shaMismatch,
  diff,
  qt,
  reqCount: req.length,
  math034,
  math072,
  dedup034,
  dedup072,
  difficultyJudge,
  c034: { stem: c034.stem, answer: c034.answer, d: c034.difficulty, kp: c034.kpCode },
  c072: { stem: c072.stem, answer: c072.answer, d: c072.difficulty, kp: c072.kpCode },
};
fs.writeFileSync(
  path.join(__dirname, '_g2e_round1_verify.json'),
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));
