/**
 * Offline structural validate for hard_ch1_4_designs.json.
 * Auto-check ≠ teaching quality PASS.
 */
import fs from 'node:fs'
import path from 'node:path'
import { qb } from './_g4e_lib.mjs'

const designsPath = path.join(qb, 'hard_ch1_4_designs.json')
const qualityPath = path.join(qb, 'hard_ch1_4_design_quality.json')
const refPath = path.join(qb, 'hard_ch1_4_difficulty_reference.json')

const doc = JSON.parse(fs.readFileSync(designsPath, 'utf8'))
const quality = JSON.parse(fs.readFileSync(qualityPath, 'utf8'))
const ref = JSON.parse(fs.readFileSync(refPath, 'utf8'))
const designs = doc.designs || []

const errors = []
if (designs.length !== 100) errors.push(`count=${designs.length}`)
const levels = { H1: 0, H2: 0, H3: 0 }
const ch = { 'rja-ch1': 0, 'rja-ch2': 0, 'rja-ch3': 0, 'rja-ch4': 0 }
const fam = new Set()
for (const d of designs) {
  levels[d.targetHardLevel] = (levels[d.targetHardLevel] || 0) + 1
  ch[d.chapter] = (ch[d.chapter] || 0) + 1
  if (fam.has(d.modelFamily)) errors.push(`dupFamily:${d.modelFamily}`)
  fam.add(d.modelFamily)
  if (d.designStatus !== 'ACCEPTED') errors.push(`${d.designId}:status`)
  if (d.curriculumScopeCheck !== 'PASS') errors.push(`${d.designId}:scope`)
  if (!d.standardSolution || d.standardSolution.length < 180) {
    errors.push(`${d.designId}:shortSol`)
  }
  if (!['DISTINCT', 'ACCEPTABLE_VARIANT'].includes(d.dedupClass || 'DISTINCT')) {
    errors.push(`${d.designId}:dedup`)
  }
}
if (levels.H1 !== 30 || levels.H2 !== 45 || levels.H3 !== 25) {
  errors.push(`levels ${JSON.stringify(levels)}`)
}
if (ch['rja-ch1'] !== 10 || ch['rja-ch2'] !== 35 || ch['rja-ch3'] !== 40 || ch['rja-ch4'] !== 15) {
  errors.push(`chapters ${JSON.stringify(ch)}`)
}
if (!(ref.counterexamples || []).length) errors.push('empty reference')

const ok = errors.length === 0 && doc.status === 'HARD_DESIGN100_READY_FOR_CANDIDATES'
console.log(
  JSON.stringify(
    {
      ok,
      docStatus: doc.status,
      qualityStatus: quality.status,
      levels,
      chapters: ch,
      counterexamples: (ref.counterexamples || []).length,
      errors: errors.slice(0, 20),
      disclaimer: 'AUTO_VALIDATE_ONLY; INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
    },
    null,
    2,
  ),
)
process.exit(ok ? 0 : 1)
