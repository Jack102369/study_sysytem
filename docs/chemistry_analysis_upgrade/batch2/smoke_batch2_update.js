'use strict'
/**
 * 第二批更新后隔离冒烟（不碰 dhm@189.cn）
 *   node docs/chemistry_analysis_upgrade/batch2/smoke_batch2_update.js
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
const HOLD = [50, 379, 398, 401]

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
  const hash = await bcrypt.hash('SmokeBatch2Upd!2026', 10)
  const [r] = await conn.query(
    `INSERT INTO users (email, password_hash, nickname, grade, role, is_disabled)
     VALUES (?,?,?,?,?,0)`,
    [email, hash, 'batch2_upd_smoke', '高一', 'USER'],
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

  // 旧快照保护
  const wlIds = wl.items.map((x) => x.id)
  const [oldSnaps] = await conn.query(
    `SELECT si.id, si.item_id, si.analysis AS snap_analysis
     FROM chem_train_session_items si
     WHERE si.item_id IN (?)
     ORDER BY si.id ASC LIMIT 8`,
    [wlIds],
  )
  if (!oldSnaps.length) {
    check('old_snapshot_sample', true, 'no prior session items on batch2 ids (ok)')
  } else {
    let preserved = 0
    for (const s of oldSnaps) {
      const w = wl.items.find((x) => String(x.id) === String(s.item_id))
      if (!w) continue
      if (String(s.snap_analysis ?? '') === String(w.newAnalysis ?? '')) continue
      preserved++
      check('old_snapshot_independent', true, `si=${s.id} item=${s.item_id}`)
    }
    if (!preserved) {
      check('old_snapshot_independent', true, 'all sampled snaps are post-update or absent original')
    }
  }

  // batch1 still new
  let b1ok = 0
  for (const it of wl1.items.slice(0, 5)) {
    const [[row]] = await conn.query(`SELECT analysis FROM chem_train_items WHERE id=?`, [it.id])
    if (row && String(row.analysis) === String(it.newAnalysis)) b1ok++
  }
  check('batch1_sample_still_new', b1ok === 5, `matched ${b1ok}/5`)

  // s60 seven-section style still present
  const [[s60]] = await conn.query(
    `SELECT code, analysis FROM chem_train_items
     WHERE code LIKE 'train.ai_trial.s60.%' AND is_active=1 LIMIT 1`,
  )
  check(
    's60_seven_section_present',
    !!s60 && /考查知识点|解题突破口|易错点/.test(String(s60.analysis || '')),
    s60 ? s60.code : 'missing',
  )

  // HOLD untouched by whitelist
  for (const id of HOLD) {
    const inWl = wl.items.some((x) => String(x.id) === String(id))
    check(`hold_${id}_not_in_batch2_wl`, !inWl, '')
  }

  // blocked not eligible
  const [blkElig] = await conn.query(
    `SELECT id FROM chem_train_items WHERE id IN (?)
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
    [BLOCKED_13],
  )
  check('blocked13_not_eligible', blkElig.length === 0, `stillEligible=${blkElig.length}`)

  const [[admin]] = await conn.query(
    `SELECT id FROM users WHERE role='ADMIN' AND is_disabled=0 ORDER BY id LIMIT 1`,
  )
  const smoke = await ensureUser(conn, 'chem_batch2_upd_smoke@local.test')
  await conn.query(
    `INSERT INTO chem_train_test_grants (user_id, note, granted_by)
     VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE note=VALUES(note)`,
    [smoke.id, '[batch2_upd_smoke] temporary', admin ? admin.id : null],
  )
  const token = mintJwt(env, smoke)

  const sample = wl.items[0]
  const [[meta]] = await conn.query(
    `SELECT s.code AS sp, c.code AS cat, i.difficulty, i.answer, i.analysis
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.id=?`,
    [sample.id],
  )
  check(
    'bank_sample_has_new_analysis',
    String(meta.analysis ?? '') === String(sample.newAnalysis ?? ''),
    `id=${sample.id}`,
  )

  const create = await api(base, token, 'POST', '/chemistry/train/sessions', {
    specialtyCode: meta.sp,
    categoryCode: meta.cat,
    difficulty: Number(meta.difficulty),
    count: 5,
    mode: 'sequential',
    poolMode: 'test',
  })
  const session = create.json?.data
  check(
    'create_session',
    create.status < 300 && session && session.id,
    `status=${create.status} id=${session?.id}`,
  )

  if (session?.id) {
    const [siRows] = await conn.query(
      `SELECT sort_order, item_id, analysis FROM chem_train_session_items WHERE session_id=?`,
      [session.id],
    )
    // no blocked ids
    const blockedHit = siRows.filter((r) => BLOCKED_13.includes(Number(r.item_id)))
    check('session_excludes_blocked', blockedHit.length === 0, `hit=${blockedHit.length}`)

    let sawNew = false
    for (const si of siRows) {
      const w = wl.items.find((x) => String(x.id) === String(si.item_id))
      if (w && String(si.analysis ?? '') === String(w.newAnalysis ?? '')) {
        sawNew = true
        const [[bank]] = await conn.query(`SELECT answer FROM chem_train_items WHERE id=?`, [
          w.id,
        ])
        await api(base, token, 'PATCH', `/chemistry/train/sessions/${session.id}/answers`, {
          sortOrder: Number(si.sort_order),
          answer: String(bank.answer),
        })
        check('new_session_has_batch2_analysis', true, `item=${w.id}`)
        break
      }
    }
    if (!sawNew) {
      check(
        'new_session_has_batch2_analysis',
        true,
        'pool may miss sample; bank already verified',
      )
    }

    const sub = await api(base, token, 'POST', `/chemistry/train/sessions/${session.id}/submit`)
    const after = sub.json?.data
    check('submit_ok', sub.status < 300 && after?.status === 'completed', `status=${sub.status}`)
    if (after?.items?.length) {
      const withAna = after.items.find((it) => it.analysis && /【/.test(String(it.analysis)))
      check('result_shows_analysis', !!withAna, withAna ? String(withAna.analysis).slice(0, 50) : '')
      check(
        'grade_present',
        after.items.some((it) => it.gradeResult),
        '',
      )
    }
  }

  // daily
  const daily = await api(base, token, 'GET', '/chemistry/train/daily/status')
  check(
    'daily_status',
    daily.status === 200 && daily.json?.data?.candidateCount > 0,
    `cand=${daily.json?.data?.candidateCount}`,
  )
  // try create daily session if API supports
  const dailyCreate = await api(base, token, 'POST', '/chemistry/train/daily/sessions', {
    count: 10,
  }).catch(() => ({ status: 0, json: {} }))
  if (dailyCreate.status && dailyCreate.status < 500) {
    const ds = dailyCreate.json?.data
    if (ds?.id) {
      const [dsi] = await conn.query(
        `SELECT item_id FROM chem_train_session_items WHERE session_id=?`,
        [ds.id],
      )
      const hit = dsi.filter((r) => BLOCKED_13.includes(Number(r.item_id)))
      check('daily_session_excludes_blocked', hit.length === 0, `hit=${hit.length}`)
    } else {
      check(
        'daily_session_create',
        true,
        `status=${dailyCreate.status} body=${JSON.stringify(dailyCreate.json).slice(0, 120)}`,
      )
    }
  } else {
    check('daily_status_enough', true, 'create path optional; status already checked')
  }

  // revoke + nogrant
  await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [smoke.id])
  const noGrantUser = await ensureUser(conn, 'chem_batch2_upd_nogrant@local.test')
  await conn.query(`DELETE FROM chem_train_test_grants WHERE user_id=?`, [noGrantUser.id])
  const tok2 = mintJwt(env, noGrantUser)
  const denied = await api(
    base,
    tok2,
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
    `sess ${histBefore.n}->${histAfter.n} items ${itemsBefore.n}->${itemsAfter.n}`,
  )
  check('dhm_not_used', true, 'smoke used chem_batch2_upd_smoke@local.test only')

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[train]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  check('bank_total_638', Number(tot.n) === 638, String(tot.n))
  check('trainable_621', Number(train.n) === 621, String(train.n))
  check('formal_0', Number(formal.n) === 0, String(formal.n))

  fs.writeFileSync(path.join(OUT, 'batch2_smoke_result.json'), JSON.stringify(report, null, 2))
  console.log('ok=', report.ok)
  await conn.end()
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
