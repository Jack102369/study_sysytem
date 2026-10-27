import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inv = JSON.parse(fs.readFileSync(path.join(__dirname, '_iso_inventory.json'), 'utf8'))
const m = await import(pathToFileURL(path.join(__dirname, '../candidates-g4a-500.mjs')).href)
const byId = new Map(m.candidates.map((c) => [c.id, c]))
const replace = new Set()
const keep = new Set()
for (const f of inv.families) {
  keep.add(f.memberIds[0])
  for (const id of f.memberIds.slice(1)) replace.add(id)
}
for (const id of keep) replace.delete(id)
const counts = {}
for (const id of replace) {
  const c = byId.get(id)
  const k = `${c.chapterNo}:${c.qtype}`
  counts[k] = (counts[k] || 0) + 1
}
console.log(
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join('\n'),
)
console.log('totalReplace', replace.size)
