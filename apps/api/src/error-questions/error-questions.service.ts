import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { OcrClientService } from '../ai-reference/ocr-client.service'
import { OcrAccessService } from '../auth/ocr-access.service'
import { ErrorCategoriesService } from '../error-categories/error-categories.service'
import { FeatureFlagsService } from '../feature-flags/feature-flags.service'
import { PointsService } from '../points/points.service'
import { SubjectsService } from '../subjects/subjects.service'
import { Tag } from '../tags/tag.entity'
import { CreateAttemptDto } from './dto/error-question.dto'
import { CreateErrorQuestionDto } from './dto/error-question.dto'
import { CreateExtensionDto } from './dto/error-question.dto'
import { ListErrorQuestionsQueryDto } from './dto/error-question.dto'
import { UpdateErrorQuestionDto } from './dto/error-question.dto'
import { ErrorAttempt } from './error-attempt.entity'
import { ErrorQuestion } from './error-question.entity'
import { Extension } from './extension.entity'

@Injectable()
export class ErrorQuestionsService {
  constructor(
    @InjectRepository(ErrorQuestion)
    private readonly eqRepo: Repository<ErrorQuestion>,
    @InjectRepository(Extension)
    private readonly extRepo: Repository<Extension>,
    @InjectRepository(ErrorAttempt)
    private readonly attemptRepo: Repository<ErrorAttempt>,
    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
    private readonly subjectsService: SubjectsService,
    private readonly categoriesService: ErrorCategoriesService,
    private readonly dataSource: DataSource,
    private readonly ocr: OcrClientService,
    private readonly ocrAccess: OcrAccessService,
    private readonly featureFlags: FeatureFlagsService,
    private readonly points: PointsService,
  ) {}

  async list(userId: string, query: ListErrorQuestionsQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const idQb = this.eqRepo
      .createQueryBuilder('eq')
      .select('eq.id', 'id')
      .where('eq.user_id = :userId', { userId })

    if (query.subjectId) idQb.andWhere('eq.subject_id = :subjectId', { subjectId: query.subjectId })
    if (query.categoryId) idQb.andWhere('eq.category_id = :categoryId', { categoryId: query.categoryId })
    if (query.status) idQb.andWhere('eq.status = :status', { status: query.status })
    if (query.source) idQb.andWhere('eq.source = :source', { source: query.source })
    if (query.dateFrom) idQb.andWhere('eq.occurred_at >= :dateFrom', { dateFrom: query.dateFrom })
    if (query.dateTo) idQb.andWhere('eq.occurred_at <= :dateTo', { dateTo: query.dateTo })
    if (query.keyword) {
      idQb.andWhere('(eq.title LIKE :kw OR eq.stem_text LIKE :kw OR eq.source LIKE :kw)', {
        kw: `%${query.keyword}%`,
      })
    }
    if (query.tagId) {
      idQb.innerJoin('eq.tags', 'ftag', 'ftag.id = :tagId', { tagId: query.tagId })
    }

    const total = await idQb.clone().getCount()
    const idRows = await idQb
      .orderBy('eq.occurred_at', 'DESC')
      .addOrderBy('eq.id', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<{ id: string }>()
    const ids = idRows.map((r) => String(r.id))
    if (!ids.length) {
      return { items: [], total, page, pageSize }
    }

    const rows = await this.eqRepo.find({
      where: { userId, id: In(ids) },
      relations: ['tags'],
    })
    const orderMap = new Map(ids.map((id, idx) => [id, idx]))
    rows.sort(
      (a, b) => (orderMap.get(String(a.id)) ?? 0) - (orderMap.get(String(b.id)) ?? 0),
    )

    const subjectIds = [...new Set(rows.map((r) => String(r.subjectId)))]
    const categoryIds = [
      ...new Set(rows.map((r) => (r.categoryId ? String(r.categoryId) : '')).filter(Boolean)),
    ]
    const subjectNameMap = await this.loadSubjectNames(userId, subjectIds)
    const categoryNameMap = await this.loadCategoryNames(userId, categoryIds)
    const stemImageMap = await this.loadStemImageUrls(userId, ids)

    return {
      items: rows.map((r) =>
        this.toListView(
          r,
          subjectNameMap.get(String(r.subjectId)) ?? null,
          r.categoryId ? categoryNameMap.get(String(r.categoryId)) ?? null : null,
          stemImageMap.get(String(r.id)) ?? null,
        ),
      ),
      total,
      page,
      pageSize,
    }
  }

  async detail(userId: string, id: string) {
    const eq = await this.eqRepo.findOne({
      where: { id, userId },
      relations: ['tags', 'extensions', 'attempts'],
    })
    if (!eq) throw new NotFoundException('错题不存在')

    const extensions = [...(eq.extensions || [])].sort(
      (a, b) => Number(a.id) - Number(b.id),
    )
    const attempts = [...(eq.attempts || [])].sort(
      (a, b) =>
        new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime(),
    )

    const attachments = await this.dataSource.query(
      `SELECT a.id, a.url, a.mime_type AS mimeType, a.storage, eqa.role, eqa.sort_order AS sortOrder
       FROM error_question_attachments eqa
       INNER JOIN attachments a ON a.id = eqa.attachment_id
       WHERE eqa.error_question_id = ? AND a.user_id = ?
       ORDER BY eqa.role ASC, eqa.sort_order ASC, a.id ASC`,
      [id, userId],
    )

    const subjectNameMap = await this.loadSubjectNames(userId, [String(eq.subjectId)])
    const categoryNameMap = eq.categoryId
      ? await this.loadCategoryNames(userId, [String(eq.categoryId)])
      : new Map<string, string>()

    const extraAttIds = [
      ...attempts.map((a) => (a.answerAttachmentId ? String(a.answerAttachmentId) : '')),
      ...extensions.map((e) => (e.questionAttachmentId ? String(e.questionAttachmentId) : '')),
    ].filter(Boolean)
    const attUrlMap = await this.loadAttachmentUrls(userId, extraAttIds)

    return {
      ...this.toListView(
        eq,
        subjectNameMap.get(String(eq.subjectId)) ?? null,
        eq.categoryId ? categoryNameMap.get(String(eq.categoryId)) ?? null : null,
      ),
      stemText: eq.stemText,
      analysisText: eq.analysisText,
      keyPoints: eq.keyPoints,
      extensions: extensions.map((e) => ({
        id: String(e.id),
        title: e.title,
        contentText: e.contentText,
        answerText: e.answerText,
        questionAttachmentId: e.questionAttachmentId ? String(e.questionAttachmentId) : null,
        questionAttachmentUrl: e.questionAttachmentId
          ? attUrlMap.get(String(e.questionAttachmentId)) ?? null
          : null,
        createdAt: e.createdAt,
      })),
      attempts: attempts.map((a) => ({
        id: String(a.id),
        attemptedAt: a.attemptedAt,
        result: a.result,
        timeSpentSeconds: a.timeSpentSeconds,
        note: a.note,
        answerAttachmentId: a.answerAttachmentId ? String(a.answerAttachmentId) : null,
        answerAttachmentUrl: a.answerAttachmentId
          ? attUrlMap.get(String(a.answerAttachmentId)) ?? null
          : null,
      })),
      attachments: (attachments as Array<Record<string, unknown>>).map((a) => ({
        id: String(a.id),
        url: a.url,
        mimeType: a.mimeType,
        storage: a.storage,
        role: a.role,
        sortOrder: Number(a.sortOrder ?? 0),
      })),
      hasCorrectAttempt: attempts.some((a) => a.result === 'CORRECT'),
    }
  }

  async create(userId: string, dto: CreateErrorQuestionDto) {
    await this.subjectsService.findOwnedOrFail(userId, dto.subjectId)
    const categoryId = this.nullId(dto.categoryId)
    if (!categoryId) {
      throw new BadRequestException('请选择分类')
    }
    await this.categoriesService.findOwnedOrFail(userId, categoryId)
    const tags = await this.resolveTags(userId, dto.tagIds)

    const entity = this.eqRepo.create({
      userId,
      subjectId: dto.subjectId,
      categoryId,
      occurredAt: dto.occurredAt,
      title: dto.title ?? null,
      stemText: dto.stemText ?? null,
      analysisText: dto.analysisText ?? null,
      keyPoints: dto.keyPoints ?? null,
      source: dto.source ?? null,
      difficulty: dto.difficulty ?? null,
      status: 'NEW',
      nextReviewAt: null,
      tags,
    })
    const saved = await this.eqRepo.save(entity)
    return this.detail(userId, String(saved.id))
  }

  async update(userId: string, id: string, dto: UpdateErrorQuestionDto) {
    const entity = await this.eqRepo.findOne({
      where: { id, userId },
      relations: ['tags'],
    })
    if (!entity) throw new NotFoundException('错题不存在')

    if (dto.subjectId !== undefined) {
      await this.subjectsService.findOwnedOrFail(userId, dto.subjectId)
      entity.subjectId = dto.subjectId
    }
    if (dto.categoryId !== undefined) {
      const categoryId = this.nullId(dto.categoryId)
      if (!categoryId) {
        throw new BadRequestException('请选择分类')
      }
      await this.categoriesService.findOwnedOrFail(userId, categoryId)
      entity.categoryId = categoryId
    }
    if (dto.occurredAt !== undefined) entity.occurredAt = dto.occurredAt
    if (dto.title !== undefined) entity.title = dto.title
    if (dto.stemText !== undefined) entity.stemText = dto.stemText
    if (dto.analysisText !== undefined) entity.analysisText = dto.analysisText
    if (dto.keyPoints !== undefined) entity.keyPoints = dto.keyPoints
    if (dto.source !== undefined) entity.source = dto.source
    if (dto.difficulty !== undefined) entity.difficulty = dto.difficulty
    const prevStatus = entity.status
    if (dto.status !== undefined) entity.status = dto.status
    if (dto.nextReviewAt !== undefined) {
      entity.nextReviewAt = dto.nextReviewAt ? new Date(dto.nextReviewAt) : null
    }
    if (dto.tagIds !== undefined) {
      entity.tags = await this.resolveTags(userId, dto.tagIds)
    }

    await this.eqRepo.save(entity)
    if (prevStatus !== 'MASTERED' && entity.status === 'MASTERED') {
      await this.points.awardSafe(userId, 'error_mastered', id, '错题已掌握')
    }
    return this.detail(userId, id)
  }

  async remove(userId: string, id: string) {
    const entity = await this.eqRepo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('错题不存在')
    await this.eqRepo.remove(entity)
    return { id }
  }

  async addExtension(userId: string, errorQuestionId: string, dto: CreateExtensionDto) {
    await this.findOwnedOrFail(userId, errorQuestionId)
    const questionAttachmentId = this.nullId(dto.questionAttachmentId)
    if (questionAttachmentId) {
      await this.assertOwnedAttachment(userId, questionAttachmentId)
    }
    const ext = this.extRepo.create({
      errorQuestionId,
      title: dto.title ?? null,
      contentText: dto.contentText ?? null,
      answerText: dto.answerText ?? null,
      questionAttachmentId,
    })
    const saved = await this.extRepo.save(ext)
    const urlMap = questionAttachmentId
      ? await this.loadAttachmentUrls(userId, [questionAttachmentId])
      : new Map<string, string>()
    return {
      id: String(saved.id),
      title: saved.title,
      contentText: saved.contentText,
      answerText: saved.answerText,
      questionAttachmentId,
      questionAttachmentUrl: questionAttachmentId
        ? urlMap.get(questionAttachmentId) ?? null
        : null,
      createdAt: saved.createdAt,
    }
  }

  async removeExtension(userId: string, errorQuestionId: string, extensionId: string) {
    await this.findOwnedOrFail(userId, errorQuestionId)
    const ext = await this.extRepo.findOne({
      where: { id: extensionId, errorQuestionId },
    })
    if (!ext) throw new NotFoundException('拓展题不存在')
    await this.extRepo.remove(ext)
    return { id: extensionId }
  }

  async addAttempt(userId: string, errorQuestionId: string, dto: CreateAttemptDto) {
    const eq = await this.findOwnedOrFail(userId, errorQuestionId)

    const alreadyCorrectCnt = await this.attemptRepo.count({
      where: { errorQuestionId, result: 'CORRECT' },
    })
    if (alreadyCorrectCnt > 0 || eq.status === 'MASTERED') {
      throw new BadRequestException('本题已答对，无需继续再练')
    }

    const answerAttachmentId = this.nullId(dto.answerAttachmentId)
    if (answerAttachmentId) {
      await this.assertOwnedAttachment(userId, answerAttachmentId)
    }

    const attempt = this.attemptRepo.create({
      errorQuestionId,
      result: dto.result,
      timeSpentSeconds: dto.timeSpentSeconds ?? null,
      note: dto.note ?? null,
      answerAttachmentId,
    })
    const saved = await this.attemptRepo.save(attempt)

    if (dto.result === 'CORRECT') {
      eq.status = 'MASTERED'
      eq.nextReviewAt = null
    } else {
      eq.nextReviewAt = this.calcNextReview(dto.result)
      if (eq.status === 'NEW' || eq.status === 'ARCHIVED') {
        eq.status = 'REVIEWING'
      }
    }
    await this.eqRepo.save(eq)

    await this.points.awardSafe(
      userId,
      'review_attempt',
      String(saved.id),
      '完成复习再练',
      'error_attempt',
    )
    if (dto.result === 'CORRECT') {
      await this.points.awardSafe(
        userId,
        'attempt_correct',
        String(saved.id),
        '再练答对',
        'error_attempt',
      )
      await this.points.awardSafe(
        userId,
        'error_mastered',
        errorQuestionId,
        '错题已掌握',
      )
    }

    const urlMap = answerAttachmentId
      ? await this.loadAttachmentUrls(userId, [answerAttachmentId])
      : new Map<string, string>()

    return {
      id: String(saved.id),
      attemptedAt: saved.attemptedAt,
      result: saved.result,
      timeSpentSeconds: saved.timeSpentSeconds,
      note: saved.note,
      answerAttachmentId,
      answerAttachmentUrl: answerAttachmentId
        ? urlMap.get(answerAttachmentId) ?? null
        : null,
      nextReviewAt: eq.nextReviewAt,
      status: eq.status,
    }
  }

  async listTodayReviews(userId: string) {
    const now = new Date()
    const rows = await this.eqRepo
      .createQueryBuilder('eq')
      .leftJoinAndSelect('eq.tags', 'tag')
      .where('eq.user_id = :userId', { userId })
      .andWhere('eq.status IN (:...statuses)', { statuses: ['NEW', 'REVIEWING'] })
      .andWhere('(eq.next_review_at IS NULL OR eq.next_review_at <= :now)', { now })
      .orderBy('eq.next_review_at', 'ASC')
      .addOrderBy('eq.id', 'ASC')
      .getMany()
    const subjectNameMap = await this.loadSubjectNames(
      userId,
      rows.map((r) => String(r.subjectId)),
    )
    const categoryNameMap = await this.loadCategoryNames(
      userId,
      rows.map((r) => (r.categoryId ? String(r.categoryId) : '')).filter(Boolean),
    )
    return rows.map((r) =>
      this.toListView(
        r,
        subjectNameMap.get(String(r.subjectId)) ?? null,
        r.categoryId ? categoryNameMap.get(String(r.categoryId)) ?? null : null,
      ),
    )
  }

  async stats(userId: string) {
    const total = await this.eqRepo.count({ where: { userId } })
    const byStatusRaw = await this.eqRepo
      .createQueryBuilder('eq')
      .select('eq.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('eq.user_id = :userId', { userId })
      .groupBy('eq.status')
      .getRawMany()

    const mastered = Number(
      byStatusRaw.find((r) => r.status === 'MASTERED')?.cnt ?? 0,
    )
    const masteryRate = total ? Number(((mastered / total) * 100).toFixed(1)) : 0

    const byCategory = await this.dataSource.query(
      `SELECT COALESCE(c.name, '未分类') AS name, COUNT(*) AS cnt
       FROM error_questions eq
       LEFT JOIN error_categories c ON c.id = eq.category_id
       WHERE eq.user_id = ?
       GROUP BY COALESCE(c.name, '未分类')
       ORDER BY cnt DESC
       LIMIT 20`,
      [userId],
    )

    const topTags = await this.dataSource.query(
      `SELECT t.name AS name, COUNT(*) AS cnt
       FROM error_question_tags eqt
       INNER JOIN error_questions eq ON eq.id = eqt.error_question_id
       INNER JOIN tags t ON t.id = eqt.tag_id
       WHERE eq.user_id = ?
       GROUP BY t.id, t.name
       ORDER BY cnt DESC
       LIMIT 10`,
      [userId],
    )

    const days = async (n: number) => {
      const rows = await this.dataSource.query(
        `SELECT
           SUM(CASE WHEN eq.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS createdCnt,
           SUM(CASE WHEN eq.status = 'MASTERED' AND eq.updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS masteredCnt
         FROM error_questions eq
         WHERE eq.user_id = ?`,
        [n, n, userId],
      )
      return {
        created: Number(rows?.[0]?.createdCnt ?? 0),
        mastered: Number(rows?.[0]?.masteredCnt ?? 0),
      }
    }

    return {
      total,
      masteryRate,
      byStatus: byStatusRaw.map((r) => ({
        status: r.status,
        count: Number(r.cnt),
      })),
      byCategory: byCategory.map((r: { name: string; cnt: string }) => ({
        name: r.name,
        count: Number(r.cnt),
      })),
      topTags: topTags.map((r: { name: string; cnt: string }) => ({
        name: r.name,
        count: Number(r.cnt),
      })),
      last7Days: await days(7),
      last30Days: await days(30),
    }
  }

  async linkAttachment(
    userId: string,
    errorQuestionId: string,
    attachmentId: string,
    role: string,
    sortOrder = 0,
  ) {
    await this.findOwnedOrFail(userId, errorQuestionId)
    const owned = await this.dataSource.query(
      `SELECT id FROM attachments WHERE id = ? AND user_id = ? LIMIT 1`,
      [attachmentId, userId],
    )
    if (!owned?.length) throw new NotFoundException('附件不存在')

    try {
      await this.dataSource.query(
        `INSERT INTO error_question_attachments (error_question_id, attachment_id, role, sort_order)
         VALUES (?, ?, ?, ?)`,
        [errorQuestionId, attachmentId, role, sortOrder],
      )
    } catch {
      throw new BadRequestException('附件已关联或参数无效')
    }
    return this.detail(userId, errorQuestionId)
  }

  async unlinkAttachment(userId: string, errorQuestionId: string, attachmentId: string) {
    await this.findOwnedOrFail(userId, errorQuestionId)
    await this.dataSource.query(
      `DELETE FROM error_question_attachments WHERE error_question_id = ? AND attachment_id = ?`,
      [errorQuestionId, attachmentId],
    )
    return { ok: true }
  }

  async findOwnedOrFail(userId: string, id: string) {
    const entity = await this.eqRepo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('错题不存在')
    return entity
  }

  private calcNextReview(result: 'CORRECT' | 'WRONG' | 'PARTIAL') {
    const days = result === 'CORRECT' ? 3 : 1
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
  }

  private async resolveTags(userId: string, tagIds?: string[]) {
    if (!tagIds?.length) return []
    const tags = await this.tagsRepo.find({
      where: { userId, id: In(tagIds) },
    })
    if (tags.length !== tagIds.length) {
      throw new BadRequestException('存在无效标签')
    }
    return tags
  }

  private nullId(value?: string | null) {
    if (value === undefined || value === null || value === '') return null
    return String(value)
  }

  private async loadSubjectNames(userId: string, subjectIds: string[]) {
    const map = new Map<string, string>()
    const ids = [...new Set(subjectIds.filter(Boolean))]
    if (!ids.length) return map
    const rows = (await this.dataSource.query(
      `SELECT id, name FROM subjects WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
      [userId, ...ids],
    )) as Array<{ id: string | number; name: string }>
    for (const row of rows) {
      map.set(String(row.id), row.name)
    }
    return map
  }

  private async loadCategoryNames(userId: string, categoryIds: string[]) {
    const map = new Map<string, string>()
    const ids = [...new Set(categoryIds.filter(Boolean))]
    if (!ids.length) return map
    const rows = (await this.dataSource.query(
      `SELECT id, name FROM error_categories WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
      [userId, ...ids],
    )) as Array<{ id: string | number; name: string }>
    for (const row of rows) {
      map.set(String(row.id), row.name)
    }
    return map
  }

  private async loadAttachmentUrls(userId: string, attachmentIds: string[]) {
    const map = new Map<string, string>()
    const ids = [...new Set(attachmentIds.filter(Boolean))]
    if (!ids.length) return map
    const rows = (await this.dataSource.query(
      `SELECT id, url FROM attachments WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
      [userId, ...ids],
    )) as Array<{ id: string | number; url: string }>
    for (const row of rows) {
      map.set(String(row.id), row.url)
    }
    return map
  }

  private async assertOwnedAttachment(userId: string, attachmentId: string) {
    const rows = (await this.dataSource.query(
      `SELECT id FROM attachments WHERE id = ? AND user_id = ? LIMIT 1`,
      [attachmentId, userId],
    )) as Array<{ id: string | number }>
    if (!rows.length) {
      throw new BadRequestException('附件不存在或不属于当前用户')
    }
  }

  /** 按附件 OCR；需 OCR 权限；服务宕机时仅本接口失败 */
  async ocrAttachment(
    userId: string,
    attachmentId: string,
    mode: 'general' | 'formula' | 'smart' = 'general',
  ) {
    await this.featureFlags.assertEnabled(
      'errors.ocr_fill',
      '错题页 OCR 功能已关闭（功能管理）',
    )
    await this.ocrAccess.assertCanUseOcr(userId)
    const rows = (await this.dataSource.query(
      `SELECT id, url, mime_type AS mimeType FROM attachments WHERE id = ? AND user_id = ? LIMIT 1`,
      [attachmentId, userId],
    )) as Array<{ id: string; url: string; mimeType: string | null }>
    if (!rows.length) {
      throw new NotFoundException('附件不存在')
    }
    const att = rows[0]
    const mime = (att.mimeType || '').toLowerCase()
    const isImage =
      mime.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(att.url || '')
    if (!isImage) {
      throw new BadRequestException('仅支持对图片附件做文字识别')
    }
    const abs = this.ocr.resolveUploadAbsolutePath(att.url)
    const result = await this.ocr.ocrByFile(abs, mode)
    if (!result.text) {
      throw new BadRequestException(
        mode === 'smart'
          ? '智能识别未得到有效文字，请换清晰图片或手动输入'
          : mode === 'formula'
            ? '公式识别未得到有效文字，请裁切纯公式或改用智能识别'
            : '未能识别出文字，请换清晰图片或手动输入',
      )
    }
    return {
      attachmentId: String(att.id),
      text: result.text,
      confidence: result.confidence,
      mode,
      engine: result.engine || null,
    }
  }

  private async loadStemImageUrls(userId: string, errorIds: string[]) {
    const map = new Map<string, string>()
    if (!errorIds.length) return map
    const placeholders = errorIds.map(() => '?').join(',')
    const rows = (await this.dataSource.query(
      `SELECT eqa.error_question_id AS eid, a.url AS url
       FROM error_question_attachments eqa
       INNER JOIN attachments a ON a.id = eqa.attachment_id AND a.user_id = ?
       WHERE eqa.role = 'STEM' AND eqa.error_question_id IN (${placeholders})
       ORDER BY eqa.sort_order ASC, a.id ASC`,
      [userId, ...errorIds],
    )) as Array<{ eid: string | number; url: string }>
    for (const r of rows) {
      const id = String(r.eid)
      if (!map.has(id) && r.url) map.set(id, r.url)
    }
    return map
  }

  private stemPreviewOf(stemText: string | null | undefined) {
    if (!stemText) return null
    const oneLine = stemText.replace(/\s+/g, ' ').trim()
    if (!oneLine) return null
    return oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine
  }

  private toListView(
    eq: ErrorQuestion,
    subjectName: string | null = null,
    categoryName: string | null = null,
    stemImageUrl: string | null = null,
  ) {
    return {
      id: String(eq.id),
      subjectId: String(eq.subjectId),
      subjectName,
      categoryId: eq.categoryId ? String(eq.categoryId) : null,
      categoryName,
      occurredAt: eq.occurredAt,
      title: eq.title,
      stemPreview: this.stemPreviewOf(eq.stemText),
      hasStemImage: !!stemImageUrl,
      stemImageUrl,
      source: eq.source,
      difficulty: eq.difficulty,
      status: eq.status,
      nextReviewAt: eq.nextReviewAt,
      createdAt: eq.createdAt,
      updatedAt: eq.updatedAt,
      tags: (eq.tags || []).map((t) => ({
        id: String(t.id),
        name: t.name,
        color: t.color,
      })),
    }
  }
}
