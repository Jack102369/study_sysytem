import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { isDuplicateEntryError } from '../common/utils/db.util'
import { CreateTagDto } from './dto/create-tag.dto'
import { UpdateTagDto } from './dto/update-tag.dto'
import { Tag } from './tag.entity'

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
    private readonly dataSource: DataSource,
  ) {}

  async list(userId: string) {
    const rows = await this.tagsRepo.find({
      where: { userId },
      order: { id: 'ASC' },
    })
    return rows.map((row) => this.toView(row))
  }

  async create(userId: string, dto: CreateTagDto) {
    const entity = this.tagsRepo.create({
      userId,
      name: dto.name,
      color: dto.color ?? null,
    })
    try {
      const saved = await this.tagsRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('标签名称已存在')
      }
      throw error
    }
  }

  async update(userId: string, id: string, dto: UpdateTagDto) {
    const entity = await this.findOwnedOrFail(userId, id)
    if (dto.name !== undefined) entity.name = dto.name
    if (dto.color !== undefined) entity.color = dto.color
    try {
      const saved = await this.tagsRepo.save(entity)
      return this.toView(saved)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('标签名称已存在')
      }
      throw error
    }
  }

  async remove(userId: string, id: string) {
    await this.findOwnedOrFail(userId, id)

    const refs = await this.dataSource.query(
      `SELECT
         (SELECT COUNT(*) FROM error_question_tags WHERE tag_id = ?) AS eq_cnt,
         (SELECT COUNT(*) FROM assessment_tags WHERE tag_id = ?) AS as_cnt`,
      [id, id],
    )
    const eqCnt = Number(refs?.[0]?.eq_cnt ?? 0)
    const asCnt = Number(refs?.[0]?.as_cnt ?? 0)
    if (eqCnt > 0 || asCnt > 0) {
      throw new ConflictException('标签已被引用，无法删除')
    }

    await this.tagsRepo.delete({ id, userId })
    return { id }
  }

  private async findOwnedOrFail(userId: string, id: string) {
    const entity = await this.tagsRepo.findOne({ where: { id, userId } })
    if (!entity) {
      throw new NotFoundException('标签不存在')
    }
    return entity
  }

  private toView(row: Tag) {
    return {
      id: String(row.id),
      name: row.name,
      color: row.color,
      createdAt: row.createdAt,
    }
  }
}
