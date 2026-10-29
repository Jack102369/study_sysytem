import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemCategory } from '../chem-category.entity'
import { ChemTrainItem } from '../train/entities/chem-train-item.entity'
import { ChemWrongItem } from '../train/entities/chem-wrong-item.entity'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'
import { assertChemIndustrialExperimentEnabled } from './industrial-feature.config'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import {
  generateIndustrialAiCandidate,
  generateIndustrialAiCandidateWithMock,
} from './industrial-ai-generator.service'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import { createIndustrialReviewRecord } from './industrial-review.service'
import { listIndustrialReviewRecords } from './industrial-review.store'
import {
  loadIndustrialAiProviderConfig,
  summarizeConfig,
} from './industrial-ai-config'
import type { IndustrialAiGenerateRequest } from './industrial-ai-generator.types'

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * 工业实验错题 → AI 变式候选（STEP_11）。
 * 仅写入审核仓；禁止直接 formal；Mock 标记 developmentOnly。
 * 学生「开始变式训练」仍只能抽取题库中已审核合格变式。
 */
@Injectable()
export class IndustrialWrongVariationService {
  constructor(
    @InjectRepository(ChemWrongItem)
    private readonly wrongRepo: Repository<ChemWrongItem>,
    @InjectRepository(ChemTrainItem)
    private readonly itemsRepo: Repository<ChemTrainItem>,
    @InjectRepository(ChemSpecialty)
    private readonly specsRepo: Repository<ChemSpecialty>,
    @InjectRepository(ChemCategory)
    private readonly catsRepo: Repository<ChemCategory>,
  ) {}

  async requestCandidateFromWrong(
    userId: string,
    wrongItemId: string,
  ): Promise<{
    ok: boolean
    candidateId: string | null
    message: string
    developmentOnly: boolean
    generationSource: string
    formalImportBlocked: true
    reviewPath: string
    reusedExisting?: boolean
  }> {
    const wrong = await this.wrongRepo.findOne({
      where: { id: wrongItemId, userId },
    })
    if (!wrong) throw new NotFoundException('错题不存在')

    const item = await this.itemsRepo.findOne({ where: { id: wrong.itemId } })
    if (!item) throw new BadRequestException('原题不可用')

    assertChemIndustrialExperimentEnabled()
    const sp = await this.specsRepo.findOne({ where: { id: item.specialtyId } })
    if (!sp || sp.code !== INDUSTRIAL_SPECIALTY_CODE) {
      throw new BadRequestException('仅工业实验错题可申请工业 AI 变式候选')
    }
    const cat = await this.catsRepo.findOne({ where: { id: item.categoryId } })
    if (!cat) throw new BadRequestException('分类不可用')

    const sourceTag = `[wrong_variation_source:${wrongItemId}|item:${item.code}|user:${userId}]`
    const existing = this.findRecentOpenCandidate(sourceTag)
    if (existing) {
      return {
        ok: true,
        candidateId: existing.candidateId,
        message:
          '24 小时内已有同错题变式候选待审核，已复用该候选（防止无限重复生成）',
        developmentOnly: existing.developmentOnly,
        generationSource: existing.generationSource,
        formalImportBlocked: true,
        reviewPath: `/settings/chemistry-industrial-candidates`,
        reusedExisting: true,
      }
    }

    const industrialCase =
      ALL_CANDIDATE_CASES.find((c) =>
        (c.categoryCodes || []).includes(
          cat.code as (typeof c.categoryCodes)[number],
        ),
      ) || ALL_CANDIDATE_CASES[0]
    if (!industrialCase) {
      throw new BadRequestException('无可用工业案例 fixtures')
    }

    const cfg = summarizeConfig(loadIndustrialAiProviderConfig())
    const useMock = !cfg.enabled || !cfg.apiKeyConfigured
    const difficulty = Math.min(3, Math.max(1, Number(item.difficulty) || 1)) as
      | 1
      | 2
      | 3
    const qtype = (
      ['single', 'judge', 'blank'].includes(item.qtype) ? item.qtype : 'single'
    ) as IndustrialAiGenerateRequest['qtype']

    const req: IndustrialAiGenerateRequest = {
      specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
      categoryCode: cat.code,
      caseCode: industrialCase.caseCode,
      knowledgePoints: industrialCase.curriculumScope.knowledgePoints.slice(0, 4),
      difficulty,
      qtype,
      questionCount: 1,
      diagramRequired: true,
      generationMode: useMock ? 'development_test' : 'formal_candidate',
    }

    const gen = useMock
      ? await generateIndustrialAiCandidateWithMock(req, 'success_single', {
          writeFiles: false,
        })
      : await generateIndustrialAiCandidate(req, { writeFiles: false })

    if (!gen.ok || !gen.candidate || !gen.svg || !gen.diagramDefinition || !gen.publicDiagram) {
      throw new BadRequestException(
        `AI 变式生成失败：${gen.task.errorMessage || gen.task.errorCode || 'unknown'}`,
      )
    }

    const quality = await checkIndustrialCandidateQuality(
      {
        candidateId: gen.task.taskId,
        developmentOnly: useMock,
        categoryCode: cat.code,
        industrialCase,
        candidate: gen.candidate,
        definition: gen.diagramDefinition,
        publicDiagram: gen.publicDiagram,
        svg: gen.svg,
        renderReport: gen.renderReport!,
      },
      { useMockAiReviewer: true, writeReport: false },
    )

    const qualityBlocked =
      quality.overallStatus === 'failed_automatic_checks' ||
      quality.overallStatus === 'incomplete_verification' ||
      (quality.blockingIssues?.length ?? 0) > 0
    // unknown 不当作 pass；仍写入审核仓供管理员查看，但正式入库闸门保持拦截
    const record = createIndustrialReviewRecord({
      generationTaskId: gen.task.taskId,
      generationSource: useMock ? 'mock_generated' : 'ai_generated',
      developmentOnly: useMock,
      specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
      categoryCode: cat.code,
      industrialCase,
      candidate: {
        ...gen.candidate,
        explanation: `${gen.candidate.explanation}\n\n${sourceTag}`,
      },
      definition: gen.diagramDefinition,
      publicDiagram: gen.publicDiagram,
      svg: gen.svg,
      renderReport: gen.renderReport!,
      qualityReport: quality,
    })

    let message: string
    if (qualityBlocked) {
      message = `已写入审核仓但自动质检未通过（overall=${quality.overallStatus}）；unknown 不当作 pass；禁止正式入库`
    } else if (useMock) {
      message =
        '已生成 Mock 变式候选并进入审核仓（development_only；禁止正式入库）'
    } else {
      message =
        '已生成 AI 变式候选并进入审核仓；须人工审核并通过正式入库闸门后，方可进入学生变式抽题'
    }

    return {
      ok: true,
      candidateId: record.candidateId,
      message,
      developmentOnly: useMock,
      generationSource: useMock ? 'mock_generated' : 'ai_generated',
      formalImportBlocked: true,
      reviewPath: `/settings/chemistry-industrial-candidates`,
      reusedExisting: false,
    }
  }

  private findRecentOpenCandidate(sourceTag: string) {
    const cutoff = Date.now() - DEDUP_WINDOW_MS
    const rows = listIndustrialReviewRecords()
    return (
      rows.find((r) => {
        if (r.importedItemCode) return false
        if (r.humanDecision === 'reject') return false
        const t = new Date(r.createdAt).getTime()
        if (!Number.isFinite(t) || t < cutoff) return false
        return String(r.candidate?.explanation || '').includes(sourceTag)
      }) || null
    )
  }
}
