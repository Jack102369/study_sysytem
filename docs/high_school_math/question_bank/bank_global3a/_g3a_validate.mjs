/**
 * GLOBAL-3A quality gate: quota, protocol, KP/method, rubric, dedup, diagrams.
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const docs = path.resolve(qb, '..')
const NUMERIC_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/

function norm(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

const { candidates } = await import(
  pathToFileURL(path.join(qb, 'candidates-g3a-100.mjs')).href + '?t=' + Date.now()
)
const base = JSON.parse(
  fs.readFileSync(path.join(qb, '_g3a_readonly_baseline.json'), 'utf8'),
)
const kpSet = new Set((base.kps || []).map((k) => k.code))
const methodSet = new Set(base.methods || [])
const priorStems = new Set(base.stemsNorm || [])

const report = {
  n: candidates.length,
  errors: [],
  warnings: [],
  quotas: {},
  dedup: { batchDup: [], priorHits: [] },
  diagrams: [],
  appRubricOk: 0,
  numericOk: 0,
  numericBad: [],
  kpMiss: [],
  methodMiss: [],
  methodDup: [],
  deepSpot: {},
}

const d = {},
  qt = {},
  ch = {}
const stemSeen = new Map()
for (const c of candidates) {
  d[c.difficulty] = (d[c.difficulty] || 0) + 1
  qt[c.qtype] = (qt[c.qtype] || 0) + 1
  ch[c.chapterNo] = (ch[c.chapterNo] || 0) + 1
  if (!kpSet.has(c.kpCode)) report.kpMiss.push(c.id)
  if (!methodSet.has(c.methodMain)) report.methodMiss.push({ id: c.id, m: c.methodMain })
  if (c.methodAux) {
    if (!methodSet.has(c.methodAux))
      report.methodMiss.push({ id: c.id, m: c.methodAux })
    if (c.methodAux === c.methodMain) report.methodDup.push(c.id)
  }
  const ns = norm(c.stem)
  if (stemSeen.has(ns)) report.dedup.batchDup.push([stemSeen.get(ns), c.id])
  else stemSeen.set(ns, c.id)
  if (priorStems.has(ns)) report.dedup.priorHits.push(c.id)

  if (c.qtype === 'numeric') {
    if (NUMERIC_RE.test(String(c.answer).trim())) report.numericOk++
    else report.numericBad.push({ id: c.id, answer: c.answer })
  }
  if (c.qtype === 'application') {
    const sum = (c.rubric || []).reduce((s, r) => s + Number(r.score), 0)
    if (
      Number(c.maxScore) > 0 &&
      sum === Number(c.maxScore) &&
      (c.rubric || []).every((r) => r.key && r.title && r.criterion && r.score > 0)
    )
      report.appRubricOk++
    else report.errors.push(`rubric:${c.id}`)
  }
}

report.quotas = { d, qt, ch }
const quotaOk =
  candidates.length === 100 &&
  d[1] === 35 &&
  d[2] === 40 &&
  d[3] === 25 &&
  qt.single === 30 &&
  qt.multi === 15 &&
  qt.judge === 10 &&
  qt.numeric === 20 &&
  qt.application === 25 &&
  report.appRubricOk === 25 &&
  report.numericBad.length === 0 &&
  report.kpMiss.length === 0 &&
  report.methodMiss.length === 0 &&
  report.methodDup.length === 0 &&
  report.dedup.batchDup.length === 0

// deep spot checks
const get = (id) => candidates.find((c) => c.id === id)
{
  const a = get('CAND-G3A-048')
  report.deepSpot['048'] =
    a && String(a.answer).trim() === '-0.5'
      ? 'PASS cos(2π/3)=-0.5'
      : `FAIL ${a?.answer}`
}
{
  const a = get('CAND-G3A-010')
  // x+4/x min at x=2 for x>0
  report.deepSpot['010'] = a ? `ans=${a.answer} (expect B if options have 2)` : 'MISS'
}

const diagDir = path.join(docs, 'diagrams/required_g3a')
const req = candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
for (const c of req) {
  const png = path.join(diagDir, `${c.id}.png`)
  const svg = path.join(diagDir, `${c.id}.svg`)
  const row = {
    id: c.id,
    png: fs.existsSync(png),
    svg: fs.existsSync(svg),
  }
  if (row.png) {
    const buf = fs.readFileSync(png)
    row.pngBytes = buf.length
    row.pngSha = crypto.createHash('sha256').update(buf).digest('hex')
    row.magicOk = buf[0] === 0x89 && buf[1] === 0x50
    row.under2MiB = buf.length <= 2 * 1024 * 1024
    if (buf.length > 24 && buf.toString('ascii', 12, 16) === 'IHDR') {
      row.w = buf.readUInt32BE(16)
      row.h = buf.readUInt32BE(20)
      row.pxOk = row.w <= 4096 && row.h <= 4096
    }
  }
  if (row.svg) {
    const s = fs.readFileSync(svg, 'utf8').toLowerCase()
    row.svgSafe = !['<script', 'foreignobject', 'javascript:', 'onclick', 'xlink:href'].some(
      (b) => s.includes(b),
    )
  }
  report.diagrams.push(row)
}

const diagOk =
  req.length === 7 &&
  report.diagrams.length === 7 &&
  report.diagrams.every(
    (r) => r.png && r.svg && r.magicOk && r.under2MiB && r.pxOk && r.svgSafe,
  )

report.ok = quotaOk && diagOk && report.dedup.priorHits.length === 0
report.decision = report.ok
  ? 'BATCH_READY_FOR_IMPORT_PREFLIGHT'
  : report.errors.length || report.numericBad.length || !quotaOk
    ? 'QUALITY_PARTIAL'
    : 'QUALITY_PARTIAL'

if (report.dedup.priorHits.length)
  report.warnings.push(`priorStemHits:${report.dedup.priorHits.join(',')}`)
if (!diagOk) report.errors.push('diagrams_incomplete_or_unsafe')

fs.writeFileSync(
  path.join(__dirname, '_g3a_validate_report.json'),
  JSON.stringify(report, null, 2),
)
console.log(
  JSON.stringify(
    {
      decision: report.decision,
      ok: report.ok,
      quotas: report.quotas,
      appRubricOk: report.appRubricOk,
      numericOk: report.numericOk,
      numericBad: report.numericBad,
      kpMiss: report.kpMiss.length,
      methodIssues: report.methodMiss.length + report.methodDup.length,
      batchDup: report.dedup.batchDup,
      priorHits: report.dedup.priorHits.length,
      diag: report.diagrams.map((d) => ({
        id: d.id,
        ok: d.png && d.svg && d.magicOk && d.pxOk && d.svgSafe,
        wh: [d.w, d.h],
      })),
      deepSpot: report.deepSpot,
      errors: report.errors,
      warnings: report.warnings,
    },
    null,
    2,
  ),
)
process.exit(report.ok ? 0 : 1)
