import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import {
  HS_MATH_AI_GRADING_MAX_ATTEMPTS,
  HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
  HS_MATH_GRADE_RULE_VERSION,
  type HsMathPool,
  type HsMathQtype,
} from '../hs-math.constants'
import { ListHsMathTrainSessionsQueryDto } from '../dto/list-train-sessions.dto'
import {
  CreateHsMathTrainSessionDto,
  SaveHsMathTrainAnswerDto,
} from '../dto/train-session.dto'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathKnowledgePoint } from '../entities/hs-math-knowledge-point.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { HsMathTrainItem } from '../entities/hs-math-train-item.entity'
import { HsMathTrainItemKp } from '../entities/hs-math-train-item-kp.entity'
import { HsMathTrainItemMethod } from '../entities/hs-math-train-item-method.entity'
import { HsMathMethod } from '../entities/hs-math-method.entity'
import { HsMathTrainSession } from '../entities/hs-math-train-session.entity'
import { HsMathTrainSessionItem } from '../entities/hs-math-train-session-item.entity'
import { HsMathTrainSessionItemImage } from '../entities/hs-math-train-session-item-image.entity'
import { HsMathTrainItemDiagram } from '../entities/hs-math-train-item-diagram.entity'
import { HsMathTrainItemDiagramObject } from '../entities/hs-math-train-item-diagram-object.entity'
import { HsMathTrainSessionItemDiagram } from '../entities/hs-math-train-session-item-diagram.entity'
import { isMysqlNoSuchTableError } from '../util/hs-math-item-content-fingerprint'
import {
  HsMathItemDiagramStorageError,
  readItemDiagramFile,
} from '../util/hs-math-item-diagram-storage'
import { accuracyRatio } from '../util/accuracy'
import {
  applyDraftToSubmittedTransition,
  extractApplicationImageIds,
  planSubmitImageLocks,
  toSubmittedHistoryImages,
  verifyApplicationImagesForAnswer,
} from '../util/hs-math-application-image-policy'
import { recountHsMathSessionGradeCounts } from '../util/hs-math-ai-grade.validate'
import { dispatchApplicationGrade } from '../util/hs-math-application-grade-dispatch'
import {
  evaluateApplicationRegradeEligibility,
  planApplicationRegrade,
} from '../util/hs-math-application-regrade'
import {
  gradeHsMathAnswer,
  hasUserAnswerPayload,
} from '../util/hs-math-grade'
import {
  toStudentSessionItemView,
  type SessionItemDiagramRef,
  type SessionItemKpLabel,
  type SessionItemMethodLabel,
} from '../util/session-item-view'
import { parseUserAnswerPayloadForSave } from '../util/user-answer.validate'
import {
  filterTrainItemsByQuestionType,
  pickTrainItemsWithShortfall,
} from '../util/hs-math-train-question-type'
import { HsMathApplicationAiGradeService } from './hs-math-application-ai-grade.service'

@Injectable()
export class HsMathTrainService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationAiGrade: HsMathApplicationAiGradeService,
    @InjectRepository(HsMathTrainSession)
    private readonly sessionsRepo: Repository<HsMathTrainSession>,
    @InjectRepository(HsMathTrainSessionItem)
    private readonly sessionItemsRepo: Repository<HsMathTrainSessionItem>,
    @InjectRepository(HsMathTrainItem)
    private readonly itemsRepo: Repository<HsMathTrainItem>,
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
    @InjectRepository(HsMathKnowledgePoint)
    private readonly kpRepo: Repository<HsMathKnowledgePoint>,
    @InjectRepository(HsMathTrainItemMethod)
    private readonly itemMethodsRepo: Repository<HsMathTrainItemMethod>,
    @InjectRepository(HsMathMethod)
    private readonly methodsRepo: Repository<HsMathMethod>,
  ) {}

  async createSession(userId: string, dto: CreateHsMathTrainSessionDto) {
    const poolMode: HsMathPool = dto.poolMode ?? 'formal'
    if (poolMode !== 'formal') {
      throw new ForbiddenException('P0 暂不支持 test 题池')
    }

    const specialty = await this.specialtiesRepo.findOne({
      where: { id: dto.specialtyId, isActive: true },
    })
    if (!specialty) throw new NotFoundException('专项不存在或未启用')

    const rawCategoryId =
      dto.categoryId != null && String(dto.categoryId).trim() !== ''
        ? String(dto.categoryId).trim()
        : null

    let category: { id: string; specialtyId: string } | null = null
    if (rawCategoryId) {
      category = await this.categoriesRepo.findOne({
        where: { id: rawCategoryId, isActive: true },
      })
      if (!category) throw new NotFoundException('分类不存在或未启用')
      if (String(category.specialtyId) !== String(specialty.id)) {
        throw new BadRequestException('分类不属于指定专项')
      }
    }

    const trueH3Only = dto.trueH3Only === true

    let eligible: HsMathTrainItem[]
    if (trueH3Only) {
      // 真 H3：code 前缀约定 CAND-H3%（暂无 hard_level 列）
      const qb = this.itemsRepo
        .createQueryBuilder('i')
        .where('i.specialty_id = :specialtyId', { specialtyId: specialty.id })
        .andWhere('i.difficulty = :difficulty', { difficulty: dto.difficulty })
        .andWhere('i.pool = :pool', { pool: poolMode })
        .andWhere('i.status = :status', { status: 'approved' })
        .andWhere('i.is_active = 1')
        .andWhere('i.code LIKE :h3Prefix', { h3Prefix: 'CAND-H3%' })
        .orderBy('i.id', 'ASC')
      if (category) {
        qb.andWhere('i.category_id = :categoryId', { categoryId: category.id })
      }
      if (dto.questionType) {
        qb.andWhere('i.qtype = :qtype', { qtype: dto.questionType })
      }
      eligible = await qb.getMany()
    } else {
      const where: {
        specialtyId: string
        categoryId?: string
        difficulty: number
        pool: HsMathPool
        status: 'approved'
        isActive: boolean
        qtype?: HsMathQtype
      } = {
        specialtyId: specialty.id,
        difficulty: dto.difficulty,
        pool: poolMode,
        status: 'approved',
        isActive: true,
      }
      if (category) {
        where.categoryId = category.id
      }
      // 题型筛选：仅当显式传入合法 questionType 时收窄（未传 = 全部）
      if (dto.questionType) {
        where.qtype = dto.questionType
      }

      eligible = await this.itemsRepo.find({
        where,
        order: { id: 'ASC' },
      })
    }
    eligible = filterTrainItemsByQuestionType(eligible, dto.questionType ?? null)

    if (!eligible.length) {
      const scope = category ? '该分类' : '该章节'
      if (trueH3Only) {
        throw new BadRequestException(
          dto.questionType
            ? `${scope}暂无已批准的真 H3「${dto.questionType}」题目`
            : `${scope}暂无已批准的真 H3 题目`,
        )
      }
      throw new BadRequestException(
        dto.questionType
          ? `${scope}在当前难度下暂无已批准的「${dto.questionType}」题目`
          : `${scope}暂无已批准题目`,
      )
    }

    if (dto.mode === 'random') {
      eligible = this.shuffle(eligible)
    }
    // 题量不足：用实际可用题开训（shortfall>0），不抽 draft/disabled 凑数
    const { picked, shortfall } = pickTrainItemsWithShortfall(
      eligible,
      dto.count,
    )

    const now = new Date()
    const sessionId = await this.dataSource.transaction(async (manager) => {
      // 事务内锁定题目行，再读关联 KP，保证内容版本与 KP 快照一致
      const pickIds = picked.map((p) => p.id)
      const lockedItems =
        pickIds.length === 0
          ? []
          : await manager
              .getRepository(HsMathTrainItem)
              .createQueryBuilder('i')
              .setLock('pessimistic_write')
              .where('i.id IN (:...ids)', { ids: pickIds })
              .getMany()
      const lockedMap = new Map(lockedItems.map((i) => [String(i.id), i]))
      const consistent = picked
        .map((p) => lockedMap.get(String(p.id)))
        .filter(
          (i): i is HsMathTrainItem =>
            !!i && i.status === 'approved' && Boolean(i.isActive),
        )
      if (!consistent.length) {
        throw new BadRequestException('题目状态已变化，请重试抽题')
      }

      const consistentIds = consistent.map((i) => i.id)
      const links = await manager.getRepository(HsMathTrainItemKp).find({
        where: { itemId: In(consistentIds) },
        order: { sortOrder: 'ASC', id: 'ASC' },
      })
      const kpIds = [...new Set(links.map((l) => String(l.knowledgePointId)))]
      const kpRows =
        kpIds.length === 0
          ? []
          : await manager.getRepository(HsMathKnowledgePoint).find({
              where: { id: In(kpIds) },
            })
      const kpById = new Map(kpRows.map((k) => [String(k.id), k]))
      const linksByItem = new Map<string, HsMathTrainItemKp[]>()
      for (const l of links) {
        const key = String(l.itemId)
        const arr = linksByItem.get(key) || []
        arr.push(l)
        linksByItem.set(key, arr)
      }

      const session = await manager.getRepository(HsMathTrainSession).save(
        manager.getRepository(HsMathTrainSession).create({
          userId,
          sessionKind: 'specialty',
          dailyDate: null,
          specialtyId: specialty.id,
          categoryId: category ? category.id : null,
          poolMode,
          difficulty: dto.difficulty,
          plannedCount: dto.count,
          actualCount: consistent.length,
          mode: dto.mode,
          status: 'in_progress',
          answeredCount: 0,
          correctCount: 0,
          wrongCount: 0,
          pendingCount: 0,
          durationMs: 0,
          startedAt: now,
          submittedAt: null,
          countsFormalStats: poolMode === 'formal',
          gradeRuleVersion: HS_MATH_GRADE_RULE_VERSION,
          sourceWrongItemId: null,
        }),
      )

      const rows = consistent.map((item, i) => {
        const itemLinks = linksByItem.get(String(item.id)) || []
        const codes = itemLinks
          .map((l) => kpById.get(String(l.knowledgePointId))?.code)
          .filter((c): c is string => !!c)
        const primaryLink = itemLinks.find((l) => l.isPrimary)
        const primaryCode = primaryLink
          ? kpById.get(String(primaryLink.knowledgePointId))?.code ?? null
          : codes[0] ?? null
        return manager.getRepository(HsMathTrainSessionItem).create({
          sessionId: session.id,
          sortOrder: i + 1,
          itemId: item.id,
          itemCode: item.code,
          qtype: item.qtype,
          stem: item.stem,
          optionsJson: item.optionsJson,
          answerPayloadJson: item.answerPayloadJson,
          analysis: item.analysis,
          knowledgePointId: item.knowledgePointId,
          knowledgePointCodesJson: codes.length ? codes : null,
          primaryKnowledgePointCode: primaryCode,
          specialtyId: item.specialtyId,
          categoryId: item.categoryId,
          difficulty: item.difficulty,
          contentVersion: item.contentVersion,
          gradeRuleVersion: item.gradeRuleVersion || HS_MATH_GRADE_RULE_VERSION,
          userAnswerPayloadJson: null,
          gradeResult: null,
          gradeReason: null,
          answeredAt: null,
        })
      })
      const savedItems = await manager
        .getRepository(HsMathTrainSessionItem)
        .save(rows)

      // DIAGRAM-1B：开训事务内写入插图快照（表未迁移则跳过，不影响开训）
      try {
        const itemIds = savedItems
          .map((r) => r.itemId)
          .filter((id): id is string => !!id)
        if (itemIds.length) {
          const curLinks = await manager.getRepository(HsMathTrainItemDiagram).find({
            where: { itemId: In(itemIds) },
            order: { sortOrder: 'ASC', id: 'ASC' },
          })
          if (curLinks.length) {
            const objs = await manager
              .getRepository(HsMathTrainItemDiagramObject)
              .find({
                where: { id: In(curLinks.map((l) => l.objectId)) },
              })
            const omap = new Map(objs.map((o) => [String(o.id), o]))
            const linksByItem = new Map<string, typeof curLinks>()
            for (const l of curLinks) {
              const k = String(l.itemId)
              const arr = linksByItem.get(k) || []
              arr.push(l)
              linksByItem.set(k, arr)
            }
            const snapRows: HsMathTrainSessionItemDiagram[] = []
            for (const si of savedItems) {
              if (!si.itemId) continue
              const ls = linksByItem.get(String(si.itemId)) || []
              for (const l of ls) {
                const o = omap.get(String(l.objectId))
                if (!o) continue
                snapRows.push(
                  manager.getRepository(HsMathTrainSessionItemDiagram).create({
                    sessionItemId: si.id,
                    objectId: o.id,
                    sortOrder: Number(l.sortOrder),
                    altText: l.altText,
                    contentSha256: o.contentSha256,
                    mimeType: o.mimeType,
                  }),
                )
              }
            }
            if (snapRows.length) {
              await manager
                .getRepository(HsMathTrainSessionItemDiagram)
                .save(snapRows)
            }
          }
        }
      } catch (e) {
        if (!isMysqlNoSuchTableError(e)) throw e
      }

      return session.id
    })

    const view = await this.getSessionForUser(userId, sessionId)
    const finalShortfall = Math.max(
      0,
      dto.count - (view.actualCount ?? 0),
    )
    return { ...view, shortfall: Math.max(shortfall, finalShortfall) }
  }

  async getSession(userId: string, sessionId: string) {
    return this.getSessionForUser(userId, sessionId)
  }

  /** 训练历史摘要列表（不含题目快照与标准答案） */
  async listSessions(userId: string, query: ListHsMathTrainSessionsQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const sortBy = query.sortBy ?? 'startedAt'
    const sortOrder = query.sortOrder ?? 'DESC'
    const orderColumn =
      sortBy === 'submittedAt' ? 's.submitted_at' : 's.started_at'

    const qb = this.sessionsRepo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })

    if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status })
    }
    if (query.specialtyId) {
      qb.andWhere('s.specialty_id = :specialtyId', {
        specialtyId: query.specialtyId,
      })
    }
    if (query.categoryId) {
      qb.andWhere('s.category_id = :categoryId', {
        categoryId: query.categoryId,
      })
    }
    // 日期按库内 DATETIME 的日历日过滤（业务约定为上海墙钟）
    if (query.dateFrom) {
      qb.andWhere('DATE(s.started_at) >= :dateFrom', {
        dateFrom: query.dateFrom,
      })
    }
    if (query.dateTo) {
      qb.andWhere('DATE(s.started_at) <= :dateTo', { dateTo: query.dateTo })
    }

    qb.orderBy(orderColumn, sortOrder).addOrderBy('s.id', 'DESC')

    const total = await qb.getCount()
    const rows = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()

    const specialtyIds = [...new Set(rows.map((r) => String(r.specialtyId)))]
    const categoryIds = [
      ...new Set(
        rows
          .map((r) => (r.categoryId != null ? String(r.categoryId) : ''))
          .filter(Boolean),
      ),
    ]
    const specialties = specialtyIds.length
      ? await this.specialtiesRepo.find({ where: { id: In(specialtyIds) } })
      : []
    const categories = categoryIds.length
      ? await this.categoriesRepo.find({ where: { id: In(categoryIds) } })
      : []
    const spMap = new Map(specialties.map((s) => [String(s.id), s]))
    const catMap = new Map(categories.map((c) => [String(c.id), c]))

    const items = rows.map((s) => {
      const sp = spMap.get(String(s.specialtyId))
      const cat =
        s.categoryId != null ? catMap.get(String(s.categoryId)) : undefined
      const completed = s.status === 'completed'
      return {
        sessionId: String(s.id),
        sessionKind: s.sessionKind,
        status: s.status,
        specialtyId: String(s.specialtyId),
        specialtyCode: sp?.code ?? null,
        specialtyName: sp?.name ?? null,
        categoryId: s.categoryId != null ? String(s.categoryId) : null,
        categoryCode: cat?.code ?? null,
        categoryName: cat?.name ?? '本章全部',
        difficulty: s.difficulty,
        poolMode: s.poolMode,
        plannedCount: s.plannedCount,
        questionCount: s.actualCount,
        answeredCount: s.answeredCount,
        correctCount: completed ? s.correctCount : null,
        wrongCount: completed ? s.wrongCount : null,
        pendingCount: completed ? s.pendingCount : null,
        accuracy: completed
          ? accuracyRatio(s.correctCount, s.wrongCount)
          : null,
        durationMs: completed ? s.durationMs : null,
        createdAt: s.createdAt,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
      }
    })

    return { total, page, pageSize, items }
  }

  async saveAnswer(
    userId: string,
    sessionId: string,
    dto: SaveHsMathTrainAnswerDto,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const session = await this.lockOwnSession(manager, userId, sessionId)
      if (session.status !== 'in_progress') {
        throw new ConflictException('任务已结束，无法继续作答')
      }

      const item = await manager
        .getRepository(HsMathTrainSessionItem)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.session_id = :sessionId AND i.sort_order = :sortOrder', {
          sessionId,
          sortOrder: dto.sortOrder,
        })
        .getOne()
      if (!item) throw new NotFoundException('题目不存在')

      const parsed = parseUserAnswerPayloadForSave(
        item.qtype,
        dto.userAnswerPayload,
      )

      // APPLICATION-2C：引用图片时锁行并校验属主 / draft / 同 session_item
      if (
        parsed &&
        parsed.kind === 'application' &&
        Array.isArray(parsed.imageIds) &&
        parsed.imageIds.length > 0
      ) {
        const imgRepo = manager.getRepository(HsMathTrainSessionItemImage)
        const rows = await imgRepo
          .createQueryBuilder('img')
          .setLock('pessimistic_write')
          .where('img.id IN (:...ids)', { ids: parsed.imageIds })
          .getMany()
        const gate = verifyApplicationImagesForAnswer({
          jwtUserId: userId,
          sessionItemId: item.id,
          imageIds: parsed.imageIds,
          images: rows.map((r) => ({
            id: String(r.id),
            userId: String(r.userId),
            sessionItemId: String(r.sessionItemId),
            status: r.status,
          })),
        })
        if (!gate.ok) {
          throw new BadRequestException(gate.message)
        }
      }

      item.userAnswerPayloadJson = parsed
      item.gradeResult = null
      item.gradeReason = null
      item.answeredAt = parsed && hasUserAnswerPayload(parsed) ? new Date() : null
      await manager.getRepository(HsMathTrainSessionItem).save(item)

      const items = await manager.getRepository(HsMathTrainSessionItem).find({
        where: { sessionId },
      })
      session.answeredCount = items.filter((i) =>
        hasUserAnswerPayload(i.userAnswerPayloadJson),
      ).length
      await manager.getRepository(HsMathTrainSession).save(session)
    })

    return this.getSessionForUser(userId, sessionId)
  }

  async submit(userId: string, sessionId: string) {
    let idempotent = false
    const textAiItemIds: string[] = []
    const visionAiItemIds: string[] = []
    const dualAiItemIds: string[] = []

    await this.dataSource.transaction(async (manager) => {
      const session = await this.lockOwnSession(manager, userId, sessionId)

      if (session.status === 'completed') {
        idempotent = true
        return
      }
      if (session.status === 'cancelled') {
        throw new ConflictException('任务已取消，无法提交')
      }
      if (session.status !== 'in_progress') {
        throw new ConflictException('当前状态不可提交')
      }

      const items = await manager.getRepository(HsMathTrainSessionItem).find({
        where: { sessionId },
        order: { sortOrder: 'ASC' },
      })

      const now = new Date()
      const imgRepo = manager.getRepository(HsMathTrainSessionItemImage)

      // APPLICATION-2D：先按答案 imageIds 锁图并 draft→submitted（与会话完成同事务）
      // 锁顺序：session（已持有）→ items 按 sortOrder → 图片按 id 升序
      for (const item of items) {
        if (item.qtype !== 'application') continue
        const imageIds = extractApplicationImageIds(item.userAnswerPayloadJson)
        if (!imageIds.length) continue

        const sortedIds = [...imageIds].sort((a, b) => {
          const na = Number(a)
          const nb = Number(b)
          if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) {
            return na - nb
          }
          return String(a).localeCompare(String(b))
        })

        const rows = await imgRepo
          .createQueryBuilder('img')
          .setLock('pessimistic_write')
          .where('img.id IN (:...ids)', { ids: sortedIds })
          .orderBy('img.id', 'ASC')
          .getMany()

        const plan = planSubmitImageLocks({
          jwtUserId: userId,
          sessionItemId: item.id,
          imageIds,
          images: rows.map((r) => ({
            id: String(r.id),
            userId: String(r.userId),
            sessionItemId: String(r.sessionItemId),
            status: r.status,
          })),
        })
        if (!plan.ok) {
          throw new BadRequestException(plan.message)
        }

        const transition = applyDraftToSubmittedTransition(
          rows.map((r) => ({ id: String(r.id), status: r.status })),
          plan.lockIds,
          now,
        )
        if (!transition.ok) {
          throw new BadRequestException(transition.message)
        }

        for (const u of transition.updates) {
          const row = rows.find((r) => String(r.id) === u.id)
          if (!row) {
            throw new BadRequestException('图片不存在或无权引用')
          }
          row.status = u.status
          row.submittedAt = u.submittedAt
        }
        await imgRepo.save(rows.filter((r) => plan.lockIds.includes(String(r.id))))
      }

      for (const item of items) {
        const graded = gradeHsMathAnswer({
          qtype: item.qtype,
          optionsJson: item.optionsJson,
          standard: item.answerPayloadJson,
          user: item.userAnswerPayloadJson,
        })
        item.gradeResult = graded.result
        item.gradeReason = graded.reason ?? null

        // APPLICATION-3E-1：按 gradingProvider + 图/文 入队（开关不足 → review_required，不静默改 provider）
        if (item.qtype === 'application' && graded.result === 'pending_ai') {
          const ua = item.userAnswerPayloadJson
          if (ua && ua.kind === 'application') {
            const d = dispatchApplicationGrade({
              qtype: item.qtype,
              syncGradeResult: graded.result,
              user: ua,
              visionReady: this.applicationAiGrade.canAutoVisionGradeSession(
                userId,
                sessionId,
              ),
              textAiReady: this.applicationAiGrade.canAutoTextGradeSession(
                userId,
                sessionId,
              ),
            })
            if (d.gradeResult) {
              item.gradeResult = d.gradeResult
              item.gradeReason = d.gradeReason
            }
            if (d.queue === 'vision') visionAiItemIds.push(String(item.id))
            if (d.queue === 'text') textAiItemIds.push(String(item.id))
            if (d.queue === 'dual') dualAiItemIds.push(String(item.id))
          }
        }
      }
      await manager.getRepository(HsMathTrainSessionItem).save(items)

      const counts = recountHsMathSessionGradeCounts(
        items.map((i) => i.gradeResult),
      )
      session.status = 'completed'
      session.submittedAt = now
      session.correctCount = counts.correct
      session.wrongCount = counts.wrong
      session.pendingCount = counts.pending
      session.answeredCount = items.filter((i) =>
        hasUserAnswerPayload(i.userAnswerPayloadJson),
      ).length
      session.durationMs = Math.max(
        0,
        now.getTime() - new Date(session.startedAt).getTime(),
      )
      await manager.getRepository(HsMathTrainSession).save(session)
    })

    // 事务外异步批改：不持有 DB 锁；幂等 submit 不重复触发；不扫历史 review_required
    if (!idempotent && textAiItemIds.length) {
      this.applicationAiGrade.scheduleTextGrading({
        userId,
        sessionId,
        sessionItemIds: textAiItemIds,
      })
    }
    if (!idempotent && visionAiItemIds.length) {
      this.applicationAiGrade.scheduleVisionGrading({
        userId,
        sessionId,
        sessionItemIds: visionAiItemIds,
      })
    }
    if (!idempotent && dualAiItemIds.length) {
      this.applicationAiGrade.scheduleDualGrading({
        userId,
        sessionId,
        sessionItemIds: dualAiItemIds,
      })
    }

    const view = await this.getSessionForUser(userId, sessionId)
    return {
      ...view,
      submitMeta: { idempotent },
    }
  }

  /**
   * APPLICATION-4C-2：学生对已保存应用题答案重新申请 AI 批改。
   * 开关不足时拒绝且不改状态；资格/开关在同一悲观锁事务内判定，再落 pending_ai。
   */
  async requestApplicationRegrade(
    userId: string,
    sessionId: string,
    sessionItemId: string,
  ) {
    type Queue = 'vision' | 'text' | 'dual'
    let queue: Queue | null = null

    await this.dataSource.transaction(async (manager) => {
      const session = await this.lockOwnSession(manager, userId, sessionId)

      const item = await manager
        .getRepository(HsMathTrainSessionItem)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.id = :id AND i.session_id = :sessionId', {
          id: sessionItemId,
          sessionId,
        })
        .getOne()
      if (!item) {
        throw new NotFoundException('题目不存在')
      }

      const ua = item.userAnswerPayloadJson
      const hasApplicationAnswer = !!(ua && ua.kind === 'application')
      const imageIds =
        hasApplicationAnswer && ua && ua.kind === 'application'
          ? extractApplicationImageIds(ua)
          : []

      const imgRows =
        imageIds.length > 0
          ? await manager
              .getRepository(HsMathTrainSessionItemImage)
              .createQueryBuilder('img')
              .setLock('pessimistic_write')
              .where('img.id IN (:...ids)', { ids: imageIds })
              .getMany()
          : []

      const eligibility = evaluateApplicationRegradeEligibility({
        qtype: item.qtype,
        sessionStatus: session.status,
        sessionUserId: String(session.userId),
        requestUserId: String(userId),
        gradeResult: item.gradeResult,
        gradeReason: item.gradeReason,
        aiAttemptCount: Number(item.aiAttemptCount) || 0,
        maxAttempts: HS_MATH_AI_GRADING_MAX_ATTEMPTS,
        hasApplicationAnswer,
        imageIds,
        images: imgRows.map((r) => ({
          id: String(r.id),
          status: r.status,
          userId: String(r.userId),
          sessionItemId: String(r.sessionItemId),
        })),
        sessionItemId: String(item.id),
      })

      if (!eligibility.ok) {
        this.throwRegradeReject(eligibility.code, eligibility.message)
      }

      // 开关检查与状态写入同锁：不足则不改库（含 sessionItem allowlist）
      const visionReady = this.applicationAiGrade.canAutoVisionGradeSession(
        userId,
        sessionId,
        sessionItemId,
      )
      const textAiReady = this.applicationAiGrade.canAutoTextGradeSession(
        userId,
        sessionId,
        sessionItemId,
      )

      const plan = planApplicationRegrade({
        eligibility,
        user: hasApplicationAnswer && ua && ua.kind === 'application' ? ua : null,
        visionReady,
        textAiReady,
      })
      if (!plan.ok) {
        this.throwRegradeReject(plan.code, plan.message)
      }

      // owner_only + DeepSeek：改状态前预检日额度，避免永久卡在 pending_ai
      if (
        plan.dispatch.queue === 'text' ||
        plan.dispatch.queue === 'dual'
      ) {
        const peek =
          await this.applicationAiGrade.peekDeepseekDailyQuota(userId)
        if (peek.enforced && !peek.available) {
          this.throwRegradeReject(
            'DEEPSEEK_DAILY_QUOTA_EXCEEDED',
            '今日 DeepSeek 批改次数已用完，请明天再试。',
          )
        }
      }

      item.gradeResult = plan.nextGradeResult
      item.gradeReason = plan.nextGradeReason
      // 清除旧诊断，避免 pending 时残留失败 JSON；不改 user_answer / provider / 图片
      item.aiGradeJson = null
      item.aiModel = null
      item.aiGradedAt = null
      await manager.getRepository(HsMathTrainSessionItem).save(item)

      const allItems = await manager.getRepository(HsMathTrainSessionItem).find({
        where: { sessionId },
      })
      const counts = recountHsMathSessionGradeCounts(
        allItems.map((i) =>
          String(i.id) === String(item.id) ? item.gradeResult : i.gradeResult,
        ),
      )
      session.correctCount = counts.correct
      session.wrongCount = counts.wrong
      session.pendingCount = counts.pending
      await manager.getRepository(HsMathTrainSession).save(session)

      queue = plan.dispatch.queue
    })

    // 事务外调度（与 submit 一致）；inFlight + claim 防重复外发
    if (queue === 'text') {
      this.applicationAiGrade.scheduleTextGrading({
        userId,
        sessionId,
        sessionItemIds: [sessionItemId],
      })
    } else if (queue === 'vision') {
      this.applicationAiGrade.scheduleVisionGrading({
        userId,
        sessionId,
        sessionItemIds: [sessionItemId],
      })
    } else if (queue === 'dual') {
      this.applicationAiGrade.scheduleDualGrading({
        userId,
        sessionId,
        sessionItemIds: [sessionItemId],
      })
    }

    const view = await this.getSessionForUser(userId, sessionId)
    return {
      ...view,
      regradeMeta: { accepted: true, sessionItemId: String(sessionItemId) },
    }
  }

  private throwRegradeReject(code: string, message: string): never {
    if (code === 'FORBIDDEN_OWNER') {
      throw new ForbiddenException(message)
    }
    if (
      code === 'ALREADY_GRADED' ||
      code === 'ALREADY_PENDING' ||
      code === 'ALREADY_GRADING' ||
      code === 'SESSION_NOT_COMPLETED'
    ) {
      throw new ConflictException(message)
    }
    if (code === 'AI_GRADING_DISABLED') {
      throw new BadRequestException(message)
    }
    if (code === 'DEEPSEEK_DAILY_QUOTA_EXCEEDED') {
      throw new BadRequestException({
        code: HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
        message:
          message || '今日 DeepSeek 批改次数已用完，请明天再试。',
      })
    }
    throw new BadRequestException(message)
  }

  async cancel(userId: string, sessionId: string) {
    await this.dataSource.transaction(async (manager) => {
      const session = await this.lockOwnSession(manager, userId, sessionId)
      if (session.status === 'completed') {
        throw new ConflictException('已完成任务不可取消')
      }
      if (session.status === 'cancelled') {
        return
      }
      session.status = 'cancelled'
      await manager.getRepository(HsMathTrainSession).save(session)
    })
    return this.getSessionForUser(userId, sessionId)
  }

  // —— helpers ——

  private async lockOwnSession(
    manager: import('typeorm').EntityManager,
    userId: string,
    sessionId: string,
  ): Promise<HsMathTrainSession> {
    const session = await manager
      .getRepository(HsMathTrainSession)
      .createQueryBuilder('s')
      .setLock('pessimistic_write')
      .where('s.id = :id AND s.user_id = :userId', { id: sessionId, userId })
      .getOne()
    if (!session) {
      throw new NotFoundException('训练任务不存在')
    }
    return session
  }

  private async requireOwnSession(userId: string, sessionId: string) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId, userId },
    })
    if (!session) throw new NotFoundException('训练任务不存在')
    return session
  }

  private async getSessionForUser(userId: string, sessionId: string) {
    // APPLICATION-3D-8：本 session 内卡住的 grading → grading_failed（不外发、不扫其它会话）
    await this.applicationAiGrade.recoverStaleGradingForSession({
      userId,
      sessionId,
    })

    const session = await this.requireOwnSession(userId, sessionId)
    const specialty = await this.specialtiesRepo.findOne({
      where: { id: session.specialtyId },
    })
    const category =
      session.categoryId != null
        ? await this.categoriesRepo.findOne({
            where: { id: session.categoryId },
          })
        : null
    const items = await this.sessionItemsRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
    })

    const reveal = session.status === 'completed'
    const scored = session.correctCount + session.wrongCount
    const accuracyPercent =
      session.status === 'completed' && scored > 0
        ? Math.round((session.correctCount / scored) * 1000) / 10
        : null

    const allCodes = new Set<string>()
    for (const item of items) {
      const codes = Array.isArray(item.knowledgePointCodesJson)
        ? item.knowledgePointCodesJson
        : []
      for (const c of codes) allCodes.add(c)
      if (item.primaryKnowledgePointCode) {
        allCodes.add(item.primaryKnowledgePointCode)
      }
    }
    const nameByCode = new Map<string, string>()
    if (allCodes.size) {
      const kps = await this.kpRepo.find({
        where: { code: In([...allCodes]) },
      })
      for (const k of kps) nameByCode.set(k.code, k.name)
    }

    /** 题目当前有效方法关联（非会话快照）；批量加载避免 N+1 */
    const methodsByItemId = await this.loadActiveMethodsByItemIds(
      items.map((i) => i.itemId).filter((id): id is string => !!id),
    )

    // APPLICATION-2D：completed 时批量加载图片，历史只展示答案引用的 submitted
    const imagesBySessionItemId = new Map<
      string,
      Array<{
        id: string
        mimeType: string
        sortOrder: number
        status: string
      }>
    >()
    if (reveal) {
      const appItemIds = items
        .filter((i) => i.qtype === 'application')
        .map((i) => String(i.id))
      if (appItemIds.length) {
        const imgRows = await this.dataSource
          .getRepository(HsMathTrainSessionItemImage)
          .createQueryBuilder('img')
          .where('img.session_item_id IN (:...ids)', { ids: appItemIds })
          .andWhere('img.user_id = :userId', { userId })
          .orderBy('img.sort_order', 'ASC')
          .addOrderBy('img.id', 'ASC')
          .getMany()
        for (const row of imgRows) {
          const key = String(row.sessionItemId)
          const list = imagesBySessionItemId.get(key) ?? []
          list.push({
            id: String(row.id),
            mimeType: row.mimeType,
            sortOrder: Number(row.sortOrder),
            status: row.status,
          })
          imagesBySessionItemId.set(key, list)
        }
      }
    }

    const diagramsBySessionItemId = new Map<string, SessionItemDiagramRef[]>()
    try {
      const siIds = items.map((i) => String(i.id))
      if (siIds.length) {
        const dRows = await this.dataSource
          .getRepository(HsMathTrainSessionItemDiagram)
          .find({
            where: { sessionItemId: In(siIds) },
            order: { sortOrder: 'ASC', id: 'ASC' },
          })
        for (const row of dRows) {
          const key = String(row.sessionItemId)
          const list = diagramsBySessionItemId.get(key) ?? []
          list.push({
            objectId: String(row.objectId),
            sortOrder: Number(row.sortOrder),
            altText: row.altText,
            mimeType: row.mimeType,
            contentSha256: row.contentSha256,
          })
          diagramsBySessionItemId.set(key, list)
        }
      }
    } catch (e) {
      if (!isMysqlNoSuchTableError(e)) throw e
    }

    return {
      id: String(session.id),
      status: session.status,
      sessionKind: session.sessionKind,
      poolMode: session.poolMode,
      difficulty: session.difficulty,
      plannedCount: session.plannedCount,
      actualCount: session.actualCount,
      mode: session.mode,
      answeredCount: session.answeredCount,
      correctCount: reveal ? session.correctCount : null,
      wrongCount: reveal ? session.wrongCount : null,
      pendingCount: reveal ? session.pendingCount : null,
      accuracyPercent,
      durationMs: reveal ? session.durationMs : null,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      countsFormalStats: session.countsFormalStats,
      gradeRuleVersion: session.gradeRuleVersion,
      specialtyId: String(session.specialtyId),
      specialtyCode: specialty?.code ?? null,
      specialtyName: specialty?.name ?? null,
      categoryId:
        session.categoryId != null ? String(session.categoryId) : null,
      categoryCode: category?.code ?? null,
      categoryName: category?.name ?? '本章全部',
      /** methods 语义：题目当前有效关联，非答题时快照 */
      methodsSemantics: 'current_item_link' as const,
      items: items.map((item) => {
        const codes = Array.isArray(item.knowledgePointCodesJson)
          ? item.knowledgePointCodesJson
          : []
        const labels: SessionItemKpLabel[] = codes.map((code) => ({
          code,
          name: nameByCode.get(code) || code,
          isPrimary: code === item.primaryKnowledgePointCode,
        }))
        const methods: SessionItemMethodLabel[] = item.itemId
          ? methodsByItemId.get(String(item.itemId)) ?? []
          : []
        const applicationImages =
          reveal && item.qtype === 'application'
            ? toSubmittedHistoryImages(
                item.userAnswerPayloadJson,
                imagesBySessionItemId.get(String(item.id)) ?? [],
              )
            : undefined
        return toStudentSessionItemView(item, reveal, labels, methods, {
          applicationImages,
          diagrams: diagramsBySessionItemId.get(String(item.id)) ?? [],
        })
      }),
    }
  }

  /**
   * 学生鉴权读取开训快照插图二进制（防枚举：必须属于本人 session 且快照含该 object）。
   */
  async getSessionDiagramBinary(
    userId: string,
    sessionId: string,
    sessionItemId: string,
    objectId: string,
  ): Promise<{ mimeType: string; buffer: Buffer }> {
    await this.requireOwnSession(userId, sessionId)
    const si = await this.sessionItemsRepo.findOne({
      where: { id: sessionItemId, sessionId },
    })
    if (!si) throw new NotFoundException('题目不存在')
    let snap: HsMathTrainSessionItemDiagram | null
    try {
      snap = await this.dataSource
        .getRepository(HsMathTrainSessionItemDiagram)
        .findOne({
          where: {
            sessionItemId: si.id,
            objectId,
          },
        })
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new NotFoundException('插图功能未启用')
      }
      throw e
    }
    if (!snap) throw new NotFoundException('插图不存在或不属于本训练题')
    const obj = await this.dataSource
      .getRepository(HsMathTrainItemDiagramObject)
      .findOne({ where: { id: objectId } })
    if (!obj) throw new NotFoundException('插图对象不存在')
    if (
      obj.contentSha256.toLowerCase() !== snap.contentSha256.toLowerCase()
    ) {
      throw new ForbiddenException('插图校验失败')
    }
    try {
      const buffer = readItemDiagramFile(obj.storageKey)
      return { mimeType: obj.mimeType, buffer }
    } catch (e) {
      if (e instanceof HsMathItemDiagramStorageError) {
        throw new NotFoundException('插图文件不可用')
      }
      throw e
    }
  }

  /**
   * 批量：item_id → 当前有效方法（is_active=1），按 is_primary DESC、sort_order ASC。
   */
  private async loadActiveMethodsByItemIds(
    itemIds: string[],
  ): Promise<Map<string, SessionItemMethodLabel[]>> {
    const out = new Map<string, SessionItemMethodLabel[]>()
    if (!itemIds.length) return out
    const uniqueIds = [...new Set(itemIds.map(String))]

    const links = await this.itemMethodsRepo.find({
      where: { itemId: In(uniqueIds) },
      order: { isPrimary: 'DESC', sortOrder: 'ASC', id: 'ASC' },
    })
    if (!links.length) return out

    const methodIds = [...new Set(links.map((l) => String(l.methodId)))]
    const methods = await this.methodsRepo.find({
      where: { id: In(methodIds), isActive: true },
    })
    const methodById = new Map(methods.map((m) => [String(m.id), m]))

    for (const link of links) {
      const m = methodById.get(String(link.methodId))
      if (!m) continue // 禁用或不存在 → 过滤
      const key = String(link.itemId)
      const row: SessionItemMethodLabel = {
        code: m.code,
        name: m.name,
        summary: m.summary ?? '',
        isPrimary: Boolean(link.isPrimary),
      }
      const list = out.get(key)
      if (list) list.push(row)
      else out.set(key, [row])
    }
    return out
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
