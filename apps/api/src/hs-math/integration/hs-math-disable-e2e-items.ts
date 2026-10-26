/**
 * 将确认的 E2E 测试题 status: approved → disabled。
 * 仅 ID 1–5 且 code 以 HS_MATH_P0_E2E_TEST 开头。
 */
import * as fs from 'fs'
import * as path from 'path'
import { createConnection } from 'mysql2/promise'

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  const p = path.join(__dirname, '../../../.env')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const ALLOWED = [
  { id: 1, code: 'HS_MATH_P0_E2E_TEST_single' },
  { id: 2, code: 'HS_MATH_P0_E2E_TEST_multi' },
  { id: 3, code: 'HS_MATH_P0_E2E_TEST_judge' },
  { id: 4, code: 'HS_MATH_P0_E2E_TEST_numeric' },
  { id: 5, code: 'HS_MATH_P0_E2E_TEST_single2' },
] as const

async function main() {
  const env = loadEnv()
  const c = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'study_system',
  })

  const ids = ALLOWED.map((x) => x.id)
  const [before] = await c.query(
    `SELECT id, code, status, is_active, stem, LEFT(CAST(answer_payload_json AS CHAR), 40) AS ans
     FROM hs_math_train_items
     WHERE id IN (?,?,?,?,?)
     ORDER BY id`,
    ids,
  )
  const rows = before as any[]

  if (rows.length !== 5) {
    throw new Error(`precheck fail: expected 5 rows, got ${rows.length}`)
  }

  for (const expect of ALLOWED) {
    const row = rows.find((r) => Number(r.id) === expect.id)
    if (!row) throw new Error(`missing id=${expect.id}`)
    if (row.code !== expect.code) {
      throw new Error(`id=${expect.id} code mismatch: ${row.code}`)
    }
    if (!String(row.code).startsWith('HS_MATH_P0_E2E_TEST')) {
      throw new Error(`id=${expect.id} code prefix fail`)
    }
    if (row.status !== 'approved') {
      throw new Error(`id=${expect.id} status=${row.status}, expect approved`)
    }
  }

  const chemBefore = (
    await c.query('SELECT COUNT(*) AS c FROM chem_specialties')
  )[0] as any
  const eqBefore = (
    await c.query('SELECT COUNT(*) AS c FROM error_questions')
  )[0] as any
  const sessBefore = (
    await c.query('SELECT COUNT(*) AS c FROM hs_math_train_sessions')
  )[0] as any

  // 显式 ID + code 条件；只改 status
  const [result] = await c.query(
    `UPDATE hs_math_train_items
     SET status = 'disabled'
     WHERE id IN (1,2,3,4,5)
       AND code IN (
         'HS_MATH_P0_E2E_TEST_single',
         'HS_MATH_P0_E2E_TEST_multi',
         'HS_MATH_P0_E2E_TEST_judge',
         'HS_MATH_P0_E2E_TEST_numeric',
         'HS_MATH_P0_E2E_TEST_single2'
       )
       AND code LIKE 'HS_MATH_P0_E2E_TEST%'
       AND status = 'approved'`,
  )
  const affected = Number((result as any).affectedRows || 0)

  const [after] = await c.query(
    `SELECT id, code, status, is_active
     FROM hs_math_train_items
     WHERE id IN (1,2,3,4,5)
     ORDER BY id`,
  )
  const afterRows = after as any[]

  const [pool] = await c.query(
    `SELECT COUNT(*) AS c FROM hs_math_train_items
     WHERE status='approved' AND is_active=1 AND pool='formal'`,
  )
  const [stillInPool] = await c.query(
    `SELECT id, code FROM hs_math_train_items
     WHERE id IN (1,2,3,4,5)
       AND status='approved' AND is_active=1`,
  )

  const chemAfter = (
    await c.query('SELECT COUNT(*) AS c FROM chem_specialties')
  )[0] as any
  const eqAfter = (
    await c.query('SELECT COUNT(*) AS c FROM error_questions')
  )[0] as any
  const sessAfter = (
    await c.query('SELECT COUNT(*) AS c FROM hs_math_train_sessions')
  )[0] as any

  // stem/answer 未变：抽查 id=1
  const [spot] = await c.query(
    `SELECT stem, LEFT(CAST(answer_payload_json AS CHAR), 40) AS ans
     FROM hs_math_train_items WHERE id=1`,
  )
  const spotRow = (spot as any[])[0]
  const stemOk = spotRow.stem === rows.find((r) => Number(r.id) === 1)!.stem
  const ansOk = spotRow.ans === rows.find((r) => Number(r.id) === 1)!.ans

  console.log(
    JSON.stringify(
      {
        affectedRows: affected,
        after: afterRows,
        allDisabled: afterRows.every((r) => r.status === 'disabled'),
        isActiveUnchanged: afterRows.every((r) => Number(r.is_active) === 1),
        formalApprovedActivePool: Number((pool as any[])[0].c),
        testIdsStillInApprovedPool: stillInPool,
        stemUnchanged: stemOk,
        answerUnchanged: ansOk,
        chem_specialties: `${chemBefore[0].c}->${chemAfter[0].c}`,
        error_questions: `${eqBefore[0].c}->${eqAfter[0].c}`,
        hs_math_train_sessions: `${sessBefore[0].c}->${sessAfter[0].c}`,
      },
      null,
      2,
    ),
  )

  if (affected !== 5) throw new Error(`expected 5 affected, got ${affected}`)
  if (!afterRows.every((r) => r.status === 'disabled')) {
    throw new Error('not all disabled')
  }

  await c.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
