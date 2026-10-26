import {
  BadRequestException,
  ConflictException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import * as crypto from 'crypto'
import { DataSource, EntityManager, In, Repository } from 'typeorm'
import { HS_MATH_GRADE_RULE_VERSION } from '../hs-math.constants'
import {
  ConfirmHsMathTrainItemsImportDto,
  PreviewHsMathTrainItemsImportDto,
} from '../dto/admin-train-item-import.dto'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathKnowledgePoint } from '../entities/hs-math-knowledge-point.entity'
import { HsMathMethod } from '../entities/hs-math-method.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { HsMathTrainItem } from '../entities/hs-math-train-item.entity'
import { HsMathTrainItemKp } from '../entities/hs-math-train-item-kp.entity'
import { HsMathTrainItemMethod } from '../entities/hs-math-train-item-method.entity'
import {
  HS_MATH_IMPORT_MAX_ITEMS,
  HS_MATH_IMPORT_PREVIEW_TTL_MS,
  type HsMathImportItem,
  type HsMathImportItemReport,
  type HsMathImportIssue,
} from '../types/import-protocol'
import {
  assertNonEmptyStem,
  validateAnswerPayload,
} from '../util/answer-payload.validate'
import { isHsMathDuplicateError } from '../util/db-error'
import {
  canonicalizeImportItem,
  fingerprintCanonicalItem,
  hashImportItems,
  signImportPreviewToken,
  verifyImportPreviewToken,
} from '../util/import-preview-token'
import { isMysqlNoSuchTableError } from '../util/hs-math-item-content-fingerprint'
import {
  assertValidSourceFields,
  normalizeSourceFields,
} from '../util/hs-math-source.validate'
import {
  normalizeStemForDedupe,
  validateImportItemStructure,
} from '../util/train-item-import.validate'

const MAX_BODY_CHARS = 900_000

/** 进程内已消费 nonce（幂等辅助；多实例以 DB 唯一约束为最终防线） */
const consumedNonces = new Map<string, number>()

function pruneNonces(now: number) {
  for (const [k, exp] of consumedNonces) {
    if (exp < now) consumedNonces.delete(k)
  }
}

@Injectable()
export class HsMathAdminTrainItemsImportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(HsMathTrainItem)
    private readonly itemsRepo: Repository<HsMathTrainItem>,
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
    @InjectRepository(HsMathKnowledgePoint)
    private readonly kpRepo: Repository<HsMathKnowledgePoint>,
    @InjectRepository(HsMathMethod)
    private readonly methodsRepo: Repository<HsMathMethod>,
  ) {}

  async preview(userId: string, dto: PreviewHsMathTrainItemsImportDto) {
    this.assertPayloadSize(dto.items)
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('items 不能为空')
    }
    if (dto.items.length > HS_MATH_IMPORT_MAX_ITEMS) {
      throw new PayloadTooLargeException(
        `单批最多 ${HS_MATH_IMPORT_MAX_ITEMS} 题`,
      )
    }

    const reports: HsMathImportItemReport[] = dto.items.map((raw, index) =>
      validateImportItemStructure(raw, index),
    )

    const normalized = dto.items.map((raw, i) =>
      this.normalizeItem(raw, reports[i]),
    ) as (HsMathImportItem | null)[]

    this.markBatchDupesOnReports(normalized, reports)

    await this.enrichWithDbChecks(normalized, reports, {
      treatExistingCodeAsError: true,
    })

    const canConfirm = reports.every((r) => r.ok && r.errors.length === 0)
    const contentHash = hashImportItems(dto.items)
    const now = Date.now()
    const exp = now + HS_MATH_IMPORT_PREVIEW_TTL_MS
    const nonce = crypto.randomBytes(16).toString('hex')

    let previewToken: string | null = null
    if (canConfirm) {
      previewToken = signImportPreviewToken(this.jwtSecret(), {
        v: 1,
        uid: String(userId),
        exp,
        hash: contentHash,
        n: nonce,
      })
    }

    return {
      canConfirm,
      previewToken,
      expiresAt: canConfirm ? new Date(exp).toISOString() : null,
      itemCount: dto.items.length,
      errorCount: reports.reduce((n, r) => n + r.errors.length, 0),
      warningCount: reports.reduce((n, r) => n + r.warnings.length, 0),
      items: reports.map((r, i) => ({
        ...r,
        preview: this.safePreviewFields(normalized[i]),
      })),
      notice:
        '结构合法不等于数学正确；确认入库仅写入 draft，批准前须人工审核。',
    }
  }

  async confirm(userId: string, dto: ConfirmHsMathTrainItemsImportDto) {
    this.assertPayloadSize(dto.items)
    if (!dto.previewToken?.trim()) {
      throw new BadRequestException('缺少 previewToken，请先预览')
    }
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('items 不能为空')
    }
    if (dto.items.length > HS_MATH_IMPORT_MAX_ITEMS) {
      throw new PayloadTooLargeException(
        `单批最多 ${HS_MATH_IMPORT_MAX_ITEMS} 题`,
      )
    }

    const contentHash = hashImportItems(dto.items)
    let claims
    try {
      claims = verifyImportPreviewToken(this.jwtSecret(), dto.previewToken, {
        userId: String(userId),
        contentHash,
      })
    } catch (e: any) {
      throw new BadRequestException(e?.message || '预览令牌无效')
    }

    const now = Date.now()
    pruneNonces(now)

    // 结构 + 批内重复（不把 CODE_EXISTS 当致命错误；幂等路径另行比对内容）
    const reports: HsMathImportItemReport[] = dto.items.map((raw, index) =>
      validateImportItemStructure(raw, index),
    )
    const normalized = dto.items.map((raw, i) =>
      this.normalizeItem(raw, reports[i]),
    ) as (HsMathImportItem | null)[]
    this.markBatchDupesOnReports(normalized, reports)

    if (reports.some((r) => !r.ok || r.errors.length > 0)) {
      throw new BadRequestException({
        message: '确认前结构校验失败，请重新预览',
        items: reports,
      })
    }

    const items = normalized as HsMathImportItem[]
    const codes = items.map((it) => it.code.trim())

    // 解析归属（章节/小节/KP），允许 code 已存在以便后续幂等比对
    await this.enrichWithDbChecks(normalized, reports, {
      treatExistingCodeAsError: false,
    })
    if (reports.some((r) => !r.ok || r.errors.length > 0)) {
      throw new BadRequestException({
        message: '确认前归属校验失败，请重新预览',
        items: reports,
      })
    }

    const existing = await this.itemsRepo.find({ where: { code: In(codes) } })
    if (existing.length > 0 && existing.length < codes.length) {
      throw new ConflictException(
        `部分 code 已存在，整批中止：${existing.map((e) => e.code).join(', ')}`,
      )
    }
    if (existing.length === codes.length) {
      const match = await this.assertExistingMatchesImport(existing, items)
      consumedNonces.set(claims.n, claims.exp)
      return {
        success: true,
        mode: 'idempotent' as const,
        successCount: match.length,
        failCount: 0,
        items: match,
        notice: '重复确认：内容一致，未再次写入。',
      }
    }

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const itemRepo = manager.getRepository(HsMathTrainItem)
        const linkRepo = manager.getRepository(HsMathTrainItemKp)
        const spRepo = manager.getRepository(HsMathSpecialty)
        const catRepo = manager.getRepository(HsMathCategory)
        const kpRepo = manager.getRepository(HsMathKnowledgePoint)

        // 事务内再读：防 TOCTOU（停用/并发插入）
        const raced = await itemRepo.find({ where: { code: In(codes) } })
        if (raced.length === codes.length) {
          const match = await this.assertExistingMatchesImport(
            raced,
            items,
            manager,
          )
          return { mode: 'idempotent' as const, created: match }
        }
        if (raced.length > 0) {
          throw new ConflictException(
            `部分 code 已存在，整批中止：${raced.map((e) => e.code).join(', ')}`,
          )
        }

        const created: Array<{ id: string; code: string; status: string }> = []
        for (let i = 0; i < items.length; i++) {
          const it = items[i]
          const rep = reports[i]
          const resolved = rep.resolved!

          const specialty = await spRepo.findOne({
            where: { id: resolved.specialtyId },
          })
          const category = await catRepo.findOne({
            where: { id: resolved.categoryId },
          })
          if (!specialty?.isActive || !category?.isActive) {
            throw new BadRequestException(
              `确认时章节/小节不可用：${it.code}`,
            )
          }
          if (String(category.specialtyId) !== String(specialty.id)) {
            throw new BadRequestException(
              `确认时小节归属变化：${it.code}`,
            )
          }
          const kps = await kpRepo.find({
            where: { id: In(resolved.knowledgePointIds) },
          })
          if (kps.length !== resolved.knowledgePointIds.length) {
            throw new BadRequestException(`确认时知识点缺失：${it.code}`)
          }
          for (const kp of kps) {
            if (!kp.isActive) {
              throw new BadRequestException(
                `确认时知识点已停用：${kp.code}`,
              )
            }
            if (String(kp.specialtyId) !== String(specialty.id)) {
              throw new BadRequestException(
                `确认时知识点章节不匹配：${kp.code}`,
              )
            }
          }

          const stem = assertNonEmptyStem(it.stem)
          const { optionsJson, answerPayload } = validateAnswerPayload({
            qtype: it.qtype,
            optionsJson: it.options ?? null,
            answerPayload: it.answerPayload,
          })

          const source = assertValidSourceFields(
            {
              sourceType: it.sourceType,
              sourceYear: it.sourceYear,
              sourceExamName: it.sourceExamName,
              sourceQuestionNo: it.sourceQuestionNo,
              sourceReference: it.sourceReference,
              sourceAdaptationNote: it.sourceAdaptationNote,
              sourceVerificationStatus: it.sourceVerificationStatus,
              sourceLicenseStatus: it.sourceLicenseStatus,
            },
            'persist',
          )

          const entity = itemRepo.create({
            code: it.code.trim(),
            pool: 'formal',
            qtype: it.qtype,
            stem,
            optionsJson,
            answerPayloadJson: answerPayload,
            analysis: it.analysis.trim(),
            difficulty: it.difficulty,
            specialtyId: resolved.specialtyId,
            categoryId: resolved.categoryId,
            knowledgePointId: resolved.primaryKnowledgePointId,
            sourceType: source.sourceType,
            sourceYear: source.sourceYear,
            sourceExamName: source.sourceExamName,
            sourceQuestionNo: source.sourceQuestionNo,
            sourceReference: source.sourceReference,
            sourceAdaptationNote: source.sourceAdaptationNote,
            sourceVerificationStatus: source.sourceVerificationStatus,
            sourceLicenseStatus: source.sourceLicenseStatus,
            status: 'draft',
            isActive: true,
            gradeRuleVersion: HS_MATH_GRADE_RULE_VERSION,
            contentVersion: 1,
            createdBy: userId,
            updatedBy: userId,
          })

          let saved: HsMathTrainItem
          try {
            saved = await itemRepo.save(entity)
          } catch (e) {
            if (isHsMathDuplicateError(e)) {
              throw new ConflictException(`题目 code 冲突：${it.code}`)
            }
            throw e
          }

          const links = resolved.knowledgePointIds.map((kid, idx) =>
            linkRepo.create({
              itemId: saved.id,
              knowledgePointId: kid,
              isPrimary: kid === resolved.primaryKnowledgePointId,
              sortOrder: (idx + 1) * 10,
            }),
          )
          await linkRepo.save(links)

          const methodIds = resolved.methodIds ?? []
          if (methodIds.length) {
            const methodLinkRepo = manager.getRepository(HsMathTrainItemMethod)
            const primaryMethodId = resolved.primaryMethodId ?? null
            const mLinks = methodIds.map((mid, idx) =>
              methodLinkRepo.create({
                itemId: saved.id,
                methodId: mid,
                isPrimary: primaryMethodId === mid,
                sortOrder: (idx + 1) * 10,
              }),
            )
            await methodLinkRepo.save(mLinks)
          }

          created.push({
            id: String(saved.id),
            code: saved.code,
            status: saved.status,
          })
        }

        return { mode: 'created' as const, created }
      })

      consumedNonces.set(claims.n, claims.exp)
      return {
        success: true,
        mode: result.mode,
        successCount: result.created.length,
        failCount: 0,
        items: result.created,
        notice:
          result.mode === 'idempotent'
            ? '重复确认：内容一致，未再次写入。'
            : '已全部写入 draft；未自动批准。请人工审核后批准。',
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e

      // 并发：本事务回滚后，若对端已完整写入且内容一致 → 幂等成功
      const maybeDup =
        isHsMathDuplicateError(e) ||
        (e instanceof ConflictException &&
          /code 冲突|部分 code 已存在|内容不一致/.test(
            String((e as any).message || ''),
          ))

      if (maybeDup || e instanceof ConflictException) {
        try {
          const again = await this.itemsRepo.find({
            where: { code: In(codes) },
          })
          if (again.length === codes.length) {
            const match = await this.assertExistingMatchesImport(again, items)
            consumedNonces.set(claims.n, claims.exp)
            return {
              success: true,
              mode: 'idempotent' as const,
              successCount: match.length,
              failCount: 0,
              items: match,
              notice: '并发/重复确认：内容一致，未再次写入。',
            }
          }
        } catch (inner) {
          if (inner instanceof ConflictException) throw inner
          if (inner instanceof BadRequestException) throw inner
        }
        if (e instanceof ConflictException) throw e
        throw new ConflictException('并发导入导致 code 冲突，整批已回滚')
      }
      throw e
    }
  }

  /**
   * 全部 code 已存在时：必须内容指纹一致才允许幂等成功。
   * code 相同但题干/答案/KP 等不同 → Conflict。
   */
  private async assertExistingMatchesImport(
    existing: HsMathTrainItem[],
    items: HsMathImportItem[],
    manager?: EntityManager,
  ): Promise<Array<{ id: string; code: string; status: string }>> {
    const linkRepo = manager
      ? manager.getRepository(HsMathTrainItemKp)
      : this.dataSource.getRepository(HsMathTrainItemKp)
    const spRepo = manager
      ? manager.getRepository(HsMathSpecialty)
      : this.specialtiesRepo
    const catRepo = manager
      ? manager.getRepository(HsMathCategory)
      : this.categoriesRepo
    const kpRepo = manager
      ? manager.getRepository(HsMathKnowledgePoint)
      : this.kpRepo

    const byCode = new Map(existing.map((e) => [e.code, e]))
    const out: Array<{ id: string; code: string; status: string }> = []

    for (const it of items) {
      const row = byCode.get(it.code.trim())
      if (!row) {
        throw new ConflictException(`幂等比对缺少 code：${it.code}`)
      }
      const [specialty, category, links] = await Promise.all([
        spRepo.findOne({ where: { id: row.specialtyId } }),
        catRepo.findOne({ where: { id: row.categoryId } }),
        linkRepo.find({ where: { itemId: row.id } }),
      ])
      const kps = links.length
        ? await kpRepo.find({
            where: { id: In(links.map((l) => l.knowledgePointId)) },
          })
        : []
      const kpMap = new Map(kps.map((k) => [String(k.id), k]))
      const kpCodes = links
        .map((l) => kpMap.get(String(l.knowledgePointId))?.code || '')
        .filter(Boolean)
        .sort()
      const primaryLink = links.find((l) => l.isPrimary)
      const primaryCode = primaryLink
        ? kpMap.get(String(primaryLink.knowledgePointId))?.code || ''
        : ''

      // 两侧均走答案协议规范化，避免 MySQL JSON / 缺省容差字段导致误冲突
      let dbNorm: { optionsJson: unknown; answerPayload: unknown }
      let importNorm: { optionsJson: unknown; answerPayload: unknown }
      try {
        dbNorm = validateAnswerPayload({
          qtype: row.qtype as any,
          optionsJson: row.optionsJson,
          answerPayload: row.answerPayloadJson,
        })
        importNorm = validateAnswerPayload({
          qtype: it.qtype,
          optionsJson: it.options ?? null,
          answerPayload: it.answerPayload,
        })
      } catch (e: any) {
        throw new ConflictException(
          `code 已存在但答案协议无法比对：${it.code}（${e?.message || 'invalid'}）`,
        )
      }

      let methodCodes: string[] = []
      let primaryMethodCode = ''
      try {
        const mLinkRepo = manager
          ? manager.getRepository(HsMathTrainItemMethod)
          : this.dataSource.getRepository(HsMathTrainItemMethod)
        const methodRepo = manager
          ? manager.getRepository(HsMathMethod)
          : this.methodsRepo
        const mLinks = await mLinkRepo.find({ where: { itemId: row.id } })
        if (mLinks.length) {
          const methods = await methodRepo.find({
            where: { id: In(mLinks.map((l) => l.methodId)) },
          })
          const mmap = new Map(methods.map((m) => [String(m.id), m]))
          methodCodes = mLinks
            .map((l) => mmap.get(String(l.methodId))?.code || '')
            .filter(Boolean)
            .sort()
          const p = mLinks.find((l) => l.isPrimary)
          primaryMethodCode = p
            ? mmap.get(String(p.methodId))?.code || ''
            : ''
        }
      } catch (e) {
        if (!isMysqlNoSuchTableError(e)) throw e
      }

      const src = normalizeSourceFields({
        sourceType: row.sourceType,
        sourceYear: row.sourceYear,
        sourceExamName: row.sourceExamName,
        sourceQuestionNo: row.sourceQuestionNo,
        sourceReference: row.sourceReference,
        sourceAdaptationNote: row.sourceAdaptationNote,
        sourceVerificationStatus: row.sourceVerificationStatus,
        sourceLicenseStatus: row.sourceLicenseStatus,
      })

      const dbCanon = canonicalizeImportItem({
        code: row.code,
        specialtyCode: specialty?.code || '',
        categoryCode: category?.code || '',
        qtype: row.qtype,
        difficulty: Number(row.difficulty),
        stem: String(row.stem || '').trim(),
        options: dbNorm.optionsJson ?? null,
        answerPayload: dbNorm.answerPayload,
        analysis: String(row.analysis || '').trim(),
        knowledgePointCodes: kpCodes,
        primaryKnowledgePointCode: primaryCode,
        pool: 'formal',
        sourceType: src.sourceType,
        sourceYear: src.sourceYear,
        sourceExamName: src.sourceExamName,
        sourceQuestionNo: src.sourceQuestionNo,
        sourceReference: src.sourceReference,
        sourceAdaptationNote: src.sourceAdaptationNote,
        sourceVerificationStatus: src.sourceVerificationStatus,
        sourceLicenseStatus: src.sourceLicenseStatus,
        methodCodes,
        primaryMethodCode,
      })
      const importCanon = canonicalizeImportItem({
        ...it,
        options: importNorm.optionsJson,
        answerPayload: importNorm.answerPayload,
        difficulty: Number(it.difficulty),
      })
      if (!dbCanon || !importCanon) {
        throw new ConflictException(`无法规范化导入项：${it.code}`)
      }
      dbCanon.difficulty = Number(dbCanon.difficulty)
      importCanon.difficulty = Number(importCanon.difficulty)
      if (
        fingerprintCanonicalItem(dbCanon) !==
        fingerprintCanonicalItem(importCanon)
      ) {
        throw new ConflictException(
          `code 已存在但内容不一致，拒绝幂等：${it.code}`,
        )
      }
      out.push({
        id: String(row.id),
        code: row.code,
        status: row.status,
      })
    }
    return out
  }

  private jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET')
  }

  private assertPayloadSize(items: unknown[]) {
    let size: number
    try {
      size = JSON.stringify(items).length
    } catch {
      throw new BadRequestException('JSON 无法序列化（可能过深嵌套）')
    }
    if (size > MAX_BODY_CHARS) {
      throw new PayloadTooLargeException('导入 JSON 体积过大')
    }
  }

  private normalizeItem(
    raw: unknown,
    report: HsMathImportItemReport,
  ): HsMathImportItem | null {
    if (!report.ok && report.errors.some((e) => e.code === 'NOT_OBJECT')) {
      return null
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
    const o = raw as Record<string, unknown>
    const methodCodes = Array.isArray(o.methodCodes)
      ? o.methodCodes.map((x) => String(x || '').trim()).filter(Boolean)
      : undefined
    return {
      code: typeof o.code === 'string' ? o.code.trim() : '',
      specialtyCode:
        typeof o.specialtyCode === 'string' ? o.specialtyCode.trim() : '',
      categoryCode:
        typeof o.categoryCode === 'string' ? o.categoryCode.trim() : '',
      qtype: o.qtype as HsMathImportItem['qtype'],
      difficulty: o.difficulty as HsMathImportItem['difficulty'],
      stem: typeof o.stem === 'string' ? o.stem : '',
      options: (o.options as HsMathImportItem['options']) ?? null,
      answerPayload: (o.answerPayload as Record<string, unknown>) || {},
      analysis: typeof o.analysis === 'string' ? o.analysis : '',
      knowledgePointCodes: Array.isArray(o.knowledgePointCodes)
        ? o.knowledgePointCodes.map((x) => String(x || '').trim()).filter(Boolean)
        : [],
      primaryKnowledgePointCode:
        typeof o.primaryKnowledgePointCode === 'string'
          ? o.primaryKnowledgePointCode.trim()
          : '',
      pool: 'formal',
      sourceType: o.sourceType as HsMathImportItem['sourceType'],
      sourceYear:
        o.sourceYear === undefined || o.sourceYear === null
          ? (o.sourceYear as null | undefined)
          : Number(o.sourceYear),
      sourceExamName:
        typeof o.sourceExamName === 'string' ? o.sourceExamName : undefined,
      sourceQuestionNo:
        typeof o.sourceQuestionNo === 'string'
          ? o.sourceQuestionNo
          : undefined,
      sourceReference:
        typeof o.sourceReference === 'string' ? o.sourceReference : undefined,
      sourceAdaptationNote:
        typeof o.sourceAdaptationNote === 'string'
          ? o.sourceAdaptationNote
          : undefined,
      sourceVerificationStatus:
        o.sourceVerificationStatus as HsMathImportItem['sourceVerificationStatus'],
      sourceLicenseStatus:
        o.sourceLicenseStatus as HsMathImportItem['sourceLicenseStatus'],
      methodCodes,
      primaryMethodCode:
        typeof o.primaryMethodCode === 'string'
          ? o.primaryMethodCode.trim()
          : o.primaryMethodCode == null
            ? null
            : undefined,
    }
  }

  private markBatchDupesOnReports(
    normalized: (HsMathImportItem | null)[],
    reports: HsMathImportItemReport[],
  ) {
    const codeMap = new Map<string, number>()
    const stemMap = new Map<string, number>()
    for (let i = 0; i < normalized.length; i++) {
      const it = normalized[i]
      const rep = reports[i]
      if (!it || !rep) continue
      if (it.code) {
        if (codeMap.has(it.code)) {
          this.pushErr(
            rep,
            'BATCH_CODE_DUP',
            `本批与第 ${codeMap.get(it.code)! + 1} 题 code 重复`,
          )
        } else codeMap.set(it.code, i)
      }
      const ns = normalizeStemForDedupe(it.stem)
      if (ns.length >= 8) {
        if (stemMap.has(ns)) {
          this.pushWarn(
            rep,
            'BATCH_STEM_DUP',
            `本批题干与第 ${stemMap.get(ns)! + 1} 题高度相似`,
          )
        } else stemMap.set(ns, i)
      }
    }
  }

  private async enrichWithDbChecks(
    normalized: (HsMathImportItem | null)[],
    reports: HsMathImportItemReport[],
    opts: { treatExistingCodeAsError: boolean },
  ) {
    const specialtyCodes = [
      ...new Set(
        normalized.filter(Boolean).map((x) => x!.specialtyCode).filter(Boolean),
      ),
    ]
    const specialties = specialtyCodes.length
      ? await this.specialtiesRepo.find({
          where: { code: In(specialtyCodes) },
        })
      : []
    const spByCode = new Map(specialties.map((s) => [s.code, s]))

    const allCats =
      specialties.length > 0
        ? await this.categoriesRepo.find({
            where: { specialtyId: In(specialties.map((s) => s.id)) },
          })
        : []
    const catKey = (spId: string, code: string) => `${spId}::${code}`
    const catByKey = new Map(
      allCats.map((c) => [catKey(String(c.specialtyId), c.code), c]),
    )

    const kpCodes = [
      ...new Set(
        normalized
          .filter(Boolean)
          .flatMap((x) => x!.knowledgePointCodes || [])
          .filter(Boolean),
      ),
    ]
    const kps = kpCodes.length
      ? await this.kpRepo.find({ where: { code: In(kpCodes) } })
      : []
    const kpByCode = new Map(kps.map((k) => [k.code, k]))

    const methodCodesAll = [
      ...new Set(
        normalized
          .filter(Boolean)
          .flatMap((x) => x!.methodCodes || [])
          .filter(Boolean),
      ),
    ]
    let methodByCode = new Map<string, HsMathMethod>()
    if (methodCodesAll.length) {
      try {
        const methods = await this.methodsRepo.find({
          where: { code: In(methodCodesAll) },
        })
        methodByCode = new Map(methods.map((m) => [m.code, m]))
      } catch (e) {
        if (isMysqlNoSuchTableError(e)) {
          for (let i = 0; i < normalized.length; i++) {
            const it = normalized[i]
            const rep = reports[i]
            if (it?.methodCodes?.length && rep) {
              this.pushErr(
                rep,
                'METHODS_TABLE_MISSING',
                '方法表尚未创建（MIGRATION_PENDING），无法导入 methodCodes',
              )
            }
          }
        } else {
          throw e
        }
      }
    }

    const itemCodes = [
      ...new Set(
        normalized.filter(Boolean).map((x) => x!.code).filter(Boolean),
      ),
    ]
    const existingItems = itemCodes.length
      ? await this.itemsRepo.find({
          where: { code: In(itemCodes) },
          select: ['id', 'code', 'stem'],
        })
      : []
    const existingCodeSet = new Set(existingItems.map((e) => e.code))
    const existingStemNorm = new Set(
      (
        await this.itemsRepo
          .createQueryBuilder('i')
          .select(['i.id', 'i.stem'])
          .take(8000)
          .getMany()
      )
        .map((r) => normalizeStemForDedupe(r.stem))
        .filter((s) => s.length >= 8),
    )

    for (let i = 0; i < normalized.length; i++) {
      const it = normalized[i]
      const rep = reports[i]
      if (!it || !rep) continue

      if (
        opts.treatExistingCodeAsError &&
        it.code &&
        existingCodeSet.has(it.code)
      ) {
        this.pushErr(rep, 'CODE_EXISTS', `题库已存在 code：${it.code}`)
      }

      const stemN = normalizeStemForDedupe(it.stem)
      if (stemN.length >= 8 && existingStemNorm.has(stemN)) {
        this.pushWarn(
          rep,
          'STEM_EXISTS',
          '题库中已有高度相似题干，请人工确认是否重复',
        )
      }

      const sp = spByCode.get(it.specialtyCode)
      if (!it.specialtyCode) {
        /* already structural */
      } else if (!sp) {
        this.pushErr(
          rep,
          'SPECIALTY_NOT_FOUND',
          `章节 code 不存在：${it.specialtyCode}`,
        )
      } else if (!sp.isActive) {
        this.pushErr(
          rep,
          'SPECIALTY_INACTIVE',
          `章节未启用：${it.specialtyCode}`,
        )
      }

      let cat: HsMathCategory | undefined
      if (sp && it.categoryCode) {
        cat = catByKey.get(catKey(String(sp.id), it.categoryCode))
        if (!cat) {
          this.pushErr(
            rep,
            'CATEGORY_NOT_FOUND',
            `小节 code 不存在或不属于该章节：${it.categoryCode}`,
          )
        } else if (!cat.isActive) {
          this.pushErr(
            rep,
            'CATEGORY_INACTIVE',
            `小节未启用：${it.categoryCode}`,
          )
        }
      }

      const resolvedKpIds: string[] = []
      let primaryId = ''
      for (const kc of it.knowledgePointCodes) {
        const kp = kpByCode.get(kc)
        if (!kp) {
          this.pushErr(rep, 'KP_NOT_FOUND', `知识点不存在：${kc}`)
          continue
        }
        if (!kp.isActive) {
          this.pushErr(rep, 'KP_INACTIVE', `知识点已停用：${kc}`)
          continue
        }
        if (sp && String(kp.specialtyId) !== String(sp.id)) {
          this.pushErr(
            rep,
            'KP_SPECIALTY_MISMATCH',
            `知识点 ${kc} 不属于章节 ${it.specialtyCode}`,
          )
          continue
        }
        if (cat && String(kp.categoryId) !== String(cat.id)) {
          this.pushWarn(
            rep,
            'KP_CATEGORY_DIFF',
            `知识点 ${kc} 所属小节与题目小节不一致（允许同章跨小节，请人工确认）`,
          )
        }
        resolvedKpIds.push(String(kp.id))
        if (kc === it.primaryKnowledgePointCode) {
          primaryId = String(kp.id)
        }
      }

      if (
        it.primaryKnowledgePointCode &&
        it.knowledgePointCodes.includes(it.primaryKnowledgePointCode) &&
        !primaryId &&
        kpByCode.has(it.primaryKnowledgePointCode)
      ) {
        /* already errored inactive */
      }

      const resolvedMethodIds: string[] = []
      let primaryMethodId: string | null = null
      const methodCodes = it.methodCodes || []
      for (const mc of methodCodes) {
        const m = methodByCode.get(mc)
        if (!m) {
          this.pushErr(rep, 'METHOD_NOT_FOUND', `方法 code 不存在：${mc}`)
          continue
        }
        if (!m.isActive) {
          this.pushErr(rep, 'METHOD_INACTIVE', `方法已停用：${mc}`)
          continue
        }
        resolvedMethodIds.push(String(m.id))
        if (it.primaryMethodCode && mc === it.primaryMethodCode) {
          primaryMethodId = String(m.id)
        }
      }

      if (sp && cat && resolvedKpIds.length && primaryId && rep.errors.length === 0) {
        rep.resolved = {
          specialtyId: String(sp.id),
          categoryId: String(cat.id),
          knowledgePointIds: resolvedKpIds,
          primaryKnowledgePointId: primaryId,
          methodIds: resolvedMethodIds,
          primaryMethodId,
        }
      }

      if (rep.errors.length) rep.ok = false
    }
  }

  private pushErr(
    rep: HsMathImportItemReport,
    code: string,
    message: string,
  ) {
    const issue: HsMathImportIssue = { level: 'error', code, message }
    rep.errors.push(issue)
    rep.ok = false
  }

  private pushWarn(
    rep: HsMathImportItemReport,
    code: string,
    message: string,
  ) {
    rep.warnings.push({ level: 'warning', code, message })
  }

  private safePreviewFields(it: HsMathImportItem | null) {
    if (!it) return null
    return {
      code: it.code,
      specialtyCode: it.specialtyCode,
      categoryCode: it.categoryCode,
      qtype: it.qtype,
      difficulty: it.difficulty,
      stem: it.stem,
      options: it.options ?? null,
      answerPayload: it.answerPayload,
      analysis: it.analysis,
      knowledgePointCodes: it.knowledgePointCodes,
      primaryKnowledgePointCode: it.primaryKnowledgePointCode,
      pool: it.pool ?? 'formal',
      sourceType: it.sourceType,
      sourceYear: it.sourceYear,
      sourceExamName: it.sourceExamName,
      sourceQuestionNo: it.sourceQuestionNo,
      sourceReference: it.sourceReference,
      sourceAdaptationNote: it.sourceAdaptationNote,
      sourceVerificationStatus: it.sourceVerificationStatus,
      sourceLicenseStatus: it.sourceLicenseStatus,
      methodCodes: it.methodCodes,
      primaryMethodCode: it.primaryMethodCode,
    }
  }
}
