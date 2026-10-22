import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { ChemCategory } from '../chem-category.entity'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemTrainEligibilityService } from './chem-train-eligibility.service'
import { ChemTrainService } from './chem-train.service'
import { ChemTrainItem } from './entities/chem-train-item.entity'
import { ChemTrainItemLink } from './entities/chem-train-item-link.entity'
import { ChemTrainSession } from './entities/chem-train-session.entity'
import { ChemTrainSessionItem } from './entities/chem-train-session-item.entity'
import { ChemWrongEvent } from './entities/chem-wrong-event.entity'
import { ChemWrongItem } from './entities/chem-wrong-item.entity'
import { loadAdvModelCatalog } from './chem-model-catalog.loader'
import {
  parseAnalysisSections,
  parseModelIdFromGateNote,
  rankVariationCandidate,
  stemSkeleton,
  tierLabel,
  type VariationTier,
} from './chem-variation-match.util'
import { shanghaiDateMinusDays, shanghaiDateString } from './shanghai-date.util'
import { DIFFICULTY_LABELS } from './train.constants'

/** 掌握：错后至少 2 次明确 correct，且跨不同 session，间隔 ≥3 个上海自然日 */
export const WRONG_MASTER_MIN_CORRECT = 2
export const WRONG_MASTER_GAP_DAYS = 3
/** 巩固中：距上次明确 correct ≥2 天则「今天建议复习」 */
export const WRONG_CONSOLIDATING_DUE_DAYS = 2

type ReplayEvent = {
  sessionItemId: string
  sessionId: string
  itemId: string
  sessionKind: string
  gradeResult: 'wrong' | 'correct'
  occurredAt: Date
}

@Injectable()
export class ChemWrongQuestionService {
  private readonly logger = new Logger(ChemWrongQuestionService.name)

  constructor(
    @InjectRepository(ChemWrongItem)
    private readonly wrongRepo: Repository<ChemWrongItem>,
    @InjectRepository(ChemWrongEvent)
    private readonly eventsRepo: Repository<ChemWrongEvent>,
    @InjectRepository(ChemTrainSession)
    private readonly sessionsRepo: Repository<ChemTrainSession>,
    @InjectRepository(ChemTrainSessionItem)
    private readonly sessionItemsRepo: Repository<ChemTrainSessionItem>,
    @InjectRepository(ChemTrainItem)
    private readonly itemsRepo: Repository<ChemTrainItem>,
    @InjectRepository(ChemTrainItemLink)
    private readonly linksRepo: Repository<ChemTrainItemLink>,
    @InjectRepository(ChemSpecialty)
    private readonly specialtiesRepo: Repository<ChemSpecialty>,
    @InjectRepository(ChemCategory)
    private readonly categoriesRepo: Repository<ChemCategory>,
    private readonly eligibility: ChemTrainEligibilityService,
    @Inject(forwardRef(() => ChemTrainService))
    private readonly trainService: ChemTrainService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 提交完成后调用：失败只记日志，不抛回训练提交。
   * 事实来源仍是 session_items；本方法可重建。
   */
  async onSessionSubmittedSafe(userId: string, sessionId: string) {
    try {
      await this.rebuildUserWrongBook(userId)
    } catch (e) {
      this.logger.error(
        `错题索引更新失败 user=${userId} session=${sessionId}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      )
    }
  }

  /** 幂等全量回放：先错过的题，按时间回放全部明确 correct/wrong */
  async rebuildUserWrongBook(userId: string) {
    const raw: Array<{
      session_item_id: string
      session_id: string
      item_id: string
      session_kind: string | null
      grade_result: string
      occurred_at: Date
    }> = await this.dataSource.query(
      `SELECT si.id AS session_item_id,
              si.session_id AS session_id,
              si.item_id AS item_id,
              COALESCE(NULLIF(s.session_kind,''), 'specialty') AS session_kind,
              si.grade_result AS grade_result,
              COALESCE(si.answered_at, s.submitted_at, s.started_at) AS occurred_at
       FROM chem_train_session_items si
       JOIN chem_train_sessions s ON s.id = si.session_id
       WHERE s.user_id = ?
         AND s.status = 'completed'
         AND si.item_id IS NOT NULL
         AND si.grade_result IN ('wrong', 'correct')
       ORDER BY occurred_at ASC, si.id ASC`,
      [userId],
    )

    const byItem = new Map<string, ReplayEvent[]>()
    for (const r of raw) {
      const itemId = String(r.item_id)
      const list = byItem.get(itemId) || []
      list.push({
        sessionItemId: String(r.session_item_id),
        sessionId: String(r.session_id),
        itemId,
        sessionKind: String(r.session_kind || 'specialty'),
        gradeResult: r.grade_result as 'wrong' | 'correct',
        occurredAt: new Date(r.occurred_at),
      })
      byItem.set(itemId, list)
    }

    const itemIdsWithWrong = [...byItem.entries()]
      .filter(([, evs]) => evs.some((e) => e.gradeResult === 'wrong'))
      .map(([id]) => id)

    // 删除该用户已无任何 wrong 的孤立主表行
    const existing = await this.wrongRepo.find({ where: { userId } })
    for (const row of existing) {
      if (!itemIdsWithWrong.includes(String(row.itemId))) {
        await this.eventsRepo.delete({ wrongItemId: row.id })
        await this.wrongRepo.delete({ id: row.id })
      }
    }

    let upserted = 0
    for (const itemId of itemIdsWithWrong) {
      const events = byItem.get(itemId) || []
      await this.persistReplay(userId, itemId, events)
      upserted++
    }

    return {
      itemCount: upserted,
      eventSourceRows: raw.length,
      rebuiltAt: new Date().toISOString(),
    }
  }

  private async persistReplay(userId: string, itemId: string, events: ReplayEvent[]) {
    const state = this.replayState(events)
    if (!state) return

    let master = await this.wrongRepo.findOne({ where: { userId, itemId } })
    if (!master) {
      master = this.wrongRepo.create({
        userId,
        itemId,
        status: state.status,
        firstWrongAt: state.firstWrongAt,
        lastWrongAt: state.lastWrongAt,
        wrongCount: state.wrongCount,
        correctAfterWrongCount: state.correctAfterWrongCount,
        lastCorrectAt: state.lastCorrectAt,
        firstCorrectAfterWrongAt: state.firstCorrectAfterWrongAt,
        lastGradeResult: state.lastGradeResult,
        lastPracticedAt: state.lastPracticedAt,
        lastSessionKind: state.lastSessionKind,
      })
    } else {
      master.status = state.status
      master.firstWrongAt = state.firstWrongAt
      master.lastWrongAt = state.lastWrongAt
      master.wrongCount = state.wrongCount
      master.correctAfterWrongCount = state.correctAfterWrongCount
      master.lastCorrectAt = state.lastCorrectAt
      master.firstCorrectAfterWrongAt = state.firstCorrectAfterWrongAt
      master.lastGradeResult = state.lastGradeResult
      master.lastPracticedAt = state.lastPracticedAt
      master.lastSessionKind = state.lastSessionKind
    }
    master = await this.wrongRepo.save(master)

    for (const ev of events) {
      const exists = await this.eventsRepo.findOne({
        where: { sessionItemId: ev.sessionItemId },
      })
      if (exists) {
        if (
          exists.eventType !== ev.gradeResult ||
          String(exists.wrongItemId) !== String(master.id)
        ) {
          exists.wrongItemId = master.id
          exists.eventType = ev.gradeResult
          exists.sessionKind = ev.sessionKind
          exists.occurredAt = ev.occurredAt
          await this.eventsRepo.save(exists)
        }
        continue
      }
      await this.eventsRepo.save(
        this.eventsRepo.create({
          wrongItemId: master.id,
          userId,
          itemId,
          sessionId: ev.sessionId,
          sessionItemId: ev.sessionItemId,
          sessionKind: ev.sessionKind,
          eventType: ev.gradeResult,
          occurredAt: ev.occurredAt,
        }),
      )
    }
  }

  /** 纯函数回放：仅 wrong/correct；pending 不在输入中 */
  replayState(events: ReplayEvent[]) {
    const sorted = [...events].sort(
      (a, b) =>
        a.occurredAt.getTime() - b.occurredAt.getTime() ||
        Number(a.sessionItemId) - Number(b.sessionItemId),
    )
    if (!sorted.some((e) => e.gradeResult === 'wrong')) return null

    let status: 'open' | 'consolidating' | 'mastered' = 'open'
    let firstWrongAt: Date | null = null
    let lastWrongAt: Date | null = null
    let wrongCount = 0
    let correctAfterWrongCount = 0
    let lastCorrectAt: Date | null = null
    let firstCorrectAfterWrongAt: Date | null = null
    let lastGradeResult: string | null = null
    let lastPracticedAt: Date | null = null
    let lastSessionKind: string | null = null
    const correctSessionIds = new Set<string>()

    for (const ev of sorted) {
      lastPracticedAt = ev.occurredAt
      lastSessionKind = ev.sessionKind
      lastGradeResult = ev.gradeResult

      if (ev.gradeResult === 'wrong') {
        wrongCount++
        if (!firstWrongAt) firstWrongAt = ev.occurredAt
        lastWrongAt = ev.occurredAt
        status = 'open'
        correctAfterWrongCount = 0
        firstCorrectAfterWrongAt = null
        correctSessionIds.clear()
        continue
      }

      // correct：仅在已有过 wrong 之后才计入掌握进度
      if (!firstWrongAt) continue

      correctAfterWrongCount++
      correctSessionIds.add(ev.sessionId)
      lastCorrectAt = ev.occurredAt
      if (!firstCorrectAfterWrongAt) firstCorrectAfterWrongAt = ev.occurredAt

      if (status === 'open') status = 'consolidating'

      if (
        correctAfterWrongCount >= WRONG_MASTER_MIN_CORRECT &&
        correctSessionIds.size >= 2 &&
        firstCorrectAfterWrongAt &&
        this.shanghaiCalendarGapDays(firstCorrectAfterWrongAt, ev.occurredAt) >=
          WRONG_MASTER_GAP_DAYS
      ) {
        status = 'mastered'
      }
    }

    if (!firstWrongAt || !lastWrongAt) return null

    return {
      status,
      firstWrongAt,
      lastWrongAt,
      wrongCount,
      correctAfterWrongCount,
      lastCorrectAt,
      firstCorrectAfterWrongAt,
      lastGradeResult,
      lastPracticedAt,
      lastSessionKind,
    }
  }

  /** 两个时刻之间跨越的上海自然日差（同日=0） */
  shanghaiCalendarGapDays(a: Date, b: Date): number {
    const da = shanghaiDateString(a)
    const db = shanghaiDateString(b)
    const [y1, m1, d1] = da.split('-').map(Number)
    const [y2, m2, d2] = db.split('-').map(Number)
    const t1 = Date.UTC(y1, m1 - 1, d1)
    const t2 = Date.UTC(y2, m2 - 1, d2)
    return Math.round(Math.abs(t2 - t1) / 86400000)
  }

  isDueToday(row: ChemWrongItem, today = new Date()): boolean {
    if (row.status === 'open') return true
    if (row.status === 'mastered') return false
    // consolidating
    const anchor = row.lastCorrectAt || row.lastPracticedAt || row.lastWrongAt
    if (!anchor) return true
    const gap = this.shanghaiCalendarGapDays(anchor, today)
    return gap >= WRONG_CONSOLIDATING_DUE_DAYS
  }

  async summary(userId: string) {
    await this.ensureInitialized(userId)
    const rows = await this.wrongRepo.find({ where: { userId } })
    let open = 0
    let consolidating = 0
    let mastered = 0
    let dueToday = 0
    let recentNew = 0
    const day7 = shanghaiDateMinusDays(7)
    for (const r of rows) {
      if (r.status === 'open') open++
      else if (r.status === 'consolidating') consolidating++
      else if (r.status === 'mastered') mastered++
      if (this.isDueToday(r)) dueToday++
      if (shanghaiDateString(r.firstWrongAt) >= day7) recentNew++
    }

    const weak = await this.weakStats(userId, { limit: 5 })
    return {
      openCount: open,
      consolidatingCount: consolidating,
      masteredCount: mastered,
      dueTodayCount: dueToday,
      recentNewCount: recentNew,
      totalWrongItems: rows.length,
      topWeakSpecialties: weak.items.slice(0, 3),
      rules: {
        masterMinCorrect: WRONG_MASTER_MIN_CORRECT,
        masterGapDays: WRONG_MASTER_GAP_DAYS,
        consolidatingDueDays: WRONG_CONSOLIDATING_DUE_DAYS,
        dueTodayNote:
          '待攻克全部计入今天建议复习；巩固中距上次明确正确≥2个自然日计入；已掌握默认不计入',
      },
    }
  }

  private async ensureInitialized(userId: string) {
    const n = await this.wrongRepo.count({ where: { userId } })
    if (n === 0) {
      // 可能真无错题，也可能未初始化：有 wrong 历史则重建
      const hitRows: Array<{ n: number | string }> = await this.dataSource.query(
        `SELECT COUNT(*) AS n
         FROM chem_train_session_items si
         JOIN chem_train_sessions s ON s.id = si.session_id
         WHERE s.user_id = ? AND s.status='completed' AND si.grade_result='wrong'
           AND si.item_id IS NOT NULL`,
        [userId],
      )
      if (Number(hitRows[0]?.n) > 0) await this.rebuildUserWrongBook(userId)
    }
  }

  async list(
    userId: string,
    query: {
      status?: string
      dueToday?: string
      specialtyCode?: string
      categoryCode?: string
      difficultyBand?: string
      sort?: string
      page?: number
      pageSize?: number
    },
  ) {
    await this.ensureInitialized(userId)
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 20))

    let rows = await this.wrongRepo.find({ where: { userId } })
    const dueOnly =
      query.dueToday === '1' ||
      query.dueToday === 'true' ||
      query.status === 'due_today' ||
      query.status === '今日复习'
    if (dueOnly) {
      rows = rows.filter((r) => this.isDueToday(r))
    } else if (query.status && query.status !== 'all') {
      const map: Record<string, string> = {
        open: 'open',
        consolidating: 'consolidating',
        mastered: 'mastered',
        待攻克: 'open',
        巩固中: 'consolidating',
        已掌握: 'mastered',
      }
      const st = map[query.status] || query.status
      rows = rows.filter((r) => r.status === st)
    }

    const itemIds = rows.map((r) => r.itemId)
    const items = itemIds.length
      ? await this.itemsRepo.find({ where: { id: In(itemIds) } })
      : []
    const itemMap = Object.fromEntries(items.map((i) => [String(i.id), i]))
    const spIds = [...new Set(items.map((i) => i.specialtyId))]
    const catIds = [...new Set(items.map((i) => i.categoryId))]
    const sps = spIds.length
      ? await this.specialtiesRepo.find({ where: { id: In(spIds) } })
      : []
    const cats = catIds.length
      ? await this.categoriesRepo.find({ where: { id: In(catIds) } })
      : []
    const spMap = Object.fromEntries(sps.map((s) => [String(s.id), s]))
    const catMap = Object.fromEntries(cats.map((c) => [String(c.id), c]))

    let enriched = rows.map((r) => {
      const it = itemMap[String(r.itemId)]
      const sp = it ? spMap[String(it.specialtyId)] : null
      const cat = it ? catMap[String(it.categoryId)] : null
      const diff = it ? Number(it.difficulty) : 0
      return {
        id: r.id,
        itemId: r.itemId,
        status: r.status,
        statusLabel: this.statusLabel(r.status),
        wrongCount: r.wrongCount,
        lastWrongAt: r.lastWrongAt,
        firstWrongAt: r.firstWrongAt,
        lastGradeResult: r.lastGradeResult,
        lastPracticedAt: r.lastPracticedAt,
        dueToday: this.isDueToday(r),
        practiceEligible: false as boolean,
        stemPreview: it ? String(it.stem || '').slice(0, 80) : '(题目不可用)',
        specialtyCode: sp?.code || null,
        specialtyName: sp?.name || null,
        categoryCode: cat?.code || null,
        categoryName: cat?.name || null,
        difficulty: diff,
        difficultyLabel: DIFFICULTY_LABELS[diff] || String(diff),
        difficultyBand:
          diff <= 1 ? 'basic' : diff === 2 ? 'raise' : diff >= 3 ? 'challenge' : 'unknown',
        itemActive: it ? !!it.isActive : false,
        itemBlocked: it ? /\[trial_access:block\]/i.test(String(it.gateNote || '')) : true,
        code: it?.code || null,
      }
    })

    if (query.specialtyCode) {
      enriched = enriched.filter((x) => x.specialtyCode === query.specialtyCode)
    }
    if (query.categoryCode) {
      enriched = enriched.filter((x) => x.categoryCode === query.categoryCode)
    }
    if (query.difficultyBand && query.difficultyBand !== 'all') {
      enriched = enriched.filter((x) => x.difficultyBand === query.difficultyBand)
    }

    // practice eligibility batch
    const canTest = await this.eligibility.canUseTestPool(userId)
    for (const row of enriched) {
      const it = itemMap[String(row.itemId)]
      if (!it) {
        row.practiceEligible = false
        continue
      }
      if (!canTest && it.pool === 'test') {
        row.practiceEligible = false
        continue
      }
      const gate = await this.eligibility.isItemEligible(
        it,
        it.pool === 'formal' ? 'formal' : 'test',
      )
      row.practiceEligible = gate.ok
    }

    const statusRank: Record<string, number> = {
      open: 0,
      consolidating: 1,
      mastered: 2,
    }
    if (query.sort === 'wrong_count') {
      enriched.sort((a, b) => b.wrongCount - a.wrongCount)
    } else if (query.sort === 'recent_wrong') {
      enriched.sort(
        (a, b) =>
          new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime(),
      )
    } else {
      enriched.sort((a, b) => {
        const ra = statusRank[a.status] ?? 9
        const rb = statusRank[b.status] ?? 9
        if (ra !== rb) return ra - rb
        return (
          new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime()
        )
      })
    }

    const total = enriched.length
    const pageItems = enriched.slice((page - 1) * pageSize, page * pageSize)
    return { total, page, pageSize, items: pageItems }
  }

  statusLabel(status: string) {
    if (status === 'open') return '待攻克'
    if (status === 'consolidating') return '巩固中'
    if (status === 'mastered') return '已掌握'
    return status
  }

  async detail(userId: string, wrongItemId: string) {
    await this.ensureInitialized(userId)
    const row = await this.wrongRepo.findOne({
      where: { id: wrongItemId, userId },
    })
    if (!row) throw new NotFoundException('错题不存在')

    const item = await this.itemsRepo.findOne({ where: { id: row.itemId } })
    const sp = item
      ? await this.specialtiesRepo.findOne({ where: { id: item.specialtyId } })
      : null
    const cat = item
      ? await this.categoriesRepo.findOne({ where: { id: item.categoryId } })
      : null

    const events = await this.eventsRepo.find({
      where: { wrongItemId: row.id },
      order: { occurredAt: 'ASC' },
    })

    const wrongEvents = events.filter((e) => e.eventType === 'wrong')
    const history: Array<Record<string, unknown>> = []
    for (const ev of wrongEvents) {
      const si = await this.sessionItemsRepo.findOne({
        where: { id: ev.sessionItemId },
      })
      const sess = await this.sessionsRepo.findOne({
        where: { id: ev.sessionId, userId },
      })
      if (!si || !sess) continue
      history.push({
        sessionItemId: si.id,
        sessionId: sess.id,
        sessionKind: ev.sessionKind || sess.sessionKind,
        occurredAt: ev.occurredAt,
        userAnswer: si.userAnswer,
        standardAnswerSnapshot: si.answer,
        analysisSnapshot: si.analysis,
        stemSnapshot: si.stem,
        optionsSnapshot: si.optionsJson,
        gradeResult: si.gradeResult,
      })
    }

    const links = await this.linksRepo.find({ where: { itemId: row.itemId } })
    let practiceEligible = false
    let practiceBlockReason: string | null = null
    if (!item) {
      practiceBlockReason = '题目已删除，仅可查看历史快照'
    } else {
      const poolMode = item.pool === 'formal' ? 'formal' : 'test'
      if (poolMode === 'test') {
        const ok = await this.eligibility.canUseTestPool(userId)
        if (!ok) {
          practiceBlockReason = '无个人试运行权限'
        }
      }
      if (!practiceBlockReason) {
        const gate = await this.eligibility.isItemEligible(item, poolMode)
        practiceEligible = gate.ok
        if (!gate.ok) practiceBlockReason = gate.detail || gate.reason || '不符合准入'
      }
    }

    return {
      id: row.id,
      itemId: row.itemId,
      status: row.status,
      statusLabel: this.statusLabel(row.status),
      wrongCount: row.wrongCount,
      correctAfterWrongCount: row.correctAfterWrongCount,
      firstWrongAt: row.firstWrongAt,
      lastWrongAt: row.lastWrongAt,
      lastCorrectAt: row.lastCorrectAt,
      lastGradeResult: row.lastGradeResult,
      dueToday: this.isDueToday(row),
      practiceEligible,
      practiceBlockReason,
      specialtyCode: sp?.code || null,
      specialtyName: sp?.name || null,
      categoryCode: cat?.code || null,
      categoryName: cat?.name || null,
      difficulty: item ? Number(item.difficulty) : null,
      difficultyLabel: item
        ? DIFFICULTY_LABELS[Number(item.difficulty)] || String(item.difficulty)
        : null,
      code: item?.code || null,
      /** 当前题库题干（可能与历史不同）；历史以 history 为准 */
      currentStem: item?.stem || null,
      currentAnalysis: item?.analysis || null,
      currentAnalysisNote: '当前题库解析（可能已升级）；历次训练请看 history 快照',
      knowledgeLinks: links.map((l) => ({
        entityType: l.entityType,
        entityId: l.entityId,
      })),
      history,
      eventCount: events.length,
      masteryRules: {
        masterMinCorrect: WRONG_MASTER_MIN_CORRECT,
        masterGapDays: WRONG_MASTER_GAP_DAYS,
        note: '已掌握仅表示该「题目」；不代表知识点已掌握',
      },
      methodSummary: this.buildMethodSummary(item, links),
      variationPreview: item
        ? await this.buildVariationPreview(userId, row, item, links)
        : {
            candidateCount: 0,
            emptyHint: '题目不可用，无法推荐变式',
            items: [],
            rulesNote: '',
            catalogLoaded: false,
          },
    }
  }

  async weakStats(userId: string, opts?: { limit?: number }) {
    const limit = opts?.limit || 30
    const rows: Array<{
      specialty_id: string
      category_id: string
      correct_n: string
      wrong_n: string
      total_n: string
      last_wrong: Date | null
    }> = await this.dataSource.query(
      `SELECT i.specialty_id AS specialty_id,
              i.category_id AS category_id,
              SUM(si.grade_result='correct') AS correct_n,
              SUM(si.grade_result='wrong') AS wrong_n,
              SUM(si.grade_result IN ('correct','wrong')) AS total_n,
              MAX(CASE WHEN si.grade_result='wrong'
                   THEN COALESCE(si.answered_at,s.submitted_at) END) AS last_wrong
       FROM chem_train_session_items si
       JOIN chem_train_sessions s ON s.id = si.session_id
       JOIN chem_train_items i ON i.id = si.item_id
       WHERE s.user_id = ?
         AND s.status = 'completed'
         AND si.item_id IS NOT NULL
         AND si.grade_result IN ('correct','wrong')
       GROUP BY i.specialty_id, i.category_id`,
      [userId],
    )

    const wrongOpen: Array<{ specialty_id: string; category_id: string; n: string }> =
      await this.dataSource.query(
        `SELECT i.specialty_id AS specialty_id, i.category_id AS category_id, COUNT(*) AS n
         FROM chem_wrong_items w
         JOIN chem_train_items i ON i.id = w.item_id
         WHERE w.user_id = ? AND w.status IN ('open','consolidating')
         GROUP BY i.specialty_id, i.category_id`,
        [userId],
      )
    const openMap = new Map(
      wrongOpen.map((r) => [`${r.specialty_id}:${r.category_id}`, Number(r.n)]),
    )

    const spIds = [...new Set(rows.map((r) => String(r.specialty_id)))]
    const catIds = [...new Set(rows.map((r) => String(r.category_id)))]
    const sps = spIds.length
      ? await this.specialtiesRepo.find({ where: { id: In(spIds) } })
      : []
    const cats = catIds.length
      ? await this.categoriesRepo.find({ where: { id: In(catIds) } })
      : []
    const spMap = Object.fromEntries(sps.map((s) => [String(s.id), s]))
    const catMap = Object.fromEntries(cats.map((c) => [String(c.id), c]))

    const items = rows
      .map((r) => {
        const total = Number(r.total_n) || 0
        const wrong = Number(r.wrong_n) || 0
        const correct = Number(r.correct_n) || 0
        const key = `${r.specialty_id}:${r.category_id}`
        const sp = spMap[String(r.specialty_id)]
        const cat = catMap[String(r.category_id)]
        return {
          granularity: 'category' as const,
          specialtyCode: sp?.code || null,
          specialtyName: sp?.name || null,
          categoryCode: cat?.code || null,
          categoryName: cat?.name || null,
          totalAttempts: total,
          correctCount: correct,
          wrongCount: wrong,
          accuracyPercent: total ? Math.round((correct / total) * 1000) / 10 : null,
          openOrConsolidatingWrongItems: openMap.get(key) || 0,
          lastWrongAt: r.last_wrong,
        }
      })
      .filter((x) => x.wrongCount > 0 || x.openOrConsolidatingWrongItems > 0)
      .sort(
        (a, b) =>
          b.openOrConsolidatingWrongItems - a.openOrConsolidatingWrongItems ||
          b.wrongCount - a.wrongCount,
      )
      .slice(0, limit)

    return {
      note: '基于明确 correct/wrong 统计；pending_review 未计入。粒度：二级分类（非知识点掌握证明）',
      items,
    }
  }

  async createPracticeSession(userId: string, count: number) {
    if (![5, 10, 20].includes(count)) {
      throw new BadRequestException('题量仅支持 5 / 10 / 20')
    }
    await this.ensureInitialized(userId)

    const canTest = await this.eligibility.canUseTestPool(userId)

    const all = await this.wrongRepo.find({ where: { userId } })
    const open = all.filter((r) => r.status === 'open')
    const consolidatingDue = all.filter(
      (r) => r.status === 'consolidating' && this.isDueToday(r),
    )
    const consolidatingRest = all.filter(
      (r) => r.status === 'consolidating' && !this.isDueToday(r),
    )

    const ordered = [
      ...open.sort(
        (a, b) =>
          b.wrongCount - a.wrongCount ||
          new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime(),
      ),
      ...consolidatingDue.sort(
        (a, b) =>
          new Date(a.lastCorrectAt || a.lastWrongAt).getTime() -
          new Date(b.lastCorrectAt || b.lastWrongAt).getTime(),
      ),
      ...consolidatingRest.sort(
        (a, b) =>
          new Date(a.lastCorrectAt || a.lastWrongAt).getTime() -
          new Date(b.lastCorrectAt || b.lastWrongAt).getTime(),
      ),
    ]

    const picked: ChemTrainItem[] = []
    const skipped: Array<{ itemId: string; reason: string }> = []
    for (const w of ordered) {
      if (picked.length >= count) break
      const item = await this.itemsRepo.findOne({ where: { id: w.itemId } })
      if (!item) {
        skipped.push({ itemId: w.itemId, reason: 'missing' })
        continue
      }
      const poolMode = item.pool === 'formal' ? 'formal' : 'test'
      if (poolMode === 'test' && !canTest) {
        skipped.push({ itemId: w.itemId, reason: 'no_test_grant' })
        continue
      }
      const gate = await this.eligibility.isItemEligible(item, poolMode)
      if (!gate.ok) {
        skipped.push({
          itemId: w.itemId,
          reason: gate.reason || 'ineligible',
        })
        continue
      }
      if (picked.some((p) => String(p.id) === String(item.id))) continue
      // 同一会话不混池：以首题池为准
      if (picked.length && picked[0].pool !== item.pool) {
        skipped.push({ itemId: w.itemId, reason: 'pool_mix_skip' })
        continue
      }
      picked.push(item)
    }

    if (!picked.length) {
      if (!canTest && skipped.some((s) => s.reason === 'no_test_grant')) {
        throw new ForbiddenException('无个人试运行权限，无法复练试运行池错题')
      }
      throw new BadRequestException(
        '当前没有可复练的错题（可能均已掌握、停用/block，或无可用准入题）',
      )
    }

    const sessionPool = picked[0].pool === 'formal' ? 'formal' : 'test'
    const now = new Date()
    const session = await this.sessionsRepo.save(
      this.sessionsRepo.create({
        userId,
        sessionKind: 'wrong_review',
        dailyDate: null,
        specialtyId: null,
        categoryId: null,
        poolMode: sessionPool,
        difficulty: 0,
        plannedCount: count,
        actualCount: picked.length,
        mode: 'sequential',
        status: 'in_progress',
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        pendingCount: 0,
        durationMs: 0,
        startedAt: now,
        submittedAt: null,
        countsFormalStats: false,
      }),
    )

    const rows = picked.map((item, i) =>
      this.sessionItemsRepo.create({
        sessionId: session.id,
        sortOrder: i + 1,
        itemId: item.id,
        itemCode: item.code,
        qtype: item.qtype,
        answerType: item.answerType || 'text',
        stem: item.stem,
        optionsJson: item.optionsJson,
        answer: item.answer,
        answerAliasesJson: item.answerAliasesJson,
        analysis: item.analysis,
        userAnswer: null,
        gradeResult: null,
        gradeReason: null,
        answeredAt: null,
      }),
    )
    await this.sessionItemsRepo.save(rows)

    const detail = await this.trainService.getSession(userId, session.id)
    return {
      ...detail,
      pickMeta: {
        planned: count,
        actual: picked.length,
        shortfall:
          picked.length < count
            ? `可复练错题不足，本次 ${picked.length} 道（计划 ${count}）；未用普通题凑数`
            : null,
        skippedIneligible: skipped.length,
        sessionKind: 'wrong_review',
        countsDailyCompletion: false,
        note: '错题复练不计入每日10分钟完成次数',
      },
    }
  }

  // ─── Phase2：解题方法 + 变式推荐 / 训练 ───────────────────────────

  private buildMethodSummary(
    item: ChemTrainItem | null,
    links: ChemTrainItemLink[],
  ) {
    const disclaimer =
      '以下为题库/题型模型中的解题要点，不代表对你本次错误原因的认定。'
    if (!item) {
      return {
        available: false,
        disclaimer,
        source: null as string | null,
        knowledgePoints: null as string | null,
        breakthrough: null as string | null,
        keyConditions: null as string | null,
        coreMethod: null as string | null,
        commonMistakes: null as string | null,
        similarRecognition: null as string | null,
      }
    }

    const sections = parseAnalysisSections(item.analysis)
    const hasSelf =
      !!(
        sections.breakthrough ||
        sections.coreMethod ||
        sections.commonMistakes ||
        sections.keyConditions ||
        sections.similarRecognition
      )

    if (hasSelf) {
      return {
        available: true,
        disclaimer,
        source: 'current_item_analysis',
        knowledgePoints: sections.knowledgePoints,
        breakthrough: sections.breakthrough,
        keyConditions: sections.keyConditions,
        coreMethod: sections.coreMethod,
        commonMistakes: sections.commonMistakes,
        similarRecognition: sections.similarRecognition,
      }
    }

    const catalog = loadAdvModelCatalog()
    const modelId = parseModelIdFromGateNote(item.gateNote)
    const model = modelId ? catalog.byId.get(modelId) : undefined
    if (model && (model.breakthrough || (model.coreMethods || []).length)) {
      return {
        available: true,
        disclaimer,
        source: `model_catalog:${model.id}`,
        knowledgePoints:
          (model.knowledgePoints || []).join('；') ||
          sections.knowledgePoints,
        breakthrough: model.breakthrough || null,
        keyConditions: (model.variableConditions || []).join('；') || null,
        coreMethod: (model.coreMethods || []).join('；') || null,
        commonMistakes: (model.commonErrors || []).join('；') || null,
        similarRecognition: model.stemStructure || null,
      }
    }

    void links
    return {
      available: false,
      disclaimer,
      source: null,
      knowledgePoints: sections.knowledgePoints,
      breakthrough: null,
      keyConditions: null,
      coreMethod: null,
      commonMistakes: null,
      similarRecognition: null,
    }
  }

  private async buildVariationPreview(
    userId: string,
    wrongRow: ChemWrongItem,
    sourceItem: ChemTrainItem,
    sourceLinks: ChemTrainItemLink[],
  ) {
    const picked = await this.collectVariationCandidates(userId, wrongRow, sourceItem, sourceLinks, {
      limit: 20,
    })
    const catalog = loadAdvModelCatalog()
    return {
      candidateCount: picked.length,
      emptyHint:
        picked.length === 0
          ? '暂无合适变式题目，建议先复习原题。'
          : null,
      items: picked.slice(0, 8).map((p) => ({
        itemId: p.item.id,
        code: p.item.code,
        stemPreview: String(p.item.stem || '').slice(0, 60),
        tier: p.rank.tier,
        tierLabel: tierLabel(p.rank.tier),
        reason: p.rank.reason,
        mechanicalDup: p.rank.mechanicalDup,
        modelId: p.modelId,
      })),
      rulesNote:
        '须有明确知识链接或目录内模型技能重叠；仅同专项/仅同分类不推荐；不凑无关题。',
      catalogLoaded: catalog.ok,
    }
  }

  private async collectVariationCandidates(
    userId: string,
    wrongRow: ChemWrongItem,
    sourceItem: ChemTrainItem,
    sourceLinks: ChemTrainItemLink[],
    opts: { limit: number },
  ) {
    const catalog = loadAdvModelCatalog()
    const sourceModelId = parseModelIdFromGateNote(sourceItem.gateNote)
    const sourceModel = sourceModelId
      ? catalog.byId.get(sourceModelId)
      : undefined
    const sourceSkel = stemSkeleton(sourceItem.stem)
    const sourceLinkDtos = sourceLinks.map((l) => ({
      entityType: l.entityType,
      entityId: String(l.entityId),
    }))

    const excludeStatuses = await this.wrongRepo.find({
      where: { userId },
    })
    const excludeItemIds = new Set<string>([
      String(sourceItem.id),
      ...excludeStatuses
        .filter((w) => w.status === 'consolidating' || w.status === 'mastered')
        .map((w) => String(w.itemId)),
    ])

    const canTest = await this.eligibility.canUseTestPool(userId)
    // 候选搜索范围（仍须过严格 rank；同专项/分类本身不足）
    const qb = this.itemsRepo
      .createQueryBuilder('i')
      .where('i.status = :st', { st: 'approved' })
      .andWhere('i.is_active = 1')
      .andWhere('i.id != :sid', { sid: sourceItem.id })
      .andWhere(
        '(i.category_id = :cid OR i.specialty_id = :spid' +
          (sourceModelId ? ' OR i.gate_note LIKE :modelLike' : '') +
          ')',
        {
          cid: sourceItem.categoryId,
          spid: sourceItem.specialtyId,
          ...(sourceModelId ? { modelLike: `%model=${sourceModelId}%` } : {}),
        },
      )
      .take(500)
    const poolCandidates = await qb.getMany()

    // 补充：与源题共享精确知识链接的题（可能跨分类）
    let linkNeighbors: ChemTrainItem[] = []
    if (sourceLinkDtos.length) {
      const orParts = sourceLinkDtos
        .slice(0, 20)
        .map(
          (_, idx) =>
            `(l.entity_type = :et${idx} AND l.entity_id = :eid${idx})`,
        )
        .join(' OR ')
      const params: Record<string, string> = {}
      sourceLinkDtos.slice(0, 20).forEach((l, idx) => {
        params[`et${idx}`] = l.entityType
        params[`eid${idx}`] = l.entityId
      })
      linkNeighbors = await this.itemsRepo
        .createQueryBuilder('i')
        .innerJoin(ChemTrainItemLink, 'l', 'l.item_id = i.id')
        .where('i.status = :st', { st: 'approved' })
        .andWhere('i.is_active = 1')
        .andWhere('i.id != :sid', { sid: sourceItem.id })
        .andWhere(`(${orParts})`, params)
        .take(200)
        .getMany()
    }

    const byId = new Map<string, ChemTrainItem>()
    for (const i of [...poolCandidates, ...linkNeighbors]) {
      byId.set(String(i.id), i)
    }
    const mergedPool = [...byId.values()]

    const candIds = mergedPool.map((i) => i.id)
    const allLinks = candIds.length
      ? await this.linksRepo.find({ where: { itemId: In(candIds) } })
      : []
    const linksByItem = new Map<string, ChemTrainItemLink[]>()
    for (const l of allLinks) {
      const k = String(l.itemId)
      const arr = linksByItem.get(k) || []
      arr.push(l)
      linksByItem.set(k, arr)
    }

    type Scored = {
      item: ChemTrainItem
      rank: ReturnType<typeof rankVariationCandidate>
      modelId: string | null
    }
    const scored: Scored[] = []

    for (const cand of mergedPool) {
      if (excludeItemIds.has(String(cand.id))) continue
      const poolMode = cand.pool === 'formal' ? 'formal' : 'test'
      if (poolMode === 'test' && !canTest) continue
      const gate = await this.eligibility.isItemEligible(cand, poolMode)
      if (!gate.ok) continue

      const cl = (linksByItem.get(String(cand.id)) || []).map((l) => ({
        entityType: l.entityType,
        entityId: String(l.entityId),
      }))
      const candModelId = parseModelIdFromGateNote(cand.gateNote)
      const candModel = candModelId ? catalog.byId.get(candModelId) : undefined
      const rank = rankVariationCandidate({
        sourceLinks: sourceLinkDtos,
        candLinks: cl,
        sameCategory: String(cand.categoryId) === String(sourceItem.categoryId),
        sameSpecialty: String(cand.specialtyId) === String(sourceItem.specialtyId),
        sourceModelId,
        candModelId,
        sourceModel,
        candModel,
        sourceSkeleton: sourceSkel,
        candSkeleton: stemSkeleton(cand.stem),
      })
      if (rank.tier === 'none') continue
      // 实质重复：骨架完全相同 → 排除；机械变式降权但仍可在不足时保留
      if (rank.mechanicalDup && stemSkeleton(cand.stem) === sourceSkel) continue
      scored.push({ item: cand, rank, modelId: candModelId })
    }

    scored.sort((a, b) => {
      if (a.rank.tierRank !== b.rank.tierRank) return a.rank.tierRank - b.rank.tierRank
      if (a.rank.mechanicalDup !== b.rank.mechanicalDup) {
        return a.rank.mechanicalDup ? 1 : -1
      }
      return Number(a.item.id) - Number(b.item.id)
    })

    // 同骨架机械重复：同档内只保留一道（优先非机械）
    const seenSkel = new Set<string>()
    const deduped: Scored[] = []
    for (const s of scored) {
      const sk = stemSkeleton(s.item.stem)
      if (s.rank.mechanicalDup) {
        if (seenSkel.has(sk)) continue
        seenSkel.add(sk)
      }
      deduped.push(s)
      if (deduped.length >= opts.limit) break
    }
    return deduped
  }

  async createVariationSession(userId: string, wrongItemId: string, count: number) {
    if (![5, 10, 20].includes(count)) {
      throw new BadRequestException('题量仅支持 5 / 10 / 20')
    }
    await this.ensureInitialized(userId)
    const wrongRow = await this.wrongRepo.findOne({
      where: { id: wrongItemId, userId },
    })
    if (!wrongRow) throw new NotFoundException('错题不存在')

    const sourceItem = await this.itemsRepo.findOne({
      where: { id: wrongRow.itemId },
    })
    if (!sourceItem) {
      throw new BadRequestException('原题已不可用，无法开始变式训练')
    }
    const sourceLinks = await this.linksRepo.find({
      where: { itemId: sourceItem.id },
    })

    // 正式组卷前重新校验候选（与 preview 同规则）
    const candidates = await this.collectVariationCandidates(
      userId,
      wrongRow,
      sourceItem,
      sourceLinks,
      { limit: count },
    )
    if (!candidates.length) {
      throw new BadRequestException('暂无合适变式题目，建议先复习原题。')
    }

    const picked = candidates.slice(0, count)
    const sessionPool = picked[0].item.pool === 'formal' ? 'formal' : 'test'
    const now = new Date()
    const session = await this.sessionsRepo.save(
      this.sessionsRepo.create({
        userId,
        sessionKind: 'wrong_variation',
        dailyDate: null,
        specialtyId: null,
        categoryId: null,
        poolMode: sessionPool,
        difficulty: 0,
        plannedCount: count,
        actualCount: picked.length,
        mode: 'sequential',
        status: 'in_progress',
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        pendingCount: 0,
        durationMs: 0,
        startedAt: now,
        submittedAt: null,
        countsFormalStats: false,
        sourceWrongItemId: wrongRow.id,
      }),
    )

    const rows = picked.map((p, i) =>
      this.sessionItemsRepo.create({
        sessionId: session.id,
        sortOrder: i + 1,
        itemId: p.item.id,
        itemCode: p.item.code,
        qtype: p.item.qtype,
        answerType: p.item.answerType || 'text',
        stem: p.item.stem,
        optionsJson: p.item.optionsJson,
        answer: p.item.answer,
        answerAliasesJson: p.item.answerAliasesJson,
        analysis: p.item.analysis,
        userAnswer: null,
        gradeResult: null,
        gradeReason: null,
        answeredAt: null,
      }),
    )
    await this.sessionItemsRepo.save(rows)

    const detail = await this.trainService.getSession(userId, session.id)
    const tierCounts: Partial<Record<VariationTier, number>> = {}
    for (const p of picked) {
      tierCounts[p.rank.tier] = (tierCounts[p.rank.tier] || 0) + 1
    }
    return {
      ...detail,
      sourceWrongItemId: wrongRow.id,
      pickMeta: {
        planned: count,
        actual: picked.length,
        shortfall:
          picked.length < count
            ? `合格变式仅 ${picked.length} 道（计划 ${count}）；未用无关题凑数`
            : null,
        sessionKind: 'wrong_variation',
        countsDailyCompletion: false,
        sourceWrongItemId: wrongRow.id,
        tierCounts,
        note: '变式训练不计入每日10分钟；结果只更新变式题自身错题状态，不改写来源错题状态',
      },
    }
  }
}
