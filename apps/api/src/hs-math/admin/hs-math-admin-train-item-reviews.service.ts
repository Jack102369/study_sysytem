import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, In, Repository } from 'typeorm'
import { ListHsMathReviewQueueQueryDto } from '../dto/admin-review-queue.dto'
import { CreateHsMathTrainItemReviewDto } from '../dto/admin-train-item-review.dto'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathKnowledgePoint } from '../entities/hs-math-knowledge-point.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { HsMathMethod } from '../entities/hs-math-method.entity'
import { HsMathTrainItem } from '../entities/hs-math-train-item.entity'
import { HsMathTrainItemKp } from '../entities/hs-math-train-item-kp.entity'
import { HsMathTrainItemMethod } from '../entities/hs-math-train-item-method.entity'
import { HsMathTrainItemDiagram } from '../entities/hs-math-train-item-diagram.entity'
import { HsMathTrainItemDiagramObject } from '../entities/hs-math-train-item-diagram-object.entity'
import { HsMathTrainItemReview } from '../entities/hs-math-train-item-review.entity'
import { User } from '../../users/user.entity'
import {
  fingerprintTrainItemContent,
  isMysqlNoSuchTableError,
} from '../util/hs-math-item-content-fingerprint'
import {
  assertReviewDecisionInput,
  evaluateLatestReviewForPublish,
  publishBlockReasonsFromGate,
  summarizeCurrentReview,
} from '../util/hs-math-review-gate'
import { paginateStableList } from '../util/hs-math-review-queue-paginate'
import {
  assertNonEmptyStem,
  validateAnswerPayload,
} from '../util/answer-payload.validate'
import {
  isBlockedFromApprove,
  isExcludedFromReviewQueue,
} from '../util/train-item-import.validate'
import { assertSameSpecialty } from '../util/train-item-kps.validate'
import { collectSourcePublishBlockReasons } from '../util/hs-math-source.validate'

/**
 * 人工审核记录写入与审核工作台查询（不改 items.status）。
 * 表未迁移时 fail-closed。
 */
@Injectable()
export class HsMathAdminTrainItemReviewsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HsMathTrainItem)
    private readonly itemsRepo: Repository<HsMathTrainItem>,
    @InjectRepository(HsMathTrainItemReview)
    private readonly reviewsRepo: Repository<HsMathTrainItemReview>,
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async listReviewQueue(query: ListHsMathReviewQueueQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const status = query.status ?? 'draft'

    /**
     * P1-0F-C3C.2：筛选 / total / 分页必须针对同一逻辑集。
     * 指纹态只能在应用层判定 → 先取齐结构筛选候选（稳定 ORDER BY id ASC），
     * 分批 enrich，再按 currentReviewStatus 过滤，最后 paginateStableList。
     * 禁止：SQL 先 skip/take 再 enrich 丢弃；禁止固定条数截断候选集。
     */
    const qb = this.itemsRepo
      .createQueryBuilder('i')
      .where('i.pool = :pool', { pool: 'formal' })
      .andWhere('i.status = :status', { status })
      .andWhere('i.code NOT LIKE :exP0', { exP0: 'HS_MATH_P0_%' })
      .andWhere('i.code NOT LIKE :exD1', { exD1: 'HS_MATH_P1_0D1%' })
      .andWhere('i.code NOT LIKE :exC3', { exC3: 'HS_MATH_P1_0FC3C1_IT_%' })
      .andWhere('i.code NOT LIKE :exDemo', { exDemo: 'HS_MATH_IMPORT_DEMO_%' })
      .orderBy('i.id', 'ASC')

    if (query.specialtyId) {
      qb.andWhere('i.specialty_id = :specialtyId', {
        specialtyId: query.specialtyId,
      })
    }
    if (query.categoryId) {
      qb.andWhere('i.category_id = :categoryId', {
        categoryId: query.categoryId,
      })
    }
    if (query.qtype) qb.andWhere('i.qtype = :qtype', { qtype: query.qtype })
    if (query.difficulty != null) {
      qb.andWhere('i.difficulty = :difficulty', {
        difficulty: query.difficulty,
      })
    }
    const kw = (query.keyword || '').trim()
    if (kw) {
      if (kw.length > 64) {
        throw new BadRequestException('关键词过长')
      }
      qb.andWhere('(i.code LIKE :kw OR i.stem LIKE :kw)', { kw: `%${kw}%` })
    }

    try {
      // 无上限截断：正确性优先；大批量时分批 enrich（见 enrichQueueRowsBatched）
      const candidates = await qb.getMany()
      const enriched = (
        await this.enrichQueueRowsBatched(candidates)
      ).filter((r) => !isExcludedFromReviewQueue(r.code))

      const filtered =
        query.reviewStatus != null
          ? enriched.filter(
              (r) => r.currentReviewStatus === query.reviewStatus,
            )
          : enriched

      const pageResult = paginateStableList(filtered, page, pageSize)
      return {
        ...pageResult,
        /** 候选规模，便于运维观察指纹计算成本（非 total） */
        candidateCount: candidates.length,
        enrichedCount: enriched.length,
      }
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '审核表尚未创建，无法加载审核队列。请先执行迁移。',
        )
      }
      throw e
    }
  }

  async getReviewPanel(itemId: string) {
    const item = await this.findItemOrFail(itemId)
    try {
      const fingerprint = await computeItemContentFingerprint(
        this.dataSource.manager,
        item,
      )
      const reviews = await this.reviewsRepo.find({
        where: { itemId: item.id },
        order: { reviewedAt: 'DESC', id: 'DESC' },
      })
      const reviewRows = reviews.map((r) => this.toGateRow(r))
      const summary = summarizeCurrentReview({
        contentVersion: Number(item.contentVersion || 1),
        contentFingerprint: fingerprint,
        reviewsForItem: reviewRows,
      })
      const gate = evaluateLatestReviewForPublish({
        item: {
          status: item.status,
          pool: item.pool,
          isActive: Boolean(item.isActive),
          contentVersion: Number(item.contentVersion || 1),
          contentFingerprint: fingerprint,
        },
        reviewsForItem: reviewRows,
        requireConfirmPublish: false,
      })
      const qualityReasons = await this.collectQualityBlockReasons(item)
      // 与 approve 共用 assertSourceAllowsFormalPublish（只读捕获为原因，不写库）
      const sourceReasons = collectSourcePublishBlockReasons({
        sourceType: item.sourceType,
        sourceYear: item.sourceYear,
        sourceExamName: item.sourceExamName,
        sourceQuestionNo: item.sourceQuestionNo,
        sourceReference: item.sourceReference,
        sourceAdaptationNote: item.sourceAdaptationNote,
        sourceVerificationStatus: item.sourceVerificationStatus,
        sourceLicenseStatus: item.sourceLicenseStatus,
      })
      const publishBlockReasons = [
        ...publishBlockReasonsFromGate(gate),
        ...qualityReasons,
        ...sourceReasons,
      ]
      const canPublish =
        gate.ok && qualityReasons.length === 0 && sourceReasons.length === 0

      const specialty = await this.specialtiesRepo.findOne({
        where: { id: item.specialtyId },
      })
      const category = await this.categoriesRepo.findOne({
        where: { id: item.categoryId },
      })
      const knowledgePoints = await this.loadItemKpViews(item.id)
      const reviewerIds = [
        ...new Set(
          reviews
            .map((r) => String(r.reviewerUserId))
            .filter(Boolean)
            .concat(
              summary.currentReviewerUserId
                ? [summary.currentReviewerUserId]
                : [],
            ),
        ),
      ]
      const nameMap = await this.loadReviewerNames(reviewerIds)

      const history = reviews.map((r) => {
        const sameVer =
          Number(r.contentVersion) === Number(item.contentVersion || 1)
        const fpOk = String(r.contentFingerprint) === fingerprint
        return {
          id: String(r.id),
          reviewStatus: r.reviewStatus,
          reviewComment: r.reviewComment,
          reviewerUserId: String(r.reviewerUserId),
          reviewerDisplayName:
            nameMap.get(String(r.reviewerUserId)) ||
            `用户#${r.reviewerUserId}`,
          reviewedAt: r.reviewedAt.toISOString(),
          contentVersion: r.contentVersion,
          contentFingerprint: r.contentFingerprint,
          isStale: !(sameVer && fpOk),
        }
      })

      return {
        itemId: String(item.id),
        code: item.code,
        pool: item.pool,
        qtype: item.qtype,
        difficulty: item.difficulty,
        status: item.status,
        isActive: Boolean(item.isActive),
        stem: item.stem,
        optionsJson: item.optionsJson,
        answerPayloadJson: item.answerPayloadJson,
        analysis: item.analysis,
        specialty: specialty
          ? {
              id: String(specialty.id),
              code: specialty.code,
              name: specialty.name,
            }
          : null,
        category: category
          ? {
              id: String(category.id),
              code: category.code,
              name: category.name,
            }
          : null,
        knowledgePoints,
        contentVersion: Number(item.contentVersion || 1),
        contentFingerprint: fingerprint,
        currentReviewStatus: summary.currentReviewStatus,
        reviewIsStale: summary.reviewIsStale,
        currentReviewerUserId: summary.currentReviewerUserId,
        currentReviewerDisplayName: summary.currentReviewerUserId
          ? nameMap.get(summary.currentReviewerUserId) ||
            `用户#${summary.currentReviewerUserId}`
          : null,
        currentReviewedAt: summary.currentReviewedAt
          ? new Date(summary.currentReviewedAt).toISOString()
          : null,
        canPublish,
        publishBlockReasons,
        canSubmitReview: this.canSubmitReviewOn(item),
        submitBlockReasons: this.submitBlockReasons(item),
        reviewHistory: history,
      }
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '审核表尚未创建，无法加载审核面板。请先执行迁移。',
        )
      }
      throw e
    }
  }

  async submitReview(
    userId: string,
    itemId: string,
    dto: CreateHsMathTrainItemReviewDto,
  ) {
    let decision: ReturnType<typeof assertReviewDecisionInput>
    try {
      decision = assertReviewDecisionInput({
        decision: dto.decision,
        comment: dto.comment,
        reviewerIdFromClient: dto.reviewerId,
        reviewedAtFromClient: dto.reviewedAt,
      })
    } catch (e: any) {
      throw new BadRequestException(e?.message || '审核参数非法')
    }

    if (
      dto.expectedContentVersion == null ||
      !dto.expectedContentFingerprint
    ) {
      throw new BadRequestException(
        '须提交 expectedContentVersion 与 expectedContentFingerprint',
      )
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const itemRepo = manager.getRepository(HsMathTrainItem)
        const item = await itemRepo
          .createQueryBuilder('i')
          .setLock('pessimistic_write')
          .where('i.id = :id', { id: itemId })
          .getOne()
        if (!item) throw new NotFoundException('训练题不存在')

        const blocks = this.submitBlockReasons(item)
        if (blocks.length) {
          throw new BadRequestException(blocks[0])
        }

        const fp = await computeItemContentFingerprint(manager, item)
        const cv = Number(item.contentVersion || 1)

        if (Number(dto.expectedContentVersion) !== cv) {
          throw new ConflictException({
            code: 'CONTENT_VERSION_CONFLICT',
            message: '题目内容版本已变化，请重新加载后再提交审核',
            currentContentVersion: cv,
            expectedContentVersion: dto.expectedContentVersion,
          })
        }
        if (
          String(dto.expectedContentFingerprint).toLowerCase() !==
          fp.toLowerCase()
        ) {
          throw new ConflictException({
            code: 'CONTENT_FINGERPRINT_CONFLICT',
            message: '题目内容指纹已变化，请重新加载后再提交审核',
          })
        }

        const now = new Date()
        const row = manager.getRepository(HsMathTrainItemReview).create({
          itemId: item.id,
          contentVersion: cv,
          contentFingerprint: fp,
          reviewerUserId: String(userId),
          reviewStatus: decision.decision,
          reviewComment: decision.comment,
          reviewedAt: now,
        })
        const saved = await manager
          .getRepository(HsMathTrainItemReview)
          .save(row)

        // 再次确认未改 status
        const after = await itemRepo.findOne({ where: { id: item.id } })
        if (after && after.status !== item.status) {
          throw new BadRequestException('审核不得修改题目 status')
        }

        return {
          id: String(saved.id),
          itemId: String(saved.itemId),
          contentVersion: saved.contentVersion,
          contentFingerprint: saved.contentFingerprint,
          reviewStatus: saved.reviewStatus,
          reviewComment: saved.reviewComment,
          reviewerUserId: String(saved.reviewerUserId),
          reviewedAt: saved.reviewedAt.toISOString(),
          itemStatusUnchanged: after?.status ?? item.status,
          notice:
            '人工审核已记录；未修改题目 status。passed ≠ approved，须另行正式批准。',
        }
      })
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '审核表 hs_math_train_item_reviews 尚未创建，禁止提交审核。请先执行迁移 db/migrate_hs_math_p1_0fc3b.sql',
        )
      }
      throw e
    }
  }

  async listForItem(itemId: string) {
    await this.findItemOrFail(itemId)
    try {
      const rows = await this.reviewsRepo.find({
        where: { itemId },
        order: { reviewedAt: 'DESC', id: 'DESC' },
      })
      return {
        items: rows.map((r) => ({
          id: String(r.id),
          contentVersion: r.contentVersion,
          contentFingerprint: r.contentFingerprint,
          reviewStatus: r.reviewStatus,
          reviewComment: r.reviewComment,
          reviewerUserId: String(r.reviewerUserId),
          reviewedAt: r.reviewedAt.toISOString(),
        })),
      }
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '审核表尚未创建，无法读取审核历史。请先执行迁移。',
        )
      }
      throw e
    }
  }

  /** 分批 enrich，避免单次 In() 过大；不截断候选总量 */
  private async enrichQueueRowsBatched(rows: HsMathTrainItem[]) {
    const BATCH = 100
    const out: Awaited<ReturnType<typeof this.enrichQueueRows>> = []
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      out.push(...(await this.enrichQueueRows(chunk)))
    }
    return out
  }

  private async enrichQueueRows(rows: HsMathTrainItem[]) {
    if (!rows.length) return []
    const ids = rows.map((r) => r.id)
    const allReviews = await this.reviewsRepo.find({
      where: { itemId: In(ids) },
      order: { reviewedAt: 'DESC', id: 'DESC' },
    })
    const byItem = new Map<string, HsMathTrainItemReview[]>()
    for (const r of allReviews) {
      const k = String(r.itemId)
      const list = byItem.get(k) || []
      list.push(r)
      byItem.set(k, list)
    }

    const spIds = [...new Set(rows.map((r) => String(r.specialtyId)))]
    const catIds = [...new Set(rows.map((r) => String(r.categoryId)))]
    const sps = await this.specialtiesRepo.find({ where: { id: In(spIds) } })
    const cats = await this.categoriesRepo.find({ where: { id: In(catIds) } })
    const spMap = new Map(sps.map((s) => [String(s.id), s]))
    const catMap = new Map(cats.map((c) => [String(c.id), c]))

    const out = []
    const reviewerIds = new Set<string>()
    for (const item of rows) {
      const reviews = byItem.get(String(item.id)) || []
      const fp = await computeItemContentFingerprint(
        this.dataSource.manager,
        item,
      )
      const reviewRows = reviews.map((r) => this.toGateRow(r))
      const summary = summarizeCurrentReview({
        contentVersion: Number(item.contentVersion || 1),
        contentFingerprint: fp,
        reviewsForItem: reviewRows,
      })
      const gate = evaluateLatestReviewForPublish({
        item: {
          status: item.status,
          pool: item.pool,
          isActive: Boolean(item.isActive),
          contentVersion: Number(item.contentVersion || 1),
          contentFingerprint: fp,
        },
        reviewsForItem: reviewRows,
        requireConfirmPublish: false,
      })
      // 队列不跑完整质量门禁（昂贵）；来源许可与 approve 共用只读评估
      const sourceReasons = collectSourcePublishBlockReasons({
        sourceType: item.sourceType,
        sourceYear: item.sourceYear,
        sourceExamName: item.sourceExamName,
        sourceQuestionNo: item.sourceQuestionNo,
        sourceReference: item.sourceReference,
        sourceAdaptationNote: item.sourceAdaptationNote,
        sourceVerificationStatus: item.sourceVerificationStatus,
        sourceLicenseStatus: item.sourceLicenseStatus,
      })
      const gateReasons = publishBlockReasonsFromGate(gate)
      const canPublishHint = gate.ok && sourceReasons.length === 0
      if (summary.currentReviewerUserId) {
        reviewerIds.add(summary.currentReviewerUserId)
      }
      const sp = spMap.get(String(item.specialtyId))
      const cat = catMap.get(String(item.categoryId))
      out.push({
        itemId: String(item.id),
        code: item.code,
        specialty: sp
          ? { id: String(sp.id), code: sp.code, name: sp.name }
          : null,
        category: cat
          ? { id: String(cat.id), code: cat.code, name: cat.name }
          : null,
        qtype: item.qtype,
        difficulty: item.difficulty,
        status: item.status,
        pool: item.pool,
        isActive: Boolean(item.isActive),
        stemSummary: summarizeStem(item.stem),
        contentVersion: Number(item.contentVersion || 1),
        contentFingerprint: fp,
        currentReviewStatus: summary.currentReviewStatus,
        currentReviewerUserId: summary.currentReviewerUserId,
        currentReviewedAt: summary.currentReviewedAt
          ? new Date(summary.currentReviewedAt).toISOString()
          : null,
        reviewIsStale: summary.reviewIsStale,
        canPublish: canPublishHint,
        publishBlockReasons: [...gateReasons, ...sourceReasons],
      })
    }

    const nameMap = await this.loadReviewerNames([...reviewerIds])
    return out.map((r) => ({
      ...r,
      currentReviewer: r.currentReviewerUserId
        ? nameMap.get(r.currentReviewerUserId) ||
          `用户#${r.currentReviewerUserId}`
        : null,
    }))
  }

  private canSubmitReviewOn(item: HsMathTrainItem) {
    return this.submitBlockReasons(item).length === 0
  }

  private submitBlockReasons(item: HsMathTrainItem): string[] {
    const reasons: string[] = []
    if (item.pool === 'test') {
      reasons.push('test 池题目不进入正式人工审核')
    }
    if (item.status === 'disabled') {
      reasons.push('disabled 题目不可提交正式审核')
    }
    if (item.status === 'approved') {
      reasons.push('已批准题目不可再提交正式审核；请先退回 draft')
    }
    if (item.status !== 'draft') {
      if (!reasons.length) reasons.push('仅 draft 题目可提交人工审核')
    }
    if (!item.isActive && item.status === 'draft') {
      reasons.push('未启用题目不可提交审核')
    }
    return reasons
  }

  private async collectQualityBlockReasons(
    entity: HsMathTrainItem,
  ): Promise<string[]> {
    const reasons: string[] = []
    try {
      if (isBlockedFromApprove(entity.code)) {
        reasons.push('测试/演示/IT 前缀题目不可批准进入正式训练池')
      }
      if (entity.pool === 'test') {
        reasons.push('test 池题目不可批准为正式训练题')
      }
      if (
        /HS_MATH_P0_E2E/i.test(entity.stem) ||
        /HS_MATH_P1_0D1/i.test(entity.stem) ||
        /占位|TODO|FIXME/i.test(entity.stem)
      ) {
        reasons.push('题干含测试/占位内容，不可批准')
      }
      assertNonEmptyStem(entity.stem)
      if (!(entity.analysis || '').trim()) {
        reasons.push('批准前解析 analysis 不能为空')
      }
      validateAnswerPayload({
        qtype: entity.qtype,
        optionsJson: entity.optionsJson,
        answerPayload: entity.answerPayloadJson,
      })
      const specialty = await this.specialtiesRepo.findOne({
        where: { id: entity.specialtyId },
      })
      if (!specialty?.isActive) reasons.push('所属章节不存在或未启用')
      const category = await this.categoriesRepo.findOne({
        where: { id: entity.categoryId },
      })
      if (!category?.isActive) reasons.push('所属小节不存在或未启用')
      if (
        category &&
        String(category.specialtyId) !== String(entity.specialtyId)
      ) {
        reasons.push('小节不属于题目所属章节')
      }
      const links = await this.dataSource
        .getRepository(HsMathTrainItemKp)
        .find({ where: { itemId: entity.id } })
      if (!links.length) reasons.push('批准前至少关联一个知识点')
      const primaries = links.filter((l) => l.isPrimary)
      if (links.length && primaries.length !== 1) {
        reasons.push('批准前必须有且仅有一个主知识点')
      }
      if (links.length) {
        const kps = await this.dataSource
          .getRepository(HsMathKnowledgePoint)
          .find({ where: { id: In(links.map((l) => l.knowledgePointId)) } })
        if (kps.length !== links.length) {
          reasons.push('存在已删除的知识点关联')
        }
        for (const kp of kps) {
          if (!kp.isActive) reasons.push(`知识点未启用：${kp.code}`)
          try {
            assertSameSpecialty(entity.specialtyId, kp.specialtyId, kp.code)
          } catch (e: any) {
            reasons.push(e?.message || `知识点归属不一致：${kp.code}`)
          }
        }
      }
    } catch (e: any) {
      reasons.push(e?.message || '质量门禁未通过')
    }
    return reasons
  }

  private toGateRow(r: HsMathTrainItemReview) {
    return {
      reviewStatus: r.reviewStatus,
      contentVersion: r.contentVersion,
      contentFingerprint: r.contentFingerprint,
      reviewComment: r.reviewComment,
      reviewerUserId: String(r.reviewerUserId),
      reviewedAt: r.reviewedAt,
    }
  }

  private async loadReviewerNames(ids: string[]) {
    const map = new Map<string, string>()
    if (!ids.length) return map
    const users = await this.usersRepo.find({
      where: { id: In(ids) },
      select: ['id', 'nickname', 'email'],
    })
    for (const u of users) {
      map.set(String(u.id), u.nickname || u.email || `用户#${u.id}`)
    }
    return map
  }

  private async loadItemKpViews(itemId: string) {
    const links = await this.dataSource.getRepository(HsMathTrainItemKp).find({
      where: { itemId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    if (!links.length) return []
    const kps = await this.dataSource.getRepository(HsMathKnowledgePoint).find({
      where: { id: In(links.map((l) => l.knowledgePointId)) },
    })
    const map = new Map(kps.map((k) => [String(k.id), k]))
    return links.map((l) => {
      const kp = map.get(String(l.knowledgePointId))
      return {
        id: String(l.knowledgePointId),
        code: kp?.code ?? '',
        name: kp?.name ?? '(未知知识点)',
        isPrimary: Boolean(l.isPrimary),
        sortOrder: l.sortOrder,
      }
    })
  }

  private async findItemOrFail(id: string) {
    const row = await this.itemsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('训练题不存在')
    return row
  }
}

function summarizeStem(stem: string): string {
  const t = String(stem || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= 80) return t
  return `${t.slice(0, 80)}…`
}

/** 供批准门禁与审核提交共用：在已有 EntityManager 内重算指纹 */
export async function computeItemContentFingerprint(
  manager: EntityManager,
  item: HsMathTrainItem,
): Promise<string> {
  const specialty = await manager.getRepository(HsMathSpecialty).findOne({
    where: { id: item.specialtyId },
  })
  const category = await manager.getRepository(HsMathCategory).findOne({
    where: { id: item.categoryId },
  })
  if (!specialty || !category) {
    throw new BadRequestException('题目章节/小节缺失，无法计算指纹')
  }
  const links = await manager.getRepository(HsMathTrainItemKp).find({
    where: { itemId: item.id },
    order: { sortOrder: 'ASC', id: 'ASC' },
  })
  const kpIds = links.map((l) => l.knowledgePointId)
  const kpRows = kpIds.length
    ? await manager.getRepository(HsMathKnowledgePoint).find({
        where: { id: In(kpIds) },
      })
    : []
  const kpMap = new Map(kpRows.map((k) => [String(k.id), k]))
  const codes = links
    .map((l) => kpMap.get(String(l.knowledgePointId))?.code || '')
    .filter(Boolean)
  const primary = links.find((l) => l.isPrimary)
  const primaryCode = primary
    ? kpMap.get(String(primary.knowledgePointId))?.code || ''
    : ''

  let methodCodes: string[] = []
  let primaryMethodCode = ''
  try {
    const mLinks = await manager.getRepository(HsMathTrainItemMethod).find({
      where: { itemId: item.id },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    if (mLinks.length) {
      const methods = await manager.getRepository(HsMathMethod).find({
        where: { id: In(mLinks.map((l) => l.methodId)) },
      })
      const mmap = new Map(methods.map((m) => [String(m.id), m]))
      methodCodes = mLinks
        .map((l) => mmap.get(String(l.methodId))?.code || '')
        .filter(Boolean)
      const p = mLinks.find((l) => l.isPrimary)
      primaryMethodCode = p
        ? mmap.get(String(p.methodId))?.code || ''
        : ''
    }
  } catch (e) {
    if (!isMysqlNoSuchTableError(e)) throw e
  }

  let diagramSha256List: string[] = []
  try {
    const dLinks = await manager.getRepository(HsMathTrainItemDiagram).find({
      where: { itemId: item.id },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    if (dLinks.length) {
      const objs = await manager.getRepository(HsMathTrainItemDiagramObject).find({
        where: { id: In(dLinks.map((l) => l.objectId)) },
      })
      const omap = new Map(objs.map((o) => [String(o.id), o]))
      diagramSha256List = dLinks
        .map((l) => omap.get(String(l.objectId))?.contentSha256 || '')
        .filter((x) => /^[0-9a-f]{64}$/i.test(x))
        .map((x) => x.toLowerCase())
    }
  } catch (e) {
    if (!isMysqlNoSuchTableError(e)) throw e
  }

  return fingerprintTrainItemContent({
    code: item.code,
    specialtyCode: specialty.code,
    categoryCode: category.code,
    qtype: item.qtype,
    difficulty: Number(item.difficulty),
    stem: item.stem,
    optionsJson: item.optionsJson,
    answerPayloadJson: item.answerPayloadJson,
    analysis: item.analysis,
    knowledgePointCodes: codes,
    primaryKnowledgePointCode: primaryCode,
    sourceType: item.sourceType,
    sourceYear: item.sourceYear,
    sourceExamName: item.sourceExamName,
    sourceQuestionNo: item.sourceQuestionNo,
    sourceReference: item.sourceReference,
    sourceAdaptationNote: item.sourceAdaptationNote,
    sourceVerificationStatus: item.sourceVerificationStatus,
    sourceLicenseStatus: item.sourceLicenseStatus,
    methodCodes,
    primaryMethodCode,
    diagramSha256List,
  })
}
