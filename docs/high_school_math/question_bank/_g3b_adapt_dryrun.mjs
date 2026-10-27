/**
 * GLOBAL-3B：候选 → 导入协议适配干跑（无 DB 写入；仿 GLOBAL-2F）。
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { candidates } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g3a-100.mjs')).href +
    '?t=' +
    Date.now()
);

const NUMERIC_VALUE_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/;
const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]{1,62}$/;

function adaptCandidate(c) {
  const methodCodes = [...new Set([c.methodMain, c.methodAux].filter(Boolean))];
  const base = {
    code: String(c.id).trim(),
    specialtyCode: String(c.specialtyCode).trim(),
    categoryCode: String(c.sectionCode).trim(),
    qtype: c.qtype,
    difficulty: Number(c.difficulty),
    stem: String(c.stem),
    analysis: String(c.analysis || '').trim(),
    knowledgePointCodes: [String(c.kpCode).trim()],
    primaryKnowledgePointCode: String(c.kpCode).trim(),
    methodCodes,
    primaryMethodCode: String(c.methodMain).trim(),
    sourceType: c.sourceType || 'original',
    sourceReference: c.sourceEvidence || null,
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
  };

  if (c.qtype === 'single') {
    return {
      ...base,
      options: {
        options: Object.entries(c.options || {}).map(([id, text]) => ({
          id,
          text: String(text),
        })),
      },
      answerPayload: { kind: 'single', optionId: String(c.answer).trim() },
    };
  }
  if (c.qtype === 'multi') {
    return {
      ...base,
      options: {
        options: Object.entries(c.options || {}).map(([id, text]) => ({
          id,
          text: String(text),
        })),
      },
      answerPayload: {
        kind: 'multi',
        optionIds: String(c.answer)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };
  }
  if (c.qtype === 'judge') {
    const raw = String(c.answer).trim().toLowerCase();
    if (raw !== 'true' && raw !== 'false') {
      throw new Error(`${c.id}: judge answer must be true/false`);
    }
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'judge', value: raw === 'true' },
    };
  }
  if (c.qtype === 'numeric') {
    const value = String(c.answer).trim();
    if (!NUMERIC_VALUE_RE.test(value)) {
      throw new Error(`${c.id}: numeric value illegal: ${value}`);
    }
    return {
      ...base,
      options: null,
      answerPayload: {
        kind: 'numeric',
        value,
        toleranceAbs: 0,
        toleranceRel: 0,
      },
    };
  }
  if (c.qtype === 'application') {
    const rubric = (c.rubric || []).map((r) => ({
      key: String(r.key).trim(),
      title: String(r.title).trim(),
      maxScore: Number(r.score),
      criteria: String(r.criterion ?? '').trim(),
    }));
    const maxScore = Number(c.maxScore);
    const sum = rubric.reduce((s, x) => s + x.maxScore, 0);
    if (!Number.isInteger(maxScore) || maxScore <= 0) {
      throw new Error(`${c.id}: bad maxScore`);
    }
    if (sum !== maxScore) {
      throw new Error(`${c.id}: rubric sum ${sum} != maxScore ${maxScore}`);
    }
    return {
      ...base,
      options: null,
      answerPayload: {
        kind: 'application',
        standardAnswer: String(c.answer),
        maxScore,
        rubric,
      },
    };
  }
  throw new Error(`${c.id}: unsupported qtype ${c.qtype}`);
}

const adaptErrors = [];
const items = [];
for (const c of candidates) {
  try {
    const it = adaptCandidate(c);
    if (!CODE_RE.test(it.code)) adaptErrors.push({ id: c.id, err: 'CODE_FORMAT' });
    if ('status' in it || 'contentVersion' in it) {
      adaptErrors.push({ id: c.id, err: 'FORBIDDEN_FIELD' });
    }
    items.push(it);
  } catch (e) {
    adaptErrors.push({ id: c.id, err: String(e.message || e) });
  }
}

const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g3a_readonly_baseline.json'), 'utf8'),
);
const kpSet = new Set((base.kps || []).map((k) => k.code));
const methodSet = new Set(base.methods || []);
const formalCodes = new Set(
  (base.formalStems || base.stemMeta || []).map((x) => x.code).filter(Boolean),
);

const collide = items.filter((i) => formalCodes.has(i.code)).map((i) => i.code);
const kpMiss = [];
const methodMiss = [];
for (const it of items) {
  for (const k of it.knowledgePointCodes) {
    if (!kpSet.has(k)) kpMiss.push({ code: it.code, kp: k });
  }
  for (const m of it.methodCodes || []) {
    if (!methodSet.has(m)) methodMiss.push({ code: it.code, method: m });
  }
}

const diagDir = path.resolve(__dirname, '../diagrams/required_g3a');
const manifest = JSON.parse(
  fs.readFileSync(path.join(diagDir, '_manifest.json'), 'utf8'),
);
const reqIds = candidates
  .filter((c) => c.diagramRequirement === 'REQUIRED')
  .map((c) => c.id);
const diagReport = [];
for (const id of reqIds) {
  const svg = path.join(diagDir, `${id}.svg`);
  const png = path.join(diagDir, `${id}.png`);
  const man = (manifest.items || []).find((x) => x.code === id);
  const row = { id, svgExists: fs.existsSync(svg), pngExists: fs.existsSync(png) };
  if (row.pngExists) {
    const buf = fs.readFileSync(png);
    row.pngBytes = buf.length;
    row.pngSha256 = crypto.createHash('sha256').update(buf).digest('hex');
    row.pngMagicOk = buf[0] === 0x89 && buf[1] === 0x50;
    row.under2MiB = buf.length <= 2 * 1024 * 1024;
    if (buf.length > 24 && buf.toString('ascii', 12, 16) === 'IHDR') {
      row.width = buf.readUInt32BE(16);
      row.height = buf.readUInt32BE(20);
      row.pxOk = row.width <= 4096 && row.height <= 4096;
    }
    if (man) row.shaMatchManifest = row.pngSha256 === man.sha256_png;
  }
  if (row.svgExists) {
    const s = fs.readFileSync(svg);
    row.svgBytes = s.length;
    row.svgSha256 = crypto.createHash('sha256').update(s).digest('hex');
    const low = s.toString('utf8').toLowerCase();
    row.svgSafe = ![
      '<script',
      'foreignobject',
      'javascript:',
      'onclick',
      'xlink:href',
    ].some((b) => low.includes(b));
    if (man) row.svgShaMatchManifest = row.svgSha256 === man.sha256_svg;
  }
  diagReport.push(row);
}

const nestRequire = createRequire(
  pathToFileURL(path.join(__dirname, '../../../apps/api/package.json')).href,
);
const { validateImportItemStructure } = nestRequire(
  path.join(
    __dirname,
    '../../../apps/api/dist/hs-math/util/train-item-import.validate.js',
  ),
);
const nestFails = [];
const nestWarnCodes = new Set();
for (let i = 0; i < items.length; i++) {
  const r = validateImportItemStructure(items[i], i);
  if (!r.ok) nestFails.push({ code: r.code, errors: r.errors });
  for (const w of r.warnings || []) nestWarnCodes.add(w.code);
}

const out = {
  phase: 'GLOBAL-3B',
  candidateCount: candidates.length,
  adaptedCount: items.length,
  adaptErrors,
  collideFormalCodes: collide,
  kpMiss,
  methodMiss,
  nestFailCount: nestFails.length,
  nestFails,
  nestWarnCodes: [...nestWarnCodes],
  diagReport,
  importShapeOk:
    adaptErrors.length === 0 &&
    collide.length === 0 &&
    kpMiss.length === 0 &&
    methodMiss.length === 0 &&
    nestFails.length === 0,
};
fs.writeFileSync(
  path.join(__dirname, '_g3b_adapt_dryrun.json'),
  JSON.stringify(out, null, 2),
);
fs.writeFileSync(
  path.join(__dirname, '_g3b_adapted_items.json'),
  JSON.stringify(items),
);
console.log(
  JSON.stringify(
    {
      importShapeOk: out.importShapeOk,
      adaptErrors: out.adaptErrors,
      collide: out.collideFormalCodes,
      kpMiss: out.kpMiss.length,
      methodMiss: out.methodMiss.length,
      nestFailCount: out.nestFailCount,
      nestWarnCodes: out.nestWarnCodes,
      diag: out.diagReport.map((d) => ({
        id: d.id,
        png: d.pngExists && d.pngMagicOk && d.under2MiB && d.pxOk,
        svg: d.svgExists && d.svgSafe,
        shaPng: d.shaMatchManifest,
        shaSvg: d.svgShaMatchManifest,
        wh: [d.width, d.height],
        pngBytes: d.pngBytes,
      })),
    },
    null,
    2,
  ),
);
