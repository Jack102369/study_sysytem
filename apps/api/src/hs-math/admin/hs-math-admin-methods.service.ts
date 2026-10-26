import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CreateHsMathMethodDto,
  ListHsMathMethodsQueryDto,
  UpdateHsMathMethodDto,
} from '../dto/admin-method.dto'
import { HsMathMethod } from '../entities/hs-math-method.entity'
import { HsMathTrainItemMethod } from '../entities/hs-math-train-item-method.entity'
import { isHsMathDuplicateError } from '../util/db-error'
import { isMysqlNoSuchTableError } from '../util/hs-math-item-content-fingerprint'

@Injectable()
export class HsMathAdminMethodsService {
  constructor(
    @InjectRepository(HsMathMethod)
    private readonly methodsRepo: Repository<HsMathMethod>,
    @InjectRepository(HsMathTrainItemMethod)
    private readonly itemMethodRepo: Repository<HsMathTrainItemMethod>,
  ) {}

  async list(query: ListHsMathMethodsQueryDto) {
    try {
      const qb = this.methodsRepo
        .createQueryBuilder('m')
        .orderBy('m.sortOrder', 'ASC')
        .addOrderBy('m.id', 'ASC')
      if (query.activeOnly) {
        qb.andWhere('m.is_active = 1')
      }
      const rows = await qb.getMany()
      return { items: rows.map((r) => this.toView(r)) }
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '方法表尚未创建（MIGRATION_PENDING）。请先执行 CORE-1A 迁移。',
        )
      }
      throw e
    }
  }

  async create(dto: CreateHsMathMethodDto) {
    const entity = this.methodsRepo.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      summary: dto.summary?.trim() || null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive !== false,
    })
    try {
      return this.toView(await this.methodsRepo.save(entity))
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '方法表尚未创建（MIGRATION_PENDING）。请先执行 CORE-1A 迁移。',
        )
      }
      if (isHsMathDuplicateError(e)) {
        throw new ConflictException(`方法 code 已存在：${dto.code}`)
      }
      throw e
    }
  }

  async update(id: string, dto: UpdateHsMathMethodDto) {
    try {
      const row = await this.methodsRepo.findOne({ where: { id } })
      if (!row) throw new NotFoundException('方法不存在')
      // 禁止改 code（稳定指纹键）
      if (dto.name !== undefined) row.name = dto.name.trim()
      if (dto.summary !== undefined) {
        row.summary = dto.summary?.trim() || null
      }
      if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder
      if (dto.isActive !== undefined) row.isActive = Boolean(dto.isActive)
      return this.toView(await this.methodsRepo.save(row))
    } catch (e) {
      if (e instanceof NotFoundException) throw e
      if (isMysqlNoSuchTableError(e)) {
        throw new BadRequestException(
          '方法表尚未创建（MIGRATION_PENDING）。请先执行 CORE-1A 迁移。',
        )
      }
      throw e
    }
  }

  /** 硬删：仅当无题目引用 */
  async assertCanHardDelete(id: string) {
    const n = await this.itemMethodRepo.count({ where: { methodId: id } })
    if (n > 0) {
      throw new BadRequestException(
        '方法仍被题目引用，禁止硬删除；请改为停用 is_active=false',
      )
    }
  }

  private toView(row: HsMathMethod) {
    return {
      id: String(row.id),
      code: row.code,
      name: row.name,
      summary: row.summary,
      sortOrder: row.sortOrder,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
