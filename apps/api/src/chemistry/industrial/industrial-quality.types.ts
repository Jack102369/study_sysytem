import type { IndustrialCase } from './industrial-case.types'
import type {
  IndustrialDiagramDefinition,
  IndustrialDiagramPublic,
} from './industrial-diagram.types'
import type { IndustrialAiCandidateQuestion } from './industrial-ai-generator.types'
import type { IndustrialSvgRenderReport } from './industrial-svg-types'
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'
import type {
  IndustrialQualityDimension,
  IndustrialQualityOverallStatus,
  IndustrialQualitySeverity,
  IndustrialQualityStatus,
} from './industrial-quality.constants'

export type IndustrialQualityCheckResult = {
  checkCode: string
  dimension: IndustrialQualityDimension
  status: IndustrialQualityStatus
  severity: IndustrialQualitySeverity
  message: string
  evidence: string[]
  checkerVersion: string
  checkedAt: string
}

export type IndustrialQualitySummary = {
  total: number
  pass: number
  fail: number
  unknown: number
  criticalFail: number
  errorFail: number
  warningCount: number
}

export type IndustrialQualityReport = {
  reportId: string
  candidateId: string
  caseCode: string
  caseVersion: string
  caseContentHash: string
  diagramVersion: string
  diagramContentHash: string
  publicContentHash: string
  questionContentHash: string
  /** 覆盖题+案+图语义的统一审核内容哈希 */
  auditContentHash: string
  qualityVersion: string
  generatedAt: string
  checks: IndustrialQualityCheckResult[]
  summary: IndustrialQualitySummary
  blockingIssues: string[]
  warnings: string[]
  unknownIssues: string[]
  overallStatus: IndustrialQualityOverallStatus
  requiresHumanReview: true
  developmentOnly: boolean
  formalPublishEligible: boolean
  aiReviewStatus: 'executed' | 'not_executed' | 'failed' | 'mock'
  aiReviewProvider: string | null
  aiReviewNotes: string[]
}

export type IndustrialQualityCandidateBundle = {
  candidateId: string
  developmentOnly: boolean
  categoryCode?: string
  industrialCase: IndustrialCase
  candidate: IndustrialAiCandidateQuestion
  definition: IndustrialDiagramDefinition
  publicDiagram: IndustrialDiagramPublic
  svg: string
  renderReport: IndustrialSvgRenderReport
  /** STEP_13 可选装置图；缺省时不跑装置质检 */
  apparatusDefinition?: IndustrialApparatusDefinition | null
  /**
   * E2-B2：有效案例审核态（由 quality.service 注入）。
   * 用于 CURR_CASE_TRUST / CHEM_SOURCE_VERIFIED，避免改写参与 contentHash 的字段。
   */
  effectiveCaseReview?: {
    grantsEffectivePublishEligibility: boolean
    publishEligible: boolean
    effectiveReviewStatus: string
    effectiveSourceVerification: 'unverified' | 'verified' | 'incomplete'
  } | null
}

export type IndustrialQualityCheckOptions = {
  /** 案例审核覆盖层查找根（默认 process.cwd） */
  cwd?: string
  /** 是否运行 AI 辅助审查（默认 true；可用 Mock） */
  enableAiReview?: boolean
  /** 强制 mock AI 审查 */
  useMockAiReviewer?: boolean
  /** 写出 quality-report.json */
  writeReport?: boolean
  /** 候选目录（含 taskId） */
  outputDir?: string
  /** 最大耗时软限制（仅记录，不强制杀进程） */
  maxDurationMs?: number
}

export type MkCheckInput = {
  checkCode: string
  dimension: IndustrialQualityDimension
  status: IndustrialQualityStatus
  severity: IndustrialQualitySeverity
  message: string
  evidence?: string[]
}
