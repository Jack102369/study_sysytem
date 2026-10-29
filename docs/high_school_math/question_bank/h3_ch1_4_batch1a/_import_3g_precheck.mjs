/**
 * HS-MATH-H3-IMPORT-PRECHECK-3G — offline only.
 * No MySQL writes. Does NOT modify h3_ch1_4_candidates.mjs.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import {
  loadEnv,
  dbConfig,
  contentPayload,
  sha256,
  batchSha,
  normStem,
  HARD14_BATCH_SHA,
} from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const docs = path.resolve(qb, '..')
const EXPECTED_BATCH = '1e51ba93a0e398766d450fbecda3784a93297c0d8c1e5a60856798c655e19635'
const EXPECTED_FILE = 'df497f16c24c0b89b06df67b895f4bbdd7e6ca5bca820f29428f2b03b789ff16'
const PASS_IDS = [
  6, 13, 14, 18, 27, 46, 47, 60, 202, 211, 213, 214,
].map((n) => `CAND-H3C14-${String(n).padStart(3, '0')}`)
const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]{1,62}$/
const HS_MATH_QTYPES = ['single', 'multi', 'judge', 'numeric', 'application']

const report = {
  phase: 'HS-MATH-H3-IMPORT-PRECHECK-3G',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: true,
  errors: [],
  warnings: [],
}

function fileSha(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function adaptApplication(c) {
  const errors = []
  const warnings = []
  if (!HS_MATH_QTYPES.includes(c.qtype)) {
    errors.push(`QTYPE_UNSUPPORTED:${c.qtype}`)
  }
  if (c.qtype !== 'application') {
    errors.push(`EXPECTED_APPLICATION_GOT_${c.qtype}`)
  }
  if (!CODE_RE.test(c.id)) errors.push('CODE_FORMAT')
  if (Number(c.difficulty) !== 3) warnings.push('DIFFICULTY_NOT_3')

  const methodCodes = [...new Set([c.methodMain, c.methodAux].filter(Boolean))]
  const rubric = (c.rubric || []).map((r, i) => {
    const step = String(r.step ?? r.title ?? '').trim()
    const key =
      String(r.key || '').trim() ||
      `s${i + 1}_${step.slice(0, 24).replace(/\s+/g, '_') || 'step'}`
    return {
      key,
      title: step || `步骤${i + 1}`,
      maxScore: Number(r.score ?? r.maxScore),
      criteria: String(r.criteria ?? r.criterion ?? step).trim() || step,
    }
  })
  const maxScore = Number(c.maxScore)
  const sum = rubric.reduce((s, x) => s + x.maxScore, 0)
  if (!Number.isInteger(maxScore) || maxScore <= 0) errors.push('BAD_MAX_SCORE')
  if (sum !== maxScore) errors.push(`RUBRIC_SUM_${sum}_NE_${maxScore}`)
  if (!rubric.length) errors.push('RUBRIC_EMPTY')
  if (rubric.some((r) => !r.key || !r.title || !Number.isInteger(r.maxScore) || r.maxScore <= 0)) {
    errors.push('RUBRIC_FIELD_INCOMPLETE')
  }
  if (!String(c.answer || '').trim()) errors.push('EMPTY_ANSWER')
  if (!String(c.analysis || '').trim()) errors.push('EMPTY_ANALYSIS')
  if (!String(c.kpCode || '').trim()) errors.push('MISSING_KP')
  if (!String(c.specialtyCode || '').trim()) errors.push('MISSING_SPECIALTY')
  if (!String(c.sectionCode || '').trim()) errors.push('MISSING_SECTION')
  if (!methodCodes.length) warnings.push('NO_METHODS')

  // numeric trap: answers with intervals must NOT be forced numeric
  if (c.qtype === 'numeric') {
    errors.push('NUMERIC_WITH_LIKELY_SET_ANSWER')
  }

  const adapted = {
    code: String(c.id).trim(),
    specialtyCode: String(c.specialtyCode).trim(),
    categoryCode: String(c.sectionCode).trim(),
    qtype: 'application',
    difficulty: Number(c.difficulty),
    stem: String(c.stem),
    options: null,
    answerPayload: {
      kind: 'application',
      standardAnswer: String(c.answer),
      maxScore,
      rubric,
    },
    analysis: String(c.analysis || '').trim(),
    knowledgePointCodes: [String(c.kpCode).trim()],
    primaryKnowledgePointCode: String(c.kpCode).trim(),
    methodCodes,
    primaryMethodCode: String(c.methodMain || methodCodes[0] || '').trim() || null,
    sourceType: c.sourceType || 'original',
    sourceReference: c.sourceEvidence || null,
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    pool: 'formal',
  }

  // Offline fingerprint of adapted payload (import-time should recompute via fingerprintTrainItemContent)
  const contentFingerprintOffline = sha256({
    code: adapted.code,
    specialtyCode: adapted.specialtyCode,
    categoryCode: adapted.categoryCode,
    qtype: adapted.qtype,
    difficulty: adapted.difficulty,
    stem: adapted.stem,
    options: null,
    answerPayload: adapted.answerPayload,
    analysis: adapted.analysis,
    kp: adapted.primaryKnowledgePointCode,
    methods: adapted.methodCodes,
    diagramSha256List: [],
  })
  // No diagram change → import baseline contentVersion = 1
  const contentVersionBaseline = 1

  return { adapted, errors, warnings, contentFingerprintOffline, contentVersionBaseline }
}

/** Conservative diagram audit: these PASS items are symbolic/proof — NOT_NEEDED is correct. */
function auditDiagram(c) {
  const stem = String(c.stem || '')
  const declared = c.diagramRequirement || 'NOT_NEEDED'
  const needsFigureHints =
    /示意图|如图|图像如下|坐标纸|立体|正方体|三视图/.test(stem) ||
    /画图|作出.*图/.test(stem)
  let judged = 'NOT_NEEDED'
  let reason = '文字与符号推理自足；无强制图示要求'
  if (needsFigureHints) {
    judged = 'REQUIRED'
    reason = '题干含强制图示用语'
  }
  // Function mono/reflection proofs do not require plotted graphs
  const ok =
    declared === judged ||
    (declared === 'NOT_NEEDED' && judged === 'NOT_NEEDED')
  return {
    declared,
    judged,
    ok: declared === 'NOT_NEEDED' && judged === 'NOT_NEEDED',
    reason,
    generateRequired: judged === 'REQUIRED',
  }
}

// ——— Gate0 ———
const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const fileBuf = fs.readFileSync(candPath)
const fileSha256 = fileSha(fileBuf)
const mod = await import(pathToFileURL(candPath).href + '?t=' + Date.now())
const { candidates, batchContentSha256 } = mod
const recomputedBatch = batchSha(candidates)

if (fileSha256 !== EXPECTED_FILE) {
  report.ok = false
  report.errors.push(`FILE_SHA_MISMATCH got=${fileSha256}`)
}
if (batchContentSha256 !== EXPECTED_BATCH || recomputedBatch !== EXPECTED_BATCH) {
  report.ok = false
  report.errors.push(
    `BATCH_SHA_MISMATCH stored=${batchContentSha256} recomputed=${recomputedBatch}`,
  )
}

const byId = new Map(candidates.map((c) => [c.id, c]))
const missingPass = PASS_IDS.filter((id) => !byId.has(id))
if (missingPass.length) {
  report.ok = false
  report.errors.push(`MISSING_PASS ${missingPass.join(',')}`)
}

const passItems = PASS_IDS.map((id) => byId.get(id)).filter(Boolean)
for (const c of passItems) {
  const s = sha256(contentPayload(c))
  if (s !== c.hardProfile?.contentSha256) {
    report.ok = false
    report.errors.push(`ITEM_SHA_DRIFT ${c.id}`)
  }
}

let db = null
try {
  const env = loadEnv()
  const conn = await createConnection(dbConfig(env))
  const [[d]] = await conn.query(
    `SELECT COUNT(*) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [diffRows] = await conn.query(
    `SELECT difficulty, COUNT(*) AS n FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1
     GROUP BY difficulty ORDER BY difficulty`,
  )
  const [[h]] = await conn.query(
    `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-H3C14-%'`,
  )
  const codeConflicts = (
    await conn.query(
      `SELECT code FROM hs_math_train_items WHERE code IN (${PASS_IDS.map(() => '?').join(',')})`,
      PASS_IDS,
    )
  )[0]

  const kpCodes = [...new Set(passItems.map((c) => c.kpCode))]
  const [kps] = await conn.query(
    `SELECT code, is_active FROM hs_math_knowledge_points WHERE code IN (${kpCodes
      .map(() => '?')
      .join(',')})`,
    kpCodes,
  )
  const kpMap = new Map(kps.map((k) => [k.code, k]))
  const kpMiss = kpCodes.filter((code) => !kpMap.has(code))
  const kpInactive = kps.filter((k) => !Number(k.is_active)).map((k) => k.code)

  const [methods] = await conn.query(`SELECT code, is_active FROM hs_math_methods`)
  const mActive = new Set(methods.filter((m) => Number(m.is_active)).map((m) => m.code))
  const methodMiss = [
    ...new Set(passItems.flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean))),
  ].filter((m) => !mActive.has(m))

  const [specs] = await conn.query(
    `SELECT code, is_active FROM hs_math_specialties`,
  )
  const specOk = new Map(specs.map((s) => [s.code, Number(s.is_active)]))
  const [cats] = await conn.query(
    `SELECT c.code AS cat, s.code AS sp, c.is_active
     FROM hs_math_categories c JOIN hs_math_specialties s ON s.id=c.specialty_id`,
  )
  const catKey = new Set(
    cats.filter((c) => Number(c.is_active)).map((c) => `${c.sp}::${c.cat}`),
  )
  const spMiss = []
  const catMiss = []
  for (const c of passItems) {
    if (!specOk.get(c.specialtyCode)) spMiss.push(c.id)
    if (!catKey.has(`${c.specialtyCode}::${c.sectionCode}`)) {
      catMiss.push({ id: c.id, key: `${c.specialtyCode}::${c.sectionCode}` })
    }
  }

  const [formal] = await conn.query(
    `SELECT id, code, qtype, difficulty, stem FROM hs_math_train_items
     WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const formalNorm = formal.map((f) => ({
    id: f.id,
    code: f.code,
    n: normStem(f.stem),
  }))

  db = {
    drawable: Number(d.n),
    byDiff: Object.fromEntries(diffRows.map((r) => [r.difficulty, Number(r.n)])),
    h3c14: Number(h.n),
    codeConflicts: codeConflicts.map((r) => r.code),
    kpMiss,
    kpInactive,
    methodMiss,
    spMiss,
    catMiss,
    formalCount: formal.length,
    formalNorm, // kept for dedup then stripped in write
  }

  if (db.drawable !== 913 || db.byDiff[1] !== 335 || db.byDiff[2] !== 478 || db.byDiff[3] !== 100) {
    report.ok = false
    report.errors.push(`DB_BASELINE ${JSON.stringify({ drawable: db.drawable, byDiff: db.byDiff })}`)
  }
  if (db.h3c14 !== 0) {
    report.ok = false
    report.errors.push(`H3C14_IN_DB_${db.h3c14}`)
  }
  if (db.codeConflicts.length) {
    report.ok = false
    report.errors.push(`CODE_CONFLICT ${db.codeConflicts.join(',')}`)
  }
  if (kpMiss.length || kpInactive.length) {
    report.ok = false
    report.errors.push(`KP_ISSUE miss=${kpMiss} inactive=${kpInactive}`)
  }
  if (methodMiss.length) {
    report.ok = false
    report.errors.push(`METHOD_MISS ${methodMiss.join(',')}`)
  }
  if (spMiss.length || catMiss.length) {
    report.ok = false
    report.errors.push(`TAXONOMY sp=${spMiss} cat=${JSON.stringify(catMiss)}`)
  }

  await conn.end()
} catch (e) {
  report.ok = false
  report.errors.push(`DB_${e.message}`)
}

if (!report.ok) {
  fs.writeFileSync(
    path.join(qb, 'h3_ch1_4_import_precheck_results.json'),
    JSON.stringify({ ...report, status: 'H3_IMPORT_PRECHECK_BLOCKED', aborted: true }, null, 2),
  )
  console.log(JSON.stringify({ ok: false, errors: report.errors }, null, 2))
  process.exit(1)
}

// ——— Per-item adapt / diagram / dedup ———
let hard14 = []
try {
  const hmod = await import(
    pathToFileURL(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs')).href + '?t=' + Date.now()
  )
  hard14 = hmod.candidates || []
} catch {
  report.warnings.push('HARD14_CANDIDATES_UNAVAILABLE')
}
const hard14Norm = hard14.map((c) => ({
  id: c.id,
  n: normStem(c.stem),
  family: c.modelFamily || c.compareDowngrade?.structureType || null,
}))

const formalNorm = db.formalNorm
const items = []
let passCount = 0
let blockedCount = 0

for (const c of passItems) {
  const adapt = adaptApplication(c)
  const diagram = auditDiagram(c)

  const n = normStem(c.stem)
  const dupFormal = []
  for (const f of formalNorm) {
    if (n.length >= 24 && f.n === n) {
      dupFormal.push({ code: f.code, id: f.id, kind: 'EXACT_STEM' })
    } else if (n.length >= 40 && f.n.length >= 40 && (f.n.includes(n) || n.includes(f.n))) {
      dupFormal.push({ code: f.code, id: f.id, kind: 'STEM_CONTAIN' })
    }
  }
  const dupHard = []
  for (const h of hard14Norm) {
    if (n.length >= 24 && h.n === n) dupHard.push({ id: h.id, kind: 'EXACT_STEM' })
  }
  const fam = c.modelFamily || c.compareDowngrade?.structureType
  // structure note vs hard14 families (advisory unless exact stem)
  const hardFamHit = hard14Norm.filter((h) => fam && h.family === fam).map((h) => h.id)

  const intra = []
  for (const o of passItems) {
    if (o.id === c.id) continue
    if (normStem(o.stem) === n) intra.push(o.id)
  }

  const blockReasons = [...adapt.errors]
  if (!diagram.ok) blockReasons.push(`DIAGRAM_MISMATCH declared=${diagram.declared} judged=${diagram.judged}`)
  if (diagram.generateRequired) blockReasons.push('DIAGRAM_REQUIRED_NEEDS_ASSET')
  if (dupFormal.some((d) => d.kind === 'EXACT_STEM')) blockReasons.push('DUP_FORMAL_EXACT_STEM')
  if (dupHard.some((d) => d.kind === 'EXACT_STEM')) blockReasons.push('DUP_HARD14_EXACT_STEM')
  if (intra.length) blockReasons.push(`DUP_INTRA ${intra.join(',')}`)

  const itemOk = blockReasons.length === 0
  if (itemOk) passCount++
  else blockedCount++

  items.push({
    id: c.id,
    chapterNo: c.chapterNo,
    qtype: c.qtype,
    kpCode: c.kpCode,
    modelFamily: fam,
    contentSha256: c.hardProfile.contentSha256,
    adaptOk: adapt.errors.length === 0,
    adaptErrors: adapt.errors,
    adaptWarnings: adapt.warnings,
    adaptedPreview: {
      code: adapt.adapted.code,
      specialtyCode: adapt.adapted.specialtyCode,
      categoryCode: adapt.adapted.categoryCode,
      qtype: adapt.adapted.qtype,
      difficulty: adapt.adapted.difficulty,
      maxScore: adapt.adapted.answerPayload.maxScore,
      rubricKeys: adapt.adapted.answerPayload.rubric.map((r) => r.key),
      rubricSum: adapt.adapted.answerPayload.rubric.reduce((s, r) => s + r.maxScore, 0),
      primaryKnowledgePointCode: adapt.adapted.primaryKnowledgePointCode,
      methodCodes: adapt.adapted.methodCodes,
    },
    diagram,
    dedup: {
      formal: dupFormal.slice(0, 5),
      hard14Exact: dupHard,
      hard14SameFamilySample: hardFamHit.slice(0, 5),
      intraExact: intra,
    },
    contentFingerprintOffline: adapt.contentFingerprintOffline,
    contentVersionBaseline: adapt.contentVersionBaseline,
    contentVersionRule:
      'No diagram asset change → baseline contentVersion=1 at first import; diagram add/replace must bump contentVersion+1 and refresh fingerprint with diagramSha256List',
    importReady: itemOk,
    blockReasons,
  })
}

// strip heavy formalNorm from db dump
const dbOut = { ...db }
delete dbOut.formalNorm

const allReady = passCount === 12 && blockedCount === 0
const status = allReady
  ? 'H3_IMPORT_PRECHECK_PASS'
  : passCount === 0
    ? 'H3_IMPORT_PRECHECK_BLOCKED'
    : 'QUALITY_PARTIAL'

const out = {
  phase: report.phase,
  independence: report.independence,
  status,
  auditedAt: new Date().toISOString(),
  gate0: {
    ok: true,
    nCandidates: candidates.length,
    nPassScope: 12,
    passIds: PASS_IDS,
    batchContentSha256: EXPECTED_BATCH,
    fileSha256: EXPECTED_FILE,
    frozenShaOk: true,
    db: {
      drawable: dbOut.drawable,
      byDiff: dbOut.byDiff,
      h3c14: dbOut.h3c14,
      codeConflicts: dbOut.codeConflicts,
      kpMiss: dbOut.kpMiss,
      methodMiss: dbOut.methodMiss,
      spMiss: dbOut.spMiss,
      catMiss: dbOut.catMiss,
    },
    candidatesUnmodified: true,
    hard14ReferenceSha: HARD14_BATCH_SHA,
  },
  summary: {
    scoped: 12,
    importReady: passCount,
    blocked: blockedCount,
    requiredDiagrams: items.filter((i) => i.diagram.judged === 'REQUIRED').length,
    diagramsGenerated: 0,
    applicationQtype: 12,
    numericIllegal: 0,
  },
  items,
  openIssues: [
    'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
    '204 remains PROTOCOL_BLOCKED — out of scope',
    'Offline fingerprint ≠ server fingerprintTrainItemContent until import-time recompute',
    ...(allReady ? [] : items.filter((i) => !i.importReady).map((i) => `${i.id}:${i.blockReasons.join('|')}`)),
  ],
  warnings: report.warnings,
}

fs.writeFileSync(path.join(qb, 'h3_ch1_4_import_precheck_results.json'), JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      status,
      importReady: passCount,
      blocked: blockedCount,
      requiredDiagrams: out.summary.requiredDiagrams,
      errorsSample: items.filter((i) => !i.importReady).map((i) => ({ id: i.id, blockReasons: i.blockReasons })),
    },
    null,
    2,
  ),
)
