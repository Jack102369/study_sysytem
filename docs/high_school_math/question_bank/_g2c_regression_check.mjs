import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { candidates } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g2a-100.mjs')).href
);
const { candidates: g1b } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g1b-100.mjs')).href
);
const lock = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g2c_lock_93_sha.json'), 'utf8'),
);
const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g2a_readonly_baseline.json'), 'utf8'),
);

const fix = new Set([
  'CAND-G2A-025',
  'CAND-G2A-031',
  'CAND-G2A-034',
  'CAND-G2A-039',
  'CAND-G2A-045',
  'CAND-G2A-054',
  'CAND-G2A-072',
]);

function sha(o) {
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
}

const issues = [];
const shaMismatch = [];
for (const c of candidates) {
  if (fix.has(c.id)) continue;
  if (lock.locked[c.id] !== sha(c)) shaMismatch.push(c.id);
}
if (shaMismatch.length) issues.push('sha93:' + shaMismatch.join(','));
if (candidates.length !== 100) issues.push('count');
if (new Set(candidates.map((c) => c.id)).size !== 100) issues.push('dupId');

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
  if (!methodSet.has(x.methodMain)) issues.push('method:' + x.id);
  if (x.methodAux && !methodSet.has(x.methodAux)) issues.push('methodAux:' + x.id);
  if (x.qtype === 'application') {
    const s = (x.rubric || []).reduce((a, r) => a + r.score, 0);
    if (s !== x.maxScore) issues.push('rubric:' + x.id);
  }
  if (x.sourceType !== 'original') issues.push('source:' + x.id);
}
for (const [k, v] of Object.entries(chE)) {
  if (ch[k] !== v) issues.push('ch' + k);
}
if (diff[1] !== 35 || diff[2] !== 40 || diff[3] !== 25) {
  issues.push('diff:' + JSON.stringify(diff));
}
if (
  qt.single !== 30 ||
  qt.multi !== 15 ||
  qt.judge !== 10 ||
  qt.numeric !== 20 ||
  qt.application !== 25
) {
  issues.push('qt:' + JSON.stringify(qt));
}
const req = candidates.filter((c) => c.diagramRequirement === 'REQUIRED');
if (req.length !== 7) issues.push('req');

const n034 = candidates.find((c) => c.id === 'CAND-G2A-034');
function norm(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase();
}
const exactG1b = g1b.filter((g) => norm(g.stem) === norm(n034.stem));
const nearG1b = g1b.filter(
  (g) =>
    /log_4\s*32/.test(g.stem) ||
    /log_4\s*32/.test(g.dedupNote || '') ||
    (g.answer === '4' && /log_3\s*81/.test(g.stem)),
);
const batchNear = candidates.filter(
  (c) =>
    c.id !== 'CAND-G2A-034' &&
    (/log_4\s*32/.test(c.stem) || c.dedupNote === n034.dedupNote),
);

const out = {
  ok: issues.length === 0,
  issues,
  diff,
  qt,
  ch,
  sha93Ok: shaMismatch.length === 0,
  sha93Mismatch: shaMismatch,
  reqIds: req.map((r) => r.id),
  n034: {
    stem: n034.stem,
    answer: n034.answer,
    kp: n034.kpCode,
    difficulty: n034.difficulty,
  },
  dedup034: {
    exactG1bStem: exactG1b.map((g) => g.id),
    nearG1b: nearG1b.map((g) => ({ id: g.id, stem: g.stem.slice(0, 40) })),
    batchNear: batchNear.map((c) => c.id),
    semanticNote:
      'New item asks log_4 32=5/2 via same-base/change-of-base; distinct from G1B-036 log_2 32=5 and G1B-040 log_3 81=4',
  },
};
fs.writeFileSync(
  path.join(__dirname, '_g2c_regression_ro.json'),
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));
