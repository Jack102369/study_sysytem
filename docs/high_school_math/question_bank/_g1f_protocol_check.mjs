/**
 * GLOBAL-1F: structural/protocol checks + export buckets for math review.
 * No DB write.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { candidates } from './candidates-g1b-100.mjs'
import { kpByCode } from './kp-seed-g1c.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docs = path.resolve(__dirname, '..')
const VALID_Q = new Set(['single', 'multi', 'judge', 'numeric', 'application'])
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

const protocolIssues = []
const rows = []

function issue(id, kind, msg) {
  protocolIssues.push({ id, kind, msg })
}

for (const c of candidates) {
  const r = {
    id: c.id,
    qtype: c.qtype,
    difficulty: c.difficulty,
    mathVerified: c.mathVerified,
    kpCode: c.kpCode,
    methodMain: c.methodMain,
    answer: c.answer,
    protocolOk: true,
    notes: [],
  }
  if (!VALID_Q.has(c.qtype)) {
    r.protocolOk = false
    issue(c.id, 'qtype', c.qtype)
  }
  if (!VALID_M.has(c.methodMain) || (c.methodAux && !VALID_M.has(c.methodAux))) {
    r.protocolOk = false
    issue(c.id, 'method', `${c.methodMain}/${c.methodAux}`)
  }
  if (c.methodMain === 'text_only') {
    r.protocolOk = false
    issue(c.id, 'text_only', 'present')
  }
  if (!kpByCode[c.kpCode]) {
    r.protocolOk = false
    issue(c.id, 'kp', 'not in seed')
  }
  if (c.sourceType !== 'original') {
    r.protocolOk = false
    issue(c.id, 'source', c.sourceType)
  }
  if (c.qtype === 'single') {
    if (!c.options || !c.answer || String(c.answer).includes(',')) {
      r.protocolOk = false
      issue(c.id, 'single', 'need unique option letter')
    } else if (!c.options[c.answer]) {
      r.protocolOk = false
      issue(c.id, 'single', 'answer not in options')
    }
  }
  if (c.qtype === 'multi') {
    const parts = String(c.answer || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length < 2) {
      r.protocolOk = false
      issue(c.id, 'multi', 'need >=2 options')
    }
    for (const p of parts) {
      if (!c.options?.[p]) {
        r.protocolOk = false
        issue(c.id, 'multi', `bad ${p}`)
      }
    }
  }
  if (c.qtype === 'judge') {
    const a = String(c.answer).toLowerCase()
    if (a !== 'true' && a !== 'false') {
      r.protocolOk = false
      issue(c.id, 'judge', c.answer)
    }
  }
  if (c.qtype === 'numeric') {
    // Import protocol expects plain number/fraction string for standard answer packing later;
    // current candidates store bare numeric string — flag LaTeX-heavy answers.
    const a = String(c.answer || '').trim()
    if (!a) {
      r.protocolOk = false
      issue(c.id, 'numeric', 'empty')
    } else if (/\\frac|\$/.test(a) && !/^-?\d+(\.\d+)?$/.test(a) && !/^-?\d+\/\d+$/.test(a)) {
      r.notes.push('numeric_answer_may_need_normalize_for_grader')
    }
  }
  if (c.qtype === 'application') {
    const sum = (c.rubric || []).reduce((s, x) => s + Number(x.score), 0)
    if (!Array.isArray(c.rubric) || !c.rubric.length) {
      r.protocolOk = false
      issue(c.id, 'rubric', 'missing')
    } else if (sum !== Number(c.maxScore)) {
      r.protocolOk = false
      issue(c.id, 'rubric', `sum ${sum}!=${c.maxScore}`)
    } else if (c.rubric.some((x) => !Number.isInteger(Number(x.score)) || Number(x.score) <= 0)) {
      r.protocolOk = false
      issue(c.id, 'rubric', 'non-positive or non-int score')
    }
  }
  if (!String(c.analysis || '').trim() || String(c.analysis).length < 40) {
    r.notes.push('analysis_thin')
  }
  rows.push(r)
}

// DB readonly
const conn = await createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'study_user',
  password: 'Hw@2026',
  database: 'study_system',
  charset: 'utf8mb4',
})
const [kpTot] = await conn.query('SELECT COUNT(*) AS n FROM hs_math_knowledge_points')
const codes = [...new Set(candidates.map((c) => c.kpCode))]
const [found] = await conn.query(
  `SELECT code FROM hs_math_knowledge_points WHERE code IN (${codes.map(() => '?').join(',')})`,
  codes,
)
const foundSet = new Set(found.map((r) => r.code))
const kpMiss = codes.filter((c) => !foundSet.has(c))
const [drawable] = await conn.query(
  `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [mrows] = await conn.query(`SELECT code FROM hs_math_methods WHERE is_active=1`)
const mset = new Set(mrows.map((r) => r.code))
const badMethods = [
  ...new Set(
    candidates.flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean)),
  ),
].filter((m) => !mset.has(m))

// crude stem overlap: normalize strip latex spaces, compare exact short stems against formal approved
const [formal] = await conn.query(
  `SELECT id, stem FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
function norm(s) {
  return String(s || '')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/\s+/g, '')
    .slice(0, 40)
}
const formalNorm = formal.map((f) => ({ id: f.id, n: norm(f.stem) }))
const stemHits = []
for (const c of candidates) {
  const n = norm(c.stem)
  if (n.length < 12) continue
  for (const f of formalNorm) {
    if (f.n && (f.n === n || (n.length > 15 && f.n.includes(n)) || (f.n.length > 15 && n.includes(f.n)))) {
      stemHits.push({ cand: c.id, formalId: f.id })
    }
  }
}
await conn.end()

const out = {
  n: candidates.length,
  protocolOk: rows.filter((r) => r.protocolOk).length,
  protocolIssues,
  analysisThin: rows.filter((r) => r.notes.includes('analysis_thin')).map((r) => r.id),
  numericNormalizeNotes: rows
    .filter((r) => r.notes.includes('numeric_answer_may_need_normalize_for_grader'))
    .map((r) => r.id),
  db: {
    kp_total: Number(kpTot[0].n),
    kpMiss,
    drawable: Number(drawable[0].n),
    badMethods,
    stemHits,
  },
  buckets: {
    author: candidates.filter((c) => c.mathVerified === 'AUTHOR_CHECKED').map((c) => c.id),
    spot: candidates.filter((c) => c.mathVerified === 'SPOT_VERIFIED').map((c) => c.id),
    hard: candidates.filter((c) => c.difficulty === 3).map((c) => c.id),
    apps: candidates.filter((c) => c.qtype === 'application').map((c) => c.id),
    multi: candidates.filter((c) => c.qtype === 'multi').map((c) => c.id),
  },
}
fs.writeFileSync(path.join(docs, '_g1f_protocol.json'), JSON.stringify(out, null, 2))
// export review packs
const authPack = candidates
  .filter((c) => c.mathVerified === 'AUTHOR_CHECKED' || c.difficulty === 3 || c.qtype === 'application')
  .map((c) => ({
    id: c.id,
    qtype: c.qtype,
    difficulty: c.difficulty,
    mathVerified: c.mathVerified,
    stem: c.stem,
    options: c.options,
    answer: c.answer,
    maxScore: c.maxScore,
    rubric: c.rubric,
    analysis: c.analysis,
    kpCode: c.kpCode,
  }))
fs.writeFileSync(path.join(docs, '_g1f_priority_pack.json'), JSON.stringify(authPack, null, 2))
console.log(
  JSON.stringify(
    {
      protocolOk: out.protocolOk,
      issues: protocolIssues.length,
      kpMiss: kpMiss.length,
      drawable: out.db.drawable,
      stemHits: stemHits.length,
      priorityPack: authPack.length,
      analysisThin: out.analysisThin.length,
      numericNotes: out.numericNormalizeNotes.length,
    },
    null,
    2,
  ),
)
