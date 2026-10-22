import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AiAccessService } from '../auth/ai-access.service'
import { OcrAccessService } from '../auth/ocr-access.service'
import { DeepseekClientService } from '../ai-reference/deepseek-client.service'
import { OcrClientService } from '../ai-reference/ocr-client.service'
import { PointsService } from '../points/points.service'
import {
  CreateWritingCoachDto,
  GaokaoReviewWritingCoachDto,
  GenerateWritingTopicDto,
  ListWritingCoachQueryDto,
  ReviewWritingCoachDto,
  UpdateWritingCoachDto,
} from './dto/writing-coach.dto'
import { WritingCoachSession } from './writing-coach-session.entity'

@Injectable()
export class WritingCoachService {
  constructor(
    @InjectRepository(WritingCoachSession)
    private readonly repo: Repository<WritingCoachSession>,
    private readonly deepseek: DeepseekClientService,
    private readonly aiAccess: AiAccessService,
    private readonly ocrAccess: OcrAccessService,
    private readonly ocr: OcrClientService,
    private readonly points: PointsService,
  ) {}

  async list(userId: string, query: ListWritingCoachQueryDto) {
    await this.aiAccess.assertCanUseAi(userId)
    const page = query.page ?? 1
    const pageSize = Math.min(50, query.pageSize ?? 20)
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })
    if (query.subjectTrack) {
      qb.andWhere('s.subject_track = :track', { track: query.subjectTrack })
    }
    if (query.topicSource) {
      qb.andWhere('s.topic_source = :topicSource', {
        topicSource: query.topicSource,
      })
    }
    if (query.reviewMode) {
      qb.andWhere('s.review_mode = :reviewMode', { reviewMode: query.reviewMode })
    }
    if (query.hasReview === 'yes') {
      qb.andWhere('s.review_json IS NOT NULL')
    } else if (query.hasReview === 'no') {
      qb.andWhere('s.review_json IS NULL')
    }
    const keyword = (query.keyword || '').trim()
    if (keyword) {
      qb.andWhere(
        '(s.topic_text LIKE :kw OR s.topic_requirements LIKE :kw OR s.outline_text LIKE :kw OR s.final_draft_text LIKE :kw)',
        { kw: `%${keyword}%` },
      )
    }
    const total = await qb.clone().getCount()
    const rows = await qb
      .orderBy('s.updated_at', 'DESC')
      .addOrderBy('s.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()
    return {
      items: rows.map((r) => this.toView(r)),
      total,
      page,
      pageSize,
    }
  }

  async detail(userId: string, id: string) {
    await this.aiAccess.assertCanUseAi(userId)
    const row = await this.findOwned(userId, id)
    return this.toView(row)
  }

  async create(userId: string, dto: CreateWritingCoachDto) {
    await this.aiAccess.assertCanUseAi(userId)
    const topicText = dto.topicText.trim()
    if (!topicText) throw new BadRequestException('题目不能为空')

    const entity = this.repo.create({
      userId,
      subjectTrack: dto.subjectTrack,
      topicSource: dto.topicSource || 'manual',
      reviewMode: dto.reviewMode || 'structure',
      topicText,
      topicRequirements: this.nullableText(dto.topicRequirements),
      outlineText: this.nullableText(dto.outlineText),
      openingText: this.nullableText(dto.openingText),
      finalDraftText: this.nullableText(dto.finalDraftText),
      reviewJson: null,
      reviewModel: null,
      reviewedAt: null,
    })
    const saved = await this.repo.save(entity)
    return this.toView(saved)
  }

  async update(userId: string, id: string, dto: UpdateWritingCoachDto) {
    await this.aiAccess.assertCanUseAi(userId)
    const row = await this.findOwned(userId, id)

    if (dto.topicSource !== undefined) row.topicSource = dto.topicSource
    if (dto.reviewMode !== undefined) row.reviewMode = dto.reviewMode
    if (dto.topicText !== undefined) {
      const v = dto.topicText.trim()
      if (!v) throw new BadRequestException('题目不能为空')
      row.topicText = v
    }
    if (dto.topicRequirements !== undefined) {
      row.topicRequirements = this.nullableText(dto.topicRequirements)
    }
    if (dto.outlineText !== undefined) {
      row.outlineText = this.nullableText(dto.outlineText)
    }
    if (dto.openingText !== undefined) {
      row.openingText = this.nullableText(dto.openingText)
    }
    if (dto.finalDraftText !== undefined) {
      row.finalDraftText = this.nullableText(dto.finalDraftText)
    }

    const saved = await this.repo.save(row)
    return this.toView(saved)
  }

  async remove(userId: string, id: string) {
    await this.aiAccess.assertCanUseAi(userId)
    const row = await this.findOwned(userId, id)
    await this.repo.remove(row)
    return { id }
  }

  async generateTopic(userId: string, dto: GenerateWritingTopicDto) {
    await this.aiAccess.assertCanUseAi(userId)
    const result = await this.deepseek.generateWritingTopic({
      subjectTrack: dto.subjectTrack,
      hint: dto.hint,
    })
    return {
      subjectTrack: dto.subjectTrack,
      topicSource: 'ai' as const,
      topicText: result.topicText,
      topicRequirements: result.topicRequirements,
      model: result.model,
    }
  }

  async review(userId: string, dto: ReviewWritingCoachDto) {
    await this.aiAccess.assertCanUseAi(userId)

    let row: WritingCoachSession | null = null
    if (dto.id) {
      row = await this.findOwned(userId, dto.id)
    }

    const subjectTrack = dto.subjectTrack || row?.subjectTrack
    const topicText = (dto.topicText ?? row?.topicText ?? '').trim()
    const topicRequirements =
      dto.topicRequirements !== undefined
        ? dto.topicRequirements
        : row?.topicRequirements
    const outlineText = (dto.outlineText ?? row?.outlineText ?? '').trim()
    const openingText = (dto.openingText ?? row?.openingText ?? '').trim()

    if (!subjectTrack) throw new BadRequestException('请选择语文或英语')
    if (!topicText) throw new BadRequestException('题目不能为空')
    if (!outlineText) throw new BadRequestException('请先写提纲再点评')
    if (!openingText) throw new BadRequestException('请先写首段再点评')

    const { review, model } = await this.deepseek.reviewWritingStructure({
      subjectTrack,
      topicText,
      topicRequirements,
      outlineText,
      openingText,
    })

    if (row) {
      if (dto.topicText !== undefined) row.topicText = topicText
      if (dto.topicRequirements !== undefined) {
        row.topicRequirements = this.nullableText(dto.topicRequirements)
      }
      if (dto.outlineText !== undefined) row.outlineText = outlineText
      if (dto.openingText !== undefined) row.openingText = openingText
      row.reviewMode = 'structure'
      row.reviewJson = review
      row.reviewModel = model
      row.reviewedAt = new Date()
      row = await this.repo.save(row)
      await this.points.awardSafe(
        userId,
        'writing_review',
        String(row.id),
        '结构点评',
        'writing_coach',
      )
      return {
        session: this.toView(row),
        review,
        model,
      }
    }

    return {
      session: null,
      review,
      model,
    }
  }

  async gaokaoReview(userId: string, dto: GaokaoReviewWritingCoachDto) {
    await this.aiAccess.assertCanUseAi(userId)

    let row: WritingCoachSession | null = null
    if (dto.id) {
      row = await this.findOwned(userId, dto.id)
    }

    const subjectTrack = dto.subjectTrack || row?.subjectTrack
    const topicText = (dto.topicText ?? row?.topicText ?? '').trim()
    const topicRequirements =
      dto.topicRequirements !== undefined
        ? dto.topicRequirements
        : row?.topicRequirements
    const essayText = (dto.essayText ?? row?.finalDraftText ?? '').trim()

    if (!subjectTrack) throw new BadRequestException('请选择语文或英语')
    if (!topicText) throw new BadRequestException('题目不能为空')
    if (!essayText) throw new BadRequestException('请先填写全文再评测')

    const { review, model } = await this.deepseek.reviewGaokaoEssay({
      subjectTrack,
      topicText,
      topicRequirements,
      essayText,
    })

    if (row) {
      if (dto.topicText !== undefined) row.topicText = topicText
      if (dto.topicRequirements !== undefined) {
        row.topicRequirements = this.nullableText(dto.topicRequirements)
      }
      if (dto.essayText !== undefined) row.finalDraftText = essayText
      row.reviewMode = 'gaokao'
      row.reviewJson = review
      row.reviewModel = model
      row.reviewedAt = new Date()
      row = await this.repo.save(row)
      await this.points.awardSafe(
        userId,
        'writing_review',
        String(row.id),
        '高考评测',
        'writing_coach',
      )
      return {
        session: this.toView(row),
        review,
        model,
      }
    }

    return {
      session: null,
      review,
      model,
    }
  }

  async ocrImage(userId: string, file?: Express.Multer.File) {
    await this.aiAccess.assertCanUseAi(userId)
    await this.ocrAccess.assertCanUseOcr(userId)
    if (!file?.buffer?.length) {
      throw new BadRequestException('请上传图片')
    }
    const mime = (file.mimetype || '').toLowerCase()
    if (mime && !mime.startsWith('image/')) {
      throw new BadRequestException('仅支持图片识别')
    }
    const result = await this.ocr.ocrByBuffer(
      file.buffer,
      file.originalname || 'upload.png',
      'general',
    )
    const text = (result.text || '').trim()
    if (!text) {
      throw new BadRequestException('未识别到文字，请换更清晰的照片后重试')
    }
    return {
      text,
      confidence: result.confidence,
      engine: result.engine || 'paddleocr',
    }
  }

  private async findOwned(userId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('结构教练会话不存在')
    return row
  }

  private nullableText(v?: string | null) {
    if (v === undefined || v === null) return null
    const t = v.trim()
    return t || null
  }

  private toView(row: WritingCoachSession) {
    return {
      id: row.id,
      subjectTrack: row.subjectTrack,
      topicSource: row.topicSource,
      reviewMode: row.reviewMode || 'structure',
      topicText: row.topicText,
      topicRequirements: row.topicRequirements,
      outlineText: row.outlineText,
      openingText: row.openingText,
      finalDraftText: row.finalDraftText,
      review: row.reviewJson,
      reviewModel: row.reviewModel,
      reviewedAt: row.reviewedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
