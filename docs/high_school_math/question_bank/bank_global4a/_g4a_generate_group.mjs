/**
 * Generate one G4A group file from slots + factories + diversify vs prior/earlier groups.
 * Usage: node _g4a_generate_group.mjs <1-5>
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { buildItem } from './_g4a_factories.mjs'
import { uniquifyList, normStem } from './_g4a_diversify.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const g = Number(process.argv[2] || 1)
if (![1, 2, 3, 4, 5].includes(g)) throw new Error('group 1-5')

const priorPath = path.join(root, '_g4a_prior_stems.json')
const priorData = JSON.parse(fs.readFileSync(priorPath, 'utf8'))
const priorNormSet = new Set(priorData.stemsNorm || [])

// load earlier groups into prior set
for (let i = 1; i < g; i++) {
  const gp = path.join(__dirname, `g4a_group0${i}.mjs`)
  if (!fs.existsSync(gp)) continue
  const m = await import(pathToFileURL(gp).href + '?t=' + Date.now())
  for (const c of m.candidates || []) priorNormSet.add(normStem(c.stem))
}

const slotFile = path.join(__dirname, `_slots_g${g}.json`)
const { slots } = JSON.parse(fs.readFileSync(slotFile, 'utf8'))

const candidates = []
const errors = []
for (const slot of slots) {
  try {
    candidates.push(buildItem(slot))
  } catch (e) {
    errors.push({ id: slot.id, err: String(e.message || e) })
  }
}

const uniq = uniquifyList(candidates, priorNormSet)

const out =
  `/** GLOBAL-4A group0${g} ${candidates[0]?.id}..${candidates.at(-1)?.id} */\n` +
  `export const candidates = ` +
  JSON.stringify(candidates, null, 2) +
  ';\n'

fs.writeFileSync(path.join(__dirname, `g4a_group0${g}.mjs`), out)
fs.writeFileSync(
  path.join(__dirname, `_qc_group0${g}.json`),
  JSON.stringify(
    {
      group: g,
      n: candidates.length,
      errors,
      uniquify: uniq,
      required: candidates.filter((c) => c.diagramRequirement === 'REQUIRED').map((c) => c.id),
      recommended: candidates
        .filter((c) => c.diagramRequirement === 'RECOMMENDED')
        .map((c) => c.id),
      qtype: candidates.reduce((a, c) => ((a[c.qtype] = (a[c.qtype] || 0) + 1), a), {}),
      d: candidates.reduce((a, c) => ((a[c.difficulty] = (a[c.difficulty] || 0) + 1), a), {}),
      generatedAt: new Date().toISOString(),
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      fixRounds: 1,
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
      errors: errors.length,
      salvaged: uniq.salvaged.length,
      failedUniq: uniq.failed.length,
      required: candidates.filter((c) => c.diagramRequirement === 'REQUIRED').length,
    },
    null,
    2,
  ),
)
