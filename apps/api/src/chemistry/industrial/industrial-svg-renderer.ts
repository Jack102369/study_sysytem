import type { IndustrialDiagramPublic } from './industrial-diagram.types'
import { validateIndustrialDiagramPublic } from './industrial-diagram.validate'
import { escapeSvgText, sanitizeSvgCoord } from './industrial-svg-escape'
import { layoutIndustrialDiagram } from './industrial-svg-layout'
import {
  INDUSTRIAL_SVG_RENDERER_VERSION,
  type IndustrialSvgRenderResult,
  type RenderIndustrialDiagramSvgOptions,
  type SvgLayoutNode,
} from './industrial-svg-types'
import { validateIndustrialSvgRender } from './industrial-svg-validate'

type NodeStyle = {
  fill: string
  stroke: string
  strokeWidth: number
  rx: number
  dash?: string
  shape: 'rect' | 'round' | 'double' | 'dashed'
}

const NODE_STYLES: Record<string, NodeStyle> = {
  material: { fill: '#ffffff', stroke: '#334155', strokeWidth: 1.5, rx: 2, shape: 'rect' },
  process: { fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 1.5, rx: 10, shape: 'round' },
  reaction: { fill: '#fff7ed', stroke: '#9a3412', strokeWidth: 2.2, rx: 4, shape: 'double' },
  separation: { fill: '#f0f9ff', stroke: '#0369a1', strokeWidth: 1.8, rx: 4, shape: 'rect' },
  intermediate: { fill: '#fafafa', stroke: '#57534e', strokeWidth: 1.5, rx: 2, dash: '4 2', shape: 'dashed' },
  product: { fill: '#ecfdf5', stroke: '#166534', strokeWidth: 2.2, rx: 2, shape: 'double' },
  waste: { fill: '#fafafa', stroke: '#78716c', strokeWidth: 1.5, rx: 2, dash: '6 3', shape: 'dashed' },
  unknown: { fill: '#fffbeb', stroke: '#b45309', strokeWidth: 2, rx: 0, dash: '5 3', shape: 'dashed' },
}

type EdgeStyle = {
  stroke: string
  strokeWidth: number
  dash?: string
  marker: string
}

const EDGE_STYLES: Record<string, EdgeStyle> = {
  material_flow: { stroke: '#0f172a', strokeWidth: 1.6, marker: 'arrow' },
  reagent_input: { stroke: '#0369a1', strokeWidth: 1.4, dash: '4 2', marker: 'arrow' },
  condition: { stroke: '#64748b', strokeWidth: 1.2, dash: '2 3', marker: 'arrow-open' },
  recycle: { stroke: '#7c3aed', strokeWidth: 1.6, dash: '6 3', marker: 'arrow' },
  byproduct: { stroke: '#78716c', strokeWidth: 1.4, dash: '5 2', marker: 'arrow' },
}

function nodeTypeOf(diagram: IndustrialDiagramPublic, id: string): string {
  return diagram.nodes.find((n) => n.id === id)?.type || 'material'
}

function drawNode(n: SvgLayoutNode, type: string): string {
  const st = NODE_STYLES[type] || NODE_STYLES.material
  const x = sanitizeSvgCoord(n.x)
  const y = sanitizeSvgCoord(n.y)
  const w = sanitizeSvgCoord(n.width)
  const h = sanitizeSvgCoord(n.height)
  const dash = st.dash ? ` stroke-dasharray="${st.dash}"` : ''
  const parts: string[] = []
  parts.push(
    `<rect data-node-id="${escapeSvgText(n.id)}" data-node-type="${escapeSvgText(type)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${st.rx}" fill="${st.fill}" stroke="${st.stroke}" stroke-width="${st.strokeWidth}"${dash}/>`,
  )
  if (st.shape === 'double') {
    parts.push(
      `<rect x="${sanitizeSvgCoord(x + 3)}" y="${sanitizeSvgCoord(y + 3)}" width="${sanitizeSvgCoord(w - 6)}" height="${sanitizeSvgCoord(h - 6)}" rx="${Math.max(0, st.rx - 1)}" fill="none" stroke="${st.stroke}" stroke-width="1"/>`,
    )
  }
  const lineH = 16
  const startY = y + (h - n.lines.length * lineH) / 2 + lineH * 0.75
  n.lines.forEach((line, i) => {
    const ty = sanitizeSvgCoord(startY + i * lineH)
    parts.push(
      `<text x="${sanitizeSvgCoord(x + w / 2)}" y="${ty}" text-anchor="middle" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="12" fill="#0f172a">${escapeSvgText(line)}</text>`,
    )
  })
  return `<g id="node-${escapeSvgText(n.id)}">${parts.join('')}</g>`
}

function pointsToPath(points: { x: number; y: number }[]): string {
  if (!points.length) return ''
  const [p0, ...rest] = points
  return (
    `M ${sanitizeSvgCoord(p0.x)} ${sanitizeSvgCoord(p0.y)} ` +
    rest.map((p) => `L ${sanitizeSvgCoord(p.x)} ${sanitizeSvgCoord(p.y)}`).join(' ')
  )
}

function markersDefs(): string {
  return `<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a"/>
  </marker>
  <marker id="arrow-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#64748b" stroke-width="1.5"/>
  </marker>
  <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0369a1"/>
  </marker>
  <marker id="arrow-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed"/>
  </marker>
  <marker id="arrow-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#78716c"/>
  </marker>
</defs>`
}

function markerFor(type: string): string {
  if (type === 'reagent_input') return 'url(#arrow-blue)'
  if (type === 'recycle') return 'url(#arrow-purple)'
  if (type === 'byproduct') return 'url(#arrow-muted)'
  if (type === 'condition') return 'url(#arrow-open)'
  return 'url(#arrow)'
}

/**
 * 仅消费 IndustrialDiagramPublic → SVG + 渲染报告。
 * 不调用 project；不访问 DB/AI。
 */
export function renderIndustrialDiagramSvg(
  raw: unknown,
  options: RenderIndustrialDiagramSvgOptions = {},
): IndustrialSvgRenderResult {
  const validation = validateIndustrialDiagramPublic(raw)
  if (!validation.valid) {
    const errs = options.skipHashCheck
      ? validation.errors.filter((e) => !e.message.includes('hash'))
      : validation.errors
    if (errs.length) {
      throw new Error(
        `INVALID_PUBLIC_DIAGRAM: ${errs.map((e) => `${e.code}:${e.path}:${e.message}`).join('; ')}`,
      )
    }
  }

  const diagram = raw as IndustrialDiagramPublic
  const layout = layoutIndustrialDiagram(diagram)

  const title = escapeSvgText(diagram.title)
  const nodeSvg = layout.nodes
    .map((n) => drawNode(n, nodeTypeOf(diagram, n.id)))
    .join('')

  const edgeSvg = layout.edges
    .map((e) => {
      const st = EDGE_STYLES[e.type] || EDGE_STYLES.material_flow
      const dash = st.dash ? ` stroke-dasharray="${st.dash}"` : ''
      const d = pointsToPath(e.points)
      const label =
        e.label && e.labelX != null && e.labelY != null
          ? `<text x="${sanitizeSvgCoord(e.labelX)}" y="${sanitizeSvgCoord(e.labelY)}" text-anchor="middle" font-size="10" fill="#475569" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">${escapeSvgText(e.label)}</text>`
          : ''
      return `<g data-edge-id="${escapeSvgText(e.id)}" data-edge-type="${escapeSvgText(e.type)}"><path d="${d}" fill="none" stroke="${st.stroke}" stroke-width="${st.strokeWidth}" marker-end="${markerFor(e.type)}"${dash}/>${label}</g>`
    })
    .join('')

  const w = layout.width
  const h = layout.height
  const viewBox = `0 0 ${w} ${h}`
  const svg =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}" role="img" aria-label="${title}" data-renderer="${INDUSTRIAL_SVG_RENDERER_VERSION}" data-diagram-id="${escapeSvgText(diagram.diagramId)}" data-public-hash="${escapeSvgText(diagram.publicContentHash)}">` +
    markersDefs() +
    `<title>${title}</title>` +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>` +
    edgeSvg +
    nodeSvg +
    `</svg>`

  const renderReport = validateIndustrialSvgRender(diagram, layout, svg)

  return {
    svg,
    width: w,
    height: h,
    viewBox,
    renderReport,
    publicContentHash: diagram.publicContentHash,
  }
}
