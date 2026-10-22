/**
 * Run all Batch6 chem:import packs.
 * From repo root: node docs/chemistry_batch6/import_all.js
 */
'use strict'
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '../..')
const apiDir = path.join(root, 'apps/api')
const packs = ['B6-A', 'B6-B', 'B6-C', 'B6-D', 'B6-E', 'B6-F']

const all = {
  startedAt: new Date().toISOString(),
  packs: {},
  totals: { success: 0, fail: 0, linkOk: 0, linkFail: 0 },
  codeToEntity: {},
  failures: [],
}

for (const pack of packs) {
  const rel = `../../docs/chemistry_batch6/import_${pack}.json`
  console.log('--- importing', pack, '---')
  const r = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['chem:import', '--', rel],
    { cwd: apiDir, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, shell: true },
  )
  const out = (r.stdout || '') + (r.stderr || '')
  fs.writeFileSync(path.join(__dirname, `import_log_${pack}.txt`), out, 'utf8')

  const resultPath = path.join(__dirname, `import_${pack}.import-result.json`)
  let result = null
  if (fs.existsSync(resultPath)) {
    result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
  }
  const meta = JSON.parse(
    fs.readFileSync(path.join(__dirname, `import_${pack}.json`), 'utf8'),
  ).meta

  all.packs[pack] = {
    exitCode: r.status,
    successCount: result?.successCount ?? null,
    failCount: result?.failCount ?? null,
    linkOk: result?.linkOk ?? null,
    linkFail: result?.linkFail ?? null,
  }
  if (result) {
    all.totals.success += result.successCount || 0
    all.totals.fail += result.failCount || 0
    all.totals.linkOk += result.linkOk || 0
    all.totals.linkFail += result.linkFail || 0
    for (const row of result.results || []) {
      const code = meta.inventoryCodes[row.index]
      if (row.ok && row.id && code) {
        all.codeToEntity[code] = { type: row.type, id: String(row.id) }
      } else if (!row.ok && code) {
        all.failures.push({ code, type: row.type, errors: row.errors })
      }
    }
  } else {
    all.failures.push({
      pack,
      exitCode: r.status,
      errors: ['missing import-result.json'],
      logTail: out.slice(-800),
    })
  }
}

all.finishedAt = new Date().toISOString()
fs.writeFileSync(
  path.join(__dirname, 'import_all_results.json'),
  JSON.stringify(all, null, 2) + '\n',
  'utf8',
)
console.log(JSON.stringify({ totals: all.totals, failures: all.failures }, null, 2))
process.exit(all.totals.fail > 0 || all.failures.length > 0 ? 1 : 0)
