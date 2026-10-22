/** Update inventory after Batch3 quality fix. */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const invPath = path.join(ROOT, 'docs/chemistry_kb_inventory.json')
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'))

const stillVerify = new Set([
  'sub.NaAlO2',
  'sub.Al2O3',
  'sub.AlOH3',
  'rxn.2Al_2NaOH',
  'rxn.Al2O3_2NaOH',
  'rxn.AlOH3_NaOH',
  'rxn.NaOH_CO2',
  'sub.FeO',
  'kp.metal.pig_iron',
  'kp.metal.steel',
  'kp.Al.salt_aluminate',
  'exp.Fe3_SCN',
])

const excludeDefault = [
  'kp.metal.stainless',
  'kp.metal.pig_iron',
  'kp.metal.steel',
  'rxn.2Na_2HCl',
  'kp.Fe.fe2_fe3', // deep agents only
  'rxn.FeOH2_O2', // redox.identify excluded
  'concept.alloy', // absolute melting-point quiz excluded (content fixed)
]

inv.summary.batch3QualityFix = {
  fixedAt: new Date().toISOString(),
  basedOn: 'CHEMISTRY_BATCH3_QUALITY_REPORT.md',
  appliedDbRows: 88,
  p0Fixed: ['concept.alloy'],
  remainingHumanVerify: [...stillVerify],
  excludeDefaultTrainingHints: excludeDefault,
  recheckVerdicts: {
    通过: 79,
    需要修改: 0,
    需要人工核实: 12,
    疑似超纲: 0,
    P0: 0,
    P1_open: 8,
    P2_open: 0,
    note: 'AI自动复查≠人工审核；84条仍pending_review',
  },
}

const b3 = inv.batches.find((b) => b.id === 'batch3')
for (const it of b3.items) {
  if (stillVerify.has(it.code)) {
    it.verifyNeeded = true
    it.qualityNote =
      (it.qualityNote ? it.qualityNote + '; ' : '') +
      'B3整改后仍待教材口径核实'
  }
  if (it.code === 'rxn.FeOH2_O2') {
    it.verifyNeeded = false
    it.qualityNote = 'B3整改:还原产物口径已说明;默认排除redox.identify'
  }
  if (it.code === 'concept.alloy') {
    it.qualityNote = 'B3整改P0:合金熔点/硬度分述'
  }
  if (it.code === 'rxn.2Na_2HCl') {
    it.qualityNote = '了解级;禁学生实验;排除默认实验操作训练'
  }
  if (excludeDefault.includes(it.code) && !it.excludeDefaultTraining) {
    it.excludeDefaultTraining = true
  }
}

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8')
console.log(
  JSON.stringify(
    {
      ok: true,
      batch3QualityFix: inv.summary.batch3QualityFix,
      verifyCount: b3.items.filter((i) => i.verifyNeeded).length,
    },
    null,
    2,
  ),
)
