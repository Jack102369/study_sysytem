/**
 * Patch Batch5 inventory specialty/category. Total 377 unchanged.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const invPath = path.join(__dirname, '../chemistry_kb_inventory.json')
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))
const b5 = inv.batches.find((b) => b.id === 'batch5')
if (!b5 || b5.items.length !== 42) throw new Error('batch5 invalid')

const CAT = {
  // basic ops / instrument / safety — remove gas_prep/gas_collect
  'exp.instrument_basic': {
    categoryCodes: [
      'experiment.instrument_id',
      'experiment.instrument_use',
      'experiment.basic_ops',
      'experiment.safety',
    ],
  },
  'exp.ops_weigh': {
    categoryCodes: ['experiment.basic_ops', 'experiment.error_fix'],
  },
  'exp.ops_dissolve': {
    categoryCodes: ['experiment.basic_ops', 'experiment.step_order'],
  },
  'exp.ops_filter': {
    categoryCodes: [
      'experiment.basic_ops',
      'experiment.step_order',
      'experiment.error_fix',
    ],
  },
  'exp.ops_evaporate': {
    categoryCodes: ['experiment.basic_ops', 'experiment.apparatus_id'],
  },
  'exp.ops_distill': {
    categoryCodes: [
      'experiment.basic_ops',
      'experiment.apparatus_id',
      'experiment.apparatus_link',
      'experiment.safety',
    ],
  },
  'exp.ops_extract': {
    categoryCodes: [
      'experiment.basic_ops',
      'experiment.step_order',
      'experiment.safety',
    ],
  },
  'exp.check_airtight': {
    categoryCodes: [
      'experiment.basic_ops',
      'experiment.step_order',
      'experiment.apparatus_link',
    ],
  },
  'exp.safety_rules': {
    categoryCodes: ['experiment.safety'],
  },
  'exp.gas_collect_upward': {
    categoryCodes: [
      'experiment.gas_collect',
      'experiment.basic_ops',
      'experiment.safety',
    ],
  },
  'exp.gas_collect_downward': {
    categoryCodes: [
      'experiment.gas_collect',
      'experiment.basic_ops',
      'experiment.safety',
    ],
  },
  'exp.gas_collect_water': {
    categoryCodes: [
      'experiment.gas_collect',
      'experiment.basic_ops',
      'experiment.safety',
    ],
  },
  'exp.O2_prep_KMnO4': {
    categoryCodes: [
      'experiment.gas_prep',
      'experiment.gas_collect',
      'experiment.apparatus_link',
      'experiment.safety',
    ],
  },
  'exp.O2_prep_H2O2': {
    categoryCodes: [
      'experiment.gas_prep',
      'experiment.gas_collect',
      'experiment.safety',
    ],
  },
  'exp.H2_prep_Zn': {
    categoryCodes: [
      'experiment.gas_prep',
      'experiment.gas_collect',
      'experiment.safety',
    ],
  },
  'exp.CO2_prep_marble': {
    categoryCodes: [
      'experiment.gas_prep',
      'experiment.gas_collect',
      'experiment.substance_test',
      'experiment.safety',
    ],
  },
  'formula.ion_conc': {
    categoryCodes: ['calculation.amount', 'calculation.mixed'],
    noteSuffix: 'B5整改:category去equation_calc',
  },
  'kp.rate.factors': {
    specialtyCodes: ['comprehensive'],
    categoryCodes: ['comprehensive.basic'],
    noteSuffix: 'B5整改:specialty以comprehensive为主',
  },
  'kp.exp.error': {
    noteSuffix: 'B5整改:容量瓶分阶段误差对照',
  },
  'q.calc.excess': {
    noteSuffix: 'B5整改:单一数据过量骨架',
  },
  'exp.ops_burette': {
    noteSuffix: '待核实:是否必修核心;禁定量滴定默认',
    verifyNeeded: true,
  },
  'exp.flame_test': {
    noteSuffix: '待核实:教材颜色措辞;已标物理变化',
    verifyNeeded: true,
  },
  'kp.extent.le_chatelier_basic': {
    noteSuffix: '待核实:教材深度;禁选修平衡计算默认',
    verifyNeeded: true,
  },
  'exp.ops_volumetric_flask': {
    noteSuffix: 'B5整改:补残留水不影响c提示',
  },
}

const changed = []
for (const it of b5.items) {
  const f = CAT[it.code]
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
  changed.push({
    code: it.code,
    before,
    after: {
      specialtyCodes: it.specialtyCodes,
      categoryCodes: it.categoryCodes,
      note: it.note,
      verifyNeeded: it.verifyNeeded,
    },
  })
}

const total = inv.batches.reduce((n, b) => n + b.items.length, 0)
fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')
fs.writeFileSync(
  path.join(__dirname, 'inventory_patched.json'),
  JSON.stringify({ changedAt: new Date().toISOString(), changed, total }, null, 2),
  'utf8',
)
console.log(
  JSON.stringify(
    { ok: true, changed: changed.length, batch5: b5.items.length, total },
    null,
    2,
  ),
)
