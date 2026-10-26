/**
 * 只读：审计 hs_math_train_items 中的自动化测试题。
 * 不写库。运行：pnpm --filter api exec ts-node --transpile-only src/hs-math/integration/hs-math-audit-test-items.ts
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

async function main() {
  const env = loadEnv()
  const c = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'study_system',
  })

  const markers = [
    'HS_MATH_P0_E2E_TEST',
    'HS_MATH_P0_6',
    'HS_MATH_P0_',
    'HS_MATH_IT',
    'P0_E2E',
  ]

  const likeSql = markers
    .map(
      () =>
        '(i.code LIKE ? OR i.stem LIKE ? OR IFNULL(CAST(i.analysis AS CHAR), "") LIKE ?)',
    )
    .join(' OR ')
  const params: string[] = []
  for (const m of markers) {
    const x = `%${m}%`
    params.push(x, x, x)
  }

  const [matched] = await c.query(
    `SELECT
       i.id,
       i.code,
       i.qtype,
       i.status,
       i.is_active AS isActive,
       i.pool,
       i.difficulty,
       s.code AS specialtyCode,
       s.name AS specialtyName,
       cat.code AS categoryCode,
       cat.name AS categoryName,
       LEFT(i.stem, 100) AS stemPreview
     FROM hs_math_train_items i
     LEFT JOIN hs_math_specialties s ON s.id = i.specialty_id
     LEFT JOIN hs_math_categories cat ON cat.id = i.category_id
     WHERE ${likeSql}
     ORDER BY i.id`,
    params,
  )

  const [approvedActive] = await c.query(
    `SELECT
       i.id,
       i.code,
       i.qtype,
       i.status,
       i.is_active AS isActive,
       i.pool,
       s.name AS specialtyName,
       cat.name AS categoryName,
       LEFT(i.stem, 100) AS stemPreview
     FROM hs_math_train_items i
     LEFT JOIN hs_math_specialties s ON s.id = i.specialty_id
     LEFT JOIN hs_math_categories cat ON cat.id = i.category_id
     WHERE i.status = 'approved' AND i.is_active = 1
     ORDER BY i.id`,
  )

  const [statusCounts] = await c.query(
    `SELECT status, COUNT(*) AS c FROM hs_math_train_items GROUP BY status`,
  )

  const [formalPool] = await c.query(
    `SELECT COUNT(*) AS c FROM hs_math_train_items
     WHERE status='approved' AND is_active=1 AND pool='formal'`,
  )

  // 明显测试题且仍 approved
  const approvedTest = (matched as any[]).filter(
    (r) => r.status === 'approved' && Number(r.isActive) === 1,
  )

  const report = {
    database: env.DB_NAME || 'study_system',
    readOnly: true,
    matchedTestLikeCount: (matched as any[]).length,
    matchedTestLike: matched,
    approvedActiveTestLike: approvedTest,
    approvedActiveTestLikeCount: approvedTest.length,
    allApprovedActiveCount: (approvedActive as any[]).length,
    allApprovedActive: approvedActive,
    statusCounts,
    formalApprovedActive: Number((formalPool as any[])[0].c),
    proposedDisableIds: approvedTest.map((r) => String(r.id)),
  }

  console.log(JSON.stringify(report, null, 2))
  await c.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
