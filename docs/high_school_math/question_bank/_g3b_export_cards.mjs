/**
 * Export compact review cards + semantic dedup + rubric scan for GLOBAL-3B.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { candidates } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g3a-100.mjs')).href +
    '?t=' +
    Date.now()
);
const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g3a_readonly_baseline.json'), 'utf8'),
);

function norm(s) {
  return String(s || '')
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function tokens(s) {
  return norm(s)
    .replace(/[^\u4e00-\u9fff0-9a-z.+-=<>]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function bigrams(s) {
  const n = norm(s);
  const out = [];
  for (let i = 0; i < n.length - 1; i++) out.push(n.slice(i, i + 2));
  return out;
}

const prior = (base.stemsNorm || []).map((s) => ({
  stemNorm: s,
  toks: tokens(s),
  bi: bigrams(s),
}));

const cards = candidates.map((c) => ({
  id: c.id,
  chapterNo: c.chapterNo,
  specialtyCode: c.specialtyCode,
  sectionCode: c.sectionCode,
  kpCode: c.kpCode,
  methodMain: c.methodMain,
  methodAux: c.methodAux,
  qtype: c.qtype,
  difficulty: c.difficulty,
  stem: c.stem,
  options: c.options,
  answer: c.answer,
  analysis: c.analysis,
  authorMathNote: c.authorMathNote,
  maxScore: c.maxScore,
  rubric: c.rubric,
  diagramRequirement: c.diagramRequirement,
  sourceType: c.sourceType,
  dedupNote: c.dedupNote,
}));

// batch + prior semantic
const semanticHits = [];
const batchHits = [];
for (let i = 0; i < candidates.length; i++) {
  const a = candidates[i];
  const na = norm(a.stem);
  const ta = tokens(a.stem);
  const ba = bigrams(a.stem);
  for (let j = i + 1; j < candidates.length; j++) {
    const b = candidates[j];
    const nb = norm(b.stem);
    if (na === nb) {
      batchHits.push({ a: a.id, b: b.id, kind: 'exact' });
      continue;
    }
    const jt = jaccard(ta, tokens(b.stem));
    const jb = jaccard(ba, bigrams(b.stem));
    if (jt >= 0.72 || jb >= 0.78) {
      batchHits.push({
        a: a.id,
        b: b.id,
        kind: 'semantic',
        jaccardTok: +jt.toFixed(3),
        jaccardBi: +jb.toFixed(3),
      });
    }
  }
  let best = { score: 0, stem: null };
  for (const p of prior) {
    if (na === p.stemNorm) {
      best = { score: 1, stem: p.stemNorm.slice(0, 80), kind: 'exact' };
      break;
    }
    const jt = jaccard(ta, p.toks);
    const jb = jaccard(ba, p.bi);
    const sc = Math.max(jt, jb);
    if (sc > best.score) best = { score: sc, stem: p.stemNorm.slice(0, 80), jt, jb };
  }
  if (best.score >= 0.72) {
    semanticHits.push({
      id: a.id,
      score: +best.score.toFixed(3),
      kind: best.kind || 'semantic',
      priorStemPrefix: best.stem,
    });
  }
}

const copyStemRubric = [];
for (const c of candidates.filter((x) => x.qtype === 'application')) {
  const stemN = norm(c.stem).slice(0, 40);
  for (const r of c.rubric || []) {
    const crit = String(r.criterion || '');
    const title = String(r.title || '');
    const bad =
      /照抄|抄写题干|复述题意得|抄题/.test(crit + title) ||
      (stemN.length > 15 && norm(crit).includes(stemN.slice(0, 20)));
    if (bad) copyStemRubric.push({ id: c.id, key: r.key, title: r.title, criterion: crit });
  }
}

const d3 = candidates.filter((c) => c.difficulty === 3).map((c) => ({
  id: c.id,
  qtype: c.qtype,
  stem: c.stem.slice(0, 120),
  answer: c.answer,
  chapterNo: c.chapterNo,
}));

const apps = candidates.filter((c) => c.qtype === 'application').map((c) => ({
  id: c.id,
  difficulty: c.difficulty,
  maxScore: c.maxScore,
  rubricKeys: (c.rubric || []).map((r) => ({
    key: r.key,
    score: r.score,
    title: r.title,
    criterion: r.criterion,
  })),
  answer: String(c.answer).slice(0, 200),
  stem: c.stem.slice(0, 160),
}));

const quotas = {
  n: candidates.length,
  d: {},
  qt: {},
  ch: {},
};
for (const c of candidates) {
  quotas.d[c.difficulty] = (quotas.d[c.difficulty] || 0) + 1;
  quotas.qt[c.qtype] = (quotas.qt[c.qtype] || 0) + 1;
  quotas.ch[c.chapterNo] = (quotas.ch[c.chapterNo] || 0) + 1;
}

const out = {
  quotas,
  idsUnique: new Set(candidates.map((c) => c.id)).size === 100,
  batchHits,
  semanticHits,
  copyStemRubric,
  d3Count: d3.length,
  d3,
  apps,
  cards,
};
fs.writeFileSync(
  path.join(__dirname, '_g3b_review_export.json'),
  JSON.stringify(out, null, 2),
);
console.log(
  JSON.stringify(
    {
      quotas,
      idsUnique: out.idsUnique,
      batchHits: batchHits.length,
      semanticHits: semanticHits.length,
      semanticHitIds: semanticHits.map((x) => x.id),
      copyStemRubric: copyStemRubric.length,
      d3: d3.map((x) => x.id),
    },
    null,
    2,
  ),
);
