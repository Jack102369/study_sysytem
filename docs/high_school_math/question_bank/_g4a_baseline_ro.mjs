/**
 * GLOBAL-4A: readonly chapter/difficulty/qtype baseline for drawable 313.
 */
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const require = createRequire(import.meta.url)
const mysql = require(path.join(root, 'apps/api/node_modules/mysql2/promise.js'))

function loadEnv() {
  const env = { ...process.env }
  const p = path.join(root, 'apps/api/.env')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const FINAL_CH = {
  'rja-ch1': 180,
  'rja-ch2': 300,
  'rja-ch3': 360,
  'rja-ch4': 420,
  'rja-ch5': 480,
  'rjb-ch1': 420,
  'rjb-ch2': 120,
  'rjb-ch3': 420,
  'rjb-ch4': 180,
  'rjb-ch5': 240,
}
const FINAL_D = { 1: 1092, 2: 1248, 3: 780 }
const FINAL_QT = {
  single: Math.round(3120 * 0.3),
  multi: Math.round(3120 * 0.15),
  judge: Math.round(3120 * 0.1),
  numeric: Math.round(3120 * 0.2),
  application: Math.round(3120 * 0.25),
}

const env = loadEnv()
const c = await mysql.createConnection({
  host: env.DB_HOST || '127.0.0.1',
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME || 'study_system',
})

const one = async (sql, p = []) => (await c.query(sql, p))[0][0]

const drawable = Number(
  (
    await one(
      "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
    )
  ).n,
)
const g4a = Number(
  (await one("SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G4A-%'")).n,
)

const [byCh] = await c.query(`
SELECT s.code AS specialty, COUNT(1) AS n
FROM hs_math_train_items i
JOIN hs_math_specialties s ON s.id=i.specialty_id
WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1
GROUP BY s.code ORDER BY s.code`)

const [byD] = await c.query(`
SELECT difficulty, COUNT(1) AS n FROM hs_math_train_items
WHERE pool='formal' AND status='approved' AND is_active=1
GROUP BY difficulty ORDER BY difficulty`)

const [byQt] = await c.query(`
SELECT qtype, COUNT(1) AS n FROM hs_math_train_items
WHERE pool='formal' AND status='approved' AND is_active=1
GROUP BY qtype`)

const chNow = Object.fromEntries(byCh.map((r) => [r.specialty, Number(r.n)]))
const dNow = Object.fromEntries(byD.map((r) => [Number(r.difficulty), Number(r.n)]))
const qtNow = Object.fromEntries(byQt.map((r) => [r.qtype, Number(r.n)]))

const chGap = {}
const chAllocHint = {}
let gapSum = 0
for (const [code, target] of Object.entries(FINAL_CH)) {
  const now = chNow[code] || 0
  const gap = Math.max(0, target - now)
  chGap[code] = { now, target, gap }
  gapSum += gap
}
// proportional allocation of 500 by remaining gap, then integer round with residual
const raw = Object.entries(chGap).map(([code, g]) => ({
  code,
  raw: gapSum ? (500 * g.gap) / gapSum : 0,
}))
let alloc = raw.map((x) => ({ code: x.code, n: Math.floor(x.raw) }))
let left = 500 - alloc.reduce((s, x) => s + x.n, 0)
const frac = raw
  .map((x, i) => ({ i, f: x.raw - Math.floor(x.raw) }))
  .sort((a, b) => b.f - a.f)
for (let k = 0; k < left; k++) alloc[frac[k % frac.length].i].n++
for (const a of alloc) chAllocHint[a.code] = a.n

const dGap = {
  1: { now: dNow[1] || 0, target: FINAL_D[1], gap: FINAL_D[1] - (dNow[1] || 0) },
  2: { now: dNow[2] || 0, target: FINAL_D[2], gap: FINAL_D[2] - (dNow[2] || 0) },
  3: { now: dNow[3] || 0, target: FINAL_D[3], gap: FINAL_D[3] - (dNow[3] || 0) },
}
const dGapSum = Math.max(0, dGap[1].gap) + Math.max(0, dGap[2].gap) + Math.max(0, dGap[3].gap)
const dAllocHint = { 1: 175, 2: 200, 3: 125 }
// gap-proportional alternative (for report comparison)
const dAllocByGap = {}
;([1, 2, 3]).forEach((k) => {
  const g = Math.max(0, dGap[k].gap)
  dAllocByGap[k] = dGapSum ? Math.round((500 * g) / dGapSum) : dAllocHint[k]
})
{
  let s = dAllocByGap[1] + dAllocByGap[2] + dAllocByGap[3]
  dAllocByGap[2] += 500 - s
}

const out = {
  verifiedAt: new Date().toISOString(),
  db: env.DB_NAME,
  drawable,
  g4aExisting: g4a,
  byChapter: chGap,
  chapterGapSum: gapSum,
  chapterAllocHint500: chAllocHint,
  byDifficulty: dGap,
  difficultyAllocHint500: dAllocHint,
  difficultyAllocByGap500: dAllocByGap,
  suggestedDifficultyPlan: { 1: 175, 2: 200, 3: 125 },
  byQtype: qtNow,
  suggestedQtypePlan: {
    single: 150,
    multi: 75,
    judge: 50,
    numeric: 100,
    application: 125,
  },
  finalQtypeTargetsApprox: FINAL_QT,
  remainingTo3120: 3120 - drawable,
}
fs.writeFileSync(
  path.join(__dirname, '_g4a_baseline_ro.json'),
  JSON.stringify(out, null, 2),
)
console.log(JSON.stringify(out, null, 2))
await c.end()
