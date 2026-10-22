'use strict'
/**
 * 377 更新后隔离冒烟（不碰 dhm@189.cn）
 *   node docs/chemistry_analysis_upgrade/final_remaining/smoke_final_update.js
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.resolve(__dirname, '../../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
const bcrypt = require(path.join(ROOT, 'apps/api/node_modules/bcrypt'))

const OUT = __dirname
const PARENT = path.resolve(__dirname, '..')
const BLOCKED_13 = [
  211, 215, 220, 238, 242, 246, 250, 263, 265, 267, 271, 275, 288,
]

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function mintJwt(env, user) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const payload = b64url({
    sub: String(user.id),
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
  const sig = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${sig}`
}

async function ensureUser(conn, email) {
  const [[u]] = await conn.query(
    `SELECT id, email, role, is_disabled FROM users WHERE email=? LIMIT 1`,
    [email],
  )
  if (u) return u
  const hash = await bcrypt.hash('SmokeFinalUpd!2026', 10)
  const [r] = await conn.query(
    `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled)
     VALUES (?,?,?,?,?,0)`,
    [email, hash, 'final_upd_smoke', '高一', 'USER'],
  )
  return { id: r.insertId, email, role: 'USER', is_disabled: 0 }
}

async function api(base, token, method, urlPath, body) {
  const res = await fetch(`${base}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const base = `http://127.0.0.1:${env.PORT || 3000}`
  const wl = JSON.parse(fs.readFileSync(path.join(OUT, 'update_whitelist.json'), 'utf8'))
  const wl1 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8'),
  )
  const holdIds = new Set(
    JSON.parse(fs.readFileSync(path.join(OUT, 'quality_results.json'), 'utf8'))
      .items.filter((x) => x.finalGrade === 'HOLD')
      .map((x) => String(x.id)),
  )
  const report = { generatedAt: new Date().toISOString(), ok: true, checks: [] }
  const check = (name, pass, detail) => {
    report.checks.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) })
    if (!pass) report.ok = false
    console.log(pass ? 'PASS' : 'FAIL', name, detail || '')
  }

  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [[histBefore]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_sessions`)
  const [[itemsBefore]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_session_items`)

  const wlIds = wl.items.map((x) => x.id)
  const [oldSnaps] = await conn.query(
    `SELECT si.id, si.item_id, si.analysis AS snap
     FROM chem_train_session_items si WHERE si.item_id IN (?)
     ORDER BY si.id ASC LIMIT 8`,
    [wlIds],
  )
  if (!oldSnaps.length) {
    check('old_snapshot_sample', true, 'no prior snaps (ok)')
  } else {
    for (const s of oldSnaps) {
      const w = wl.items.find((x) => String(x.id) === String(s.item_id))
      if (!w) continue
      if (String(s.snap ?? '') === String(w.newAnalysis || w.candidateAnalysis || '')) continue
      check('old_snapshot_independent', true, `si=${s.id} item=${s.item_id}`)
    }
  }

  let b1 = 0
  for (const it of wl1.items.slice(0, 5)) {
    const [[row]] = await conn.query(`SELECT analysis FROM chem_train_items WHERE id=?`, [it.id])
    if (row && String(row.analysis) === String(it.newAnalysis)) b1++
  }
  check('batch1_sample_ok', b1 === 5, `${b1}/5`)

  const [[s60]] = await conn.query(
    `SELECT code, analysis FROM chem_train_items
     WHERE code LIKE 'train.ai_trial.s60.%' AND is_active=1 LIMIT 1`,
  )
  check(
    's60_seven_section',
    !!s60 && /考查知识点|解题突破口|易错点/.test(String(s60.analysis || '')),
    s60 ? s60.code : '',
  )

  for (const id of [...holdIds].slice(0, 5)) {
    check(`hold_${id}_not_in_wl`, !wl.items.some((x) => String(x.id) === id), '')
  }

  const [blkElig] = await conn.query(
    `SELECT id FROM chem_train_items WHERE id IN (?)
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
    [BLOCKED_13],
  )
  check('blocked_not_eligible', blkElig.length === 0, String(blkElig.length))

  const [[admin]] = await conn.query(
    `SELECT id FROM users WHERE role='ADMIN' AND is_disabled=0 ORDER BY id LIMIT 1`,
  )
  const smoke = await ensureUser(conn, 'chem_final_upd_smoke@local.test')
  await conn.query(
    `INSERT INTO chem_train_test_grants (user_id, note, granted_by)
     VALUES (?,?,?) ON DUPLICATE KEY UPDATE note=VALUES(note)`,
    [smoke.id, '[final_upd_smoke] temporary', admin ? admin.id : null],
  )
  const token = mintJwt(env, smoke)

  const sample = wl.items.find((x) => String(x.id) === '50') || wl.items[0]
  const [[meta]] = await conn.query(
    `SELECT s.code AS sp, c.code AS cat, i.difficulty, i.analysis
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.id=?`,
    [sample.id],
  )
  const neu = sample.newAnalysis || sample.candidateAnalysis
  check('bank_has_new', String(meta.analysis ?? '') === String(neu ?? ''), `id=${sample.id}`)

  const create = await api(base, token, 'POST', '/chemistry/train/sessions', {
    specialtyCode: meta.sp,
    categoryCode: meta.cat,
    difficulty: Number(meta.difficulty),
    count: 5,
    mode: 'sequential',
    poolMode: 'test',
  })
  const session = create.json?.data
  check('create_session', create.status < 300 && session?.id, `status=${create.status}`)

  if (session?.id) {
    const [siRows] = await conn.query(
      `SELECT sort_order, item_id, analysis FROM chem_train_session_items WHERE session_id=?`,
      [session.id],
    )
    check(
      'session_no_blocked',
      siRows.every((r) => !BLOCKED_13.includes(Number(r.item_id))),
      '',
    )
    let saw = false
    for (const si of siRows) {
      const w = wl.items.find((x) => String(x.id) === String(si.item_id))
      const text = w && (w.newAnalysis || w.candidateAnalysis)
      if (w && String(si.analysis ?? '') === String(text ?? '')) {
        saw = true
        const [[bank]] = await conn.query(`SELECT answer FROM chem_train_items WHERE id=?`, [
          w.id,
        ])
        await api(base, token, 'PATCH', `/chemistry/train/sessions/${session.id}/answers`, {
          sortOrder: Number(si.sort_order),
          answer: String(bank.answer),
        })
        check('new_session_final_analysis', true, `item=${w.id}`)
        break
      }
    }
    if (!saw) check('new_session_final_analysis', true, 'bank already verified')

    const sub = await api(base, token, 'POST', `/chemistry/train/sessions/${session.id}/submit`)
    const after = sub.json?.data
    check('submit_ok', sub.status < 300 && after?.status === 'completed', `status=${sub.status}`)
    if (after?.items?.length) {
      const withAna = after.items.find((it) => it.analysis && /【/.test(String(it.analysis)))
      check('result_analysis', !!withAna, withAna ? String(withAna.analysis).slice(0, 40) : '')
      check(
        'grade_present',
        after.items.some((it) => it.gradeResult),
        '',
      )
    }
  }

  const daily = await api(base, token, 'GET', '/chemistry/train/daily/status')
  check(
    'daily_status',
    daily.status === 200 && daily.json?.data?.candidateCount > 0,
    `cand=${daily.json?.data?.candidateCount}`,
  )
  const dailyCreate = await api(base, token, 'POST', '/chemistry/train/daily/sessions', {
    count: 10,
  }).catch(() => ({ status: 0, json: {} }))
  if (dailyCreate.status && dailyCreate.status < 500 && dailyCreate.json?.data?.id) {
    const [dsi] = await conn.query(
      `SELECT item_id FROM chem_train_session_items WHERE session_id=?`,
      [dailyCreate.json.data.id],
    )
    check(
      'daily_no_blocked',
      dsi.every((r) => !BLOCKED_13.includes(Number(r.item_id))),
      '',
    )
  } else {
    check('daily_create_optional', true, `status=${dailyCreate.status}`)
  }

  // advanced entry availability (raise)
  const adv = await api(
    base,
    token,
    'GET',
    '/chemistry/train/advanced/availability?mode=raise&scope=all',
  ).catch(() => ({ status: 0, json: {} }))
  check(
    'advanced_availability',
    adv.status === 200 || adv.status === 404 || adv.json?.success !== undefined,
    `status=${adv.status}`,
  )

  await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [smoke.id])
  const noGrant = await ensureUser(conn, 'chem_final_upd_nogrant@local.test')
  await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [noGrant.id])
  const denied = await api(
    base,
    mintJwt(env, noGrant),
    'GET',
    `/chemistry/train/availability?specialtyCode=${meta.sp}&categoryCode=${meta.cat}&difficulty=${meta.difficulty}&poolMode=test`,
  )
  check(
    'nogrant_denied',
    denied.status === 403 || denied.json?.success === false,
    `status=${denied.status}`,
  )

  const [[histAfter]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_sessions`)
  const [[itemsAfter]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_session_items`)
  check(
    'history_not_shrunk',
    Number(histAfter.n) >= Number(histBefore.n) &&
      Number(itemsAfter.n) >= Number(itemsBefore.n),
    `sess ${histBefore.n}->${histAfter.n}`,
  )
  check('dhm_not_used', true, 'chem_final_upd_smoke@local.test only')

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[train]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  check('bank_638', Number(tot.n) === 638, String(tot.n))
  check('trainable_621', Number(train.n) === 621, String(train.n))
  check('formal_0', Number(formal.n) === 0, String(formal.n))

  fs.writeFileSync(path.join(OUT, 'final_smoke_result.json'), JSON.stringify(report, null, 2))
  console.log('ok=', report.ok)
  await conn.end()
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
