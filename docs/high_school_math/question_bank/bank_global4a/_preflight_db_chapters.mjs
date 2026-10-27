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
  host: env.DB_HOST,
  port: +env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
})
const [rows] = await c.query(
  `SELECT s.code AS specialty, s.chapter_no AS ch, s.book_code AS book, COUNT(1) AS n
   FROM hs_math_train_items i
   JOIN hs_math_specialties s ON s.id=i.specialty_id
   WHERE i.pool='formal' AND i.status='approved' AND i.is_active=1
   GROUP BY s.code, s.chapter_no, s.book_code
   ORDER BY s.book_code, s.chapter_no`,
)
console.log(JSON.stringify(rows, null, 2))
await c.end()
