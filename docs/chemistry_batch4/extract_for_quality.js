/** Extract Batch4 74 items for quality review. Read-only. */
const fs = require('fs')
const path = require('path')
const dir = __dirname
const inv = JSON.parse(
  fs.readFileSync(path.join(dir, '..', 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch4 = inv.batches.find((b) => b.id === 'batch4')
const results = JSON.parse(
  fs.readFileSync(path.join(dir, 'import_all_results.json'), 'utf8'),
)
const packs = ['B4-A', 'B4-B', 'B4-C', 'B4-D']
const byCode = {}
for (const pack of packs) {
  const payload = JSON.parse(
    fs.readFileSync(path.join(dir, `import_${pack}.json`), 'utf8'),
  )
  const codes = payload.meta.inventoryCodes
  payload.items.forEach((item, i) => {
    const code = codes[i]
    byCode[code] = {
      code,
      type: item.type,
      data: item.data,
      pack,
      specialtyCodes: payload.meta.specialtyByCode[code] || [],
      categoryCodes: payload.meta.categoryByCode[code] || [],
      dbId: results.codeToEntity[code]?.id || null,
      source: 'imported',
    }
  })
}
const out = {
  extractedAt: new Date().toISOString(),
  total: batch4.items.length,
  items: batch4.items.map((it) => ({
    ...byCode[it.code],
    inventoryName: it.name,
    inventoryStatus: it.status,
    note: it.note,
    verifyNeeded: !!it.verifyNeeded,
  })),
}
fs.writeFileSync(path.join(dir, 'quality_extract.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify({ total: out.items.length, withData: out.items.filter((i) => i.data).length }, null, 2))
