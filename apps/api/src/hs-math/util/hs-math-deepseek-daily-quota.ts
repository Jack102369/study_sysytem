/**
 * APPLICATION-4C-4B：DeepSeek 日额度纯函数 + 内存 stub（非真实 MySQL 原子性验收）。
 */

export const HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED =
  'deepseek_daily_quota_exceeded' as const

export const HS_MATH_DEEPSEEK_DAILY_LIMIT_DEFAULT = 20

export type HsMathDeepseekDailyLimitParse =
  | { ok: true; limit: number }
  | { ok: false; reason: string }

export type HsMathDeepseekQuotaConsumeResult =
  | {
      ok: true
      usedCount: number
      dailyLimit: number
      quotaDate: string
      /** 扣减成功但尚未确认 HTTP 已发出时的保守计入说明 */
      note?: string
    }
  | {
      ok: false
      reason: string
      usedCount?: number
      dailyLimit?: number
      quotaDate?: string
    }

/** Asia/Shanghai 日历日 YYYY-MM-DD（正确处理 UTC 换算） */
export function shanghaiCalendarDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * 解析日上限。空/缺省 → 20。
 * 拒绝：0、负数、非整数、NaN、Infinity。
 */
export function parseDeepseekDailyLimit(
  raw: string | null | undefined,
): HsMathDeepseekDailyLimitParse {
  const t = String(raw ?? '').trim()
  if (!t) {
    return { ok: true, limit: HS_MATH_DEEPSEEK_DAILY_LIMIT_DEFAULT }
  }
  if (!/^\d+$/.test(t)) {
    return { ok: false, reason: 'daily_limit_invalid' }
  }
  const n = Number(t)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    return { ok: false, reason: 'daily_limit_invalid' }
  }
  // 防止异常大数被当成「无限」；硬顶 10_000
  if (n > 10_000) {
    return { ok: false, reason: 'daily_limit_invalid' }
  }
  return { ok: true, limit: n }
}

/** 预检：used < limit 才视为可用（不扣减） */
export function isDeepseekQuotaAvailable(used: number, limit: number): boolean {
  if (!Number.isFinite(used) || !Number.isFinite(limit)) return false
  if (limit < 1) return false
  return used < limit
}

/**
 * 内存日额度（stub / 单测）。
 * 用互斥队列模拟「条件 UPDATE」原子性；不得冒充真实 MySQL 验收。
 */
export class InMemoryDeepseekDailyQuota {
  private readonly rows = new Map<
    string,
    { usedCount: number; dailyLimit: number }
  >()
  private chain: Promise<void> = Promise.resolve()

  private key(userId: string, quotaDate: string) {
    return `${userId}|${quotaDate}`
  }

  private withLock<T>(fn: () => T | Promise<T>): Promise<T> {
    const run = this.chain.then(fn, fn)
    this.chain = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  peek(
    userId: string,
    quotaDate: string,
    limit: number,
  ): { usedCount: number; dailyLimit: number; available: boolean } {
    const row = this.rows.get(this.key(userId, quotaDate))
    const usedCount = row?.usedCount ?? 0
    const dailyLimit = row?.dailyLimit ?? limit
    return {
      usedCount,
      dailyLimit,
      available: isDeepseekQuotaAvailable(usedCount, dailyLimit),
    }
  }

  async tryConsume(params: {
    userId: string
    quotaDate: string
    dailyLimit: number
  }): Promise<HsMathDeepseekQuotaConsumeResult> {
    return this.withLock(() => {
      if (!params.dailyLimit || params.dailyLimit < 1) {
        return {
          ok: false as const,
          reason: 'daily_limit_invalid',
          quotaDate: params.quotaDate,
        }
      }
      const k = this.key(params.userId, params.quotaDate)
      let row = this.rows.get(k)
      if (!row) {
        row = { usedCount: 0, dailyLimit: params.dailyLimit }
        this.rows.set(k, row)
      }
      if (row.usedCount >= row.dailyLimit) {
        return {
          ok: false as const,
          reason: HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
          usedCount: row.usedCount,
          dailyLimit: row.dailyLimit,
          quotaDate: params.quotaDate,
        }
      }
      row.usedCount += 1
      return {
        ok: true as const,
        usedCount: row.usedCount,
        dailyLimit: row.dailyLimit,
        quotaDate: params.quotaDate,
        note: 'consumed_before_http_conservative',
      }
    })
  }

  /** 并发争抢：返回成功次数 */
  async raceConsume(params: {
    userId: string
    quotaDate: string
    dailyLimit: number
    concurrent: number
  }): Promise<{ success: number; failed: number }> {
    const results = await Promise.all(
      Array.from({ length: params.concurrent }, () =>
        this.tryConsume({
          userId: params.userId,
          quotaDate: params.quotaDate,
          dailyLimit: params.dailyLimit,
        }),
      ),
    )
    const success = results.filter((r) => r.ok).length
    return { success, failed: results.length - success }
  }
}
