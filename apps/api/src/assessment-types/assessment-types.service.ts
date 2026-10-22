import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  isDuplicateEntryError,
  parseIncludeArchived,
} from '../common/utils/db.util'
import { AssessmentType } from './assessment-type.entity'
import { CreateAssessmentTypeDto } from './dto/create-assessment-type.dto'
import { UpdateAssessmentTypeDto } from './dto/update-assessment-type.dto'

@Injectable()
export class AssessmentTypesService {
  constructor(
    @InjectRepository(AssessmentType)
    private readonly typesRepo: Repository<AssessmentType>,
  ) {}

  async list(userId: string, includeArchived?: string) {
    const where: { userId: string; isArchived?: boolean } = { userId }
    if (!parseIncludeArchived(includeArchived)) {
      where.isArchived = false
    }
    const rows = await this.typesRepo.find({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return rows.map((row) => this.toView(row))
  }

  async create(userId: string, dto: CreateAssessmentTypeDto) {
    const entity = this.typesRepo.create({
      userId,
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
      isArchived: false,
    })
    try {
      const saved = await this.typesRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('考试类型名称已存在')
      }
      throw error
    }
  }

  async update(userId: string, id: string, dto: UpdateAssessmentTypeDto) {
    const entity = await this.findOwnedOrFail(userId, id)
    if (dto.name !== undefined) entity.name = dto.name
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
    if (dto.isArchived !== undefined) entity.isArchived = dto.isArchived
    try {
      const saved = await this.typesRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('考试类型名称已存在')
      }
      throw error
    }
  }

  private async findOwnedOrFail(userId: string, id: string) {
    const entity = await this.typesRepo.findOne({ where: { id, userId } })
    if (!entity) {
      throw new NotFoundException('考试类型不存在')
    }
    return entity
  }

  private toView(row: AssessmentType) {
    return {
      id: String(row.id),
      name: row.name,
      sortOrder: row.sortOrder,
      isArchived: Boolean(row.isArchived),
      createdAt: row.createdAt,
    }
  }
}
