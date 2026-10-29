/**
 * 4H Gate0 + build 12-item import payload. No Admin write. No candidate mutation.
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
} from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const EXPECTED_BATCH = '1e51ba93a0e398766d450fbecda3784a93297c0d8c1e5a60856798c655e19635'
const EXPECTED_FILE = 'df497f16c24c0b89b06df67b895f4bbdd7e6ca5bca820f29428f2b03b789ff16'
const PASS_IDS = [
  6, 13, 14, 18, 27, 46, 47, 60, 202, 211, 213, 214,
].map((n) => `CAND-H3C14-${String(n).padStart(3, '0')}`)

function adaptApplication(c) {
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
  if (sum !== maxScore) throw new Error(`${c.id} rubric ${sum}!=${maxScore}`)
  return {
    code: String(c.id).trim(),
    specialtyCode: String(c.specialtyCode).trim(),
    categoryCode: String(c.sectionCode).trim(),
    qtype: 'application',
    difficulty: 3,
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
}

const out = {
  phase: 'H3-FORMAL-IMPORT-4H-GATE0',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  ok: true,
  errors: [],
  startedAt: new Date().toISOString(),
}

const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const fileBuf = fs.readFileSync(candPath)
const fileSha256 = crypto.createHash('sha256').update(fileBuf).digest('hex')
const mod = await import(pathToFileURL(candPath).href + '?t=' + Date.now())
const { candidates, batchContentSha256 } = mod
const recomputedBatch = batchSha(candidates)

if (fileSha256 !== EXPECTED_FILE) {
  out.ok = false
  out.errors.push(`FILE_SHA got=${fileSha256}`)
}
if (batchContentSha256 !== EXPECTED_BATCH || recomputedBatch !== EXPECTED_BATCH) {
  out.ok = false
  out.errors.push(`BATCH_SHA stored=${batchContentSha256} recomputed=${recomputedBatch}`)
}

const byId = new Map(candidates.map((c) => [c.id, c]))
const missing = PASS_IDS.filter((id) => !byId.has(id))
if (missing.length || PASS_IDS.length !== 12) {
  out.ok = false
  out.errors.push(`WHITELIST missing=${missing.join(',')}`)
}
if (new Set(PASS_IDS).size !== 12) {
  out.ok = false
  out.errors.push('WHITELIST_DUP')
}

const pf2 = JSON.parse(fs.readFileSync(path.join(qb, 'h3_ch1_4_strict_preflight_2f_results.json'), 'utf8'))
const pf3 = JSON.parse(fs.readFileSync(path.join(qb, 'h3_ch1_4_import_precheck_results.json'), 'utf8'))
const pass2 = new Set(pf2.passH3Ids || [])
const ready3 = new Map((pf3.items || []).map((i) => [i.id, i]))

const itemShaCheck = []
for (const id of PASS_IDS) {
  const c = byId.get(id)
  if (!c) continue
  const s = sha256(contentPayload(c))
  const okItem = s === c.hardProfile?.contentSha256
  const in2f = pass2.has(id)
  const r3 = ready3.get(id)
  const in3g = !!(r3 && r3.importReady)
  const sha2fMatch = r3 ? r3.contentSha256 === s : false
  itemShaCheck.push({ id, okItem, in2f, in3g, sha2fMatch, contentSha256: s })
  if (!okItem || !in2f || !in3g || !sha2fMatch) {
    out.ok = false
    out.errors.push(`ITEM_GATE ${id} okItem=${okItem} in2f=${in2f} in3g=${in3g} sha3=${sha2fMatch}`)
  }
}

const env = loadEnv()
const conn = await createConnection(dbConfig(env))
const [[d]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[dd]] = await conn.query(
  `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
   FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[h]] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-H3C14-%'`,
)
const [formal] = await conn.query(
  `SELECT id, code, status, content_version, difficulty, qtype,
          SHA2(CONCAT_WS('|', id, code, status, content_version, difficulty, LEFT(stem,200)), 256) AS fp
   FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1
   ORDER BY id`,
)
const formalBaselineSha = sha256(formal.map((r) => `${r.id}|${r.code}|${r.status}|${r.content_version}|${r.fp}`).join('\n'))
const [[sess]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_sessions`)
const [[sitem]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_session_items`)
let diagramLinks = null
let diagramSnap = null
try {
  const [[dl]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_item_diagrams`)
  diagramLinks = Number(dl.n)
} catch (e) {
  diagramLinks = `ERR:${e.message}`
}
try {
  const [[ds]] = await conn.query(`SELECT COUNT(*) AS n FROM hs_math_train_session_item_diagrams`)
  diagramSnap = Number(ds.n)
} catch (e) {
  diagramSnap = `ERR:${e.message}`
}

const db = {
  drawable: Number(d.n),
  d1: Number(dd.d1),
  d2: Number(dd.d2),
  d3: Number(dd.d3),
  h3c14: Number(h.n),
  formalCount: formal.length,
  formalBaselineSha,
  sessions: Number(sess.n),
  sessionItems: Number(sitem.n),
  diagramLinks,
  diagramSnap,
}
if (db.drawable !== 913 || db.d1 !== 335 || db.d2 !== 478 || db.d3 !== 100 || db.h3c14 !== 0) {
  out.ok = false
  out.errors.push(`DB_BASELINE ${JSON.stringify(db)}`)
}
await conn.end()

const passCands = PASS_IDS.map((id) => byId.get(id))
const items = passCands.map(adaptApplication)
const payload = {
  phase: 'HS-MATH-H3-FORMAL-IMPORT-4H',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  builtAt: new Date().toISOString(),
  sourceBatchContentSha256: EXPECTED_BATCH,
  sourceFileSha256: EXPECTED_FILE,
  count: items.length,
  whitelist: PASS_IDS,
  mapping: PASS_IDS.map((id) => ({
    candidateId: id,
    importCode: id,
    chapterNo: byId.get(id).chapterNo,
    contentSha256: byId.get(id).hardProfile.contentSha256,
  })),
  items,
}
const payloadJson = JSON.stringify(payload, null, 2)
const payloadSha256 = crypto.createHash('sha256').update(payloadJson, 'utf8').digest('hex')
fs.writeFileSync(path.join(qb, 'h3_ch1_4_import_payload_4h.json'), payloadJson)

out.gate0 = {
  fileSha256,
  batchContentSha256,
  recomputedBatch,
  itemShaCheck,
  db,
  payloadSha256,
  payloadCount: items.length,
  chapter: { 2: 4, 3: 6, 4: 2 },
}
out.finishedAt = new Date().toISOString()
fs.writeFileSync(path.join(__dirname, '_4h_gate0.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify({ ok: out.ok, errors: out.errors, db, payloadSha256, n: items.length }, null, 2))
if (!out.ok) process.exit(1)
