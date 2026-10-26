/**
 * APPLICATION-4C-4D：启用后安全核验（无真实 AI HTTP）。
 */
import assert from 'node:assert/strict'
import { DataSource } from 'typeorm'
import { resolveApplicationAiAccess } from '../util/hs-math-application-ai-owner-scope'
import { parseDeepseekDailyLimit } from '../util/hs-math-deepseek-daily-quota'
import { loadApiEnv } from './hs-math-it.safety'

const MARK = 'APPLICATION-4C-4D-POST'
let n = 0
function ok(name: string) {
  n += 1
  console.log('OK', name)
}

async function main() {
  const env = loadApiEnv()
  assert.equal(env.DB_NAME, 'study_system')
  assert.equal(String(env.HS_MATH_APPLICATION_AI_MODE || '').toLowerCase(), 'owner_only')
  assert.equal(String(env.HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS || '').trim(), '2')
  assert.ok(
    ['true', '1'].includes(
      String(env.HS_MATH_VISION_GRADING_ENABLED || '').toLowerCase(),
    ),
  )
  assert.ok(
    ['true', '1'].includes(
      String(env.HS_MATH_AI_GRADING_ENABLED || '').toLowerCase(),
    ),
  )
  const lim = parseDeepseekDailyLimit(env.HS_MATH_DEEPSEEK_DAILY_LIMIT || '20')
  assert.equal(lim.ok, true)
  if (lim.ok) assert.equal(lim.limit, 20)
  assert.equal(String(env.HS_MATH_VISION_GRADING_TEST_USER_ID || '').trim(), '')
  assert.equal(String(env.HS_MATH_VISION_GRADING_TEST_SESSION_IDS || '').trim(), '')
  assert.equal(
    String(env.HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS || '').trim(),
    '',
  )
  ok('env owner_only + allowlist=2 + switches + limit20 + no TEST allowlist')

  const d2 = resolveApplicationAiAccess(
    {
      modeRaw: env.HS_MATH_APPLICATION_AI_MODE || '',
      allowedUserIdsRaw: env.HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS || '',
      outboundEnabled: true,
      testUserId: '',
      testSessionIdsRaw: '',
    },
    '2',
    '999999',
  )
  assert.equal(d2.allowed, true)
  assert.equal(d2.reason, 'ok_owner_only')
  ok('user2 dynamic session allowed')

  const d3 = resolveApplicationAiAccess(
    {
      modeRaw: env.HS_MATH_APPLICATION_AI_MODE || '',
      allowedUserIdsRaw: env.HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS || '',
      outboundEnabled: true,
      testUserId: '',
      testSessionIdsRaw: '',
    },
    '3',
    '999999',
  )
  assert.equal(d3.allowed, false)
  assert.equal(d3.reason, 'user_not_owner')
  ok('user3 denied (no outbound for non-owner)')

  const ds = new DataSource({
    type: 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    username: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: 'study_system',
    synchronize: false,
  })
  await ds.initialize()
  try {
    const tables = await ds.query(
      `SHOW TABLES LIKE 'hs_math_deepseek_daily'`,
    )
    assert.equal(tables.length, 1)
    const rows = await ds.query(`SELECT COUNT(*) AS c FROM hs_math_deepseek_daily`)
    console.log(`[${MARK}] quota_rows=${rows[0].c}`)
    ok('quota table readable')

    const sess = await ds.query(
      `SELECT id, status FROM hs_math_train_sessions WHERE id IN (124,125,126) ORDER BY id`,
    )
    assert.equal(sess.length, 3)
    assert.ok(sess.every((s: { status: string }) => s.status === 'completed'))
    ok('sessions 124/125/126 still completed')
  } finally {
    await ds.destroy()
  }

  console.log(`\n[${MARK}] PASS ${n}`)
}

main().catch((e) => {
  console.error(`[${MARK}] FAIL`, e)
  process.exit(1)
})
