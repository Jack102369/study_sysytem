import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemTrainItem } from '../train/entities/chem-train-item.entity'
import { ChemTrainItemLink } from '../train/entities/chem-train-item-link.entity'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'
import { KB_TABLE_BY_TYPE } from '../train/train.constants'

/**
 * 工业正式题 KB 关联的最小受控绑定（STEP_11）。
 * 不伪造知识点；仅允许绑定已 published 的知识实体；不放宽 eligibility。
 */
@Injectable()
export class IndustrialKbBindService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ChemTrainItem)
    private readonly itemsRepo: Repository<ChemTrainItem>,
    @InjectRepository(ChemTrainItemLink)
    private readonly linksRepo: Repository<ChemTrainItemLink>,
    @InjectRepository(ChemSpecialty)
    private readonly specsRepo: Repository<ChemSpecialty>,
  ) {}

  async bindPublishedKbLink(input: {
    trainItemId: string
    entityType: string
    entityId: string
    adminUserId: string
  }) {
    const item = await this.itemsRepo.findOne({ where: { id: input.trainItemId } })
    if (!item) throw new NotFoundException('TRAIN_ITEM_NOT_FOUND')

    const sp = await this.specsRepo.findOne({ where: { id: item.specialtyId } })
    if (!sp || sp.code !== INDUSTRIAL_SPECIALTY_CODE) {
      throw new BadRequestException('仅允许为工业实验题目绑定 KB')
    }

    const table = KB_TABLE_BY_TYPE[input.entityType]
    if (!table) throw new BadRequestException(`未知 entityType: ${input.entityType}`)
    if (!/^\d+$/.test(String(input.entityId))) {
      throw new BadRequestException('entityId 非法')
    }

    const rows = await this.dataSource.query(
      `SELECT id, status, review_note FROM ${table} WHERE id=? LIMIT 1`,
      [input.entityId],
    )
    const row = rows[0] as { id: string; status: string; review_note: string } | undefined
    if (!row) throw new NotFoundException('KB_ENTITY_NOT_FOUND')
    if (String(row.status) !== 'published') {
      throw new BadRequestException(
        `知识实体未 published（当前 ${row.status}）；禁止绑定未审核知识`,
      )
    }
    if (/\[verify:block\]/i.test(String(row.review_note || ''))) {
      throw new BadRequestException('知识实体标记 verify:block，禁止绑定')
    }

    const existing = await this.linksRepo.findOne({
      where: {
        itemId: item.id,
        entityType: input.entityType,
        entityId: String(input.entityId),
      },
    })
    if (existing) {
      return {
        ok: true,
        reused: true,
        linkId: existing.id,
        note: '关联已存在',
        boundBy: input.adminUserId,
      }
    }

    const saved = await this.linksRepo.save(
      this.linksRepo.create({
        itemId: item.id,
        entityType: input.entityType,
        entityId: String(input.entityId),
      }),
    )
    return {
      ok: true,
      reused: false,
      linkId: saved.id,
      note: '已绑定已发布知识实体；eligibility 仍按原规则校验',
      boundBy: input.adminUserId,
      source: 'admin_industrial_kb_bind',
    }
  }
}
