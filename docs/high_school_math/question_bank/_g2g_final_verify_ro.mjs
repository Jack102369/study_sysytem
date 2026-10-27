import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
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

const env = loadEnv()
const c = await mysql.createConnection({
  host: env.DB_HOST || '127.0.0.1',
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME || 'study_system',
})
const one = async (sql, p = []) => (await c.query(sql, p))[0][0]
const many = async (sql, p = []) => (await c.query(sql, p))[0]

const out = {
  db: env.DB_NAME,
  drawable: Number(
    (
      await one(
        "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1",
      )
    ).n,
  ),
  g2a: Number((await one("SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%'")).n),
  g2aApproved: Number(
    (
      await one(
        "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%' AND status='approved'",
      )
    ).n,
  ),
  g2aDraft: Number(
    (
      await one(
        "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code LIKE 'CAND-G2A-%' AND status='draft'",
      )
    ).n,
  ),
  oldNonG2A: Number(
    (
      await one(
        "SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-G2A-%'",
      )
    ).n,
  ),
  sessions: Number((await one('SELECT COUNT(1) AS n FROM hs_math_train_sessions')).n),
  sessionItems: Number((await one('SELECT COUNT(1) AS n FROM hs_math_train_session_items')).n),
  diag: await many(
    `SELECT i.code, o.content_sha256, o.mime_type
     FROM hs_math_train_items i
     JOIN hs_math_train_item_diagrams d ON d.item_id=i.id
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE i.code LIKE 'CAND-G2A-%' ORDER BY i.code`,
  ),
  candSha: crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(__dirname, 'candidates-g2a-100.mjs')))
    .digest('hex'),
  verifiedAt: new Date().toISOString(),
}
fs.writeFileSync(path.join(docs, '_g2g_final_verify_ro.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
await c.end()
