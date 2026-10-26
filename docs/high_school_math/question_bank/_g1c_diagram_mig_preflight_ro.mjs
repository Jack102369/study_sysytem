/**
 * DIAGRAM-1C-PREFLIGHT readonly DB probe. SELECT/SHOW only. DO NOT commit.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')

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

const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const [[ver]] = await conn.query(`SELECT VERSION() AS v, DATABASE() AS db`)
const tablesWanted = [
  'hs_math_train_item_diagram_objects',
  'hs_math_train_item_diagrams',
  'hs_math_train_session_item_diagrams',
]
const existing = await many(
  `SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_COMMENT
   FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?,?,?)`,
  tablesWanted,
)
const existingNames = new Set(existing.map((r) => r.TABLE_NAME))

const related = await many(
  `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
   FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME IN (
       'hs_math_train_items',
       'hs_math_train_session_items',
       'hs_math_train_session_item_images',
       'users'
     )
     AND COLUMN_NAME IN (
       'id','user_id','item_id','session_id','status','pool','is_active',
       'content_version','content_sha256'
     )
   ORDER BY TABLE_NAME, ORDINAL_POSITION`,
)

const indexNameHits = await many(
  `SELECT TABLE_NAME, INDEX_NAME
   FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND INDEX_NAME IN (
       'uk_hs_math_diagram_obj_sha',
       'uk_hs_math_diagram_obj_key',
       'uk_hs_math_item_diagram_ord',
       'uk_hs_math_sess_item_diagram_ord',
       'idx_hs_math_diagram_obj_uploader',
       'idx_hs_math_item_diagram_obj',
       'idx_hs_math_sess_item_diagram_obj'
     )`,
)

const fkNameHits = await many(
  `SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
   FROM information_schema.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = DATABASE()
     AND CONSTRAINT_NAME IN (
       'fk_hs_math_diagram_obj_user',
       'fk_hs_math_item_diagram_item',
       'fk_hs_math_item_diagram_obj',
       'fk_hs_math_sess_item_diagram_si',
       'fk_hs_math_sess_item_diagram_obj'
     )
     AND REFERENCED_TABLE_NAME IS NOT NULL`,
)

const counts = {
  candApproved: Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_items
         WHERE code REGEXP '^CAND-G1B-[0-9]{3}$' AND status='approved'`,
      )
    ).n,
  ),
  drawable: Number(
    (
      await one(
        `SELECT COUNT(1) AS n FROM hs_math_train_items
         WHERE pool='formal' AND status='approved' AND is_active=1`,
      )
    ).n,
  ),
  sessions: Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n),
  sessionItems: Number(
    (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
  ),
  appImages: Number(
    (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_item_images`)).n,
  ),
}

const itemIdCol = related.find(
  (r) => r.TABLE_NAME === 'hs_math_train_items' && r.COLUMN_NAME === 'id',
)
const sessionItemIdCol = related.find(
  (r) => r.TABLE_NAME === 'hs_math_train_session_items' && r.COLUMN_NAME === 'id',
)
const userIdCol = related.find(
  (r) => r.TABLE_NAME === 'users' && r.COLUMN_NAME === 'id',
)

const charset = await many(
  `SELECT DEFAULT_CHARACTER_SET_NAME AS cs, DEFAULT_COLLATION_NAME AS coll
   FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE()`,
)

await conn.end()

const out = {
  phase: 'HS-MATH-BANK-DIAGRAM-1C-PREFLIGHT',
  readonly: true,
  wroteDb: false,
  mysqlVersion: ver.v,
  database: ver.db,
  schemaCharset: charset[0] || null,
  targetTables: tablesWanted.map((name) => ({
    name,
    exists: existingNames.has(name),
    meta: existing.find((r) => r.TABLE_NAME === name) || null,
  })),
  anyTargetExists: tablesWanted.some((n) => existingNames.has(n)),
  allTargetsExist: tablesWanted.every((n) => existingNames.has(n)),
  partialMigration:
    tablesWanted.some((n) => existingNames.has(n)) &&
    !tablesWanted.every((n) => existingNames.has(n)),
  relatedColumns: related,
  fkTypeHints: {
    train_items_id: itemIdCol?.COLUMN_TYPE || null,
    session_items_id: sessionItemIdCol?.COLUMN_TYPE || null,
    users_id: userIdCol?.COLUMN_TYPE || null,
  },
  indexNameHits,
  fkNameHits,
  counts,
}

fs.writeFileSync(
  path.join(docs, '_g1c_diagram_mig_preflight_ro.json'),
  JSON.stringify(out, null, 2),
)
console.log(JSON.stringify(out, null, 2))
