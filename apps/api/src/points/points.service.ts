import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import {
  DAILY_POINTS_CAP,
  DEFAULT_REWARD_TIERS,
  POINT_RULES,
  PointReason,
  REASON_LABELS,
} from './points.constants'
import { ListLedgerQueryDto, UpdateRewardTierDto } from './dto/points.dto'
import {
  PointLedger,
  RewardTier,
  UserPoints,
  UserRewardUnlock,
} from './point.entities'

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name)

  constructor(
    @InjectRepository(UserPoints)
    private readonly pointsRepo: Repository<UserPoints>,
    @InjectRepository(PointLedger)
    private readonly ledgerRepo: Repository<PointLedger>,
    @InjectRepository(RewardTier)
    private readonly tierRepo: Repository<RewardTier>,
    @InjectRepository(UserRewardUnlock)
    private readonly unlockRepo: Repository<UserRewardUnlock>,
    private readonly dataSource: DataSource,
  ) {}

  /** 安全加分：失败只打日志，不抛给业务 */
  async awardSafe(
    userId: string,
    reason: PointReason,
    refId: string,
    note?: string,
    refType?: string,
  ) {
    try {
      return await this.award(userId, reason, refId, note, refType)
    } catch (e) {
      this.logger.warn(
        `award failed user=${userId} reason=${reason} ref=${refId}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      )
      return null
    }
  }

  async award(
    userId: string,
    reason: PointReason,
    refId: string,
    note?: string,
    refType?: string,
  ) {
    const rule = POINT_RULES[reason]
    if (!rule || rule.points <= 0) return null

    const existing = await this.ledgerRepo.findOne({
      where: { userId, reason, refId },
    })
    if (existing) return null

    const todayStart = this.todayStart()
    const daySumRaw = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.points),0)', 'sum')
      .where('l.user_id = :userId', { userId })
      .andWhere('l.created_at >= :todayStart', { todayStart })
      .getRawOne<{ sum: string }>()
    const daySum = Number(daySumRaw?.sum || 0)
    if (daySum >= DAILY_POINTS_CAP) return null

    const reasonDayCnt = await this.ledgerRepo
      .createQueryBuilder('l')
      .where('l.user_id = :userId', { userId })
      .andWhere('l.reason = :reason', { reason })
      .andWhere('l.created_at >= :todayStart', { todayStart })
      .getCount()
    if (reasonDayCnt >= rule.dailyMax) return null

    const give = Math.min(rule.points, DAILY_POINTS_CAP - daySum)
    if (give <= 0) return null

    await this.ensurePointsRow(userId)
    await this.ensureDefaultTiers(userId)

    try {
      await this.ledgerRepo.save(
        this.ledgerRepo.create({
          userId,
          reason,
          points: give,
          refType: refType || reason,
          refId,
          note: note || REASON_LABELS[reason] || reason,
        }),
      )
    } catch (e: unknown) {
      // 唯一键冲突：已记过
      if (this.isDup(e)) return null
      throw e
    }

    const row = await this.pointsRepo.findOneOrFail({ where: { userId } })
    this.rollWeekIfNeeded(row)
    row.totalPoints = Number(row.totalPoints) + give
    row.weekPoints = Number(row.weekPoints) + give
    await this.pointsRepo.save(row)

    const unlocked = await this.unlockTiers(userId, row.totalPoints)
    return { points: give, totalPoints: row.totalPoints, unlocked }
  }

  async summary(userId: string) {
    await this.ensurePointsRow(userId)
    await this.ensureDefaultTiers(userId)
    const row = await this.pointsRepo.findOneOrFail({ where: { userId } })
    this.rollWeekIfNeeded(row)
    await this.pointsRepo.save(row)

    const tiers = await this.tierRepo.find({
      where: { userId },
      order: { pointsNeeded: 'ASC' },
    })
    const unlocks = await this.unlockRepo.find({ where: { userId } })
    const unlockedIds = new Set(unlocks.map((u) => String(u.tierId)))

    const next = tiers.find((t) => Number(t.pointsNeeded) > Number(row.totalPoints))
    const unlockedTiers = tiers
      .filter((t) => unlockedIds.has(String(t.id)))
      .map((t) => this.tierView(t, true))

    return {
      totalPoints: Number(row.totalPoints),
      weekPoints: Number(row.weekPoints),
      weekStart: row.weekStart,
      dailyCap: DAILY_POINTS_CAP,
      nextTier: next
        ? {
            ...this.tierView(next, false),
            remain: Number(next.pointsNeeded) - Number(row.totalPoints),
          }
        : null,
      unlockedTiers,
      tiers: tiers.map((t) => this.tierView(t, unlockedIds.has(String(t.id)))),
    }
  }

  async listLedger(userId: string, query: ListLedgerQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(50, query.pageSize ?? 20)
    const [rows, total] = await this.ledgerRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    return {
      items: rows.map((r) => ({
        id: String(r.id),
        reason: r.reason,
        reasonLabel: REASON_LABELS[r.reason] || r.reason,
        points: r.points,
        refType: r.refType,
        refId: r.refId,
        note: r.note,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
    }
  }

  async listTiers(userId: string) {
    await this.ensureDefaultTiers(userId)
    const tiers = await this.tierRepo.find({
      where: { userId },
      order: { pointsNeeded: 'ASC' },
    })
    const unlocks = await this.unlockRepo.find({ where: { userId } })
    const unlockedIds = new Set(unlocks.map((u) => String(u.tierId)))
    return {
      items: tiers.map((t) => this.tierView(t, unlockedIds.has(String(t.id)))),
    }
  }

  async updateTier(userId: string, tierId: string, dto: UpdateRewardTierDto) {
    const tier = await this.tierRepo.findOne({ where: { id: tierId, userId } })
    if (!tier) throw new NotFoundException('奖励档不存在')
    if (dto.title !== undefined) tier.title = dto.title.trim() || tier.title
    if (dto.rewardNote !== undefined) {
      tier.rewardNote = dto.rewardNote?.trim() || null
    }
    if (dto.pointsNeeded !== undefined) {
      const next = Math.floor(Number(dto.pointsNeeded))
      if (next < 1) throw new BadRequestException('所需积分无效')
      const clash = await this.tierRepo.findOne({
        where: { userId, pointsNeeded: next },
      })
      if (clash && String(clash.id) !== String(tierId)) {
        throw new BadRequestException(`已有 ${next} 分档位，请换一个积分值`)
      }
      tier.pointsNeeded = next
    }
    const saved = await this.tierRepo.save(tier)
    const row = await this.pointsRepo.findOne({ where: { userId } })
    if (row) {
      await this.unlockTiers(userId, Number(row.totalPoints))
    }
    const unlock = await this.unlockRepo.findOne({
      where: { userId, tierId: saved.id },
    })
    return this.tierView(saved, !!unlock)
  }

  /** 录入考试后：基础分 + 单科进步加分 */
  async awardAssessmentCreate(userId: string, assessmentId: string) {
    await this.awardSafe(userId, 'assessment_create', assessmentId, '录入考试')

    const scores = await this.dataSource.query(
      `SELECT s.subject_id AS subjectId, sub.name AS subjectName, s.score, s.full_score AS fullScore
       FROM assessment_subject_scores s
       INNER JOIN assessments a ON a.id = s.assessment_id
       INNER JOIN subjects sub ON sub.id = s.subject_id AND sub.user_id = a.user_id
       WHERE a.user_id = ? AND a.id = ?`,
      [userId, assessmentId],
    )

    for (const s of scores) {
      const subjectId = String(s.subjectId)
      const curScore = s.score != null ? Number(s.score) : null
      if (curScore == null) continue
      const prevRows = await this.dataSource.query(
        `SELECT s2.score, s2.full_score AS fullScore
         FROM assessment_subject_scores s2
         INNER JOIN assessments a2 ON a2.id = s2.assessment_id
         WHERE a2.user_id = ? AND s2.subject_id = ? AND a2.id <> ?
         ORDER BY a2.held_at DESC, a2.id DESC
         LIMIT 1`,
        [userId, subjectId, assessmentId],
      )
      const prev = prevRows[0]
      if (!prev || prev.score == null) continue
      const prevScore = Number(prev.score)
      let improved = false
      if (
        s.fullScore != null &&
        prev.fullScore != null &&
        Number(s.fullScore) > 0 &&
        Number(prev.fullScore) > 0
      ) {
        const curRate = (curScore / Number(s.fullScore)) * 100
        const prevRate = (prevScore / Number(prev.fullScore)) * 100
        improved = curRate - prevRate >= 1
      } else {
        improved = curScore - prevScore >= 1
      }
      if (improved) {
        await this.awardSafe(
          userId,
          'assessment_subject_up',
          `${assessmentId}:${subjectId}`,
          `${s.subjectName} 进步`,
          'assessment_subject',
        )
      }
    }
  }

  private async unlockTiers(userId: string, totalPoints: number) {
    const tiers = await this.tierRepo.find({
      where: { userId },
      order: { pointsNeeded: 'ASC' },
    })
    const unlocked: Array<{ id: string; title: string; pointsNeeded: number }> = []
    for (const t of tiers) {
      if (Number(t.pointsNeeded) > totalPoints) continue
      const exists = await this.unlockRepo.findOne({
        where: { userId, tierId: t.id },
      })
      if (exists) continue
      try {
        await this.unlockRepo.save(
          this.unlockRepo.create({ userId, tierId: t.id }),
        )
        unlocked.push({
          id: String(t.id),
          title: t.title,
          pointsNeeded: Number(t.pointsNeeded),
        })
      } catch (e) {
        if (!this.isDup(e)) throw e
      }
    }
    return unlocked
  }

  private async ensurePointsRow(userId: string) {
    const exists = await this.pointsRepo.findOne({ where: { userId } })
    if (exists) {
      this.rollWeekIfNeeded(exists)
      return exists
    }
    return this.pointsRepo.save(
      this.pointsRepo.create({
        userId,
        totalPoints: 0,
        weekPoints: 0,
        weekStart: this.weekStartYmd(),
      }),
    )
  }

  private async ensureDefaultTiers(userId: string) {
    const cnt = await this.tierRepo.count({ where: { userId } })
    if (cnt > 0) return
    for (const t of DEFAULT_REWARD_TIERS) {
      try {
        await this.tierRepo.save(
          this.tierRepo.create({
            userId,
            pointsNeeded: t.pointsNeeded,
            title: t.title,
            rewardNote: t.rewardNote || null,
            sortOrder: t.sortOrder,
          }),
        )
      } catch (e) {
        if (!this.isDup(e)) throw e
      }
    }
  }

  private rollWeekIfNeeded(row: UserPoints) {
    const current = this.weekStartYmd()
    const ws = this.formatDate(row.weekStart)
    if (ws !== current) {
      row.weekStart = current
      row.weekPoints = 0
    }
  }

  private weekStartYmd() {
    const d = new Date()
    const day = d.getDay() || 7
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - day + 1)
    return this.formatDate(d)
  }

  private todayStart() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
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

  private tierView(t: RewardTier, unlocked: boolean) {
    return {
      id: String(t.id),
      pointsNeeded: Number(t.pointsNeeded),
      title: t.title,
      rewardNote: t.rewardNote,
      sortOrder: t.sortOrder,
      unlocked,
    }
  }

  private isDup(e: unknown) {
    const err = e as { code?: string; errno?: number; message?: string }
    return (
      err?.code === 'ER_DUP_ENTRY' ||
      err?.errno === 1062 ||
      /Duplicate/i.test(err?.message || '')
    )
  }
}
