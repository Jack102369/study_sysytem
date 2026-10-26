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

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

const body = {
  specialtyId: '18',
  categoryId: '44',
  difficulty: 2,
  count: 5,
  mode: 'sequential',
  poolMode: 'formal',
  questionType: 'application',
}

const r = await fetch('http://127.0.0.1:3000/hs-math/train/sessions', {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
})
const text = await r.text()
let j
try {
  j = JSON.parse(text)
} catch {
  j = text
}
const data = j?.data ?? j
const items = data?.items || []
const app151 = items.find((i) => String(i.itemId) === '151' || i.itemCode?.includes('APP-0001'))
const first = items[0]
console.log(
  JSON.stringify(
    {
      status: r.status,
      sessionId: data?.id ?? data?.sessionId,
      itemCount: items.length,
      items: items.map((i) => ({
        id: i.id,
        itemId: i.itemId,
        itemCode: i.itemCode,
        qtype: i.qtype,
        sortOrder: i.sortOrder,
      })),
      pick: app151
        ? { sessionItemId: app151.id, itemId: app151.itemId, code: app151.itemCode }
        : first
          ? { sessionItemId: first.id, itemId: first.itemId, code: first.itemCode }
          : null,
      err: r.status >= 400 ? j : null,
    },
    null,
    2,
  ),
)
