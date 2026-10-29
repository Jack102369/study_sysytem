/**
 * Verify Ch3 wave A merge mapping (no rewrite of pool).
 * Keepers: agent 201→211 … 207→216; skip 204; reject 208.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '_1e_design_ch3_a.json'), 'utf8'))
const { accepted1e } = await import(pathToFileURL(path.join(__dirname, '_1e_accepted_pool.mjs')).href + '?t=' + Date.now())

const expect = [211, 212, 213, 214, 215, 216]
const have = accepted1e.filter((x) => expect.includes(x.n)).map((x) => x.n).sort((a, b) => a - b)
const agentAccepted = raw.filter((x) => x.round2 === 'ACCEPTED_H3').map((x) => x.n)
const meta = {
  agentAccepted,
  skipped: [204, 208],
  remappedTo: expect,
  poolHas: have,
  ok: JSON.stringify(have) === JSON.stringify(expect),
  totalPool: accepted1e.length,
}
fs.writeFileSync(path.join(__dirname, '_1e_ch3_merge_meta.json'), JSON.stringify(meta, null, 2))
console.log(JSON.stringify(meta, null, 2))
if (!meta.ok) process.exit(1)
