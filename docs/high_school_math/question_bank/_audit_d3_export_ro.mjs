/**
 * HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1A — read-only export.
 * No writes. Usage: node _audit_d3_export_ro.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, qb } from './_g4e_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(qb, 'bank_global4a')
const snapPath = path.join(outDir, '_hard_audit_baseline_ro.json')
const d3Path = path.join(outDir, '_hard_audit_d3_export.json')

const env = loadEnv()
const conn = await createConnection({ ...dbConfig(env), multipleStatements: false })

async function q(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const DRAWABLE = `pool='formal' AND status='approved' AND is_active=1`

const drawable = Number((await q(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE ${DRAWABLE}`))[0].n)
const byDiff = await q(
  `SELECT difficulty, COUNT(1) AS n FROM hs_math_train_items WHERE ${DRAWABLE} GROUP BY difficulty ORDER BY difficulty`,
)
const byQtype = await q(
  `SELECT qtype, COUNT(1) AS n FROM hs_math_train_items WHERE ${DRAWABLE} GROUP BY qtype ORDER BY qtype`,
)
const bySpec = await q(
  `SELECT s.code AS specialtyCode, s.name AS specialtyName, COUNT(1) AS n
   FROM hs_math_train_items i
   INNER JOIN hs_math_specialties s ON s.id = i.specialty_id
   WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1
   GROUP BY s.code, s.name, s.sort_order
   ORDER BY s.sort_order`,
)
const d3Count = Number(
  (await q(`SELECT COUNT(1) AS n FROM hs_math_train_items WHERE ${DRAWABLE} AND difficulty=3`))[0].n,
)
const g4aDrawable = Number(
  (
    await q(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE ${DRAWABLE} AND code LIKE 'CAND-G4A-%'`,
    )
  )[0].n,
)
const g4aD3 = Number(
  (
    await q(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE ${DRAWABLE} AND difficulty=3 AND code LIKE 'CAND-G4A-%'`,
    )
  )[0].n,
)

const items = await q(
  `SELECT i.id, i.code, i.qtype, i.difficulty, i.stem, i.options_json AS optionsJson,
          i.answer_payload_json AS answerPayloadJson, i.analysis, i.content_version AS contentVersion,
          i.status, i.pool, i.is_active AS isActive, i.specialty_id AS specialtyId,
          i.category_id AS categoryId, i.updated_at AS updatedAt, i.created_at AS createdAt,
          s.code AS specialtyCode, s.name AS specialtyName,
          c.code AS sectionCode, c.name AS sectionName
   FROM hs_math_train_items i
   INNER JOIN hs_math_specialties s ON s.id = i.specialty_id
   INNER JOIN hs_math_categories c ON c.id = i.category_id
   WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1 AND i.difficulty=3
   ORDER BY s.sort_order, c.sort_order, i.id`,
)

const ids = items.map((r) => String(r.id))
let kps = []
let methods = []
let diagrams = []
if (ids.length) {
  kps = await q(
    `SELECT ik.item_id AS itemId, kp.code, kp.name, ik.is_primary AS isPrimary
     FROM hs_math_train_item_kps ik
     INNER JOIN hs_math_knowledge_points kp ON kp.id = ik.knowledge_point_id
     WHERE ik.item_id IN (${ids.map(() => '?').join(',')})
     ORDER BY ik.item_id, ik.is_primary DESC, ik.sort_order`,
    ids,
  )
  methods = await q(
    `SELECT im.item_id AS itemId, m.code, m.name, im.is_primary AS isPrimary
     FROM hs_math_train_item_methods im
     INNER JOIN hs_math_methods m ON m.id = im.method_id
     WHERE im.item_id IN (${ids.map(() => '?').join(',')})
     ORDER BY im.item_id, im.is_primary DESC, im.sort_order`,
    ids,
  )
  try {
    diagrams = await q(
      `SELECT d.item_id AS itemId, o.storage_key AS storageKey, o.content_sha256 AS contentSha256, d.sort_order AS sortOrder
       FROM hs_math_train_item_diagrams d
       INNER JOIN hs_math_train_item_diagram_objects o ON o.id = d.object_id
       WHERE d.item_id IN (${ids.map(() => '?').join(',')})
       ORDER BY d.item_id, d.sort_order`,
      ids,
    )
  } catch {
    diagrams = []
  }
}

const kpBy = {}
for (const r of kps) {
  const id = String(r.itemId)
  ;(kpBy[id] ||= []).push({
    code: r.code,
    name: r.name,
    isPrimary: !!r.isPrimary,
  })
}
const methodBy = {}
for (const r of methods) {
  const id = String(r.itemId)
  ;(methodBy[id] ||= []).push({
    code: r.code,
    name: r.name,
    isPrimary: !!r.isPrimary,
  })
}
const diagBy = {}
for (const r of diagrams) {
  const id = String(r.itemId)
  ;(diagBy[id] ||= []).push({
    storageKey: r.storageKey,
    contentSha256: r.contentSha256,
    sortOrder: r.sortOrder,
  })
}

function contentSha(it) {
  const payload = JSON.stringify({
    code: it.code,
    qtype: it.qtype,
    stem: it.stem,
    optionsJson: it.optionsJson,
    answerPayloadJson: it.answerPayloadJson,
    analysis: it.analysis,
    difficulty: it.difficulty,
    contentVersion: it.contentVersion,
  })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

const enriched = items.map((it) => {
  const id = String(it.id)
  const sha = contentSha(it)
  return {
    itemId: id,
    code: it.code,
    qtype: it.qtype,
    difficulty: Number(it.difficulty),
    specialtyCode: it.specialtyCode,
    specialtyName: it.specialtyName,
    sectionCode: it.sectionCode,
    sectionName: it.sectionName,
    stem: it.stem,
    optionsJson: it.optionsJson,
    answerPayloadJson: it.answerPayloadJson,
    analysis: it.analysis,
    contentVersion: Number(it.contentVersion),
    contentSha256: sha,
    fingerprint: sha,
    status: it.status,
    pool: it.pool,
    isActive: !!it.isActive,
    batch: String(it.code || '').startsWith('CAND-G4A-')
      ? 'G4A'
      : String(it.code || '').startsWith('CAND-G3')
        ? 'G3'
        : String(it.code || '').startsWith('CAND-G2')
          ? 'G2'
          : String(it.code || '').startsWith('CAND-G1')
            ? 'G1'
            : 'LEGACY',
    knowledgePoints: kpBy[id] || [],
    methods: methodBy[id] || [],
    diagrams: diagBy[id] || [],
    updatedAt: it.updatedAt,
  }
})

const baseline = {
  phase: 'HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1A',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  exportedAt: new Date().toISOString(),
  drawableExpected: 813,
  drawableActual: drawable,
  drawableMatch: drawable === 813,
  byDifficulty: byDiff.map((r) => ({ difficulty: Number(r.difficulty), n: Number(r.n) })),
  byQtype: byQtype.map((r) => ({ qtype: r.qtype, n: Number(r.n) })),
  bySpecialty: bySpec.map((r) => ({
    specialtyCode: r.specialtyCode,
    specialtyName: r.specialtyName,
    n: Number(r.n),
  })),
  d3Count,
  g4aDrawable,
  g4aD3,
  d3ExportCount: enriched.length,
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(snapPath, JSON.stringify(baseline, null, 2))
fs.writeFileSync(d3Path, JSON.stringify({ ...baseline, items: enriched }, null, 2))

await conn.end()
console.log(JSON.stringify({ snapPath, d3Path, ...baseline, sampleCodes: enriched.slice(0, 5).map((x) => x.code) }, null, 2))
