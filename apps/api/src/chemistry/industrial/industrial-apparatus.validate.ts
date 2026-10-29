import {
  APPARATUS_ID_PATTERN,
  COMPONENT_ID_PATTERN,
  INDUSTRIAL_APPARATUS_COMPONENT_TYPES,
  INDUSTRIAL_APPARATUS_CONNECTION_FLOW_TYPES,
  INDUSTRIAL_APPARATUS_ORIENTATIONS,
  INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  MAX_APPARATUS_COMPONENTS,
  MAX_APPARATUS_CONNECTIONS,
  MAX_APPARATUS_LABEL_LEN,
  MAX_APPARATUS_TITLE_LEN,
  PORT_ID_PATTERN,
  type IndustrialApparatusComponentType,
  type IndustrialApparatusConnectionFlowType,
} from './industrial-apparatus.constants'
import { findPortSpec, getPortCatalog } from './industrial-apparatus.ports'
import {
  projectIndustrialApparatusPublic,
  scanApparatusPublicForLeakRisk,
} from './industrial-apparatus.project'
import { computeApparatusContentHash } from './industrial-apparatus.hash'
import type {
  ApparatusIssue,
  IndustrialApparatusDefinition,
  IndustrialApparatusPublic,
  IndustrialApparatusValidationResult,
} from './industrial-apparatus.types'
import type { IndustrialCase } from './industrial-case.types'

function err(
  code: string,
  path: string,
  message: string,
  severity: ApparatusIssue['severity'] = 'error',
): ApparatusIssue {
  return { code, path, message, severity }
}

function mediaCompatible(
  flow: IndustrialApparatusConnectionFlowType,
  portMedia: string[],
): boolean {
  if (flow === 'waste_gas') {
    return portMedia.includes('waste_gas') || portMedia.includes('gas')
  }
  return portMedia.includes(flow)
}

function directionOk(
  flowFrom: 'source' | 'target',
  dir: string,
  role: 'source' | 'target',
): boolean {
  if (dir === 'bidirectional') return true
  if (role === 'source') return dir === 'out' || dir === 'bidirectional'
  return dir === 'in' || dir === 'bidirectional'
}

export function validateIndustrialApparatusDefinition(
  def: IndustrialApparatusDefinition,
): IndustrialApparatusValidationResult {
  const errors: ApparatusIssue[] = []
  const warnings: ApparatusIssue[] = []
  const unknowns: ApparatusIssue[] = []

  if (def.schemaVersion !== INDUSTRIAL_APPARATUS_SCHEMA_VERSION) {
    errors.push(
      err('INVALID_SCHEMA_VERSION', 'schemaVersion', `must be ${INDUSTRIAL_APPARATUS_SCHEMA_VERSION}`),
    )
  }
  if (!APPARATUS_ID_PATTERN.test(def.apparatusId || '')) {
    errors.push(err('INVALID_APPARATUS_ID', 'apparatusId', 'invalid apparatusId'))
  }
  if (
    !(INDUSTRIAL_APPARATUS_ORIENTATIONS as readonly string[]).includes(
      def.orientation,
    )
  ) {
    errors.push(err('INVALID_ORIENTATION', 'orientation', 'invalid orientation'))
  }
  if (
    !def.title ||
    def.title.length > MAX_APPARATUS_TITLE_LEN ||
    /[<>]/.test(def.title)
  ) {
    errors.push(err('INVALID_TITLE', 'title', 'invalid title'))
  }
  if (!def.schematicDisclaimer || !/示意|schematic/i.test(def.schematicDisclaimer)) {
    warnings.push(
      err(
        'INVALID_LAYOUT_HINT',
        'schematicDisclaimer',
        '建议声明教学示意性质',
        'warning',
      ),
    )
  }

  if (def.components.length > MAX_APPARATUS_COMPONENTS) {
    errors.push(err('TOO_MANY_COMPONENTS', 'components', 'too many components'))
  }
  if (def.connections.length > MAX_APPARATUS_CONNECTIONS) {
    errors.push(err('TOO_MANY_CONNECTIONS', 'connections', 'too many connections'))
  }

  const compIds = new Set<string>()
  const compById = new Map(def.components.map((c) => [c.componentId, c]))

  for (const [i, c] of def.components.entries()) {
    const p = `components[${i}]`
    if (!COMPONENT_ID_PATTERN.test(c.componentId)) {
      errors.push(err('DUPLICATE_COMPONENT_ID', `${p}.componentId`, 'bad id'))
    }
    if (compIds.has(c.componentId)) {
      errors.push(err('DUPLICATE_COMPONENT_ID', `${p}.componentId`, 'duplicate'))
    }
    compIds.add(c.componentId)
    if (
      !(INDUSTRIAL_APPARATUS_COMPONENT_TYPES as readonly string[]).includes(
        c.componentType,
      )
    ) {
      errors.push(
        err(
          'UNSUPPORTED_COMPONENT_TYPE',
          `${p}.componentType`,
          `unsupported: ${c.componentType}`,
        ),
      )
      continue
    }
    if (
      !c.displayLabel ||
      c.displayLabel.length > MAX_APPARATUS_LABEL_LEN ||
      /[<>]/.test(c.displayLabel)
    ) {
      errors.push(err('INVALID_TITLE', `${p}.displayLabel`, 'bad label'))
    }
    for (const port of c.ports) {
      if (!PORT_ID_PATTERN.test(port.portId)) {
        errors.push(err('INVALID_PORT', `${p}.ports`, `bad portId ${port.portId}`))
      }
      const spec = findPortSpec(
        c.componentType as IndustrialApparatusComponentType,
        port.portId,
      )
      if (!spec) {
        errors.push(
          err(
            'INVALID_PORT',
            `${p}.ports`,
            `${c.componentType} 无端口 ${port.portId}`,
          ),
        )
      } else if (spec.direction !== port.direction) {
        errors.push(
          err(
            'PORT_DIRECTION_MISMATCH',
            `${p}.ports`,
            `${port.portId} 方向应为 ${spec.direction}`,
          ),
        )
      }
    }
  }

  const connIds = new Set<string>()
  const portUse = new Map<string, number>()

  for (const [i, x] of def.connections.entries()) {
    const p = `connections[${i}]`
    if (connIds.has(x.connectionId)) {
      errors.push(err('DUPLICATE_CONNECTION_ID', `${p}.connectionId`, 'duplicate'))
    }
    connIds.add(x.connectionId)
    if (
      !(INDUSTRIAL_APPARATUS_CONNECTION_FLOW_TYPES as readonly string[]).includes(
        x.flowType,
      )
    ) {
      errors.push(err('MEDIA_INCOMPATIBLE', `${p}.flowType`, 'bad flowType'))
      continue
    }
    if (x.sourceComponentId === x.targetComponentId) {
      errors.push(err('SELF_CONNECTION_FORBIDDEN', p, 'self connection'))
    }
    const src = compById.get(x.sourceComponentId)
    const tgt = compById.get(x.targetComponentId)
    if (!src) {
      errors.push(err('UNKNOWN_SOURCE_COMPONENT', p, x.sourceComponentId))
      continue
    }
    if (!tgt) {
      errors.push(err('UNKNOWN_TARGET_COMPONENT', p, x.targetComponentId))
      continue
    }
    const sp = src.ports.find((q) => q.portId === x.sourcePortId)
    const tp = tgt.ports.find((q) => q.portId === x.targetPortId)
    if (!sp) {
      errors.push(err('UNKNOWN_SOURCE_PORT', p, x.sourcePortId))
      continue
    }
    if (!tp) {
      errors.push(err('UNKNOWN_TARGET_PORT', p, x.targetPortId))
      continue
    }
    if (!directionOk('source', sp.direction, 'source')) {
      errors.push(
        err('PORT_DIRECTION_MISMATCH', p, `源端口 ${x.sourcePortId} 不可作出口`),
      )
    }
    if (!directionOk('target', tp.direction, 'target')) {
      errors.push(
        err('PORT_DIRECTION_MISMATCH', p, `目标端口 ${x.targetPortId} 不可作入口`),
      )
    }
    if (!mediaCompatible(x.flowType, sp.media) || !mediaCompatible(x.flowType, tp.media)) {
      errors.push(
        err(
          'MEDIA_INCOMPATIBLE',
          p,
          `flow ${x.flowType} 与端口介质不兼容`,
        ),
      )
    }
    const sk = `${x.sourceComponentId}:${x.sourcePortId}`
    const tk = `${x.targetComponentId}:${x.targetPortId}`
    portUse.set(sk, (portUse.get(sk) || 0) + 1)
    portUse.set(tk, (portUse.get(tk) || 0) + 1)
    const sSpec = findPortSpec(src.componentType, x.sourcePortId)
    const tSpec = findPortSpec(tgt.componentType, x.targetPortId)
    if (sSpec && (portUse.get(sk) || 0) > sSpec.maxConnections) {
      warnings.push(
        err('INVALID_PORT', p, `${sk} 超过 maxConnections`, 'warning'),
      )
    }
    if (tSpec && (portUse.get(tk) || 0) > tSpec.maxConnections) {
      warnings.push(
        err('INVALID_PORT', p, `${tk} 超过 maxConnections`, 'warning'),
      )
    }
  }

  for (const c of def.components) {
    const catalog = getPortCatalog(c.componentType)
    for (const spec of catalog) {
      if (!spec.required) continue
      const hasPort = c.ports.some((p) => p.portId === spec.portId)
      if (!hasPort) {
        errors.push(
          err(
            'REQUIRED_PORT_MISSING',
            `component:${c.componentId}`,
            `缺少必要端口 ${spec.portId}`,
          ),
        )
        continue
      }
      const used = [...def.connections].some(
        (x) =>
          (x.sourceComponentId === c.componentId &&
            x.sourcePortId === spec.portId) ||
          (x.targetComponentId === c.componentId &&
            x.targetPortId === spec.portId),
      )
      if (!used && !def.intentionallyInvalid) {
        warnings.push(
          err(
            'REQUIRED_PORT_MISSING',
            `component:${c.componentId}`,
            `必要端口 ${spec.portId} 未连接`,
            'warning',
          ),
        )
      }
    }
  }

  const expectedHash = computeApparatusContentHash(def)
  if (def.apparatusContentHash && def.apparatusContentHash !== expectedHash) {
    warnings.push(
      err(
        'CASE_HASH_MISMATCH',
        'apparatusContentHash',
        'content hash 与语义不一致（调用方应重算）',
        'warning',
      ),
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    unknowns,
  }
}

export function validateIndustrialApparatusPublic(
  pub: IndustrialApparatusPublic,
): IndustrialApparatusValidationResult {
  const errors: ApparatusIssue[] = []
  const warnings: ApparatusIssue[] = []
  const unknowns: ApparatusIssue[] = []
  const leaks = scanApparatusPublicForLeakRisk(pub)
  for (const L of leaks) {
    errors.push(err('PUBLIC_DATA_LEAK_RISK', L, 'Public 含敏感键'))
  }
  if (pub.schemaVersion !== INDUSTRIAL_APPARATUS_SCHEMA_VERSION) {
    errors.push(err('INVALID_SCHEMA_VERSION', 'schemaVersion', 'bad version'))
  }
  return { valid: errors.length === 0, errors, warnings, unknowns }
}

export function validateIndustrialApparatusAgainstCase(
  def: IndustrialApparatusDefinition,
  industrialCase: IndustrialCase,
): IndustrialApparatusValidationResult {
  const base = validateIndustrialApparatusDefinition(def)
  if (def.caseCode !== industrialCase.caseCode) {
    base.errors.push(
      err('CASE_CODE_MISMATCH', 'caseCode', '与案例 caseCode 不一致'),
    )
  }
  if (def.caseContentHash && def.caseContentHash !== industrialCase.contentHash) {
    base.warnings.push(
      err(
        'CASE_HASH_MISMATCH',
        'caseContentHash',
        '与案例 contentHash 不一致',
        'warning',
      ),
    )
  }
  const pub = projectIndustrialApparatusPublic(def)
  const pubV = validateIndustrialApparatusPublic(pub)
  base.errors.push(...pubV.errors)
  base.warnings.push(...pubV.warnings)
  base.valid = base.errors.length === 0
  return base
}
