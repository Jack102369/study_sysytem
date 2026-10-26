/** GLOBAL-1K-FIX-PREFLIGHT: read-only dump of 022 + 093 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const require = createRequire(import.meta.url)
const { fingerprintTrainItemContent } = require(
  '../../../apps/api/dist/hs-math/util/hs-math-item-content-fingerprint.js',
)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...process.env }
for (const line of fs.readFileSync(path.join(root, 'apps/api/.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
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

const CODES = ['CAND-G1B-022', 'CAND-G1B-093']
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const [[dw]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)

const items = []
for (const code of CODES) {
  const [[r]] = await conn.query(
    `SELECT i.*, s.code AS specialty_code, c.code AS category_code
     FROM hs_math_train_items i
     JOIN hs_math_specialties s ON s.id=i.specialty_id
     JOIN hs_math_categories c ON c.id=i.category_id
     WHERE i.code=?`,
    [code],
  )
  if (!r) {
    items.push({ code, missing: true })
    continue
  }
  const [kps] = await conn.query(
    `SELECT k.code, k.name, ik.is_primary FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id=ik.knowledge_point_id
     WHERE ik.item_id=? ORDER BY ik.is_primary DESC`,
    [r.id],
  )
  const [methods] = await conn.query(
    `SELECT m.code, m.name, im.is_primary FROM hs_math_train_item_methods im
     JOIN hs_math_methods m ON m.id=im.method_id
     WHERE im.item_id=? ORDER BY im.is_primary DESC`,
    [r.id],
  )
  const [links] = await conn.query(
    `SELECT d.id AS link_id, d.object_id, d.sort_order, d.alt_text, o.content_sha256
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [r.id],
  )
  const [reviews] = await conn.query(
    `SELECT id, content_version, content_fingerprint, review_status, reviewed_at
     FROM hs_math_train_item_reviews WHERE item_id=?
     ORDER BY reviewed_at DESC, id DESC LIMIT 5`,
    [r.id],
  )
  const options = parseJson(r.options_json)
  const answer = parseJson(r.answer_payload_json)
  const primaryKp = kps.find((k) => k.is_primary) || kps[0]
  const primaryMethod = methods.find((m) => m.is_primary) || methods[0]
  const fp = fingerprintTrainItemContent({
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
  const cv = Number(r.content_version)
  const latest = reviews.find((x) => Number(x.content_version) === cv)
  items.push({
    itemId: String(r.id),
    candidateCode: r.code,
    qtype: r.qtype,
    difficulty: Number(r.difficulty),
    status: r.status,
    pool: r.pool,
    isActive: Number(r.is_active),
    contentVersion: cv,
    stem: r.stem,
    options,
    answer,
    analysis: r.analysis,
    specialtyCode: r.specialty_code,
    categoryCode: r.category_code,
    kps,
    methods,
    diagrams: links,
    contentFingerprint: fp,
    reviews,
    reviewEffective:
      !!latest &&
      latest.review_status === 'passed' &&
      String(latest.content_fingerprint).toLowerCase() === fp.toLowerCase(),
    latestSameCv: latest || null,
  })
}

const out = {
  at: new Date().toISOString(),
  drawable: Number(dw.n),
  items,
}
fs.writeFileSync(path.join(docs, '_g1k_minor_preflight_ro.json'), JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      drawable: out.drawable,
      items: items.map((it) =>
        it.missing
          ? it
          : {
              code: it.candidateCode,
              itemId: it.itemId,
              status: it.status,
              cv: it.contentVersion,
              qtype: it.qtype,
              difficulty: it.difficulty,
              diagramCount: it.diagrams.length,
              diagramSha: it.diagrams[0]?.content_sha256?.slice(0, 16),
              reviewEffective: it.reviewEffective,
              fp: it.contentFingerprint.slice(0, 16),
              rubric: it.answer?.rubric,
              maxScore: it.answer?.maxScore,
              analysisLen: String(it.analysis || '').length,
            },
      ),
    },
    null,
    2,
  ),
)
await conn.end()
