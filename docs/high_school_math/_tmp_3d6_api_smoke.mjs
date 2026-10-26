import crypto from 'crypto'

const secret =
  process.env.JWT_SECRET || 'study_system_dev_jwt_secret_change_in_prod'

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const h = b64url(JSON.stringify(header))
  const p = b64url(JSON.stringify(payload))
  const data = `${h}.${p}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64')
  const s = sig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${data}.${s}`
}

const token = signJwt({
  sub: '2',
  role: 'ADMIN',
  email: 'admin@189.cn',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900,
})
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

async function get(url) {
  const r = await fetch(url, { headers })
  const t = await r.text()
  let body
  try {
    body = JSON.parse(t)
  } catch {
    body = t
  }
  return { status: r.status, body }
}

function unwrap(body) {
  return body?.data ?? body
}

const sess = await get('http://127.0.0.1:3000/hs-math/train/sessions/107')
const hist = await get(
  'http://127.0.0.1:3000/hs-math/train/sessions?page=1&pageSize=50',
)
let analytics = { status: null, path: null, body: null }
for (const path of [
  'http://127.0.0.1:3000/hs-math/analytics',
  'http://127.0.0.1:3000/hs-math/train/analytics',
  'http://127.0.0.1:3000/hs-math/home',
]) {
  const r = await get(path)
  if (r.status !== 404) {
    analytics = { path, status: r.status, body: r.body }
    break
  }
}

const data = unwrap(sess.body)
const items = data?.items || []
const item = items.find((i) => String(i.id) === '330') || items[0]
const histItems = unwrap(hist.body)?.items || []
const blob = JSON.stringify(item || {})
const dump = {
  sessStatus: sess.status,
  histStatus: hist.status,
  analyticsStatus: analytics.status,
  analyticsPath: analytics.path,
  sessionStatus: data?.status,
  correct: data?.correctCount,
  wrong: data?.wrongCount,
  pending: data?.pendingCount,
  accuracy: data?.accuracy ?? null,
  itemId: item?.id,
  gradeResult: item?.gradeResult,
  aiModel: item?.aiModel,
  totalScore: item?.aiGrade?.totalScore,
  maxScore: item?.aiGrade?.maxScore,
  rubric: (item?.aiGrade?.rubricScores || []).map(
    (r) => `${r.rubricKey}:${r.score}/${r.maxScore}`,
  ),
  hasStorageKey:
    blob.includes('storage_key') || blob.includes('storageKey'),
  imageMeta: (item?.images || []).map((im) => ({
    id: im.id,
    status: im.status,
    mime: im.mimeType || im.mime,
    keys: Object.keys(im),
  })),
  histCount: histItems.length,
  histTotal: unwrap(hist.body)?.total ?? null,
  histSampleKeys: histItems[0] ? Object.keys(histItems[0]) : [],
  histSample0: histItems[0]
    ? {
        id: histItems[0].id,
        sessionId: histItems[0].sessionId,
        status: histItems[0].status,
        pendingCount: histItems[0].pendingCount,
        correctCount: histItems[0].correctCount,
        wrongCount: histItems[0].wrongCount,
        accuracy: histItems[0].accuracy,
      }
    : null,
  histIdsHead: histItems.slice(0, 15).map(
    (s) => s.id ?? s.sessionId ?? JSON.stringify(s).slice(0, 80),
  ),
  histHas107: histItems.some(
    (s) => String(s.id) === '107' || String(s.sessionId) === '107',
  ),
  hist107: (() => {
    const h = histItems.find(
      (s) => String(s.id) === '107' || String(s.sessionId) === '107',
    )
    return h
      ? {
          id: h.id ?? h.sessionId,
          pendingCount: h.pendingCount,
          correctCount: h.correctCount,
          wrongCount: h.wrongCount,
          accuracy: h.accuracy,
        }
      : null
  })(),
  analyticsKeys:
    analytics.body && typeof analytics.body === 'object'
      ? Object.keys(unwrap(analytics.body) || {})
      : [],
}
console.log(JSON.stringify(dump, null, 2))
