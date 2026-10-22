/**
 * Generate Batch3 import packs from inventory + batch3_content.js
 * Run: node docs/chemistry_batch3/generate_batch3.js
 */
const fs = require('fs')
const path = require('path')
const {
  SUBSTANCES,
  REACTIONS,
  EXPERIMENTS,
  KNOWLEDGE,
  CONCEPTS,
} = require('./batch3_content')

const root = path.join(__dirname, '..')
const outDir = __dirname
const inv = JSON.parse(
  fs.readFileSync(path.join(root, 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch3 = inv.batches.find((b) => b.id === 'batch3')
if (!batch3) throw new Error('batch3 not found')

const STATUS = 'pending_review'
const seeded = batch3.items.filter((i) =>
  ['seeded', 'seeded_audited'].includes(i.status),
)
// 支持初次建设(pending)与导入后重生成(imported)
const pending = batch3.items.filter(
  (i) => !['seeded', 'seeded_audited'].includes(i.status),
)

function reviewNote(code, extra) {
  const base = `[inv:${code}]`
  return extra ? `${base} ${extra}` : base
}

function buildSubstance(code, item) {
  const d = SUBSTANCES[code]
  if (!d) throw new Error('missing substance content: ' + code)
  const { reviewExtra, ...rest } = d
  return {
    type: 'substance',
    data: {
      ...rest,
      status: STATUS,
      reviewNote: reviewNote(code, reviewExtra || item.note || ''),
    },
  }
}

function buildReaction(code, item) {
  const d = REACTIONS[code]
  if (!d) throw new Error('missing reaction content: ' + code)
  const {
    reviewExtra,
    name,
    canonicalEquation,
    equation,
    ionicEquation,
    conditions,
    phenomenon,
    principle,
    oxidant,
    reductant,
    oxProduct,
    reProduct,
    electronTransfer,
    difficulty,
    importance,
    isVerified,
    tags,
    trainTypes,
    species,
  } = d
  return {
    type: 'reaction',
    data: {
      name,
      canonicalEquation,
      equation,
      ionicEquation: ionicEquation ?? null,
      conditions: conditions || '',
      phenomenon: phenomenon ?? null,
      principle: principle ?? null,
      oxidant: oxidant ?? null,
      reductant: reductant ?? null,
      oxProduct: oxProduct ?? null,
      reProduct: reProduct ?? null,
      electronTransfer: electronTransfer ?? null,
      difficulty: difficulty ?? 2,
      importance: importance ?? 4,
      isVerified: Boolean(isVerified),
      tags: tags || [],
      trainTypes: trainTypes || '',
      species: species || [],
      status: STATUS,
      reviewNote: reviewNote(code, reviewExtra || item.note || ''),
    },
  }
}

function buildExperiment(code, item) {
  const d = EXPERIMENTS[code]
  if (!d) throw new Error('missing experiment content: ' + code)
  const { reviewExtra, ...rest } = d
  return {
    type: 'experiment',
    data: {
      ...rest,
      status: STATUS,
      reviewNote: reviewNote(code, reviewExtra || item.note || ''),
    },
  }
}

function buildKnowledge(code, item) {
  const d = KNOWLEDGE[code]
  if (!d) throw new Error('missing knowledge content: ' + code)
  return {
    type: 'knowledge',
    data: {
      name: d.name,
      description: d.description,
      difficulty: d.difficulty ?? 2,
      importance: d.importance ?? 4,
      status: STATUS,
      reviewNote: reviewNote(code, d.reviewExtra || item.note || ''),
    },
  }
}

function buildConcept(code, item) {
  const d = CONCEPTS[code]
  if (!d) throw new Error('missing concept content: ' + code)
  return {
    type: 'concept',
    data: {
      name: d.name,
      definition: d.definition,
      principle: d.principle ?? null,
      applicableConditions: d.applicableConditions ?? null,
      judgeMethods: d.judgeMethods ?? null,
      examples: d.examples ?? null,
      commonMistakes: d.commonMistakes ?? null,
      status: STATUS,
      reviewNote: reviewNote(code, d.reviewExtra || item.note || ''),
    },
  }
}

function packMeta(items) {
  const inventoryCodes = items.map((i) => i.code)
  const specialtyByCode = {}
  const categoryByCode = {}
  for (const it of items) {
    specialtyByCode[it.code] = it.specialtyCodes || []
    categoryByCode[it.code] = it.categoryCodes || []
  }
  return { inventoryCodes, specialtyByCode, categoryByCode }
}

function writePack(packId, typeLabel, invItems, builders) {
  const items = invItems.map((it) => {
    const b = builders[it.type]
    if (!b) throw new Error(`no builder for ${it.type} ${it.code}`)
    return b(it.code, it)
  })
  const meta = packMeta(invItems)
  const payload = {
    items,
    meta: { batch: 'batch3', pack: packId, ...meta },
  }
  const file = path.join(outDir, `import_${packId}.json`)
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8')

  const check = [
    `# Check ${packId} (${typeLabel})`,
    '',
    `- items: ${items.length}`,
    `- codes:`,
    ...invItems.map((i) => `- ${i.code}`),
    '',
    'Status: format generated; chemical content requires human review (not human-approved).',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(outDir, `check_${packId}.md`), check, 'utf8')
  return { packId, count: items.length, file }
}

const byType = {
  substance: pending.filter((i) => i.type === 'substance'),
  reaction: pending.filter((i) => i.type === 'reaction'),
  experiment: pending.filter((i) => i.type === 'experiment'),
  knowledge: pending.filter((i) => i.type === 'knowledge'),
  concept: pending.filter((i) => i.type === 'concept'),
}

// Validate content coverage
for (const it of byType.substance) {
  if (!SUBSTANCES[it.code]) throw new Error('SUBSTANCES missing ' + it.code)
}
for (const it of byType.reaction) {
  if (!REACTIONS[it.code]) throw new Error('REACTIONS missing ' + it.code)
}
for (const it of byType.experiment) {
  if (!EXPERIMENTS[it.code]) throw new Error('EXPERIMENTS missing ' + it.code)
}
for (const it of byType.knowledge) {
  if (!KNOWLEDGE[it.code]) throw new Error('KNOWLEDGE missing ' + it.code)
}
for (const it of byType.concept) {
  if (!CONCEPTS[it.code]) throw new Error('CONCEPTS missing ' + it.code)
}

const builders = {
  substance: buildSubstance,
  reaction: buildReaction,
  experiment: buildExperiment,
  knowledge: buildKnowledge,
  concept: buildConcept,
}

const packs = []
packs.push(
  writePack('B3-A', 'substance', byType.substance, builders),
)
packs.push(
  writePack('B3-B', 'reaction', byType.reaction, builders),
)
packs.push(
  writePack(
    'B3-C',
    'experiment',
    byType.experiment,
    builders,
  ),
)
packs.push(
  writePack(
    'B3-D',
    'knowledge+concept',
    [...byType.knowledge, ...byType.concept],
    builders,
  ),
)

const summary = {
  planned: batch3.items.length,
  seeded: seeded.length,
  toImport: pending.length,
  packs: Object.fromEntries(packs.map((p) => [p.packId, p.count])),
  seededCodes: seeded.map((s) => s.code),
  generatedAt: new Date().toISOString(),
}
fs.writeFileSync(
  path.join(outDir, 'generate_summary.json'),
  JSON.stringify(summary, null, 2) + '\n',
  'utf8',
)

const seededAudit = {
  seededCount: seeded.length,
  seededCodes: seeded.map((s) => s.code),
  notes: [
    'sub.Na/NaOH/H2/H2O、rxn.2Na_2H2O、exp.Na_H2O、kp.Na.property：阶段二已入库，本批复用，不重复导入、不覆盖 published。',
    '钠与水反应 ox/re 产物已在 P0 修复；本批导入不得改写该反应。',
  ],
}
fs.writeFileSync(
  path.join(outDir, 'seeded_audit.json'),
  JSON.stringify(seededAudit, null, 2) + '\n',
  'utf8',
)

console.log(JSON.stringify(summary, null, 2))
