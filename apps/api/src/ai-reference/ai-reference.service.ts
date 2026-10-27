import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { AiAccessService } from '../auth/ai-access.service'
import { OcrAccessService } from '../auth/ocr-access.service'
import { AiReferenceItem } from './ai-reference-item.entity'
import { DeepseekClientService } from './deepseek-client.service'
import {
  GenerateAiReferenceDto,
  ListAiReferenceQueryDto,
  OcrFromErrorDto,
  UpdateAiReferenceDto,
} from './dto/ai-reference.dto'
import { OcrClientService } from './ocr-client.service'

@Injectable()
export class AiReferenceService {
  constructor(
    @InjectRepository(AiReferenceItem)
    private readonly repo: Repository<AiReferenceItem>,
    private readonly ocr: OcrClientService,
    private readonly deepseek: DeepseekClientService,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly ocrAccess: OcrAccessService,
    private readonly aiAccess: AiAccessService,
  ) {}

  async list(userId: string, query: ListAiReferenceQueryDto) {
    await this.aiAccess.assertCanUseAi(userId)
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.user_id = :userId', { userId })
    if (query.sourceErrorQuestionId) {
      qb.andWhere('a.source_error_question_id = :sid', {
        sid: query.sourceErrorQuestionId,
      })
    }
    if (query.status) {
      qb.andWhere('a.status = :st', { st: query.status })
    }
    const total = await qb.clone().getCount()
    const rows = await qb
      .orderBy('a.created_at', 'DESC')
      .addOrderBy('a.id', 'DESC')
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
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('AI 参考题不存在')
    return this.toView(row)
  }

  async update(userId: string, id: string, dto: UpdateAiReferenceDto) {
    await this.aiAccess.assertCanUseAi(userId)
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('AI 参考题不存在')

    let contentChanged = false
    if (dto.stemText !== undefined) {
      const v = dto.stemText.trim()
      if (!v) throw new BadRequestException('题干不能为空')
      if (v !== row.stemText) contentChanged = true
      row.stemText = v
    }
    if (dto.answerText !== undefined) {
      const v = dto.answerText?.trim() || null
      if (v !== row.answerText) contentChanged = true
      row.answerText = v
    }
    if (dto.analysisText !== undefined) {
      const v = dto.analysisText?.trim() || null
      if (v !== row.analysisText) contentChanged = true
      row.analysisText = v
    }

    // 已确认后改动正文 → 自动降回未确认
    if (contentChanged && row.status === 'VERIFIED') {
      row.status = 'UNVERIFIED'
      row.verifiedAt = null
    }

    await this.repo.save(row)
    return this.toView(row)
  }

  async setVerify(userId: string, id: string, status: 'UNVERIFIED' | 'VERIFIED') {
    await this.aiAccess.assertCanUseAi(userId)
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('AI 参考题不存在')
    if (status === 'VERIFIED') {
      row.status = 'VERIFIED'
      row.verifiedAt = new Date()
      row.verifyCount = Number(row.verifyCount || 0) + 1
    } else {
      row.status = 'UNVERIFIED'
      row.verifiedAt = null
    }
    await this.repo.save(row)
    return this.toView(row)
  }

  async remove(userId: string, id: string) {
    await this.aiAccess.assertCanUseAi(userId)
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('AI 参考题不存在')
    await this.repo.remove(row)
    return { id }
  }

  async ocrFromError(userId: string, dto: OcrFromErrorDto) {
    await this.aiAccess.assertCanUseAi(userId)
    await this.ocrAccess.assertCanUseOcr(userId)
    const eq = await this.loadOwnedError(userId, dto.sourceErrorQuestionId)
    const stemUrl = await this.findFirstStemImageUrl(userId, eq.id)
    if (!stemUrl) {
      throw new BadRequestException('该错题没有题干图片，请先上传 STEM 附件或手动填写题干')
    }
    const abs = this.ocr.resolveUploadAbsolutePath(stemUrl)
    const result = await this.ocr.ocrByFile(abs)
    if (!result.text) {
      throw new BadRequestException('未能识别出文字，请换清晰图片或手动输入题干')
    }

    if (dto.saveToStemText) {
      await this.dataSource.query(
        `UPDATE error_questions SET stem_text = ? WHERE id = ? AND user_id = ?`,
        [result.text, eq.id, userId],
      )
    }

    return {
      sourceErrorQuestionId: eq.id,
      text: result.text,
      confidence: result.confidence,
      engine: result.engine || null,
      savedToStemText: !!dto.saveToStemText,
    }
  }

  async generate(userId: string, dto: GenerateAiReferenceDto) {
    await this.aiAccess.assertCanUseAi(userId)
    this.assertDailyLimit(userId)

    const sourceId = (dto.sourceErrorQuestionId || '').trim()
    let sourceStem = (dto.stemText || '').trim()
    let subjectName: string | null = null
    let categoryName: string | null = null
    let tags: string[] = []
    let sourceErrorQuestionId: string | null = null
    const avoidStems: string[] = []

    if (sourceId) {
      const eq = await this.loadOwnedError(userId, sourceId)
      sourceErrorQuestionId = eq.id
      if (!sourceStem) sourceStem = (eq.stemText || '').trim()
      if (!sourceStem) {
        await this.ocrAccess.assertCanUseOcr(userId)
        const stemUrl = await this.findFirstStemImageUrl(userId, eq.id)
        if (!stemUrl) {
          throw new BadRequestException('无题干文字且无题干图片，无法生成')
        }
        const abs = this.ocr.resolveUploadAbsolutePath(stemUrl)
        const ocr = await this.ocr.ocrByFile(abs)
        sourceStem = ocr.text
        if (!sourceStem) {
          throw new BadRequestException('OCR 未识别到文字，请手动填写题干后再生成')
        }
      }
      const meta = await this.loadErrorMeta(userId, eq.id)
      subjectName = meta.subjectName
      categoryName = meta.categoryName
      tags = meta.tags
      const existing = await this.repo.find({
        where: { userId, sourceErrorQuestionId: eq.id },
        order: { createdAt: 'DESC' },
        take: 20,
      })
      avoidStems.push(
        sourceStem,
        ...existing.map((e) => e.stemText),
        ...(eq.extensions?.map((x) => x.contentText || '').filter(Boolean) || []),
      )
    } else {
      if (!sourceStem) {
        throw new BadRequestException('请粘贴题干文字，或选择来源错题后再生成')
      }
      avoidStems.push(sourceStem)
      if (dto.subjectId) {
        const subs = (await this.dataSource.query(
          `SELECT name FROM subjects WHERE id = ? AND user_id = ? LIMIT 1`,
          [dto.subjectId, userId],
        )) as Array<{ name: string }>
        subjectName = subs[0]?.name ?? null
      }
    }

    // 手动选择的知识点（分类）覆盖/补充
    const catIds = (dto.categoryIds || []).map(String).filter(Boolean)
    if (catIds.length) {
      const ph = catIds.map(() => '?').join(',')
      const cats = (await this.dataSource.query(
        `SELECT name FROM error_categories
         WHERE user_id = ? AND id IN (${ph}) AND is_archived = 0`,
        [userId, ...catIds],
      )) as Array<{ name: string }>
      const names = cats.map((c) => c.name).filter(Boolean)
      if (names.length) {
        categoryName = names.join('、')
        // 同步进 tags 提示，便于模型对齐知识点
        tags = [...new Set([...tags, ...names])]
      }
    }

    const count = dto.count ?? 2
    const { items, model } = await this.deepseek.generateSimilar({
      subjectName,
      categoryName,
      tags,
      sourceStem,
      avoidStems,
      count,
      expandMode: dto.expandMode || 'EXPAND',
    })

    const filtered = items.filter((it) => !this.isTooSimilar(it.stemText, avoidStems))
    const toSave = (filtered.length ? filtered : items).slice(0, count)
    if (!toSave.length) {
      throw new ServiceUnavailableException('生成结果与已有题过于相似，请重试')
    }

    const saved = []
    for (const it of toSave) {
      const entity = this.repo.create({
        userId,
        sourceErrorQuestionId,
        stemText: it.stemText,
        answerText: it.answerText || null,
        analysisText: it.analysisText || null,
        status: 'UNVERIFIED',
        model,
        verifyCount: 0,
        verifiedAt: null,
      })
      const row = await this.repo.save(entity)
      saved.push(this.toView(row))
    }

    await this.bumpDailyCount(userId)
    return { items: saved, model }
  }

  private async assertDailyLimit(userId: string) {
    const limit = Number(this.config.get<string>('AI_SIMILAR_DAILY_LIMIT', '30'))
    if (!limit || limit <= 0) return
    const key = this.dailyKey(userId)
    // lightweight: count today's generates via DB creates today
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS c FROM ai_reference_items
       WHERE user_id = ? AND created_at >= CURDATE()`,
      [userId],
    )
    const c = Number(rows?.[0]?.c || 0)
    if (c >= limit) {
      throw new BadRequestException(`今日 AI 生成已达上限（${limit} 条），请明日再试`)
    }
    void key
  }

  private async bumpDailyCount(_userId: string) {
    // counted by rows inserted; no-op
  }

  private dailyKey(userId: string) {
    return `ai-ref:${userId}:${new Date().toISOString().slice(0, 10)}`
  }

  private isTooSimilar(stem: string, avoid: string[]) {
    const n = this.normalize(stem)
    if (n.length < 12) return false
    for (const a of avoid) {
      const m = this.normalize(a)
      if (!m) continue
      if (n === m) return true
      if (n.length > 20 && m.includes(n.slice(0, Math.min(40, n.length)))) return true
      if (m.length > 20 && n.includes(m.slice(0, Math.min(40, m.length)))) return true
    }
    return false
  }

  private normalize(s: string) {
    return s.replace(/\s+/g, '').toLowerCase()
  }

  private async loadOwnedError(userId: string, id: string) {
    const rows = (await this.dataSource.query(
      `SELECT id, stem_text AS stemText FROM error_questions WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId],
    )) as Array<{ id: string; stemText: string | null }>
    if (!rows.length) throw new NotFoundException('来源错题不存在')
    const extensions = (await this.dataSource.query(
      `SELECT content_text AS contentText FROM extensions WHERE error_question_id = ? LIMIT 20`,
      [id],
    )) as Array<{ contentText: string | null }>
    return {
      id: String(rows[0].id),
      stemText: rows[0].stemText,
      extensions,
    }
  }

  private async loadErrorMeta(userId: string, errorQuestionId: string) {
    const base = (await this.dataSource.query(
      `SELECT s.name AS subjectName, c.name AS categoryName
       FROM error_questions eq
       LEFT JOIN subjects s ON s.id = eq.subject_id AND s.user_id = eq.user_id
       LEFT JOIN error_categories c ON c.id = eq.category_id AND c.user_id = eq.user_id
       WHERE eq.id = ? AND eq.user_id = ? LIMIT 1`,
      [errorQuestionId, userId],
    )) as Array<{ subjectName: string | null; categoryName: string | null }>
    const tags = (await this.dataSource.query(
      `SELECT t.name FROM error_question_tags eqt
       INNER JOIN tags t ON t.id = eqt.tag_id AND t.user_id = ?
       WHERE eqt.error_question_id = ?`,
      [userId, errorQuestionId],
    )) as Array<{ name: string }>
    return {
      subjectName: base[0]?.subjectName ?? null,
      categoryName: base[0]?.categoryName ?? null,
      tags: tags.map((t) => t.name),
    }
  }

  private async findFirstStemImageUrl(userId: string, errorQuestionId: string) {
    const rows = (await this.dataSource.query(
      `SELECT a.url
       FROM error_question_attachments eqa
       INNER JOIN attachments a ON a.id = eqa.attachment_id AND a.user_id = ?
       WHERE eqa.error_question_id = ? AND eqa.role = 'STEM'
       ORDER BY eqa.sort_order ASC, a.id ASC
       LIMIT 1`,
      [userId, errorQuestionId],
    )) as Array<{ url: string }>
    return rows[0]?.url || null
  }

  private toView(row: AiReferenceItem) {
    return {
      id: String(row.id),
      sourceErrorQuestionId: row.sourceErrorQuestionId
        ? String(row.sourceErrorQuestionId)
        : null,
      stemText: row.stemText,
      answerText: row.answerText,
      analysisText: row.analysisText,
      status: row.status,
      model: row.model,
      verifyCount: Number(row.verifyCount || 0),
      verifiedAt: row.verifiedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}