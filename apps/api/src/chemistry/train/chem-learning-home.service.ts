import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemAdvancedTrainService } from './chem-advanced-train.service'
import { ChemDailyReviewService } from './chem-daily-review.service'
import { ChemTrainEligibilityService } from './chem-train-eligibility.service'
import { ChemWrongQuestionService } from './chem-wrong-question.service'
import { ChemTrainSession } from './entities/chem-train-session.entity'
import { ChemWrongItem } from './entities/chem-wrong-item.entity'
import { shanghaiDateMinusDays, shanghaiDateString } from './shanghai-date.util'

@Injectable()
export class ChemLearningHomeService {
  constructor(
    private readonly daily: ChemDailyReviewService,
    private readonly wrong: ChemWrongQuestionService,
    private readonly advanced: ChemAdvancedTrainService,
    private readonly eligibility: ChemTrainEligibilityService,
    @InjectRepository(ChemTrainSession)
    private readonly sessionsRepo: Repository<ChemTrainSession>,
    @InjectRepository(ChemWrongItem)
    private readonly wrongRepo: Repository<ChemWrongItem>,
    @InjectRepository(ChemSpecialty)
    private readonly specialtiesRepo: Repository<ChemSpecialty>,
    private readonly dataSource: DataSource,
  ) {}

  async getHome(userId: string) {
    const today = shanghaiDateString()
    const day6Ago = shanghaiDateMinusDays(6) // 含今天共 7 个自然日

    const [dailyStatus, wrongSummary, activityToday, activity7d, recommend] =
      await Promise.all([
        this.daily.status(userId),
        this.wrong.summary(userId),
        this.activityStats(userId, today, today),
        this.activityStats(userId, day6Ago, today),
        this.recommendAdvanced(userId),
      ])

    const rows = await this.wrongRepo.find({ where: { userId } })
    let consolidatingDueToday = 0
    for (const r of rows) {
      if (r.status === 'consolidating' && this.wrong.isDueToday(r)) {
        consolidatingDueToday++
      }
    }

    const dailyPhase =
      dailyStatus.inProgressSessionId
        ? 'in_progress'
        : dailyStatus.todayCompletedOnce
          ? 'completed'
          : 'not_started'

    return {
      timezone: 'Asia/Shanghai',
      today,
      title: '今天的化学学习',
      daily: {
        ...dailyStatus,
        phase: dailyPhase as 'not_started' | 'in_progress' | 'completed',
      },
      wrong: {
        openCount: wrongSummary.openCount,
        consolidatingCount: wrongSummary.consolidatingCount,
        consolidatingDueTodayCount: consolidatingDueToday,
        masteredCount: wrongSummary.masteredCount,
        dueTodayCount: wrongSummary.dueTodayCount,
        recentNewCount: wrongSummary.recentNewCount,
        topWeakSpecialties: wrongSummary.topWeakSpecialties,
        rules: wrongSummary.rules,
      },
      activityToday: {
        ...activityToday,
        note: '仅统计已提交会话；正确率分母=明确 correct+wrong；pending_review 不计入正确率',
      },
      activity7d: {
        ...activity7d,
        windowStart: day6Ago,
        windowEnd: today,
        windowNote: '含今天共 7 个 Asia/Shanghai 自然日',
        masteredWrongItemsLabel: '当前已掌握错题',
        masteredWrongItems: wrongSummary.masteredCount,
        newWrongItems: await this.countNewWrongInWindow(userId, day6Ago, today),
        note: 'masteredWrongItems 为当前状态计数，非近7天新增掌握数',
      },
      recommendAdvanced: recommend,
      variation: {
        entryOnly: true,
        note: '有效变式以错题详情页预览为准；首页不汇总全站变式数，避免放宽匹配规则',
        path: '/chemistry/wrong-questions',
      },
      taskOrder: [
        'daily',
        'wrong_review',
        'wrong_variation',
        'advanced',
      ] as const,
      taskOrderNote: '建议顺序，非强制；全部学习入口随时可用',
    }
  }

  private async activityStats(
    userId: string,
    fromDate: string,
    toDate: string,
  ) {
    // 按 submitted_at 的 Asia/Shanghai 自然日过滤（应用层，避免 DB 时区差异）
    const sessions = await this.sessionsRepo.find({
      where: { userId, status: 'completed' },
    })
    const inWindow = sessions.filter((s) => {
      if (!s.submittedAt) return false
      const d = shanghaiDateString(new Date(s.submittedAt))
      return d >= fromDate && d <= toDate
    })
    if (!inWindow.length) {
      return {
        submittedSessions: 0,
        practicedItems: 0,
        gradedItems: 0,
        correctCount: 0,
        wrongCount: 0,
        pendingReviewCount: 0,
        accuracyPercent: null as number | null,
      }
    }
    const ids = inWindow.map((s) => s.id)
    const itemRows: Array<{
      grade_result: string | null
      user_answer: string | null
    }> = await this.dataSource.query(
      `SELECT grade_result, user_answer FROM chem_train_session_items
       WHERE session_id IN (${ids.map(() => '?').join(',')})`,
      ids,
    )
    let graded = 0
    let correct = 0
    let wrong = 0
    let pending = 0
    let practiced = 0
    for (const r of itemRows) {
      const ans = String(r.user_answer || '').trim()
      const g = r.grade_result
      // 练习题次：已提交会话中有作答且有可靠判题结果
      if (ans && (g === 'correct' || g === 'wrong' || g === 'pending_review')) {
        practiced++
      }
      if (g === 'correct') {
        correct++
        graded++
      } else if (g === 'wrong') {
        wrong++
        graded++
      } else if (g === 'pending_review') {
        pending++
      }
    }
    const accuracy =
      graded > 0 ? Math.round((correct / graded) * 1000) / 10 : null
    return {
      submittedSessions: inWindow.length,
      practicedItems: practiced,
      gradedItems: graded,
      correctCount: correct,
      wrongCount: wrong,
      pendingReviewCount: pending,
      accuracyPercent: accuracy,
    }
  }

  private async countNewWrongInWindow(
    userId: string,
    fromDate: string,
    toDate: string,
  ) {
    const rows = await this.wrongRepo.find({ where: { userId } })
    return rows.filter((r) => {
      const d = shanghaiDateString(new Date(r.firstWrongAt))
      return d >= fromDate && d <= toDate
    }).length
  }

  private async recommendAdvanced(userId: string) {
    const canTest = await this.eligibility.canUseTestPool(userId)
    const poolMode: 'formal' | 'test' = canTest ? 'test' : 'formal'

    const weak = await this.wrong.weakStats(userId, { limit: 8 })
    const candidates = weak.items.filter((x) => x.specialtyCode)

    for (const w of candidates) {
      const code = w.specialtyCode!
      try {
        const raise = await this.advanced.availability(userId, {
          specialtyCode: code,
          difficultyMode: 'raise',
          itemScope: 'all',
          poolMode,
        })
        const challenge = await this.advanced.availability(userId, {
          specialtyCode: code,
          difficultyMode: 'challenge',
          itemScope: 'all',
          poolMode,
        })
        const raiseCount = raise.raiseCount
        const challengeCount = challenge.challengeCount
        if (raiseCount <= 0 && challengeCount <= 0) continue

        let mode: 'raise' | 'challenge' | 'mix' = 'raise'
        let availableCount = raiseCount
        if (raiseCount > 0 && challengeCount > 0) {
          mode = 'mix'
          availableCount = raiseCount + challengeCount
        } else if (challengeCount > 0) {
          mode = 'challenge'
          availableCount = challengeCount
        }

        const sp = await this.specialtiesRepo.findOne({ where: { code } })
        return {
          specialtyCode: code,
          specialtyName: sp?.name || w.specialtyName || code,
          difficultyMode: mode,
          raiseCount,
          challengeCount,
          availableCount,
          poolMode,
          reason: `近期该专项明确错误较多（错题/统计），且存在可训练的提高/挑战题`,
          defaultCountHint: 5,
          shortfallHint:
            availableCount < 5
              ? `当前可练约 ${availableCount} 道，少于常见 5 题训练量`
              : null,
          path: `/chemistry/advanced?specialty=${encodeURIComponent(code)}&mode=${mode}`,
          emptyHint: null as string | null,
        }
      } catch {
        continue
      }
    }

    // 无薄弱专项命中：尝试全局可用性
    try {
      const global = await this.advanced.availability(userId, {
        specialtyCode: 'all',
        difficultyMode: 'mix',
        itemScope: 'all',
        poolMode,
      })
      if (global.availableCount > 0) {
        return {
          specialtyCode: 'all',
          specialtyName: '全部专项',
          difficultyMode: 'mix' as const,
          raiseCount: global.raiseCount,
          challengeCount: global.challengeCount,
          availableCount: global.availableCount,
          poolMode,
          reason: '暂无可靠薄弱专项信号；可自主选择提高或挑战训练',
          defaultCountHint: 5,
          shortfallHint:
            global.availableCount < 5
              ? `当前可练约 ${global.availableCount} 道`
              : null,
          path: `/chemistry/advanced?mode=mix`,
          emptyHint: null as string | null,
        }
      }
    } catch {
      /* ignore */
    }

    return {
      specialtyCode: null,
      specialtyName: null,
      difficultyMode: null,
      raiseCount: 0,
      challengeCount: 0,
      availableCount: 0,
      poolMode,
      reason: null,
      defaultCountHint: 5,
      shortfallHint: null,
      path: '/chemistry/advanced',
      emptyHint: '当前没有可推荐的提高/挑战训练，可稍后或检查试运行权限。',
    }
  }
}
