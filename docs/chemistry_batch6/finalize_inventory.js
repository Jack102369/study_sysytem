/** Mark Batch6 items imported in inventory; add batch6Build summary. Keep 377 codes. */
'use strict'
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
const reuse = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'reuse_check.json'), 'utf8'),
)

const beforeCount = inv.batches.reduce((s, b) => s + b.items.length, 0)
if (beforeCount !== 377) {
  throw new Error('inventory must have 377 codes before finalize, got ' + beforeCount)
}

const b6 = inv.batches.find((b) => b.id === 'batch6')
let updated = 0
let reused = 0

const reuseId = {}
for (const h of reuse.hits || []) {
  if (!reuseId[h.code]) reuseId[h.code] = String(h.id)
}

for (const it of b6.items) {
  const ent = results.codeToEntity[it.code]
  if (ent) {
    it.status = 'imported'
    it.dbId = String(ent.id)
    const tag = `batch6导入 pending_review id=${ent.id}`
    if (!String(it.note || '').includes('batch6导入')) {
      it.note = (it.note ? it.note + '; ' : '') + tag
    }
    updated++
  } else if (it.code === 'q.eq.Na_water' && reuseId[it.code]) {
    it.status = 'seeded'
    it.dbId = reuseId[it.code]
    if (!String(it.note || '').includes('复用已有')) {
      it.note =
        (it.note ? it.note + '; ' : '') +
        `batch6复用已有 id=${reuseId[it.code]}`
    }
    reused++
  }
}

const afterCount = inv.batches.reduce((s, b) => s + b.items.length, 0)
if (afterCount !== 377) {
  throw new Error('inventory code count changed to ' + afterCount)
}

const statusCount = {}
for (const b of inv.batches) {
  for (const it of b.items) {
    statusCount[it.status] = (statusCount[it.status] || 0) + 1
  }
}
inv.summary.byStatus = statusCount

inv.summary.batch6Build = {
  planned: 79,
  reused: reused,
  imported: results.totals.success,
  import_failed: results.totals.fail,
  missing: verify.missing,
  pending_review_new: results.totals.success,
  linkOk: results.totals.linkOk,
  linkFail: results.totals.linkFail,
  coverageOk: verify.coverageOk,
  verifyNeeded: b6.items.filter((i) => i.verifyNeeded).map((i) => i.code),
  builtAt: new Date().toISOString(),
}

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')
console.log(
  JSON.stringify(
    {
      updated,
      reused,
      afterCount,
      batch6Build: inv.summary.batch6Build,
      byStatus: statusCount,
    },
    null,
    2,
  ),
)
