/**
 * Export compact cards for independent math recheck (1F).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { candidates } from './candidates-g1b-100.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docs = path.resolve(__dirname, '..')

function card(c) {
  return {
    id: c.id,
    qtype: c.qtype,
    difficulty: c.difficulty,
    mathVerified: c.mathVerified,
    kpCode: c.kpCode,
    methodMain: c.methodMain,
    stem: c.stem,
    options: c.options || null,
    answer: c.answer,
    maxScore: c.maxScore,
    rubric: c.rubric || null,
    analysis: c.analysis,
  }
}

const auth = candidates.filter((c) => c.mathVerified === 'AUTHOR_CHECKED')
const spot = candidates.filter((c) => c.mathVerified === 'SPOT_VERIFIED')
const spotSample = spot.filter((_, i) => i % 4 === 0) // ~13
const multi = candidates.filter((c) => c.qtype === 'multi')
const apps = candidates.filter((c) => c.qtype === 'application')
const d3 = candidates.filter((c) => c.difficulty === 3)
const numeric = candidates.filter((c) => c.qtype === 'numeric')

const pack = {
  meta: {
    auth: auth.length,
    spot: spot.length,
    spotSample: spotSample.length,
    multi: multi.length,
    apps: apps.length,
    d3: d3.length,
    numeric: numeric.length,
  },
  authorAll: auth.map(card),
  spotSample: spotSample.map(card),
  multiAll: multi.map(card),
  numericAll: numeric.map(card),
}

fs.writeFileSync(path.join(docs, '_g1f_math_cards.json'), JSON.stringify(pack, null, 2))
// also write a plain-text digest for human scan
const lines = []
function dump(label, arr) {
  lines.push(`\n===== ${label} (${arr.length}) =====`)
  for (const c of arr) {
    lines.push(`\n--- ${c.id} [${c.qtype}/d${c.difficulty}/${c.mathVerified}] ${c.kpCode}`)
    lines.push(`STEM: ${c.stem}`)
    if (c.options) {
      for (const [k, v] of Object.entries(c.options)) lines.push(`  ${k}. ${v}`)
    }
    lines.push(`ANSWER: ${c.answer}`)
    if (c.rubric) lines.push(`RUBRIC: ${JSON.stringify(c.rubric)} max=${c.maxScore}`)
    lines.push(`ANALYSIS: ${c.analysis}`)
  }
}
dump('AUTHOR_ALL', auth)
dump('SPOT_SAMPLE', spotSample)
dump('MULTI_ALL', multi)
fs.writeFileSync(path.join(docs, '_g1f_math_digest.txt'), lines.join('\n'), 'utf8')
console.log(JSON.stringify(pack.meta, null, 2))
console.log('wrote _g1f_math_cards.json + _g1f_math_digest.txt')
