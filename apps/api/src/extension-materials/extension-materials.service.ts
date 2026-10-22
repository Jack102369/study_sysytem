import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { ErrorCategoriesService } from '../error-categories/error-categories.service'
import { PointsService } from '../points/points.service'
import { SubjectsService } from '../subjects/subjects.service'
import {
  CreateExtensionMaterialDto,
  ListExtensionMaterialsQueryDto,
  UpdateExtensionMaterialDto,
} from './dto/extension-material.dto'
import { ExtensionMaterial } from './extension-material.entity'

@Injectable()
export class ExtensionMaterialsService {
  constructor(
    @InjectRepository(ExtensionMaterial)
    private readonly repo: Repository<ExtensionMaterial>,
    private readonly subjectsService: SubjectsService,
    private readonly categoriesService: ErrorCategoriesService,
    private readonly dataSource: DataSource,
    private readonly points: PointsService,
  ) {}

  async list(userId: string, query: ListExtensionMaterialsQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const qb = this.repo
      .createQueryBuilder('em')
      .where('em.user_id = :userId', { userId })

    if (query.subjectId) {
      qb.andWhere('em.subject_id = :subjectId', { subjectId: query.subjectId })
    }
    if (query.categoryId) {
      qb.andWhere('em.category_id = :categoryId', { categoryId: query.categoryId })
    }
    if (query.learnStatus) {
      qb.andWhere('em.learn_status = :learnStatus', { learnStatus: query.learnStatus })
    }

    const total = await qb.clone().getCount()
    const rows = await qb
      .orderBy('em.created_at', 'DESC')
      .addOrderBy('em.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()

    const subjectIds = [...new Set(rows.map((r) => String(r.subjectId)))]
    const categoryIds = [...new Set(rows.map((r) => String(r.categoryId)))]
    const attIds = rows
      .map((r) => (r.questionAttachmentId ? String(r.questionAttachmentId) : ''))
      .filter(Boolean)

    const [subjectMap, categoryMap, attMap] = await Promise.all([
      this.loadNames('subjects', userId, subjectIds),
      this.loadNames('error_categories', userId, categoryIds),
      this.loadAttachments(userId, attIds),
    ])

    return {
      items: rows.map((r) => {
        const att = r.questionAttachmentId
          ? attMap.get(String(r.questionAttachmentId))
          : undefined
        return this.toView(
          r,
          subjectMap.get(String(r.subjectId)) ?? null,
          categoryMap.get(String(r.categoryId)) ?? null,
          att?.url ?? null,
          att?.originalName ?? null,
        )
      }),
      total,
      page,
      pageSize,
    }
  }

  async create(userId: string, dto: CreateExtensionMaterialDto) {
    await this.subjectsService.findOwnedOrFail(userId, dto.subjectId)
    await this.categoriesService.findOwnedOrFail(userId, dto.categoryId)
    const questionAttachmentId = this.nullId(dto.questionAttachmentId)
    if (questionAttachmentId) {
      await this.assertOwnedAttachment(userId, questionAttachmentId)
    }

    const entity = this.repo.create({
      userId,
      subjectId: dto.subjectId,
      categoryId: dto.categoryId,
      title: dto.title ?? null,
      contentText: dto.contentText ?? null,
      answerText: dto.answerText ?? null,
      questionAttachmentId,
      fileName: dto.fileName?.trim() || null,
      learnStatus: dto.learnStatus ?? 'NOT_STARTED',
    })
    const saved = await this.repo.save(entity)
    await this.points.awardSafe(
      userId,
      'extension_create',
      String(saved.id),
      '延伸训练',
      'extension',
    )
    return this.detail(userId, String(saved.id))
  }

  async update(userId: string, id: string, dto: UpdateExtensionMaterialDto) {
    const entity = await this.repo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('延伸题不存在')

    if (dto.subjectId !== undefined) {
      await this.subjectsService.findOwnedOrFail(userId, dto.subjectId)
      entity.subjectId = dto.subjectId
    }
    if (dto.categoryId !== undefined) {
      await this.categoriesService.findOwnedOrFail(userId, dto.categoryId)
      entity.categoryId = dto.categoryId
    }
    if (dto.title !== undefined) entity.title = dto.title
    if (dto.contentText !== undefined) entity.contentText = dto.contentText
    if (dto.answerText !== undefined) entity.answerText = dto.answerText
    if (dto.questionAttachmentId !== undefined) {
      const questionAttachmentId = this.nullId(dto.questionAttachmentId)
      if (questionAttachmentId) {
        await this.assertOwnedAttachment(userId, questionAttachmentId)
      }
      entity.questionAttachmentId = questionAttachmentId
    }
    if (dto.fileName !== undefined) {
      entity.fileName = dto.fileName?.trim() || null
    }
    if (dto.learnStatus !== undefined) {
      entity.learnStatus = dto.learnStatus
    }

    await this.repo.save(entity)
    return this.detail(userId, id)
  }

  async remove(userId: string, id: string) {
    const entity = await this.repo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('延伸题不存在')
    await this.repo.remove(entity)
    return { id }
  }

  async detail(userId: string, id: string) {
    const entity = await this.repo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('延伸题不存在')
    const [subjectMap, categoryMap, attMap] = await Promise.all([
      this.loadNames('subjects', userId, [String(entity.subjectId)]),
      this.loadNames('error_categories', userId, [String(entity.categoryId)]),
      this.loadAttachments(
        userId,
        entity.questionAttachmentId ? [String(entity.questionAttachmentId)] : [],
      ),
    ])
    const att = entity.questionAttachmentId
      ? attMap.get(String(entity.questionAttachmentId))
      : undefined
    return this.toView(
      entity,
      subjectMap.get(String(entity.subjectId)) ?? null,
      categoryMap.get(String(entity.categoryId)) ?? null,
      att?.url ?? null,
      att?.originalName ?? null,
    )
  }

  private toView(
    row: ExtensionMaterial,
    subjectName: string | null,
    categoryName: string | null,
    questionAttachmentUrl: string | null,
    questionFileName: string | null,
  ) {
    const fallbackName = questionAttachmentUrl
      ? questionAttachmentUrl.split('/').pop() || null
      : null
    return {
      id: String(row.id),
      subjectId: String(row.subjectId),
      subjectName,
      categoryId: String(row.categoryId),
      categoryName,
      title: row.title,
      contentText: row.contentText,
      answerText: row.answerText,
      questionAttachmentId: row.questionAttachmentId
        ? String(row.questionAttachmentId)
        : null,
      questionAttachmentUrl,
      questionFileName: row.fileName || questionFileName || fallbackName,
      learnStatus: row.learnStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private nullId(value?: string | null) {
    if (value === undefined || value === null || value === '') return null
    return String(value)
  }

  private async loadNames(table: 'subjects' | 'error_categories', userId: string, ids: string[]) {
    const map = new Map<string, string>()
    const uniq = [...new Set(ids.filter(Boolean))]
    if (!uniq.length) return map
    const rows = (await this.dataSource.query(
      `SELECT id, name FROM ${table} WHERE user_id = ? AND id IN (${uniq.map(() => '?').join(',')})`,
      [userId, ...uniq],
    )) as Array<{ id: string | number; name: string }>
    for (const row of rows) map.set(String(row.id), row.name)
    return map
  }

  private async loadAttachments(userId: string, attachmentIds: string[]) {
    const map = new Map<string, { url: string; originalName: string | null }>()
    const ids = [...new Set(attachmentIds.filter(Boolean))]
    if (!ids.length) return map
    const rows = (await this.dataSource.query(
      `SELECT id, url, original_name AS originalName
       FROM attachments WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
      [userId, ...ids],
    )) as Array<{ id: string | number; url: string; originalName: string | null }>
    for (const row of rows) {
      map.set(String(row.id), {
        url: row.url,
        originalName: row.originalName ?? null,
      })
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
}
