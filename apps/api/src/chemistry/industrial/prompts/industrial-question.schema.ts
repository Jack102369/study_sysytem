/**
 * AI 输出 Schema 说明（程序侧权威；模型不得伪造审核字段）。
 * 实际校验见 industrial-ai-generator.validate.ts
 */

export const INDUSTRIAL_AI_OUTPUT_SCHEMA_VERSION = '1.0' as const

export const INDUSTRIAL_AI_OUTPUT_REQUIRED_KEYS = [
  'schemaVersion',
  'question',
  'answer',
  'explanation',
  'difficulty',
  'qtype',
  'knowledgePoints',
  'caseReferences',
  'diagramDefinition',
  'generationNotes',
] as const

export type IndustrialAiQuestionBlock = {
  stem: string
  options?: string[] | null
  answerType: 'single' | 'judge' | 'blank'
  /** 题干引用的流程图节点 displayLabel / id（可选） */
  referencedNodeIds?: string[]
  referencedLabels?: string[]
}

export type IndustrialAiCaseReferences = {
  caseCode: string
  caseVersion: string
  /** 模型可声称，但程序会用案例真实 hash 覆盖 */
  caseContentHash?: string
}

/**
 * diagramDefinition 片段：仅允许拓扑与展示字段。
 * 程序将剥离并重写：diagramContentHash / caseContentHash / reviewMetadata / internal 审核伪造。
 */
export type IndustrialAiDiagramFragment = {
  diagramId: string
  diagramVersion: string
  title: string
  orientation: 'left_to_right' | 'top_to_bottom'
  nodes: Array<{
    id: string
    type: string
    displayLabel: string
    displayRole?: string
    presentation?: Record<string, unknown>
    internal?: {
      materialId?: string
      stepId?: string
      reactionReference?: string
      unknownKey?: string
      answerLabel?: string
    }
  }>
  edges: Array<{
    id: string
    from: string
    to: string
    type: string
    displayLabel?: string
    presentation?: Record<string, unknown>
  }>
}

export type IndustrialAiRawOutput = {
  schemaVersion: string
  question: IndustrialAiQuestionBlock
  answer: string | boolean | string[]
  explanation: string
  difficulty: 1 | 2 | 3
  qtype: 'single' | 'judge' | 'blank'
  knowledgePoints: string[]
  caseReferences: IndustrialAiCaseReferences
  diagramDefinition: IndustrialAiDiagramFragment
  generationNotes?: string
  requiresManualReview?: boolean
}
