import type { IndustrialCase } from './industrial-case.types'
import type { IndustrialDiagramDefinition, IndustrialDiagramPublic } from './industrial-diagram.types'
import type { IndustrialSvgRenderReport } from './industrial-svg-types'
import type { IndustrialAiProviderKind, IndustrialAiTokenUsage } from './industrial-ai-provider.types'
import type { IndustrialAiRawOutput } from './prompts/industrial-question.schema'

export const INDUSTRIAL_AI_QTYPES = ['single', 'judge', 'blank'] as const
export type IndustrialAiQtype = (typeof INDUSTRIAL_AI_QTYPES)[number]

export const INDUSTRIAL_AI_GENERATION_MODES = [
  'formal_candidate',
  'development_test',
] as const
export type IndustrialAiGenerationMode = (typeof INDUSTRIAL_AI_GENERATION_MODES)[number]

export const INDUSTRIAL_AI_TASK_STATUSES = [
  'generated',
  'structure_validated',
  'render_validated',
  'pending_quality_review',
  'generation_failed',
  'development_only',
] as const
export type IndustrialAiTaskStatus = (typeof INDUSTRIAL_AI_TASK_STATUSES)[number]

export type IndustrialAiGenerateRequest = {
  specialtyCode: string
  categoryCode: string
  caseCode: string
  knowledgePoints: string[]
  difficulty: 1 | 2 | 3
  qtype: IndustrialAiQtype
  questionCount: number
  diagramRequired: boolean
  generationMode: IndustrialAiGenerationMode
}

export type IndustrialAiCandidateQuestion = {
  stem: string
  options: string[] | null
  answerType: IndustrialAiQtype
  answer: string | boolean | string[]
  explanation: string
  difficulty: 1 | 2 | 3
  qtype: IndustrialAiQtype
  knowledgePoints: string[]
  requiresManualReview: boolean
  referencedNodeIds: string[]
  referencedLabels: string[]
}

export type IndustrialAiValidationStageResult = {
  stage: string
  ok: boolean
  errors: string[]
  warnings: string[]
}

export type IndustrialAiTaskMetadata = {
  taskId: string
  provider: IndustrialAiProviderKind
  model: string
  generationMode: IndustrialAiGenerationMode
  caseCode: string
  caseVersion: string
  caseContentHash: string
  categoryCode: string
  difficulty: 1 | 2 | 3
  qtype: IndustrialAiQtype
  startedAt: string
  finishedAt: string
  durationMs: number
  status: IndustrialAiTaskStatus
  retryCount: number
  validationResults: IndustrialAiValidationStageResult[]
  errorCode: string | null
  errorMessage: string | null
  tokenUsage: IndustrialAiTokenUsage | { available: false }
  developmentOnly: boolean
  generationSource: 'ai_generated' | 'mock_generated'
}

export type IndustrialAiGenerateResult = {
  ok: boolean
  task: IndustrialAiTaskMetadata
  candidate: IndustrialAiCandidateQuestion | null
  diagramDefinition: IndustrialDiagramDefinition | null
  publicDiagram: IndustrialDiagramPublic | null
  svg: string | null
  renderReport: IndustrialSvgRenderReport | null
  rawOutput: IndustrialAiRawOutput | null
  outputDir: string | null
  industrialCaseSnapshot: {
    caseCode: string
    caseVersion: string
    contentHash: string
    reviewStatus: IndustrialCase['reviewStatus']
  } | null
}

export type IndustrialAiGenerateOptions = {
  /** 注入案例；缺省从 fixtures 按 caseCode 查找 */
  industrialCase?: IndustrialCase
  /** 强制 mock 场景 */
  mockScenario?: string
  /** 是否写出候选文件 */
  writeFiles?: boolean
  /** 候选根目录覆盖 */
  candidatesRoot?: string
  /** 最大模型调用次数（含首次） */
  maxModelAttempts?: number
}
