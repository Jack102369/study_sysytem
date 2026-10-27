/**
 * Supplemental RO: fix DB baseline queries + adapt dry-run + refine leak audits.
 * Merges into global4b_import_preflight_results.json
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const root = path.resolve(__dirname, '../../../..')
const outJson = path.join(qb, 'global4b_import_preflight_results.json')
const report = JSON.parse(fs.readFileSync(outJson, 'utf8'))

const mergeMod = await import(
  pathToFileURL(path.join(qb, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)
const merged = mergeMod.candidates || []
const byId = new Map(merged.map((c) => [c.id, c]))

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

const NUMERIC_VALUE_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/

function adaptCandidate(c) {
  const methodCodes = [...new Set([c.methodMain, c.methodAux].filter(Boolean))]
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
  }
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
    }
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
    }
  }
  if (c.qtype === 'judge') {
    let raw = String(c.answer).trim().toLowerCase()
    if (raw === '真' || raw === '对') raw = 'true'
    if (raw === '假' || raw === '错') raw = 'false'
    if (raw !== 'true' && raw !== 'false') {
      throw new Error(`${c.id}: judge answer must be true/false (got ${c.answer})`)
    }
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'judge', value: raw === 'true' },
    }
  }
  if (c.qtype === 'numeric') {
    const value = String(c.answer).trim()
    if (!NUMERIC_VALUE_RE.test(value)) throw new Error(`${c.id}: numeric illegal`)
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'numeric', value, toleranceAbs: 0, toleranceRel: 0 },
    }
  }
  if (c.qtype === 'application') {
    const rubric = (c.rubric || []).map((r) => ({
      key: String(r.key).trim(),
      title: String(r.title).trim(),
      maxScore: Number(r.score),
      criteria: String(r.criterion ?? '').trim(),
    }))
    const maxScore = Number(c.maxScore)
    const sum = rubric.reduce((s, x) => s + x.maxScore, 0)
    if (!Number.isInteger(maxScore) || maxScore <= 0) throw new Error(`${c.id}: bad maxScore`)
    if (sum !== maxScore) throw new Error(`${c.id}: rubric sum != maxScore`)
    return {
      ...base,
      options: null,
      answerPayload: {
        kind: 'application',
        standardAnswer: String(c.answer),
        maxScore,
        rubric,
      },
    }
  }
  throw new Error(`${c.id}: unsupported qtype`)
}

const adaptErrors = []
const adapted = []
for (const c of merged) {
  try {
    adapted.push(adaptCandidate(c))
  } catch (e) {
    adaptErrors.push({ id: c.id, err: String(e.message || e) })
  }
}

// ---- DB RO fixed ----
const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
})
const [[dbName]] = await conn.query('SELECT DATABASE() AS db')
const [[drawableRow]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [chRows] = await conn.query(
  `SELECT s.chapter_no AS ch, COUNT(1) AS n
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id = i.specialty_id
   WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1
   GROUP BY s.chapter_no ORDER BY s.chapter_no`,
)
const [diffRows] = await conn.query(
  `SELECT difficulty AS d, COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
   GROUP BY difficulty ORDER BY difficulty`,
)
const [qtRows] = await conn.query(
  `SELECT qtype, COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1
   GROUP BY qtype`,
)
const [statusRows] = await conn.query(
  `SELECT status, pool, is_active, COUNT(1) AS n FROM hs_math_train_items GROUP BY status, pool, is_active`,
)
const [kpAll] = await conn.query(`SELECT code FROM hs_math_knowledge_points WHERE is_active=1`)
const [methodAll] = await conn.query(`SELECT code FROM hs_math_methods WHERE is_active=1`)
const [catAll] = await conn.query(`SELECT code FROM hs_math_categories WHERE is_active=1`)
const [specAll] = await conn.query(`SELECT code FROM hs_math_specialties WHERE is_active=1`)
const kpDb = new Set(kpAll.map((r) => r.code))
const methodDb = new Set(methodAll.map((r) => r.code))
const catDb = new Set(catAll.map((r) => r.code))
const specDb = new Set(specAll.map((r) => r.code))

const candCodes = merged.map((c) => c.id)
const [existCodes] = await conn.query(
  `SELECT code FROM hs_math_train_items WHERE code IN (${candCodes.map(() => '?').join(',')})`,
  candCodes,
)
const [g4Hits] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G4A-%'`,
)
const kpMiss = [...new Set(merged.map((c) => c.kpCode).filter((k) => !kpDb.has(k)))]
const methodMiss = [
  ...new Set(
    merged
      .flatMap((c) => [c.methodMain, c.methodAux].filter(Boolean))
      .filter((m) => !methodDb.has(m)),
  ),
]
const catMiss = [...new Set(merged.map((c) => c.sectionCode).filter((k) => !catDb.has(k)))]
const specMiss = [...new Set(merged.map((c) => c.specialtyCode).filter((k) => !specDb.has(k)))]

const [formalStems] = await conn.query(
  `SELECT code, stem FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
function normExact(s) {
  return String(s || '')
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}
const formalNorm = new Map()
for (const r of formalStems) formalNorm.set(normExact(r.stem), r.code)
const exactCollide = []
for (const c of merged) {
  const hit = formalNorm.get(normExact(c.stem))
  if (hit) exactCollide.push({ cand: c.id, formal: hit })
}

// image tables presence
const [imgTables] = await conn.query(
  `SELECT table_name AS t FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name LIKE 'hs_math%image%'`,
)

await conn.end()

report.dbBaseline = {
  database: dbName.db,
  drawable: Number(drawableRow.n),
  expectedDrawableAssumed: 313,
  drawableMatchesAssumption: Number(drawableRow.n) === 313,
  byChapter: Object.fromEntries(chRows.map((r) => [r.ch, Number(r.n)])),
  byDifficulty: Object.fromEntries(diffRows.map((r) => [r.d, Number(r.n)])),
  byQtype: Object.fromEntries(qtRows.map((r) => [r.qtype, Number(r.n)])),
  statusPoolActive: statusRows,
  formalStemCount: formalStems.length,
  codeConflicts: existCodes.map((r) => r.code),
  existingG4APrefixCount: Number(g4Hits[0]?.n ?? g4Hits.n ?? 0),
  kpMissInDb: kpMiss,
  methodMissInDb: methodMiss,
  categoryMissInDb: catMiss,
  specialtyMissInDb: specMiss,
  exactStemCollisions: exactCollide,
  imageRelatedTables: imgTables.map((r) => r.t),
}

report.protocol.adaptDryRun = {
  adaptedOk: adapted.length,
  adaptErrorCount: adaptErrors.length,
  adaptErrorsSample: adaptErrors.slice(0, 40),
  note: '仿 GLOBAL-3B adapt；judge 真/假已映射 true/false；正式导入前仍须生成适配 JSON',
  maxItemsPerRequest: 100,
  typeDefStaleNote:
    'import-protocol.ts HsMathImportItem.qtype 注释未列 application，但 HS_MATH_QTYPES 含 application；以 constants 为准',
}

// ---- refine nonRequired leak audits (overwrite) ----
const FIGURE_MUST =
  /(如图|见图|如下图|示意如|直观图|在图中标出|图中阴影|图中所示)/
const UNDERDETERMINED_GEO =
  /(下列几何体|可作为棱柱|可作为棱锥|观察图形|空间图形的三视图)/

const refined = []
for (const row of report.audits.nonRequiredLeak) {
  const c = byId.get(row.id)
  if (!c) continue
  const stem = String(c.stem)
  const must = FIGURE_MUST.test(stem) || UNDERDETERMINED_GEO.test(stem)
  const selfContainedVolume =
    /(圆柱|圆锥|棱柱|棱锥|球)/.test(stem) &&
    /(半径|高|棱长|边长|\d+)/.test(stem) &&
    !FIGURE_MUST.test(stem)
  let verdict = 'PASS'
  let conclusion =
    'keywords present but text/numbers self-contained; NOT_NEEDED/RECOMMENDED acceptable'
  let fix = null
  if (must && c.diagramRequirement !== 'REQUIRED') {
    verdict = 'ISSUE'
    conclusion = 'stem requires figure (如图/几何体识别) but not REQUIRED'
    fix = '升级 diagramRequirement=REQUIRED 并配图'
  } else if (selfContainedVolume) {
    verdict = 'PASS'
    conclusion = 'solid geometry with explicit dimensions; figure optional'
  }
  refined.push({
    ...row,
    verdict,
    leakSuspect: must,
    mathConclusion: conclusion,
    fixSuggestion: fix,
    refined: true,
  })
}
report.audits.nonRequiredLeak = refined

function tally(arr) {
  const t = { PASS: 0, ISSUE: 0, UNCERTAIN: 0, ACCEPTABLE_CONFIRMED: 0, other: 0 }
  for (const a of arr) {
    if (t[a.verdict] != null) t[a.verdict]++
    else t.other++
  }
  return { n: arr.length, ...t }
}
report.counts.nonRequiredLeak = tally(refined)

// ---- deep math: verify more closed forms on iso/d3/app samples ----
function deepVerify(c) {
  const notes = []
  let v = 'PASS'
  const stem = String(c.stem)
  const ans = String(c.answer)
  const analysis = String(c.analysis)

  // cylinder V/π = r^2 h
  let m = stem.match(/半径\s*\$?(\d+)\$?[^高]{0,12}高\s*\$?(\d+)\$?[^，。]*圆柱/)
  if (!m) m = stem.match(/底面半径\s*\$?(\d+)\$?[^高]{0,20}高\s*\$?(\d+)\$?/)
  if (!m) m = stem.match(/底面半径\s*(\d+)[、,，]?\s*高\s*(\d+)/)
  if (m && /圆柱/.test(stem) && /除以|\/\s*\\?pi|\/π/.test(stem)) {
    const expect = Number(m[1]) ** 2 * Number(m[2])
    if (Number(ans) !== expect) {
      v = 'ISSUE'
      notes.push(`cylinder V/π expect ${expect} got ${ans}`)
    } else notes.push(`cylinder V/π ok ${expect}`)
  }
  // cone V/π = (1/3)r^2 h
  if (/圆锥/.test(stem) && /除以|\/\s*\\?pi|\/π/.test(stem)) {
    const r = stem.match(/半径\s*\$?(\d+)/) || stem.match(/半径\s*(\d+)/)
    const h = stem.match(/高\s*\$?(\d+)/) || stem.match(/高\s*(\d+)/)
    if (r && h) {
      const expect = (Number(r[1]) ** 2 * Number(h[1])) / 3
      if (Math.abs(Number(ans) - expect) > 1e-9) {
        v = 'ISSUE'
        notes.push(`cone V/π expect ${expect} got ${ans}`)
      } else notes.push(`cone V/π ok ${expect}`)
    }
  }
  // sample mean already handled
  if (/振幅可为负数/.test(stem)) {
    if (ans !== 'false') {
      v = 'ISSUE'
      notes.push('amplitude non-negative; expect false')
    } else notes.push('amplitude judge ok false')
  }
  if (/任意两个非零向量都可作基底/.test(stem)) {
    if (ans !== 'false') {
      v = 'ISSUE'
      notes.push('basis needs non-collinear; expect false')
    } else notes.push('basis judge ok false')
  }
  if (/样本平均数可用于估计总体平均数/.test(stem)) {
    if (ans !== 'true') {
      v = 'ISSUE'
      notes.push('expect true')
    } else notes.push('stat estimate true; but difficulty=3 is false-hard')
    if (Number(c.difficulty) === 3) v = 'ISSUE'
  }
  // application cone r=3 h=4 volume/π
  if (/圆锥\s*r\s*=\s*3.*h\s*=\s*4.*体积/.test(stem.replace(/\n/g, ''))) {
    const expectVolOverPi = (1 / 3) * 9 * 4 // 12
    if (!String(ans).includes('12') && Number(ans) !== 12) {
      // may be free text
      if (!analysis.includes('12')) {
        v = 'ISSUE'
        notes.push('cone volume/π should involve 12')
      } else notes.push('cone volume analysis has 12')
    } else notes.push('cone app volume ok')
  }

  if (Number(c.difficulty) === 3 && c.qtype === 'judge' && analysis.length < 40 && stem.length < 50) {
    v = 'ISSUE'
    notes.push('FALSE_HARD_TRIVIAL_JUDGE_D3')
  }
  if (!notes.length) {
    notes.push('no additional closed-form rule matched')
    if (v === 'PASS') v = 'UNCERTAIN'
  }
  return { verdict: v, notes: notes.join(' | ') }
}

for (const bucket of ['isoReplace', 'd3', 'application']) {
  for (const row of report.audits[bucket]) {
    const c = byId.get(row.id)
    if (!c) continue
    const d = deepVerify(c)
    row.deepVerify = d
    // escalate only if deep finds ISSUE; don't downgrade ACCEPTABLE_CONFIRMED
    if (d.verdict === 'ISSUE' && row.verdict !== 'ACCEPTABLE_CONFIRMED') {
      row.verdict = 'ISSUE'
      row.mathConclusion = `${row.mathConclusion} || deep: ${d.notes}`
      if (!row.fixSuggestion) row.fixSuggestion = '见 deepVerify；修复后重预检'
    } else {
      row.mathConclusion = `${row.mathConclusion} || deep: ${d.notes}`
    }
  }
  report.counts[bucket === 'isoReplace' ? 'isoReplaceSample' : bucket === 'd3' ? 'd3Deep' : 'applicationDeep'] =
    tally(report.audits[bucket])
}

// ---- recompute gates ----
const fail = []
const soft = []
const cons = report.consistency
if (merged.length !== 500) fail.push('COUNT_NOT_500')
if (!cons.idsUnique || !cons.idsSequential) fail.push('ID_INTEGRITY')
if (!cons.groupMatchMerge) fail.push('GROUP_MERGE_MISMATCH')
if (cons.truncatedSuspect) fail.push('TRUNCATION_SUSPECT')
if (report.dbBaseline.drawableMatchesAssumption === false) soft.push('DRAWABLE_NOT_313_REPORTED')
if ((report.dbBaseline.codeConflicts || []).length) fail.push('CODE_CONFLICT')
if ((report.dbBaseline.kpMissInDb || []).length) fail.push('KP_MISSING')
if ((report.dbBaseline.methodMissInDb || []).length) fail.push('METHOD_MISSING')
if ((report.dbBaseline.categoryMissInDb || []).length) fail.push('CATEGORY_MISSING')
if ((report.dbBaseline.specialtyMissInDb || []).length) fail.push('SPECIALTY_MISSING')
if ((report.dbBaseline.exactStemCollisions || []).length) fail.push('EXACT_STEM_COLLIDE')
if (adaptErrors.length) fail.push('ADAPT_PROTOCOL_ERRORS')

const anyIssue = (arr) => arr.some((x) => x.verdict === 'ISSUE')
const anyUncertain = (arr) => arr.some((x) => x.verdict === 'UNCERTAIN')

if (anyIssue(report.audits.acceptable)) fail.push('ACCEPTABLE_ISSUE')
if (anyIssue(report.audits.isoReplace)) fail.push('ISO_REPLACE_MATH_ISSUE')
if (anyIssue(report.audits.d3)) fail.push('D3_MATH_OR_FALSE_HARD')
if ((report.counts.d3ArchiveIssueCount || 0) > 0) fail.push('D3_ARCHIVE_ISSUES')
if (anyIssue(report.audits.application) || (report.counts.appStructBad || 0) > 0)
  fail.push('APPLICATION_ISSUE')
if (anyIssue(report.audits.requiredDiagrams)) fail.push('REQUIRED_DIAGRAM_ISSUE')
if (anyIssue(report.audits.nonRequiredLeak)) fail.push('REQUIRED_LEAK')

if (cons.missingHardProfileOnD3?.length === 125) soft.push('ALL_D3_MISSING_HARD_PROFILE')
if (anyUncertain(report.audits.isoReplace)) soft.push('ISO_REPLACE_UNCERTAIN')
if (anyUncertain(report.audits.d3)) soft.push('D3_UNCERTAIN')
if (anyUncertain(report.audits.application)) soft.push('APP_UNCERTAIN')
if (anyUncertain(report.audits.requiredDiagrams)) soft.push('DIAGRAM_UNCERTAIN')

const hardBlock = fail.some((f) =>
  [
    'COUNT_NOT_500',
    'ID_INTEGRITY',
    'GROUP_MERGE_MISMATCH',
    'CODE_CONFLICT',
    'KP_MISSING',
    'METHOD_MISSING',
    'CATEGORY_MISSING',
    'SPECIALTY_MISSING',
    'ADAPT_PROTOCOL_ERRORS',
  ].includes(f),
)

let status
if (hardBlock) status = 'IMPORT_PREFLIGHT_BLOCKED'
else if (fail.length > 0 || soft.length > 0) status = 'IMPORT_PREFLIGHT_PARTIAL'
else status = 'IMPORT_PREFLIGHT_PASS'

report.status = status
report.gateFailures = fail
report.softFlags = soft
report.openIssues = ['INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED', ...fail, ...soft]
report.endedAt = new Date().toISOString()
report.patchNote = 'dbBaseline fixed via specialty join; leak refined; adapt dry-run added'

fs.writeFileSync(outJson, JSON.stringify(report, null, 2))
fs.writeFileSync(
  path.join(__dirname, '_preflight_audits/summary.json'),
  JSON.stringify(
    {
      status,
      drawable: report.dbBaseline.drawable,
      adaptErrors: adaptErrors.length,
      gateFailures: fail,
      softFlags: soft,
      counts: {
        iso: report.counts.isoReplaceSample,
        d3: report.counts.d3Deep,
        app: report.counts.applicationDeep,
        leak: report.counts.nonRequiredLeak,
        required: report.counts.required,
        acceptable: report.counts.acceptable,
      },
      catMiss: catMiss.slice(0, 20),
      specMiss: specMiss.slice(0, 20),
      adaptSample: adaptErrors.slice(0, 15),
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      status,
      drawable: report.dbBaseline.drawable,
      adaptErrors: adaptErrors.length,
      gateFailures: fail,
      softFlags: soft,
      leak: report.counts.nonRequiredLeak,
      iso: report.counts.isoReplaceSample,
      d3: report.counts.d3Deep,
      app: report.counts.applicationDeep,
      catMissN: catMiss.length,
      specMissN: specMiss.length,
      kpMissN: kpMiss.length,
      methodMissN: methodMiss.length,
      codeConflicts: report.dbBaseline.codeConflicts.length,
      exactCollide: exactCollide.length,
    },
    null,
    2,
  ),
)
