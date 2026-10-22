/** Check DB for Batch4 reuse candidates. Read-only. */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}
async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const c = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const b4 = inv.batches.find((b) => b.id === 'batch4')
  const names = b4.items.filter((i) => i.type === 'substance').map((i) => i.name)
  const [subs] = await c.query(
    `SELECT id, name, canonical_formula, status FROM chem_substances WHERE name IN (${names.map(() => '?').join(',')})`,
    names,
  )
  const canons = []
  for (const it of b4.items.filter((i) => i.type === 'reaction')) {
    const m = String(it.note || '').match(/canonical=([^=\s|]+(?:=[^=\s|]+)*)/)
    if (m) canons.push(m[1].replace(/\(conc\)/g, '').replace(/\(稀\)/g, ''))
  }
  // also try inventory notes more carefully
  const canonSet = new Set()
  for (const it of b4.items.filter((i) => i.type === 'reaction')) {
    const n = String(it.note || '')
    const idx = n.indexOf('canonical=')
    if (idx >= 0) canonSet.add(n.slice(idx + 10).split(';')[0].trim())
  }
  const canonList = [...canonSet]
  let rx = []
  if (canonList.length) {
    const [r] = await c.query(
      `SELECT id, name, canonical_equation, status FROM chem_reactions WHERE canonical_equation IN (${canonList.map(() => '?').join(',')})`,
      canonList,
    )
    rx = r
  }
  const expNames = b4.items.filter((i) => i.type === 'experiment').map((i) => i.name)
  const [exps] = await c.query(
    `SELECT id, name, status FROM chem_experiments WHERE name IN (${expNames.map(() => '?').join(',')})`,
    expNames,
  )
  const kpNames = b4.items.filter((i) => i.type === 'knowledge').map((i) => i.name)
  const [kps] = await c.query(
    `SELECT id, name, status FROM chem_knowledge_points WHERE name IN (${kpNames.map(() => '?').join(',')}) AND parent_id IS NULL`,
    kpNames,
  )
  const out = {
    substances: subs,
    reactions: rx,
    experiments: exps,
    knowledge: kps,
    reuseCount: subs.length + rx.length + exps.length + kps.length,
  }
  fs.writeFileSync(path.join(__dirname, 'reuse_check.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify({ reuseCount: out.reuseCount, subs: subs.length, rx: rx.length, ex: exps.length, kp: kps.length, foundSubs: subs.map(s=>s.name), foundRx: rx.map(r=>r.canonical_equation) }, null, 2))
  await c.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
