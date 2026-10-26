import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { HsMathTrainSession } from '../entities/hs-math-train-session.entity'
import { accuracyRatio } from '../util/accuracy'
import {
  eachShanghaiDateInclusive,
  shanghaiDateMinusDays,
  shanghaiDateString,
} from '../util/shanghai-date'

@Injectable()
export class HsMathAnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HsMathTrainSession)
    private readonly sessionsRepo: Repository<HsMathTrainSession>,
  ) {}

  async getAnalytics(userId: string) {
    const overview = await this.loadOverview(userId)
    const bySpecialty = await this.loadBySpecialty(userId)
    const byDifficulty = await this.loadByDifficulty(userId)
    const trend7d = await this.loadDailyTrend(userId, 7)
    const trend30d = await this.loadDailyTrend(userId, 30)

    return {
      overview,
      bySpecialty,
      byDifficulty,
      trend7d,
      trend30d,
      notes: {
        accuracy:
          'accuracy = correctCount / (correctCount + wrongCount)；pending 不计分母；非 mastery',
        timezone: 'Asia/Shanghai 自然日；趋势按 submitted_at',
        difficulty: '使用 session_items.difficulty 快照，不依赖题库当前难度',
        specialty: '章节统计使用会话 specialty_id（创建时归属），不随题库改章漂移',
      },
    }
  }

  async loadOverview(userId: string) {
    const row = (
      await this.dataSource.query(
        `SELECT
           COUNT(*) AS completedSessions,
           COALESCE(SUM(s.actual_count), 0) AS totalQuestions,
           COALESCE(SUM(s.correct_count), 0) AS correctCount,
           COALESCE(SUM(s.wrong_count), 0) AS wrongCount,
           COALESCE(SUM(s.pending_count), 0) AS pendingCount,
           COALESCE(SUM(s.duration_ms), 0) AS totalDurationMs,
           MAX(s.submitted_at) AS lastTrainingAt
         FROM hs_math_train_sessions s
         WHERE s.user_id = ?
           AND s.status = 'completed'`,
        [userId],
      )
    )[0] as Record<string, unknown>

    const correctCount = Number(row.correctCount) || 0
    const wrongCount = Number(row.wrongCount) || 0
    return {
      completedSessions: Number(row.completedSessions) || 0,
      totalQuestions: Number(row.totalQuestions) || 0,
      correctCount,
      wrongCount,
      pendingCount: Number(row.pendingCount) || 0,
      accuracy: accuracyRatio(correctCount, wrongCount),
      totalDurationMs: Number(row.totalDurationMs) || 0,
      lastTrainingAt: row.lastTrainingAt ?? null,
    }
  }

  async loadBySpecialty(userId: string) {
    const rows: Array<Record<string, unknown>> = await this.dataSource.query(
      `SELECT
         s.specialty_id AS specialtyId,
         sp.code AS specialtyCode,
         sp.name AS specialtyName,
         COUNT(*) AS sessionCount,
         COALESCE(SUM(s.actual_count), 0) AS questionCount,
         COALESCE(SUM(s.correct_count), 0) AS correctCount,
         COALESCE(SUM(s.wrong_count), 0) AS wrongCount,
         COALESCE(SUM(s.pending_count), 0) AS pendingCount
       FROM hs_math_train_sessions s
       LEFT JOIN hs_math_specialties sp ON sp.id = s.specialty_id
       WHERE s.user_id = ?
         AND s.status = 'completed'
       GROUP BY s.specialty_id, sp.code, sp.name
       ORDER BY sp.sort_order ASC, s.specialty_id ASC`,
      [userId],
    )

    return rows.map((r) => {
      const correctCount = Number(r.correctCount) || 0
      const wrongCount = Number(r.wrongCount) || 0
      return {
        specialtyId: String(r.specialtyId),
        specialtyCode: r.specialtyCode ? String(r.specialtyCode) : null,
        specialtyName: r.specialtyName ? String(r.specialtyName) : null,
        sessionCount: Number(r.sessionCount) || 0,
        questionCount: Number(r.questionCount) || 0,
        correctCount,
        wrongCount,
        pendingCount: Number(r.pendingCount) || 0,
        accuracy: accuracyRatio(correctCount, wrongCount),
      }
    })
  }

  /**
   * 难度统计：仅用 session_items.difficulty 快照；
   * difficulty IS NULL 的题目单独归入 unknown（不回落题库当前难度）。
   */
  async loadByDifficulty(userId: string) {
    const rows: Array<Record<string, unknown>> = await this.dataSource.query(
      `SELECT
         i.difficulty AS difficulty,
         COUNT(*) AS questionCount,
         SUM(CASE WHEN i.grade_result = 'correct' THEN 1 ELSE 0 END) AS correctCount,
         SUM(CASE WHEN i.grade_result = 'wrong' THEN 1 ELSE 0 END) AS wrongCount,
         SUM(CASE WHEN i.grade_result IN (
           'pending_review','pending_ai','grading','review_required','grading_failed'
         ) THEN 1 ELSE 0 END) AS pendingCount
       FROM hs_math_train_session_items i
       INNER JOIN hs_math_train_sessions s ON s.id = i.session_id
       WHERE s.user_id = ?
         AND s.status = 'completed'
       GROUP BY i.difficulty
       ORDER BY (i.difficulty IS NULL) ASC, i.difficulty ASC`,
      [userId],
    )

    return rows.map((r) => {
      const correctCount = Number(r.correctCount) || 0
      const wrongCount = Number(r.wrongCount) || 0
      return {
        difficulty: r.difficulty === null || r.difficulty === undefined
          ? null
          : Number(r.difficulty),
        questionCount: Number(r.questionCount) || 0,
        correctCount,
        wrongCount,
        pendingCount: Number(r.pendingCount) || 0,
        accuracy: accuracyRatio(correctCount, wrongCount),
      }
    })
  }

  async loadDailyTrend(userId: string, days: 7 | 30) {
    const today = shanghaiDateString()
    const start = shanghaiDateMinusDays(days - 1)
    const calendar = eachShanghaiDateInclusive(start, today)

    // 用 CONVERT_TZ 把 submitted_at 转到上海日历日（假设列存 UTC 或会话时区与服务器一致时仍用显式偏移）
    // MySQL：DATE(CONVERT_TZ(submitted_at, @@session.time_zone, '+08:00'))
    // 更稳：在应用侧用 shanghaiDateString 聚合，避免依赖 MySQL timezone 表
    const sessions = await this.sessionsRepo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })
      .andWhere("s.status = 'completed'")
      .andWhere('s.submitted_at IS NOT NULL')
      .getMany()

    type Acc = {
      sessionCount: number
      questionCount: number
      correctCount: number
      wrongCount: number
      pendingCount: number
    }
    const map = new Map<string, Acc>()
    for (const d of calendar) {
      map.set(d, {
        sessionCount: 0,
        questionCount: 0,
        correctCount: 0,
        wrongCount: 0,
        pendingCount: 0,
      })
    }

    for (const s of sessions) {
      if (!s.submittedAt) continue
      const day = shanghaiDateString(new Date(s.submittedAt))
      if (day < start || day > today) continue
      const acc = map.get(day)
      if (!acc) continue
      acc.sessionCount += 1
      acc.questionCount += Number(s.actualCount) || 0
      acc.correctCount += Number(s.correctCount) || 0
      acc.wrongCount += Number(s.wrongCount) || 0
      acc.pendingCount += Number(s.pendingCount) || 0
    }

    return calendar.map((date) => {
      const a = map.get(date)!
      return {
        date,
        sessionCount: a.sessionCount,
        questionCount: a.questionCount,
        correctCount: a.correctCount,
        wrongCount: a.wrongCount,
        pendingCount: a.pendingCount,
        accuracy: accuracyRatio(a.correctCount, a.wrongCount),
      }
    })
  }
}
