import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const env = { ...process.env }
for (const line of fs.readFileSync(path.join(root, 'apps/api/.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
}
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
})
const [rows] = await conn.query(
  `SELECT i.code, i.id AS item_id, s.id AS specialty_id, s.code AS specialty_code, s.name AS specialty_name,
          c.id AS category_id, c.code AS category_code, c.name AS category_name, i.qtype, i.difficulty
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id=i.specialty_id
   JOIN hs_math_categories c ON c.id=i.category_id
   WHERE i.id IN (244,231,215,242)
   ORDER BY FIELD(i.id,244,231,215,242)`,
)
console.log(JSON.stringify(rows, null, 2))
await conn.end()
