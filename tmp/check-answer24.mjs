import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(
  new URL('../apps/api/package.json', import.meta.url),
)
const mysql = require('mysql2/promise')

function loadEnv(file) {
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1)
    env[line.slice(0, i).trim()] = v
  }
  return env
}

const env = loadEnv('apps/api/.env')
const conn = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'study_user',
  password: env.DB_PASSWORD,
  database: 'study_system',
})
const [rows] = await conn.query(
  'SELECT ai_answer_text, ai_analysis_text FROM ai_ocr_analyses WHERE id=24',
)
await conn.end()
const ans = String(rows[0].ai_answer_text || '')
console.log('len', ans.length)
console.log('json', JSON.stringify(ans))
console.log(
  'backslash runs',
  [...ans.matchAll(/\\+/g)].map((m) => m[0].length + '@' + m.index),
)

// inline copy of wrap from render-math (simplified import via dynamic - use duplicate test)
const { pathToFileURL } = await import('url')
// Can't import TS directly; paste wrap test from previous file after updating
