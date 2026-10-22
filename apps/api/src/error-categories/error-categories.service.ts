import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SPECIAL_EXTENSION_CATEGORY_NAME } from '../common/constants/biz'
import {
  isDuplicateEntryError,
  parseIncludeArchived,
} from '../common/utils/db.util'
import { SubjectsService } from '../subjects/subjects.service'
import { CreateErrorCategoryDto } from './dto/create-error-category.dto'
import { UpdateErrorCategoryDto } from './dto/update-error-category.dto'
import { ErrorCategory } from './error-category.entity'

@Injectable()
export class ErrorCategoriesService {
  constructor(
    @InjectRepository(ErrorCategory)
    private readonly categoriesRepo: Repository<ErrorCategory>,
    private readonly subjectsService: SubjectsService,
  ) {}

  async list(
    userId: string,
    subjectId?: string,
    includeArchived?: string,
    includeGlobal?: string,
  ) {
    const qb = this.categoriesRepo
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId })
      .orderBy('c.sort_order', 'ASC')
      .addOrderBy('c.id', 'ASC')

    if (!parseIncludeArchived(includeArchived)) {
      qb.andWhere('c.is_archived = 0')
    }
    if (subjectId) {
      if (parseIncludeArchived(includeGlobal)) {
        qb.andWhere('(c.subject_id = :subjectId OR c.subject_id IS NULL)', { subjectId })
      } else {
        qb.andWhere('c.subject_id = :subjectId', { subjectId })
      }
    }

    const rows = await qb.getMany()
    return rows.map((row) => this.toView(row))
  }

  /** 确保延伸训练特殊分类「月考模拟卷」存在（全局，不挂科目） */
  async ensureSpecialExtensionCategory(userId: string) {
    const name = SPECIAL_EXTENSION_CATEGORY_NAME
    let entity = await this.categoriesRepo
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.name = :name', { name })
      .andWhere('c.subject_id IS NULL')
      .getOne()

    if (!entity) {
      try {
        entity = await this.categoriesRepo.save(
          this.categoriesRepo.create({
            userId,
            name,
            subjectId: null,
            parentId: null,
            sortOrder: -10,
            isArchived: false,
          }),
        )
      } catch (error) {
        if (!isDuplicateEntryError(error)) throw error
        entity = await this.categoriesRepo
          .createQueryBuilder('c')
          .where('c.user_id = :userId', { userId })
          .andWhere('c.name = :name', { name })
          .andWhere('c.subject_id IS NULL')
          .getOne()
      }
    }
    if (!entity) throw new NotFoundException('特殊分类创建失败')
    return this.toView(entity)
  }

  async create(userId: string, dto: CreateErrorCategoryDto) {
    const subjectId = this.normalizeNullableId(dto.subjectId)
    const parentId = this.normalizeNullableId(dto.parentId)
    await this.assertSubjectOptional(userId, subjectId)
    await this.assertParentOptional(userId, parentId)

    const entity = this.categoriesRepo.create({
      userId,
      name: dto.name,
      subjectId,
      parentId,
      sortOrder: dto.sortOrder ?? 0,
      isArchived: false,
    })

    try {
      const saved = await this.categoriesRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('分类名称已存在')
      }
      throw error
    }
  }

  async update(userId: string, id: string, dto: UpdateErrorCategoryDto) {
    const entity = await this.findOwnedOrFail(userId, id)

    if (dto.name !== undefined) entity.name = dto.name
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
    if (dto.isArchived !== undefined) entity.isArchived = dto.isArchived

    if (dto.subjectId !== undefined) {
      const subjectId = this.normalizeNullableId(dto.subjectId)
      await this.assertSubjectOptional(userId, subjectId)
      entity.subjectId = subjectId
    }
    if (dto.parentId !== undefined) {
      const parentId = this.normalizeNullableId(dto.parentId)
      if (parentId && parentId === id) {
        throw new BadRequestException('父分类不能是自己')
      }
      await this.assertParentOptional(userId, parentId)
      entity.parentId = parentId
    }

    try {
      const saved = await this.categoriesRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('分类名称已存在')
      }
      throw error
    }
  }

  async findOwnedOrFail(userId: string, id: string) {
    const entity = await this.categoriesRepo.findOne({ where: { id, userId } })
    if (!entity) {
      throw new NotFoundException('分类不存在')
    }
    return entity
  }

  private async assertSubjectOptional(userId: string, subjectId: string | null) {
    if (!subjectId) return
    await this.subjectsService.findOwnedOrFail(userId, subjectId)
  }

  private async assertParentOptional(userId: string, parentId: string | null) {
    if (!parentId) return
    await this.findOwnedOrFail(userId, parentId)
  }

  private normalizeNullableId(value?: string | null): string | null {
    if (value === undefined || value === null || value === '') return null
    return String(value)
  }

  private toView(row: ErrorCategory) {
    return {
      id: String(row.id),
      name: row.name,
      subjectId: row.subjectId ? String(row.subjectId) : null,
      parentId: row.parentId ? String(row.parentId) : null,
      sortOrder: row.sortOrder,
      isArchived: Boolean(row.isArchived),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
