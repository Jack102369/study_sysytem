import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const c = fs.readFileSync(path.join(__dirname, '..', 'h3_ch1_4_candidates.mjs'))
const fileSha256 = crypto.createHash('sha256').update(c).digest('hex')
const m = String(c).match(/batchContentSha256 = "([a-f0-9]+)"/)
console.log(JSON.stringify({ fileSha256, batchFromFile: m && m[1] }, null, 2))
