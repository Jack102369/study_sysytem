import type {
  DiagramErrorCode,
  IndustrialDiagramDisplayRole,
  IndustrialDiagramEdgeType,
  IndustrialDiagramNodeType,
  IndustrialDiagramOrientation,
  IndustrialDiagramShapeHint,
  IndustrialDiagramToneHint,
} from './industrial-diagram.constants'

/** 受控图形样式提示 — 禁止任意 CSS/HTML/URL */
export type IndustrialDiagramPresentation = {
  shapeHint?: IndustrialDiagramShapeHint
  toneHint?: IndustrialDiagramToneHint
  emphasis?: boolean
}

/** 服务端节点内部引用（不得进入 Public） */
export type IndustrialDiagramNodeInternal = {
  materialId?: string | null
  stepId?: string | null
  reactionReference?: string | null
  /** 未知节点答案键，仅服务端 */
  unknownKey?: string | null
  /** 标准操作/物质名等，仅服务端 */
  answerLabel?: string | null
}

export type IndustrialDiagramNodeDefinition = {
  id: string
  type: IndustrialDiagramNodeType
  displayLabel: string
  displayRole: IndustrialDiagramDisplayRole
  presentation?: IndustrialDiagramPresentation
  internal: IndustrialDiagramNodeInternal
}

export type IndustrialDiagramEdgeDefinition = {
  id: string
  from: string
  to: string
  type: IndustrialDiagramEdgeType
  displayLabel?: string
  presentation?: IndustrialDiagramPresentation
}

export type IndustrialDiagramInternalReferences = {
  caseCode: string
  caseVersion: string
  caseContentHash: string
  notes?: string
}

export type IndustrialDiagramReviewMetadata = {
  chemicallyReviewed: boolean
  structureOnly: boolean
  notes?: string
}

/** 服务端完整流程图定义 — 含内部引用，禁止直发学生端 */
export type IndustrialDiagramDefinition = {
  schemaVersion: string
  diagramId: string
  caseCode: string
  caseVersion: string
  caseContentHash: string
  diagramVersion: string
  diagramContentHash: string
  title: string
  orientation: IndustrialDiagramOrientation
  nodes: IndustrialDiagramNodeDefinition[]
  edges: IndustrialDiagramEdgeDefinition[]
  internalReferences: IndustrialDiagramInternalReferences
  reviewMetadata: IndustrialDiagramReviewMetadata
}

export type IndustrialDiagramPublicNode = {
  id: string
  type: IndustrialDiagramNodeType
  displayLabel: string
  presentation?: IndustrialDiagramPresentation
}

export type IndustrialDiagramPublicEdge = {
  id: string
  from: string
  to: string
  type: IndustrialDiagramEdgeType
  displayLabel?: string
  presentation?: IndustrialDiagramPresentation
}

/** 学生端安全流程图 — 白名单字段 */
export type IndustrialDiagramPublic = {
  schemaVersion: string
  diagramId: string
  diagramVersion: string
  publicContentHash: string
  orientation: IndustrialDiagramOrientation
  title: string
  nodes: IndustrialDiagramPublicNode[]
  edges: IndustrialDiagramPublicEdge[]
}

export type DiagramIssue = {
  code: DiagramErrorCode
  path: string
  message: string
  severity: 'error' | 'warning'
}

export type IndustrialDiagramValidationResult = {
  valid: boolean
  errors: DiagramIssue[]
  warnings: DiagramIssue[]
}
