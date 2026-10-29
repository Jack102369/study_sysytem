import type { IndustrialAiCandidateQuestion } from './industrial-ai-generator.types'
import type { IndustrialCase } from './industrial-case.types'
import type {
  IndustrialDiagramDefinition,
  IndustrialDiagramPublic,
} from './industrial-diagram.types'
import type {
  IndustrialQualityCheckResult,
  IndustrialQualityReport,
} from './industrial-quality.types'
import type { IndustrialSvgRenderReport } from './industrial-svg-types'
import type {
  IndustrialApparatusDefinition,
  IndustrialApparatusPublic,
} from './industrial-apparatus.types'
import type { ApparatusSafetyReport } from './industrial-apparatus-safety'

export const INDUSTRIAL_REVIEW_STATUSES = [
  'generated',
  'pending_quality_review',
  'quality_checked',
  'pending_human_review',
  'needs_revision',
  'rejected',
  'approved_for_import',
  'imported',
] as const

export type IndustrialReviewStatus = (typeof INDUSTRIAL_REVIEW_STATUSES)[number]

export type IndustrialHumanDecision = 'approve' | 'reject' | 'needs_revision'

export type IndustrialReviewRecord = {
  candidateId: string
  generationTaskId: string
  /**
   * mock_generated：开发/验收 Mock，禁止 formal
   * ai_generated：HTTP AI 产物，仍须人审
   * manual_fixture：人工编写+程序渲染的正式候选准备材料，仍须人审；≠已批准正式题
   */
  generationSource: 'ai_generated' | 'mock_generated' | 'manual_fixture'
  developmentOnly: boolean
  specialtyCode: string
  categoryCode: string
  caseCode: string
  caseVersion: string
  caseContentHash: string
  caseReviewStatus: string
  reviewStatus: IndustrialReviewStatus
  candidate: IndustrialAiCandidateQuestion
  definition: IndustrialDiagramDefinition
  publicDiagram: IndustrialDiagramPublic
  svg: string
  svgContentHash: string
  /** 相对 uploads 的不可变路径，如 industrial-svg/<hash>.svg */
  svgRelativePath: string
  renderReport: IndustrialSvgRenderReport
  qualityReport: IndustrialQualityReport | null
  auditContentHash: string | null
  humanDecision: IndustrialHumanDecision | null
  humanReviewNote: string | null
  humanReviewedBy: string | null
  humanReviewedAt: string | null
  humanReviewedAuditHash: string | null
  importedItemCode: string | null
  importedAt: string | null
  createdAt: string
  updatedAt: string
  revision: number
  /** STEP_13：可选装置副图（与流程图共存；入库写第二条 D043 资产） */
  apparatusDefinition?: IndustrialApparatusDefinition | null
  apparatusPublic?: IndustrialApparatusPublic | null
  apparatusSvg?: string | null
  apparatusSvgContentHash?: string | null
  /** 装置 SVG 不可变相对路径；缺省时入库前会落盘 */
  apparatusSvgRelativePath?: string | null
  apparatusSafety?: ApparatusSafetyReport | null
  apparatusQualityChecks?: IndustrialQualityCheckResult[] | null
}

export type IndustrialReviewListItem = {
  candidateId: string
  caseCode: string
  categoryCode: string
  qtype: string
  difficulty: number
  generationSource: string
  developmentOnly: boolean
  reviewStatus: IndustrialReviewStatus
  createdAt: string
  updatedAt: string
  formalPublishEligible: boolean
  qualityOverall: string | null
  blockingCount: number
  warningCount: number
  unknownCount: number
  svgContentHash: string
}

export type IndustrialFormalImportGateResult = {
  ok: boolean
  blockers: string[]
  warnings: string[]
  mappedPreview: {
    code: string
    pool: 'test' | 'formal'
    status: 'draft' | 'approved'
    curriculumOk: boolean
    verifyBlocked: boolean
    banDefaultTrain: boolean
    gateNote: string
    svgContentHash: string
  } | null
}

export type IndustrialFormalImportResult = {
  ok: boolean
  dryRun: boolean
  gates: IndustrialFormalImportGateResult
  itemCode: string | null
  itemId: string | null
  assetId?: string | null
  /** 双图入库时全部资产 id（主图 + 装置副图） */
  assetIds?: string[]
  reusedExisting?: boolean
  message: string
}

export type IndustrialReviewPatchInput = {
  expectedRevision: number
  stem?: string
  options?: string[] | null
  answer?: string | boolean | string[]
  explanation?: string
  knowledgePoints?: string[]
  difficulty?: 1 | 2 | 3
  /** 可选：替换 Definition（将触发 Public/SVG/质检重算） */
  definition?: IndustrialDiagramDefinition
}

export type CreateReviewFromGenerateInput = {
  generationTaskId: string
  generationSource: 'ai_generated' | 'mock_generated' | 'manual_fixture'
  developmentOnly: boolean
  specialtyCode: string
  categoryCode: string
  industrialCase: IndustrialCase
  candidate: IndustrialAiCandidateQuestion
  definition: IndustrialDiagramDefinition
  publicDiagram: IndustrialDiagramPublic
  svg: string
  renderReport: IndustrialSvgRenderReport
  qualityReport?: IndustrialQualityReport | null
}
