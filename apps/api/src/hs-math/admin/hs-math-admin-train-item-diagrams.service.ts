/**
 * DIAGRAM-1B：Admin 题干插图管理（上传/排序/删除）+ 升版门禁。
 * 表未迁移时：读返回空；写返回明确 MIGRATION_PENDING（不导致进程崩溃）。
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, In, Repository } from 'typeorm'
import { HsMathTrainItem } from '../entities/hs-math-train-item.entity'
import { HsMathTrainItemDiagram } from '../entities/hs-math-train-item-diagram.entity'
import { HsMathTrainItemDiagramObject } from '../entities/hs-math-train-item-diagram-object.entity'
import { HsMathTrainSessionItemDiagram } from '../entities/hs-math-train-session-item-diagram.entity'
import { HS_MATH_ITEM_DIAGRAM_MAX_PER_ITEM } from '../hs-math.constants'
import { isMysqlNoSuchTableError } from '../util/hs-math-item-content-fingerprint'
import { validateItemDiagramBuffer } from '../util/hs-math-item-diagram-security'
import {
  HsMathItemDiagramStorageError,
  readItemDiagramFile,
  writeItemDiagramFile,
} from '../util/hs-math-item-diagram-storage'

export type HsMathDiagramLinkView = {
  linkId: string
  objectId: string
  sortOrder: number
  altText: string | null
  contentSha256: string
  mimeType: string
  sizeBytes: number
  widthPx: number | null
  heightPx: number | null
  sanitizeStatus: string
}

@Injectable()
export class HsMathAdminTrainItemDiagramsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HsMathTrainItem)
    private readonly itemsRepo: Repository<HsMathTrainItem>,
    @InjectRepository(HsMathTrainItemDiagram)
    private readonly diagramsRepo: Repository<HsMathTrainItemDiagram>,
    @InjectRepository(HsMathTrainItemDiagramObject)
    private readonly objectsRepo: Repository<HsMathTrainItemDiagramObject>,
  ) {}

  private migrationPending(): never {
    throw new ServiceUnavailableException(
      '题干插图表尚未创建（MIGRATION_PENDING）。请先执行 db/migrate_hs_math_item_diagrams.sql 后再使用插图功能。',
    )
  }

  private handleTableError(e: unknown): never {
    if (isMysqlNoSuchTableError(e)) this.migrationPending()
    throw e
  }

  async listForItem(itemId: string): Promise<{
    itemId: string
    contentVersion: number
    status: string
    diagrams: HsMathDiagramLinkView[]
    migrationPending: boolean
  }> {
    const item = await this.itemsRepo.findOne({ where: { id: itemId } })
    if (!item) throw new NotFoundException('训练题不存在')
    try {
      const diagrams = await this.loadLinkViews(itemId)
      return {
        itemId: String(item.id),
        contentVersion: Number(item.contentVersion || 1),
        status: item.status,
        diagrams,
        migrationPending: false,
      }
    } catch (e) {
      if (isMysqlNoSuchTableError(e)) {
        return {
          itemId: String(item.id),
          contentVersion: Number(item.contentVersion || 1),
          status: item.status,
          diagrams: [],
          migrationPending: true,
        }
      }
      throw e
    }
  }

  async upload(
    userId: string,
    itemId: string,
    file?: Express.Multer.File,
    altText?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请上传插图文件')
    }
    const validated = validateItemDiagramBuffer(file.buffer, file.mimetype)
    if (!validated.ok) {
      throw new BadRequestException(validated.message)
    }

    try {
      writeItemDiagramFile(validated.contentSha256, validated.buffer)
    } catch (e) {
      if (e instanceof HsMathItemDiagramStorageError) {
        throw new BadRequestException(e.message)
      }
      throw e
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const item = await this.lockItem(manager, itemId)
        const linkRepo = manager.getRepository(HsMathTrainItemDiagram)
        const objRepo = manager.getRepository(HsMathTrainItemDiagramObject)

        const existingLinks = await linkRepo.find({
          where: { itemId: item.id },
          order: { sortOrder: 'ASC' },
        })
        if (existingLinks.length >= HS_MATH_ITEM_DIAGRAM_MAX_PER_ITEM) {
          throw new BadRequestException(
            `每题最多 ${HS_MATH_ITEM_DIAGRAM_MAX_PER_ITEM} 张插图`,
          )
        }

        let obj = await objRepo.findOne({
          where: { contentSha256: validated.contentSha256 },
        })
        if (!obj) {
          obj = objRepo.create({
            contentSha256: validated.contentSha256,
            storageKey: `hs-math/item-diagrams/${validated.contentSha256.slice(0, 2)}/${validated.contentSha256}.bin`,
            mimeType: validated.mime,
            sizeBytes: validated.sizeBytes,
            widthPx: validated.widthPx,
            heightPx: validated.heightPx,
            sanitizeStatus: validated.sanitizeStatus,
            sourceMimeType: validated.sourceMimeType,
            uploadedBy: userId,
          })
          obj = await objRepo.save(obj)
        }

        const used = new Set(existingLinks.map((l) => Number(l.sortOrder)))
        let sortOrder = 1
        while (used.has(sortOrder) && sortOrder <= HS_MATH_ITEM_DIAGRAM_MAX_PER_ITEM) {
          sortOrder++
        }
        if (sortOrder > HS_MATH_ITEM_DIAGRAM_MAX_PER_ITEM) {
          throw new BadRequestException('无可用插图序号')
        }

        const alt =
          altText === undefined || altText === null
            ? null
            : String(altText).trim().slice(0, 256) || null

        await linkRepo.save(
          linkRepo.create({
            itemId: item.id,
            objectId: obj.id,
            sortOrder,
            altText: alt,
          }),
        )

        this.bumpItemOnDiagramChange(item, userId)
        await manager.getRepository(HsMathTrainItem).save(item)

        return {
          itemId: String(item.id),
          contentVersion: Number(item.contentVersion),
          status: item.status,
          notice:
            '插图已变更：content_version 已升高；若曾 approved 已退回 draft，须重新 review 后再 approve。',
          diagrams: await this.loadLinkViews(item.id, manager),
        }
      })
    } catch (e) {
      this.handleTableError(e)
    }
  }

  async reorder(
    userId: string,
    itemId: string,
    orderedLinkIds: string[],
  ) {
    if (!Array.isArray(orderedLinkIds) || !orderedLinkIds.length) {
      throw new BadRequestException('orderedLinkIds 不能为空')
    }
    try {
      return await this.dataSource.transaction(async (manager) => {
        const item = await this.lockItem(manager, itemId)
        const linkRepo = manager.getRepository(HsMathTrainItemDiagram)
        const links = await linkRepo.find({ where: { itemId: item.id } })
        if (links.length !== orderedLinkIds.length) {
          throw new BadRequestException('排序列表须覆盖全部当前插图')
        }
        const map = new Map(links.map((l) => [String(l.id), l]))
        const seen = new Set<string>()
        for (let i = 0; i < orderedLinkIds.length; i++) {
          const id = String(orderedLinkIds[i])
          const row = map.get(id)
          if (!row || seen.has(id)) {
            throw new BadRequestException('orderedLinkIds 非法')
          }
          seen.add(id)
          row.sortOrder = i + 1
        }
        // 两阶段避免唯一键冲突
        for (const l of links) {
          l.sortOrder = Number(l.sortOrder) + 10
        }
        await linkRepo.save(links)
        for (let i = 0; i < orderedLinkIds.length; i++) {
          const row = map.get(String(orderedLinkIds[i]))!
          row.sortOrder = i + 1
        }
        await linkRepo.save([...map.values()])

        this.bumpItemOnDiagramChange(item, userId)
        await manager.getRepository(HsMathTrainItem).save(item)
        return {
          itemId: String(item.id),
          contentVersion: Number(item.contentVersion),
          status: item.status,
          notice: '插图顺序已变更并升版，须重新审核。',
          diagrams: await this.loadLinkViews(item.id, manager),
        }
      })
    } catch (e) {
      this.handleTableError(e)
    }
  }

  async replace(
    userId: string,
    itemId: string,
    linkId: string,
    file?: Express.Multer.File,
    altText?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请上传插图文件')
    }
    const validated = validateItemDiagramBuffer(file.buffer, file.mimetype)
    if (!validated.ok) {
      throw new BadRequestException(validated.message)
    }
    try {
      writeItemDiagramFile(validated.contentSha256, validated.buffer)
    } catch (e) {
      if (e instanceof HsMathItemDiagramStorageError) {
        throw new BadRequestException(e.message)
      }
      throw e
    }
    try {
      return await this.dataSource.transaction(async (manager) => {
        const item = await this.lockItem(manager, itemId)
        const linkRepo = manager.getRepository(HsMathTrainItemDiagram)
        const objRepo = manager.getRepository(HsMathTrainItemDiagramObject)
        const link = await linkRepo.findOne({
          where: { id: linkId, itemId: item.id },
        })
        if (!link) throw new NotFoundException('插图关联不存在')

        let obj = await objRepo.findOne({
          where: { contentSha256: validated.contentSha256 },
        })
        if (!obj) {
          obj = await objRepo.save(
            objRepo.create({
              contentSha256: validated.contentSha256,
              storageKey: `hs-math/item-diagrams/${validated.contentSha256.slice(0, 2)}/${validated.contentSha256}.bin`,
              mimeType: validated.mime,
              sizeBytes: validated.sizeBytes,
              widthPx: validated.widthPx,
              heightPx: validated.heightPx,
              sanitizeStatus: validated.sanitizeStatus,
              sourceMimeType: validated.sourceMimeType,
              uploadedBy: userId,
            }),
          )
        }
        link.objectId = obj.id
        if (altText !== undefined) {
          link.altText =
            altText === null
              ? null
              : String(altText).trim().slice(0, 256) || null
        }
        await linkRepo.save(link)
        this.bumpItemOnDiagramChange(item, userId)
        await manager.getRepository(HsMathTrainItem).save(item)
        return {
          itemId: String(item.id),
          contentVersion: Number(item.contentVersion),
          status: item.status,
          notice:
            '插图已替换并升版（旧对象保留供历史 session）；须重新 review 后再 approve。',
          diagrams: await this.loadLinkViews(item.id, manager),
        }
      })
    } catch (e) {
      this.handleTableError(e)
    }
  }

  async remove(userId: string, itemId: string, linkId: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const item = await this.lockItem(manager, itemId)
        const linkRepo = manager.getRepository(HsMathTrainItemDiagram)
        const link = await linkRepo.findOne({
          where: { id: linkId, itemId: item.id },
        })
        if (!link) throw new NotFoundException('插图关联不存在')
        await linkRepo.remove(link)

        // 对象若仍被题目或历史 session 引用则保留文件与行
        const stillLinked =
          (await linkRepo.count({ where: { objectId: link.objectId } })) > 0
        let hist = 0
        try {
          hist = await manager
            .getRepository(HsMathTrainSessionItemDiagram)
            .count({ where: { objectId: link.objectId } })
        } catch (e) {
          if (!isMysqlNoSuchTableError(e)) throw e
        }
        // 不物理删除对象行/文件（即使无引用也保留，避免误删；清理另授权）

        this.bumpItemOnDiagramChange(item, userId)
        await manager.getRepository(HsMathTrainItem).save(item)
        return {
          itemId: String(item.id),
          contentVersion: Number(item.contentVersion),
          status: item.status,
          objectRetained: true,
          objectStillReferenced: stillLinked || hist > 0,
          notice: '插图已解绑并升版；历史 session 快照不受影响。',
          diagrams: await this.loadLinkViews(item.id, manager),
        }
      })
    } catch (e) {
      this.handleTableError(e)
    }
  }

  async readContentForAdmin(itemId: string, linkId: string): Promise<{
    mimeType: string
    buffer: Buffer
  }> {
    try {
      const link = await this.diagramsRepo.findOne({
        where: { id: linkId, itemId },
      })
      if (!link) throw new NotFoundException('插图关联不存在')
      const obj = await this.objectsRepo.findOne({
        where: { id: link.objectId },
      })
      if (!obj) throw new NotFoundException('插图对象不存在')
      const buffer = readItemDiagramFile(obj.storageKey)
      return { mimeType: obj.mimeType, buffer }
    } catch (e) {
      if (e instanceof HsMathItemDiagramStorageError) {
        throw new NotFoundException('插图文件不可用')
      }
      this.handleTableError(e)
    }
  }

  private bumpItemOnDiagramChange(item: HsMathTrainItem, userId: string) {
    if (item.status === 'approved') {
      item.status = 'draft'
      item.isActive = true
      item.reviewedBy = null
      item.reviewedAt = null
    }
    item.contentVersion = (item.contentVersion || 1) + 1
    item.updatedBy = userId
  }

  private async lockItem(manager: EntityManager, itemId: string) {
    const item = await manager
      .getRepository(HsMathTrainItem)
      .createQueryBuilder('i')
      .setLock('pessimistic_write')
      .where('i.id = :id', { id: itemId })
      .getOne()
    if (!item) throw new NotFoundException('训练题不存在')
    return item
  }

  private async loadLinkViews(
    itemId: string,
    manager?: EntityManager,
  ): Promise<HsMathDiagramLinkView[]> {
    const linkRepo = manager
      ? manager.getRepository(HsMathTrainItemDiagram)
      : this.diagramsRepo
    const objRepo = manager
      ? manager.getRepository(HsMathTrainItemDiagramObject)
      : this.objectsRepo
    const links = await linkRepo.find({
      where: { itemId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    if (!links.length) return []
    const objs = await objRepo.find({
      where: { id: In(links.map((l) => l.objectId)) },
    })
    const map = new Map(objs.map((o) => [String(o.id), o]))
    return links.map((l) => {
      const o = map.get(String(l.objectId))
      return {
        linkId: String(l.id),
        objectId: String(l.objectId),
        sortOrder: Number(l.sortOrder),
        altText: l.altText,
        contentSha256: o?.contentSha256 || '',
        mimeType: o?.mimeType || '',
        sizeBytes: o?.sizeBytes || 0,
        widthPx: o?.widthPx ?? null,
        heightPx: o?.heightPx ?? null,
        sanitizeStatus: o?.sanitizeStatus || '',
      }
    })
  }
}
