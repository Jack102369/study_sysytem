/**
 * Fix Batch4 inventory specialty/category for non-redox mis-tags + notes.
 * Does NOT change total item count (377 / batch4 74).
 */
'use strict'
const fs = require('fs')
const path = require('path')

const invPath = path.join(__dirname, '../chemistry_kb_inventory.json')
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))
const b4 = inv.batches.find((b) => b.id === 'batch4')
if (!b4) throw new Error('batch4 missing')

const FIX = {
  'rxn.SO3_H2O': {
    specialtyCodes: ['equation', 'substance'],
    categoryCodes: ['equation.write_from_text', 'substance.test'],
    noteSuffix: 'B4整改:specialty去redox',
  },
  'rxn.NH3_HCl': {
    specialtyCodes: ['equation', 'substance'],
    categoryCodes: ['equation.write_from_text', 'substance.test'],
    noteSuffix: 'B4整改:specialty去redox',
  },
  'rxn.CO2_CaOH2': {
    specialtyCodes: ['equation', 'substance', 'ion'],
    categoryCodes: [
      'equation.write_from_text',
      'substance.test',
      'ion.ionic_write',
    ],
    noteSuffix: 'B4整改:specialty去redox+加ion',
  },
  'rxn.SiO2_2NaOH': {
    specialtyCodes: ['equation', 'substance'],
    categoryCodes: ['equation.write_from_text', 'substance.test'],
    noteSuffix: 'B4整改:specialty去redox',
  },
  'rxn.CaCO3_2HCl': {
    specialtyCodes: ['equation', 'substance', 'ion'],
    categoryCodes: [
      'equation.write_from_text',
      'substance.test',
      'ion.ionic_write',
    ],
    noteSuffix: 'B4整改:specialty去redox+加ion',
  },
  'rxn.Cl2_2NaOH': {
    noteSuffix: 'B4整改:补热浓碱禁混用条件',
  },
  'sub.bleaching_powder': {
    noteSuffix: 'B4整改:强化混合物表述;仍待核实教材口径;禁精确组成绝对填空',
    verifyNeeded: true,
  },
  'sub.P': {
    noteSuffix: 'B4整改:仍待核实同素异形体细节;限默认细对比题',
    verifyNeeded: true,
  },
  'sub.P4O10': {
    noteSuffix: 'B4整改:P4O10/P2O5双写法说明;仍待核实教材主写法',
    verifyNeeded: true,
  },
}

const changed = []
for (const it of b4.items) {
  const f = FIX[it.code]
  if (!f) continue
  const before = {
    specialtyCodes: [...(it.specialtyCodes || [])],
    categoryCodes: [...(it.categoryCodes || [])],
    note: it.note,
  }
  if (f.specialtyCodes) it.specialtyCodes = f.specialtyCodes
  if (f.categoryCodes) it.categoryCodes = f.categoryCodes
  if (f.verifyNeeded) it.verifyNeeded = true
  if (f.noteSuffix) {
    const base = String(it.note || '')
    if (!base.includes(f.noteSuffix)) {
      it.note = base ? `${base}; ${f.noteSuffix}` : f.noteSuffix
    }
  }
  changed.push({ code: it.code, before, after: {
    specialtyCodes: it.specialtyCodes,
    categoryCodes: it.categoryCodes,
    note: it.note,
    verifyNeeded: it.verifyNeeded,
  }})
}

const totalAfter = inv.batches.reduce((n, b) => n + b.items.length, 0)
if (b4.items.length !== 74) throw new Error('batch4 count changed: ' + b4.items.length)
if (totalAfter !== 377 && inv.meta?.totalPlanned && totalAfter !== inv.meta.totalPlanned) {
  // soft check — report actual
  console.warn('total items now', totalAfter, 'meta.totalPlanned', inv.meta?.totalPlanned)
}

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')
fs.writeFileSync(
  path.join(__dirname, 'inventory_specialty_patched.json'),
  JSON.stringify({ changedAt: new Date().toISOString(), changed }, null, 2),
  'utf8',
)
console.log(JSON.stringify({ ok: true, changed: changed.length, batch4: b4.items.length, total: totalAfter }, null, 2))
