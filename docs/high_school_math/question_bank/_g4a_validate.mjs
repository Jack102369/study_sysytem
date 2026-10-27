/**
 * Validate G4A group file(s) or merged candidates against quotas/protocol/dedup.
 * Usage: node _g4a_validate.mjs [groupN|all]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const arg = process.argv[2] || 'all'
const NUMERIC_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/
const METHODS = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, '_g4a_prior_stems.json'), 'utf8'))
    .methods,
)
const KPSET = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, '_g4a_prior_stems.json'), 'utf8')).kps.map(
    (k) => k.code,
  ),
)
const prior = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, '_g4a_prior_stems.json'), 'utf8'))
    .stemsNorm,
)

function norm(s) {
  return String(s || '')
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

async function loadCandidates() {
  if (arg === 'all') {
    const p = path.join(__dirname, 'candidates-g4a-500.mjs')
    if (!fs.existsSync(p)) {
      // merge groups if present
      const all = []
      for (let g = 1; g <= 5; g++) {
        const gp = path.join(
          __dirname,
          'bank_global4a',
          `g4a_group0${g}.mjs`,
        )
        if (!fs.existsSync(gp)) continue
        const m = await import(pathToFileURL(gp).href + '?t=' + Date.now())
        all.push(...(m.candidates || []))
      }
      return all
    }
    const m = await import(pathToFileURL(p).href + '?t=' + Date.now())
    return m.candidates || []
  }
  const g = Number(arg)
  const gp = path.join(__dirname, 'bank_global4a', `g4a_group0${g}.mjs`)
  const m = await import(pathToFileURL(gp).href + '?t=' + Date.now())
  return m.candidates || []
}

const candidates = await loadCandidates()
const report = {
  arg,
  n: candidates.length,
  errors: [],
  warnings: [],
  quotas: { d: {}, qt: {}, ch: {} },
  numericBad: [],
  rubricBad: [],
  kpMiss: [],
  methodMiss: [],
  methodDup: [],
  batchDup: [],
  priorHits: [],
  idsOk: true,
}

const seenStem = new Map()
const seenId = new Set()
for (const c of candidates) {
  report.quotas.d[c.difficulty] = (report.quotas.d[c.difficulty] || 0) + 1
  report.quotas.qt[c.qtype] = (report.quotas.qt[c.qtype] || 0) + 1
  report.quotas.ch[c.chapterNo] = (report.quotas.ch[c.chapterNo] || 0) + 1
  if (seenId.has(c.id)) {
    report.idsOk = false
    report.errors.push(`dupId:${c.id}`)
  }
  seenId.add(c.id)
  if (!KPSET.has(c.kpCode)) report.kpMiss.push(c.id)
  if (!METHODS.has(c.methodMain)) report.methodMiss.push({ id: c.id, m: c.methodMain })
  if (c.methodAux) {
    if (!METHODS.has(c.methodAux)) report.methodMiss.push({ id: c.id, m: c.methodAux })
    if (c.methodAux === c.methodMain) report.methodDup.push(c.id)
  }
  if (c.qtype === 'numeric' && !NUMERIC_RE.test(String(c.answer).trim()))
    report.numericBad.push({ id: c.id, answer: c.answer })
  if (c.qtype === 'application') {
    const sum = (c.rubric || []).reduce((s, r) => s + Number(r.score), 0)
    if (
      !c.maxScore ||
      sum !== Number(c.maxScore) ||
      !(c.rubric || []).every((r) => r.key && r.title && r.criterion && r.score > 0)
    )
      report.rubricBad.push(c.id)
  }
  if (!c.stem || !c.analysis || !c.answer) report.errors.push(`empty:${c.id}`)
  if (!['original', 'past_exam'].includes(c.sourceType))
    report.warnings.push(`source:${c.id}`)
  const ns = norm(c.stem)
  if (seenStem.has(ns)) report.batchDup.push([seenStem.get(ns), c.id])
  else seenStem.set(ns, c.id)
  if (prior.has(ns)) report.priorHits.push(c.id)
}

const ok =
  report.errors.length === 0 &&
  report.numericBad.length === 0 &&
  report.rubricBad.length === 0 &&
  report.kpMiss.length === 0 &&
  report.methodMiss.length === 0 &&
  report.methodDup.length === 0 &&
  report.batchDup.length === 0 &&
  report.idsOk

const outPath = path.join(
  __dirname,
  'bank_global4a',
  `_g4a_validate_${arg}.json`,
)
fs.writeFileSync(outPath, JSON.stringify({ ...report, ok }, null, 2))
console.log(
  JSON.stringify(
    {
      ok,
      n: report.n,
      quotas: report.quotas,
      numericBad: report.numericBad.length,
      rubricBad: report.rubricBad.length,
      kpMiss: report.kpMiss.length,
      methodIssues: report.methodMiss.length + report.methodDup.length,
      batchDup: report.batchDup.length,
      priorHits: report.priorHits.length,
      errors: report.errors.slice(0, 10),
    },
    null,
    2,
  ),
)
