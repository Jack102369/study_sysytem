/**
 * GLOBAL-1E: transactional KP migration runner (authorized).
 * Same connection: START TRANSACTION → seed SQL → verify → COMMIT|ROLLBACK
 * No draft / train / other tables.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { execFileSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const backupDir = path.join(docs, '_backups')
fs.mkdirSync(backupDir, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const report = {
  phase: 'HS-MATH-BANK-GLOBAL-1E',
  authorized: true,
  startedAt: new Date().toISOString(),
  decision: null,
  sha256: null,
  backup: {},
  pre: {},
  txn: {},
  post: {},
  errors: [],
}

const { seedsToInsert, existingInDb, kpByCode } =
  await import(pathToFileURL(path.join(__dirname, 'kp-seed-g1c.mjs')).href)
const { candidates } =
  await import(pathToFileURL(path.join(__dirname, 'candidates-g1b-100.mjs')).href)

const insertCodes = seedsToInsert.map((k) => k.code)
const existingCodes = existingInDb.map((k) => k.code)
const sqlPath = path.join(root, 'db/seed_hs_math_global1c_missing_kps.sql')
const sqlText = fs.readFileSync(sqlPath, 'utf8')
report.sha256 = crypto.createHash('sha256').update(sqlText).digest('hex')

const sqlCodes = [...sqlText.matchAll(/SELECT '([^']+)' AS code/g)].map((m) => m[1])
if (
  sqlCodes.length !== 111 ||
  insertCodes.length !== 111 ||
  existingCodes.length !== 42 ||
  !insertCodes.every((c) => sqlCodes.includes(c)) ||
  sqlCodes.some((c) => !insertCodes.includes(c))
) {
  report.decision = 'BLOCKED'
  report.errors.push('seed/SQL set mismatch')
  fs.writeFileSync(path.join(docs, '_g1e_result.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  process.exit(2)
}

const db = {
  host: '127.0.0.1',
  port: 3306,
  user: 'study_user',
  password: 'Hw@2026',
  database: 'study_system',
  multipleStatements: true,
  charset: 'utf8mb4',
}

async function q(conn, sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

function placeholders(n) {
  return Array(n).fill('?').join(',')
}

// ---- Backup (mysqldump) ----
const backupKp = path.join(backupDir, `g1e_hs_math_knowledge_points_${stamp}.sql`)
const backupCat = path.join(backupDir, `g1e_hs_math_categories_${stamp}.sql`)
const backupSpec = path.join(backupDir, `g1e_hs_math_specialties_${stamp}.sql`)
try {
  const mysqlDump = 'mysqldump'
  const common = [
    '-h127.0.0.1',
    '-P3306',
    '-ustudy_user',
    `--password=${db.password}`,
    '--default-character-set=utf8mb4',
    '--single-transaction',
    '--routines=false',
    '--triggers=false',
    'study_system',
  ]
  fs.writeFileSync(
    backupKp,
    execFileSync(mysqlDump, [...common, 'hs_math_knowledge_points'], { encoding: 'utf8' }),
  )
  fs.writeFileSync(
    backupCat,
    execFileSync(mysqlDump, [...common, 'hs_math_categories'], { encoding: 'utf8' }),
  )
  fs.writeFileSync(
    backupSpec,
    execFileSync(mysqlDump, [...common, 'hs_math_specialties'], { encoding: 'utf8' }),
  )
  for (const [label, p] of [
    ['kp', backupKp],
    ['categories', backupCat],
    ['specialties', backupSpec],
  ]) {
    const st = fs.statSync(p)
    const body = fs.readFileSync(p)
    if (st.size < 100) throw new Error(`backup ${label} too small: ${st.size}`)
    report.backup[label] = {
      path: p,
      bytes: st.size,
      sha256: crypto.createHash('sha256').update(body).digest('hex'),
      mtime: st.mtime.toISOString(),
    }
  }
  report.backup.ok = true
  report.backup.stamp = stamp
} catch (e) {
  report.decision = 'BLOCKED'
  report.backup.ok = false
  report.errors.push(`backup failed: ${e.message}`)
  fs.writeFileSync(path.join(docs, '_g1e_result.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  process.exit(3)
}

// ---- Pre-check (independent connection) ----
{
  const conn = await createConnection(db)
  try {
    const tot = await q(conn, 'SELECT COUNT(*) AS n FROM hs_math_knowledge_points')
    const conflict = await q(
      conn,
      `SELECT code FROM hs_math_knowledge_points WHERE code IN (${placeholders(insertCodes.length)})`,
      insertCodes,
    )
    const existingOk = await q(
      conn,
      `SELECT code FROM hs_math_knowledge_points WHERE code IN (${placeholders(existingCodes.length)})`,
      existingCodes,
    )
    const ns = await q(
      conn,
      `SELECT COUNT(*) AS n FROM hs_math_knowledge_points
       WHERE code LIKE 'rja.2.%' OR code LIKE 'rja.3.4.%' OR code LIKE 'rja.4.%'
          OR code LIKE 'rja.5.%' OR code LIKE 'rjb.%'`,
    )
    // category pairs from seeds
    const pairs = [
      ...new Set(seedsToInsert.map((k) => `${k.specialtyCode}|${k.sectionCode}`)),
    ]
    let catMissing = []
    for (const p of pairs) {
      const [sp, sec] = p.split('|')
      const rows = await q(
        conn,
        `SELECT c.id FROM hs_math_categories c
         JOIN hs_math_specialties s ON s.id=c.specialty_id
         WHERE s.code=? AND c.code=?`,
        [sp, sec],
      )
      if (!rows.length) catMissing.push(p)
    }
    report.pre = {
      kp_total: tot[0].n,
      conflictN: conflict.length,
      existingPresent: existingOk.length,
      namespaceExisting: ns[0].n,
      categoryPairs: pairs.length,
      catMissing,
    }
    if (
      Number(tot[0].n) !== 42 ||
      conflict.length !== 0 ||
      existingOk.length !== 42 ||
      Number(ns[0].n) !== 0 ||
      catMissing.length
    ) {
      report.decision = 'BLOCKED'
      report.errors.push('pre-check failed')
      fs.writeFileSync(path.join(docs, '_g1e_result.json'), JSON.stringify(report, null, 2))
      console.log(JSON.stringify(report, null, 2))
      await conn.end()
      process.exit(4)
    }
  } finally {
    await conn.end()
  }
}

// ---- Transactional migrate ----
const conn = await createConnection(db)
report.txn.connectionId = null
try {
  const idRows = await q(conn, 'SELECT CONNECTION_ID() AS id')
  report.txn.connectionId = idRows[0].id

  // baseline train count (ensure no change) — read only check after
  const trainBefore = await q(conn, 'SELECT COUNT(*) AS n FROM hs_math_train_items')

  await q(conn, 'START TRANSACTION')
  report.txn.started = true

  // Execute seed body only (strip leading comments is fine; keep statements)
  await conn.query(sqlText)

  // In-transaction verification
  const tot = await q(conn, 'SELECT COUNT(*) AS n FROM hs_math_knowledge_points')
  const newPresent = await q(
    conn,
    `SELECT code FROM hs_math_knowledge_points WHERE code IN (${placeholders(insertCodes.length)})`,
    insertCodes,
  )
  const oldPresent = await q(
    conn,
    `SELECT code FROM hs_math_knowledge_points WHERE code IN (${placeholders(existingCodes.length)})`,
    existingCodes,
  )
  const dup = await q(
    conn,
    `SELECT code, COUNT(*) c FROM hs_math_knowledge_points GROUP BY code HAVING c>1`,
  )
  // sample join: each new code maps to expected specialty+section via seed
  let joinBad = []
  for (const k of seedsToInsert) {
    const rows = await q(
      conn,
      `SELECT kp.code, s.code AS sp, c.code AS sec
       FROM hs_math_knowledge_points kp
       JOIN hs_math_specialties s ON s.id=kp.specialty_id
       JOIN hs_math_categories c ON c.id=kp.category_id
       WHERE kp.code=?`,
      [k.code],
    )
    if (
      !rows.length ||
      rows[0].sp !== k.specialtyCode ||
      rows[0].sec !== k.sectionCode
    ) {
      joinBad.push(k.code)
      if (joinBad.length > 20) break
    }
  }
  // candidate KP resolvable
  let candMiss = []
  for (const c of candidates) {
    const rows = await q(
      conn,
      'SELECT id FROM hs_math_knowledge_points WHERE code=? LIMIT 1',
      [c.kpCode],
    )
    if (!rows.length) candMiss.push(c.id)
  }
  const trainAfter = await q(conn, 'SELECT COUNT(*) AS n FROM hs_math_train_items')

  const checks = {
    total153: Number(tot[0].n) === 153,
    new111: newPresent.length === 111,
    old42: oldPresent.length === 42,
    noDup: dup.length === 0,
    joinOk: joinBad.length === 0,
    cand100: candMiss.length === 0,
    trainUnchanged: Number(trainBefore[0].n) === Number(trainAfter[0].n),
  }
  report.txn.checks = checks
  report.txn.totals = {
    kp: Number(tot[0].n),
    newPresent: newPresent.length,
    oldPresent: oldPresent.length,
    joinBadN: joinBad.length,
    candMissN: candMiss.length,
    trainBefore: Number(trainBefore[0].n),
    trainAfter: Number(trainAfter[0].n),
  }
  report.txn.joinBadSample = joinBad.slice(0, 10)
  report.txn.candMissSample = candMiss.slice(0, 10)

  const allPass = Object.values(checks).every(Boolean)
  if (!allPass) {
    await q(conn, 'ROLLBACK')
    report.txn.action = 'ROLLBACK'
    report.decision = 'ROLLED_BACK'
    report.errors.push('in-transaction verification failed')
  } else {
    await q(conn, 'COMMIT')
    report.txn.action = 'COMMIT'
    report.decision = 'MIGRATION_PASS'
  }
} catch (e) {
  try {
    await q(conn, 'ROLLBACK')
    report.txn.action = 'ROLLBACK'
  } catch (_) {}
  report.decision = 'ROLLED_BACK'
  report.errors.push(`txn error: ${e.message}`)
} finally {
  await conn.end()
}

// ---- Post-check (new connection) ----
if (report.decision === 'MIGRATION_PASS') {
  const conn2 = await createConnection({ ...db, multipleStatements: false })
  try {
    const tot = await q(conn2, 'SELECT COUNT(*) AS n FROM hs_math_knowledge_points')
    const newPresent = await q(
      conn2,
      `SELECT COUNT(*) AS n FROM hs_math_knowledge_points WHERE code IN (${placeholders(insertCodes.length)})`,
      insertCodes,
    )
    const oldPresent = await q(
      conn2,
      `SELECT COUNT(*) AS n FROM hs_math_knowledge_points WHERE code IN (${placeholders(existingCodes.length)})`,
      existingCodes,
    )
    let candMiss = 0
    for (const c of candidates) {
      const rows = await q(
        conn2,
        'SELECT id FROM hs_math_knowledge_points WHERE code=? LIMIT 1',
        [c.kpCode],
      )
      if (!rows.length) candMiss++
    }
    const bySp = await q(
      conn2,
      `SELECT s.code AS specialty, COUNT(kp.id) AS kp_n
       FROM hs_math_specialties s
       LEFT JOIN hs_math_knowledge_points kp ON kp.specialty_id=s.id
       GROUP BY s.id, s.code ORDER BY s.sort_order`,
    )
    report.post = {
      kp_total: Number(tot[0].n),
      newPresent: Number(newPresent[0].n),
      oldPresent: Number(oldPresent[0].n),
      candMiss,
      bySpecialty: bySp,
      connectionId: (await q(conn2, 'SELECT CONNECTION_ID() AS id'))[0].id,
    }
    if (
      report.post.kp_total !== 153 ||
      report.post.newPresent !== 111 ||
      report.post.oldPresent !== 42 ||
      report.post.candMiss !== 0
    ) {
      report.decision = 'BLOCKED'
      report.errors.push('post-commit independent verify failed — manual investigation required')
    }
  } finally {
    await conn2.end()
  }
}

report.finishedAt = new Date().toISOString()
fs.writeFileSync(path.join(docs, '_g1e_result.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
process.exit(report.decision === 'MIGRATION_PASS' ? 0 : 1)
