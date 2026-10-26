/**
 * APPLICATION-3D-9：对新 session 上传虚构双图 → 作答 → submit → 轮询 graded
 * 复用本地虚构 PNG 字节作新 upload（不引用历史 image 行）
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const secret =
  process.env.JWT_SECRET || 'study_system_dev_jwt_secret_change_in_prod'
const SESSION_ID = '108'
const SESSION_ITEM_ID = '331'
const BASE = 'http://127.0.0.1:3000'

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}
function signJwt(payload) {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const p = b64url(JSON.stringify(payload))
  const data = `${h}.${p}`
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${data}.${sig}`
}

const token = signJwt({
  sub: '2',
  role: 'ADMIN',
  email: 'admin@189.cn',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
})

function unwrap(j) {
  return j?.data ?? j
}

async function uploadPng(filePath, name) {
  const buf = fs.readFileSync(filePath)
  const form = new FormData()
  form.append('file', new Blob([buf], { type: 'image/png' }), name)
  const r = await fetch(
    `${BASE}/hs-math/train/sessions/${SESSION_ID}/items/${SESSION_ITEM_ID}/images`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  )
  const j = await r.json()
  const d = unwrap(j)
  if (r.status >= 400) {
    throw new Error(`upload ${name} ${r.status} ${JSON.stringify(j)}`)
  }
  return { status: r.status, imageId: String(d.imageId ?? d.id), bytes: buf.length }
}

const imgDir = path.join(
  root,
  'apps/api/uploads/hs-math/application-answers/2',
)
const f1 = path.join(imgDir, '3f740d73-694f-4d53-986e-5024d2fb8e7e.bin')
const f2 = path.join(imgDir, '91569385-2624-49ba-ad61-148b1638aa20.bin')

console.log('UPLOAD_START')
const u1 = await uploadPng(f1, '3d9-page1.png')
const u2 = await uploadPng(f2, '3d9-page2.png')
console.log('UPLOADED', JSON.stringify({ u1, u2 }))

const imageIds = [u1.imageId, u2.imageId]
const ansBody = {
  sortOrder: 1,
  userAnswerPayload: {
    kind: 'application',
    imageIds,
  },
}
const ar = await fetch(`${BASE}/hs-math/train/sessions/${SESSION_ID}/answers`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(ansBody),
})
const aj = await ar.json()
console.log('ANSWER', ar.status, ar.status >= 400 ? JSON.stringify(aj) : 'ok')

const sr = await fetch(`${BASE}/hs-math/train/sessions/${SESSION_ID}/submit`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
const sj = await sr.json()
const sd = unwrap(sj)
const item0 = (sd.items || []).find((i) => String(i.id) === SESSION_ITEM_ID)
console.log(
  'SUBMIT',
  sr.status,
  JSON.stringify({
    gradeResult: item0?.gradeResult,
    gradeReason: item0?.gradeReason,
    idempotent: sd.submitMeta?.idempotent,
  }),
)

const t0 = Date.now()
let final = null
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 2000))
  const gr = await fetch(`${BASE}/hs-math/train/sessions/${SESSION_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const gj = await gr.json()
  const gd = unwrap(gj)
  const it = (gd.items || []).find((x) => String(x.id) === SESSION_ITEM_ID)
  const st = it?.gradeResult
  console.log(`POLL #${i + 1} ${st} reason=${it?.gradeReason || ''}`)
  if (
    st === 'graded' ||
    st === 'grading_failed' ||
    (st === 'review_required' && it?.gradeReason === 'uncertain_recognition')
  ) {
    final = {
      gradeResult: st,
      gradeReason: it?.gradeReason,
      aiModel: it?.aiModel,
      totalScore: it?.aiGrade?.totalScore,
      maxScore: it?.aiGrade?.maxScore,
      rubric: (it?.aiGrade?.rubricScores || []).map(
        (r) => `${r.rubricKey}:${r.score}/${r.maxScore}`,
      ),
      correct: gd.correctCount,
      wrong: gd.wrongCount,
      pending: gd.pendingCount,
      accuracy: gd.accuracy ?? gd.accuracyPercent ?? null,
      elapsedMs: Date.now() - t0,
    }
    break
  }
}

console.log('FINAL', JSON.stringify(final, null, 2))
fs.writeFileSync(
  path.join(__dirname, '_tmp_application3d9_live_result.json'),
  JSON.stringify({ sessionId: SESSION_ID, sessionItemId: SESSION_ITEM_ID, imageIds, final }, null, 2),
)
