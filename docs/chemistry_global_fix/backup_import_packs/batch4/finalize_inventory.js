/** Mark Batch4 items imported in inventory; add batch4Build summary. */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const invPath = path.join(ROOT, 'docs/chemistry_kb_inventory.json')
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))
const results = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'import_all_results.json'), 'utf8'),
)
const verify = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'verify_post_import.json'), 'utf8'),
)

const b4 = inv.batches.find((b) => b.id === 'batch4')
let updated = 0
for (const it of b4.items) {
  const ent = results.codeToEntity[it.code]
  if (ent) {
    it.status = 'imported'
    it.dbId = String(ent.id)
    it.note = (it.note ? it.note + '; ' : '') + `batch4导入 pending_review id=${ent.id}`
    updated++
  }
}

inv.summary.byStatus = inv.summary.byStatus || {}
// recount statuses roughly
const statusCount = {}
for (const b of inv.batches) {
  for (const it of b.items) {
    statusCount[it.status] = (statusCount[it.status] || 0) + 1
  }
}
inv.summary.byStatus = statusCount

inv.summary.batch4Build = {
  planned: 74,
  seeded_audited: 0,
  imported: results.totals.success,
  import_failed: results.totals.fail,
  missing: verify.missing,
  pending_review_new: results.totals.success,
  linkOk: results.totals.linkOk,
  linkFail: results.totals.linkFail,
  reuse: 0,
  builtAt: new Date().toISOString(),
  verifyNeeded: b4.items.filter((i) => i.verifyNeeded).map((i) => i.code),
}

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')
console.log(
  JSON.stringify(
    { updated, batch4Build: inv.summary.batch4Build, byStatus: statusCount },
    null,
    2,
  ),
)
