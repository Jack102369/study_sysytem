/**
 * APPLICATION-4C-4C：真实 MySQL 日额度原子扣减验收。
 * 仅写 hs_math_deepseek_daily；使用隔离测试日期；结束精确清理。
 * 禁止真实 Qwen/DeepSeek HTTP；禁止改训练/题库。
 *
 * 运行：pnpm --filter api run hs-math:application4c4c-mysql-quota-it
 */
import assert from 'node:assert/strict'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import { HsMathDeepseekDaily } from '../entities/hs-math-deepseek-daily.entity'
import { HsMathDeepseekDailyQuotaService } from '../train/hs-math-deepseek-daily-quota.service'
import {
  HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
  shanghaiCalendarDate,
} from '../util/hs-math-deepseek-daily-quota'
import { loadApiEnv } from './hs-math-it.safety'

const USER_ID = '2'
/** 隔离测试日：远未来，避免碰真实当天额度 */
const TEST_DATE_A = '2099-06-01'
const TEST_DATE_B = '2099-06-02'
/** 对应 Asia/Shanghai 的 UTC 时刻 */
const NOW_A = new Date('2099-05-31T16:00:00.000Z') // → 2099-06-01
const NOW_B = new Date('2099-06-01T16:00:00.000Z') // → 2099-06-02
const MARK = 'APPLICATION-4C-4C'

let n = 0
function ok(name: string) {
  n += 1
  console.log('OK', name)
}

function loadEnv() {
  const env = loadApiEnv()
  assert.equal(env.DB_NAME || process.env.DB_NAME, 'study_system')
  assert.notEqual(
    String(env.HS_MATH_AI_GRADING_ENABLED || '').toLowerCase(),
    'true',
  )
  assert.notEqual(
    String(env.HS_MATH_VISION_GRADING_ENABLED || '').toLowerCase(),
    'true',
  )
  const mode = String(env.HS_MATH_APPLICATION_AI_MODE || '')
    .trim()
    .toLowerCase()
  assert.ok(!mode || mode === 'disabled', `MODE must be disabled, got ${mode}`)
  return env
}

async function createDs(env: Record<string, string>) {
  const ds = new DataSource({
    type: 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    username: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: 'study_system',
    entities: [HsMathDeepseekDaily],
    synchronize: false,
  })
  await ds.initialize()
  assert.equal(ds.options.database, 'study_system')
  assert.equal(ds.options.synchronize, false)
  return ds
}

function makeService(ds: DataSource) {
  const config = {
    get: (_key: string, def?: string) => def ?? '',
  } as ConfigService
  return new HsMathDeepseekDailyQuotaService(ds, config)
}

async function snapshotRows(ds: DataSource) {
  const rows: Array<{
    id: string
    user_id: string
    quota_date: string
    used_count: number
    daily_limit: number
  }> = await ds.query(
    `SELECT id, user_id, DATE_FORMAT(quota_date,'%Y-%m-%d') AS quota_date,
            used_count, daily_limit
     FROM hs_math_deepseek_daily
     ORDER BY id`,
  )
  return rows
}

async function deleteTestRows(ds: DataSource, ids: string[]) {
  if (!ids.length) return 0
  const ph = ids.map(() => '?').join(',')
  const r = await ds.query(
    `DELETE FROM hs_math_deepseek_daily
     WHERE id IN (${ph}) AND user_id = ? AND quota_date IN (?, ?)`,
    [...ids, USER_ID, TEST_DATE_A, TEST_DATE_B],
  )
  return Number(r?.affectedRows ?? 0)
}

async function main() {
  console.log(`[${MARK}] start real MySQL quota IT`)
  const env = loadEnv()
  assert.equal(shanghaiCalendarDate(NOW_A), TEST_DATE_A)
  assert.equal(shanghaiCalendarDate(NOW_B), TEST_DATE_B)
  ok('shanghai mapping for test dates')

  const ds1 = await createDs(env)
  const before = await snapshotRows(ds1)
  console.log(`[${MARK}] pre-existing quota rows=${before.length}`)

  const createdIds = new Set<string>()
  const track = async () => {
    const rows: Array<{ id: string }> = await ds1.query(
      `SELECT id FROM hs_math_deepseek_daily
       WHERE user_id = ? AND quota_date IN (?, ?)`,
      [USER_ID, TEST_DATE_A, TEST_DATE_B],
    )
    for (const r of rows) createdIds.add(String(r.id))
  }

  try {
    const svc = makeService(ds1)

    // 1 空记录首次创建 + 2 used=0 扣减
    {
      const r = await svc.tryConsumeAtomic(USER_ID, NOW_A)
      assert.equal(r.ok, true)
      if (r.ok) {
        assert.equal(r.quotaDate, TEST_DATE_A)
        assert.equal(r.usedCount, 1)
        assert.equal(r.dailyLimit, 20)
      }
      await track()
      ok('1+2 first create & consume used=1')
    }

    // 重置 A 行到 19 测 19→20，再用并发测最后一档
    await ds1.query(
      `UPDATE hs_math_deepseek_daily SET used_count = 0
       WHERE user_id = ? AND quota_date = ?`,
      [USER_ID, TEST_DATE_A],
    )

    // 顺序扣满到 19
    for (let i = 0; i < 19; i++) {
      const r = await svc.tryConsumeAtomic(USER_ID, NOW_A)
      assert.equal(r.ok, true)
    }
    {
      const rows = await ds1.query(
        `SELECT used_count FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?`,
        [USER_ID, TEST_DATE_A],
      )
      assert.equal(Number(rows[0].used_count), 19)
      ok('3 19/20 state')
    }

    // 19→20 成功
    {
      const r = await svc.tryConsumeAtomic(USER_ID, NOW_A)
      assert.equal(r.ok, true)
      if (r.ok) assert.equal(r.usedCount, 20)
      ok('3b 19/20 consume → 20')
    }

    // 20/20 拒绝
    {
      const r = await svc.tryConsumeAtomic(USER_ID, NOW_A)
      assert.equal(r.ok, false)
      if (!r.ok) {
        assert.equal(r.reason, HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED)
        assert.equal(r.usedCount, 20)
      }
      const rows = await ds1.query(
        `SELECT used_count FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?`,
        [USER_ID, TEST_DATE_A],
      )
      assert.equal(Number(rows[0].used_count), 20)
      ok('4 20/20 reject; used stays 20')
    }

    // 5：重置后 20 并发最多成功 20
    await ds1.query(
      `UPDATE hs_math_deepseek_daily SET used_count = 0
       WHERE user_id = ? AND quota_date = ?`,
      [USER_ID, TEST_DATE_A],
    )
    {
      const results = await Promise.all(
        Array.from({ length: 20 }, () => svc.tryConsumeAtomic(USER_ID, NOW_A)),
      )
      const success = results.filter((r) => r.ok).length
      assert.equal(success, 20)
      const rows = await ds1.query(
        `SELECT used_count FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?`,
        [USER_ID, TEST_DATE_A],
      )
      assert.equal(Number(rows[0].used_count), 20)
      assert.ok(Number(rows[0].used_count) <= 20)
      assert.ok(Number(rows[0].used_count) >= 0)
      ok('5 concurrent 20 → exactly 20')
    }

    // 6：最后一个额度并发争抢仅成功 1
    await ds1.query(
      `UPDATE hs_math_deepseek_daily SET used_count = 19
       WHERE user_id = ? AND quota_date = ?`,
      [USER_ID, TEST_DATE_A],
    )
    {
      const results = await Promise.all(
        Array.from({ length: 8 }, () => svc.tryConsumeAtomic(USER_ID, NOW_A)),
      )
      const success = results.filter((r) => r.ok).length
      const failed = results.filter((r) => !r.ok).length
      assert.equal(success, 1)
      assert.equal(failed, 7)
      const rows = await ds1.query(
        `SELECT used_count FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?`,
        [USER_ID, TEST_DATE_A],
      )
      assert.equal(Number(rows[0].used_count), 20)
      ok('6 last-slot race success=1')
    }

    // 7 UNIQUE
    {
      let dupErr = false
      try {
        await ds1.query(
          `INSERT INTO hs_math_deepseek_daily
             (user_id, quota_date, used_count, daily_limit)
           VALUES (?, ?, 0, 20)`,
          [USER_ID, TEST_DATE_A],
        )
      } catch (e) {
        dupErr = /Duplicate|ER_DUP_ENTRY/i.test((e as Error).message)
      }
      assert.equal(dupErr, true)
      ok('7 UNIQUE(user_id,quota_date)')
    }

    // 8 跨连接持久化
    {
      const ds2 = await createDs(env)
      try {
        const rows = await ds2.query(
          `SELECT used_count, daily_limit,
                  DATE_FORMAT(quota_date,'%Y-%m-%d') AS quota_date
           FROM hs_math_deepseek_daily
           WHERE user_id = ? AND quota_date = ?`,
          [USER_ID, TEST_DATE_A],
        )
        assert.equal(Number(rows[0].used_count), 20)
        assert.equal(String(rows[0].quota_date), TEST_DATE_A)
        ok('8 cross-connection persistence')
      } finally {
        await ds2.destroy()
      }
    }

    // 9–11 跨日独立 + UTC→上海
    {
      const r = await svc.tryConsumeAtomic(USER_ID, NOW_B)
      assert.equal(r.ok, true)
      if (r.ok) {
        assert.equal(r.quotaDate, TEST_DATE_B)
        assert.equal(r.usedCount, 1)
      }
      const a = await ds1.query(
        `SELECT used_count FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?`,
        [USER_ID, TEST_DATE_A],
      )
      const b = await ds1.query(
        `SELECT used_count FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?`,
        [USER_ID, TEST_DATE_B],
      )
      assert.equal(Number(a[0].used_count), 20)
      assert.equal(Number(b[0].used_count), 1)
      await track()
      ok('9-11 cross-day independent + UTC mapping')
    }

    // 12 事务回滚
    {
      const qr = ds1.createQueryRunner()
      await qr.connect()
      await qr.startTransaction()
      try {
        await qr.query(
          `UPDATE hs_math_deepseek_daily SET used_count = 99
           WHERE user_id = ? AND quota_date = ?`,
          [USER_ID, TEST_DATE_B],
        )
        await qr.rollbackTransaction()
      } finally {
        await qr.release()
      }
      const rows = await ds1.query(
        `SELECT used_count FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?`,
        [USER_ID, TEST_DATE_B],
      )
      assert.equal(Number(rows[0].used_count), 1)
      assert.ok(Number(rows[0].used_count) >= 0)
      ok('12 txn rollback; no negative / no leak 99')
    }

    // 13–14 再次确认不超限、非负
    {
      const rows = await ds1.query(
        `SELECT used_count, daily_limit FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date IN (?, ?)`,
        [USER_ID, TEST_DATE_A, TEST_DATE_B],
      )
      for (const row of rows) {
        assert.ok(Number(row.used_count) >= 0)
        assert.ok(Number(row.used_count) <= Number(row.daily_limit))
        assert.ok(Number(row.used_count) <= 20)
      }
      ok('13-14 no negative / no over 20')
    }

    await track()
  } finally {
    // 15 精确清理本轮测试行
    const ids = [...createdIds]
    const del = await deleteTestRows(ds1, ids)
    console.log(`[${MARK}] cleaned ids=${ids.join(',') || '(none)'} deleted≈${del}`)

    const leftover = await ds1.query(
      `SELECT id FROM hs_math_deepseek_daily
       WHERE user_id = ? AND quota_date IN (?, ?)`,
      [USER_ID, TEST_DATE_A, TEST_DATE_B],
    )
    assert.equal(leftover.length, 0)

    const after = await snapshotRows(ds1)
    assert.equal(
      after.length,
      before.length,
      `quota row count drift before=${before.length} after=${after.length}`,
    )
    const beforeMap = new Map(before.map((r) => [String(r.id), r]))
    for (const row of after) {
      const prev = beforeMap.get(String(row.id))
      assert.ok(prev, `unexpected leftover id=${row.id}`)
      assert.equal(Number(row.used_count), Number(prev.used_count))
      assert.equal(String(row.quota_date), String(prev.quota_date))
    }
    ok('15 cleanup exact; other rows unchanged')

    // 训练/题库未改（只读计数快照）
    const sess = await ds1.query(
      `SELECT COUNT(*) AS c FROM hs_math_train_sessions`,
    )
    const items = await ds1.query(
      `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE status='approved'`,
    )
    console.log(
      `[${MARK}] sessions=${sess[0].c} approved_items=${items[0].c} (read-only check)`,
    )

    await ds1.destroy()
  }

  console.log(`\n[${MARK}] PASS ${n} checks`)
}

main().catch((e) => {
  console.error(`[${MARK}] FAIL`, e)
  process.exit(1)
})
