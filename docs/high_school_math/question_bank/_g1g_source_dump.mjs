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
  `SELECT id, code, source_type, source_year, source_exam_name, source_question_no,
          source_reference, LEFT(source_adaptation_note, 120) AS note,
          source_verification_status, source_license_status
   FROM hs_math_train_items WHERE id IN (244,231,215,242) ORDER BY FIELD(id,244,231,215,242)`,
)
console.log(JSON.stringify(rows, null, 2))
await conn.end()
