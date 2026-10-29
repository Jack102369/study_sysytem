import { sha256Stable } from './industrial-case.hash'
import type {
  IndustrialDiagramDefinition,
  IndustrialDiagramPublic,
} from './industrial-diagram.types'

/** 服务端图语义（排除 diagramContentHash 自身） */
export function diagramSemanticPayload(
  d: Omit<IndustrialDiagramDefinition, 'diagramContentHash'> | IndustrialDiagramDefinition,
): unknown {
  return {
    schemaVersion: d.schemaVersion,
    diagramId: d.diagramId,
    caseCode: d.caseCode,
    caseVersion: d.caseVersion,
    caseContentHash: d.caseContentHash,
    diagramVersion: d.diagramVersion,
    title: d.title,
    orientation: d.orientation,
    nodes: d.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      displayLabel: n.displayLabel,
      displayRole: n.displayRole,
      presentation: n.presentation || null,
      internal: n.internal,
    })),
    edges: d.edges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      type: e.type,
      displayLabel: e.displayLabel || '',
      presentation: e.presentation || null,
    })),
    internalReferences: d.internalReferences,
    // reviewMetadata 不入语义哈希：审核标记变化不应改图身份
  }
}

export function computeDiagramContentHash(
  d: Omit<IndustrialDiagramDefinition, 'diagramContentHash'> | IndustrialDiagramDefinition,
): string {
  return sha256Stable(diagramSemanticPayload(d))
}

export function publicSemanticPayload(
  p: Omit<IndustrialDiagramPublic, 'publicContentHash'> | IndustrialDiagramPublic,
): unknown {
  return {
    schemaVersion: p.schemaVersion,
    diagramId: p.diagramId,
    diagramVersion: p.diagramVersion,
    orientation: p.orientation,
    title: p.title,
    nodes: p.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      displayLabel: n.displayLabel,
      presentation: n.presentation || null,
    })),
    edges: p.edges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      type: e.type,
      displayLabel: e.displayLabel || '',
      presentation: e.presentation || null,
    })),
  }
}

export function computePublicContentHash(
  p: Omit<IndustrialDiagramPublic, 'publicContentHash'> | IndustrialDiagramPublic,
): string {
  return sha256Stable(publicSemanticPayload(p))
}
