import fs from 'fs'
import { createRequire } from 'module'
import {
  buildParseSystemPrompt,
  buildParseUserPrompt,
  parseModelAnalysisJson,
} from '../apps/api/dist/ai-ocr/util/ai-ocr-helpers.js'

const require = createRequire(
  new URL('../apps/api/package.json', import.meta.url),
)
const mysql = require('mysql2/promise')

function loadEnv(file) {
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    const k = line.slice(0, i).trim()
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    env[k] = v
  }
  return env
}

function resolveChatUrl(raw) {
  const u = String(raw || '').trim()
  if (!u) return ''
  if (/\/chat\/completions\/?$/i.test(u)) return u.replace(/\/$/, '')
  return u.replace(/\/$/, '') + '/chat/completions'
}

const env = loadEnv('apps/api/.env')
fs.mkdirSync('tmp', { recursive: true })

const conn = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'study_user',
  password: env.DB_PASSWORD,
  database: 'study_system',
})
const [rows] = await conn.query(
  'SELECT id, input_text_snapshot FROM ai_ocr_analyses WHERE id=20',
)
await conn.end()
const snap = String(rows[0]?.input_text_snapshot || '')
const system = buildParseSystemPrompt('数学')
const user = buildParseUserPrompt(snap)

async function callDeepseek() {
  const key = env.DEEPSEEK_API_KEY
  const model = env.DEEPSEEK_MODEL || 'deepseek-chat'
  const base = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(
    /\/$/,
    '',
  )
  const res = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })
  const text = await res.text()
  fs.writeFileSync('tmp/deepseek-raw-http.json', text)
  const j = JSON.parse(text)
  const content = j.choices?.[0]?.message?.content || ''
  fs.writeFileSync('tmp/deepseek-content.txt', content)
  const parsed = parseModelAnalysisJson(content)
  console.log(
    'DEEPSEEK',
    res.status,
    'finish',
    j.choices?.[0]?.finish_reason,
    'len',
    content.length,
    'parse',
    parsed.ok ? 'ok' : parsed.reason,
  )
}

async function callQwen() {
  const key = env.OCR_VISION_API_KEY || env.HS_MATH_VISION_API_KEY
  const url = resolveChatUrl(
    env.OCR_VISION_API_URL || env.HS_MATH_VISION_API_URL || '',
  )
  const model =
    env.OCR_VISION_MODEL || env.HS_MATH_VISION_MODEL || 'qwen3.8-27b'
  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.1,
    max_tokens: 2048,
    stream: false,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  fs.writeFileSync('tmp/qwen-raw-http.json', text)
  let j
  try {
    j = JSON.parse(text)
  } catch {
    console.log('QWEN nonjson', res.status, 'bodyLen', text.length)
    // retry 1024
    const res2 = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({ ...body, max_tokens: 1024 }),
    })
    const text2 = await res2.text()
    fs.writeFileSync('tmp/qwen-raw-http-retry.json', text2)
    try {
      j = JSON.parse(text2)
      console.log('QWEN retry status', res2.status)
    } catch {
      console.log('QWEN retry nonjson', res2.status, 'bodyLen', text2.length)
      return
    }
  }
  const content = j.choices?.[0]?.message?.content || ''
  fs.writeFileSync('tmp/qwen-content.txt', content)
  const parsed = parseModelAnalysisJson(content)
  console.log(
    'QWEN',
    'finish',
    j.choices?.[0]?.finish_reason,
    'len',
    content.length,
    'parse',
    parsed.ok ? 'ok' : parsed.reason,
    'err',
    j.error?.message || '',
  )
}

await callDeepseek()
await callQwen()
