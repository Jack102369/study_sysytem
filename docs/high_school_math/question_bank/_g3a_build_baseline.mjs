/**
 * GLOBAL-3A: readonly baseline for KP/method + stem dedup. No DB writes.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'

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
function norm(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

const env = loadEnv()
const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g2a_readonly_baseline.json'), 'utf8'),
)
const { candidates: g1b } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g1b-100.mjs')).href
)
const { candidates: g2a } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g2a-100.mjs')).href
)

const conn = await mysql.createConnection({
  host: env.DB_HOST || '127.0.0.1',
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME || 'study_system',
})
const [formal] = await conn.query(
  `SELECT code, stem FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [[drawable]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)
await conn.end()

const stemSet = new Set()
const stemSrc = []
for (const r of formal) {
  const n = norm(r.stem)
  if (!stemSet.has(n)) {
    stemSet.add(n)
    stemSrc.push({ code: r.code, source: 'formal' })
  }
}
for (const c of g1b) {
  const n = norm(c.stem)
  if (!stemSet.has(n)) {
    stemSet.add(n)
    stemSrc.push({ code: c.id, source: 'g1b-file' })
  }
}
for (const c of g2a) {
  const n = norm(c.stem)
  if (!stemSet.has(n)) {
    stemSet.add(n)
    stemSrc.push({ code: c.id, source: 'g2a-file' })
  }
}

const out = {
  exportedAt: new Date().toISOString(),
  drawable: Number(drawable.n),
  methods: (base.methods || []).map((m) => m.code),
  kps: (base.kps || []).map((k) => ({
    code: k.code,
    name: k.name,
    specialtyCode: k.specialtyCode || k.specialty_code || null,
  })),
  stemsNorm: [...stemSet],
  stemMetaCount: stemSrc.length,
  formalCount: formal.length,
}
fs.writeFileSync(path.join(__dirname, '_g3a_readonly_baseline.json'), JSON.stringify(out))
console.log(
  JSON.stringify(
    {
      drawable: out.drawable,
      formalCount: out.formalCount,
      stemsNorm: out.stemsNorm.length,
      kps: out.kps.length,
      methods: out.methods.length,
    },
    null,
    2,
  ),
)
