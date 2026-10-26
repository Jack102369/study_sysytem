/**
 * 创建独立 IT 库并导入 schema（不会写入 study_system）。
 * 需要账号具备 CREATE DATABASE 权限；若失败请用 DBA 账号执行 db/hs_math_it_schema.sql。
 *
 * 运行：pnpm --filter api run hs-math:it-setup
 */
import { createConnection } from 'mysql2/promise'
import * as fs from 'fs'
import * as path from 'path'
import {
  assertSafeIntegrationDatabase,
  HS_MATH_IT_DB_NAME,
  loadApiEnv,
} from './hs-math-it.safety'

async function main() {
  const env = loadApiEnv()
  process.env.HS_MATH_IT_DB_NAME = HS_MATH_IT_DB_NAME
  assertSafeIntegrationDatabase(HS_MATH_IT_DB_NAME)

  const schemaPath = path.resolve(
    __dirname,
    '../../../../../db/hs_math_it_schema.sql',
  )
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema not found: ${schemaPath}`)
  }
  const sql = fs.readFileSync(schemaPath, 'utf8')

  console.log(
    `[IT-SETUP] connecting ${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT} (no default db)`,
  )
  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    multipleStatements: true,
  })

  try {
    // 禁止误连业务库写入：本脚本不 USE study_system
    await conn.query(sql)
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema=? AND table_name='hs_math_train_sessions'`,
      [HS_MATH_IT_DB_NAME],
    )
    const c = Number((rows as Array<{ c: number }>)[0]?.c || 0)
    if (c !== 1) throw new Error('schema apply failed: sessions table missing')
    console.log(`[IT-SETUP] OK database=${HS_MATH_IT_DB_NAME}`)
    console.log('Next: set HS_MATH_IT_DB_NAME=study_system_hs_math_it && pnpm --filter api run hs-math:it')
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error('[IT-SETUP] FAILED:', e instanceof Error ? e.message : e)
  console.error(
    '若无 CREATE 权限，请用管理员执行: mysql ... < db/hs_math_it_schema.sql',
  )
  process.exitCode = 1
})
