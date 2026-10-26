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
const [[it]] = await conn.query(
  `SELECT options_json, answer_payload_json FROM hs_math_train_items WHERE id=242`,
)
console.log('typeof options', typeof it.options_json)
console.log(JSON.stringify(it.options_json, null, 2).slice(0, 2000))
console.log('typeof answer', typeof it.answer_payload_json)
console.log(JSON.stringify(it.answer_payload_json, null, 2).slice(0, 500))
await conn.end()
