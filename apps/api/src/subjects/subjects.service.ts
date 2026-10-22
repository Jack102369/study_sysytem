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
import { CreateSubjectDto } from './dto/create-subject.dto'
import { UpdateSubjectDto } from './dto/update-subject.dto'
import { Subject } from './subject.entity'

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectsRepo: Repository<Subject>,
  ) {}

  async list(userId: string, includeArchived?: string) {
    const where: { userId: string; isArchived?: boolean } = { userId }
    if (!parseIncludeArchived(includeArchived)) {
      where.isArchived = false
    }
    const rows = await this.subjectsRepo.find({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return rows.map((row) => this.toView(row))
  }

  async create(userId: string, dto: CreateSubjectDto) {
    const entity = this.subjectsRepo.create({
      userId,
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
      isArchived: false,
    })
    try {
      const saved = await this.subjectsRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('科目名称已存在')
      }
      throw error
    }
  }

  async update(userId: string, id: string, dto: UpdateSubjectDto) {
    const entity = await this.findOwnedOrFail(userId, id)
    if (dto.name !== undefined) entity.name = dto.name
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
    if (dto.isArchived !== undefined) entity.isArchived = dto.isArchived
    try {
      const saved = await this.subjectsRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('科目名称已存在')
      }
      throw error
    }
  }

  async findOwnedOrFail(userId: string, id: string) {
    const entity = await this.subjectsRepo.findOne({ where: { id, userId } })
    if (!entity) {
      throw new NotFoundException('科目不存在')
    }
    return entity
  }

  private toView(row: Subject) {
    return {
      id: String(row.id),
      name: row.name,
      sortOrder: row.sortOrder,
      isArchived: Boolean(row.isArchived),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
