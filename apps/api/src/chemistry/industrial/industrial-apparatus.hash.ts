import { sha256Stable } from './industrial-case.hash'
import type {
  IndustrialApparatusDefinition,
  IndustrialApparatusPublic,
} from './industrial-apparatus.types'

export function apparatusSemanticPayload(
  d:
    | Omit<IndustrialApparatusDefinition, 'apparatusContentHash'>
    | IndustrialApparatusDefinition,
): unknown {
  return {
    schemaVersion: d.schemaVersion,
    apparatusId: d.apparatusId,
    caseCode: d.caseCode,
    caseVersion: d.caseVersion,
    caseContentHash: d.caseContentHash,
    apparatusVersion: d.apparatusVersion,
    title: d.title,
    orientation: d.orientation,
    schematicDisclaimer: d.schematicDisclaimer,
    intentionallyInvalid: !!d.intentionallyInvalid,
    components: d.components.map((c) => ({
      componentId: c.componentId,
      componentType: c.componentType,
      displayLabel: c.displayLabel,
      ports: c.ports,
      paramLabels: c.paramLabels || [],
      internal: c.internal,
    })),
    connections: d.connections.map((x) => ({
      connectionId: x.connectionId,
      sourceComponentId: x.sourceComponentId,
      sourcePortId: x.sourcePortId,
      targetComponentId: x.targetComponentId,
      targetPortId: x.targetPortId,
      flowType: x.flowType,
      displayLabel: x.displayLabel || '',
      internal: x.internal || null,
    })),
  }
}

export function computeApparatusContentHash(
  d:
    | Omit<IndustrialApparatusDefinition, 'apparatusContentHash'>
    | IndustrialApparatusDefinition,
): string {
  return sha256Stable(apparatusSemanticPayload(d))
}

export function apparatusPublicSemanticPayload(
  p: Omit<IndustrialApparatusPublic, 'publicContentHash'> | IndustrialApparatusPublic,
): unknown {
  return {
    schemaVersion: p.schemaVersion,
    apparatusId: p.apparatusId,
    apparatusVersion: p.apparatusVersion,
    orientation: p.orientation,
    title: p.title,
    schematicDisclaimer: p.schematicDisclaimer,
    components: p.components.map((c) => ({
      componentId: c.componentId,
      componentType: c.componentType,
      displayLabel: c.displayLabel,
      ports: c.ports,
      paramLabels: c.paramLabels || [],
    })),
    connections: p.connections.map((x) => ({
      connectionId: x.connectionId,
      sourceComponentId: x.sourceComponentId,
      sourcePortId: x.sourcePortId,
      targetComponentId: x.targetComponentId,
      targetPortId: x.targetPortId,
      flowType: x.flowType,
      displayLabel: x.displayLabel || '',
    })),
  }
}

export function computeApparatusPublicContentHash(
  p: Omit<IndustrialApparatusPublic, 'publicContentHash'> | IndustrialApparatusPublic,
): string {
  return sha256Stable(apparatusPublicSemanticPayload(p))
}
