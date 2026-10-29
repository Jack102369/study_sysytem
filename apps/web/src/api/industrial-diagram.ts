/**
 * 工业流程图公共协议（与后端 IndustrialDiagramPublic 对齐）。
 * 仅含 Public 字段，禁止 Definition 内部答案字段。
 */

export const INDUSTRIAL_DIAGRAM_SCHEMA_VERSION = '1.0' as const

export type IndustrialDiagramOrientation = 'left_to_right' | 'top_to_bottom'

export type IndustrialDiagramNodeType =
  | 'material'
  | 'process'
  | 'reaction'
  | 'separation'
  | 'intermediate'
  | 'product'
  | 'waste'
  | 'unknown'

export type IndustrialDiagramEdgeType =
  | 'material_flow'
  | 'reagent_input'
  | 'condition'
  | 'recycle'
  | 'byproduct'

export type IndustrialDiagramPresentation = {
  shapeHint?: string
  toneHint?: string
  emphasis?: boolean
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

/** 学生端安全流程图（无 internal / answer / review） */
export type IndustrialDiagramPublic = {
  schemaVersion: typeof INDUSTRIAL_DIAGRAM_SCHEMA_VERSION | string
  diagramId: string
  diagramVersion: string
  publicContentHash: string
  orientation: IndustrialDiagramOrientation
  title: string
  nodes: IndustrialDiagramPublicNode[]
  edges: IndustrialDiagramPublicEdge[]
}

export type IndustrialSvgRenderReport = {
  valid: boolean
  errors: string[]
  warnings: string[]
  metrics: {
    diagramId: string
    diagramVersion: string
    publicContentHash: string
    rendererVersion: string
    nodeCount: number
    edgeCount: number
    drawnNodeCount: number
    drawnEdgeCount: number
    canvasWidth: number
    canvasHeight: number
  }
}

export type IndustrialSvgDisplayPayload = {
  svg: string
  width: number
  height: number
  viewBox: string
  renderReport: IndustrialSvgRenderReport
  publicContentHash: string
}
