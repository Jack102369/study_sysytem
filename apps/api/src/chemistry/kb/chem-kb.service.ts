import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CHEM_ENTITY_TYPES,
  CHEM_KB_STATUSES,
  type ChemEntityType,
  type ChemKbStatus,
} from './kb.constants'
import {
  ChemKbListQueryDto,
  ChemKbSetLinksDto,
  ChemReactionSpeciesDto,
  ChemSubstanceElementItemDto,
} from './dto/kb.dto'
import { ChemConcept } from './entities/chem-concept.entity'
import { ChemElement } from './entities/chem-element.entity'
import {
  ChemExperiment,
  ChemExperimentImage,
} from './entities/chem-experiment.entity'
import { ChemFormula } from './entities/chem-formula.entity'
import { ChemKnowledgePoint } from './entities/chem-knowledge-point.entity'
import {
  ChemEntityCategory,
  ChemEntitySpecialty,
  ChemExperimentReaction,
  ChemExperimentSubstance,
  ChemKbLink,
  ChemKpLink,
  ChemQuestionKp,
  ChemReactionElement,
  ChemReactionSubstance,
} from './entities/chem-link.entities'
import { ChemQuestion } from './entities/chem-question.entity'
import {
  ChemReaction,
  ChemReactionSpecies,
  ChemReactionTag,
} from './entities/chem-reaction.entity'
import {
  ChemSubstance,
  ChemSubstanceElement,
  ChemSubstanceTag,
} from './entities/chem-substance.entity'

type ListOpts = { publishedOnly?: boolean }
type DetailOpts = { publishedOnly?: boolean }

const SEARCH_FIELDS: Record<ChemEntityType, string[]> = {
  element: ['symbol', 'nameZh', 'nameEn'],
  substance: ['name', 'canonicalFormula', 'commonNames'],
  reaction: ['name', 'equation', 'canonicalEquation'],
  experiment: ['name'],
  formula: ['name', 'expression'],
  concept: ['name'],
  knowledge: ['name'],
  question: ['stem'],
}

@Injectable()
export class ChemKbService {
  constructor(
    @InjectRepository(ChemElement)
    private readonly elementsRepo: Repository<ChemElement>,
    @InjectRepository(ChemSubstance)
    private readonly substancesRepo: Repository<ChemSubstance>,
    @InjectRepository(ChemSubstanceTag)
    private readonly substanceTagsRepo: Repository<ChemSubstanceTag>,
    @InjectRepository(ChemSubstanceElement)
    private readonly substanceElementsRepo: Repository<ChemSubstanceElement>,
    @InjectRepository(ChemReaction)
    private readonly reactionsRepo: Repository<ChemReaction>,
    @InjectRepository(ChemReactionTag)
    private readonly reactionTagsRepo: Repository<ChemReactionTag>,
    @InjectRepository(ChemReactionSpecies)
    private readonly reactionSpeciesRepo: Repository<ChemReactionSpecies>,
    @InjectRepository(ChemExperiment)
    private readonly experimentsRepo: Repository<ChemExperiment>,
    @InjectRepository(ChemExperimentImage)
    private readonly experimentImagesRepo: Repository<ChemExperimentImage>,
    @InjectRepository(ChemFormula)
    private readonly formulasRepo: Repository<ChemFormula>,
    @InjectRepository(ChemConcept)
    private readonly conceptsRepo: Repository<ChemConcept>,
    @InjectRepository(ChemKnowledgePoint)
    private readonly knowledgePointsRepo: Repository<ChemKnowledgePoint>,
    @InjectRepository(ChemQuestion)
    private readonly questionsRepo: Repository<ChemQuestion>,
    @InjectRepository(ChemEntitySpecialty)
    private readonly entitySpecialtiesRepo: Repository<ChemEntitySpecialty>,
    @InjectRepository(ChemEntityCategory)
    private readonly entityCategoriesRepo: Repository<ChemEntityCategory>,
    @InjectRepository(ChemKpLink)
    private readonly kpLinksRepo: Repository<ChemKpLink>,
    @InjectRepository(ChemQuestionKp)
    private readonly questionKpsRepo: Repository<ChemQuestionKp>,
    @InjectRepository(ChemReactionSubstance)
    private readonly reactionSubstancesRepo: Repository<ChemReactionSubstance>,
    @InjectRepository(ChemReactionElement)
    private readonly reactionElementsRepo: Repository<ChemReactionElement>,
    @InjectRepository(ChemExperimentReaction)
    private readonly experimentReactionsRepo: Repository<ChemExperimentReaction>,
    @InjectRepository(ChemExperimentSubstance)
    private readonly experimentSubstancesRepo: Repository<ChemExperimentSubstance>,
    @InjectRepository(ChemKbLink)
    private readonly kbLinksRepo: Repository<ChemKbLink>,
  ) {}

  private assertType(type: string): ChemEntityType {
    if (!(CHEM_ENTITY_TYPES as readonly string[]).includes(type)) {
      throw new BadRequestException(`不支持的实体类型：${type}`)
    }
    return type as ChemEntityType
  }

  private assertStatus(status: string): ChemKbStatus {
    if (!(CHEM_KB_STATUSES as readonly string[]).includes(status)) {
      throw new BadRequestException(`无效状态：${status}`)
    }
    return status as ChemKbStatus
  }

  private repo(type: ChemEntityType): Repository<{
    id: string
    status: ChemKbStatus
    [k: string]: unknown
  }> {
    const map: Record<ChemEntityType, Repository<any>> = {
      element: this.elementsRepo,
      substance: this.substancesRepo,
      reaction: this.reactionsRepo,
      experiment: this.experimentsRepo,
      formula: this.formulasRepo,
      concept: this.conceptsRepo,
      knowledge: this.knowledgePointsRepo,
      question: this.questionsRepo,
    }
    return map[type]
  }

  async list(type: string, query: ChemKbListQueryDto, opts: ListOpts = {}) {
    const entityType = this.assertType(type)
    const page = query.page ?? 1
    const pageSize = Math.min(100, query.pageSize ?? 20)
    const qb = this.repo(entityType).createQueryBuilder('e')

    if (opts.publishedOnly) {
      // 学生端：排除 AI 试用发布（待人工复核），避免未人审知识进入正式阅读/训练链路
      qb.andWhere('e.status = :pub', { pub: 'published' })
      qb.andWhere(
        `(e.review_note NOT LIKE :aiTrial AND e.review_note NOT LIKE :trialRun)`,
        { aiTrial: '%[ai_trial]%', trialRun: '%[trial_run]%' },
      )
    } else if (query.status) {
      qb.andWhere('e.status = :st', { st: this.assertStatus(query.status) })
    }

    const q = query.q?.trim()
    if (q) {
      const fields = SEARCH_FIELDS[entityType]
      const parts = fields.map((f, i) => `e.${f} LIKE :q${i}`)
      const params: Record<string, string> = {}
      fields.forEach((_, i) => {
        params[`q${i}`] = `%${q}%`
      })
      qb.andWhere(`(${parts.join(' OR ')})`, params)
    }

    qb.orderBy('e.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, pageSize }
  }

  async get(type: string, id: string, opts: DetailOpts = {}) {
    const entityType = this.assertType(type)
    const row = await this.repo(entityType).findOne({ where: { id } as any })
    if (!row) {
      throw new NotFoundException('记录不存在')
    }
    if (opts.publishedOnly) {
      if (row.status !== 'published') {
        throw new NotFoundException('记录不存在或未发布')
      }
      const note = String((row as { reviewNote?: string }).reviewNote ?? '')
      if (note.includes('[ai_trial]') || note.includes('[trial_run]')) {
        throw new NotFoundException('记录不存在或未发布')
      }
    }

    const links = await this.loadLinks(entityType, id)
    const extras = await this.loadTypeExtras(entityType, id)

    const result: Record<string, unknown> = {
      ...row,
      ...extras,
      ...links,
    }

    if (entityType === 'reaction') {
      const species = (extras.species as ChemReactionSpecies[]) ?? []
      result.warnings = this.roughElementConservationWarnings(species)
    }

    return result
  }

  async create(type: string, dto: Record<string, unknown>, userId: string) {
    const entityType = this.assertType(type)
    switch (entityType) {
      case 'element':
        return this.createElement(dto, userId)
      case 'substance':
        return this.createSubstance(dto, userId)
      case 'reaction':
        return this.createReaction(dto, userId)
      case 'experiment':
        return this.createExperiment(dto, userId)
      case 'formula':
        return this.createFormula(dto, userId)
      case 'concept':
        return this.createConcept(dto, userId)
      case 'knowledge':
        return this.createKnowledge(dto, userId)
      case 'question':
        return this.createQuestion(dto, userId)
      default:
        throw new BadRequestException(`不支持的实体类型：${type}`)
    }
  }

  async update(
    type: string,
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const entityType = this.assertType(type)
    switch (entityType) {
      case 'element':
        return this.updateElement(id, dto, userId)
      case 'substance':
        return this.updateSubstance(id, dto, userId)
      case 'reaction':
        return this.updateReaction(id, dto, userId)
      case 'experiment':
        return this.updateExperiment(id, dto, userId)
      case 'formula':
        return this.updateFormula(id, dto, userId)
      case 'concept':
        return this.updateConcept(id, dto, userId)
      case 'knowledge':
        return this.updateKnowledge(id, dto, userId)
      case 'question':
        return this.updateQuestion(id, dto, userId)
      default:
        throw new BadRequestException(`不支持的实体类型：${type}`)
    }
  }

  async setStatus(
    type: string,
    id: string,
    status: string,
    reviewNote: string | undefined,
    reviewerId: string,
  ) {
    const entityType = this.assertType(type)
    const st = this.assertStatus(status)
    const repo = this.repo(entityType)
    const row = await repo.findOne({ where: { id } as any })
    if (!row) {
      throw new NotFoundException('记录不存在')
    }

    if (st === 'published' && entityType === 'reaction') {
      const reaction = row as unknown as ChemReaction
      if (!reaction.isVerified) {
        throw new BadRequestException('反应未人工确认（isVerified），不能发布')
      }
    }

    row.status = st
    if (reviewNote !== undefined) {
      ;(row as any).reviewNote = reviewNote
    }
    ;(row as any).reviewedBy = reviewerId
    ;(row as any).reviewedAt = new Date()
    ;(row as any).updatedBy = reviewerId
    await repo.save(row as any)
    return this.get(entityType, id)
  }

  async setLinks(type: string, id: string, dto: ChemKbSetLinksDto) {
    const entityType = this.assertType(type)
    const row = await this.repo(entityType).findOne({ where: { id } as any })
    if (!row) {
      throw new NotFoundException('记录不存在')
    }

    if (dto.specialtyIds !== undefined) {
      await this.entitySpecialtiesRepo.delete({
        entityType,
        entityId: id,
      })
      if (dto.specialtyIds.length) {
        await this.entitySpecialtiesRepo.save(
          dto.specialtyIds.map((specialtyId) =>
            this.entitySpecialtiesRepo.create({
              entityType,
              entityId: id,
              specialtyId,
            }),
          ),
        )
      }
    }

    if (dto.categoryIds !== undefined) {
      await this.entityCategoriesRepo.delete({
        entityType,
        entityId: id,
      })
      if (dto.categoryIds.length) {
        await this.entityCategoriesRepo.save(
          dto.categoryIds.map((categoryId) =>
            this.entityCategoriesRepo.create({
              entityType,
              entityId: id,
              categoryId,
            }),
          ),
        )
      }
    }

    if (dto.kbLinks !== undefined) {
      await this.kbLinksRepo.delete({ fromType: entityType, fromId: id })
      if (dto.kbLinks.length) {
        await this.kbLinksRepo.save(
          dto.kbLinks.map((l) =>
            this.kbLinksRepo.create({
              fromType: entityType,
              fromId: id,
              toType: l.toType,
              toId: l.toId,
              note: l.note ?? '',
            }),
          ),
        )
      }
    }

    if (entityType === 'knowledge' && dto.kpTargets !== undefined) {
      await this.kpLinksRepo.delete({ knowledgePointId: id })
      if (dto.kpTargets.length) {
        await this.kpLinksRepo.save(
          dto.kpTargets.map((t) =>
            this.kpLinksRepo.create({
              knowledgePointId: id,
              targetType: t.targetType,
              targetId: t.targetId,
            }),
          ),
        )
      }
    }

    if (entityType === 'question' && dto.knowledgePointIds !== undefined) {
      await this.questionKpsRepo.delete({ questionId: id })
      if (dto.knowledgePointIds.length) {
        await this.questionKpsRepo.save(
          dto.knowledgePointIds.map((knowledgePointId) =>
            this.questionKpsRepo.create({ questionId: id, knowledgePointId }),
          ),
        )
      }
    }

    if (entityType === 'reaction') {
      if (dto.substanceIds !== undefined) {
        await this.reactionSubstancesRepo.delete({ reactionId: id })
        if (dto.substanceIds.length) {
          await this.reactionSubstancesRepo.save(
            [...new Set(dto.substanceIds)].map((substanceId) =>
              this.reactionSubstancesRepo.create({ reactionId: id, substanceId }),
            ),
          )
        }
      }
      if (dto.elementIds !== undefined) {
        await this.reactionElementsRepo.delete({ reactionId: id })
        if (dto.elementIds.length) {
          await this.reactionElementsRepo.save(
            [...new Set(dto.elementIds)].map((elementId) =>
              this.reactionElementsRepo.create({ reactionId: id, elementId }),
            ),
          )
        }
      }
    }

    if (entityType === 'experiment') {
      if (dto.reactionIds !== undefined) {
        await this.experimentReactionsRepo.delete({ experimentId: id })
        if (dto.reactionIds.length) {
          await this.experimentReactionsRepo.save(
            [...new Set(dto.reactionIds)].map((reactionId) =>
              this.experimentReactionsRepo.create({
                experimentId: id,
                reactionId,
              }),
            ),
          )
        }
      }
      if (dto.substanceIds !== undefined) {
        await this.experimentSubstancesRepo.delete({ experimentId: id })
        if (dto.substanceIds.length) {
          await this.experimentSubstancesRepo.save(
            [...new Set(dto.substanceIds)].map((substanceId) =>
              this.experimentSubstancesRepo.create({
                experimentId: id,
                substanceId,
              }),
            ),
          )
        }
      }
      if (dto.imageAttachmentIds !== undefined) {
        await this.experimentImagesRepo.delete({ experimentId: id })
        if (dto.imageAttachmentIds.length) {
          await this.experimentImagesRepo.save(
            dto.imageAttachmentIds.map((attachmentId, i) =>
              this.experimentImagesRepo.create({
                experimentId: id,
                attachmentId,
                caption: '',
                sortOrder: i + 1,
              }),
            ),
          )
        }
      }
    }

    if (entityType === 'substance' && dto.elementIds !== undefined) {
      // 仅替换关联元素 ID 列表时，默认 atomCount=1；完整组成请用 update.elements
      await this.substanceElementsRepo.delete({ substanceId: id })
      if (dto.elementIds.length) {
        await this.substanceElementsRepo.save(
          [...new Set(dto.elementIds)].map((elementId) =>
            this.substanceElementsRepo.create({
              substanceId: id,
              elementId,
              atomCount: 1,
            }),
          ),
        )
      }
    }

    return this.get(entityType, id)
  }

  // ---------- create / update helpers ----------

  private normalizeStatus(raw?: unknown): ChemKbStatus {
    if (typeof raw === 'string' && (CHEM_KB_STATUSES as readonly string[]).includes(raw)) {
      return raw as ChemKbStatus
    }
    return 'draft'
  }

  private async createElement(dto: Record<string, unknown>, userId: string) {
    const symbol = String(dto.symbol ?? '').trim()
    const nameZh = String(dto.nameZh ?? '').trim()
    const atomicNumber = Number(dto.atomicNumber)
    if (!symbol || !nameZh || !atomicNumber) {
      throw new BadRequestException('元素符号、中文名、原子序数必填')
    }
    const dup = await this.elementsRepo.findOne({
      where: [{ symbol }, { atomicNumber }],
    })
    if (dup) {
      throw new BadRequestException('元素符号或原子序数已存在')
    }
    const row = this.elementsRepo.create({
      symbol,
      nameZh,
      nameEn: String(dto.nameEn ?? ''),
      atomicNumber,
      atomicMass:
        dto.atomicMass === undefined || dto.atomicMass === null
          ? null
          : String(dto.atomicMass),
      periodNo: (dto.periodNo as number | null | undefined) ?? null,
      groupLabel: (dto.groupLabel as string | null | undefined) ?? null,
      category: (dto.category as string | null | undefined) ?? null,
      commonValences: (dto.commonValences as string | null | undefined) ?? null,
      atomStructure: (dto.atomStructure as string | null | undefined) ?? null,
      electronConfig: (dto.electronConfig as string | null | undefined) ?? null,
      commonCompounds: (dto.commonCompounds as string | null | undefined) ?? null,
      keyProperties: (dto.keyProperties as string | null | undefined) ?? null,
      commonUses: (dto.commonUses as string | null | undefined) ?? null,
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.elementsRepo.save(row)
    return this.get('element', saved.id)
  }

  private async updateElement(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.elementsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.symbol !== undefined) row.symbol = String(dto.symbol).trim()
    if (dto.nameZh !== undefined) row.nameZh = String(dto.nameZh).trim()
    if (dto.nameEn !== undefined) row.nameEn = String(dto.nameEn)
    if (dto.atomicNumber !== undefined) row.atomicNumber = Number(dto.atomicNumber)
    if (dto.atomicMass !== undefined) {
      row.atomicMass =
        dto.atomicMass === null ? null : String(dto.atomicMass)
    }
    for (const key of [
      'periodNo',
      'groupLabel',
      'category',
      'commonValences',
      'atomStructure',
      'electronConfig',
      'commonCompounds',
      'keyProperties',
      'commonUses',
    ] as const) {
      if (dto[key] !== undefined) (row as any)[key] = dto[key]
    }
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    row.updatedBy = userId
    await this.elementsRepo.save(row)
    return this.get('element', id)
  }

  private async createSubstance(dto: Record<string, unknown>, userId: string) {
    const name = String(dto.name ?? '').trim()
    const canonicalFormula = String(dto.canonicalFormula ?? '').trim()
    if (!name || !canonicalFormula) {
      throw new BadRequestException('物质名称与化学式必填')
    }
    const dup = await this.substancesRepo.findOne({
      where: { name, canonicalFormula },
    })
    if (dup) throw new BadRequestException('同名同化学式物质已存在')

    const row = this.substancesRepo.create({
      name,
      canonicalFormula,
      commonNames: String(dto.commonNames ?? ''),
      color: String(dto.color ?? ''),
      stateLabel: String(dto.stateLabel ?? ''),
      solubility: (dto.solubility as string | null | undefined) ?? null,
      physicalProps: (dto.physicalProps as string | null | undefined) ?? null,
      chemicalProps: (dto.chemicalProps as string | null | undefined) ?? null,
      commonUses: (dto.commonUses as string | null | undefined) ?? null,
      testMethods: (dto.testMethods as string | null | undefined) ?? null,
      storageMethods: (dto.storageMethods as string | null | undefined) ?? null,
      safetyNotes: (dto.safetyNotes as string | null | undefined) ?? null,
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.substancesRepo.save(row)
    await this.replaceSubstanceTags(saved.id, dto.tags as string[] | undefined)
    await this.replaceSubstanceElements(
      saved.id,
      dto.elements as ChemSubstanceElementItemDto[] | undefined,
    )
    return this.get('substance', saved.id)
  }

  private async updateSubstance(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.substancesRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.name !== undefined) row.name = String(dto.name).trim()
    if (dto.canonicalFormula !== undefined) {
      row.canonicalFormula = String(dto.canonicalFormula).trim()
    }
    for (const key of [
      'commonNames',
      'color',
      'stateLabel',
      'solubility',
      'physicalProps',
      'chemicalProps',
      'commonUses',
      'testMethods',
      'storageMethods',
      'safetyNotes',
    ] as const) {
      if (dto[key] !== undefined) (row as any)[key] = dto[key]
    }
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    row.updatedBy = userId
    await this.substancesRepo.save(row)
    if (dto.tags !== undefined) {
      await this.replaceSubstanceTags(id, dto.tags as string[])
    }
    if (dto.elements !== undefined) {
      await this.replaceSubstanceElements(
        id,
        dto.elements as ChemSubstanceElementItemDto[],
      )
    }
    return this.get('substance', id)
  }

  private async replaceSubstanceTags(substanceId: string, tags?: string[]) {
    if (tags === undefined) return
    await this.substanceTagsRepo.delete({ substanceId })
    const unique = [...new Set(tags.filter(Boolean))]
    if (!unique.length) return
    await this.substanceTagsRepo.save(
      unique.map((tag) => this.substanceTagsRepo.create({ substanceId, tag })),
    )
  }

  private async replaceSubstanceElements(
    substanceId: string,
    elements?: ChemSubstanceElementItemDto[],
  ) {
    if (elements === undefined) return
    await this.substanceElementsRepo.delete({ substanceId })
    if (!elements.length) return
    await this.substanceElementsRepo.save(
      elements.map((e) =>
        this.substanceElementsRepo.create({
          substanceId,
          elementId: e.elementId,
          atomCount: e.atomCount ?? 1,
        }),
      ),
    )
  }

  private async createReaction(dto: Record<string, unknown>, userId: string) {
    const name = String(dto.name ?? '').trim()
    const canonicalEquation = String(dto.canonicalEquation ?? '').trim()
    const equation = String(dto.equation ?? '').trim()
    if (!name || !canonicalEquation || !equation) {
      throw new BadRequestException('反应名称、规范化方程式、展示方程式必填')
    }
    const dup = await this.reactionsRepo.findOne({
      where: { canonicalEquation },
    })
    if (dup) throw new BadRequestException('规范化方程式已存在')

    const row = this.reactionsRepo.create({
      name,
      canonicalEquation,
      equation,
      ionicEquation: (dto.ionicEquation as string | null | undefined) ?? null,
      conditions: String(dto.conditions ?? ''),
      phenomenon: (dto.phenomenon as string | null | undefined) ?? null,
      principle: (dto.principle as string | null | undefined) ?? null,
      oxidant: (dto.oxidant as string | null | undefined) ?? null,
      reductant: (dto.reductant as string | null | undefined) ?? null,
      oxProduct: (dto.oxProduct as string | null | undefined) ?? null,
      reProduct: (dto.reProduct as string | null | undefined) ?? null,
      electronTransfer:
        (dto.electronTransfer as string | null | undefined) ?? null,
      difficulty: Number(dto.difficulty ?? 2),
      importance: Number(dto.importance ?? 3),
      isVerified: Boolean(dto.isVerified ?? false),
      trainTypes: String(dto.trainTypes ?? ''),
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.reactionsRepo.save(row)
    await this.replaceReactionTags(saved.id, dto.tags as string[] | undefined)
    await this.replaceReactionSpecies(
      saved.id,
      dto.species as ChemReactionSpeciesDto[] | undefined,
    )
    return this.get('reaction', saved.id)
  }

  private async updateReaction(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.reactionsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.name !== undefined) row.name = String(dto.name).trim()
    if (dto.canonicalEquation !== undefined) {
      row.canonicalEquation = String(dto.canonicalEquation).trim()
    }
    if (dto.equation !== undefined) row.equation = String(dto.equation).trim()
    for (const key of [
      'ionicEquation',
      'conditions',
      'phenomenon',
      'principle',
      'oxidant',
      'reductant',
      'oxProduct',
      'reProduct',
      'electronTransfer',
      'trainTypes',
    ] as const) {
      if (dto[key] !== undefined) (row as any)[key] = dto[key]
    }
    if (dto.difficulty !== undefined) row.difficulty = Number(dto.difficulty)
    if (dto.importance !== undefined) row.importance = Number(dto.importance)
    if (dto.isVerified !== undefined) row.isVerified = Boolean(dto.isVerified)
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    row.updatedBy = userId
    await this.reactionsRepo.save(row)
    if (dto.tags !== undefined) {
      await this.replaceReactionTags(id, dto.tags as string[])
    }
    if (dto.species !== undefined) {
      await this.replaceReactionSpecies(id, dto.species as ChemReactionSpeciesDto[])
    }
    return this.get('reaction', id)
  }

  private async replaceReactionTags(reactionId: string, tags?: string[]) {
    if (tags === undefined) return
    await this.reactionTagsRepo.delete({ reactionId })
    const unique = [...new Set(tags.filter(Boolean))]
    if (!unique.length) return
    await this.reactionTagsRepo.save(
      unique.map((tag) => this.reactionTagsRepo.create({ reactionId, tag })),
    )
  }

  private async replaceReactionSpecies(
    reactionId: string,
    species?: ChemReactionSpeciesDto[],
  ) {
    if (species === undefined) return
    await this.reactionSpeciesRepo.delete({ reactionId })
    if (!species.length) return
    await this.reactionSpeciesRepo.save(
      species.map((s, i) =>
        this.reactionSpeciesRepo.create({
          reactionId,
          role: s.role,
          substanceId: s.substanceId ?? null,
          formula: s.formula,
          coefficient: String(s.coefficient ?? 1),
          stateSymbol: s.stateSymbol ?? null,
          isGas: Boolean(s.isGas ?? false),
          isPrecipitate: Boolean(s.isPrecipitate ?? false),
          sortOrder: s.sortOrder ?? i + 1,
        }),
      ),
    )
  }

  private async createExperiment(dto: Record<string, unknown>, userId: string) {
    const name = String(dto.name ?? '').trim()
    if (!name) throw new BadRequestException('实验名称必填')
    const row = this.experimentsRepo.create({
      name,
      category: String(dto.category ?? 'other'),
      purpose: (dto.purpose as string | null | undefined) ?? null,
      principle: (dto.principle as string | null | undefined) ?? null,
      instruments: (dto.instruments as string | null | undefined) ?? null,
      reagents: (dto.reagents as string | null | undefined) ?? null,
      steps: (dto.steps as string | null | undefined) ?? null,
      phenomenon: (dto.phenomenon as string | null | undefined) ?? null,
      conclusion: (dto.conclusion as string | null | undefined) ?? null,
      precautions: (dto.precautions as string | null | undefined) ?? null,
      safetyNotes: (dto.safetyNotes as string | null | undefined) ?? null,
      isHazardous: Boolean(dto.isHazardous ?? false),
      homeForbiddenNote:
        (dto.homeForbiddenNote as string | undefined) ??
        '危险实验请在实验室由教师指导下完成，禁止在家自行操作。',
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.experimentsRepo.save(row)
    return this.get('experiment', saved.id)
  }

  private async updateExperiment(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.experimentsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.name !== undefined) row.name = String(dto.name).trim()
    for (const key of [
      'category',
      'purpose',
      'principle',
      'instruments',
      'reagents',
      'steps',
      'phenomenon',
      'conclusion',
      'precautions',
      'safetyNotes',
      'homeForbiddenNote',
    ] as const) {
      if (dto[key] !== undefined) (row as any)[key] = dto[key]
    }
    if (dto.isHazardous !== undefined) row.isHazardous = Boolean(dto.isHazardous)
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    row.updatedBy = userId
    await this.experimentsRepo.save(row)
    return this.get('experiment', id)
  }

  private async createFormula(dto: Record<string, unknown>, userId: string) {
    const name = String(dto.name ?? '').trim()
    const expression = String(dto.expression ?? '').trim()
    if (!name || !expression) {
      throw new BadRequestException('公式名称与表达式必填')
    }
    const row = this.formulasRepo.create({
      name,
      expression,
      variables: (dto.variables as string | null | undefined) ?? null,
      units: String(dto.units ?? ''),
      applicableConditions:
        (dto.applicableConditions as string | null | undefined) ?? null,
      examples: (dto.examples as string | null | undefined) ?? null,
      commonMistakes: (dto.commonMistakes as string | null | undefined) ?? null,
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.formulasRepo.save(row)
    return this.get('formula', saved.id)
  }

  private async updateFormula(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.formulasRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.name !== undefined) row.name = String(dto.name).trim()
    if (dto.expression !== undefined) {
      row.expression = String(dto.expression).trim()
    }
    for (const key of [
      'variables',
      'units',
      'applicableConditions',
      'examples',
      'commonMistakes',
    ] as const) {
      if (dto[key] !== undefined) (row as any)[key] = dto[key]
    }
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    row.updatedBy = userId
    await this.formulasRepo.save(row)
    return this.get('formula', id)
  }

  private async createConcept(dto: Record<string, unknown>, userId: string) {
    const name = String(dto.name ?? '').trim()
    if (!name) throw new BadRequestException('概念名称必填')
    const row = this.conceptsRepo.create({
      name,
      definition: (dto.definition as string | null | undefined) ?? null,
      principle: (dto.principle as string | null | undefined) ?? null,
      applicableConditions:
        (dto.applicableConditions as string | null | undefined) ?? null,
      judgeMethods: (dto.judgeMethods as string | null | undefined) ?? null,
      examples: (dto.examples as string | null | undefined) ?? null,
      commonMistakes: (dto.commonMistakes as string | null | undefined) ?? null,
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.conceptsRepo.save(row)
    return this.get('concept', saved.id)
  }

  private async updateConcept(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.conceptsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.name !== undefined) row.name = String(dto.name).trim()
    for (const key of [
      'definition',
      'principle',
      'applicableConditions',
      'judgeMethods',
      'examples',
      'commonMistakes',
    ] as const) {
      if (dto[key] !== undefined) (row as any)[key] = dto[key]
    }
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    row.updatedBy = userId
    await this.conceptsRepo.save(row)
    return this.get('concept', id)
  }

  private async createKnowledge(dto: Record<string, unknown>, userId: string) {
    const name = String(dto.name ?? '').trim()
    if (!name) throw new BadRequestException('知识点名称必填')
    const row = this.knowledgePointsRepo.create({
      parentId: (dto.parentId as string | null | undefined) ?? null,
      name,
      description: (dto.description as string | null | undefined) ?? null,
      difficulty: Number(dto.difficulty ?? 2),
      importance: Number(dto.importance ?? 3),
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.knowledgePointsRepo.save(row)
    return this.get('knowledge', saved.id)
  }

  private async updateKnowledge(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.knowledgePointsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.parentId !== undefined) {
      row.parentId = (dto.parentId as string | null) ?? null
    }
    if (dto.name !== undefined) row.name = String(dto.name).trim()
    if (dto.description !== undefined) {
      row.description = dto.description as string | null
    }
    if (dto.difficulty !== undefined) row.difficulty = Number(dto.difficulty)
    if (dto.importance !== undefined) row.importance = Number(dto.importance)
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    row.updatedBy = userId
    await this.knowledgePointsRepo.save(row)
    return this.get('knowledge', id)
  }

  private async createQuestion(dto: Record<string, unknown>, userId: string) {
    const qtype = String(dto.qtype ?? '').trim()
    const stem = String(dto.stem ?? '').trim()
    const answer = String(dto.answer ?? '').trim()
    if (!qtype || !stem || !answer) {
      throw new BadRequestException('题型、题干、答案必填')
    }
    const row = this.questionsRepo.create({
      qtype,
      stem,
      optionsJson: dto.optionsJson ?? null,
      answer,
      analysis: (dto.analysis as string | null | undefined) ?? null,
      scoring: (dto.scoring as string | null | undefined) ?? null,
      difficulty: Number(dto.difficulty ?? 2),
      status: this.normalizeStatus(dto.status),
      reviewNote: String(dto.reviewNote ?? ''),
      createdBy: userId,
      updatedBy: userId,
    })
    const saved = await this.questionsRepo.save(row)
    return this.get('question', saved.id)
  }

  private async updateQuestion(
    id: string,
    dto: Record<string, unknown>,
    userId: string,
  ) {
    const row = await this.questionsRepo.findOne({ where: { id } })
    if (!row) throw new NotFoundException('记录不存在')
    if (dto.qtype !== undefined) row.qtype = String(dto.qtype)
    if (dto.stem !== undefined) row.stem = String(dto.stem)
    if (dto.optionsJson !== undefined) row.optionsJson = dto.optionsJson
    if (dto.answer !== undefined) row.answer = String(dto.answer)
    if (dto.analysis !== undefined) row.analysis = dto.analysis as string | null
    if (dto.scoring !== undefined) row.scoring = dto.scoring as string | null
    if (dto.difficulty !== undefined) row.difficulty = Number(dto.difficulty)
    if (dto.status !== undefined) row.status = this.normalizeStatus(dto.status)
    if (dto.reviewNote !== undefined) row.reviewNote = String(dto.reviewNote)
    row.updatedBy = userId
    await this.questionsRepo.save(row)
    return this.get('question', id)
  }

  // ---------- detail helpers ----------

  private async loadTypeExtras(type: ChemEntityType, id: string) {
    switch (type) {
      case 'substance': {
        const tags = await this.substanceTagsRepo.find({
          where: { substanceId: id },
        })
        const elements = await this.substanceElementsRepo.find({
          where: { substanceId: id },
        })
        return {
          tags: tags.map((t) => t.tag),
          elements,
        }
      }
      case 'reaction': {
        const tags = await this.reactionTagsRepo.find({
          where: { reactionId: id },
        })
        const species = await this.reactionSpeciesRepo.find({
          where: { reactionId: id },
          order: { sortOrder: 'ASC', id: 'ASC' },
        })
        const substanceIds = (
          await this.reactionSubstancesRepo.find({ where: { reactionId: id } })
        ).map((x) => x.substanceId)
        const elementIds = (
          await this.reactionElementsRepo.find({ where: { reactionId: id } })
        ).map((x) => x.elementId)
        return {
          tags: tags.map((t) => t.tag),
          species,
          substanceIds,
          elementIds,
        }
      }
      case 'experiment': {
        const images = await this.experimentImagesRepo.find({
          where: { experimentId: id },
          order: { sortOrder: 'ASC', id: 'ASC' },
        })
        const reactionIds = (
          await this.experimentReactionsRepo.find({
            where: { experimentId: id },
          })
        ).map((x) => x.reactionId)
        const substanceIds = (
          await this.experimentSubstancesRepo.find({
            where: { experimentId: id },
          })
        ).map((x) => x.substanceId)
        return { images, reactionIds, substanceIds }
      }
      case 'knowledge': {
        const kpTargets = await this.kpLinksRepo.find({
          where: { knowledgePointId: id },
        })
        return { kpTargets }
      }
      case 'question': {
        const knowledgePointIds = (
          await this.questionKpsRepo.find({ where: { questionId: id } })
        ).map((x) => x.knowledgePointId)
        return { knowledgePointIds }
      }
      default:
        return {}
    }
  }

  private async loadLinks(type: ChemEntityType, id: string) {
    const [specialtyIds, categoryIds, kbLinks, linkedFromKp] = await Promise.all([
      this.entitySpecialtiesRepo
        .find({ where: { entityType: type, entityId: id } })
        .then((rows) => rows.map((r) => r.specialtyId)),
      this.entityCategoriesRepo
        .find({ where: { entityType: type, entityId: id } })
        .then((rows) => rows.map((r) => r.categoryId)),
      this.kbLinksRepo.find({ where: { fromType: type, fromId: id } }),
      type === 'knowledge'
        ? Promise.resolve([])
        : this.kpLinksRepo.find({
            where: { targetType: type, targetId: id },
          }),
    ])
    return {
      specialtyIds,
      categoryIds,
      kbLinks,
      linkedKnowledgePointIds: linkedFromKp.map((x) => x.knowledgePointId),
    }
  }

  /** 粗略元素守恒检查：不阻断保存，仅返回 warnings */
  roughElementConservationWarnings(species: ChemReactionSpecies[]): string[] {
    const warnings: string[] = []
    const left = new Map<string, number>()
    const right = new Map<string, number>()

    for (const sp of species) {
      if (sp.role === 'catalyst') continue
      const coef = Number(sp.coefficient) || 1
      const counts = this.parseFormulaRough(sp.formula)
      const target = sp.role === 'product' ? right : left
      for (const [el, n] of Object.entries(counts)) {
        target.set(el, (target.get(el) ?? 0) + n * coef)
      }
    }

    if (!left.size && !right.size) return warnings

    const all = new Set([...left.keys(), ...right.keys()])
    for (const el of all) {
      const l = left.get(el) ?? 0
      const r = right.get(el) ?? 0
      if (Math.abs(l - r) > 1e-6) {
        warnings.push(`元素 ${el} 可能不守恒：反应物约 ${l}，产物约 ${r}`)
      }
    }
    return warnings
  }

  private parseFormulaRough(formula: string): Record<string, number> {
    const result: Record<string, number> = {}
    // 去掉括号简化：粗略展开一层 (X)n
    let s = formula.replace(/\s+/g, '')
    s = s.replace(/\(([^()]+)\)(\d*)/g, (_, inner: string, mul: string) => {
      const m = Number(mul || 1)
      return inner.replace(/([A-Z][a-z]?)(\d*)/g, (__: string, el: string, n: string) => {
        return `${el}${Number(n || 1) * m}`
      })
    })
    const re = /([A-Z][a-z]?)(\d*)/g
    let match: RegExpExecArray | null
    while ((match = re.exec(s))) {
      const el = match[1]
      const n = Number(match[2] || 1)
      result[el] = (result[el] ?? 0) + n
    }
    return result
  }

  /** 供 import 做重复检查 */
  async findDuplicate(
    type: ChemEntityType,
    data: Record<string, unknown>,
  ): Promise<string | null> {
    if (type === 'element' && data.symbol) {
      const row = await this.elementsRepo.findOne({
        where: { symbol: String(data.symbol).trim() },
      })
      return row?.id ?? null
    }
    if (type === 'substance' && data.canonicalFormula && data.name) {
      const row = await this.substancesRepo.findOne({
        where: {
          canonicalFormula: String(data.canonicalFormula).trim(),
          name: String(data.name).trim(),
        },
      })
      return row?.id ?? null
    }
    if (type === 'reaction' && data.canonicalEquation) {
      const row = await this.reactionsRepo.findOne({
        where: {
          canonicalEquation: String(data.canonicalEquation).trim(),
        },
      })
      return row?.id ?? null
    }
    return null
  }
}
