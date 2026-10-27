import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const env = { ...process.env }
for (const line of fs.readFileSync(path.join(root, 'apps/api/.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
}
const c = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
})
const [cols] = await c.query('SHOW COLUMNS FROM hs_math_train_items')
console.log('cols', cols.map((x) => x.Field).join('|'))
const [[db]] = await c.query('SELECT DATABASE() AS db')
const [[n]] = await c.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
console.log({ db: db.db, drawable: Number(n.n) })
const [sample] = await c.query(
  `SELECT id, code, qtype, difficulty, specialty_code, stem FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1 LIMIT 2`,
)
console.log(sample)
await c.end()
