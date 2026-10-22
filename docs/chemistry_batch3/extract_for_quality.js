/** Extract Batch3 items from import packs + inventory for quality review. No DB writes. */
const fs = require('fs')
const path = require('path')

const dir = __dirname
const inv = JSON.parse(
  fs.readFileSync(path.join(dir, '..', 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch3 = inv.batches.find((b) => b.id === 'batch3')
const results = JSON.parse(
  fs.readFileSync(path.join(dir, 'import_all_results.json'), 'utf8'),
)

const packs = ['B3-A', 'B3-B', 'B3-C', 'B3-D']
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

// seeded placeholders
const seeded = batch3.items.filter((i) =>
  ['seeded', 'seeded_audited'].includes(i.status),
)

const out = {
  extractedAt: new Date().toISOString(),
  totalInventory: batch3.items.length,
  importedInPacks: Object.keys(byCode).length,
  seededCodes: seeded.map((s) => s.code),
  items: batch3.items.map((it) => {
    if (byCode[it.code]) {
      return {
        ...byCode[it.code],
        inventoryName: it.name,
        inventoryStatus: it.status,
        priority: it.priority,
        note: it.note,
        verifyNeeded: !!it.verifyNeeded,
      }
    }
    return {
      code: it.code,
      type: it.type,
      inventoryName: it.name,
      inventoryStatus: it.status,
      priority: it.priority,
      note: it.note,
      source: 'seeded_reuse',
      data: null,
    }
  }),
}

fs.writeFileSync(
  path.join(dir, 'quality_extract.json'),
  JSON.stringify(out, null, 2),
  'utf8',
)
console.log(
  JSON.stringify(
    {
      total: out.items.length,
      imported: out.importedInPacks,
      seeded: out.seededCodes.length,
    },
    null,
    2,
  ),
)
