import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { Repository } from 'typeorm'
import { AttachmentsService } from '../attachments/attachments.service'
import { PointsService } from '../points/points.service'
import {
  CreateListeningMaterialDto,
  ListListeningMaterialsQueryDto,
} from './dto/listening-material.dto'
import { ListeningMaterial } from './listening-material.entity'
import { PiperTtsService } from './piper-tts.service'

@Injectable()
export class ListeningMaterialsService {
  constructor(
    @InjectRepository(ListeningMaterial)
    private readonly repo: Repository<ListeningMaterial>,
    private readonly piper: PiperTtsService,
    private readonly attachments: AttachmentsService,
    private readonly points: PointsService,
  ) {}

  async list(userId: string, query: ListListeningMaterialsQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const qb = this.repo
      .createQueryBuilder('lm')
      .where('lm.user_id = :userId', { userId })

    const total = await qb.clone().getCount()
    const rows = await qb
      .orderBy('lm.created_at', 'DESC')
      .addOrderBy('lm.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()

    const attMap = await this.loadAttachments(
      userId,
      rows.map((r) => (r.attachmentId ? String(r.attachmentId) : '')).filter(Boolean),
    )

    return {
      items: rows.map((r) => this.toView(r, attMap)),
      total,
      page,
      pageSize,
    }
  }

  listVoices() {
    return { items: this.piper.listVoices() }
  }

  async detail(userId: string, id: string) {
    const entity = await this.repo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('听力材料不存在')
    const attMap = await this.loadAttachments(
      userId,
      entity.attachmentId ? [String(entity.attachmentId)] : [],
    )
    return this.toView(entity, attMap)
  }

  async create(userId: string, dto: CreateListeningMaterialDto) {
    const contentText = dto.contentText.trim()
    const lengthScale = this.normalizeScale(dto.lengthScale)
    const title =
      dto.title?.trim() ||
      (contentText.length > 40 ? `${contentText.slice(0, 40)}…` : contentText)

    const wav = await this.piper.synthesizeToWav(
      contentText,
      lengthScale,
      dto.voiceKey,
    )
    const durationMs = this.piper.estimateWavDurationMs(wav.absolutePath)
    const att = await this.attachments.createLocal(
      userId,
      wav.relativeUrl,
      'audio/wav',
      wav.fileName,
    )

    const entity = this.repo.create({
      userId,
      title,
      contentText,
      attachmentId: att.id,
      voiceKey: wav.voiceKey,
      lengthScale: lengthScale.toFixed(2),
      durationMs,
    })
    const saved = await this.repo.save(entity)
    await this.points.awardSafe(
      userId,
      'listening_create',
      String(saved.id),
      '生成听力',
      'listening',
    )
    return this.detail(userId, String(saved.id))
  }

  async remove(userId: string, id: string) {
    const entity = await this.repo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('听力材料不存在')

    let fileUrl: string | null = null
    if (entity.attachmentId) {
      const attMap = await this.loadAttachments(userId, [String(entity.attachmentId)])
      fileUrl = attMap.get(String(entity.attachmentId))?.url ?? null
    }

    await this.repo.remove(entity)

    if (fileUrl?.startsWith('/uploads/')) {
      const abs = join(process.cwd(), fileUrl.replace(/^\//, ''))
      if (existsSync(abs)) {
        try {
          unlinkSync(abs)
        } catch {
          // ignore disk delete errors
        }
      }
    }

    return { id }
  }

  private normalizeScale(raw?: number) {
    const n = raw === undefined || Number.isNaN(raw) ? 1 : Number(raw)
    const clamped = Math.min(1.8, Math.max(0.7, n))
    return Math.round(clamped * 100) / 100
  }

  private toView(
    row: ListeningMaterial,
    attMap: Map<string, { url: string; originalName: string | null }>,
  ) {
    const att = row.attachmentId ? attMap.get(String(row.attachmentId)) : undefined
    return {
      id: String(row.id),
      title: row.title,
      contentText: row.contentText,
      attachmentId: row.attachmentId ? String(row.attachmentId) : null,
      audioUrl: att?.url ?? null,
      voiceKey: row.voiceKey,
      lengthScale: Number(row.lengthScale),
      durationMs: row.durationMs,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private async loadAttachments(userId: string, attachmentIds: string[]) {
    const map = new Map<string, { url: string; originalName: string | null }>()
    const ids = [...new Set(attachmentIds.filter(Boolean))]
    if (!ids.length) return map
    const rows = await this.repo.manager.query(
      `SELECT id, url, original_name AS originalName
       FROM attachments WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
      [userId, ...ids],
    ) as Array<{ id: string | number; url: string; originalName: string | null }>
    for (const row of rows) {
      map.set(String(row.id), {
        url: row.url,
        originalName: row.originalName ?? null,
      })
    }
    return map
  }
}
