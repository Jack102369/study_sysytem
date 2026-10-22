'use strict'
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, 'models')

// normalize common typos
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')) continue
  const p = path.join(dir, f)
  let s = fs.readFileSync(p, 'utf8')
  s = s.replace(/"(breakthrough|coreMethod)":\s*"([^"]*)"\],/g, '"$1": "$2",')
  fs.writeFileSync(p, s)
}

const files = [
  'calculation.json',
  'redox.json',
  'ion.json',
  'experiment.json',
  'inference.json',
  'comprehensive.json',
  'planning_other.json',
]

const models = []
for (const f of files) {
  const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  if (!Array.isArray(arr)) throw new Error(f + ' not array')
  for (const m of arr) {
    if (!m.id || !/^ADV\.[a-z_]+\.\d{3}$/.test(m.id)) {
      throw new Error('bad id ' + m.id)
    }
    if (models.some((x) => x.id === m.id)) throw new Error('dup ' + m.id)
    models.push(m)
  }
}

const statusCount = { READY: 0, NEEDS_ENGINE: 0, HOLD: 0 }
const sampleCount = { raise: 0, challenge: 0 }
const bySpecialty = {}
const priority = []

for (const m of models) {
  statusCount[m.productionStatus] = (statusCount[m.productionStatus] || 0) + 1
  bySpecialty[m.specialtyCode] = (bySpecialty[m.specialtyCode] || 0) + 1
  if (m.priorityBatch1) priority.push(m.id)
  for (const s of m.samples || []) {
    if (s.difficulty === 'raise') sampleCount.raise++
    if (s.difficulty === 'challenge') sampleCount.challenge++
  }
}

const catalog = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  curriculumScope: '高中化学必修（高一范围）；选择性必修标 HOLD/风险',
  statusEnum: ['READY', 'NEEDS_ENGINE', 'HOLD'],
  summary: {
    modelCount: models.length,
    statusCount,
    sampleCount,
    bySpecialty,
    priorityBatch1ModelIds: priority,
    priorityBatch1Ready: priority.filter((id) => {
      const m = models.find((x) => x.id === id)
      return m && m.productionStatus === 'READY'
    }),
    needsEngineIds: models.filter((m) => m.productionStatus === 'NEEDS_ENGINE').map((m) => m.id),
    holdIds: models.filter((m) => m.productionStatus === 'HOLD').map((m) => m.id),
  },
  batch500Plan: {
    raiseTarget: 350,
    challengeTarget: 150,
    quotas: {
      calculation: 100,
      redox: 90,
      ion: 70,
      experiment: 70,
      inference: 80,
      comprehensive: 90,
    },
    productionOrder: [
      'ADV.calculation.001-006,008 (READY first)',
      'ADV.redox.001-004,007',
      'ADV.ion.001-003,005-006',
      'ADV.experiment.001-005',
      'ADV.inference.001-004,006',
      'ADV.comprehensive.001-005',
      'Then NEEDS_ENGINE after numeric/equation grading ready',
      'HOLD only after science review gate',
    ],
  },
  models,
}

fs.writeFileSync(
  path.join(__dirname, 'models_catalog.json'),
  JSON.stringify(catalog, null, 2),
)
fs.writeFileSync(
  path.join(__dirname, 'models_index.json'),
  JSON.stringify(
    {
      schemaVersion: catalog.schemaVersion,
      generatedAt: catalog.generatedAt,
      summary: catalog.summary,
      batch500Plan: catalog.batch500Plan,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        specialtyCode: m.specialtyCode,
        difficulties: m.difficulties,
        productionStatus: m.productionStatus,
        priorityBatch1: m.priorityBatch1,
        sampleDifficulties: (m.samples || []).map((s) => s.difficulty),
      })),
    },
    null,
    2,
  ),
)

console.log(JSON.stringify(catalog.summary, null, 2))
console.log('wrote models_catalog.json / models_index.json')
