import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { DataSource, Repository } from 'typeorm'
import { ChemCategory } from '../../chem-category.entity'
import { ChemSpecialty } from '../../chem-specialty.entity'
import { ChemTrainItem } from '../entities/chem-train-item.entity'
import { ChemTrainItemLink } from '../entities/chem-train-item-link.entity'
import { KB_TABLE_BY_TYPE } from '../train.constants'
import { loadSecondReviewFixCodes } from './generator-fix-skip'
import {
  buildCandidatesForItem,
  qualityCheck,
} from './generator-templates'
import type { GeneratorConfirmDto, GeneratorPreviewDto } from './generator.dto'
import type {
  GenCandidate,
  GenFilters,
  GenKbItem,
  GenKbType,
  GenPreviewResult,
  GenSkip,
} from './generator.types'

const MAX_PER_CONFIRM = 500
const PREVIEW_TTL_MS = 30 * 60 * 1000

interface PreviewStore {
  id: string
  expiresAt: number
  candidates: GenCandidate[]
  skipped: GenSkip[]
  filters: GenFilters
  createdBy: string
}

@Injectable()
export class LocalGeneratorService {
  private readonly previews = new Map<string, PreviewStore>()

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ChemTrainItem)
    private readonly itemsRepo: Repository<ChemTrainItem>,
    @InjectRepository(ChemTrainItemLink)
    private readonly linksRepo: Repository<ChemTrainItemLink>,
    @InjectRepository(ChemSpecialty)
    private readonly specsRepo: Repository<ChemSpecialty>,
    @InjectRepository(ChemCategory)
    private readonly catsRepo: Repository<ChemCategory>,
  ) {}

  async meta() {
    const specs = await this.specsRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    const cats = await this.catsRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    const [[{ total }], [{ active }], [{ filler }]] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(1) AS total FROM chem_train_items`,
      ),
      this.dataSource.query(
        `SELECT COUNT(1) AS active FROM chem_train_items
         WHERE pool='test' AND status='approved' AND is_active=1`,
      ),
      this.dataSource.query(
        `SELECT COUNT(1) AS filler FROM chem_train_items
         WHERE code LIKE 'train.ai_trial.cov.%' AND is_active=1`,
      ),
    ])
    return {
      maxPerConfirm: MAX_PER_CONFIRM,
      pool: 'test',
      note: '仅写入 AI 试运行题池；须预览后确认；不会为凑数重复造题',
      specialties: specs.map((s) => ({
        code: s.code,
        name: s.name,
        id: s.id,
      })),
      categories: cats.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        specialtyId: c.specialtyId,
      })),
      kbTypes: [
        'element',
        'substance',
        'reaction',
        'knowledge',
        'concept',
        'formula',
        'experiment',
      ],
      qtypes: ['single', 'judge', 'blank'],
      difficulties: [
        { value: 1, label: '基础' },
        { value: 2, label: '提高' },
      ],
      counts: {
        trainItemsTotal: Number(total),
        testActive: Number(active),
        fillerActive: Number(filler),
      },
    }
  }

  async preview(
    userId: string,
    dto: GeneratorPreviewDto,
  ): Promise<GenPreviewResult> {
    this.purgeExpired()
    const filters: GenFilters = {
      specialtyCode: dto.specialtyCode,
      categoryCode: dto.categoryCode,
      kbTypes: dto.kbTypes as GenKbType[] | undefined,
      qtypes: dto.qtypes,
      difficulties: dto.difficulties,
      targetCount: dto.targetCount ?? MAX_PER_CONFIRM,
      sourceCodes: dto.sourceCodes,
    }
    if ((filters.targetCount || 0) > MAX_PER_CONFIRM) {
      throw new BadRequestException(`目标题量不得超过 ${MAX_PER_CONFIRM}`)
    }

    const { candidates, skipped } = await this.buildAll(filters)

    const previewId = randomUUID()
    const expiresAt = Date.now() + PREVIEW_TTL_MS
    this.previews.set(previewId, {
      id: previewId,
      expiresAt,
      candidates,
      skipped,
      filters,
      createdBy: userId,
    })

    return {
      previewId,
      expiresAt: new Date(expiresAt).toISOString(),
      candidates,
      skipped,
      stats: this.statsOf(candidates, skipped),
      safety: {
        maxPerConfirm: MAX_PER_CONFIRM,
        note: '确认前不会写库；达不到目标题量时按实际候选写入，绝不复制凑数',
      },
    }
  }

  async confirm(userId: string, dto: GeneratorConfirmDto) {
    this.purgeExpired()
    const store = this.previews.get(dto.previewId)
    if (!store) {
      throw new NotFoundException('预览已过期或不存在，请重新预览')
    }
    if (store.createdBy !== userId) {
      throw new BadRequestException('只能确认本人创建的预览')
    }
    if (Date.now() > store.expiresAt) {
      this.previews.delete(dto.previewId)
      throw new NotFoundException('预览已过期，请重新预览')
    }

    let list = store.candidates
    const limit = dto.confirmCount ?? list.length
    if (limit < 1) throw new BadRequestException('confirmCount 无效')
    list = list.slice(0, Math.min(limit, MAX_PER_CONFIRM, list.length))

    const deactivateFiller = dto.deactivateFiller !== false

    const specs = await this.specsRepo.find()
    const cats = await this.catsRepo.find()
    const specByCode = new Map(specs.map((s) => [s.code, s]))
    const catUnder = new Map<string, ChemCategory>()
    for (const c of cats) {
      const sp = specs.find((s) => String(s.id) === String(c.specialtyId))
      if (sp) catUnder.set(`${sp.code}:${c.code}`, c)
    }

    const existingCodes = new Set(
      (
        await this.itemsRepo.find({
          select: ['code'],
        })
      ).map((i) => i.code),
    )
    // 已有 angle：同 template+source 的 pa 编码
    const existingStems = new Set(
      (
        await this.dataSource.query(
          `SELECT stem FROM chem_train_items WHERE pool='test'`,
        )
      ).map((r: { stem: string }) => this.normStem(r.stem)),
    )

    let fillerDeactivated = 0
    let inserted = 0
    let skippedExisting = 0
    let skippedResolve = 0
    const insertedCodes: string[] = []

    await this.dataSource.transaction(async (manager) => {
      if (deactivateFiller) {
        const r: unknown = await manager.query(
          `UPDATE chem_train_items SET is_active=0,
             gate_note=CONCAT(IFNULL(gate_note,''),' | phase_a_deactivate_filler')
           WHERE code LIKE 'train.ai_trial.cov.%' AND is_active=1`,
        )
        const header = Array.isArray(r) ? (r as { affectedRows?: number }[])[0] : r
        fillerDeactivated = Number(
          (header as { affectedRows?: number })?.affectedRows ?? 0,
        )
      }

      for (const c of list) {
        if (existingCodes.has(c.code)) {
          skippedExisting++
          continue
        }
        if (existingStems.has(this.normStem(c.stem))) {
          skippedExisting++
          continue
        }
        const sp = specByCode.get(c.specialtyCode)
        const cat = catUnder.get(`${c.specialtyCode}:${c.categoryCode}`)
        if (!sp || !cat) {
          skippedResolve++
          continue
        }

        const item = manager.create(ChemTrainItem, {
          code: c.code,
          pool: 'test',
          qtype: c.qtype,
          answerType: c.answerType,
          stem: c.stem,
          optionsJson: c.options,
          answer: c.answer,
          answerAliasesJson: c.answerAliases,
          analysis: c.analysis,
          difficulty: c.difficulty,
          specialtyId: sp.id,
          categoryId: cat.id,
          status: 'approved',
          isActive: true,
          curriculumOk: true,
          verifyBlocked: false,
          banDefaultTrain: false,
          gateNote: `ai_trial phase_a template=${c.templateId} source=${c.sourceCode}`,
          createdBy: userId,
          updatedBy: userId,
        })
        const saved = await manager.save(item)
        await manager.insert(ChemTrainItemLink, {
          itemId: saved.id,
          entityType: c.sourceType,
          entityId: c.sourceId,
        })
        existingCodes.add(c.code)
        existingStems.add(this.normStem(c.stem))
        inserted++
        insertedCodes.push(c.code)
      }
    })

    this.previews.delete(dto.previewId)

    return {
      inserted,
      skippedExisting,
      skippedResolve,
      fillerDeactivated,
      confirmCountRequested: limit,
      candidateHad: store.candidates.length,
      insertedCodesSample: insertedCodes.slice(0, 30),
      note: '已写入 pool=test；未改知识正文/审核状态；filler 仅停用未删除',
    }
  }

  /** 统计利用率（只读） */
  async utilization() {
    const whitelist = this.loadWhitelist()
    const links: { entity_type: string; entity_id: string }[] =
      await this.dataSource.query(
        `SELECT entity_type, entity_id FROM chem_train_item_links`,
      )
    const usedKeys = new Set(
      links.map((l) => `${l.entity_type}:${l.entity_id}`),
    )
    const byType: Record<string, { total: number; used: number }> = {}
    for (const w of whitelist) {
      byType[w.type] = byType[w.type] || { total: 0, used: 0 }
      byType[w.type].total++
      if (usedKeys.has(`${w.type}:${w.dbId}`)) byType[w.type].used++
    }
    return { whitelistTotal: whitelist.length, byType }
  }

  private async buildAll(
    filters: GenFilters,
  ): Promise<{ candidates: GenCandidate[]; skipped: GenSkip[] }> {
    const fixSkip = this.loadFixSkip()
    const kbItems = await this.loadTrialKbItems(filters)
    const otherFormulas = kbItems
      .filter((i) => i.type === 'substance')
      .map((i) => str(i.row.canonical_formula))
      .filter(Boolean)
    const otherSymbols = kbItems
      .filter((i) => i.type === 'element')
      .map((i) => ({
        name: str(i.row.name_zh) || i.name,
        symbol: str(i.row.symbol),
      }))
      .filter((e) => e.symbol)

    const all: GenCandidate[] = []
    const skipped: GenSkip[] = []
    const angleSeen = new Set<string>()
    const fpSeen = new Set<string>()
    const stemSeen = new Set<string>()

    // DB 已有去重
    const dbItems: { code: string; stem: string; gate_note: string }[] =
      await this.dataSource.query(
        `SELECT code, stem, gate_note FROM chem_train_items WHERE pool='test'`,
      )
    for (const d of dbItems) {
      stemSeen.add(this.normStem(d.stem))
      if (d.code.startsWith('train.ai_trial.pa.')) {
        angleSeen.add(d.code)
      }
      const m = String(d.gate_note || '').match(
        /template=([^\s]+)\s+source=([^\s|]+)/,
      )
      if (m) angleSeen.add(`${m[2]}::${m[1]}`)
    }

    for (const item of kbItems) {
      const { candidates, skips } = buildCandidatesForItem(item, {
        fixSkip,
        otherFormulas,
        otherSymbols,
      })
      skipped.push(...skips)
      for (const c of candidates) {
        const qFail = qualityCheck(c)
        if (qFail) {
          skipped.push({
            sourceCode: c.sourceCode,
            sourceType: c.sourceType,
            templateId: c.templateId,
            reason: `质量检查失败：${qFail}`,
          })
          continue
        }
        if (filters.qtypes?.length && !filters.qtypes.includes(c.qtype)) {
          continue
        }
        if (
          filters.difficulties?.length &&
          !filters.difficulties.includes(c.difficulty)
        ) {
          continue
        }
        if (
          filters.specialtyCode &&
          c.specialtyCode !== filters.specialtyCode
        ) {
          continue
        }
        if (
          filters.categoryCode &&
          c.categoryCode !== filters.categoryCode
        ) {
          continue
        }

        if (angleSeen.has(c.angleKey) || angleSeen.has(c.code)) {
          skipped.push({
            sourceCode: c.sourceCode,
            templateId: c.templateId,
            reason: '同知识同考查角度已存在（含库内）',
          })
          continue
        }
        if (fpSeen.has(c.contentFingerprint)) {
          skipped.push({
            sourceCode: c.sourceCode,
            templateId: c.templateId,
            reason: '内容指纹重复（含仅调换选项顺序）',
          })
          continue
        }
        if (stemSeen.has(this.normStem(c.stem))) {
          skipped.push({
            sourceCode: c.sourceCode,
            templateId: c.templateId,
            reason: '题干重复',
          })
          continue
        }

        // 校验分类存在
        const okCat = await this.categoryExists(c.specialtyCode, c.categoryCode)
        if (!okCat) {
          skipped.push({
            sourceCode: c.sourceCode,
            templateId: c.templateId,
            reason: `分类不存在 ${c.specialtyCode}.${c.categoryCode}，拒绝挂靠`,
          })
          continue
        }

        angleSeen.add(c.angleKey)
        fpSeen.add(c.contentFingerprint)
        stemSeen.add(this.normStem(c.stem))
        all.push(c)
      }
    }

    // 按知识利用率优先：substance/knowledge/reaction 靠前
    const typePriority: Record<string, number> = {
      substance: 0,
      knowledge: 1,
      reaction: 2,
      element: 3,
      concept: 4,
      formula: 5,
      experiment: 6,
    }
    all.sort(
      (a, b) =>
        (typePriority[a.sourceType] ?? 9) - (typePriority[b.sourceType] ?? 9) ||
        a.sourceCode.localeCompare(b.sourceCode) ||
        a.templateId.localeCompare(b.templateId),
    )

    const target = filters.targetCount ?? MAX_PER_CONFIRM
    const sliced = all.slice(0, Math.min(target, all.length))
    if (sliced.length < (filters.targetCount || 0)) {
      skipped.push({
        sourceCode: '*',
        reason: `可用安全候选仅 ${all.length} 道，少于目标 ${filters.targetCount}；未复制凑数`,
      })
    }

    return { candidates: sliced, skipped }
  }

  private catCache: Set<string> | null = null
  private async categoryExists(spec: string, cat: string): Promise<boolean> {
    if (!this.catCache) {
      const rows: { sc: string; cc: string }[] = await this.dataSource.query(
        `SELECT s.code AS sc, c.code AS cc
         FROM chem_categories c
         JOIN chem_specialties s ON s.id=c.specialty_id`,
      )
      this.catCache = new Set(rows.map((r) => `${r.sc}:${r.cc}`))
    }
    return this.catCache.has(`${spec}:${cat}`)
  }

  private async loadTrialKbItems(filters: GenFilters): Promise<GenKbItem[]> {
    const whitelist = this.loadWhitelist()
    const selected = filters.sourceCodes?.length
      ? whitelist.filter((w) => filters.sourceCodes!.includes(w.code))
      : whitelist
    const typeFilter = filters.kbTypes?.length
      ? new Set(filters.kbTypes)
      : null
    const filtered = selected.filter(
      (w) => !typeFilter || typeFilter.has(w.type as GenKbType),
    )

    // 批量加载实体行
    const byType = new Map<string, { code: string; name?: string; dbId: string }[]>()
    for (const w of filtered) {
      if (!byType.has(w.type)) byType.set(w.type, [])
      byType.get(w.type)!.push(w)
    }
    const rowByKey = new Map<string, Record<string, unknown>>()
    for (const [type, list] of byType) {
      const table = KB_TABLE_BY_TYPE[type]
      if (!table || !list.length) continue
      const ids = list.map((x) => x.dbId)
      const rows: Record<string, unknown>[] = await this.dataSource.query(
        `SELECT * FROM ${table} WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids,
      )
      for (const r of rows) {
        rowByKey.set(`${type}:${r.id}`, r)
      }
    }

    const allIds = filtered.map((w) => w.dbId)
    const types = [...new Set(filtered.map((w) => w.type))]
    const specLinks: { entity_type: string; entity_id: string; code: string }[] =
      allIds.length
        ? await this.dataSource.query(
            `SELECT es.entity_type, es.entity_id, s.code
             FROM chem_entity_specialties es
             JOIN chem_specialties s ON s.id=es.specialty_id
             WHERE es.entity_type IN (${types.map(() => '?').join(',')})`,
            types,
          )
        : []
    const catLinks: {
      entity_type: string
      entity_id: string
      code: string
      sc: string
    }[] = allIds.length
      ? await this.dataSource.query(
          `SELECT ec.entity_type, ec.entity_id, c.code, s.code AS sc
           FROM chem_entity_categories ec
           JOIN chem_categories c ON c.id=ec.category_id
           JOIN chem_specialties s ON s.id=c.specialty_id
           WHERE ec.entity_type IN (${types.map(() => '?').join(',')})`,
          types,
        )
      : []

    const specsByKey = new Map<string, string[]>()
    for (const l of specLinks) {
      const k = `${l.entity_type}:${l.entity_id}`
      if (!specsByKey.has(k)) specsByKey.set(k, [])
      specsByKey.get(k)!.push(l.code)
    }
    const catsByKey = new Map<string, string[]>()
    for (const l of catLinks) {
      const k = `${l.entity_type}:${l.entity_id}`
      if (!catsByKey.has(k)) catsByKey.set(k, [])
      catsByKey.get(k)!.push(`${l.sc}.${l.code}`)
    }

    const out: GenKbItem[] = []
    for (const w of filtered) {
      const key = `${w.type}:${w.dbId}`
      const row = rowByKey.get(key)
      if (!row) continue
      out.push({
        code: w.code,
        type: w.type as GenKbType,
        name: w.name || str(row.name) || w.code,
        dbId: String(w.dbId),
        specialtyCodes: specsByKey.get(key) || [],
        categoryCodes: catsByKey.get(key) || [],
        row,
      })
    }
    return out
  }

  private loadWhitelist(): {
    code: string
    type: string
    name?: string
    dbId: string
  }[] {
    const p = this.resolveDoc(
      'docs/chemistry_deepseek_audit/publish_whitelist.json',
    )
    const data = JSON.parse(fs.readFileSync(p, 'utf8'))
    return (data.items || []).map(
      (i: { code: string; type: string; name?: string; dbId: string }) => ({
        code: i.code,
        type: i.type,
        name: i.name,
        dbId: String(i.dbId),
      }),
    )
  }

  private loadFixSkip(): Set<string> {
    const p = this.resolveDoc(
      'docs/chemistry_deepseek_audit/second_review/second_review_results.json',
    )
    if (!fs.existsSync(p)) return loadSecondReviewFixCodes([])
    const data = JSON.parse(fs.readFileSync(p, 'utf8'))
    return loadSecondReviewFixCodes(data.results || [])
  }

  private resolveDoc(rel: string): string {
    // 兼容：仓库根 / release/study-system/api 工作目录 / dist 相对路径
    const candidates = [
      path.resolve(process.cwd(), rel),
      path.resolve(process.cwd(), '..', rel), // release: api/ 的上一级
      path.resolve(process.cwd(), '../..', rel),
      path.resolve(__dirname, '../../../../../../', rel),
      path.resolve(__dirname, '../../../../../../../', rel),
    ]
    for (const c of candidates) {
      if (fs.existsSync(c)) return c
    }
    throw new BadRequestException(
      `找不到白名单文件 ${rel}（请将 docs/chemistry_deepseek_audit 放到与 api 同级的 docs/ 下）`,
    )
  }

  private statsOf(candidates: GenCandidate[], skipped: GenSkip[]) {
    const byKbType: Record<string, number> = {}
    const bySpecialty: Record<string, number> = {}
    const byQtype: Record<string, number> = {}
    const byDifficulty: Record<string, number> = {}
    const byTemplate: Record<string, number> = {}
    for (const c of candidates) {
      byKbType[c.sourceType] = (byKbType[c.sourceType] || 0) + 1
      bySpecialty[c.specialtyCode] = (bySpecialty[c.specialtyCode] || 0) + 1
      byQtype[c.qtype] = (byQtype[c.qtype] || 0) + 1
      byDifficulty[String(c.difficulty)] =
        (byDifficulty[String(c.difficulty)] || 0) + 1
      byTemplate[c.templateId] = (byTemplate[c.templateId] || 0) + 1
    }
    return {
      candidateCount: candidates.length,
      skipCount: skipped.length,
      byKbType,
      bySpecialty,
      byQtype,
      byDifficulty,
      byTemplate,
    }
  }

  private normStem(stem: string): string {
    return String(stem || '')
      .replace(/^【AI试运行】/, '')
      .replace(/\s+/g, '')
  }

  private purgeExpired() {
    const now = Date.now()
    for (const [k, v] of this.previews) {
      if (v.expiresAt < now) this.previews.delete(k)
    }
  }
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}
