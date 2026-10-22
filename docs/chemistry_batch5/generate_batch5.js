/**
 * Generate Batch5 import packs from inventory + batch5_content.js
 * Run: node docs/chemistry_batch5/generate_batch5.js
 */
'use strict'
const fs = require('fs')
const path = require('path')
const {
  EXPERIMENTS,
  FORMULAS,
  KNOWLEDGE,
  QUESTIONS,
  CONCEPTS,
} = require('./batch5_content')

const root = path.join(__dirname, '..')
const outDir = __dirname
const inv = JSON.parse(
  fs.readFileSync(path.join(root, 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch5 = inv.batches.find((b) => b.id === 'batch5')
if (!batch5) throw new Error('batch5 not found')
if (batch5.items.length !== 42) {
  throw new Error('batch5 must have 42 items, got ' + batch5.items.length)
}

const STATUS = 'pending_review'
const pending = batch5.items.filter(
  (i) => !['seeded', 'seeded_audited'].includes(i.status),
)

function reviewNote(code, extra) {
  const base = `[inv:${code}]`
  return extra ? `${base} ${extra}` : base
}

function buildExperiment(code, item) {
  const d = EXPERIMENTS[code]
  if (!d) throw new Error('missing experiment: ' + code)
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

function buildFormula(code, item) {
  const d = FORMULAS[code]
  if (!d) throw new Error('missing formula: ' + code)
  const { reviewExtra, ...rest } = d
  return {
    type: 'formula',
    data: {
      ...rest,
      status: STATUS,
      reviewNote: reviewNote(code, reviewExtra || item.note || ''),
    },
  }
}

function buildKnowledge(code, item) {
  const d = KNOWLEDGE[code]
  if (!d) throw new Error('missing knowledge: ' + code)
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

function buildQuestion(code, item) {
  const d = QUESTIONS[code]
  if (!d) throw new Error('missing question: ' + code)
  const { reviewExtra, ...rest } = d
  return {
    type: 'question',
    data: {
      ...rest,
      status: STATUS,
      reviewNote: reviewNote(
        code,
        reviewExtra || item.note || '骨架题;非完整卷库',
      ),
    },
  }
}

function buildConcept(code, item) {
  const d = CONCEPTS[code]
  if (!d) throw new Error('missing concept: ' + code)
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
    meta: { batch: 'batch5', pack: packId, ...meta },
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
      'Status: format generated; paper-training only for experiments; not human-approved.',
      '',
    ].join('\n'),
    'utf8',
  )
  return { packId, count: items.length, file }
}

const byType = {
  experiment: pending.filter((i) => i.type === 'experiment'),
  formula: pending.filter((i) => i.type === 'formula'),
  knowledge: pending.filter((i) => i.type === 'knowledge'),
  question: pending.filter((i) => i.type === 'question'),
  concept: pending.filter((i) => i.type === 'concept'),
}

for (const it of byType.experiment) {
  if (!EXPERIMENTS[it.code]) throw new Error('EXPERIMENTS missing ' + it.code)
}
for (const it of byType.formula) {
  if (!FORMULAS[it.code]) throw new Error('FORMULAS missing ' + it.code)
}
for (const it of byType.knowledge) {
  if (!KNOWLEDGE[it.code]) throw new Error('KNOWLEDGE missing ' + it.code)
}
for (const it of byType.question) {
  if (!QUESTIONS[it.code]) throw new Error('QUESTIONS missing ' + it.code)
}
for (const it of byType.concept) {
  if (!CONCEPTS[it.code]) throw new Error('CONCEPTS missing ' + it.code)
}

const builders = {
  experiment: buildExperiment,
  formula: buildFormula,
  knowledge: buildKnowledge,
  question: buildQuestion,
  concept: buildConcept,
}

const packs = []
packs.push(writePack('B5-A', 'experiment', byType.experiment, builders))
packs.push(writePack('B5-B', 'formula', byType.formula, builders))
packs.push(writePack('B5-C', 'knowledge', byType.knowledge, builders))
packs.push(writePack('B5-D', 'question', byType.question, builders))
packs.push(writePack('B5-E', 'concept', byType.concept, builders))

const summary = {
  planned: batch5.items.length,
  seeded: 0,
  toImport: pending.length,
  packs: Object.fromEntries(packs.map((p) => [p.packId, p.count])),
  productNote:
    'experiment specialty = paper-based Q training only; no hands-on / lab booking / virtual lab',
  generatedAt: new Date().toISOString(),
}
fs.writeFileSync(
  path.join(outDir, 'generate_summary.json'),
  JSON.stringify(summary, null, 2) + '\n',
  'utf8',
)
console.log(JSON.stringify(summary, null, 2))
