/**
 * Patch Batch6 inventory category/specialty only. Keeps 377 codes.
 * Also strengthens notes for verifyNeeded + q.eq.Na_water training limits (no DB change for published).
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const invPath = path.join(ROOT, 'docs/chemistry_kb_inventory.json')
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))
const beforeCount = inv.batches.reduce((s, b) => s + b.items.length, 0)
if (beforeCount !== 377) throw new Error('expected 377, got ' + beforeCount)

const b6 = inv.batches.find((b) => b.id === 'batch6')

/** @type {Record<string, {specialtyCodes?: string[], categoryCodes?: string[], noteAppend?: string}>} */
const PATCH = {
  'rxn.CH4_Cl2': {
    categoryCodes: ['organic.substitution', 'equation.write_from_text', 'equation.condition'],
  },
  'rxn.C2H4_Br2': {
    categoryCodes: ['organic.addition', 'equation.write_from_text'],
  },
  'rxn.C2H4_H2O': {
    categoryCodes: ['organic.addition', 'equation.condition'],
  },
  'rxn.C2H4_H2': {
    categoryCodes: ['organic.addition', 'equation.condition'],
  },
  'rxn.C2H5OH_O2': {
    specialtyCodes: ['organic', 'equation', 'redox'],
    categoryCodes: [
      'organic.oxidation',
      'organic.ethanol',
      'redox.identify',
      'redox.ox_product',
      'redox.re_product',
      'equation.condition',
    ],
    noteAppend: 'B6整改P0:ox=CH3CHO,re=H2O',
  },
  'rxn.C2H5OH_burn': {
    specialtyCodes: ['organic', 'equation', 'redox'],
    categoryCodes: [
      'organic.oxidation',
      'organic.ethanol',
      'redox.identify',
      'redox.ox_product',
      'redox.re_product',
      'equation.write_from_text',
    ],
    noteAppend: 'B6整改P0:完全燃烧ox=CO2,re=H2O;勿机械推广',
  },
  'rxn.esterification': {
    categoryCodes: ['organic.esterification', 'equation.condition', 'equation.write_from_text'],
  },
  'rxn.CH3COOH_NaOH': {
    categoryCodes: ['organic.acetic', 'equation.ionic_write', 'equation.write_from_text'],
  },
  'rxn.CH3COOH_Na2CO3': {
    categoryCodes: ['organic.acetic', 'equation.ionic_write', 'equation.write_from_text'],
  },
  'rxn.C2H4_KMnO4': {
    specialtyCodes: ['organic', 'equation', 'experiment'],
    categoryCodes: [
      'organic.oxidation',
      'organic.ethene',
      'experiment.phenomenon_judge',
      'equation.write_from_text',
    ],
  },
  'concept.functional_group': {
    categoryCodes: ['organic.basic', 'organic.structure_formula'],
  },
  'concept.substitution': {
    categoryCodes: ['organic.substitution'],
  },
  'concept.addition': {
    categoryCodes: ['organic.addition'],
  },
  'concept.esterification_rule': {
    categoryCodes: ['organic.esterification'],
  },
  'kp.energy.galvanic': {
    specialtyCodes: ['redox', 'comprehensive'],
    categoryCodes: ['redox.e_direction', 'comprehensive.basic'],
    noteAppend: 'B6整改:去掉experiment主挂靠',
  },
  'kp.sustain.atom_economy': {
    specialtyCodes: ['comprehensive'],
    categoryCodes: ['comprehensive.basic'],
    noteAppend:
      'B6整改:去掉calculation.mixed;待教材核实保留;excludeDefaultTraining',
  },
  'q.eq.Na_water': {
    noteAppend:
      'B6整改建议:published不覆盖;题干问生成物非方程式;不宜作方程式自动判题标准;训练限制;未改DB正文',
  },
  'concept.heat_of_reaction': {
    noteAppend: 'B6整改后仍待教材核实;excludeDefaultQuantitative',
  },
  'kp.organic.cracking': {
    noteAppend: 'B6整改后仍待教材核实;excludeDefaultTraining',
  },
  'kp.organic.pyrolysis': {
    noteAppend: 'B6整改后仍待教材核实;excludeDefaultTraining',
  },
  'kp.organic.biomolecule': {
    noteAppend: 'B6整改后仍待教材核实;excludeDefaultTraining',
  },
  'sub.C2H2': {
    noteAppend: 'B6整改:必修了解限默认深度',
  },
  'sub.C6H6': {
    noteAppend: 'B6整改:了解级;禁Kekulé性质误导默认题',
  },
}

const changed = []
for (const it of b6.items) {
  const p = PATCH[it.code]
  if (!p) continue
  if (p.specialtyCodes) it.specialtyCodes = p.specialtyCodes
  if (p.categoryCodes) it.categoryCodes = p.categoryCodes
  if (p.noteAppend) {
    if (!String(it.note || '').includes(p.noteAppend.slice(0, 20))) {
      it.note = (it.note ? it.note + '; ' : '') + p.noteAppend
    }
  }
  // keep verifyNeeded flags
  changed.push(it.code)
}

// ensure verifyNeeded still true
for (const code of [
  'concept.heat_of_reaction',
  'kp.organic.cracking',
  'kp.organic.pyrolysis',
  'kp.sustain.atom_economy',
  'kp.organic.biomolecule',
]) {
  const it = b6.items.find((i) => i.code === code)
  if (!it.verifyNeeded) it.verifyNeeded = true
}

const afterCount = inv.batches.reduce((s, b) => s + b.items.length, 0)
if (afterCount !== 377) throw new Error('code count changed')

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n')
fs.writeFileSync(
  path.join(__dirname, 'inventory_patched.json'),
  JSON.stringify({ changed, afterCount, verifyNeeded: b6.items.filter((i) => i.verifyNeeded).map((i) => i.code) }, null, 2) +
    '\n',
)
console.log(JSON.stringify({ changed: changed.length, codes: changed, afterCount }, null, 2))
