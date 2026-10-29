import type { IndustrialDiagramPublic } from './industrial-diagram.types'

export const INDUSTRIAL_SVG_RENDERER_VERSION = '1.0.0' as const

export type SvgLayoutNode = {
  id: string
  x: number
  y: number
  width: number
  height: number
  cx: number
  cy: number
  layer: number
  indexInLayer: number
  lines: string[]
}

export type SvgLayoutEdge = {
  id: string
  type: string
  points: { x: number; y: number }[]
  label?: string
  labelX?: number
  labelY?: number
}

export type SvgLayoutResult = {
  nodes: SvgLayoutNode[]
  edges: SvgLayoutEdge[]
  width: number
  height: number
  warnings: string[]
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

export type IndustrialSvgRenderResult = {
  svg: string
  width: number
  height: number
  viewBox: string
  renderReport: IndustrialSvgRenderReport
  publicContentHash: string
}

export type RenderIndustrialDiagramSvgOptions = {
  /** 仅用于自检注入；生产勿用 */
  skipHashCheck?: boolean
}

export type { IndustrialDiagramPublic }
