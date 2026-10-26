/**
 * HS-MATH-BANK-DIAGRAM-1C-MIGRATION
 * Executes audited db/migrate_hs_math_item_diagrams.sql on study_system.
 * Aborts if pre-checks diverge from 137 baseline expectations.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const sqlPath = path.join(root, 'db/migrate_hs_math_item_diagrams.sql')

const TABLES = [
  'hs_math_train_item_diagram_objects',
  'hs_math_train_item_diagrams',
  'hs_math_train_session_item_diagrams',
]

const EXPECTED_CONSTRAINTS = [
  'fk_hs_math_diagram_obj_user',
  'fk_hs_math_item_diagram_item',
  'fk_hs_math_item_diagram_obj',
  'fk_hs_math_sess_item_diagram_si',
  'fk_hs_math_sess_item_diagram_obj',
]

function loadEnv() {
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

function splitSqlStatements(sqlText) {
  const cleaned = sqlText
    .split(/\r?\n/)
    .filter((line) => !/^\s*--/.test(line))
    .join('\n')
  return cleaned
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function many(conn, sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}
async function one(conn, sql, params = []) {
  const rows = await many(conn, sql, params)
  return rows[0]
}

async function snapshotCounts(conn) {
  return {
    candApproved: Number(
      (
        await one(
          conn,
          `SELECT COUNT(1) AS n FROM hs_math_train_items
           WHERE code REGEXP '^CAND-G1B-[0-9]{3}$' AND status='approved'`,
        )
      ).n,
    ),
    drawable: Number(
      (
        await one(
          conn,
          `SELECT COUNT(1) AS n FROM hs_math_train_items
           WHERE pool='formal' AND status='approved' AND is_active=1`,
        )
      ).n,
    ),
    reviews: Number(
      (await one(conn, `SELECT COUNT(1) AS n FROM hs_math_train_item_reviews`)).n,
    ),
    sessions: Number(
      (await one(conn, `SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n,
    ),
    sessionItems: Number(
      (await one(conn, `SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
    ),
    appImages: Number(
      (await one(conn, `SELECT COUNT(1) AS n FROM hs_math_train_session_item_images`)).n,
    ),
    itemsTotal: Number(
      (await one(conn, `SELECT COUNT(1) AS n FROM hs_math_train_items`)).n,
    ),
    itemKps: Number(
      (await one(conn, `SELECT COUNT(1) AS n FROM hs_math_train_item_kps`)).n,
    ),
    itemMethods: Number(
      (await one(conn, `SELECT COUNT(1) AS n FROM hs_math_train_item_methods`)).n,
    ),
  }
}

async function tablePresence(conn) {
  const rows = await many(
    conn,
    `SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_ROWS, TABLE_COMMENT
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?,?,?)`,
    TABLES,
  )
  const map = new Map(rows.map((r) => [r.TABLE_NAME, r]))
  return TABLES.map((name) => ({
    name,
    exists: map.has(name),
    meta: map.get(name) || null,
  }))
}

async function inspectNewTables(conn) {
  const columns = await many(
    conn,
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?,?,?)
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    TABLES,
  )
  const indexes = await many(
    conn,
    `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?,?,?)
     ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
    TABLES,
  )
  const fks = await many(
    conn,
    `SELECT k.CONSTRAINT_NAME, k.TABLE_NAME, k.COLUMN_NAME,
            k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
            r.DELETE_RULE, r.UPDATE_RULE
     FROM information_schema.KEY_COLUMN_USAGE k
     JOIN information_schema.REFERENTIAL_CONSTRAINTS r
       ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
     WHERE k.TABLE_SCHEMA = DATABASE()
       AND k.TABLE_NAME IN (?,?,?)
       AND k.REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`,
    TABLES,
  )
  const rowCounts = {}
  for (const t of TABLES) {
    rowCounts[t] = Number((await one(conn, `SELECT COUNT(1) AS n FROM \`${t}\``)).n)
  }
  return { columns, indexes, fks, rowCounts }
}

const startedAt = new Date().toISOString()
const env = loadEnv()
const sqlText = fs.readFileSync(sqlPath, 'utf8')
const sqlSha256 = crypto.createHash('sha256').update(sqlText).digest('hex')
const statements = splitSqlStatements(sqlText)

const out = {
  phase: 'HS-MATH-BANK-DIAGRAM-1C-MIGRATION',
  startedAt,
  endedAt: null,
  status: 'IN_PROGRESS',
  database: null,
  mysqlVersion: null,
  sqlPath: 'db/migrate_hs_math_item_diagrams.sql',
  sqlSha256,
  statementCount: statements.length,
  statementsPreview: statements.map((s) => s.slice(0, 80).replace(/\s+/g, ' ')),
  pre: null,
  executed: [],
  post: null,
  blockers: [],
  partialMigration: false,
  notes: [],
}

const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
  multipleStatements: false,
})

try {
  const ver = await one(conn, `SELECT VERSION() AS v, DATABASE() AS db`)
  out.database = ver.db
  out.mysqlVersion = ver.v

  if (ver.db !== 'study_system') {
    out.blockers.push(`DATABASE()=${ver.db} expected study_system`)
  }
  if (!String(ver.v).startsWith('8.')) {
    out.blockers.push(`MySQL version ${ver.v} unexpected (expected 8.x)`)
  }

  const charset = await one(
    conn,
    `SELECT DEFAULT_CHARACTER_SET_NAME AS cs, DEFAULT_COLLATION_NAME AS coll
     FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE()`,
  )

  const preTables = await tablePresence(conn)
  const preCounts = await snapshotCounts(conn)
  const fkTypes = {
    train_items_id: (
      await one(
        conn,
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hs_math_train_items' AND COLUMN_NAME='id'`,
      )
    )?.COLUMN_TYPE,
    session_items_id: (
      await one(
        conn,
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hs_math_train_session_items' AND COLUMN_NAME='id'`,
      )
    )?.COLUMN_TYPE,
    users_id: (
      await one(
        conn,
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='id'`,
      )
    )?.COLUMN_TYPE,
  }

  out.pre = {
    schemaCharset: charset,
    tables: preTables,
    counts: preCounts,
    fkTypes,
    anyExists: preTables.some((t) => t.exists),
    allExist: preTables.every((t) => t.exists),
    partial: preTables.some((t) => t.exists) && !preTables.every((t) => t.exists),
  }

  // Align with 137: tables must be absent; types bigint unsigned
  if (out.pre.anyExists) {
    out.blockers.push('Target tables already exist (unexpected vs 137 clean state)')
  }
  if (out.pre.partial) {
    out.blockers.push('Partial migration detected before run')
  }
  for (const [k, v] of Object.entries(fkTypes)) {
    if (v !== 'bigint unsigned') {
      out.blockers.push(`FK target type mismatch ${k}=${v}`)
    }
  }
  if (statements.length !== 3) {
    out.blockers.push(`Expected 3 CREATE statements, got ${statements.length}`)
  }
  for (const st of statements) {
    if (!/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i.test(st)) {
      out.blockers.push(`Non-CREATE statement detected: ${st.slice(0, 60)}`)
    }
    // Forbid data/schema destruction. Do NOT match ON DELETE / ON UPDATE clauses.
    if (
      /^\s*(DROP|TRUNCATE)\b/im.test(st) ||
      /^\s*DELETE\s+FROM\b/im.test(st) ||
      /^\s*UPDATE\b/im.test(st) ||
      /\bDROP\s+TABLE\b/i.test(st) ||
      /\bTRUNCATE\s+TABLE\b/i.test(st)
    ) {
      out.blockers.push(`Destructive keyword in statement: ${st.slice(0, 60)}`)
    }
  }

  if (out.blockers.length) {
    out.status = 'BLOCKED'
    out.endedAt = new Date().toISOString()
    fs.writeFileSync(
      path.join(docs, '_g1c_diagram_migrate_result.json'),
      JSON.stringify(out, null, 2),
    )
    console.log(JSON.stringify(out, null, 2))
    await conn.end()
    process.exit(2)
  }

  // Execute migration statements one-by-one (DDL auto-commit)
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i]
    const t0 = Date.now()
    try {
      await conn.query(sql)
      out.executed.push({
        index: i + 1,
        ok: true,
        ms: Date.now() - t0,
        head: sql.slice(0, 100).replace(/\s+/g, ' '),
      })
    } catch (err) {
      out.executed.push({
        index: i + 1,
        ok: false,
        ms: Date.now() - t0,
        head: sql.slice(0, 100).replace(/\s+/g, ' '),
        error: String(err?.message || err),
      })
      const mid = await tablePresence(conn)
      out.partialMigration = mid.some((t) => t.exists) && !mid.every((t) => t.exists)
      out.midTables = mid
      out.blockers.push(`DDL failed at statement ${i + 1}; stopped; no DROP/retry`)
      out.status = 'BLOCKED'
      out.endedAt = new Date().toISOString()
      fs.writeFileSync(
        path.join(docs, '_g1c_diagram_migrate_result.json'),
        JSON.stringify(out, null, 2),
      )
      console.log(JSON.stringify(out, null, 2))
      await conn.end()
      process.exit(3)
    }
  }

  const postTables = await tablePresence(conn)
  const postCounts = await snapshotCounts(conn)
  const inspect = await inspectNewTables(conn)

  const missingTables = postTables.filter((t) => !t.exists).map((t) => t.name)
  if (missingTables.length) {
    out.blockers.push(`Missing tables after migrate: ${missingTables.join(',')}`)
  }

  const fkNames = new Set(inspect.fks.map((f) => f.CONSTRAINT_NAME))
  for (const name of EXPECTED_CONSTRAINTS) {
    if (!fkNames.has(name)) out.blockers.push(`Missing FK ${name}`)
  }

  // Object FKs from link/snapshot must not CASCADE delete objects
  const objectDeleteRules = inspect.fks.filter(
    (f) =>
      f.REFERENCED_TABLE_NAME === 'hs_math_train_item_diagram_objects' &&
      f.COLUMN_NAME === 'object_id',
  )
  for (const f of objectDeleteRules) {
    if (f.DELETE_RULE === 'CASCADE') {
      out.blockers.push(`${f.CONSTRAINT_NAME} DELETE_RULE=CASCADE (expected RESTRICT)`)
    }
  }
  const userFk = inspect.fks.find((f) => f.CONSTRAINT_NAME === 'fk_hs_math_diagram_obj_user')
  if (userFk && userFk.DELETE_RULE !== 'SET NULL') {
    out.blockers.push(`fk_hs_math_diagram_obj_user DELETE_RULE=${userFk.DELETE_RULE}`)
  }
  const itemCascade = inspect.fks.find((f) => f.CONSTRAINT_NAME === 'fk_hs_math_item_diagram_item')
  if (itemCascade && itemCascade.DELETE_RULE !== 'CASCADE') {
    out.blockers.push(`fk_hs_math_item_diagram_item DELETE_RULE=${itemCascade.DELETE_RULE}`)
  }
  const siCascade = inspect.fks.find((f) => f.CONSTRAINT_NAME === 'fk_hs_math_sess_item_diagram_si')
  if (siCascade && siCascade.DELETE_RULE !== 'CASCADE') {
    out.blockers.push(`fk_hs_math_sess_item_diagram_si DELETE_RULE=${siCascade.DELETE_RULE}`)
  }

  for (const t of TABLES) {
    if (inspect.rowCounts[t] !== 0) {
      out.blockers.push(`${t} rowCount=${inspect.rowCounts[t]} expected 0`)
    }
  }

  const countKeys = [
    'candApproved',
    'drawable',
    'reviews',
    'sessions',
    'sessionItems',
    'appImages',
    'itemsTotal',
    'itemKps',
    'itemMethods',
  ]
  const countDiffs = {}
  for (const k of countKeys) {
    if (preCounts[k] !== postCounts[k]) {
      countDiffs[k] = { pre: preCounts[k], post: postCounts[k] }
    }
  }
  // Business tables must not change due to this DDL-only migration
  if (Object.keys(countDiffs).length) {
    out.notes.push({
      type: 'count_diff',
      detail: countDiffs,
      interpretation:
        'DDL-only migrate should not change these; if concurrent user activity, record as concurrent not migration write',
    })
    // sessions may change concurrently; items/reviews/drawable/candApproved must not
    for (const critical of [
      'candApproved',
      'drawable',
      'reviews',
      'itemsTotal',
      'itemKps',
      'itemMethods',
      'appImages',
    ]) {
      if (countDiffs[critical]) {
        out.blockers.push(
          `Critical count changed ${critical}: ${countDiffs[critical].pre}→${countDiffs[critical].post}`,
        )
      }
    }
  }

  out.post = {
    tables: postTables,
    counts: postCounts,
    countDiffs,
    inspect,
  }
  out.partialMigration =
    postTables.some((t) => t.exists) && !postTables.every((t) => t.exists)

  out.status = out.blockers.length || out.partialMigration ? 'BLOCKED' : 'MIGRATION_PASS'
  out.endedAt = new Date().toISOString()
} catch (err) {
  out.blockers.push(String(err?.stack || err))
  out.status = 'BLOCKED'
  out.endedAt = new Date().toISOString()
} finally {
  await conn.end()
}

fs.writeFileSync(
  path.join(docs, '_g1c_diagram_migrate_result.json'),
  JSON.stringify(out, null, 2),
)
console.log(JSON.stringify(out, null, 2))
process.exit(out.status === 'MIGRATION_PASS' ? 0 : 1)
