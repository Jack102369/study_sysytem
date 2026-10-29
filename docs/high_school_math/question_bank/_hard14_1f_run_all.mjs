/**
 * HARD14-1F: run Gate0 then G1→G5 sequentially. Stop on first failure.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { root, qb } from './_hard14_1f_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function run(script, args = []) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })
  console.log(r.stdout || '')
  if (r.stderr) console.error(r.stderr)
  return r.status ?? 2
}

console.log('=== HARD14-1F Gate0 ===')
const g0 = run('_hard14_1f_gate0_ro.mjs')
if (g0 !== 0) {
  console.error('GATE0_FAILED — no writes')
  process.exit(2)
}

for (let g = 1; g <= 5; g++) {
  console.log(`=== HARD14-1F Group ${g} ===`)
  const st = run('_hard14_1f_run_group.mjs', [String(g)])
  if (st !== 0) {
    console.error(`GROUP_${g}_FAILED — stop`)
    process.exit(2)
  }
}

console.log('=== HARD14-1F Aggregate ===')
const ag = run('_hard14_1f_aggregate.mjs')
process.exit(ag === 0 ? 0 : 2)
