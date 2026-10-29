import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChemTrainItemAsset } from '../train/entities/chem-train-item-asset.entity'
import {
  INDUSTRIAL_SVG_SESSION_CONTRACT,
  type IndustrialSafeAssetDto,
} from './industrial-svg-asset.service'

function toSafeDto(row: ChemTrainItemAsset): IndustrialSafeAssetDto {
  return {
    assetType: row.assetType,
    assetRole: row.assetRole,
    contentHash: row.contentHash,
    diagramVersion: row.diagramVersion,
    mimeType: row.mimeType,
    sortOrder: row.sortOrder,
    resourceKey: row.contentHash,
    safeResourceUrl: `/chemistry/admin/industrial-candidates/svg/${row.contentHash}`,
  }
}

/**
 * 正式题图资源查询（STEP_09 基础设施；学生会话加载待 STEP_10）。
 * 不返回服务器绝对路径、审核备注、标准答案。
 */
@Injectable()
export class IndustrialItemAssetQueryService {
  constructor(
    @InjectRepository(ChemTrainItemAsset)
    private readonly assetsRepo: Repository<ChemTrainItemAsset>,
  ) {}

  async listByTrainItemId(trainItemId: string): Promise<IndustrialSafeAssetDto[]> {
    if (!/^\d+$/.test(String(trainItemId))) return []
    const rows = await this.assetsRepo.find({
      where: { trainItemId: String(trainItemId) },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return rows.map(toSafeDto)
  }

  async findByContentHash(contentHash: string): Promise<IndustrialSafeAssetDto[]> {
    if (!/^[a-f0-9]{64}$/.test(contentHash)) return []
    const rows = await this.assetsRepo.find({
      where: { contentHash },
      order: { trainItemId: 'ASC', sortOrder: 'ASC' },
    })
    return rows.map(toSafeDto)
  }

  sessionContract() {
    return INDUSTRIAL_SVG_SESSION_CONTRACT
  }
}
