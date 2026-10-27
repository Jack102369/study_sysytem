/**
 * Build g4a_group02.mjs from slots + authored bodies.
 * Run: node bank_global4a/_build_g2.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { slots, wrap } from './_build_g2_helper.mjs'
import { bodies as bodiesA } from './_g2_bodies_part1.mjs'
import { bodies as bodiesB } from './_g2_bodies_part2.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bodies = { ...bodiesA, ...bodiesB }

const missing = slots.filter((s) => !bodies[s.id]).map((s) => s.id)
if (missing.length) {
  console.error('missing bodies', missing)
  process.exit(1)
}

const candidates = slots.map((s) => wrap(s, bodies[s.id]))
const out = `/** GLOBAL-4A group02 CAND-G4A-101..200 */\nexport const candidates = ${JSON.stringify(
  candidates,
  null,
  2,
)};\n`
fs.writeFileSync(path.join(__dirname, 'g4a_group02.mjs'), out)
console.log('wrote', candidates.length, 'to g4a_group02.mjs')
console.log(
  'REQUIRED',
  candidates.filter((c) => c.diagramRequirement === 'REQUIRED').map((c) => c.id),
)
