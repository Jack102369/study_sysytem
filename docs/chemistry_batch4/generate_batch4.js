/**
 * Generate Batch4 import packs from inventory + batch4_content.js
 * Run: node docs/chemistry_batch4/generate_batch4.js
 */
const fs = require('fs')
const path = require('path')
const {
  SUBSTANCES,
  REACTIONS,
  EXPERIMENTS,
  KNOWLEDGE,
  CONCEPTS,
} = require('./batch4_content')

const root = path.join(__dirname, '..')
const outDir = __dirname
const inv = JSON.parse(
  fs.readFileSync(path.join(root, 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch4 = inv.batches.find((b) => b.id === 'batch4')
if (!batch4) throw new Error('batch4 not found')

const STATUS = 'pending_review'
const seeded = batch4.items.filter((i) =>
  ['seeded', 'seeded_audited', 'imported'].includes(i.status) &&
  false, // Batch4 all pending initially; reuse handled separately
)
const pending = batch4.items.filter(
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
  const { reviewExtra, ...rest } = d
  return {
    type: 'reaction',
    data: {
      ...rest,
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
  const { reviewExtra, ...rest } = d
  return {
    type: 'concept',
    data: {
      ...rest,
      status: STATUS,
      reviewNote: reviewNote(code, reviewExtra || item.note || ''),
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
    meta: { batch: 'batch4', pack: packId, ...meta },
  }
  const file = path.join(outDir, `import_${packId}.json`)
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  fs.writeFileSync(
    path.join(outDir, `check_${packId}.md`),
    [
      `# Check ${packId} (${typeLabel})`,
      '',
      `- items: ${items.length}`,
      `- codes:`,
      ...invItems.map((i) => `- ${i.code}`),
      '',
      'Status: format generated; chemical content requires human review (not human-approved).',
      '',
    ].join('\n'),
    'utf8',
  )
  return { packId, count: items.length, file }
}

const byType = {
  substance: pending.filter((i) => i.type === 'substance'),
  reaction: pending.filter((i) => i.type === 'reaction'),
  experiment: pending.filter((i) => i.type === 'experiment'),
  knowledge: pending.filter((i) => i.type === 'knowledge'),
  concept: pending.filter((i) => i.type === 'concept'),
}

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

const builders = {
  substance: buildSubstance,
  reaction: buildReaction,
  experiment: buildExperiment,
  knowledge: buildKnowledge,
  concept: buildConcept,
}

const packs = []
packs.push(writePack('B4-A', 'substance', byType.substance, builders))
packs.push(writePack('B4-B', 'reaction', byType.reaction, builders))
packs.push(writePack('B4-C', 'experiment', byType.experiment, builders))
packs.push(writePack('B4-D', 'knowledge', byType.knowledge, builders))

const summary = {
  planned: batch4.items.length,
  seeded: 0,
  toImport: pending.length,
  packs: Object.fromEntries(packs.map((p) => [p.packId, p.count])),
  generatedAt: new Date().toISOString(),
}
fs.writeFileSync(
  path.join(outDir, 'generate_summary.json'),
  JSON.stringify(summary, null, 2) + '\n',
  'utf8',
)
console.log(JSON.stringify(summary, null, 2))
