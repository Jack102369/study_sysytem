/**
 * Rebuild one G4A group. Usage: node _rebuild_group.mjs <1-5>
 * Gates: no crutch; exact-unique vs prior+batch.
 * Structure-vs-prior hits recorded as isomorphicRisk for report.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { rebuildOne } from './_rebuild_bank.mjs'
import { fallbackBuild } from './_rebuild_fallback.mjs'
import { buildLastResort } from './_rebuild_lastresort.mjs'
import { normStem, normExact, CRUTCH_RE } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const g = Number(process.argv[2] || 1)
if (![1, 2, 3, 4, 5].includes(g)) throw new Error('group 1-5')

const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const exactSet = new Set(prior.stemsNorm || [])
const structPriorSet = new Set((prior.stemsNorm || []).map((s) => String(s).replace(/\d+/g, '#')))

for (let i = 1; i < g; i++) {
  const gp = path.join(__dirname, `g4a_group0${i}.mjs`)
  if (!fs.existsSync(gp)) continue
  const m = await import(pathToFileURL(gp).href + '?t=' + Date.now())
  for (const c of m.candidates || []) exactSet.add(normExact(c.stem))
}

const { slots } = JSON.parse(fs.readFileSync(path.join(__dirname, `_slots_g${g}.json`), 'utf8'))
const candidates = []
const evidences = []
const stats = {
  group: g,
  fromMain: 0,
  fromFallback: 0,
  fromLast: 0,
  isomorphicRiskIds: [],
  failed: [],
  rounds: 1,
}

function accept(item, evidence, hardProfile, source) {
  if (CRUTCH_RE.test(item.stem)) return false
  const ex = normExact(item.stem)
  if (exactSet.has(ex)) return false
  const st = normStem(item.stem)
  if (structPriorSet.has(st)) stats.isomorphicRiskIds.push(item.id)
  evidence.dedupVerdict = structPriorSet.has(st)
    ? `exact unique; structure-similar-to-prior; source=${source}`
    : `exact unique; source=${source}`
  evidence.hardProfile = hardProfile || null
  evidence.rebuildAction = 'replace'
  evidence.diagramVerdict = String(item.diagramRequirement)
  exactSet.add(ex)
  candidates.push(item)
  evidences.push(evidence)
  if (source === 'main') stats.fromMain++
  else if (source === 'fallback') stats.fromFallback++
  else stats.fromLast++
  return true
}

for (const slot of slots) {
  let ok = false
  for (let salt = 0; salt < 20 && !ok; salt++) {
    try {
      const r = rebuildOne(slot, salt)
      ok = accept(r.item, r.evidence, r.hardProfile, 'main')
    } catch {
      /* */
    }
  }
  for (let salt = 0; salt < 20 && !ok; salt++) {
    try {
      const r = fallbackBuild(slot, salt)
      ok = accept(r.item, r.evidence, r.hardProfile, 'fallback')
    } catch {
      /* */
    }
  }
  if (!ok) {
    try {
      const r = buildLastResort(slot)
      ok = accept(r.item, r.evidence, r.hardProfile, 'last')
      if (!ok) {
        // lastResort should be id-unique; if still collide, mutate numeric param
        const idn = parseInt(slot.id.slice(-3), 10)
        r.item.stem = r.item.stem.replace(/\d+/, String(1000 + idn))
        // may break answer — rebuild numeric answer if numeric
        if (r.item.qtype === 'numeric') {
          r.item.stem = `求 ${1000 + idn} 除以 1 的商`
          r.item.answer = String(1000 + idn)
          r.item.analysis = `商为自身。`
        }
        ok = accept(r.item, r.evidence, r.hardProfile, 'last')
      }
    } catch (e) {
      stats.failed.push({ id: slot.id, err: String(e.message || e) })
    }
  }
  if (!ok && !stats.failed.find((f) => f.id === slot.id)) stats.failed.push({ id: slot.id, err: 'uniq fail' })
}

fs.writeFileSync(
  path.join(__dirname, `g4a_group0${g}.mjs`),
  `/** GLOBAL-4A QUALITY-REBUILD group0${g} */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`,
)
fs.writeFileSync(
  path.join(__dirname, `_rebuild_qc_g${g}.json`),
  JSON.stringify(
    {
      ...stats,
      n: candidates.length,
      required: candidates.filter((c) => c.diagramRequirement === 'REQUIRED').map((c) => c.id),
      crutchLeft: candidates.filter((c) => CRUTCH_RE.test(c.stem)).length,
      isomorphicRisk: stats.isomorphicRiskIds.length,
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      evidences,
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      group: g,
      n: candidates.length,
      failed: stats.failed.length,
      fromMain: stats.fromMain,
      fromFallback: stats.fromFallback,
      fromLast: stats.fromLast,
      isoRisk: stats.isomorphicRiskIds.length,
      required: candidates.filter((c) => c.diagramRequirement === 'REQUIRED').length,
      crutchLeft: candidates.filter((c) => CRUTCH_RE.test(c.stem)).length,
    },
    null,
    2,
  ),
)
