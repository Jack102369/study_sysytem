/**
 * APPLICATION-4C-4B：高一数学 DeepSeek 日额度（MySQL 原子扣减）。
 * 不修改通用 DeepseekClientService；仅本模块包装层使用。
 *
 * 注意：若进程在「扣减成功」与「HTTP 发出」之间崩溃，额度保守计入，绝不自动返还。
 */
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import { HS_MATH_DEEPSEEK_DAILY_LIMIT_ENV } from '../hs-math.constants'
import {
  HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
  parseDeepseekDailyLimit,
  shanghaiCalendarDate,
  type HsMathDeepseekQuotaConsumeResult,
} from '../util/hs-math-deepseek-daily-quota'

function extractMysqlAffectedRows(upd: unknown): number {
  if (upd && typeof upd === 'object' && 'affectedRows' in upd) {
    return Number((upd as { affectedRows: number }).affectedRows) || 0
  }
  if (Array.isArray(upd) && upd[0] && typeof upd[0] === 'object') {
    const h = upd[0] as { affectedRows?: number }
    if (typeof h.affectedRows === 'number') return h.affectedRows
  }
  return 0
}

@Injectable()
export class HsMathDeepseekDailyQuotaService {
  private readonly logger = new Logger(HsMathDeepseekDailyQuotaService.name)

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /** 解析配置上限；非法则 fail-closed（调用方应拒绝外发） */
  resolveConfiguredLimit():
    | { ok: true; limit: number }
    | { ok: false; reason: string } {
    const raw =
      this.config.get<string>(HS_MATH_DEEPSEEK_DAILY_LIMIT_ENV, '') || ''
    return parseDeepseekDailyLimit(raw)
  }

  /**
   * 预检：当日是否仍有额度（非原子；双阶段路径在 Qwen 前使用）。
   * 不能替代 tryConsumeAtomic。
   */
  async hasAvailableQuota(userId: string, now: Date = new Date()): Promise<{
    available: boolean
    reason?: string
    usedCount?: number
    dailyLimit?: number
    quotaDate: string
  }> {
    const quotaDate = shanghaiCalendarDate(now)
    const lim = this.resolveConfiguredLimit()
    if (!lim.ok) {
      return {
        available: false,
        reason: lim.reason,
        quotaDate,
      }
    }
    const uid = String(userId || '').trim()
    if (!uid) {
      return { available: false, reason: 'missing_user', quotaDate }
    }

    try {
      const rows: Array<{ used_count: number; daily_limit: number }> =
        await this.dataSource.query(
          `SELECT used_count, daily_limit
           FROM hs_math_deepseek_daily
           WHERE user_id = ? AND quota_date = ?
           LIMIT 1`,
          [uid, quotaDate],
        )
      if (!rows.length) {
        return {
          available: true,
          usedCount: 0,
          dailyLimit: lim.limit,
          quotaDate,
        }
      }
      const usedCount = Number(rows[0].used_count) || 0
      const dailyLimit = Number(rows[0].daily_limit) || lim.limit
      if (usedCount >= dailyLimit) {
        return {
          available: false,
          reason: HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
          usedCount,
          dailyLimit,
          quotaDate,
        }
      }
      return { available: true, usedCount, dailyLimit, quotaDate }
    } catch (e) {
      const msg = (e as Error).message || 'quota_error'
      this.logger.warn(`DeepSeek daily quota peek error: ${msg}`)
      return {
        available: false,
        reason: /doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)
          ? 'quota_table_missing'
          : 'quota_error',
        quotaDate,
      }
    }
  }

  /**
   * 在真实 DeepSeek HTTP 前原子扣减 1 次。
   * INSERT…ON DUPLICATE KEY + 条件 UPDATE；并发下不会突破 daily_limit。
   */
  async tryConsumeAtomic(
    userId: string,
    now: Date = new Date(),
  ): Promise<HsMathDeepseekQuotaConsumeResult> {
    const quotaDate = shanghaiCalendarDate(now)
    const lim = this.resolveConfiguredLimit()
    if (!lim.ok) {
      return { ok: false, reason: lim.reason, quotaDate }
    }
    const uid = String(userId || '').trim()
    if (!uid) {
      return { ok: false, reason: 'missing_user', quotaDate }
    }

    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()
    try {
      // 安全建当日行：唯一约束防重复；并发插入不抛致命错误
      await qr.query(
        `INSERT INTO hs_math_deepseek_daily
           (user_id, quota_date, used_count, daily_limit)
         VALUES (?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [uid, quotaDate, lim.limit],
      )

      // 行锁 + 条件递增
      await qr.query(
        `SELECT id FROM hs_math_deepseek_daily
         WHERE user_id = ? AND quota_date = ?
         FOR UPDATE`,
        [uid, quotaDate],
      )

      const upd = await qr.query(
        `UPDATE hs_math_deepseek_daily
         SET used_count = used_count + 1
         WHERE user_id = ? AND quota_date = ? AND used_count < daily_limit`,
        [uid, quotaDate],
      )
      const affected = extractMysqlAffectedRows(upd)

      const rows: Array<{ used_count: number; daily_limit: number }> =
        await qr.query(
          `SELECT used_count, daily_limit
           FROM hs_math_deepseek_daily
           WHERE user_id = ? AND quota_date = ?
           LIMIT 1`,
          [uid, quotaDate],
        )
      const usedCount = Number(rows[0]?.used_count) || 0
      const dailyLimit = Number(rows[0]?.daily_limit) || lim.limit

      if (!affected) {
        await qr.commitTransaction()
        return {
          ok: false,
          reason: HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
          usedCount,
          dailyLimit,
          quotaDate,
        }
      }

      await qr.commitTransaction()
      this.logger.warn(
        `DeepSeek daily quota consume user=${uid} date=${quotaDate} used=${usedCount}/${dailyLimit} (pre_http_conservative)`,
      )
      return {
        ok: true,
        usedCount,
        dailyLimit,
        quotaDate,
        note: 'consumed_before_http_conservative',
      }
    } catch (e) {
      await qr.rollbackTransaction()
      const msg = (e as Error).message || 'quota_error'
      this.logger.warn(`DeepSeek daily quota error: ${msg}`)
      // 表未迁移等：fail-closed，不外发
      return {
        ok: false,
        reason: /doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)
          ? 'quota_table_missing'
          : 'quota_error',
        quotaDate,
      }
    } finally {
      await qr.release()
    }
  }
}
