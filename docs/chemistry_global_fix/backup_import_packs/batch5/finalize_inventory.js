/**
 * Update batch5 inventory status/dbId after successful import.
 * Does NOT change total 377 codes.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const invPath = path.join(ROOT, 'docs/chemistry_kb_inventory.json')
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))
const map = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'import_all_results.json'), 'utf8'),
).codeToEntity

const b5 = inv.batches.find((b) => b.id === 'batch5')
if (!b5) throw new Error('batch5 missing')

let updated = 0
for (const it of b5.items) {
  const ent = map[it.code]
  if (!ent) throw new Error('missing import map for ' + it.code)
  it.status = 'imported'
  it.dbId = String(ent.id)
  const tag = `batch5导入 pending_review id=${ent.id}`
  if (!String(it.note || '').includes('batch5导入')) {
    it.note = it.note ? `${it.note}; ${tag}` : tag
  }
  updated++
}

const total = inv.batches.reduce((n, b) => n + b.items.length, 0)
if (total !== 377 && inv.meta?.total !== total) {
  console.warn('item count', total, 'meta.total', inv.meta?.total)
}
if (b5.items.length !== 42) throw new Error('batch5 count changed')

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')
console.log(
  JSON.stringify({ ok: true, updated, batch5: b5.items.length, total }, null, 2),
)
