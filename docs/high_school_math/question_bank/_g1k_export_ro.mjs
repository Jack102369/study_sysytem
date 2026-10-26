/**
 * GLOBAL-1K read-only export: CAND-G1B-001..100 current formal rows.
 * No writes.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let fingerprintTrainItemContent
try {
  ;({ fingerprintTrainItemContent } = require('../../../apps/api/dist/hs-math/util/hs-math-item-content-fingerprint.js'))
} catch {
  fingerprintTrainItemContent = null
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const outJson = path.join(__dirname, '_g1k_export_snapshot.json')

function loadEnv() {
  const env = { ...process.env }
  const p = path.join(root, 'apps/api/.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
}

function parseJson(v) {
  if (v == null) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(String(v))
  } catch {
    return v
  }
}

const DIAGRAM_SHA = {
  'CAND-G1B-093': 'e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1',
  'CAND-G1B-080': 'c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc',
  'CAND-G1B-064': 'a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7',
  'CAND-G1B-091': 'a77867e8beb43226cd1e230b043151a00e851f560026d7882c15b0a5584f19f8',
}

const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const codes = []
for (let i = 1; i <= 100; i++) {
  codes.push(`CAND-G1B-${String(i).padStart(3, '0')}`)
}

const [[dw]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)

const [rows] = await conn.query(
  `SELECT i.id, i.code, i.stem, i.options_json, i.answer_payload_json, i.analysis,
          i.qtype, i.difficulty, i.content_version, i.status, i.pool, i.is_active,
          i.source_type, i.source_year, i.source_exam_name, i.source_question_no,
          i.source_reference, i.source_adaptation_note,
          i.source_verification_status, i.source_license_status,
          s.id AS specialty_id, s.code AS specialty_code, s.name AS specialty_name,
          c.id AS category_id, c.code AS category_code, c.name AS category_name
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id=i.specialty_id
   JOIN hs_math_categories c ON c.id=i.category_id
   WHERE i.code IN (${codes.map(() => '?').join(',')})
   ORDER BY i.code`,
  codes,
)

const byCode = new Map(rows.map((r) => [r.code, r]))
const missing = codes.filter((c) => !byCode.has(c))
const dupCheck = new Map()
for (const r of rows) {
  dupCheck.set(r.code, (dupCheck.get(r.code) || 0) + 1)
}
const duplicateCodes = [...dupCheck.entries()].filter(([, n]) => n > 1).map(([c]) => c)

const items = []
for (const code of codes) {
  const r = byCode.get(code)
  if (!r) continue
  const [kps] = await conn.query(
    `SELECT k.id, k.code, k.name, ik.is_primary
     FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id=ik.knowledge_point_id
     WHERE ik.item_id=? ORDER BY ik.is_primary DESC, k.code`,
    [r.id],
  )
  const [methods] = await conn.query(
    `SELECT m.id, m.code, m.name, im.is_primary
     FROM hs_math_train_item_methods im
     JOIN hs_math_methods m ON m.id=im.method_id
     WHERE im.item_id=? ORDER BY im.is_primary DESC, m.code`,
    [r.id],
  )
  const [links] = await conn.query(
    `SELECT d.id AS link_id, d.object_id, d.sort_order, d.alt_text,
            o.content_sha256, o.mime_type, o.size_bytes, o.width_px, o.height_px
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [r.id],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, content_fingerprint, review_status, review_comment,
            reviewer_user_id, reviewed_at
     FROM hs_math_train_item_reviews WHERE item_id=?
     ORDER BY reviewed_at DESC, id DESC`,
    [r.id],
  )

  const answer = parseJson(r.answer_payload_json)
  const options = parseJson(r.options_json)

  let fp = null
  let fpError = null
  const primaryKp = kps.find((k) => k.is_primary) || kps[0]
  const primaryMethod = methods.find((m) => m.is_primary) || methods[0]
  if (fingerprintTrainItemContent && primaryKp) {
    try {
      fp = fingerprintTrainItemContent({
        code: r.code,
        specialtyCode: r.specialty_code,
        categoryCode: r.category_code,
        qtype: r.qtype,
        difficulty: Number(r.difficulty),
        stem: r.stem,
        optionsJson: options,
        answerPayloadJson: answer,
        analysis: r.analysis,
        knowledgePointCodes: kps.map((k) => k.code),
        primaryKnowledgePointCode: primaryKp.code,
        sourceType: r.source_type,
        sourceYear: r.source_year,
        sourceExamName: r.source_exam_name,
        sourceQuestionNo: r.source_question_no,
        sourceReference: r.source_reference,
        sourceAdaptationNote: r.source_adaptation_note,
        sourceVerificationStatus: r.source_verification_status,
        sourceLicenseStatus: r.source_license_status,
        methodCodes: methods.map((m) => m.code),
        primaryMethodCode: primaryMethod?.code || null,
        diagramSha256List: links.map((l) => l.content_sha256),
      })
    } catch (e) {
      fpError = String(e?.message || e)
    }
  } else if (!fingerprintTrainItemContent) {
    fpError = 'fingerprint util not loaded from dist'
  } else {
    fpError = 'no KP'
  }

  const cv = Number(r.content_version)
  const latestSameCv = reviews.find((rev) => Number(rev.content_version) === cv) || null
  const reviewEffective =
    !!latestSameCv &&
    latestSameCv.review_status === 'passed' &&
    (fp == null ||
      String(latestSameCv.content_fingerprint).toLowerCase() === String(fp).toLowerCase())

  const expectedSha = DIAGRAM_SHA[code] || null
  items.push({
    candidateCode: code,
    itemId: String(r.id),
    contentVersion: cv,
    status: r.status,
    pool: r.pool,
    isActive: Number(r.is_active),
    qtype: r.qtype,
    difficulty: Number(r.difficulty),
    stem: r.stem,
    options,
    answer,
    analysis: r.analysis,
    specialty: { id: String(r.specialty_id), code: r.specialty_code, name: r.specialty_name },
    category: { id: String(r.category_id), code: r.category_code, name: r.category_name },
    kps: kps.map((k) => ({
      id: String(k.id),
      code: k.code,
      name: k.name,
      isPrimary: !!k.is_primary,
    })),
    methods: methods.map((m) => ({
      id: String(m.id),
      code: m.code,
      name: m.name,
      isPrimary: !!m.is_primary,
    })),
    source: {
      type: r.source_type,
      verification: r.source_verification_status,
      license: r.source_license_status,
      reference: r.source_reference,
    },
    diagrams: links.map((l) => ({
      linkId: String(l.link_id),
      objectId: String(l.object_id),
      sortOrder: Number(l.sort_order),
      altText: l.alt_text,
      contentSha256: l.content_sha256,
      mimeType: l.mime_type,
      sizeBytes: Number(l.size_bytes),
    })),
    expectedDiagramSha: expectedSha,
    diagramShaMatch: expectedSha
      ? links.length === 1 && links[0].content_sha256 === expectedSha
      : links.length === 0,
    contentFingerprint: fp,
    fingerprintError: fpError,
    reviews: reviews.slice(0, 5).map((rev) => ({
      id: Number(rev.id),
      contentVersion: Number(rev.content_version),
      contentFingerprint: rev.content_fingerprint,
      reviewStatus: rev.review_status,
      reviewedAt: rev.reviewed_at,
    })),
    reviewEffective: !!reviewEffective,
    latestSameCvReview: latestSameCv
      ? {
          id: Number(latestSameCv.id),
          reviewStatus: latestSameCv.review_status,
          contentFingerprint: latestSameCv.content_fingerprint,
        }
      : null,
  })
}

// Original 13 formal (pre-batch) for duplicate compare: codes not CAND-G1B
const [legacy] = await conn.query(
  `SELECT id, code, stem, qtype, difficulty, status
   FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
     AND code NOT LIKE 'CAND-G1B-%'
   ORDER BY id`,
)
const [otherCand] = await conn.query(
  `SELECT id, code, stem, qtype FROM hs_math_train_items
   WHERE pool='formal' AND code LIKE 'CAND-G1B-%'
     AND code NOT IN (${codes.map(() => '?').join(',')})
   ORDER BY code LIMIT 50`,
  codes,
)

const snapshot = {
  phase: 'HS-MATH-BANK-GLOBAL-1K-EXPORT',
  at: new Date().toISOString(),
  drawable: Number(dw.n),
  expectedCount: 100,
  foundCount: items.length,
  missing,
  duplicateCodes,
  gate: {
    countOk: items.length === 100 && missing.length === 0 && duplicateCodes.length === 0,
    allApproved: items.every((x) => x.status === 'approved'),
    allActiveFormal: items.every((x) => x.pool === 'formal' && x.isActive === 1),
    allReviewEffective: items.every((x) => x.reviewEffective),
    diagramFourOk: ['CAND-G1B-093', 'CAND-G1B-080', 'CAND-G1B-064', 'CAND-G1B-091'].every(
      (c) => items.find((x) => x.candidateCode === c)?.diagramShaMatch,
    ),
    drawable113: Number(dw.n) === 113,
  },
  qtypeCounts: items.reduce((a, x) => {
    a[x.qtype] = (a[x.qtype] || 0) + 1
    return a
  }, {}),
  legacyApprovedNonG1b: legacy.map((x) => ({
    id: String(x.id),
    code: x.code,
    qtype: x.qtype,
    stem: x.stem,
  })),
  otherCandSample: otherCand.map((x) => ({
    id: String(x.id),
    code: x.code,
    qtype: x.qtype,
  })),
  items,
}

fs.writeFileSync(outJson, JSON.stringify(snapshot, null, 2))
// Also slim cards for audit agents
const cards = items.map((it) => ({
  candidateCode: it.candidateCode,
  itemId: it.itemId,
  contentVersion: it.contentVersion,
  status: it.status,
  qtype: it.qtype,
  difficulty: it.difficulty,
  stem: it.stem,
  options: it.options,
  answer: it.answer,
  analysis: it.analysis,
  kps: it.kps,
  methods: it.methods,
  diagrams: it.diagrams,
  expectedDiagramSha: it.expectedDiagramSha,
  diagramShaMatch: it.diagramShaMatch,
  contentFingerprint: it.contentFingerprint,
  reviewEffective: it.reviewEffective,
  specialty: it.specialty,
  category: it.category,
}))
fs.writeFileSync(path.join(__dirname, '_g1k_audit_cards.json'), JSON.stringify(cards, null, 2))

console.log(
  JSON.stringify(
    {
      foundCount: snapshot.foundCount,
      missing,
      duplicateCodes,
      drawable: snapshot.drawable,
      gate: snapshot.gate,
      qtypeCounts: snapshot.qtypeCounts,
      outJson,
      fpErrors: items.filter((x) => x.fingerprintError).length,
      reviewIneffective: items.filter((x) => !x.reviewEffective).map((x) => x.candidateCode),
    },
    null,
    2,
  ),
)

await conn.end()
process.exit(snapshot.gate.countOk ? 0 : 2)
