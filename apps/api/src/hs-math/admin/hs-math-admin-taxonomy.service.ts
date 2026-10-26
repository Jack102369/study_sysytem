import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CreateHsMathCategoryDto,
  ListHsMathAdminCategoriesQueryDto,
  UpdateHsMathCategoryDto,
} from '../dto/admin-category.dto'
import {
  CreateHsMathSpecialtyDto,
  UpdateHsMathSpecialtyDto,
} from '../dto/admin-specialty.dto'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { isHsMathDuplicateError } from '../util/db-error'

@Injectable()
export class HsMathAdminTaxonomyService {
  constructor(
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
  ) {}

  async listSpecialties() {
    const rows = await this.specialtiesRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return rows.map((s) => this.toSpecialtyView(s))
  }

  async createSpecialty(dto: CreateHsMathSpecialtyDto) {
    const entity = this.specialtiesRepo.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      bookCode: dto.bookCode ?? null,
      chapterNo: dto.chapterNo ?? null,
      intro: dto.intro ?? '',
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    })
    try {
      return this.toSpecialtyView(await this.specialtiesRepo.save(entity))
    } catch (e) {
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(`专项 code 已存在：${dto.code}`)
      }
      throw e
    }
  }

  async updateSpecialty(id: string, dto: UpdateHsMathSpecialtyDto) {
    const entity = await this.findSpecialtyOrFail(id)
    if (dto.code !== undefined) entity.code = dto.code.trim()
    if (dto.name !== undefined) entity.name = dto.name.trim()
    if (dto.bookCode !== undefined) entity.bookCode = dto.bookCode
    if (dto.chapterNo !== undefined) entity.chapterNo = dto.chapterNo
    if (dto.intro !== undefined) entity.intro = dto.intro
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
    if (dto.isActive !== undefined) entity.isActive = dto.isActive
    try {
      return this.toSpecialtyView(await this.specialtiesRepo.save(entity))
    } catch (e) {
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(`专项 code 已存在：${entity.code}`)
      }
      throw e
    }
  }

  async listCategories(query: ListHsMathAdminCategoriesQueryDto) {
    const where = query.specialtyId
      ? { specialtyId: query.specialtyId }
      : undefined
    const rows = await this.categoriesRepo.find({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return rows.map((c) => this.toCategoryView(c))
  }

  async createCategory(dto: CreateHsMathCategoryDto) {
    await this.findSpecialtyOrFail(dto.specialtyId)
    const entity = this.categoriesRepo.create({
      specialtyId: dto.specialtyId,
      code: dto.code.trim(),
      name: dto.name.trim(),
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    })
    try {
      return this.toCategoryView(await this.categoriesRepo.save(entity))
    } catch (e) {
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(
          `该专项下分类 code 已存在：${dto.code}`,
        )
      }
      throw e
    }
  }

  async updateCategory(id: string, dto: UpdateHsMathCategoryDto) {
    const entity = await this.findCategoryOrFail(id)
    if (dto.specialtyId !== undefined) {
      await this.findSpecialtyOrFail(dto.specialtyId)
      entity.specialtyId = dto.specialtyId
    }
    if (dto.code !== undefined) entity.code = dto.code.trim()
    if (dto.name !== undefined) entity.name = dto.name.trim()
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
    if (dto.isActive !== undefined) entity.isActive = dto.isActive
    try {
      return this.toCategoryView(await this.categoriesRepo.save(entity))
    } catch (e) {
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(
          `该专项下分类 code 已存在：${entity.code}`,
        )
      }
      throw e
    }
  }

  private async findSpecialtyOrFail(id: string) {
    const row = await this.specialtiesRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('专项不存在')
    return row
  }

  private async findCategoryOrFail(id: string) {
    const row = await this.categoriesRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('分类不存在')
    return row
  }

  private toSpecialtyView(s: HsMathSpecialty) {
    return {
      id: String(s.id),
      code: s.code,
      name: s.name,
      bookCode: s.bookCode,
      chapterNo: s.chapterNo,
      intro: s.intro,
      sortOrder: s.sortOrder,
      isActive: Boolean(s.isActive),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }
  }

  private toCategoryView(c: HsMathCategory) {
    return {
      id: String(c.id),
      specialtyId: String(c.specialtyId),
      code: c.code,
      name: c.name,
      sortOrder: c.sortOrder,
      isActive: Boolean(c.isActive),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }
  }
}
