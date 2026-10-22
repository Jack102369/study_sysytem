/** Update inventory after Batch3 import. */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const invPath = path.join(root, 'chemistry_kb_inventory.json')
const results = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'import_all_results.json'), 'utf8'),
)
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))
const batch3 = inv.batches.find((b) => b.id === 'batch3')
const map = results.codeToEntity || {}

let imported = 0
let seededAudited = 0
let missing = []

for (const it of batch3.items) {
  if (it.status === 'seeded') {
    it.status = 'seeded_audited'
    it.note = (it.note || '') + (it.note ? '; ' : '') + 'batch3复用：不覆盖published'
    seededAudited++
    continue
  }
  const ent = map[it.code]
  if (ent) {
    it.status = 'imported'
    it.dbId = ent.id
    it.note =
      (it.note ? it.note + '; ' : '') +
      `batch3导入 pending_review id=${ent.id}`
    imported++
  } else {
    missing.push(it.code)
  }
}

const byStatus = {}
const byType = {}
for (const it of batch3.items) {
  byStatus[it.status] = (byStatus[it.status] || 0) + 1
  byType[it.type] = (byType[it.type] || 0) + 1
}

inv.summary = inv.summary || {}
inv.summary.batch3Build = {
  planned: 91,
  seeded_audited: seededAudited,
  imported,
  import_failed: results.totals.fail,
  missing: missing.length,
  pending_review_new: imported,
  linkOk: results.totals.linkOk,
  linkFail: results.totals.linkFail,
  builtAt: new Date().toISOString(),
}

// recount global status roughly
const globalStatus = {}
const globalType = {}
let total = 0
for (const b of inv.batches) {
  for (const it of b.items) {
    total++
    globalStatus[it.status] = (globalStatus[it.status] || 0) + 1
    globalType[it.type] = (globalType[it.type] || 0) + 1
  }
}
inv.summary.total = total
inv.summary.byStatus = globalStatus
inv.summary.byType = globalType
inv.summary.byBatch = Object.fromEntries(
  inv.batches.map((b) => [b.id, b.items.length]),
)

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')

const reconcile = {
  planned: 91,
  seeded_audited: seededAudited,
  imported,
  failed: results.totals.fail,
  missing,
  byStatus,
  byType,
  allCodesHaveStatus: batch3.items.every((i) => !!i.status),
  codes: batch3.items.map((i) => ({
    code: i.code,
    status: i.status,
    dbId: i.dbId || null,
  })),
}
fs.writeFileSync(
  path.join(__dirname, 'reconcile.json'),
  JSON.stringify(reconcile, null, 2) + '\n',
  'utf8',
)
console.log(JSON.stringify({ ...reconcile, codes: undefined, missing }, null, 2))
