import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CreateHsMathKnowledgePointDto,
  ListHsMathAdminKnowledgePointsQueryDto,
  UpdateHsMathKnowledgePointDto,
} from '../dto/knowledge-point.dto'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathKnowledgePoint } from '../entities/hs-math-knowledge-point.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { HsMathTrainItemKp } from '../entities/hs-math-train-item-kp.entity'
import { HsMathTrainItem } from '../entities/hs-math-train-item.entity'
import { isHsMathDuplicateError } from '../util/db-error'
import { assertValidKpParent } from '../util/kp-parent'

@Injectable()
export class HsMathAdminKnowledgeService {
  constructor(
    @InjectRepository(HsMathKnowledgePoint)
    private readonly kpRepo: Repository<HsMathKnowledgePoint>,
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
    @InjectRepository(HsMathTrainItemKp)
    private readonly itemKpRepo: Repository<HsMathTrainItemKp>,
    @InjectRepository(HsMathTrainItem)
    private readonly itemsRepo: Repository<HsMathTrainItem>,
  ) {}

  async list(query: ListHsMathAdminKnowledgePointsQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const qb = this.kpRepo.createQueryBuilder('kp')

    if (query.specialtyId) {
      qb.andWhere('kp.specialty_id = :sid', { sid: query.specialtyId })
    }
    if (query.categoryId) {
      qb.andWhere('kp.category_id = :cid', { cid: query.categoryId })
    }
    if (query.isActive !== undefined) {
      qb.andWhere('kp.is_active = :ia', { ia: query.isActive ? 1 : 0 })
    }
    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`
      qb.andWhere('(kp.code LIKE :q OR kp.name LIKE :q)', { q })
    }

    const sortBy = query.sortBy ?? 'sortOrder'
    const sortDir =
      (query.sortDir || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    const colMap: Record<string, string> = {
      sortOrder: 'kp.sort_order',
      code: 'kp.code',
      name: 'kp.name',
      updatedAt: 'kp.updated_at',
    }
    qb.orderBy(colMap[sortBy] || 'kp.sort_order', sortDir)
    qb.addOrderBy('kp.id', 'ASC')
    qb.skip((page - 1) * pageSize).take(pageSize)

    const [rows, total] = await qb.getManyAndCount()
    return {
      items: rows.map((r) => this.toAdminView(r)),
      total,
      page,
      pageSize,
    }
  }

  async getById(id: string) {
    const kp = await this.findOrFail(id)
    return this.toAdminView(kp)
  }

  async create(dto: CreateHsMathKnowledgePointDto) {
    await this.assertSpecialtyCategory(dto.specialtyId, dto.categoryId)
    const parentId =
      dto.parentId === undefined || dto.parentId === ''
        ? null
        : dto.parentId
    await assertValidKpParent(this.kpRepo, {
      kpId: null,
      parentId,
      specialtyId: dto.specialtyId,
    })

    const entity = this.kpRepo.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      specialtyId: dto.specialtyId,
      categoryId: dto.categoryId,
      parentId,
      summary: dto.summary?.trim() || null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    })
    try {
      return this.toAdminView(await this.kpRepo.save(entity))
    } catch (e) {
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(`知识点 code 已存在：${dto.code}`)
      }
      throw e
    }
  }

  async update(id: string, dto: UpdateHsMathKnowledgePointDto) {
    const entity = await this.findOrFail(id)

    const nextSpecialtyId = dto.specialtyId ?? entity.specialtyId
    const nextCategoryId = dto.categoryId ?? entity.categoryId
    const movingTaxonomy =
      nextSpecialtyId !== entity.specialtyId ||
      nextCategoryId !== entity.categoryId

    if (movingTaxonomy) {
      await this.assertCanMoveTaxonomy(entity)
      await this.assertSpecialtyCategory(nextSpecialtyId, nextCategoryId)
      entity.specialtyId = nextSpecialtyId
      entity.categoryId = nextCategoryId
    }

    if (dto.code !== undefined) entity.code = dto.code.trim()
    if (dto.name !== undefined) entity.name = dto.name.trim()
    if (dto.summary !== undefined) {
      entity.summary = dto.summary?.trim() || null
    }
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
    if (dto.isActive !== undefined) entity.isActive = dto.isActive

    if (dto.parentId !== undefined) {
      const parentId =
        dto.parentId === null || dto.parentId === '' ? null : dto.parentId
      await assertValidKpParent(this.kpRepo, {
        kpId: entity.id,
        parentId,
        specialtyId: entity.specialtyId,
      })
      entity.parentId = parentId
    } else if (movingTaxonomy && entity.parentId) {
      // 移动章节后父 KP 须仍同章
      await assertValidKpParent(this.kpRepo, {
        kpId: entity.id,
        parentId: entity.parentId,
        specialtyId: entity.specialtyId,
      })
    }

    try {
      return this.toAdminView(await this.kpRepo.save(entity))
    } catch (e) {
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(`知识点 code 已存在：${entity.code}`)
      }
      throw e
    }
  }

  private async assertCanMoveTaxonomy(entity: HsMathKnowledgePoint) {
    const childCount = await this.kpRepo.count({
      where: { parentId: entity.id },
    })
    if (childCount > 0) {
      throw new BadRequestException(
        '存在子知识点，禁止直接变更所属章节/小节',
      )
    }
    const linkCount = await this.itemKpRepo.count({
      where: { knowledgePointId: entity.id },
    })
    if (linkCount > 0) {
      throw new BadRequestException(
        '已有训练题关联该知识点，禁止变更所属章节/小节',
      )
    }
    const legacyCount = await this.itemsRepo.count({
      where: { knowledgePointId: entity.id },
    })
    if (legacyCount > 0) {
      throw new BadRequestException(
        '训练题仍引用该知识点（knowledge_point_id），禁止变更所属章节/小节',
      )
    }
  }

  private async assertSpecialtyCategory(
    specialtyId: string,
    categoryId: string,
  ) {
    const sp = await this.specialtiesRepo.findOne({
      where: { id: specialtyId },
    })
    if (!sp) throw new BadRequestException(`章节不存在：${specialtyId}`)
    const cat = await this.categoriesRepo.findOne({
      where: { id: categoryId },
    })
    if (!cat) throw new BadRequestException(`小节不存在：${categoryId}`)
    if (cat.specialtyId !== specialtyId) {
      throw new BadRequestException('小节不属于指定章节')
    }
  }

  private async findOrFail(id: string) {
    const kp = await this.kpRepo.findOne({ where: { id } })
    if (!kp) throw new NotFoundException('知识点不存在')
    return kp
  }

  private toAdminView(kp: HsMathKnowledgePoint) {
    return {
      id: kp.id,
      code: kp.code,
      name: kp.name,
      specialtyId: kp.specialtyId,
      categoryId: kp.categoryId,
      parentId: kp.parentId,
      summary: kp.summary,
      sortOrder: kp.sortOrder,
      isActive: kp.isActive,
      createdAt: kp.createdAt,
      updatedAt: kp.updatedAt,
    }
  }
}
