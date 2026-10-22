/**
 * HTTP smoke: login as admin → test pool session → answer → submit → idempotent resubmit
 * Requires API running on localhost (default 3000). Skips if unreachable.
 */
'use strict'
const fs = require('fs')
const path = require('path')
const http = require('http')
const ROOT = path.resolve(__dirname, '../..')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function req(method, urlPath, body, token) {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const port = Number(env.PORT || 3000)
  const payload = body ? JSON.stringify(body) : null
  return new Promise((resolve, reject) => {
    const r = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
        timeout: 5000,
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          let json = null
          try {
            json = JSON.parse(data)
          } catch {
            json = { raw: data }
          }
          resolve({ status: res.statusCode, json })
        })
      },
    )
    r.on('error', reject)
    r.on('timeout', () => {
      r.destroy()
      reject(new Error('timeout'))
    })
    if (payload) r.write(payload)
    r.end()
  })
}

async function main() {
  const checks = []
  const pass = (id, d) => checks.push({ id, ok: true, detail: d })
  const fail = (id, d) => checks.push({ id, ok: false, detail: d })

  let health
  try {
    health = await req('GET', '/health')
  } catch (e) {
    const out = {
      at: new Date().toISOString(),
      skipped: true,
      reason: 'API not reachable: ' + e.message,
      checks,
    }
    fs.writeFileSync(path.join(__dirname, 'api_flow_smoke_result.json'), JSON.stringify(out, null, 2))
    console.log(JSON.stringify(out, null, 2))
    return
  }

  // login — try common admin from env or default
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const email = env.SMOKE_ADMIN_EMAIL || env.ADMIN_EMAIL || 'admin@local.test'
  const password = env.SMOKE_ADMIN_PASSWORD || env.ADMIN_PASSWORD || 'Admin123!'
  const login = await req('POST', '/auth/login', { email, password })
  if (!login.json?.success || !login.json?.data?.accessToken) {
    // try alternate
    const login2 = await req('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    })
    if (!login2.json?.success) {
      fail('login', { status: login.status, msg: login.json?.message || login.json })
      const out = { at: new Date().toISOString(), skipped: false, allOk: false, checks }
      fs.writeFileSync(path.join(__dirname, 'api_flow_smoke_result.json'), JSON.stringify(out, null, 2))
      console.log(JSON.stringify(out, null, 2))
      return
    }
    login.json = login2.json
  }
  const token = login.json.data.accessToken || login.json.data.token
  pass('login', true)

  const access = await req('GET', '/chemistry/train/test-access', null, token)
  if (access.json?.data?.canUseTestPool) pass('test_access_admin', true)
  else fail('test_access_admin', access.json)

  const availFormal = await req(
    'GET',
    '/chemistry/train/availability?specialtyCode=equation&categoryCode=true_false&difficulty=1&poolMode=formal',
    null,
    token,
  )
  if (availFormal.json?.data?.availableCount === 0) pass('formal_empty', availFormal.json.data)
  else pass('formal_count', availFormal.json?.data?.availableCount)

  const availTest = await req(
    'GET',
    '/chemistry/train/availability?specialtyCode=equation&categoryCode=true_false&difficulty=1&poolMode=test',
    null,
    token,
  )
  if ((availTest.json?.data?.availableCount || 0) > 0) pass('test_available', availTest.json.data.availableCount)
  else fail('test_available', availTest.json)

  const created = await req(
    'POST',
    '/chemistry/train/sessions',
    {
      specialtyCode: 'equation',
      categoryCode: 'true_false',
      difficulty: 1,
      count: 5,
      mode: 'sequential',
      poolMode: 'test',
    },
    token,
  )
  const session = created.json?.data
  if (!session?.id) {
    fail('create_session', created.json)
  } else {
    pass('create_session', session.id)
    const leaked = (session.items || []).some(
      (i) => i.standardAnswer != null || i.answerAliases != null || i.analysis != null,
    )
    if (!leaked) pass('no_answer_leak', true)
    else fail('no_answer_leak', session.items[0])

    // answer first item
    const first = session.items[0]
    let ans = '正确'
    if (first.qtype === 'single') ans = 'B'
    if (first.qtype === 'blank') ans = 'NaCl'
    await req(
      'PATCH',
      `/chemistry/train/sessions/${session.id}/answers`,
      { sortOrder: first.sortOrder, answer: ans },
      token,
    )
    const submitted = await req('POST', `/chemistry/train/sessions/${session.id}/submit`, {}, token)
    if (submitted.json?.data?.status === 'completed') pass('submit', true)
    else fail('submit', submitted.json)

    const again = await req('POST', `/chemistry/train/sessions/${session.id}/submit`, {}, token)
    if (again.json?.data?.status === 'completed') pass('submit_idempotent', true)
    else fail('submit_idempotent', again.json)

    if (submitted.json?.data?.countsFormalStats === false) pass('test_not_formal_stats', true)
    else fail('test_not_formal_stats', submitted.json?.data?.countsFormalStats)

    const detail = await req('GET', `/chemistry/train/sessions/${session.id}`, null, token)
    if (detail.json?.data?.items?.[0]?.standardAnswer != null) pass('answers_after_submit', true)
    else fail('answers_after_submit', false)
  }

  // specialties list still works
  const specs = await req('GET', '/chemistry/specialties', null, token)
  if ((specs.json?.data || []).length === 12) pass('specialties_api', 12)
  else fail('specialties_api', specs.json)

  const allOk = checks.every((c) => c.ok)
  const out = { at: new Date().toISOString(), skipped: false, allOk, checks }
  fs.writeFileSync(path.join(__dirname, 'api_flow_smoke_result.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
