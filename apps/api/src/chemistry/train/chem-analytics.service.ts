import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemAdvancedTrainService } from './chem-advanced-train.service'
import { ChemTrainEligibilityService } from './chem-train-eligibility.service'
import { ChemWrongQuestionService } from './chem-wrong-question.service'
import { ChemTrainSession } from './entities/chem-train-session.entity'
import { ChemWrongItem } from './entities/chem-wrong-item.entity'
import { shanghaiDateMinusDays, shanghaiDateString } from './shanghai-date.util'

type DayBucket = {
  date: string
  submittedSessions: number
  practicedItems: number
  correctCount: number
  wrongCount: number
  pendingReviewCount: number
  accuracyPercent: number | null
}

type GradeAgg = {
  practiced: number
  correct: number
  wrong: number
  pending: number
}

function accuracyOf(g: GradeAgg): number | null {
  const den = g.correct + g.wrong
  if (den <= 0) return null
  return Math.round((g.correct / den) * 1000) / 10
}

function emptyAgg(): GradeAgg {
  return { practiced: 0, correct: 0, wrong: 0, pending: 0 }
}

function applyGrade(agg: GradeAgg, ans: string, grade: string | null) {
  const a = String(ans || '').trim()
  const g = grade
  if (a && (g === 'correct' || g === 'wrong' || g === 'pending_review')) {
    agg.practiced++
  }
  if (g === 'correct') agg.correct++
  else if (g === 'wrong') agg.wrong++
  else if (g === 'pending_review') agg.pending++
}

@Injectable()
export class ChemAnalyticsService {
  constructor(
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

  async getAnalytics(userId: string, daysRaw?: 7 | 30) {
    const days: 7 | 30 = daysRaw === 7 ? 7 : 30
    const today = shanghaiDateString()
    const windowStart = shanghaiDateMinusDays(days - 1)
    const calendarStart = shanghaiDateMinusDays(29)

    const attributionNote =
      '专项/难度按题目当前归属统计；历史未保存答题时专项与难度快照。若日后改题库归属，历史分析会随之变化。'

    const allCompleted = await this.sessionsRepo.find({
      where: { userId, status: 'completed' },
    })

    const inWindow = allCompleted.filter((s) => {
      if (!s.submittedAt) return false
      const d = shanghaiDateString(new Date(s.submittedAt))
      return d >= windowStart && d <= today
    })
    const inCalendar = allCompleted.filter((s) => {
      if (!s.submittedAt) return false
      const d = shanghaiDateString(new Date(s.submittedAt))
      return d >= calendarStart && d <= today
    })
    const in7d = allCompleted.filter((s) => {
      if (!s.submittedAt) return false
      const d = shanghaiDateString(new Date(s.submittedAt))
      return d >= shanghaiDateMinusDays(6) && d <= today
    })

    const windowIds = inWindow.map((s) => s.id)
    const calendarIds = inCalendar.map((s) => s.id)

    const [windowRows, calendarRows, specialties, wrongSummary] =
      await Promise.all([
        this.loadItemRows(windowIds),
        this.loadItemRows(calendarIds),
        this.specialtiesRepo.find({
          where: { isActive: true },
          order: { sortOrder: 'ASC' },
        }),
        this.wrong.summary(userId),
      ])

    const sessionDateMap = new Map<string, string>()
    for (const s of allCompleted) {
      if (!s.submittedAt) continue
      sessionDateMap.set(
        String(s.id),
        shanghaiDateString(new Date(s.submittedAt)),
      )
    }

    const calendar = this.buildDailySeries(
      calendarStart,
      today,
      inCalendar,
      calendarRows,
      sessionDateMap,
    )
    const trend = this.buildDailySeries(
      windowStart,
      today,
      inWindow,
      windowRows,
      sessionDateMap,
    )

    const overviewAgg = emptyAgg()
    for (const r of windowRows) {
      applyGrade(overviewAgg, r.user_answer, r.grade_result)
    }

    const specialtiesStats = this.buildSpecialtyStats(
      specialties,
      windowRows,
    )
    const difficulties = this.buildDifficultyStats(windowRows)
    const topWrong = await this.buildTopWrongSpecialties(
      userId,
      specialties,
      windowRows,
    )

    const wrongStatus = {
      openCount: wrongSummary.openCount,
      consolidatingCount: wrongSummary.consolidatingCount,
      masteredCount: wrongSummary.masteredCount,
      dueTodayCount: wrongSummary.dueTodayCount,
      totalWrongItems: wrongSummary.totalWrongItems,
      note: '已掌握表示具体错题满足复练条件，不代表相关知识点已经全部掌握。本图为当前状态，非历史趋势。',
    }

    const suggestions = await this.buildSuggestions(userId, {
      dueTodayCount: wrongSummary.dueTodayCount,
      submitted7d: in7d.length,
      specialtiesStats,
      difficulties,
      days,
    })

    return {
      timezone: 'Asia/Shanghai',
      today,
      days,
      windowStart,
      windowEnd: today,
      calendarStart,
      calendarEnd: today,
      attribution: {
        specialty: 'current_item' as const,
        difficulty: 'current_item' as const,
        note: attributionNote,
      },
      notes: [
        attributionNote,
        '仅统计已提交训练；练习题次需有作答且具可靠判题结果；正确率分母=correct+wrong，pending_review 不进分母。',
        '活跃度日历固定最近30个上海自然日；趋势/专项/难度/高频错误随 days=7|30 切换。',
      ],
      overview: {
        submittedSessions: inWindow.length,
        practicedItems: overviewAgg.practiced,
        correctCount: overviewAgg.correct,
        wrongCount: overviewAgg.wrong,
        pendingReviewCount: overviewAgg.pending,
        accuracyPercent: accuracyOf(overviewAgg),
        accuracyNote: 'correct / (correct + wrong)；无明确对错时为 null',
      },
      calendar,
      trend,
      specialties: {
        title: '各专项近期答题表现',
        titleNote: '答题正确率 ≠ 知识点掌握度',
        items: specialtiesStats,
      },
      difficulties: {
        title: '基础 / 提高 / 挑战难度表现',
        items: difficulties,
      },
      wrongStatus,
      topWrongSpecialties: {
        title: '高频错误专项',
        titleNote: '按明确错误题次降序；错误多 ≠ 能力最差',
        items: topWrong,
      },
      suggestions,
    }
  }

  private async loadItemRows(sessionIds: string[]) {
    if (!sessionIds.length) return [] as Array<{
      session_id: string
      item_id: string | null
      user_answer: string | null
      grade_result: string | null
      specialty_id: string | null
      specialty_code: string | null
      specialty_name: string | null
      difficulty: number | null
    }>
    return this.dataSource.query(
      `SELECT si.session_id AS session_id,
              si.item_id AS item_id,
              si.user_answer AS user_answer,
              si.grade_result AS grade_result,
              i.specialty_id AS specialty_id,
              sp.code AS specialty_code,
              sp.name AS specialty_name,
              i.difficulty AS difficulty
       FROM chem_train_session_items si
       LEFT JOIN chem_train_items i ON i.id = si.item_id
       LEFT JOIN chem_specialties sp ON sp.id = i.specialty_id
       WHERE si.session_id IN (${sessionIds.map(() => '?').join(',')})`,
      sessionIds,
    )
  }

  private buildDailySeries(
    fromDate: string,
    toDate: string,
    sessions: ChemTrainSession[],
    rows: Array<{
      session_id: string
      user_answer: string | null
      grade_result: string | null
    }>,
    sessionDateMap: Map<string, string>,
  ): DayBucket[] {
    const dates = this.enumerateDates(fromDate, toDate)
    const byDate = new Map<string, DayBucket>()
    for (const d of dates) {
      byDate.set(d, {
        date: d,
        submittedSessions: 0,
        practicedItems: 0,
        correctCount: 0,
        wrongCount: 0,
        pendingReviewCount: 0,
        accuracyPercent: null,
      })
    }
    for (const s of sessions) {
      if (!s.submittedAt) continue
      const d = shanghaiDateString(new Date(s.submittedAt))
      const b = byDate.get(d)
      if (b) b.submittedSessions++
    }
    const aggByDate = new Map<string, GradeAgg>()
    for (const d of dates) aggByDate.set(d, emptyAgg())
    for (const r of rows) {
      const d = sessionDateMap.get(String(r.session_id))
      if (!d || !aggByDate.has(d)) continue
      applyGrade(aggByDate.get(d)!, r.user_answer || '', r.grade_result)
    }
    for (const d of dates) {
      const b = byDate.get(d)!
      const a = aggByDate.get(d)!
      b.practicedItems = a.practiced
      b.correctCount = a.correct
      b.wrongCount = a.wrong
      b.pendingReviewCount = a.pending
      b.accuracyPercent = accuracyOf(a)
    }
    return dates.map((d) => byDate.get(d)!)
  }

  private enumerateDates(from: string, to: string): string[] {
    const out: string[] = []
    let cur = from
    let guard = 0
    while (cur <= to && guard < 400) {
      out.push(cur)
      cur = this.nextShanghaiDay(cur)
      guard++
    }
    return out
  }

  private nextShanghaiDay(ymd: string): string {
    const [y, m, d] = ymd.split('-').map(Number)
    const utc = new Date(Date.UTC(y, m - 1, d))
    utc.setUTCDate(utc.getUTCDate() + 1)
    const yy = utc.getUTCFullYear()
    const mm = String(utc.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(utc.getUTCDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
  }

  private buildSpecialtyStats(
    specialties: ChemSpecialty[],
    rows: Array<{
      user_answer: string | null
      grade_result: string | null
      specialty_id: string | null
      specialty_code: string | null
      specialty_name: string | null
    }>,
  ) {
    const byKey = new Map<string, GradeAgg & { code: string | null; name: string }>()
    for (const sp of specialties) {
      byKey.set(String(sp.id), {
        ...emptyAgg(),
        code: sp.code,
        name: sp.name,
      })
    }
    const unknown = { ...emptyAgg(), code: null as string | null, name: '未知专项' }
    let hasUnknown = false

    for (const r of rows) {
      const sid = r.specialty_id != null ? String(r.specialty_id) : null
      if (!sid || !byKey.has(sid)) {
        applyGrade(unknown, r.user_answer || '', r.grade_result)
        hasUnknown = true
        continue
      }
      applyGrade(byKey.get(sid)!, r.user_answer || '', r.grade_result)
    }

    type SpItem = {
      specialtyId: string
      specialtyCode: string | null
      specialtyName: string
      practicedItems: number
      correctCount: number
      wrongCount: number
      pendingReviewCount: number
      gradedItems: number
      accuracyPercent: number | null
      empty: boolean
      sampleLow: boolean
      sampleNote: string | null
    }
    const items: SpItem[] = specialties.map((sp) => {
      const a = byKey.get(String(sp.id))!
      const graded = a.correct + a.wrong
      const empty = a.practiced === 0 && graded === 0 && a.pending === 0
      return {
        specialtyId: String(sp.id),
        specialtyCode: sp.code,
        specialtyName: sp.name,
        practicedItems: a.practiced,
        correctCount: a.correct,
        wrongCount: a.wrong,
        pendingReviewCount: a.pending,
        gradedItems: graded,
        accuracyPercent: empty ? null : accuracyOf(a),
        empty,
        sampleLow: !empty && graded > 0 && graded < 5,
        sampleNote:
          !empty && graded > 0 && graded < 5 ? '样本较少' : null,
      }
    })

    if (hasUnknown && (unknown.practiced || unknown.correct || unknown.wrong || unknown.pending)) {
      const graded = unknown.correct + unknown.wrong
      items.push({
        specialtyId: 'unknown',
        specialtyCode: null,
        specialtyName: '未知专项',
        practicedItems: unknown.practiced,
        correctCount: unknown.correct,
        wrongCount: unknown.wrong,
        pendingReviewCount: unknown.pending,
        gradedItems: graded,
        accuracyPercent: accuracyOf(unknown),
        empty: false,
        sampleLow: graded > 0 && graded < 5,
        sampleNote: graded > 0 && graded < 5 ? '样本较少' : null,
      })
    }
    return items
  }

  private buildDifficultyStats(
    rows: Array<{
      user_answer: string | null
      grade_result: string | null
      difficulty: number | null
    }>,
  ) {
    const bands: Array<{
      key: string
      label: string
      difficulty: number | null
    }> = [
      { key: 'basic', label: '基础', difficulty: 1 },
      { key: 'raise', label: '提高', difficulty: 2 },
      { key: 'challenge', label: '挑战', difficulty: 3 },
      { key: 'unknown', label: '未知难度', difficulty: null },
    ]
    const map = new Map<string, GradeAgg>()
    for (const b of bands) map.set(b.key, emptyAgg())

    for (const r of rows) {
      const d = r.difficulty == null ? null : Number(r.difficulty)
      let key = 'unknown'
      if (d === 1) key = 'basic'
      else if (d === 2) key = 'raise'
      else if (d === 3) key = 'challenge'
      applyGrade(map.get(key)!, r.user_answer || '', r.grade_result)
    }

    return bands.map((b) => {
      const a = map.get(b.key)!
      const graded = a.correct + a.wrong
      const empty = a.practiced === 0 && graded === 0 && a.pending === 0
      return {
        key: b.key,
        label: b.label,
        difficulty: b.difficulty,
        practicedItems: a.practiced,
        correctCount: a.correct,
        wrongCount: a.wrong,
        pendingReviewCount: a.pending,
        gradedItems: graded,
        accuracyPercent: empty ? null : accuracyOf(a),
        empty,
        sampleLow: !empty && graded > 0 && graded < 5,
        sampleNote:
          !empty && graded > 0 && graded < 5
            ? b.key === 'challenge'
              ? '挑战题样本量少，正确率仅供参考'
              : '样本较少'
            : null,
      }
    })
  }

  private async buildTopWrongSpecialties(
    userId: string,
    specialties: ChemSpecialty[],
    rows: Array<{
      user_answer: string | null
      grade_result: string | null
      specialty_id: string | null
      specialty_code: string | null
      specialty_name: string | null
      item_id: string | null
    }>,
  ) {
    const bySp = new Map<
      string,
      GradeAgg & { code: string | null; name: string; id: string }
    >()
    for (const r of rows) {
      if (r.grade_result !== 'wrong' && r.grade_result !== 'correct') {
        // still count graded later; for ranking we care wrong
      }
      const sid = r.specialty_id != null ? String(r.specialty_id) : 'unknown'
      if (!bySp.has(sid)) {
        const sp = specialties.find((x) => String(x.id) === sid)
        bySp.set(sid, {
          ...emptyAgg(),
          id: sid,
          code: sp?.code || r.specialty_code || null,
          name: sp?.name || r.specialty_name || '未知专项',
        })
      }
      applyGrade(bySp.get(sid)!, r.user_answer || '', r.grade_result)
    }

    // 当前待攻克错题按专项（当前题库归属）
    const openWrong = await this.wrongRepo.find({
      where: { userId, status: 'open' },
    })
    const openBySp = new Map<string, number>()
    if (openWrong.length) {
      const itemIds = openWrong.map((w) => w.itemId)
      const itemRows: Array<{ id: string; specialty_id: string }> =
        await this.dataSource.query(
          `SELECT id, specialty_id FROM chem_train_items
           WHERE id IN (${itemIds.map(() => '?').join(',')})`,
          itemIds,
        )
      const idToSp = new Map(
        itemRows.map((x) => [String(x.id), String(x.specialty_id)]),
      )
      for (const w of openWrong) {
        const spId = idToSp.get(String(w.itemId)) || 'unknown'
        openBySp.set(spId, (openBySp.get(spId) || 0) + 1)
      }
    }

    return [...bySp.values()]
      .filter((x) => x.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong || b.practiced - a.practiced)
      .slice(0, 12)
      .map((a) => {
        const graded = a.correct + a.wrong
        const errorRate =
          graded > 0 ? Math.round((a.wrong / graded) * 1000) / 10 : null
        return {
          specialtyId: a.id,
          specialtyCode: a.code,
          specialtyName: a.name,
          wrongCount: a.wrong,
          practicedItems: a.practiced,
          gradedItems: graded,
          errorRatePercent: errorRate,
          openWrongCount: openBySp.get(a.id) || 0,
          sampleLow: graded > 0 && graded < 5,
          sampleNote: graded > 0 && graded < 5 ? '样本较少' : null,
        }
      })
  }

  private async buildSuggestions(
    userId: string,
    ctx: {
      dueTodayCount: number
      submitted7d: number
      specialtiesStats: Array<{
        specialtyCode: string | null
        specialtyName: string
        wrongCount: number
        empty: boolean
      }>
      difficulties: Array<{
        key: string
        practicedItems: number
        gradedItems: number
        empty: boolean
      }>
      days: 7 | 30
    },
  ) {
    type Sug = {
      id: string
      reason: string
      cta: string
      path: string
      priority: number
    }
    const list: Sug[] = []

    if (ctx.dueTodayCount > 0) {
      list.push({
        id: 'due_today',
        reason: `今天有 ${ctx.dueTodayCount} 道错题建议复习。`,
        cta: '复习今日错题',
        path: '/chemistry/wrong-questions?focus=due',
        priority: 1,
      })
    }

    if (ctx.submitted7d <= 0) {
      list.push({
        id: 'no_activity_7d',
        reason: '最近7天暂无训练记录，可以从每日10分钟基础巩固开始。',
        cta: '开始每日训练',
        path: '/chemistry/daily',
        priority: 2,
      })
    }

    // 错误较多的专项 + 当前有 open 错题
    const topWrongSp = [...ctx.specialtiesStats]
      .filter((s) => !s.empty && s.wrongCount > 0 && s.specialtyCode)
      .sort((a, b) => b.wrongCount - a.wrongCount)[0]
    if (topWrongSp?.specialtyCode) {
      const openRows = await this.wrongRepo.find({
        where: { userId, status: 'open' },
      })
      if (openRows.length) {
        const sp = await this.specialtiesRepo.findOne({
          where: { code: topWrongSp.specialtyCode },
        })
        if (sp) {
          const itemIds = openRows.map((w) => w.itemId)
          const matched: Array<{ id: string }> = await this.dataSource.query(
            `SELECT id FROM chem_train_items
             WHERE specialty_id=? AND id IN (${itemIds.map(() => '?').join(',')})
             LIMIT 1`,
            [sp.id, ...itemIds],
          )
          if (matched.length) {
            list.push({
              id: 'weak_specialty_wrong',
              reason: `近期「${topWrongSp.specialtyName}」练习中明确错误较多，可以优先复习相关错题。`,
              cta: '查看错题',
              path: `/chemistry/wrong-questions?specialtyCode=${encodeURIComponent(topWrongSp.specialtyCode)}`,
              priority: 3,
            })
          }
        }
      }
    }

    const canTest = await this.eligibility.canUseTestPool(userId)
    const poolMode: 'formal' | 'test' = canTest ? 'test' : 'formal'
    const basic = ctx.difficulties.find((d) => d.key === 'basic')
    const raise = ctx.difficulties.find((d) => d.key === 'raise')
    const challenge = ctx.difficulties.find((d) => d.key === 'challenge')

    try {
      if (
        (basic?.practicedItems || 0) >= 5 &&
        (raise?.practicedItems || 0) < 3
      ) {
        const avail = await this.advanced.availability(userId, {
          specialtyCode: 'all',
          difficultyMode: 'raise',
          itemScope: 'all',
          poolMode,
        })
        if (avail.availableCount > 0) {
          list.push({
            id: 'try_raise',
            reason: '近期基础训练较多，可以尝试适量提高训练。',
            cta: '开始提高训练',
            path: '/chemistry/advanced?mode=raise',
            priority: 4,
          })
        }
      }
    } catch {
      /* ignore */
    }

    try {
      if ((challenge?.gradedItems || 0) < 5) {
        const avail = await this.advanced.availability(userId, {
          specialtyCode: 'all',
          difficultyMode: 'challenge',
          itemScope: 'all',
          poolMode,
        })
        if (avail.availableCount > 0) {
          list.push({
            id: 'try_challenge',
            reason:
              '目前挑战题训练记录较少，可以尝试挑战训练，逐步积累综合推理经验。',
            cta: '开始挑战训练',
            path: '/chemistry/advanced?mode=challenge',
            priority: 5,
          })
        }
      }
    } catch {
      /* ignore */
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 5)
  }
}
