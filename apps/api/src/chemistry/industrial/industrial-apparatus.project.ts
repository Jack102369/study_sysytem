import { computeApparatusPublicContentHash } from './industrial-apparatus.hash'
import type {
  IndustrialApparatusDefinition,
  IndustrialApparatusPublic,
  IndustrialApparatusPublicComponent,
  IndustrialApparatusPublicConnection,
} from './industrial-apparatus.types'

/**
 * 白名单构造学生端装置 Public。
 * 禁止：删字段式导出 Definition；禁止 internal / review / answer。
 */
export function projectIndustrialApparatusPublic(
  def: IndustrialApparatusDefinition,
): IndustrialApparatusPublic {
  const components: IndustrialApparatusPublicComponent[] = def.components.map(
    (c) => {
      const out: IndustrialApparatusPublicComponent = {
        componentId: c.componentId,
        componentType: c.componentType,
        displayLabel: c.displayLabel,
        ports: c.ports.map((p) => ({
          portId: p.portId,
          direction: p.direction,
          media: [...p.media],
        })),
      }
      if (c.paramLabels?.length) out.paramLabels = [...c.paramLabels]
      return out
    },
  )

  const connections: IndustrialApparatusPublicConnection[] = def.connections.map(
    (x) => {
      const out: IndustrialApparatusPublicConnection = {
        connectionId: x.connectionId,
        sourceComponentId: x.sourceComponentId,
        sourcePortId: x.sourcePortId,
        targetComponentId: x.targetComponentId,
        targetPortId: x.targetPortId,
        flowType: x.flowType,
      }
      if (x.displayLabel) out.displayLabel = x.displayLabel
      return out
    },
  )

  const draft: Omit<IndustrialApparatusPublic, 'publicContentHash'> = {
    schemaVersion: def.schemaVersion,
    apparatusId: def.apparatusId,
    apparatusVersion: def.apparatusVersion,
    orientation: def.orientation,
    title: def.title,
    schematicDisclaimer: def.schematicDisclaimer,
    components,
    connections,
  }

  return {
    ...draft,
    publicContentHash: computeApparatusPublicContentHash(draft),
  }
}

export function scanApparatusPublicForLeakRisk(publicJson: unknown): string[] {
  const forbidden = [
    'internal',
    'reviewMetadata',
    'answerKey',
    'expectedOperation',
    'hazardNotes',
    'intendedCorrect',
    'teachingNote',
    'humanReviewedBy',
    'auditContentHash',
  ]
  const hits: string[] = []
  const walk = (v: unknown, path: string) => {
    if (!v || typeof v !== 'object') return
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${path}[${i}]`))
      return
    }
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (forbidden.includes(k)) hits.push(`${path}.${k}`)
      walk(val, `${path}.${k}`)
    }
  }
  walk(publicJson, '$')
  return hits
}
