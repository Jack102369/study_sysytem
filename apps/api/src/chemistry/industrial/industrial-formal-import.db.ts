import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { ChemCategory } from '../chem-category.entity'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemTrainItem } from '../train/entities/chem-train-item.entity'
import { ChemTrainItemAsset } from '../train/entities/chem-train-item-asset.entity'
import type {
  IndustrialFormalImportAssetSpec,
  IndustrialFormalImportDbPayload,
  IndustrialFormalImportDbWriteResult,
} from './industrial-formal-import.service'
import { assertSafeIndustrialSvgStoragePath } from './industrial-svg-security'

function primaryAssetSpec(
  payload: IndustrialFormalImportDbPayload,
): IndustrialFormalImportAssetSpec {
  return {
    svgContentHash: payload.svgContentHash,
    svgRelativePath: payload.svgRelativePath,
    svgFileSize: payload.svgFileSize,
    diagramVersion: payload.diagramVersion,
    assetType: payload.assetType,
    assetRole: payload.assetRole,
    sortOrder: payload.sortOrder,
    mimeType: payload.mimeType,
  }
}

function allAssetSpecs(
  payload: IndustrialFormalImportDbPayload,
): IndustrialFormalImportAssetSpec[] {
  return [primaryAssetSpec(payload), ...(payload.additionalAssets || [])]
}

/**
 * D043 正式入库 DB 写入：事务内创建 chem_train_items + 一条或多条 chem_train_item_assets。
 * 文件系统 SVG 须在事务前已落盘；事务失败允许留下未引用哈希文件（本步不做 GC）。
 */
@Injectable()
export class IndustrialFormalImportDbService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ChemTrainItem)
    private readonly itemsRepo: Repository<ChemTrainItem>,
    @InjectRepository(ChemTrainItemAsset)
    private readonly assetsRepo: Repository<ChemTrainItemAsset>,
    @InjectRepository(ChemSpecialty)
    private readonly specsRepo: Repository<ChemSpecialty>,
    @InjectRepository(ChemCategory)
    private readonly catsRepo: Repository<ChemCategory>,
  ) {}

  async writeFormalItemWithAsset(
    payload: IndustrialFormalImportDbPayload,
  ): Promise<IndustrialFormalImportDbWriteResult> {
    const specs = allAssetSpecs(payload)
    for (const s of specs) {
      assertSafeIndustrialSvgStoragePath(s.svgContentHash, s.svgRelativePath)
    }

    const existing = await this.itemsRepo.findOne({ where: { code: payload.code } })
    if (existing) {
      const assetIds: string[] = []
      let allPresent = true
      for (const s of specs) {
        const asset = await this.assetsRepo.findOne({
          where: {
            trainItemId: existing.id,
            assetType: s.assetType,
            assetRole: s.assetRole,
            contentHash: s.svgContentHash,
          },
        })
        if (asset) {
          assetIds.push(asset.id)
        } else {
          allPresent = false
          break
        }
      }
      if (allPresent && assetIds.length === specs.length) {
        return {
          id: existing.id,
          code: existing.code,
          assetId: assetIds[0],
          assetIds,
          reusedExisting: true,
        }
      }
      // 题目已存在但缺资产：补绑（同事务，多图）
      const filled = await this.dataSource.transaction(async (manager) => {
        const ids: string[] = []
        for (const s of specs) {
          const found = await manager.findOne(ChemTrainItemAsset, {
            where: {
              trainItemId: existing.id,
              assetType: s.assetType,
              assetRole: s.assetRole,
              contentHash: s.svgContentHash,
            },
          })
          if (found) {
            ids.push(found.id)
            continue
          }
          const row = manager.create(ChemTrainItemAsset, {
            trainItemId: existing.id,
            assetType: s.assetType,
            assetRole: s.assetRole,
            contentHash: s.svgContentHash,
            storagePath: s.svgRelativePath,
            mimeType: s.mimeType,
            fileSize: s.svgFileSize,
            diagramVersion: s.diagramVersion,
            sortOrder: s.sortOrder,
          })
          const saved = await manager.save(row)
          ids.push(saved.id)
        }
        return ids
      })
      return {
        id: existing.id,
        code: existing.code,
        assetId: filled[0],
        assetIds: filled,
        reusedExisting: true,
      }
    }

    const specialty = await this.specsRepo.findOne({
      where: { code: payload.specialtyCode },
    })
    if (!specialty) {
      throw new Error(`SPECIALTY_NOT_FOUND: ${payload.specialtyCode}`)
    }
    const category = await this.catsRepo.findOne({
      where: { code: payload.categoryCode, specialtyId: specialty.id },
    })
    if (!category) {
      throw new Error(`CATEGORY_NOT_FOUND: ${payload.categoryCode}`)
    }

    return this.dataSource.transaction(async (manager) => {
      const raced = await manager.findOne(ChemTrainItem, {
        where: { code: payload.code },
      })
      if (raced) {
        const ids: string[] = []
        for (const s of specs) {
          const asset = await manager.findOne(ChemTrainItemAsset, {
            where: {
              trainItemId: raced.id,
              assetType: s.assetType,
              assetRole: s.assetRole,
              contentHash: s.svgContentHash,
            },
          })
          if (!asset) {
            throw new Error('IMPORT_RACE: item exists without matching asset')
          }
          ids.push(asset.id)
        }
        return {
          id: raced.id,
          code: raced.code,
          assetId: ids[0],
          assetIds: ids,
          reusedExisting: true,
        }
      }

      const item = manager.create(ChemTrainItem, {
        code: payload.code,
        pool: payload.pool,
        qtype: payload.qtype as ChemTrainItem['qtype'],
        answerType: payload.answerType,
        stem: payload.stem,
        optionsJson: payload.optionsJson,
        answer: payload.answer,
        answerAliasesJson: null,
        analysis: payload.analysis,
        difficulty: payload.difficulty,
        specialtyId: specialty.id,
        categoryId: category.id,
        status: payload.status,
        isActive: true,
        curriculumOk: payload.curriculumOk,
        verifyBlocked: payload.verifyBlocked,
        banDefaultTrain: payload.banDefaultTrain,
        gateNote: payload.gateNote,
        createdBy: payload.reviewedBy,
        updatedBy: payload.reviewedBy,
        reviewedBy: payload.reviewedBy,
        reviewedAt: new Date(),
      })
      const savedItem = await manager.save(item)

      const assetIds: string[] = []
      for (const s of specs) {
        const asset = manager.create(ChemTrainItemAsset, {
          trainItemId: savedItem.id,
          assetType: s.assetType,
          assetRole: s.assetRole,
          contentHash: s.svgContentHash,
          storagePath: s.svgRelativePath,
          mimeType: s.mimeType,
          fileSize: s.svgFileSize,
          diagramVersion: s.diagramVersion,
          sortOrder: s.sortOrder,
        })
        const savedAsset = await manager.save(asset)
        assetIds.push(savedAsset.id)
      }
      return {
        id: savedItem.id,
        code: savedItem.code,
        assetId: assetIds[0],
        assetIds,
        reusedExisting: false,
      }
    })
  }
}
