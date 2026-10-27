/**
 * Shared helpers for GLOBAL-4E import/review/approve.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const root = path.resolve(__dirname, '../../..')
export const docs = path.resolve(__dirname, '..')
export const qb = __dirname
export const diagDir = path.join(docs, 'diagrams/required_g4a')
export const cpDir = path.join(qb, 'bank_global4a/_g4e_checkpoints')
export const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

export function loadEnv() {
  const env = { ...process.env }
  const p = path.join(root, 'apps/api/.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
}

export function signJwt(sub, role, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ sub, role, iat: now, exp: now + 8 * 3600 }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

export function dataOf(json) {
  if (json?.success === true && json.data !== undefined) return json.data
  return json
}

export async function api(method, urlPath, token, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 800) }
  }
  return { status: res.status, json }
}

export async function apiUpload(itemId, token, filePath, mime, altText) {
  const buf = fs.readFileSync(filePath)
  const fd = new FormData()
  fd.append('file', new Blob([buf], { type: mime }), path.basename(filePath))
  if (altText) fd.append('altText', altText)
  const res = await fetch(`${BASE}/hs-math/admin/train-items/${itemId}/diagrams`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 800) }
  }
  return { status: res.status, json, localSha: shaFile(filePath) }
}

export function shaFile(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

export function checkpointPath(group) {
  return path.join(cpDir, `group0${group}.json`)
}

export function loadCheckpoint(group) {
  const p = checkpointPath(group)
  if (!fs.existsSync(p)) {
    return {
      group,
      items: {},
      importDone: false,
      diagramsDone: false,
      reviewApproveDone: false,
      verified: false,
    }
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

export function saveCheckpoint(group, cp) {
  fs.mkdirSync(cpDir, { recursive: true })
  fs.writeFileSync(checkpointPath(group), JSON.stringify(cp, null, 2))
}

export function dbConfig(env) {
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'study_system',
  }
}
