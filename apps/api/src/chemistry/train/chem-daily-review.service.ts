import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { ChemCategory } from '../chem-category.entity'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemTrainEligibilityService } from './chem-train-eligibility.service'
import { ChemTrainSessionDiagramService } from './chem-train-session-diagram.service'
import { ChemTrainService } from './chem-train.service'
import { ChemTrainItem } from './entities/chem-train-item.entity'
import { ChemTrainItemLink } from './entities/chem-train-item-link.entity'
import { ChemTrainSession } from './entities/chem-train-session.entity'
import { ChemTrainSessionItem } from './entities/chem-train-session-item.entity'
import { INDUSTRIAL_SPECIALTY_CODE } from '../industrial/industrial-case.constants'
import { isChemIndustrialExperimentEnabled } from '../industrial/industrial-feature.config'
import {
  shanghaiDateMinusDays,
  shanghaiDateString,
} from './shanghai-date.util'

const TARGET_COUNT = 10
const TARGET_BASIC = 8
const TARGET_RAISE = 2
const SOFT_WRONG = 4
const SOFT_STALE = 3
const SOFT_RANDOM = 3

type RecencyBucket = 'today' | 'd1_3' | 'd4_7' | 'fresh'

@Injectable()
export class ChemDailyReviewService {
  constructor(
    @InjectRepository(ChemTrainItem)
    private readonly itemsRepo: Repository<ChemTrainItem>,
    @InjectRepository(ChemTrainItemLink)
    private readonly linksRepo: Repository<ChemTrainItemLink>,
    @InjectRepository(ChemTrainSession)
    private readonly sessionsRepo: Repository<ChemTrainSession>,
    @InjectRepository(ChemTrainSessionItem)
    private readonly sessionItemsRepo: Repository<ChemTrainSessionItem>,
    @InjectRepository(ChemSpecialty)
    private readonly specialtiesRepo: Repository<ChemSpecialty>,
    @InjectRepository(ChemCategory)
    private readonly categoriesRepo: Repository<ChemCategory>,
    private readonly eligibility: ChemTrainEligibilityService,
    private readonly sessionDiagrams: ChemTrainSessionDiagramService,
    private readonly trainService: ChemTrainService,
  ) {}

  async status(userId: string) {
    const today = shanghaiDateString()
    const canUseTest = await this.eligibility.canUseTestPool(userId)
    const poolMode: 'formal' | 'test' = canUseTest ? 'test' : 'formal'

    const inProgressRows = await this.sessionsRepo.find({
      where: {
        userId,
        sessionKind: 'daily',
        dailyDate: today,
        status: 'in_progress',
      },
      order: { startedAt: 'DESC' },
      take: 1,
    })
    const inProgress = inProgressRows[0]

    const completedToday = await this.sessionsRepo.count({
      where: {
        userId,
        sessionKind: 'daily',
        dailyDate: today,
        status: 'completed',
      },
    })

    const candidateCount = (await this.loadEligiblePool(poolMode)).length

    return {
      timezone: 'Asia/Shanghai',
      today,
      canTrain: candidateCount > 0 && (poolMode === 'formal' || canUseTest),
      canUseTestPool: canUseTest,
      poolMode,
      candidateCount,
      targetCount: TARGET_COUNT,
      estimatedMinutes: 10,
      todayCompletedOnce: completedToday > 0,
      todayCompletedCount: completedToday,
      inProgressSessionId: inProgress?.id ?? null,
      inProgressAnswered: inProgress?.answeredCount ?? 0,
      inProgressActual: inProgress?.actualCount ?? 0,
      aiTrialNotice: canUseTest
        ? 'AI初审题库，尚未完成全部人工学科审核。'
        : null,
      emptyHint:
        candidateCount <= 0
          ? poolMode === 'test'
            ? '当前试运行题库暂无可用基础巩固题。'
            : '正式题库暂无题目；请联系管理员开通化学个人试运行权限。'
          : null,
      durationNote: '用时为开始训练到提交的经过时间，非专注时长统计。',
    }
  }

  async createSession(userId: string) {
    const st = await this.status(userId)
    if (!st.canTrain) {
      throw new BadRequestException(st.emptyHint || '暂无可用题目')
    }
    if (st.poolMode === 'test') {
      const ok = await this.eligibility.canUseTestPool(userId)
      if (!ok) throw new ForbiddenException('无权使用试运行题库')
    }

    const today = st.today
    // 主动开始新训练：取消当日未完成的每日会话
    const openOnes = await this.sessionsRepo.find({
      where: {
        userId,
        sessionKind: 'daily',
        dailyDate: today,
        status: 'in_progress',
      },
    })
    for (const s of openOnes) {
      s.status = 'cancelled'
      await this.sessionsRepo.save(s)
    }

    const picked = await this.pickDailyItems(userId, st.poolMode, today)
    if (!picked.length) {
      throw new BadRequestException('暂无可用题目，无法开始每日训练')
    }

    const now = new Date()
    const session = await this.sessionsRepo.save(
      this.sessionsRepo.create({
        userId,
        sessionKind: 'daily',
        dailyDate: today,
        specialtyId: null,
        categoryId: null,
        poolMode: st.poolMode,
        difficulty: 1,
        plannedCount: TARGET_COUNT,
        actualCount: picked.length,
        mode: 'random',
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
    try {
      await this.sessionDiagrams.snapshotForSavedItems(rows)
    } catch (e) {
      await this.sessionsRepo.delete({ id: session.id })
      throw e
    }

    const detail = await this.trainService.getSession(userId, session.id)
    return {
      ...detail,
      pickMeta: {
        planned: TARGET_COUNT,
        actual: picked.length,
        shortfall:
          picked.length < TARGET_COUNT
            ? `可用题不足，本次实际 ${picked.length} 道（目标 ${TARGET_COUNT}）`
            : null,
        difficultyMix: {
          basic: picked.filter((x) => x.difficulty === 1).length,
          raise: picked.filter((x) => x.difficulty === 2).length,
        },
      },
    }
  }

  async history(userId: string, page = 1, pageSize = 20) {
    const p = Math.max(1, page)
    const ps = Math.min(50, Math.max(1, pageSize))

    const qb = this.sessionsRepo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })
      .andWhere("s.session_kind = 'daily'")
      .andWhere("s.status = 'completed'")
      .orderBy('s.daily_date', 'DESC')
      .addOrderBy('s.submitted_at', 'DESC')

    const total = await qb.getCount()
    const rows = await qb
      .skip((p - 1) * ps)
      .take(ps)
      .getMany()

    // 按日聚合摘要
    const dayMap = new Map<
      string,
      {
        date: string
        completedCount: number
        sessions: Array<{
          id: string
          actualCount: number
          correctCount: number
          wrongCount: number
          pendingCount: number
          accuracyPercent: number | null
          durationMs: number
          startedAt: Date
          submittedAt: Date | null
        }>
      }
    >()

    for (const s of rows) {
      const date = String(s.dailyDate || '').slice(0, 10)
      if (!dayMap.has(date)) {
        dayMap.set(date, { date, completedCount: 0, sessions: [] })
      }
      const bucket = dayMap.get(date)!
      const scored = s.correctCount + s.wrongCount
      const accuracy =
        scored > 0
          ? Math.round((s.correctCount / scored) * 1000) / 10
          : null
      bucket.sessions.push({
        id: s.id,
        actualCount: s.actualCount,
        correctCount: s.correctCount,
        wrongCount: s.wrongCount,
        pendingCount: s.pendingCount,
        accuracyPercent: accuracy,
        durationMs: s.durationMs,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
      })
    }

    // 补全每日完成次数（不受分页 sessions 限制：对涉及日期再查 count）
    for (const [date, bucket] of dayMap) {
      bucket.completedCount = await this.sessionsRepo.count({
        where: {
          userId,
          sessionKind: 'daily',
          dailyDate: date,
          status: 'completed',
        },
      })
    }

    return {
      timezone: 'Asia/Shanghai',
      total,
      page: p,
      pageSize: ps,
      durationNote: '用时为开始训练到提交的经过时间，非专注时长统计。',
      days: Array.from(dayMap.values()),
    }
  }

  /** 完成页知识点摘要（仅基于本会话真实结果） */
  async buildDailyInsight(userId: string, sessionId: string) {
    const session = await this.sessionsRepo.findOne({ where: { id: sessionId } })
    if (!session || session.userId !== userId || session.sessionKind !== 'daily') {
      throw new NotFoundException('每日训练不存在')
    }
    const items = await this.sessionItemsRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
    })
    const itemIds = items.map((i) => i.itemId).filter(Boolean) as string[]
    const bankItems = itemIds.length
      ? await this.itemsRepo.find({ where: { id: In(itemIds) } })
      : []
    const byId = new Map(bankItems.map((b) => [String(b.id), b]))
    const specs = await this.specialtiesRepo.find()
    const cats = await this.categoriesRepo.find()
    const specMap = new Map(specs.map((s) => [String(s.id), s]))
    const catMap = new Map(cats.map((c) => [String(c.id), c]))

    const involved: string[] = []
    const wrongLabels: string[] = []
    const wrongCatCount = new Map<string, number>()

    for (const it of items) {
      const bank = it.itemId ? byId.get(String(it.itemId)) : undefined
      if (!bank) continue
      const sp = specMap.get(String(bank.specialtyId))
      const cat = catMap.get(String(bank.categoryId))
      const label = [sp?.name, cat?.name].filter(Boolean).join(' · ')
      if (label && !involved.includes(label)) involved.push(label)
      if (it.gradeResult === 'wrong' && label) {
        if (!wrongLabels.includes(label)) wrongLabels.push(label)
        wrongCatCount.set(label, (wrongCatCount.get(label) || 0) + 1)
      }
    }

    let tip = '今日基础巩固已完成，建议保持每天练习。'
    if (wrongLabels.length) {
      const top = [...wrongCatCount.entries()].sort((a, b) => b[1] - a[1])[0]
      if (top) {
        tip = `本次「${top[0]}」相关题目出现 ${top[1]} 次错误，建议近期重点巩固该知识点（优先同类变式，而非机械重复同一道题）。`
      }
    } else if (session.status === 'completed' && session.wrongCount === 0) {
      tip = '本次没有判错的题目，可继续保持；若有待复核题，请对照解析自行核对。'
    }

    return {
      involvedKnowledge: involved,
      wrongKnowledge: wrongLabels,
      reviewTip: tip,
      durationNote: '用时为开始训练到提交的经过时间，非专注时长统计。',
    }
  }

  // —— 组卷 ——

  private async loadEligiblePool(poolMode: 'formal' | 'test') {
    const rows = await this.itemsRepo.find({
      where: {
        pool: poolMode,
        status: 'approved',
        isActive: true,
      },
      order: { id: 'ASC' },
    })
    let eligible = await this.eligibility.filterEligibleItems(rows, poolMode)
    // 工业实验关闭时不进入每日复习抽题
    if (!isChemIndustrialExperimentEnabled()) {
      const ind = await this.specialtiesRepo.findOne({
        where: { code: INDUSTRIAL_SPECIALTY_CODE, isActive: true },
      })
      if (ind) {
        eligible = eligible.filter((i) => String(i.specialtyId) !== String(ind.id))
      }
    }
    // 排除标记 [daily:exclude] 的提高/挑战等长时题；不硬编码批次前缀。
    return eligible.filter(
      (i) =>
        (i.difficulty === 1 || i.difficulty === 2) &&
        !/\[daily:exclude\]/i.test(String(i.gateNote || '')),
    )
  }

  private async pickDailyItems(
    userId: string,
    poolMode: 'formal' | 'test',
    today: string,
  ): Promise<ChemTrainItem[]> {
    const pool = await this.loadEligiblePool(poolMode)
    if (!pool.length) return []

    const day3 = shanghaiDateMinusDays(3)
    const day7 = shanghaiDateMinusDays(7)
    const recency = await this.loadRecency(userId, today, day3, day7)
    const wrongCtx = await this.loadWrongContext(userId)

    const linksByItem = await this.linksByItemIds(pool.map((p) => p.id))

    const scored = pool.map((item) => {
      const bucket = recency.bucketOf(item.id)
      const wrongRank = this.wrongMatchRank(item, wrongCtx, linksByItem)
      let w = 1
      if (bucket === 'today') w *= 0.02
      else if (bucket === 'd1_3') w *= 0.12
      else if (bucket === 'd4_7') w *= 0.45
      if (wrongRank === 1) w *= 4.5
      else if (wrongRank === 2) w *= 3.2
      else if (wrongRank === 3) w *= 2.0
      else if (wrongRank === 4) w *= 1.15
      if (item.difficulty === 1) w *= 1.05
      return { item, w, bucket, wrongRank }
    })

    const picked: ChemTrainItem[] = []
    const pickedIds = new Set<string>()
    const specialtyUsed = new Map<string, number>()
    const categoryUsed = new Map<string, number>()

    const takeFrom = (
      filter: (x: (typeof scored)[0]) => boolean,
      n: number,
      preferExcludeToday = true,
    ) => {
      let need = n
      const tryPick = (extra: (x: (typeof scored)[0]) => boolean) => {
        const cand = scored
          .filter(
            (x) =>
              !pickedIds.has(String(x.item.id)) &&
              filter(x) &&
              extra(x),
          )
          .sort((a, b) => {
            const da =
              (categoryUsed.get(String(a.item.categoryId)) || 0) -
              (categoryUsed.get(String(b.item.categoryId)) || 0)
            if (da !== 0) return da
            const ds =
              (specialtyUsed.get(String(a.item.specialtyId)) || 0) -
              (specialtyUsed.get(String(b.item.specialtyId)) || 0)
            if (ds !== 0) return ds
            return b.w - a.w || Math.random() - 0.5
          })
        for (const c of cand) {
          if (need <= 0) break
          // 同题优先跳过：若已有同 code 不取（id 唯一即可）
          picked.push(c.item)
          pickedIds.add(String(c.item.id))
          specialtyUsed.set(
            String(c.item.specialtyId),
            (specialtyUsed.get(String(c.item.specialtyId)) || 0) + 1,
          )
          categoryUsed.set(
            String(c.item.categoryId),
            (categoryUsed.get(String(c.item.categoryId)) || 0) + 1,
          )
          need--
        }
      }
      if (preferExcludeToday) {
        tryPick((x) => x.bucket !== 'today')
      }
      if (need > 0) tryPick(() => true)
    }

    // 软比例：错题相关 → 久未练 → 随机；难度目标 8:2
    takeFrom((x) => x.wrongRank >= 1 && x.wrongRank <= 3, SOFT_WRONG)
    takeFrom(
      (x) => x.bucket === 'fresh' || x.bucket === 'd4_7',
      SOFT_STALE,
    )
    takeFrom(() => true, SOFT_RANDOM)

    // 填满到 TARGET，优先基础题
    const basicNeed = Math.max(
      0,
      TARGET_BASIC - picked.filter((p) => p.difficulty === 1).length,
    )
    takeFrom((x) => x.item.difficulty === 1, basicNeed)
    const raiseNeed = Math.max(
      0,
      TARGET_RAISE - picked.filter((p) => p.difficulty === 2).length,
    )
    takeFrom((x) => x.item.difficulty === 2, raiseNeed)
    takeFrom(() => true, TARGET_COUNT - picked.length)

    // 若提高题过多，尝试用基础题替换尾部（有则换）
    while (
      picked.filter((p) => p.difficulty === 2).length > TARGET_RAISE &&
      picked.length >= TARGET_RAISE + 1
    ) {
      const idx = picked.findIndex((p) => p.difficulty === 2)
      const replacement = scored.find(
        (x) =>
          !pickedIds.has(String(x.item.id)) &&
          x.item.difficulty === 1 &&
          x.bucket !== 'today',
      )
      if (idx < 0 || !replacement) break
      const old = picked[idx]
      pickedIds.delete(String(old.id))
      picked[idx] = replacement.item
      pickedIds.add(String(replacement.item.id))
    }

    return this.shuffle(picked).slice(0, TARGET_COUNT)
  }

  private wrongMatchRank(
    item: ChemTrainItem,
    ctx: {
      linkKeys: Set<string>
      categoryIds: Set<string>
      specialtyIds: Set<string>
      wrongItemIds: Set<string>
    },
    linksByItem: Map<string, Array<{ entityType: string; entityId: string }>>,
  ): 0 | 1 | 2 | 3 | 4 {
    if (ctx.wrongItemIds.has(String(item.id))) {
      // 原错题：允许但优先级低于同知识点其他题
      return 2
    }
    const links = linksByItem.get(String(item.id)) || []
    for (const l of links) {
      if (ctx.linkKeys.has(`${l.entityType}:${l.entityId}`)) return 1
    }
    if (ctx.categoryIds.has(String(item.categoryId))) return 3
    if (ctx.specialtyIds.has(String(item.specialtyId))) return 4
    return 0
  }

  private async loadWrongContext(userId: string) {
    const rows: Array<{
      item_id: string
      specialty_id: string
      category_id: string
    }> = await this.sessionsRepo.manager.query(
      `SELECT si.item_id AS item_id, i.specialty_id AS specialty_id, i.category_id AS category_id
       FROM chem_train_session_items si
       JOIN chem_train_sessions s ON s.id = si.session_id
       JOIN chem_train_items i ON i.id = si.item_id
       WHERE s.user_id = ?
         AND s.status = 'completed'
         AND si.grade_result = 'wrong'
         AND si.item_id IS NOT NULL
       ORDER BY s.submitted_at DESC
       LIMIT 200`,
      [userId],
    )
    const wrongItemIds = new Set(rows.map((r) => String(r.item_id)))
    const categoryIds = new Set(rows.map((r) => String(r.category_id)))
    const specialtyIds = new Set(rows.map((r) => String(r.specialty_id)))
    const links = wrongItemIds.size
      ? await this.linksRepo.find({
          where: { itemId: In([...wrongItemIds]) },
        })
      : []
    const linkKeys = new Set(
      links.map((l) => `${l.entityType}:${l.entityId}`),
    )
    return { linkKeys, categoryIds, specialtyIds, wrongItemIds }
  }

  private async loadRecency(
    userId: string,
    today: string,
    day3: string,
    day7: string,
  ) {
    const rows: Array<{
      item_id: string
      session_kind: string
      daily_date: string | null
      started_at: Date
    }> = await this.sessionsRepo.manager.query(
      `SELECT si.item_id AS item_id, s.session_kind AS session_kind,
              s.daily_date AS daily_date, s.started_at AS started_at
       FROM chem_train_session_items si
       JOIN chem_train_sessions s ON s.id = si.session_id
       WHERE s.user_id = ?
         AND s.status IN ('completed', 'in_progress')
         AND si.item_id IS NOT NULL
         AND s.started_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY)`,
      [userId],
    )

    const lastDay = new Map<string, string>()
    for (const r of rows) {
      const day =
        r.session_kind === 'daily' && r.daily_date
          ? String(r.daily_date).slice(0, 10)
          : shanghaiDateString(new Date(r.started_at))
      if (day < day7) continue
      const id = String(r.item_id)
      const prev = lastDay.get(id)
      if (!prev || day > prev) lastDay.set(id, day)
    }

    const bucketOf = (itemId: string): RecencyBucket => {
      const d = lastDay.get(String(itemId))
      if (!d) return 'fresh'
      if (d === today) return 'today'
      if (d > day3) return 'd1_3' // (day3, today) → 近3天内（不含今天已单独处理）
      if (d >= day3) return 'd1_3'
      if (d >= day7) return 'd4_7'
      return 'fresh'
    }
    return { bucketOf }
  }

  private async linksByItemIds(itemIds: string[]) {
    const map = new Map<
      string,
      Array<{ entityType: string; entityId: string }>
    >()
    if (!itemIds.length) return map
    const links = await this.linksRepo.find({
      where: { itemId: In(itemIds) },
    })
    for (const l of links) {
      const k = String(l.itemId)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push({
        entityType: l.entityType,
        entityId: String(l.entityId),
      })
    }
    return map
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}
