import { pathToFileURL } from 'node:url'
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, '_baseline38_sha_snap.json'), 'utf8'))
const m = await import(pathToFileURL(path.join(qb, 'h3_ch1_4_candidates.mjs')).href + '?t=' + Date.now())
const byId = new Map(m.candidates.map((c) => [c.id, c]))
let ok = true
const diffs = []
for (let i = 0; i < snap.ids.length; i++) {
  const id = snap.ids[i]
  const c = byId.get(id)
  if (!c) {
    ok = false
    diffs.push({ id, err: 'MISSING' })
    continue
  }
  if (c.hardProfile.contentSha256 !== snap.shas[i]) {
    ok = false
    diffs.push({ id, old: snap.shas[i], neu: c.hardProfile.contentSha256 })
  }
}
const fileBuf = fs.readFileSync(path.join(qb, 'h3_ch1_4_candidates.mjs'))
const fileSha256 = crypto.createHash('sha256').update(fileBuf).digest('hex')
const newIds = m.candidates.filter((c) => !snap.ids.includes(c.id)).map((c) => c.id)
const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const c of m.candidates) ch[c.chapterNo]++
const report = {
  baselineIntact: ok,
  diffs,
  total: m.candidates.length,
  batchContentSha256: m.batchContentSha256,
  fileSha256,
  status: m.status,
  newIds,
  chapter: ch,
  shaNote:
    'batchContentSha256=sha256(item contentShas joined by |); fileSha256=sha256(entire candidates.mjs bytes)',
  baselineBatchSha: snap.batch,
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
}
fs.writeFileSync(path.join(__dirname, '_ch3_1c_verify.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
