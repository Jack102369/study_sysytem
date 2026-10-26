/**
 * 只读：对比业务库/IT 库 information_schema 与 Entity 关键字段。
 * 默认读取 HS_MATH_IT_DB_NAME；若仅审计业务库结构可设 HS_MATH_SCHEMA_AUDIT_DB=study_system（只读）。
 *
 * 运行：pnpm --filter api run hs-math:schema-audit
 */
import { DataSource } from 'typeorm'
import { loadApiEnv } from './hs-math-it.safety'

const EXPECTED_TABLES = [
  'hs_math_specialties',
  'hs_math_categories',
  'hs_math_train_items',
  'hs_math_train_sessions',
  'hs_math_train_session_items',
  'hs_math_knowledge_points',
  'hs_math_train_item_kps',
] as const

async function main() {
  const env = loadApiEnv()
  const db =
    process.env.HS_MATH_SCHEMA_AUDIT_DB ||
    process.env.HS_MATH_IT_DB_NAME ||
    env.HS_MATH_IT_DB_NAME ||
    ''
  if (!db) {
    console.error(
      '请设置 HS_MATH_IT_DB_NAME=study_system_hs_math_it 或 HS_MATH_SCHEMA_AUDIT_DB（只读）',
    )
    process.exitCode = 1
    return
  }
  const writeRisk = db === 'study_system'
  console.log(
    `[schema-audit] database=${db} mode=${writeRisk ? 'READ_ONLY_BUSINESS' : 'IT_OR_OTHER'}`,
  )

  const ds = new DataSource({
    type: 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    username: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: db,
    synchronize: false,
  })
  await ds.initialize()

  const missing: string[] = []
  for (const t of EXPECTED_TABLES) {
    const rows: Array<{ c: number }> = await ds.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema=? AND table_name=?`,
      [db, t],
    )
    if (Number(rows[0].c) === 0) missing.push(t)
  }
  if (missing.length) {
    console.log('MISSING_TABLES:', missing.join(', '))
    console.log(
      'HINT: 业务库需执行 db/migrate_hs_math_p0.sql 与 db/migrate_hs_math_p1_0.sql；IT 库需同步 schema',
    )
    await ds.destroy()
    process.exitCode = 1
    return
  }

  for (const t of EXPECTED_TABLES) {
    const cols: Array<{
      COLUMN_NAME: string
      COLUMN_TYPE: string
      IS_NULLABLE: string
      COLUMN_KEY: string
      COLUMN_DEFAULT: string | null
    }> = await ds.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
       FROM information_schema.columns
       WHERE table_schema=? AND table_name=?
       ORDER BY ORDINAL_POSITION`,
      [db, t],
    )
    console.log(`\n## ${t}`)
    for (const c of cols) {
      console.log(
        `  - ${c.COLUMN_NAME} ${c.COLUMN_TYPE} null=${c.IS_NULLABLE} key=${c.COLUMN_KEY} default=${c.COLUMN_DEFAULT}`,
      )
    }
    const idx: Array<{ INDEX_NAME: string; NON_UNIQUE: number; COLUMN_NAME: string }> =
      await ds.query(
        `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME FROM information_schema.statistics
         WHERE table_schema=? AND table_name=? ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [db, t],
      )
    console.log('  indexes:')
    for (const i of idx) {
      console.log(
        `    ${i.INDEX_NAME} col=${i.COLUMN_NAME} unique=${i.NON_UNIQUE === 0}`,
      )
    }
  }

  // 关键字段抽检
  const checks: Array<[string, string, string]> = [
    ['hs_math_train_items', 'answer_payload_json', 'json'],
    ['hs_math_train_session_items', 'user_answer_payload_json', 'json'],
    ['hs_math_train_session_items', 'knowledge_point_codes_json', 'json'],
    ['hs_math_train_session_items', 'primary_knowledge_point_code', 'varchar(64)'],
    ['hs_math_knowledge_points', 'code', 'varchar(64)'],
    ['hs_math_train_item_kps', 'is_primary', 'tinyint(1)'],
    ['hs_math_train_sessions', 'started_at', 'datetime(3)'],
    ['hs_math_train_sessions', 'submitted_at', 'datetime(3)'],
  ]
  for (const [table, col, expectType] of checks) {
    const rows: Array<{ COLUMN_TYPE: string }> = await ds.query(
      `SELECT COLUMN_TYPE FROM information_schema.columns
       WHERE table_schema=? AND table_name=? AND column_name=?`,
      [db, table, col],
    )
    const actual = rows[0]?.COLUMN_TYPE?.toLowerCase()
    const ok = actual === expectType || actual?.startsWith(expectType)
    console.log(
      `check ${table}.${col} expect~=${expectType} actual=${actual} => ${ok ? 'OK' : 'MISMATCH'}`,
    )
  }

  await ds.destroy()
  console.log('\nSCHEMA_AUDIT_DONE')
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
