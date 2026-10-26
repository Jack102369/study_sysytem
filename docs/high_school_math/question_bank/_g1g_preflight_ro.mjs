/**
 * GLOBAL-1G-PREFLIGHT readonly checks. Do NOT commit (may contain local DB creds).
 */
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { candidates } from './candidates-g1b-100.mjs'
import { kpByCode } from './kp-seed-g1c.mjs'

const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]{1,62}$/
const VALID_M = new Set([
  'defn',
  'domain_symmetry',
  'special_value',
  'graph_symmetry',
  'num_shape',
  'classification',
  'mono_analysis',
  'parity_apply',
  'equiv_transform',
  'undetermined_coeff',
  'substitution',
])

function normStem(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

const ids = candidates.map((c) => c.id)
const uniqueIds = new Set(ids)
const idIssues = []
if (uniqueIds.size !== 100) idIssues.push('id_not_100_unique')
for (const id of ids) {
  if (!CODE_RE.test(id)) idIssues.push(`code_format:${id}`)
}

const local = {
  n: candidates.length,
  idUnique: uniqueIds.size === 100,
  codeFormatOk: idIssues.filter((x) => x.startsWith('code_format')).length === 0,
  idIssues,
  qtypeCounts: {},
  missingKpSeed: [],
  badMethod: [],
  missingSection: [],
  numericBad: [],
  appRubricBad: [],
  sourceBad: [],
}

for (const c of candidates) {
  local.qtypeCounts[c.qtype] = (local.qtypeCounts[c.qtype] || 0) + 1
  if (!kpByCode[c.kpCode]) local.missingKpSeed.push(c.id)
  if (!VALID_M.has(c.methodMain) || (c.methodAux && !VALID_M.has(c.methodAux))) {
    local.badMethod.push(c.id)
  }
  if (!c.sectionCode || !c.specialtyCode) local.missingSection.push(c.id)
  if (c.sourceType !== 'original') local.sourceBad.push(c.id)
  if (c.qtype === 'numeric') {
    const a = String(c.answer || '').trim()
    const re = /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/
    if (!re.test(a)) local.numericBad.push({ id: c.id, answer: a })
  }
  if (c.qtype === 'application') {
    const sum = (c.rubric || []).reduce((s, x) => s + Number(x.score), 0)
    if (!c.rubric?.length || sum !== Number(c.maxScore)) {
      local.appRubricBad.push(c.id)
    }
  }
}

const conn = await createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'study_user',
  password: 'Hw@2026',
  database: 'study_system',
  charset: 'utf8mb4',
})

async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const indexes = await many('SHOW INDEX FROM hs_math_train_items')
const uniqueKeys = indexes
  .filter((i) => Number(i.Non_unique) === 0)
  .map((i) => ({ key: i.Key_name, col: i.Column_name, seq: i.Seq_in_index }))

const itemsN = Number((await one('SELECT COUNT(1) AS n FROM hs_math_train_items')).n)
const draftN = Number(
  (await one("SELECT COUNT(1) AS n FROM hs_math_train_items WHERE status='draft'")).n,
)
const drawableN = Number(
  (
    await one(
      "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
    )
  ).n,
)
const candHit = Number(
  (
    await one(
      "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G1B-%'",
    )
  ).n,
)
const existingCodes = await many(
  `SELECT code, status, pool, is_active FROM hs_math_train_items WHERE code IN (${ids
    .map(() => '?')
    .join(',')})`,
  ids,
)

const specs = await many(
  'SELECT id, code, name, is_active FROM hs_math_specialties ORDER BY code',
)
const cats = await many(
  `SELECT c.id, c.code, c.name, c.is_active, s.code AS specialty_code
   FROM hs_math_categories c
   JOIN hs_math_specialties s ON s.id=c.specialty_id
   ORDER BY s.code, c.code`,
)
const catKey = new Set(cats.map((c) => `${c.specialty_code}::${c.code}`))

const kpCodes = [...new Set(candidates.map((c) => c.kpCode))]
const kps = await many(
  `SELECT code, is_active, specialty_id FROM hs_math_knowledge_points WHERE code IN (${kpCodes
    .map(() => '?')
    .join(',')})`,
  kpCodes,
)
const kpMap = new Map(kps.map((k) => [k.code, k]))
const kpMissDb = kpCodes.filter((c) => !kpMap.has(c))
const kpInactive = kps.filter((k) => !Number(k.is_active)).map((k) => k.code)

const methods = await many('SELECT code, is_active FROM hs_math_methods')
const mActive = new Set(methods.filter((m) => Number(m.is_active)).map((m) => m.code))
const methodMiss = [
  ...new Set(
    candidates.flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean)),
  ),
].filter((m) => !mActive.has(m))

// category resolve for each candidate
const catMiss = []
const spMiss = []
const specByCode = new Map(specs.map((s) => [s.code, s]))
for (const c of candidates) {
  const sp = specByCode.get(c.specialtyCode)
  if (!sp || !Number(sp.is_active)) spMiss.push(c.id)
  if (!catKey.has(`${c.specialtyCode}::${c.sectionCode}`)) {
    catMiss.push({ id: c.id, key: `${c.specialtyCode}::${c.sectionCode}` })
  }
}

// stem overlap vs formal approved active
const formal = await many(
  "SELECT id, code, stem FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
)
const formalNorm = formal.map((f) => ({ id: f.id, code: f.code, n: normStem(f.stem) }))
const stemHits = []
for (const c of candidates) {
  const n = normStem(c.stem)
  if (n.length < 12) continue
  for (const f of formalNorm) {
    if (
      f.n &&
      (f.n === n ||
        (n.length > 20 && f.n.includes(n)) ||
        (f.n.length > 20 && n.includes(f.n)))
    ) {
      stemHits.push({ cand: c.id, formalId: f.id, formalCode: f.code })
    }
  }
}

// batch internal stem dups
const stemMap = new Map()
const batchStemDup = []
for (const c of candidates) {
  const n = normStem(c.stem)
  if (!n) continue
  if (stemMap.has(n)) batchStemDup.push([stemMap.get(n), c.id])
  else stemMap.set(n, c.id)
}

// KP specialty vs candidate specialty
const kpSpMismatch = []
const spIdToCode = new Map(specs.map((s) => [String(s.id), s.code]))
for (const c of candidates) {
  const k = kpMap.get(c.kpCode)
  if (!k) continue
  const spCode = spIdToCode.get(String(k.specialty_id))
  if (spCode !== c.specialtyCode) {
    kpSpMismatch.push({ id: c.id, kp: c.kpCode, kpSp: spCode, candSp: c.specialtyCode })
  }
}

await conn.end()

const out = {
  local,
  db: {
    uniqueKeys,
    hasCodeUnique: uniqueKeys.some(
      (u) => u.key === 'uk_hs_math_train_item_code' && u.col === 'code',
    ),
    itemsN,
    draftN,
    drawableN,
    candHit,
    existingCodes,
    specs: specs.map((s) => ({ code: s.code, active: Number(s.is_active) })),
    catCount: cats.length,
    kpMissDb,
    kpInactive,
    methodMiss,
    spMiss,
    catMiss,
    kpSpMismatch,
    stemHits,
    batchStemDup,
  },
  importGaps: {
    note: 'candidates use flat answer/options; import API needs answerPayload + options.options shape; application in DB/qtypes but HsMathImportItem TS type historically listed 4 qtypes — validate against HS_MATH_QTYPES at runtime',
    applicationCount: local.qtypeCounts.application || 0,
    needsAdapter: true,
  },
}

console.log(JSON.stringify(out, null, 2))
