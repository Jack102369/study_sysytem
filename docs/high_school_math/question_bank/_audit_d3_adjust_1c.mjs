/**
 * HS-MATH-BANK-HARD-DIFFICULTY-ADJUST-1C
 * Admin API only: PATCH difficulty → review → approve. Groups of 50.
 * No SQL writes. No content field changes.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import {
  qb,
  docs,
  loadEnv,
  signJwt,
  api,
  dataOf,
  dbConfig,
} from './_g4e_lib.mjs'

const PHASE = 'HS-MATH-BANK-HARD-DIFFICULTY-ADJUST-1C'
const snapDir = path.join(qb, 'bank_global4a', '_hard_adjust_1c_snapshots')
const outJson = path.join(qb, 'hard_difficulty_adjust_results.json')
const recPath = path.join(qb, 'hard_difficulty_final_recommendations.json')

fs.mkdirSync(snapDir, { recursive: true })

const env = loadEnv()
const startedAt = new Date().toISOString()
const report = {
  phase: PHASE,
  status: 'IN_PROGRESS',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt,
  endedAt: null,
  base: process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000',
  pre: null,
  groups: [],
  items: {},
  post: null,
  errors: [],
  blockers: [],
}

function finish(code) {
  report.endedAt = new Date().toISOString()
  if (code === 0 && report.status === 'IN_PROGRESS') {
    report.status = 'DIFFICULTY_ADJUST_PASS'
  }
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        status: report.status,
        errors: report.errors.slice(0, 20),
        blockers: report.blockers.slice(0, 20),
        done: Object.keys(report.items).filter((k) => report.items[k].approved).length,
        post: report.post,
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

function block(msg) {
  report.status = 'DIFFICULTY_ADJUST_BLOCKED'
  report.blockers.push(msg)
  finish(2)
}

function failPartial(msg) {
  report.status = 'DIFFICULTY_ADJUST_PARTIAL'
  report.errors.push(msg)
  finish(1)
}

function shaHex(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex')
}

/** Prefer selected column; keep JSON null (do not collapse null→undefined). */
function field(row, snake, camel) {
  if (Object.prototype.hasOwnProperty.call(row, snake)) return row[snake]
  if (Object.prototype.hasOwnProperty.call(row, camel)) return row[camel]
  return null
}

/** 1B audit fingerprint (includes difficulty + contentVersion) */
function auditFingerprint(row) {
  return shaHex({
    code: row.code,
    qtype: row.qtype,
    stem: row.stem,
    optionsJson: field(row, 'options_json', 'optionsJson'),
    answerPayloadJson: field(row, 'answer_payload_json', 'answerPayloadJson'),
    analysis: row.analysis,
    difficulty: Number(row.difficulty),
    contentVersion: Number(field(row, 'content_version', 'contentVersion')),
  })
}

/** Math content SHA excluding difficulty & contentVersion */
function mathContentSha(row, extras = {}) {
  return shaHex({
    code: row.code,
    qtype: row.qtype,
    stem: row.stem,
    optionsJson: normalizeJson(row.options_json ?? row.optionsJson),
    answerPayloadJson: normalizeJson(row.answer_payload_json ?? row.answerPayloadJson),
    analysis: row.analysis == null ? null : String(row.analysis),
    sourceType: row.source_type ?? row.sourceType ?? null,
    sourceYear: row.source_year ?? row.sourceYear ?? null,
    sourceExamName: row.source_exam_name ?? row.sourceExamName ?? null,
    sourceQuestionNo: row.source_question_no ?? row.sourceQuestionNo ?? null,
    sourceReference: row.source_reference ?? row.sourceReference ?? null,
    sourceAdaptationNote: row.source_adaptation_note ?? row.sourceAdaptationNote ?? null,
    sourceVerificationStatus: row.source_verification_status ?? row.sourceVerificationStatus ?? null,
    sourceLicenseStatus: row.source_license_status ?? row.sourceLicenseStatus ?? null,
    kpCodes: extras.kpCodes || [],
    methodCodes: extras.methodCodes || [],
    diagramShas: extras.diagramShas || [],
  })
}

function normalizeJson(v) {
  if (v == null) return null
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return v
    }
  }
  return v
}

function parseJson(v) {
  return normalizeJson(v)
}

const finalRecs = JSON.parse(fs.readFileSync(recPath, 'utf8'))
const recs = finalRecs.recommendations || []
if (recs.length !== 200) block(`recommendations length=${recs.length} != 200`)

const toD2 = recs.filter((r) => r.recommendedDifficulty === 2)
const toD1 = recs.filter((r) => r.recommendedDifficulty === 1)
if (toD2.length !== 156 || toD1.length !== 44) {
  block(`d2=${toD2.length} d1=${toD1.length} expected 156/44`)
}
const ids = [...new Set(recs.map((r) => String(r.itemId)))]
if (ids.length !== 200) block(`duplicate itemIds: unique=${ids.length}`)

const conn = await createConnection({ ...dbConfig(env), charset: 'utf8mb4' })
async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const [[admin]] = await conn.query(
  `SELECT id, role FROM users WHERE id=2 OR role='ADMIN' ORDER BY id ASC LIMIT 1`,
)
if (!admin || String(admin.role).toUpperCase() !== 'ADMIN') {
  await conn.end()
  block('no ADMIN user')
}
if (!env.JWT_SECRET) {
  await conn.end()
  block('JWT_SECRET missing')
}
const token = signJwt(String(admin.id), 'ADMIN', env.JWT_SECRET)

// —— baseline ——
const drawable0 = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const byDiff0 = await many(
  `SELECT difficulty, COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
   GROUP BY difficulty ORDER BY difficulty`,
)
const diffMap0 = Object.fromEntries(byDiff0.map((r) => [Number(r.difficulty), Number(r.n)]))
const sessions0 = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems0 = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)

if (drawable0 !== 813) {
  await conn.end()
  block(`drawable=${drawable0} != 813`)
}
if (diffMap0[1] !== 291 || diffMap0[2] !== 322 || diffMap0[3] !== 200) {
  await conn.end()
  block(`diff dist ${JSON.stringify(diffMap0)} != 291/322/200`)
}

const placeholders = ids.map(() => '?').join(',')
const dbRows = await many(
  `SELECT i.id, i.code, i.qtype, i.stem, i.options_json, i.answer_payload_json, i.analysis,
          i.difficulty, i.content_version, i.status, i.pool, i.is_active,
          i.source_type, i.source_year, i.source_exam_name, i.source_question_no,
          i.source_reference, i.source_adaptation_note, i.source_verification_status,
          i.source_license_status, i.specialty_id, i.category_id, i.knowledge_point_id,
          s.code AS specialty_code, c.code AS category_code
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id=i.specialty_id
   JOIN hs_math_categories c ON c.id=i.category_id
   WHERE i.id IN (${placeholders})
   ORDER BY i.id ASC`,
  ids,
)
if (dbRows.length !== 200) {
  await conn.end()
  block(`db rows for targets=${dbRows.length} != 200`)
}

const byId = Object.fromEntries(dbRows.map((r) => [String(r.id), r]))
const recById = Object.fromEntries(recs.map((r) => [String(r.itemId), r]))

const gateFails = []
for (const rec of recs) {
  const row = byId[String(rec.itemId)]
  if (!row) {
    gateFails.push(`${rec.code}: missing`)
    continue
  }
  if (row.code !== rec.code) gateFails.push(`${rec.code}: code mismatch`)
  if (Number(row.difficulty) !== 3) gateFails.push(`${rec.code}: difficulty=${row.difficulty}`)
  if (row.status !== 'approved') gateFails.push(`${rec.code}: status=${row.status}`)
  if (row.pool !== 'formal' || Number(row.is_active) !== 1) {
    gateFails.push(`${rec.code}: not drawable`)
  }
  if (Number(row.content_version) !== Number(rec.contentVersion)) {
    gateFails.push(
      `${rec.code}: cv ${row.content_version}!=${rec.contentVersion}`,
    )
  }
  const fp = auditFingerprint(row)
  if (fp !== rec.fingerprint) {
    gateFails.push(`${rec.code}: fingerprint drift`)
  }
}
if (gateFails.length) {
  await conn.end()
  block(`pre-gate fails (${gateFails.length}): ${gateFails.slice(0, 10).join('; ')}`)
}

// —— full 813 snapshot (light) + 200 deep ——
const all813 = await many(
  `SELECT i.id, i.code, i.status, i.difficulty, i.content_version, i.qtype, i.pool, i.is_active,
          s.code AS specialty_code, c.code AS category_code,
          (SELECT GROUP_CONCAT(o.content_sha256 ORDER BY d.sort_order SEPARATOR ',')
             FROM hs_math_train_item_diagrams d
             JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
             WHERE d.item_id=i.id) AS diagram_shas
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id=i.specialty_id
   JOIN hs_math_categories c ON c.id=i.category_id
   WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1
   ORDER BY i.id`,
)
const others613Ids = all813
  .map((r) => String(r.id))
  .filter((id) => !recById[id])
if (all813.length !== 813 || others613Ids.length !== 613) {
  await conn.end()
  block(`813 snap size ${all813.length}, others ${others613Ids.length}`)
}

const othersFingerprint = shaHex(
  all813
    .filter((r) => !recById[String(r.id)])
    .map((r) => ({
      id: String(r.id),
      code: r.code,
      status: r.status,
      difficulty: Number(r.difficulty),
      cv: Number(r.content_version),
      qtype: r.qtype,
      diagrams: r.diagram_shas || '',
    })),
)

async function loadExtras(itemId) {
  const kps = await many(
    `SELECT k.code FROM hs_math_train_item_kps ik
     JOIN hs_math_knowledge_points k ON k.id=ik.knowledge_point_id
     WHERE ik.item_id=? ORDER BY ik.sort_order, ik.id`,
    [itemId],
  )
  let methods = []
  try {
    methods = await many(
      `SELECT m.code FROM hs_math_train_item_methods im
       JOIN hs_math_methods m ON m.id=im.method_id
       WHERE im.item_id=? ORDER BY im.sort_order, im.id`,
      [itemId],
    )
  } catch {
    methods = []
  }
  let diags = []
  try {
    diags = await many(
      `SELECT o.content_sha256 AS sha, d.sort_order AS sortOrder
       FROM hs_math_train_item_diagrams d
       JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
       WHERE d.item_id=? ORDER BY d.sort_order, d.id`,
      [itemId],
    )
  } catch {
    diags = []
  }
  return {
    kpCodes: kps.map((x) => x.code),
    methodCodes: methods.map((x) => x.code),
    diagramShas: diags.map((x) => String(x.sha).toLowerCase()),
  }
}

const deep200 = []
for (const row of dbRows) {
  const extras = await loadExtras(row.id)
  const mathSha = mathContentSha(row, extras)
  deep200.push({
    itemId: String(row.id),
    code: row.code,
    difficulty: Number(row.difficulty),
    contentVersion: Number(row.content_version),
    auditFp: auditFingerprint(row),
    mathSha,
    extras,
    stem: row.stem,
    optionsJson: parseJson(row.options_json),
    answerPayloadJson: parseJson(row.answer_payload_json),
    analysis: row.analysis,
    source: {
      sourceType: row.source_type,
      sourceYear: row.source_year,
      sourceExamName: row.source_exam_name,
      sourceQuestionNo: row.source_question_no,
      sourceReference: row.source_reference,
      sourceAdaptationNote: row.source_adaptation_note,
      sourceVerificationStatus: row.source_verification_status,
      sourceLicenseStatus: row.source_license_status,
    },
  })
}
const deepById = Object.fromEntries(deep200.map((d) => [d.itemId, d]))

fs.writeFileSync(
  path.join(snapDir, 'pre_813_light.json'),
  JSON.stringify(
    {
      at: startedAt,
      drawable: drawable0,
      byDifficulty: diffMap0,
      sessions: sessions0,
      sessionItems: sessionItems0,
      othersFingerprint,
      items: all813.map((r) => ({
        id: String(r.id),
        code: r.code,
        status: r.status,
        difficulty: Number(r.difficulty),
        contentVersion: Number(r.content_version),
        qtype: r.qtype,
        specialtyCode: r.specialty_code,
        categoryCode: r.category_code,
        diagramShas: r.diagram_shas || '',
        drawable: true,
      })),
    },
    null,
    2,
  ),
)
fs.writeFileSync(
  path.join(snapDir, 'pre_200_deep.json'),
  JSON.stringify({ at: startedAt, items: deep200 }, null, 2),
)

report.pre = {
  drawable: drawable0,
  byDifficulty: diffMap0,
  sessions: sessions0,
  sessionItems: sessionItems0,
  recommendations: { total: 200, toD2: 156, toD1: 44 },
  othersFingerprint,
  gateOk: true,
}

// ping API
const ping = await api('GET', '/hs-math/admin/train-items?page=1&pageSize=1', token)
if (ping.status >= 400) {
  await conn.end()
  block(`admin API unavailable http=${ping.status}`)
}

// sort by itemId, 4 groups × 50
const sorted = [...recs].sort((a, b) => Number(a.itemId) - Number(b.itemId))
const groups = [0, 1, 2, 3].map((g) => sorted.slice(g * 50, g * 50 + 50))

async function drawableNow() {
  return Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_items
         WHERE pool='formal' AND status='approved' AND is_active=1`,
      )
    ).n,
  )
}

async function loadRow(id) {
  return one(
    `SELECT i.id, i.code, i.qtype, i.stem, i.options_json, i.answer_payload_json, i.analysis,
            i.difficulty, i.content_version, i.status, i.pool, i.is_active,
            i.source_type, i.source_year, i.source_exam_name, i.source_question_no,
            i.source_reference, i.source_adaptation_note, i.source_verification_status,
            i.source_license_status
     FROM hs_math_train_items i WHERE i.id=?`,
    [id],
  )
}

for (let gi = 0; gi < groups.length; gi++) {
  const group = groups[gi]
  const gReport = {
    group: gi + 1,
    size: group.length,
    startedAt: new Date().toISOString(),
    itemIds: group.map((r) => r.itemId),
    completed: [],
    failedAt: null,
  }
  console.error(`[1C] group ${gi + 1}/4 start (${group.length})`)

  for (const rec of group) {
    const id = String(rec.itemId)
    const targetDiff = Number(rec.recommendedDifficulty)
    const pre = deepById[id]
    const itemLog = {
      itemId: id,
      code: rec.code,
      from: 3,
      to: targetDiff,
      preCv: pre.contentVersion,
      preAuditFp: pre.auditFp,
      preMathSha: pre.mathSha,
      patched: false,
      reviewed: false,
      approved: false,
      postCv: null,
      postFp: null,
      postMathSha: null,
      reviewId: null,
      error: null,
    }

    try {
      // re-check version gate immediately before PATCH
      const before = await loadRow(id)
      if (!before || Number(before.difficulty) !== 3 || before.status !== 'approved') {
        throw new Error(
          `pre-patch state unexpected d=${before?.difficulty} st=${before?.status}`,
        )
      }
      if (Number(before.content_version) !== Number(rec.contentVersion)) {
        throw new Error(
          `cv drift before patch ${before.content_version}!=${rec.contentVersion}`,
        )
      }
      if (auditFingerprint(before) !== rec.fingerprint) {
        throw new Error('fingerprint drift before patch')
      }

      const patchRes = await api('PATCH', `/hs-math/admin/train-items/${id}`, token, {
        difficulty: targetDiff,
        expectedContentVersion: Number(rec.contentVersion),
      })
      const patchData = dataOf(patchRes.json)
      if (patchRes.status >= 400) {
        throw new Error(
          `PATCH http=${patchRes.status} ${JSON.stringify(patchRes.json).slice(0, 300)}`,
        )
      }
      if (Number(patchData?.difficulty) !== targetDiff) {
        throw new Error(`PATCH difficulty=${patchData?.difficulty}`)
      }
      if (Number(patchData?.contentVersion) !== Number(rec.contentVersion) + 1) {
        throw new Error(
          `cv after patch=${patchData?.contentVersion} expected ${Number(rec.contentVersion) + 1}`,
        )
      }
      if (patchData?.status !== 'draft') {
        throw new Error(`status after patch=${patchData?.status} expected draft`)
      }
      itemLog.patched = true
      itemLog.postCv = Number(patchData.contentVersion)

      // verify math content unchanged
      const afterPatch = await loadRow(id)
      const extrasAfter = await loadExtras(id)
      const mathAfter = mathContentSha(afterPatch, extrasAfter)
      if (mathAfter !== pre.mathSha) {
        throw new Error('math content SHA changed after PATCH')
      }
      if (
        JSON.stringify(extrasAfter.kpCodes) !== JSON.stringify(pre.extras.kpCodes) ||
        JSON.stringify(extrasAfter.methodCodes) !==
          JSON.stringify(pre.extras.methodCodes) ||
        JSON.stringify(extrasAfter.diagramShas) !==
          JSON.stringify(pre.extras.diagramShas)
      ) {
        throw new Error('KP/method/diagram changed after PATCH')
      }
      itemLog.postMathSha = mathAfter

      // review panel
      const panelRes = await api(
        'GET',
        `/hs-math/admin/train-items/${id}/review-panel`,
        token,
      )
      const panel = dataOf(panelRes.json)
      if (panelRes.status >= 400 || !panel?.contentFingerprint) {
        throw new Error(`review-panel http=${panelRes.status}`)
      }
      if (Number(panel.contentVersion) !== itemLog.postCv) {
        throw new Error('panel cv mismatch')
      }
      itemLog.postFp = panel.contentFingerprint

      const comment = [
        `${PHASE} 难度标签调整审核（作者侧，非独立终审）。`,
        `difficulty ${3}→${targetDiff}；数学内容（stem/options/answer/analysis/KP/method/diagram/source）未改。`,
        `绑定 contentVersion=${panel.contentVersion} fingerprint=${String(panel.contentFingerprint).slice(0, 16)}…`,
        `依据 1B 最终建议；INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED。`,
      ]
        .join('')
        .slice(0, 2000)

      const revRes = await api('POST', `/hs-math/admin/train-items/${id}/reviews`, token, {
        decision: 'passed',
        comment,
        expectedContentVersion: Number(panel.contentVersion),
        expectedContentFingerprint: panel.contentFingerprint,
      })
      const revData = dataOf(revRes.json)
      if (revRes.status >= 400 || revData?.reviewStatus !== 'passed') {
        throw new Error(
          `review http=${revRes.status} ${JSON.stringify(revRes.json).slice(0, 300)}`,
        )
      }
      itemLog.reviewed = true
      itemLog.reviewId = revData?.id ?? revData?.reviewId ?? null

      const apprRes = await api(
        'PATCH',
        `/hs-math/admin/train-items/${id}/status`,
        token,
        { status: 'approved', confirmPublish: true },
      )
      const apprData = dataOf(apprRes.json)
      if (apprRes.status >= 400 || apprData?.status !== 'approved') {
        throw new Error(
          `approve http=${apprRes.status} ${JSON.stringify(apprRes.json).slice(0, 300)}`,
        )
      }
      itemLog.approved = true

      // per-item restore check
      const finalRow = await loadRow(id)
      if (
        finalRow.status !== 'approved' ||
        Number(finalRow.is_active) !== 1 ||
        finalRow.pool !== 'formal' ||
        Number(finalRow.difficulty) !== targetDiff
      ) {
        throw new Error('post-approve drawable/difficulty gate fail')
      }
      const mathFinal = mathContentSha(finalRow, await loadExtras(id))
      if (mathFinal !== pre.mathSha) {
        throw new Error('math SHA changed after approve')
      }

      report.items[id] = itemLog
      gReport.completed.push(id)
    } catch (e) {
      itemLog.error = String(e?.message || e)
      report.items[id] = itemLog
      gReport.failedAt = id
      report.groups.push(gReport)
      await conn.end()
      failPartial(
        `group ${gi + 1} item ${rec.code}(${id}): ${itemLog.error}; completedInGroup=${gReport.completed.length}`,
      )
    }
  }

  // group verification
  const gIds = group.map((r) => String(r.itemId))
  const gRows = await many(
    `SELECT id, code, difficulty, status, pool, is_active, content_version
     FROM hs_math_train_items WHERE id IN (${gIds.map(() => '?').join(',')})`,
    gIds,
  )
  for (const r of gRows) {
    const rec = recById[String(r.id)]
    if (
      r.status !== 'approved' ||
      Number(r.is_active) !== 1 ||
      r.pool !== 'formal' ||
      Number(r.difficulty) !== Number(rec.recommendedDifficulty)
    ) {
      gReport.failedAt = String(r.id)
      report.groups.push(gReport)
      await conn.end()
      failPartial(`group ${gi + 1} verify fail on ${r.code}`)
    }
  }
  const dNow = await drawableNow()
  if (dNow !== 813) {
    report.groups.push(gReport)
    await conn.end()
    failPartial(`group ${gi + 1} drawable=${dNow} != 813`)
  }
  gReport.endedAt = new Date().toISOString()
  gReport.drawableAfter = dNow
  report.groups.push(gReport)
  console.error(`[1C] group ${gi + 1}/4 done drawable=${dNow}`)
}

// —— final verification ——
const drawableF = await drawableNow()
const byDiffF = await many(
  `SELECT difficulty, COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
   GROUP BY difficulty ORDER BY difficulty`,
)
const diffMapF = Object.fromEntries(byDiffF.map((r) => [Number(r.difficulty), Number(r.n)]))
const sessionsF = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItemsF = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)

const finalTargets = await many(
  `SELECT i.id, i.code, i.qtype, i.stem, i.options_json, i.answer_payload_json, i.analysis,
          i.difficulty, i.content_version, i.status, i.pool, i.is_active,
          i.source_type, i.source_year, i.source_exam_name, i.source_question_no,
          i.source_reference, i.source_adaptation_note, i.source_verification_status,
          i.source_license_status
   FROM hs_math_train_items i WHERE i.id IN (${placeholders})`,
  ids,
)

let mathChanged = 0
let wrongDiff = 0
let notApproved = 0
for (const row of finalTargets) {
  const id = String(row.id)
  const rec = recById[id]
  const pre = deepById[id]
  if (Number(row.difficulty) !== Number(rec.recommendedDifficulty)) wrongDiff++
  if (row.status !== 'approved' || Number(row.is_active) !== 1 || row.pool !== 'formal') {
    notApproved++
  }
  const math = mathContentSha(row, await loadExtras(id))
  if (math !== pre.mathSha) mathChanged++
  if (report.items[id]) {
    report.items[id].finalDifficulty = Number(row.difficulty)
    report.items[id].finalCv = Number(row.content_version)
    report.items[id].finalMathSha = math
    report.items[id].mathUnchanged = math === pre.mathSha
  }
}

const othersNow = await many(
  `SELECT i.id, i.code, i.status, i.difficulty, i.content_version, i.qtype,
          (SELECT GROUP_CONCAT(o.content_sha256 ORDER BY d.sort_order SEPARATOR ',')
             FROM hs_math_train_item_diagrams d
             JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
             WHERE d.item_id=i.id) AS diagram_shas
   FROM hs_math_train_items i
   WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1
     AND i.id NOT IN (${placeholders})
   ORDER BY i.id`,
  ids,
)
const othersFpNow = shaHex(
  othersNow.map((r) => ({
    id: String(r.id),
    code: r.code,
    status: r.status,
    difficulty: Number(r.difficulty),
    cv: Number(r.content_version),
    qtype: r.qtype,
    diagrams: r.diagram_shas || '',
  })),
)

const adjusted = Object.values(report.items).filter((x) => x.approved).length
const reviewed = Object.values(report.items).filter((x) => x.reviewed).length
const toD2Done = Object.values(report.items).filter(
  (x) => x.approved && x.to === 2,
).length
const toD1Done = Object.values(report.items).filter(
  (x) => x.approved && x.to === 1,
).length

report.post = {
  drawable: drawableF,
  byDifficulty: {
    1: diffMapF[1] || 0,
    2: diffMapF[2] || 0,
    3: diffMapF[3] || 0,
  },
  adjusted,
  reviewed,
  approved: adjusted,
  toD2: toD2Done,
  toD1: toD1Done,
  mathChanged,
  wrongDiff,
  notApproved,
  othersUnchanged: othersFpNow === othersFingerprint,
  othersCount: othersNow.length,
  sessionsUnchanged: sessionsF === sessions0,
  sessionItemsUnchanged: sessionItemsF === sessionItems0,
  sessions: sessionsF,
  sessionItems: sessionItemsF,
}

await conn.end()

const pass =
  drawableF === 813 &&
  (diffMapF[1] || 0) === 335 &&
  (diffMapF[2] || 0) === 478 &&
  (diffMapF[3] || 0) === 0 &&
  adjusted === 200 &&
  reviewed === 200 &&
  mathChanged === 0 &&
  wrongDiff === 0 &&
  notApproved === 0 &&
  othersFpNow === othersFingerprint &&
  sessionsF === sessions0 &&
  sessionItemsF === sessionItems0

if (!pass) {
  report.status = 'DIFFICULTY_ADJUST_PARTIAL'
  report.errors.push(`final gate fail: ${JSON.stringify(report.post)}`)
  finish(1)
}

report.status = 'DIFFICULTY_ADJUST_PASS'
finish(0)
