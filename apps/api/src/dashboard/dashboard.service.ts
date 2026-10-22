import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { AssessmentsService } from '../assessments/assessments.service'
import { ErrorQuestionsService } from '../error-questions/error-questions.service'
import { PointsService } from '../points/points.service'
import { StudyPrefsService } from '../study-prefs/study-prefs.service'
import { StudyCompareMode } from '../study-prefs/user-study-pref.entity'

type MoodKind = 'up' | 'down' | 'flat' | 'skip'

@Injectable()
export class DashboardService {
  constructor(
    private readonly errorQuestionsService: ErrorQuestionsService,
    private readonly assessmentsService: AssessmentsService,
    private readonly studyPrefs: StudyPrefsService,
    private readonly points: PointsService,
    private readonly dataSource: DataSource,
  ) {}

  async overview(userId: string) {
    const prefs = await this.studyPrefs.getOrCreate(userId)
    const pointsSummary = await this.points.summary(userId)
    const todayReviews = await this.errorQuestionsService.listTodayReviews(userId)
    const urgent = todayReviews.slice(0, 5)
    const stats = await this.errorQuestionsService.stats(userId)
    const scoreTrend = await this.assessmentsService.trends(userId, {})
    const last30 = scoreTrend.filter((t) => {
      const d = new Date(t.heldAt)
      const from = new Date()
      from.setDate(from.getDate() - 30)
      return d >= from
    })

    const weak = await this.dataSource.query(
      `SELECT s.id AS subjectId, s.name AS subjectName,
              COUNT(eq.id) AS errorCnt,
              SUM(CASE WHEN eq.status = 'MASTERED' THEN 1 ELSE 0 END) AS masteredCnt
       FROM subjects s
       LEFT JOIN error_questions eq ON eq.subject_id = s.id AND eq.user_id = s.user_id
       WHERE s.user_id = ? AND s.is_archived = 0
       GROUP BY s.id, s.name
       HAVING errorCnt > 0
       ORDER BY (masteredCnt / errorCnt) ASC, errorCnt DESC
       LIMIT 5`,
      [userId],
    )

    const topCategories = (stats.topTags?.length ? stats.byCategory : stats.byCategory)
      .slice(0, 5)
      .map((c: { name: string; count: number }) => ({
        name: c.name,
        count: c.count,
        suggestion: `本周重点：${c.name}`,
      }))

    const mood = await this.buildMood(
      userId,
      prefs.compareMode,
      prefs.scoreThreshold,
      prefs.rankThreshold,
      todayReviews,
    )

    return {
      todayReviewCount: todayReviews.length,
      urgentReviews: urgent,
      scoreTrend30d: last30.map((t) => ({
        heldAt: t.heldAt,
        title: t.title,
        totalScore: t.totalScore,
        totalFull: t.totalFull || null,
        classRank: t.classRank ?? null,
        schoolRank: t.schoolRank ?? null,
      })),
      weakSubjects: weak.map(
        (w: {
          subjectId: string
          subjectName: string
          errorCnt: string
          masteredCnt: string
        }) => ({
          subjectId: String(w.subjectId),
          subjectName: w.subjectName,
          errorCount: Number(w.errorCnt),
          masteredCount: Number(w.masteredCnt),
          masteryRate: Number(w.errorCnt)
            ? Number(((Number(w.masteredCnt) / Number(w.errorCnt)) * 100).toFixed(1))
            : 0,
        }),
      ),
      topCategories,
      errorStats: {
        total: stats.total,
        masteryRate: stats.masteryRate,
        last7Days: stats.last7Days,
        last30Days: stats.last30Days,
      },
      studyPrefs: prefs,
      mood,
      points: pointsSummary,
    }
  }

  private async buildMood(
    userId: string,
    compareMode: StudyCompareMode,
    scoreThreshold: number,
    rankThreshold: number,
    todayReviews: Array<{ subjectId?: string; status?: string }>,
  ) {
    const latestRows = await this.dataSource.query(
      `SELECT a.id AS assessmentId, a.title, a.held_at AS heldAt,
              s.subject_id AS subjectId, sub.name AS subjectName,
              s.score, s.full_score AS fullScore,
              s.class_rank AS classRank, s.school_rank AS schoolRank
       FROM assessments a
       INNER JOIN assessment_subject_scores s ON s.assessment_id = a.id
       INNER JOIN subjects sub ON sub.id = s.subject_id AND sub.user_id = a.user_id
       WHERE a.user_id = ?
         AND a.id = (
           SELECT a2.id FROM assessments a2
           WHERE a2.user_id = ?
           ORDER BY a2.held_at DESC, a2.id DESC
           LIMIT 1
         )
       ORDER BY sub.sort_order ASC, sub.id ASC`,
      [userId, userId],
    )

    if (!latestRows.length) {
      return {
        compareMode,
        assessmentId: null,
        title: null,
        heldAt: null,
        items: [] as unknown[],
        summary: '暂无成绩记录，录入测评后可查看进步/退步提示',
      }
    }

    const assessmentId = String(latestRows[0].assessmentId)
    const title = latestRows[0].title as string
    const heldAt = this.formatDate(latestRows[0].heldAt)

    const subjectStats = await this.dataSource.query(
      `SELECT subject_id AS subjectId,
              COUNT(*) AS errorCnt,
              SUM(CASE WHEN status = 'MASTERED' THEN 1 ELSE 0 END) AS masteredCnt
       FROM error_questions
       WHERE user_id = ?
       GROUP BY subject_id`,
      [userId],
    )
    const statsMap = new Map<
      string,
      { errorCnt: number; masteredCnt: number; unmastered: number }
    >()
    for (const s of subjectStats) {
      const errorCnt = Number(s.errorCnt)
      const masteredCnt = Number(s.masteredCnt)
      statsMap.set(String(s.subjectId), {
        errorCnt,
        masteredCnt,
        unmastered: Math.max(0, errorCnt - masteredCnt),
      })
    }

    const todayBySubject = new Map<string, number>()
    for (const r of todayReviews) {
      const sid = String(r.subjectId || '')
      if (!sid) continue
      todayBySubject.set(sid, (todayBySubject.get(sid) || 0) + 1)
    }

    const items = []
    for (const row of latestRows) {
      const subjectId = String(row.subjectId)
      const subjectName = row.subjectName as string
      const prev = await this.findPreviousSubjectScore(
        userId,
        subjectId,
        assessmentId,
        heldAt,
      )
      const st = statsMap.get(subjectId) || {
        errorCnt: 0,
        masteredCnt: 0,
        unmastered: 0,
      }
      const todayCnt = todayBySubject.get(subjectId) || 0
      const masteryRate = st.errorCnt
        ? (st.masteredCnt / st.errorCnt) * 100
        : 100

      if (!prev) {
        items.push({
          subjectId,
          subjectName,
          mood: 'skip' as MoodKind,
          face: '😐',
          label: `${subjectName} · 无上一场可比`,
          detail: '首次录入该科或缺少对照场次',
          warn: st.unmastered >= 3 || todayCnt >= 3 || masteryRate < 50,
          unmasteredErrorCount: st.unmastered,
          todayReviewCount: todayCnt,
          masteryRate: Number(masteryRate.toFixed(1)),
        })
        continue
      }

      const compared = this.compareSubject(
        compareMode,
        {
          score: row.score != null ? Number(row.score) : null,
          fullScore: row.fullScore != null ? Number(row.fullScore) : null,
          classRank: row.classRank != null ? Number(row.classRank) : null,
          schoolRank: row.schoolRank != null ? Number(row.schoolRank) : null,
        },
        {
          score: prev.score != null ? Number(prev.score) : null,
          fullScore: prev.fullScore != null ? Number(prev.fullScore) : null,
          classRank: prev.classRank != null ? Number(prev.classRank) : null,
          schoolRank: prev.schoolRank != null ? Number(prev.schoolRank) : null,
        },
        scoreThreshold,
        rankThreshold,
        subjectName,
      )

      const warn =
        compared.mood === 'down' ||
        st.unmastered >= 3 ||
        todayCnt >= 3 ||
        (compared.mood !== 'skip' && masteryRate < 50)

      let detail = compared.detail
      if (compared.mood === 'down' && st.unmastered > 0) {
        detail += `，该科未掌握错题 ${st.unmastered} 道，建议去复习`
      } else if (warn && st.unmastered > 0 && compared.mood !== 'down') {
        detail += ` · 未掌握错题 ${st.unmastered} 道`
      }

      items.push({
        subjectId,
        subjectName,
        mood: compared.mood,
        face: compared.face,
        label: compared.label,
        detail,
        warn,
        unmasteredErrorCount: st.unmastered,
        todayReviewCount: todayCnt,
        masteryRate: Number(masteryRate.toFixed(1)),
      })
    }

    const up = items.filter((i) => i.mood === 'up').length
    const down = items.filter((i) => i.mood === 'down').length
    let summary = `最近考试「${title}」（${heldAt}）`
    if (up || down) {
      summary += `：进步 ${up} 科，退步 ${down} 科`
    } else {
      summary += '：各科变化不大或暂无可比数据'
    }

    return {
      compareMode,
      assessmentId,
      title,
      heldAt,
      items,
      summary,
    }
  }

  private async findPreviousSubjectScore(
    userId: string,
    subjectId: string,
    latestAssessmentId: string,
    latestHeldAt: string,
  ) {
    const rows = await this.dataSource.query(
      `SELECT s.score, s.full_score AS fullScore,
              s.class_rank AS classRank, s.school_rank AS schoolRank,
              a.held_at AS heldAt, a.id AS assessmentId
       FROM assessment_subject_scores s
       INNER JOIN assessments a ON a.id = s.assessment_id
       WHERE a.user_id = ?
         AND s.subject_id = ?
         AND a.id <> ?
         AND (a.held_at < ? OR (a.held_at = ? AND a.id < ?))
       ORDER BY a.held_at DESC, a.id DESC
       LIMIT 1`,
      [
        userId,
        subjectId,
        latestAssessmentId,
        latestHeldAt,
        latestHeldAt,
        latestAssessmentId,
      ],
    )
    return rows[0] || null
  }

  private compareSubject(
    mode: StudyCompareMode,
    cur: {
      score: number | null
      fullScore: number | null
      classRank: number | null
      schoolRank: number | null
    },
    prev: {
      score: number | null
      fullScore: number | null
      classRank: number | null
      schoolRank: number | null
    },
    scoreThreshold: number,
    rankThreshold: number,
    subjectName: string,
  ): { mood: MoodKind; face: string; label: string; detail: string } {
    if (mode === 'class_rank' || mode === 'school_rank') {
      const curRank = mode === 'class_rank' ? cur.classRank : cur.schoolRank
      const prevRank = mode === 'class_rank' ? prev.classRank : prev.schoolRank
      const rankLabel = mode === 'class_rank' ? '班排' : '校排'
      if (curRank == null || prevRank == null) {
        return {
          mood: 'skip',
          face: '😐',
          label: `${subjectName} · 无${rankLabel}`,
          detail: `缺少${rankLabel}数据，已跳过对比`,
        }
      }
      const improved = prevRank - curRank
      if (improved >= rankThreshold) {
        return {
          mood: 'up',
          face: '😊',
          label: `${subjectName} ${rankLabel} ${prevRank}→${curRank}`,
          detail: `${rankLabel}上升 ${improved} 名`,
        }
      }
      if (improved <= -rankThreshold) {
        return {
          mood: 'down',
          face: '😢',
          label: `${subjectName} ${rankLabel} ${prevRank}→${curRank}`,
          detail: `${rankLabel}下降 ${Math.abs(improved)} 名`,
        }
      }
      return {
        mood: 'flat',
        face: '🙂',
        label: `${subjectName} ${rankLabel} ${curRank}`,
        detail: `${rankLabel}持平`,
      }
    }

    // score mode
    if (cur.score == null || prev.score == null) {
      return {
        mood: 'skip',
        face: '😐',
        label: `${subjectName} · 无分数`,
        detail: '缺少分数，已跳过对比',
      }
    }

    let delta: number
    let label: string
    let unit = '分'
    if (
      cur.fullScore != null &&
      prev.fullScore != null &&
      cur.fullScore > 0 &&
      prev.fullScore > 0
    ) {
      const curRate = (cur.score / cur.fullScore) * 100
      const prevRate = (prev.score / prev.fullScore) * 100
      delta = curRate - prevRate
      label = `${subjectName} ${cur.score}/${cur.fullScore}`
      unit = '个百分点'
      const signed = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)
      if (delta >= scoreThreshold) {
        return {
          mood: 'up',
          face: '😊',
          label: `${subjectName} ${signed}%`,
          detail: `得分率 ${prevRate.toFixed(1)}% → ${curRate.toFixed(1)}%（${signed}${unit}）`,
        }
      }
      if (delta <= -scoreThreshold) {
        return {
          mood: 'down',
          face: '😢',
          label: `${subjectName} ${signed}%`,
          detail: `得分率 ${prevRate.toFixed(1)}% → ${curRate.toFixed(1)}%（${signed}${unit}）`,
        }
      }
      return {
        mood: 'flat',
        face: '🙂',
        label: `${subjectName} ${cur.score}/${cur.fullScore}`,
        detail: `得分率约持平（${curRate.toFixed(1)}%）`,
      }
    }

    delta = cur.score - prev.score
    const signed = delta >= 0 ? `+${delta}` : `${delta}`
    if (delta >= scoreThreshold) {
      return {
        mood: 'up',
        face: '😊',
        label: `${subjectName} ${signed}`,
        detail: `分数 ${prev.score} → ${cur.score}`,
      }
    }
    if (delta <= -scoreThreshold) {
      return {
        mood: 'down',
        face: '😢',
        label: `${subjectName} ${signed}`,
        detail: `分数 ${prev.score} → ${cur.score}`,
      }
    }
    return {
      mood: 'flat',
      face: '🙂',
      label: `${subjectName} ${cur.score}`,
      detail: `分数持平（${cur.score}）`,
    }
  }

  private formatDate(value: unknown): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const y = value.getFullYear()
      const m = String(value.getMonth() + 1).padStart(2, '0')
      const d = String(value.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    const s = String(value ?? '')
    const m = s.match(/(\d{4}-\d{2}-\d{2})/)
    return m ? m[1] : s.slice(0, 10)
  }
}
