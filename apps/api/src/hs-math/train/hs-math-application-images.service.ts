/**
 * APPLICATION-2B：应用题解答图片上传 / 列表 / 鉴权读取 / draft 删除。
 * 不调用 AI；ADMIN 不自动越权。
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { HsMathTrainSession } from '../entities/hs-math-train-session.entity'
import { HsMathTrainSessionItem } from '../entities/hs-math-train-session-item.entity'
import { HsMathTrainSessionItemImage } from '../entities/hs-math-train-session-item-image.entity'
import { HS_MATH_APPLICATION_IMAGE_MAX_BYTES } from '../hs-math.constants'
import { validateApplicationImageBuffer } from '../util/hs-math-application-image-security'
import {
  assertImageOwnershipMatches,
  canDeleteApplicationImage,
  canUploadApplicationImage,
  isImageIdReferencedInUserAnswer,
  nextImageSortOrder,
  toSessionImagePublicView,
  type HsMathSessionImagePublicView,
} from '../util/hs-math-application-image-policy'
import {
  deleteApplicationImageFile,
  HsMathApplicationImageStorageError,
  readApplicationImageFile,
  writeApplicationImageFile,
} from '../util/hs-math-application-image-storage'

@Injectable()
export class HsMathApplicationImagesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HsMathTrainSession)
    private readonly sessionsRepo: Repository<HsMathTrainSession>,
    @InjectRepository(HsMathTrainSessionItem)
    private readonly sessionItemsRepo: Repository<HsMathTrainSessionItem>,
    @InjectRepository(HsMathTrainSessionItemImage)
    private readonly imagesRepo: Repository<HsMathTrainSessionItemImage>,
  ) {}

  async upload(
    userId: string,
    sessionId: string,
    sessionItemId: string,
    file?: Express.Multer.File,
  ): Promise<HsMathSessionImagePublicView> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请上传图片文件')
    }
    if (file.size > HS_MATH_APPLICATION_IMAGE_MAX_BYTES) {
      throw new BadRequestException(
        `单张图片不能超过 ${HS_MATH_APPLICATION_IMAGE_MAX_BYTES} 字节`,
      )
    }

    const validated = validateApplicationImageBuffer(
      file.buffer,
      file.mimetype,
    )
    if (!validated.ok) {
      throw new BadRequestException(validated.message)
    }

    let writtenKey: string | null = null

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const { session, item } = await this.lockOwnedSessionAndItem(
          manager,
          userId,
          sessionId,
          sessionItemId,
        )

        const imgRepo = manager.getRepository(HsMathTrainSessionItemImage)
        // 已持有 session + session_item 行锁 → 同题并发上传串行；再读图片计数
        const existing = await imgRepo
          .createQueryBuilder('img')
          .where('img.session_item_id = :sid', { sid: item.id })
          .orderBy('img.sort_order', 'ASC')
          .addOrderBy('img.id', 'ASC')
          .getMany()

        const gate = canUploadApplicationImage({
          sessionStatus: session.status,
          qtype: item.qtype,
          currentImageCount: existing.length,
        })
        if (!gate.ok) {
          if (gate.code === 'SESSION_NOT_OPEN') {
            throw new ConflictException(gate.message)
          }
          throw new BadRequestException(gate.message)
        }

        const sortOrder = nextImageSortOrder(
          existing.map((r) => Number(r.sortOrder)),
        )

        const written = writeApplicationImageFile({
          userId,
          buffer: file.buffer,
        })
        writtenKey = written.storageKey

        const row = imgRepo.create({
          sessionItemId: item.id,
          userId,
          storageKey: written.storageKey,
          mimeType: validated.mime,
          sizeBytes: validated.sizeBytes,
          sortOrder,
          status: 'draft',
          submittedAt: null,
        })
        try {
          return await imgRepo.save(row)
        } catch (e) {
          try {
            deleteApplicationImageFile(written.storageKey)
          } catch {
            /* 尽力清理 */
          }
          writtenKey = null
          throw e
        }
      })

      return toSessionImagePublicView(saved)
    } catch (e) {
      if (writtenKey) {
        try {
          deleteApplicationImageFile(writtenKey)
        } catch {
          /* ignore */
        }
      }
      if (
        e instanceof BadRequestException ||
        e instanceof ConflictException ||
        e instanceof NotFoundException
      ) {
        throw e
      }
      if (e instanceof HsMathApplicationImageStorageError) {
        throw new BadRequestException(e.message)
      }
      throw e
    }
  }

  async list(
    userId: string,
    sessionId: string,
    sessionItemId: string,
  ): Promise<{ items: HsMathSessionImagePublicView[] }> {
    await this.requireOwnedSessionAndItem(userId, sessionId, sessionItemId)
    const rows = await this.imagesRepo.find({
      where: { sessionItemId, userId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return { items: rows.map((r) => toSessionImagePublicView(r)) }
  }

  async getBinary(
    userId: string,
    sessionId: string,
    sessionItemId: string,
    imageId: string,
  ): Promise<{ mimeType: string; buffer: Buffer }> {
    const image = await this.requireOwnedImage(
      userId,
      sessionId,
      sessionItemId,
      imageId,
    )
    try {
      const buffer = readApplicationImageFile(image.storageKey)
      return { mimeType: image.mimeType, buffer }
    } catch (e) {
      if (e instanceof HsMathApplicationImageStorageError) {
        throw new NotFoundException('图片不存在')
      }
      throw e
    }
  }

  async remove(
    userId: string,
    sessionId: string,
    sessionItemId: string,
    imageId: string,
  ): Promise<{ deleted: true; imageId: string }> {
    const storageKey = await this.dataSource.transaction(async (manager) => {
      const { session, item } = await this.lockOwnedSessionAndItem(
        manager,
        userId,
        sessionId,
        sessionItemId,
      )
      const imgRepo = manager.getRepository(HsMathTrainSessionItemImage)
      const image = await imgRepo
        .createQueryBuilder('img')
        .setLock('pessimistic_write')
        .where('img.id = :imageId', { imageId })
        .getOne()

      if (
        !image ||
        !assertImageOwnershipMatches({
          jwtUserId: userId,
          sessionUserId: session.userId,
          sessionId,
          sessionItemSessionId: session.id,
          sessionItemId,
          imageUserId: image.userId,
          imageSessionItemId: image.sessionItemId,
        })
      ) {
        throw new NotFoundException('图片不存在')
      }

      const gate = canDeleteApplicationImage({
        sessionStatus: session.status,
        imageStatus: image.status,
      })
      if (!gate.ok) {
        if (gate.code === 'SESSION_LOCKED') {
          throw new ConflictException(gate.message)
        }
        throw new BadRequestException(gate.message)
      }

      // APPLICATION-2C：已写入答案 imageIds 的图片禁止删，避免引用失效
      if (
        isImageIdReferencedInUserAnswer(item.userAnswerPayloadJson, imageId)
      ) {
        throw new ConflictException(
          '图片已写入当前作答，请先清除或更新答案后再删除',
        )
      }

      const key = image.storageKey
      await imgRepo.remove(image)
      return key
    })

    // DB 已删：再删磁盘；失败仅留磁盘孤儿，元数据不可再访问
    try {
      deleteApplicationImageFile(storageKey)
    } catch {
      /* 记录级：本阶段不引入 logger 强制；后续可补 */
    }

    return { deleted: true, imageId: String(imageId) }
  }

  // —— helpers ——

  private async requireOwnedSessionAndItem(
    userId: string,
    sessionId: string,
    sessionItemId: string,
  ) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId, userId },
    })
    if (!session) throw new NotFoundException('训练任务不存在')

    const item = await this.sessionItemsRepo.findOne({
      where: { id: sessionItemId, sessionId },
    })
    if (
      !item ||
      !assertImageOwnershipMatches({
        jwtUserId: userId,
        sessionUserId: session.userId,
        sessionId,
        sessionItemSessionId: item.sessionId,
        sessionItemId: item.id,
      })
    ) {
      throw new NotFoundException('题目不存在')
    }
    return { session, item }
  }

  private async requireOwnedImage(
    userId: string,
    sessionId: string,
    sessionItemId: string,
    imageId: string,
  ) {
    const { session, item } = await this.requireOwnedSessionAndItem(
      userId,
      sessionId,
      sessionItemId,
    )
    const image = await this.imagesRepo.findOne({ where: { id: imageId } })
    if (
      !image ||
      !assertImageOwnershipMatches({
        jwtUserId: userId,
        sessionUserId: session.userId,
        sessionId,
        sessionItemSessionId: item.sessionId,
        sessionItemId: item.id,
        imageUserId: image.userId,
        imageSessionItemId: image.sessionItemId,
      })
    ) {
      throw new NotFoundException('图片不存在')
    }
    return image
  }

  private async lockOwnedSessionAndItem(
    manager: EntityManager,
    userId: string,
    sessionId: string,
    sessionItemId: string,
  ) {
    const session = await manager
      .getRepository(HsMathTrainSession)
      .createQueryBuilder('s')
      .setLock('pessimistic_write')
      .where('s.id = :sessionId AND s.user_id = :userId', {
        sessionId,
        userId,
      })
      .getOne()
    if (!session) throw new NotFoundException('训练任务不存在')

    const item = await manager
      .getRepository(HsMathTrainSessionItem)
      .createQueryBuilder('i')
      .setLock('pessimistic_write')
      .where('i.id = :sessionItemId AND i.session_id = :sessionId', {
        sessionItemId,
        sessionId,
      })
      .getOne()

    if (
      !item ||
      !assertImageOwnershipMatches({
        jwtUserId: userId,
        sessionUserId: session.userId,
        sessionId,
        sessionItemSessionId: item.sessionId,
        sessionItemId: item.id,
      })
    ) {
      throw new NotFoundException('题目不存在')
    }

    return { session, item }
  }
}
