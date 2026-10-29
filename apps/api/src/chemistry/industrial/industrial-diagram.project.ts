import { computePublicContentHash } from './industrial-diagram.hash'
import type {
  IndustrialDiagramDefinition,
  IndustrialDiagramPresentation,
  IndustrialDiagramPublic,
  IndustrialDiagramPublicEdge,
  IndustrialDiagramPublicNode,
} from './industrial-diagram.types'

function projectPresentation(
  p?: IndustrialDiagramPresentation,
): IndustrialDiagramPresentation | undefined {
  if (!p) return undefined
  const out: IndustrialDiagramPresentation = {}
  if (p.shapeHint) out.shapeHint = p.shapeHint
  if (p.toneHint) out.toneHint = p.toneHint
  if (p.emphasis === true) out.emphasis = true
  return Object.keys(out).length ? out : undefined
}

/**
 * 白名单构造学生端安全流程图。
 * 禁止：展开 Definition 后删字段；禁止残留 internal / review / answer。
 */
export function projectIndustrialDiagramPublic(
  def: IndustrialDiagramDefinition,
): IndustrialDiagramPublic {
  const nodes: IndustrialDiagramPublicNode[] = def.nodes.map((n) => {
    const node: IndustrialDiagramPublicNode = {
      id: n.id,
      type: n.type,
      displayLabel: n.displayLabel,
    }
    const pres = projectPresentation(n.presentation)
    if (pres) node.presentation = pres
    return node
  })

  const edges: IndustrialDiagramPublicEdge[] = def.edges.map((e) => {
    const edge: IndustrialDiagramPublicEdge = {
      id: e.id,
      from: e.from,
      to: e.to,
      type: e.type,
    }
    if (e.displayLabel) edge.displayLabel = e.displayLabel
    const pres = projectPresentation(e.presentation)
    if (pres) edge.presentation = pres
    return edge
  })

  const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
    schemaVersion: def.schemaVersion,
    diagramId: def.diagramId,
    diagramVersion: def.diagramVersion,
    orientation: def.orientation,
    title: def.title,
    nodes,
    edges,
  }

  return {
    ...draft,
    publicContentHash: computePublicContentHash(draft),
  }
}

/** 深度扫描公共 JSON 是否残留敏感键名 */
export function scanPublicForLeakRisk(publicJson: unknown): string[] {
  const forbidden = [
    'internal',
    'internalReferences',
    'reviewMetadata',
    'answerLabel',
    'unknownKey',
    'caseStepReference',
    'answerReference',
    'knowledgeReference',
    'pendingVerification',
    'openIssues',
    'chemicallyReviewed',
  ]
  const hits: string[] = []
  const walk = (v: unknown, path: string) => {
    if (!v || typeof v !== 'object') return
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${path}[${i}]`))
      return
    }
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const p = path ? `${path}.${k}` : k
      if (forbidden.includes(k)) hits.push(p)
      walk(val, p)
    }
  }
  walk(publicJson, '')
  return hits
}
