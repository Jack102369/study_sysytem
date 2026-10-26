import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, In, Repository } from 'typeorm'
import type { HsMathItemStatus, HsMathQtype } from '../hs-math.constants'
import {
  HS_MATH_GRADE_RULE_VERSION,
  HS_MATH_SOURCE_LICENSE_DEFAULT,
  HS_MATH_SOURCE_TYPE_DEFAULT,
  HS_MATH_SOURCE_VERIFICATION_DEFAULT,
} from '../hs-math.constants'
import { ReplaceHsMathTrainItemKpsDto } from '../dto/admin-train-item-kps.dto'
import {
  PutHsMathTrainItemContentMetaDto,
  ReplaceHsMathTrainItemMethodsDto,
} from '../dto/admin-train-item-methods.dto'
import {
  CreateHsMathTrainItemDto,
  ListHsMathTrainItemsQueryDto,
  PatchHsMathTrainItemStatusDto,
  UpdateHsMathTrainItemDto,
} from '../dto/admin-train-item.dto'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathKnowledgePoint } from '../entities/hs-math-knowledge-point.entity'
import { HsMathMethod } from '../entities/hs-math-method.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { HsMathTrainItem } from '../entities/hs-math-train-item.entity'
import { HsMathTrainItemKp } from '../entities/hs-math-train-item-kp.entity'
import { HsMathTrainItemMethod } from '../entities/hs-math-train-item-method.entity'
import { HsMathTrainItemReview } from '../entities/hs-math-train-item-review.entity'
import { computeItemContentFingerprint } from './hs-math-admin-train-item-reviews.service'
import {
  assertNonEmptyStem,
  validateAnswerPayload,
} from '../util/answer-payload.validate'
import { isHsMathDuplicateError } from '../util/db-error'
import { isMysqlNoSuchTableError } from '../util/hs-math-item-content-fingerprint'
import { evaluateLatestReviewForPublish } from '../util/hs-math-review-gate'
import {
  assertSourceAllowsFormalPublish,
  assertValidSourceFields,
  normalizeSourceFields,
  type HsMathSourceFields,
  type HsMathSourceInput,
} from '../util/hs-math-source.validate'
import { isBlockedFromApprove } from '../util/train-item-import.validate'
import {
  assertPrimaryAmongLinks,
  assertSameSpecialty,
} from '../util/train-item-kps.validate'
import {
  knowledgePointLinkPlanFromRows,
  knowledgePointLinkPlansEqual,
  methodLinkPlanFromRows,
  methodLinkPlansEqual,
  snapshotTrainItemContent,
  sourceFieldsEqual,
  trainItemContentSnapshotsEqual,
} from '../util/train-item-meta-equality'
import { assertPrimaryAmongMethodLinks } from '../util/train-item-methods.validate'
import {
  assertStatusTransition,
  isTrainCandidate,
} from '../util/train-item-status'

@Injectable()
export class HsMathAdminTrainItemsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HsMathTrainItem)
    private readonly itemsRepo: Repository<HsMathTrainItem>,
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
    @InjectRepository(HsMathKnowledgePoint)
    private readonly kpRepo: Repository<HsMathKnowledgePoint>,
    @InjectRepository(HsMathTrainItemKp)
    private readonly itemKpRepo: Repository<HsMathTrainItemKp>,
    @InjectRepository(HsMathMethod)
    private readonly methodsRepo: Repository<HsMathMethod>,
    @InjectRepository(HsMathTrainItemMethod)
    private readonly itemMethodRepo: Repository<HsMathTrainItemMethod>,
  ) {}

  async list(query: ListHsMathTrainItemsQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const qb = this.itemsRepo
      .createQueryBuilder('i')
      .orderBy('i.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)

    if (query.pool) qb.andWhere('i.pool = :pool', { pool: query.pool })
    if (query.status) qb.andWhere('i.status = :status', { status: query.status })
    if (query.qtype) qb.andWhere('i.qtype = :qtype', { qtype: query.qtype })
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
    if (query.q?.trim()) {
      qb.andWhere('(i.code LIKE :q OR i.stem LIKE :q)', {
        q: `%${query.q.trim()}%`,
      })
    }

    const [rows, total] = await qb.getManyAndCount()
    return {
      items: rows.map((r) => this.toView(r)),
      total,
      page,
      pageSize,
    }
  }

  async getById(id: string) {
    const item = await this.findItemOrFail(id)
    const knowledgePoints = await this.loadItemKpViews(item.id)
    const methods = await this.loadItemMethodViews(item.id)
    return { ...this.toView(item), knowledgePoints, methods }
  }

  /**
   * 全量替换题目 KP 关联（事务+行锁）。
   * 规范化比较后无变化：不 DELETE/INSERT、不升 content_version。
   * 真实变化 → draft（若 approved）+ content_version+1。
   */
  async replaceKnowledgePoints(
    userId: string,
    itemId: string,
    dto: ReplaceHsMathTrainItemKpsDto,
  ) {
    const { ids, primaryId } = assertPrimaryAmongLinks({
      knowledgePointIds: dto.knowledgePointIds ?? [],
      primaryKnowledgePointId: dto.primaryKnowledgePointId,
    })

    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(HsMathTrainItem)
      const item = await itemRepo
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.id = :id', { id: itemId })
        .getOne()
      if (!item) throw new NotFoundException('训练题不存在')

      this.assertExpectedContentVersion(item, dto.expectedContentVersion)

      const linkRepo = manager.getRepository(HsMathTrainItemKp)
      const currentLinks = await linkRepo.find({
        where: { itemId: item.id },
        order: { sortOrder: 'ASC', id: 'ASC' },
      })
      const currentPlan = knowledgePointLinkPlanFromRows(currentLinks)
      const nextPlan = {
        knowledgePointIds: ids,
        primaryKnowledgePointId: primaryId,
      }
      const linksChanged = !knowledgePointLinkPlansEqual(currentPlan, nextPlan)

      let kps: HsMathKnowledgePoint[] = []
      if (ids.length) {
        kps = await manager.getRepository(HsMathKnowledgePoint).find({
          where: { id: In(ids) },
        })
        if (kps.length !== ids.length) {
          throw new BadRequestException('存在不存在的知识点 ID')
        }
        const catIds = [...new Set(kps.map((k) => String(k.categoryId)))]
        const cats = await manager.getRepository(HsMathCategory).find({
          where: { id: In(catIds) },
        })
        const catMap = new Map(cats.map((c) => [String(c.id), c]))
        const spIds = [...new Set(kps.map((k) => String(k.specialtyId)))]
        const sps = await manager.getRepository(HsMathSpecialty).find({
          where: { id: In(spIds) },
        })
        const spMap = new Map(sps.map((s) => [String(s.id), s]))

        for (const kp of kps) {
          if (!kp.isActive) {
            throw new BadRequestException(
              `不能关联已停用知识点：${kp.code}`,
            )
          }
          assertSameSpecialty(item.specialtyId, kp.specialtyId, kp.code)
          const cat = catMap.get(String(kp.categoryId))
          const sp = spMap.get(String(kp.specialtyId))
          if (!cat?.isActive) {
            throw new BadRequestException(
              `知识点 ${kp.code} 所属小节未启用`,
            )
          }
          if (!sp?.isActive) {
            throw new BadRequestException(
              `知识点 ${kp.code} 所属章节未启用`,
            )
          }
        }
      }

      const byId = new Map(kps.map((k) => [String(k.id), k]))

      if (linksChanged) {
        await linkRepo.delete({ itemId: item.id })
        const rows = ids.map((kid, idx) =>
          linkRepo.create({
            itemId: item.id,
            knowledgePointId: kid,
            isPrimary: primaryId === kid,
            sortOrder: (idx + 1) * 10,
          }),
        )
        if (rows.length) await linkRepo.save(rows)

        item.knowledgePointId = primaryId
        item.updatedBy = userId
        this.bumpContentVersionOnMetaEdit(item)
        await itemRepo.save(item)
      }

      const knowledgePoints = ids.map((kid, idx) => {
        const kp = byId.get(kid)!
        return {
          id: String(kp.id),
          code: kp.code,
          name: kp.name,
          isPrimary: primaryId === kid,
          sortOrder: (idx + 1) * 10,
        }
      })
      return { ...this.toView(item), knowledgePoints }
    })
  }

  /**
   * 全量替换题目方法关联（事务+行锁）。
   * 规范化比较后无变化：不写关联、不升 content_version。
   */
  async replaceMethods(
    userId: string,
    itemId: string,
    dto: ReplaceHsMathTrainItemMethodsDto,
  ) {
    const { ids, primaryId } = assertPrimaryAmongMethodLinks({
      methodIds: dto.methodIds ?? [],
      primaryMethodId: dto.primaryMethodId,
    })

    try {
      return await this.dataSource.transaction(async (manager) => {
        const itemRepo = manager.getRepository(HsMathTrainItem)
        const item = await itemRepo
          .createQueryBuilder('i')
          .setLock('pessimistic_write')
          .where('i.id = :id', { id: itemId })
          .getOne()
        if (!item) throw new NotFoundException('训练题不存在')

        this.assertExpectedContentVersion(item, dto.expectedContentVersion)

        const currentPlan = await this.loadItemMethodLinkPlan(
          item.id,
          manager,
        )
        const nextPlan = {
          methodIds: ids,
          primaryMethodId: primaryId,
        }
        const methodsChanged = !methodLinkPlansEqual(currentPlan, nextPlan)

        const methods = await this.loadActiveMethodsOrFail(manager, ids)

        if (methodsChanged) {
          await this.replaceItemMethodLinks(manager, item.id, ids, primaryId)
          item.updatedBy = userId
          this.bumpContentVersionOnMetaEdit(item)
          await itemRepo.save(item)
        }

        const byId = new Map(methods.map((m) => [String(m.id), m]))
        const methodViews = ids.map((mid, idx) => {
          const m = byId.get(mid)!
          return {
            id: String(m.id),
            code: m.code,
            name: m.name,
            isPrimary: primaryId === mid,
            sortOrder: (idx + 1) * 10,
          }
        })
        return { ...this.toView(item), methods: methodViews }
      })
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '方法表尚未创建（MIGRATION_PENDING）。请先执行 CORE-1A 迁移。',
        )
      }
      throw e
    }
  }

  /**
   * 来源 + 方法原子更新：单事务、行锁；仅真实变化时至多一次 content_version+1。
   */
  async putContentMeta(
    userId: string,
    itemId: string,
    dto: PutHsMathTrainItemContentMetaDto,
  ) {
    const hasSource = dto.source !== undefined
    const hasMethods = dto.methodIds !== undefined
    if (!hasSource && !hasMethods) {
      throw new BadRequestException('content-meta 至少提供 source 或 methodIds')
    }

    let methodPlan: { ids: string[]; primaryId: string | null } | null = null
    if (hasMethods) {
      methodPlan = assertPrimaryAmongMethodLinks({
        methodIds: dto.methodIds ?? [],
        primaryMethodId: dto.primaryMethodId,
      })
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

        this.assertExpectedContentVersion(item, dto.expectedContentVersion)

        let sourceChanged = false
        if (hasSource) {
          const merged = this.mergeSourcePatch(item, dto.source!)
          const validated = assertValidSourceFields(merged, 'persist')
          const current = normalizeSourceFields({
            sourceType: item.sourceType,
            sourceYear: item.sourceYear,
            sourceExamName: item.sourceExamName,
            sourceQuestionNo: item.sourceQuestionNo,
            sourceReference: item.sourceReference,
            sourceAdaptationNote: item.sourceAdaptationNote,
            sourceVerificationStatus: item.sourceVerificationStatus,
            sourceLicenseStatus: item.sourceLicenseStatus,
          })
          sourceChanged = !sourceFieldsEqual(current, validated)
          if (sourceChanged) {
            this.applySourceFields(item, validated)
          }
        }

        let methodsChanged = false
        let methodViews: Array<{
          id: string
          code: string
          name: string
          isPrimary: boolean
          sortOrder: number
        }> = []

        if (methodPlan) {
          const currentPlan = await this.loadItemMethodLinkPlan(
            item.id,
            manager,
          )
          const nextPlan = {
            methodIds: methodPlan.ids,
            primaryMethodId: methodPlan.primaryId,
          }
          methodsChanged = !methodLinkPlansEqual(currentPlan, nextPlan)

          const methods = await this.loadActiveMethodsOrFail(
            manager,
            methodPlan.ids,
          )
          if (methodsChanged) {
            await this.replaceItemMethodLinks(
              manager,
              item.id,
              methodPlan.ids,
              methodPlan.primaryId,
            )
          }
          const byId = new Map(methods.map((m) => [String(m.id), m]))
          methodViews = methodPlan.ids.map((mid, idx) => {
            const m = byId.get(mid)!
            return {
              id: String(m.id),
              code: m.code,
              name: m.name,
              isPrimary: methodPlan!.primaryId === mid,
              sortOrder: (idx + 1) * 10,
            }
          })
        } else {
          methodViews = await this.loadItemMethodViews(item.id, manager)
        }

        if (sourceChanged || methodsChanged) {
          item.updatedBy = userId
          this.bumpContentVersionOnMetaEdit(item)
          await itemRepo.save(item)
        }

        return { ...this.toView(item), methods: methodViews }
      })
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '方法/来源结构尚未就绪（MIGRATION_PENDING）。请先执行 CORE-1A 迁移。',
        )
      }
      throw e
    }
  }

  async create(userId: string, dto: CreateHsMathTrainItemDto) {
    await this.assertSpecialtyCategoryPair(dto.specialtyId, dto.categoryId)
    const stem = assertNonEmptyStem(dto.stem)
    const qtype = dto.qtype as HsMathQtype
    const { optionsJson, answerPayload } = validateAnswerPayload({
      qtype,
      optionsJson: dto.optionsJson ?? null,
      answerPayload: dto.answerPayloadJson,
    })

    const entity = this.itemsRepo.create({
      code: dto.code.trim(),
      pool: dto.pool ?? 'formal',
      qtype,
      stem,
      optionsJson,
      answerPayloadJson: answerPayload,
      analysis: dto.analysis ?? null,
      difficulty: dto.difficulty ?? 1,
      specialtyId: dto.specialtyId,
      categoryId: dto.categoryId,
      knowledgePointId: dto.knowledgePointId ?? null,
      sourceType: HS_MATH_SOURCE_TYPE_DEFAULT,
      sourceYear: null,
      sourceExamName: null,
      sourceQuestionNo: null,
      sourceReference: null,
      sourceAdaptationNote: null,
      sourceVerificationStatus: HS_MATH_SOURCE_VERIFICATION_DEFAULT,
      sourceLicenseStatus: HS_MATH_SOURCE_LICENSE_DEFAULT,
      status: 'draft',
      isActive: true,
      gradeRuleVersion: HS_MATH_GRADE_RULE_VERSION,
      contentVersion: 1,
      createdBy: userId,
      updatedBy: userId,
    })

    try {
      return this.toView(await this.itemsRepo.save(entity))
    } catch (e) {
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(`题目 code 已存在：${dto.code}`)
      }
      throw e
    }
  }

  async update(userId: string, id: string, dto: UpdateHsMathTrainItemDto) {
    if ('status' in (dto as object)) {
      throw new BadRequestException('请使用 status 接口修改审核状态')
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const itemRepo = manager.getRepository(HsMathTrainItem)
        const entity = await itemRepo
          .createQueryBuilder('i')
          .setLock('pessimistic_write')
          .where('i.id = :id', { id })
          .getOne()
        if (!entity) throw new NotFoundException('训练题不存在')

        this.assertExpectedContentVersion(entity, dto.expectedContentVersion)

        const beforeContent = snapshotTrainItemContent(entity)
        const beforePool = entity.pool

        const nextSpecialtyId = dto.specialtyId ?? entity.specialtyId
        const nextCategoryId = dto.categoryId ?? entity.categoryId
        if (dto.specialtyId !== undefined || dto.categoryId !== undefined) {
          await this.assertSpecialtyCategoryPair(
            nextSpecialtyId,
            nextCategoryId,
            manager,
          )
        }

        const nextQtype = (dto.qtype ?? entity.qtype) as HsMathQtype
        const needAnswerRevalidate =
          dto.qtype !== undefined ||
          dto.optionsJson !== undefined ||
          dto.answerPayloadJson !== undefined ||
          dto.stem !== undefined

        if (needAnswerRevalidate) {
          const stem = assertNonEmptyStem(dto.stem ?? entity.stem)
          const { optionsJson, answerPayload } = validateAnswerPayload({
            qtype: nextQtype,
            optionsJson:
              dto.optionsJson !== undefined
                ? dto.optionsJson
                : entity.optionsJson,
            answerPayload:
              dto.answerPayloadJson !== undefined
                ? dto.answerPayloadJson
                : entity.answerPayloadJson,
          })
          entity.stem = stem
          entity.qtype = nextQtype
          entity.optionsJson = optionsJson
          entity.answerPayloadJson = answerPayload
        }

        if (dto.code !== undefined) entity.code = dto.code.trim()
        if (dto.pool !== undefined) entity.pool = dto.pool
        if (dto.analysis !== undefined) entity.analysis = dto.analysis
        if (dto.difficulty !== undefined) entity.difficulty = dto.difficulty
        if (dto.specialtyId !== undefined) entity.specialtyId = dto.specialtyId
        if (dto.categoryId !== undefined) entity.categoryId = dto.categoryId
        if (dto.knowledgePointId !== undefined) {
          entity.knowledgePointId = dto.knowledgePointId
        }

        const sourceTouched =
          dto.sourceType !== undefined ||
          dto.sourceYear !== undefined ||
          dto.sourceExamName !== undefined ||
          dto.sourceQuestionNo !== undefined ||
          dto.sourceReference !== undefined ||
          dto.sourceAdaptationNote !== undefined ||
          dto.sourceVerificationStatus !== undefined ||
          dto.sourceLicenseStatus !== undefined

        if (sourceTouched) {
          const merged = this.mergeSourcePatch(entity, {
            sourceType: dto.sourceType,
            sourceYear: dto.sourceYear,
            sourceExamName: dto.sourceExamName,
            sourceQuestionNo: dto.sourceQuestionNo,
            sourceReference: dto.sourceReference,
            sourceAdaptationNote: dto.sourceAdaptationNote,
            sourceVerificationStatus: dto.sourceVerificationStatus,
            sourceLicenseStatus: dto.sourceLicenseStatus,
          })
          const validated = assertValidSourceFields(merged, 'persist')
          this.applySourceFields(entity, validated)
        }

        const afterContent = snapshotTrainItemContent(entity)
        const contentChanged = !trainItemContentSnapshotsEqual(
          beforeContent,
          afterContent,
        )
        const poolChanged =
          dto.pool !== undefined && entity.pool !== beforePool

        if (!contentChanged && !poolChanged) {
          return this.toView(entity)
        }

        if (contentChanged) {
          this.bumpContentVersionOnMetaEdit(entity)
        }

        entity.updatedBy = userId

        try {
          return this.toView(await itemRepo.save(entity))
        } catch (e) {
          if (isHsMathDuplicateError(e)) {
            throw new ConflictException(`题目 code 已存在：${entity.code}`)
          }
          throw e
        }
      })
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '题目结构尚未就绪（MIGRATION_PENDING）。请先执行 CORE-1A 迁移。',
        )
      }
      throw e
    }
  }

  async patchStatus(
    userId: string,
    id: string,
    dto: PatchHsMathTrainItemStatusDto,
  ) {
    const to = dto.status as HsMathItemStatus

    if (to === 'approved') {
      return this.publishWithHumanReviewGate(userId, id, dto.confirmPublish)
    }

    const entity = await this.findItemOrFail(id)
    assertStatusTransition(entity.status, to)

    if (to === 'disabled') {
      entity.status = 'disabled'
      entity.isActive = false
    } else if (to === 'draft') {
      entity.status = 'draft'
      entity.isActive = true
      entity.reviewedBy = null
      entity.reviewedAt = null
    }

    entity.updatedBy = userId
    return this.toView(await this.itemsRepo.save(entity))
  }

  /**
   * 正式批准：事务内锁行 + 质量门禁 + 来源许可 + 当前版本有效人工审核 passed。
   */
  private async publishWithHumanReviewGate(
    userId: string,
    id: string,
    confirmPublish?: boolean,
  ) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const itemRepo = manager.getRepository(HsMathTrainItem)
        const entity = await itemRepo
          .createQueryBuilder('i')
          .setLock('pessimistic_write')
          .where('i.id = :id', { id })
          .getOne()
        if (!entity) throw new NotFoundException('训练题不存在')

        assertStatusTransition(entity.status, 'approved')
        await this.assertApproveQualityGate(entity, manager)

        if (entity.pool === 'formal') {
          const source = normalizeSourceFields({
            sourceType: entity.sourceType,
            sourceYear: entity.sourceYear,
            sourceExamName: entity.sourceExamName,
            sourceQuestionNo: entity.sourceQuestionNo,
            sourceReference: entity.sourceReference,
            sourceAdaptationNote: entity.sourceAdaptationNote,
            sourceVerificationStatus: entity.sourceVerificationStatus,
            sourceLicenseStatus: entity.sourceLicenseStatus,
          })
          assertSourceAllowsFormalPublish(source)
        }

        const fingerprint = await computeItemContentFingerprint(manager, entity)

        let reviews: HsMathTrainItemReview[]
        try {
          reviews = await manager.getRepository(HsMathTrainItemReview).find({
            where: { itemId: entity.id },
            order: { reviewedAt: 'DESC', id: 'DESC' },
          })
        } catch (e) {
          if (isMysqlNoSuchTableError(e)) {
            throw new BadRequestException(
              '审核表 hs_math_train_item_reviews 尚未创建，禁止批准。请先执行迁移后再完成人工审核。',
            )
          }
          throw e
        }

        const gate = evaluateLatestReviewForPublish({
          item: {
            status: entity.status,
            pool: entity.pool,
            isActive: Boolean(entity.isActive),
            contentVersion: Number(entity.contentVersion || 1),
            contentFingerprint: fingerprint,
          },
          reviewsForItem: reviews.map((r) => ({
            reviewStatus: r.reviewStatus,
            contentVersion: r.contentVersion,
            contentFingerprint: r.contentFingerprint,
            reviewComment: r.reviewComment,
            reviewerUserId: String(r.reviewerUserId),
            reviewedAt: r.reviewedAt,
          })),
          requireConfirmPublish: true,
          confirmPublish,
        })
        if (!gate.ok) {
          throw new BadRequestException(gate.message)
        }

        entity.status = 'approved'
        entity.isActive = true
        entity.reviewedBy = userId
        entity.reviewedAt = new Date()
        entity.updatedBy = userId
        return this.toView(await itemRepo.save(entity))
      })
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '审核表尚未创建，禁止批准（fail-closed）。',
        )
      }
      throw e
    }
  }

  private async assertApproveQualityGate(
    entity: HsMathTrainItem,
    manager?: EntityManager,
  ) {
    if (isBlockedFromApprove(entity.code)) {
      throw new BadRequestException(
        '测试/演示/IT 前缀题目不可批准进入正式训练池',
      )
    }
    if (entity.pool === 'test') {
      throw new BadRequestException('test 池题目不可批准为正式训练题')
    }
    if (
      /HS_MATH_P0_E2E/i.test(entity.stem) ||
      /HS_MATH_P1_0D1/i.test(entity.stem) ||
      /占位|TODO|FIXME/i.test(entity.stem)
    ) {
      throw new BadRequestException('题干含测试/占位内容，不可批准')
    }
    assertNonEmptyStem(entity.stem)
    const analysis = (entity.analysis || '').trim()
    if (!analysis) {
      throw new BadRequestException('批准前解析 analysis 不能为空')
    }
    validateAnswerPayload({
      qtype: entity.qtype,
      optionsJson: entity.optionsJson,
      answerPayload: entity.answerPayloadJson,
    })

    const spRepo = manager
      ? manager.getRepository(HsMathSpecialty)
      : this.specialtiesRepo
    const catRepo = manager
      ? manager.getRepository(HsMathCategory)
      : this.categoriesRepo
    const linkRepo = manager
      ? manager.getRepository(HsMathTrainItemKp)
      : this.itemKpRepo
    const kpRepo = manager
      ? manager.getRepository(HsMathKnowledgePoint)
      : this.kpRepo

    const specialty = await spRepo.findOne({
      where: { id: entity.specialtyId },
    })
    if (!specialty?.isActive) {
      throw new BadRequestException('所属章节不存在或未启用')
    }
    const category = await catRepo.findOne({
      where: { id: entity.categoryId },
    })
    if (!category?.isActive) {
      throw new BadRequestException('所属小节不存在或未启用')
    }
    if (String(category.specialtyId) !== String(entity.specialtyId)) {
      throw new BadRequestException('小节不属于题目所属章节')
    }

    const links = await linkRepo.find({ where: { itemId: entity.id } })
    if (!links.length) {
      throw new BadRequestException('批准前至少关联一个知识点')
    }
    const primaries = links.filter((l) => l.isPrimary)
    if (primaries.length !== 1) {
      throw new BadRequestException('批准前必须有且仅有一个主知识点')
    }
    const kps = await kpRepo.find({
      where: { id: In(links.map((l) => l.knowledgePointId)) },
    })
    if (kps.length !== links.length) {
      throw new BadRequestException('存在已删除的知识点关联')
    }
    for (const kp of kps) {
      if (!kp.isActive) {
        throw new BadRequestException(`知识点未启用：${kp.code}`)
      }
      assertSameSpecialty(entity.specialtyId, kp.specialtyId, kp.code)
    }
    const primaryKpId = String(primaries[0].knowledgePointId)
    if (
      entity.knowledgePointId &&
      String(entity.knowledgePointId) !== primaryKpId
    ) {
      throw new BadRequestException('主知识点与 knowledge_point_id 不一致')
    }
  }

  private bumpContentVersionOnMetaEdit(item: HsMathTrainItem) {
    if (item.status === 'approved') {
      item.status = 'draft'
      item.isActive = true
      item.reviewedBy = null
      item.reviewedAt = null
    }
    item.contentVersion = (item.contentVersion || 1) + 1
  }

  private assertExpectedContentVersion(
    item: HsMathTrainItem,
    expected?: number,
  ) {
    if (expected === undefined || expected === null) return
    if (Number(item.contentVersion || 1) !== Number(expected)) {
      throw new ConflictException(
        `内容版本冲突：期望 ${expected}，当前 ${item.contentVersion}`,
      )
    }
  }

  private mergeSourcePatch(
    item: HsMathTrainItem,
    patch: HsMathSourceInput,
  ): HsMathSourceInput {
    return {
      sourceType:
        patch.sourceType !== undefined ? patch.sourceType : item.sourceType,
      sourceYear:
        patch.sourceYear !== undefined ? patch.sourceYear : item.sourceYear,
      sourceExamName:
        patch.sourceExamName !== undefined
          ? patch.sourceExamName
          : item.sourceExamName,
      sourceQuestionNo:
        patch.sourceQuestionNo !== undefined
          ? patch.sourceQuestionNo
          : item.sourceQuestionNo,
      sourceReference:
        patch.sourceReference !== undefined
          ? patch.sourceReference
          : item.sourceReference,
      sourceAdaptationNote:
        patch.sourceAdaptationNote !== undefined
          ? patch.sourceAdaptationNote
          : item.sourceAdaptationNote,
      sourceVerificationStatus:
        patch.sourceVerificationStatus !== undefined
          ? patch.sourceVerificationStatus
          : item.sourceVerificationStatus,
      sourceLicenseStatus:
        patch.sourceLicenseStatus !== undefined
          ? patch.sourceLicenseStatus
          : item.sourceLicenseStatus,
    }
  }

  private applySourceFields(item: HsMathTrainItem, s: HsMathSourceFields) {
    item.sourceType = s.sourceType
    item.sourceYear = s.sourceYear
    item.sourceExamName = s.sourceExamName
    item.sourceQuestionNo = s.sourceQuestionNo
    item.sourceReference = s.sourceReference
    item.sourceAdaptationNote = s.sourceAdaptationNote
    item.sourceVerificationStatus = s.sourceVerificationStatus
    item.sourceLicenseStatus = s.sourceLicenseStatus
  }

  private async loadActiveMethodsOrFail(
    manager: EntityManager,
    ids: string[],
  ): Promise<HsMathMethod[]> {
    if (!ids.length) return []
    const methods = await manager.getRepository(HsMathMethod).find({
      where: { id: In(ids) },
    })
    if (methods.length !== ids.length) {
      throw new BadRequestException('存在不存在的方法 ID')
    }
    for (const m of methods) {
      if (!m.isActive) {
        throw new BadRequestException(`不能关联已停用方法：${m.code}`)
      }
    }
    return methods
  }

  private async replaceItemMethodLinks(
    manager: EntityManager,
    itemId: string,
    ids: string[],
    primaryId: string | null,
  ) {
    const linkRepo = manager.getRepository(HsMathTrainItemMethod)
    await linkRepo.delete({ itemId })
    const rows = ids.map((mid, idx) =>
      linkRepo.create({
        itemId,
        methodId: mid,
        isPrimary: primaryId === mid,
        sortOrder: (idx + 1) * 10,
      }),
    )
    if (rows.length) await linkRepo.save(rows)
  }

  private async assertSpecialtyCategoryPair(
    specialtyId: string,
    categoryId: string,
    manager?: EntityManager,
  ) {
    const spRepo = manager
      ? manager.getRepository(HsMathSpecialty)
      : this.specialtiesRepo
    const catRepo = manager
      ? manager.getRepository(HsMathCategory)
      : this.categoriesRepo
    const specialty = await spRepo.findOne({
      where: { id: specialtyId },
    })
    if (!specialty) throw new NotFoundException('专项不存在')
    const category = await catRepo.findOne({
      where: { id: categoryId },
    })
    if (!category) throw new NotFoundException('分类不存在')
    if (String(category.specialtyId) !== String(specialtyId)) {
      throw new BadRequestException('分类不属于指定专项')
    }
  }

  private async findItemOrFail(id: string) {
    const row = await this.itemsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('训练题不存在')
    return row
  }

  private async loadItemKpViews(itemId: string) {
    const links = await this.itemKpRepo.find({
      where: { itemId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    if (!links.length) return []
    const kps = await this.kpRepo.find({
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

  /** 行锁后读取当前方法关联计划（顺序=sort_order） */
  private async loadItemMethodLinkPlan(
    itemId: string,
    manager: EntityManager,
  ) {
    const linkRepo = manager.getRepository(HsMathTrainItemMethod)
    const links = await linkRepo.find({
      where: { itemId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return methodLinkPlanFromRows(links)
  }

  private async loadItemMethodViews(
    itemId: string,
    manager?: EntityManager,
  ) {
    try {
      const linkRepo = manager
        ? manager.getRepository(HsMathTrainItemMethod)
        : this.itemMethodRepo
      const methodRepo = manager
        ? manager.getRepository(HsMathMethod)
        : this.methodsRepo
      const links = await linkRepo.find({
        where: { itemId },
        order: { sortOrder: 'ASC', id: 'ASC' },
      })
      if (!links.length) return []
      const methods = await methodRepo.find({
        where: { id: In(links.map((l) => l.methodId)) },
      })
      const map = new Map(methods.map((m) => [String(m.id), m]))
      return links.map((l) => {
        const m = map.get(String(l.methodId))
        return {
          id: String(l.methodId),
          code: m?.code ?? '',
          name: m?.name ?? '(未知方法)',
          isPrimary: Boolean(l.isPrimary),
          sortOrder: l.sortOrder,
        }
      })
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) return []
      throw e
    }
  }

  private toView(row: HsMathTrainItem) {
    const source = normalizeSourceFields({
      sourceType: row.sourceType,
      sourceYear: row.sourceYear,
      sourceExamName: row.sourceExamName,
      sourceQuestionNo: row.sourceQuestionNo,
      sourceReference: row.sourceReference,
      sourceAdaptationNote: row.sourceAdaptationNote,
      sourceVerificationStatus: row.sourceVerificationStatus,
      sourceLicenseStatus: row.sourceLicenseStatus,
    })
    return {
      id: String(row.id),
      code: row.code,
      pool: row.pool,
      qtype: row.qtype,
      stem: row.stem,
      optionsJson: row.optionsJson,
      answerPayloadJson: row.answerPayloadJson,
      analysis: row.analysis,
      difficulty: row.difficulty,
      ...source,
      specialtyId: String(row.specialtyId),
      categoryId: String(row.categoryId),
      knowledgePointId: row.knowledgePointId
        ? String(row.knowledgePointId)
        : null,
      status: row.status,
      isActive: Boolean(row.isActive),
      gradeRuleVersion: row.gradeRuleVersion,
      contentVersion: row.contentVersion,
      createdBy: row.createdBy ? String(row.createdBy) : null,
      updatedBy: row.updatedBy ? String(row.updatedBy) : null,
      reviewedBy: row.reviewedBy ? String(row.reviewedBy) : null,
      reviewedAt: row.reviewedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      trainCandidate: isTrainCandidate(row.status, Boolean(row.isActive)),
    }
  }
}
