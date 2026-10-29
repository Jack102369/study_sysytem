import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { createHash } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { DataSource, EntityManager, In, Repository } from 'typeorm'
import { ChemTrainItem } from './entities/chem-train-item.entity'
import { ChemTrainItemAsset } from './entities/chem-train-item-asset.entity'
import { ChemTrainSession } from './entities/chem-train-session.entity'
import { ChemTrainSessionItem } from './entities/chem-train-session-item.entity'
import { ChemTrainSessionItemAsset } from './entities/chem-train-session-item-asset.entity'
import {
  hashSvgContent,
  resolveUploadsRoot,
} from '../industrial/industrial-svg-asset.service'
import { INDUSTRIAL_SVG_STORAGE_SUBDIR } from '../industrial/industrial-asset.constants'
import { assertSafeIndustrialSvgStoragePath } from '../industrial/industrial-svg-security'
import { assertChemIndustrialExperimentEnabled } from '../industrial/industrial-feature.config'

export type SessionDiagramAssetDto = {
  id: string
  assetType: string
  assetRole: string
  contentHash: string
  mimeType: string
  diagramVersion: string
  sortOrder: number
}

/**
 * 训练会话工业图快照与受控读取（STEP_10）。
 * 不新建平行会话系统；挂接现有 chem_train_sessions / session_items。
 */
@Injectable()
export class ChemTrainSessionDiagramService {
  private readonly logger = new Logger(ChemTrainSessionDiagramService.name)

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ChemTrainItemAsset)
    private readonly itemAssetsRepo: Repository<ChemTrainItemAsset>,
    @InjectRepository(ChemTrainSessionItemAsset)
    private readonly sessionAssetsRepo: Repository<ChemTrainSessionItemAsset>,
    @InjectRepository(ChemTrainSession)
    private readonly sessionsRepo: Repository<ChemTrainSession>,
    @InjectRepository(ChemTrainSessionItem)
    private readonly sessionItemsRepo: Repository<ChemTrainSessionItem>,
  ) {}

  /**
   * 排除「声明有工业图但文件缺失/哈希不符」的题目。
   * 无图题原样保留；有图且资源完好保留。
   */
  async filterOutBrokenDiagramItems(items: ChemTrainItem[]): Promise<{
    ok: ChemTrainItem[]
    skippedBroken: Array<{ itemId: string; code: string; reason: string }>
  }> {
    const skippedBroken: Array<{ itemId: string; code: string; reason: string }> =
      []
    if (!items.length) return { ok: [], skippedBroken }

    const ids = items.map((i) => i.id)
    const assets = await this.itemAssetsRepo.find({
      where: { trainItemId: In(ids) },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    const byItem = new Map<string, ChemTrainItemAsset[]>()
    for (const a of assets) {
      const list = byItem.get(a.trainItemId) || []
      list.push(a)
      byItem.set(a.trainItemId, list)
    }

    const ok: ChemTrainItem[] = []
    for (const item of items) {
      const list = byItem.get(item.id) || []
      if (!list.length) {
        ok.push(item)
        continue
      }
      const err = this.validateAssetFiles(list)
      if (err) {
        skippedBroken.push({ itemId: item.id, code: item.code, reason: err })
        this.logger.warn(
          `排除工业图异常题目 ${item.code}: ${err}`,
        )
        continue
      }
      ok.push(item)
    }
    return { ok, skippedBroken }
  }

  private validateAssetFiles(assets: ChemTrainItemAsset[]): string | null {
    for (const a of assets) {
      try {
        assertSafeIndustrialSvgStoragePath(a.contentHash, a.storagePath)
      } catch (e) {
        return String((e as Error).message || e)
      }
      if (a.mimeType !== 'image/svg+xml') {
        return `MIME_NOT_SVG:${a.mimeType}`
      }
      const abs = join(
        resolveUploadsRoot(),
        INDUSTRIAL_SVG_STORAGE_SUBDIR,
        `${a.contentHash}.svg`,
      )
      if (!existsSync(abs)) {
        return `SVG_FILE_MISSING:${a.contentHash.slice(0, 12)}`
      }
      const bytes = readFileSync(abs, 'utf8')
      const h = hashSvgContent(bytes)
      if (h !== a.contentHash) {
        return `SVG_HASH_MISMATCH:${a.contentHash.slice(0, 12)}`
      }
    }
    return null
  }

  /** 在已有 EntityManager 事务内写入某 session_item 的图形快照（可多图） */
  async writeSnapshotsInTx(
    manager: EntityManager,
    sessionItemId: string,
    trainItemId: string | null,
  ): Promise<number> {
    if (!trainItemId) return 0
    const assets = await manager.find(ChemTrainItemAsset, {
      where: { trainItemId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    if (!assets.length) return 0
    const err = this.validateAssetFiles(assets)
    if (err) {
      throw new Error(`DIAGRAM_SNAPSHOT_FAILED:${err}`)
    }
    for (const a of assets) {
      const row = manager.create(ChemTrainSessionItemAsset, {
        sessionItemId,
        sourceItemAssetId: a.id,
        assetType: a.assetType,
        assetRole: a.assetRole,
        contentHash: a.contentHash,
        mimeType: a.mimeType,
        diagramVersion: a.diagramVersion,
        sortOrder: a.sortOrder,
      })
      await manager.save(row)
    }
    return assets.length
  }

  /**
   * 对已保存的 session_items 补写快照（daily/advanced/wrong 路径）。
   * 失败抛错；调用方应回滚/删除会话。
   */
  async snapshotForSavedItems(sessionItems: ChemTrainSessionItem[]): Promise<void> {
    if (!sessionItems.length) return
    await this.dataSource.transaction(async (manager) => {
      for (const si of sessionItems) {
        await this.writeSnapshotsInTx(manager, si.id, si.itemId)
      }
    })
  }

  async mapSnapshotsBySessionItemIds(
    sessionItemIds: string[],
  ): Promise<Map<string, SessionDiagramAssetDto[]>> {
    const map = new Map<string, SessionDiagramAssetDto[]>()
    if (!sessionItemIds.length) return map
    const rows = await this.sessionAssetsRepo.find({
      where: { sessionItemId: In(sessionItemIds) },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    for (const r of rows) {
      const dto: SessionDiagramAssetDto = {
        id: r.id,
        assetType: r.assetType,
        assetRole: r.assetRole,
        contentHash: r.contentHash,
        mimeType: r.mimeType,
        diagramVersion: r.diagramVersion,
        sortOrder: r.sortOrder,
      }
      const list = map.get(r.sessionItemId) || []
      list.push(dto)
      map.set(r.sessionItemId, list)
    }
    return map
  }

  /**
   * 会话级授权读取不可变 SVG。
   * 校验：用户拥有会话 + snapshot 属于该 session_item + 文件哈希一致。
   */
  async readAuthorizedSvg(
    userId: string,
    sessionId: string,
    sessionItemId: string,
    snapshotAssetId: string,
  ): Promise<{ svg: string; contentHash: string; mimeType: string }> {
    if (!/^\d+$/.test(sessionId) || !/^\d+$/.test(sessionItemId) || !/^\d+$/.test(snapshotAssetId)) {
      throw new NotFoundException('RESOURCE_NOT_FOUND')
    }
    const session = await this.sessionsRepo.findOne({ where: { id: sessionId } })
    if (!session || String(session.userId) !== String(userId)) {
      throw new ForbiddenException('SESSION_FORBIDDEN')
    }
    const item = await this.sessionItemsRepo.findOne({
      where: { id: sessionItemId, sessionId },
    })
    if (!item) throw new NotFoundException('SESSION_ITEM_NOT_FOUND')

    const snap = await this.sessionAssetsRepo.findOne({
      where: { id: snapshotAssetId, sessionItemId },
    })
    if (!snap) throw new NotFoundException('SNAPSHOT_ASSET_NOT_FOUND')
    if (snap.mimeType !== 'image/svg+xml') {
      throw new ForbiddenException('MIME_NOT_ALLOWED')
    }
    // 工业模块停用：历史数据保留，但工业 SVG 受控读取关闭
    assertChemIndustrialExperimentEnabled()

    const relativePath = `${INDUSTRIAL_SVG_STORAGE_SUBDIR}/${snap.contentHash}.svg`
    assertSafeIndustrialSvgStoragePath(snap.contentHash, relativePath)
    const abs = join(resolveUploadsRoot(), INDUSTRIAL_SVG_STORAGE_SUBDIR, `${snap.contentHash}.svg`)
    if (!existsSync(abs)) {
      throw new NotFoundException('SVG_FILE_MISSING')
    }
    const svg = readFileSync(abs, 'utf8')
    const h = createHash('sha256').update(svg, 'utf8').digest('hex')
    if (h !== snap.contentHash) {
      throw new ForbiddenException('SVG_HASH_MISMATCH')
    }
    return { svg, contentHash: snap.contentHash, mimeType: snap.mimeType }
  }
}
