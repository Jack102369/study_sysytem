import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { AiAccessService } from '../auth/ai-access.service'
import { DeepseekClientService } from '../ai-reference/deepseek-client.service'
import { ErrorQuestion } from '../error-questions/error-question.entity'
import { PointsService } from '../points/points.service'
import { Subject } from '../subjects/subject.entity'
import {
  AiFetchKnowledgeDto,
  BatchCreateKnowledgeCardsDto,
  CreateKnowledgeCardDto,
  ListKnowledgeCardsQueryDto,
  UpdateKnowledgeCardDto,
} from './dto/knowledge-cards.dto'
import {
  ErrorQuestionKnowledgeCard,
  KnowledgeCard,
  KnowledgeCardStatus,
  KnowledgeKind,
  KNOWLEDGE_CARD_STATUSES,
  KNOWLEDGE_KINDS,
} from './knowledge-card.entity'

@Injectable()
export class KnowledgeCardsService {
  constructor(
    @InjectRepository(KnowledgeCard)
    private readonly repo: Repository<KnowledgeCard>,
    @InjectRepository(ErrorQuestionKnowledgeCard)
    private readonly linkRepo: Repository<ErrorQuestionKnowledgeCard>,
    @InjectRepository(ErrorQuestion)
    private readonly errorRepo: Repository<ErrorQuestion>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    private readonly aiAccess: AiAccessService,
    private readonly deepseek: DeepseekClientService,
    private readonly points: PointsService,
  ) {}

  async list(userId: string, query: ListKnowledgeCardsQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(50, query.pageSize ?? 20)
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId })
    if (query.subjectId) {
      qb.andWhere('c.subject_id = :sid', { sid: query.subjectId })
    }
    if (query.kind) {
      qb.andWhere('c.kind = :kind', { kind: query.kind })
    }
    if (query.status) {
      qb.andWhere('c.status = :st', { st: query.status })
    }
    if (query.errorQuestionId) {
      qb.innerJoin(
        'error_question_knowledge_cards',
        'l',
        'l.knowledge_card_id = c.id AND l.user_id = :linkUserId AND l.error_question_id = :eid',
        { linkUserId: userId, eid: query.errorQuestionId },
      )
    }
    const total = await qb.clone().getCount()
    const rows = await qb
      .orderBy('c.updated_at', 'DESC')
      .addOrderBy('c.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()
    return {
      items: await this.toViews(userId, rows),
      total,
      page,
      pageSize,
    }
  }

  async listByError(userId: string, errorQuestionId: string) {
    await this.assertError(userId, errorQuestionId)
    const links = await this.linkRepo.find({
      where: { userId, errorQuestionId },
    })
    if (!links.length) return { items: [] }
    const rows = await this.repo.find({
      where: {
        userId,
        id: In(links.map((l) => l.knowledgeCardId)),
      },
      order: { updatedAt: 'DESC' },
    })
    return { items: await this.toViews(userId, rows) }
  }

  async detail(userId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('知识点不存在')
    const [view] = await this.toViews(userId, [row])
    return view
  }

  async create(userId: string, dto: CreateKnowledgeCardDto) {
    await this.assertSubject(userId, dto.subjectId)
    this.assertKind(dto.kind)
    if (dto.linkErrorQuestionId) {
      await this.assertError(userId, dto.linkErrorQuestionId)
    }
    const row = await this.repo.save(
      this.repo.create({
        userId,
        subjectId: dto.subjectId,
        kind: dto.kind as KnowledgeKind,
        title: dto.title.trim(),
        content: dto.content.trim(),
        tip: dto.tip?.trim() || null,
        status: (dto.status as KnowledgeCardStatus) || 'active',
      }),
    )
    if (dto.linkErrorQuestionId) {
      await this.linkRepo.save(
        this.linkRepo.create({
          userId,
          errorQuestionId: dto.linkErrorQuestionId,
          knowledgeCardId: row.id,
        }),
      )
    }
    await this.points.awardSafe(
      userId,
      'knowledge_card_create',
      String(row.id),
      '入库公式/定理',
      'knowledge_card',
    )
    const [view] = await this.toViews(userId, [row])
    return view
  }

  async batchCreate(userId: string, dto: BatchCreateKnowledgeCardsDto) {
    const items = []
    for (const it of dto.items) {
      items.push(await this.create(userId, it))
    }
    return { items }
  }

  async update(userId: string, id: string, dto: UpdateKnowledgeCardDto) {
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('知识点不存在')
    if (dto.subjectId !== undefined) {
      await this.assertSubject(userId, dto.subjectId)
      row.subjectId = dto.subjectId
    }
    if (dto.kind !== undefined) {
      this.assertKind(dto.kind)
      row.kind = dto.kind as KnowledgeKind
    }
    if (dto.title !== undefined) row.title = dto.title.trim()
    if (dto.content !== undefined) row.content = dto.content.trim()
    if (dto.tip !== undefined) row.tip = dto.tip?.trim() || null
    if (dto.status !== undefined) {
      if (!KNOWLEDGE_CARD_STATUSES.includes(dto.status as KnowledgeCardStatus)) {
        throw new BadRequestException('状态无效')
      }
      row.status = dto.status as KnowledgeCardStatus
    }
    await this.repo.save(row)
    const [view] = await this.toViews(userId, [row])
    return view
  }

  async remove(userId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException('知识点不存在')
    await this.linkRepo.delete({ userId, knowledgeCardId: id })
    await this.repo.remove(row)
    return { ok: true }
  }

  async aiFetch(userId: string, dto: AiFetchKnowledgeDto) {
    await this.aiAccess.assertCanUseAi(userId)
    let subjectId = dto.subjectId?.trim() || ''
    let stem = ''
    let analysis = ''
    let keyPoints = ''
    if (dto.errorQuestionId?.trim()) {
      const eq = await this.assertError(userId, dto.errorQuestionId.trim())
      // 从错题拉取时以错题科目为准，避免前端科目不一致报错
      subjectId = String(eq.subjectId)
      stem = eq.stemText || eq.title || ''
      analysis = eq.analysisText || ''
      keyPoints = eq.keyPoints || ''
    }
    if (!subjectId) {
      throw new BadRequestException('请选择科目')
    }
    if (!dto.topic?.trim() && !stem) {
      throw new BadRequestException('请填写主题关键词，或选择一道错题')
    }
    const subject = await this.assertSubject(userId, subjectId)
    const { items, model } = await this.deepseek.fetchKnowledgeFormulas({
      subjectName: subject.name,
      topic: dto.topic?.trim() || '',
      stemText: stem,
      analysisText: analysis,
      keyPoints,
      count: dto.count ?? 3,
    })
    const linkErrorQuestionId = dto.errorQuestionId?.trim() || null
    return {
      model,
      subjectId,
      linkErrorQuestionId,
      items: items.map((it) => ({
        kind: it.kind,
        title: it.title,
        content: it.content,
        tip: it.tip || '',
        subjectId,
        linkErrorQuestionId,
      })),
    }
  }

  async linkError(userId: string, cardId: string, errorQuestionId: string) {
    const card = await this.repo.findOne({ where: { id: cardId, userId } })
    if (!card) throw new NotFoundException('知识点不存在')
    await this.assertError(userId, errorQuestionId)
    const exists = await this.linkRepo.findOne({
      where: { userId, knowledgeCardId: cardId, errorQuestionId },
    })
    if (!exists) {
      await this.linkRepo.save(
        this.linkRepo.create({ userId, knowledgeCardId: cardId, errorQuestionId }),
      )
    }
    return { ok: true }
  }

  async unlinkError(userId: string, cardId: string, errorQuestionId: string) {
    await this.linkRepo.delete({
      userId,
      knowledgeCardId: cardId,
      errorQuestionId,
    })
    return { ok: true }
  }

  private assertKind(kind: string) {
    if (!KNOWLEDGE_KINDS.includes(kind as KnowledgeKind)) {
      throw new BadRequestException('类型无效')
    }
  }

  private async assertSubject(userId: string, subjectId: string) {
    const s = await this.subjectRepo.findOne({ where: { id: subjectId, userId } })
    if (!s) throw new BadRequestException('科目不存在')
    return s
  }

  private async assertError(userId: string, errorId: string) {
    const eq = await this.errorRepo.findOne({ where: { id: errorId, userId } })
    if (!eq) throw new NotFoundException('错题不存在')
    return eq
  }

  private async toViews(userId: string, rows: KnowledgeCard[]) {
    if (!rows.length) return []
    const subjectIds = [...new Set(rows.map((r) => r.subjectId))]
    const subjects = await this.subjectRepo.find({
      where: { userId, id: In(subjectIds) },
    })
    const nameMap = new Map(subjects.map((s) => [String(s.id), s.name]))
    const cardIds = rows.map((r) => r.id)
    const links = await this.linkRepo.find({
      where: { userId, knowledgeCardId: In(cardIds) },
    })
    const linkMap = new Map<string, string[]>()
    for (const l of links) {
      const k = String(l.knowledgeCardId)
      const arr = linkMap.get(k) || []
      arr.push(String(l.errorQuestionId))
      linkMap.set(k, arr)
    }
    return rows.map((r) => ({
      id: String(r.id),
      subjectId: String(r.subjectId),
      subjectName: nameMap.get(String(r.subjectId)) || null,
      kind: r.kind,
      title: r.title,
      content: r.content,
      tip: r.tip,
      status: r.status,
      linkedErrorQuestionIds: linkMap.get(String(r.id)) || [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  }
}
