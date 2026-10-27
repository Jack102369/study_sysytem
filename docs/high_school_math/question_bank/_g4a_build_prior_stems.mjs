/**
 * Build prior stem norms for G4A semantic dedup (313 formal + G1B/G2A/G3A files).
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const require = createRequire(import.meta.url)

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
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

const env = loadEnv()
const mysql = require(path.join(root, 'apps/api/node_modules/mysql2/promise.js'))
const c = await mysql.createConnection({
  host: env.DB_HOST || '127.0.0.1',
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME || 'study_system',
})
const [rows] = await c.query(
  "SELECT code, stem FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
)
await c.end()

const stemsNorm = rows.map((r) => norm(r.stem))
const formalMeta = rows.map((r) => ({
  code: r.code,
  stemNorm: norm(r.stem),
  stemPrefix: String(r.stem).slice(0, 80),
}))

for (const file of [
  'candidates-g1b-100.mjs',
  'candidates-g2a-100.mjs',
  'candidates-g3a-100.mjs',
]) {
  const p = path.join(__dirname, file)
  if (!fs.existsSync(p)) continue
  const mod = await import(pathToFileURL(p).href + '?t=' + Date.now())
  for (const cand of mod.candidates || []) {
    stemsNorm.push(norm(cand.stem))
  }
}

const unique = [...new Set(stemsNorm)]
const out = {
  exportedAt: new Date().toISOString(),
  drawable: rows.length,
  priorStemCount: unique.length,
  stemsNorm: unique,
  formalMetaCount: formalMeta.length,
  methods: JSON.parse(
    fs.readFileSync(path.join(__dirname, '_g3a_readonly_baseline.json'), 'utf8'),
  ).methods,
  kps: JSON.parse(
    fs.readFileSync(path.join(__dirname, '_g3a_readonly_baseline.json'), 'utf8'),
  ).kps,
}
fs.writeFileSync(
  path.join(__dirname, '_g4a_prior_stems.json'),
  JSON.stringify(out),
)
console.log(
  JSON.stringify(
    {
      drawable: out.drawable,
      priorStemCount: out.priorStemCount,
      sha: crypto.createHash('sha256').update(JSON.stringify(unique)).digest('hex').slice(0, 16),
    },
    null,
    2,
  ),
)
