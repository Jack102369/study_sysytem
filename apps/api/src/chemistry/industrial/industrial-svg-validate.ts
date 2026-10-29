import type { IndustrialDiagramPublic } from './industrial-diagram.types'
import type { SvgLayoutResult } from './industrial-svg-types'
import {
  INDUSTRIAL_SVG_RENDERER_VERSION,
  type IndustrialSvgRenderReport,
} from './industrial-svg-types'

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function validateIndustrialSvgRender(
  diagram: IndustrialDiagramPublic,
  layout: SvgLayoutResult,
  svg: string,
): IndustrialSvgRenderReport {
  const errors: string[] = []
  const warnings = [...layout.warnings]

  const nodeCount = diagram.nodes.length
  const edgeCount = diagram.edges.length
  const drawnNodeCount = layout.nodes.length
  const drawnEdgeCount = layout.edges.length

  if (drawnNodeCount !== nodeCount) {
    errors.push(`NODE_COUNT_MISMATCH: input=${nodeCount} drawn=${drawnNodeCount}`)
  }
  if (drawnEdgeCount !== edgeCount) {
    errors.push(`EDGE_COUNT_MISMATCH: input=${edgeCount} drawn=${drawnEdgeCount}`)
  }

  const drawnIds = new Set(layout.nodes.map((n) => n.id))
  for (const n of diagram.nodes) {
    if (!drawnIds.has(n.id)) errors.push(`NODE_NOT_DRAWN: ${n.id}`)
  }
  const drawnEdges = new Set(layout.edges.map((e) => e.id))
  for (const e of diagram.edges) {
    if (!drawnEdges.has(e.id)) errors.push(`EDGE_NOT_DRAWN: ${e.id}`)
  }

  if (!(layout.width > 0) || !(layout.height > 0) || !Number.isFinite(layout.width)) {
    errors.push('INVALID_CANVAS_SIZE')
  }

  for (const n of layout.nodes) {
    if (![n.x, n.y, n.width, n.height].every(Number.isFinite)) {
      errors.push(`INVALID_NODE_GEOMETRY: ${n.id}`)
    }
    if (n.width <= 0 || n.height <= 0) errors.push(`INVALID_NODE_SIZE: ${n.id}`)
    if (n.x < 0 || n.y < 0 || n.x + n.width > layout.width + 1 || n.y + n.height > layout.height + 1) {
      warnings.push(`NODE_NEAR_OR_OUT_OF_VIEWBOX: ${n.id}`)
    }
  }

  for (let i = 0; i < layout.nodes.length; i++) {
    for (let j = i + 1; j < layout.nodes.length; j++) {
      if (boxesOverlap(layout.nodes[i], layout.nodes[j])) {
        errors.push(`NODE_OVERLAP_AFTER_LAYOUT: ${layout.nodes[i].id}/${layout.nodes[j].id}`)
      }
    }
  }

  for (const e of layout.edges) {
    if (e.points.length < 2) errors.push(`INVALID_EDGE_PATH: ${e.id}`)
    for (const p of e.points) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        errors.push(`INVALID_PATH_COORD: ${e.id}`)
        break
      }
    }
  }

  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    errors.push('SVG_MISSING_XMLNS')
  }
  if (!/viewBox="[^"]+"/.test(svg)) errors.push('SVG_MISSING_VIEWBOX')
  if (/<script[\s>]/i.test(svg) || /foreignObject/i.test(svg)) {
    errors.push('SVG_UNSAFE_CONTENT')
  }
  if (/\son\w+=/i.test(svg)) errors.push('SVG_EVENT_HANDLER')

  // 内部答案泄漏粗检
  const leakHints = [
    'answerLabel',
    'unknownKey',
    'internalReferences',
    'reviewMetadata',
    'caseContentHash',
  ]
  for (const h of leakHints) {
    if (svg.includes(h)) errors.push(`SVG_INTERNAL_LEAK: ${h}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      diagramId: diagram.diagramId,
      diagramVersion: diagram.diagramVersion,
      publicContentHash: diagram.publicContentHash,
      rendererVersion: INDUSTRIAL_SVG_RENDERER_VERSION,
      nodeCount,
      edgeCount,
      drawnNodeCount,
      drawnEdgeCount,
      canvasWidth: layout.width,
      canvasHeight: layout.height,
    },
  }
}
