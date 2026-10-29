import { CASE_CODE_PATTERN, VERSION_PATTERN } from './industrial-case.constants'
import type { IndustrialCase } from './industrial-case.types'
import {
  DIAGRAM_ID_PATTERN,
  INDUSTRIAL_DIAGRAM_DISPLAY_ROLES,
  INDUSTRIAL_DIAGRAM_EDGE_TYPES,
  INDUSTRIAL_DIAGRAM_NODE_TYPES,
  INDUSTRIAL_DIAGRAM_ORIENTATIONS,
  INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
  INDUSTRIAL_DIAGRAM_SHAPE_HINTS,
  INDUSTRIAL_DIAGRAM_TONE_HINTS,
  MAX_DIAGRAM_EDGES,
  MAX_DIAGRAM_NODES,
  MAX_LABEL_LEN,
  MAX_TITLE_LEN,
  NODE_EDGE_ID_PATTERN,
} from './industrial-diagram.constants'
import {
  computeDiagramContentHash,
  computePublicContentHash,
} from './industrial-diagram.hash'
import type {
  DiagramIssue,
  IndustrialDiagramDefinition,
  IndustrialDiagramPresentation,
  IndustrialDiagramValidationResult,
} from './industrial-diagram.types'

function err(
  code: DiagramIssue['code'],
  path: string,
  message: string,
): DiagramIssue {
  return { code, path, message, severity: 'error' }
}

function warn(
  code: DiagramIssue['code'],
  path: string,
  message: string,
): DiagramIssue {
  return { code, path, message, severity: 'warning' }
}

function inSet<T extends string>(v: unknown, allowed: readonly T[]): v is T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v)
}

const CONTROL_OR_HTML = /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F]|javascript:|on\w+=/i

function checkLabel(label: string, path: string, errors: DiagramIssue[]) {
  if (!label.trim()) {
    errors.push(err('INVALID_DISPLAY_LABEL', path, 'label empty'))
    return
  }
  if (label.length > MAX_LABEL_LEN) {
    errors.push(err('INVALID_DISPLAY_LABEL', path, `label longer than ${MAX_LABEL_LEN}`))
  }
  if (CONTROL_OR_HTML.test(label)) {
    errors.push(err('INVALID_DISPLAY_LABEL', path, 'label contains forbidden markup/control chars'))
  }
}

function checkPresentation(
  p: IndustrialDiagramPresentation | undefined,
  path: string,
  errors: DiagramIssue[],
) {
  if (!p) return
  if (p.shapeHint != null && !inSet(p.shapeHint, INDUSTRIAL_DIAGRAM_SHAPE_HINTS)) {
    errors.push(err('INVALID_PRESENTATION', path, 'shapeHint invalid'))
  }
  if (p.toneHint != null && !inSet(p.toneHint, INDUSTRIAL_DIAGRAM_TONE_HINTS)) {
    errors.push(err('INVALID_PRESENTATION', path, 'toneHint invalid'))
  }
  if (p.emphasis != null && typeof p.emphasis !== 'boolean') {
    errors.push(err('INVALID_PRESENTATION', path, 'emphasis must be boolean'))
  }
  // 拒绝未知键
  for (const k of Object.keys(p)) {
    if (!['shapeHint', 'toneHint', 'emphasis'].includes(k)) {
      errors.push(err('INVALID_PRESENTATION', path, `unknown presentation key: ${k}`))
    }
  }
}

/** 对 material_flow / reagent_input / byproduct / condition 边做有向环检测；recycle 边排除 */
function hasUnexpectedFlowCycle(
  nodeIds: string[],
  edges: { from: string; to: string; type: string }[],
): boolean {
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) adj.set(id, [])
  for (const e of edges) {
    if (e.type === 'recycle') continue
    if (e.type === 'condition') continue // 条件注释边不参与物料环判断
    adj.get(e.from)?.push(e.to)
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const dfs = (u: string): boolean => {
    if (visiting.has(u)) return true
    if (visited.has(u)) return false
    visiting.add(u)
    for (const v of adj.get(u) || []) {
      if (dfs(v)) return true
    }
    visiting.delete(u)
    visited.add(u)
    return false
  }
  for (const id of nodeIds) {
    if (dfs(id)) return true
  }
  return false
}

export function validateIndustrialDiagramDefinition(
  raw: unknown,
): IndustrialDiagramValidationResult {
  const errors: DiagramIssue[] = []
  const warnings: DiagramIssue[] = []

  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      errors: [err('INVALID_DIAGRAM_ID', '$', 'definition must be object')],
      warnings,
    }
  }
  const d = raw as Record<string, unknown>

  if (d.schemaVersion !== INDUSTRIAL_DIAGRAM_SCHEMA_VERSION) {
    errors.push(
      err(
        'INVALID_SCHEMA_VERSION',
        'schemaVersion',
        `expected ${INDUSTRIAL_DIAGRAM_SCHEMA_VERSION}`,
      ),
    )
  }

  const diagramId = String(d.diagramId ?? '')
  if (!DIAGRAM_ID_PATTERN.test(diagramId)) {
    errors.push(err('INVALID_DIAGRAM_ID', 'diagramId', 'diagramId format invalid'))
  }

  const caseCode = String(d.caseCode ?? '')
  if (!CASE_CODE_PATTERN.test(caseCode)) {
    errors.push(err('INVALID_CASE_CODE', 'caseCode', 'caseCode format invalid'))
  }

  if (!inSet(d.orientation, INDUSTRIAL_DIAGRAM_ORIENTATIONS)) {
    errors.push(err('INVALID_ORIENTATION', 'orientation', 'orientation invalid'))
  }

  const title = String(d.title ?? '')
  if (!title.trim() || title.length > MAX_TITLE_LEN || CONTROL_OR_HTML.test(title)) {
    errors.push(err('INVALID_TITLE', 'title', 'title invalid or too long'))
  }

  const nodes = Array.isArray(d.nodes) ? d.nodes : null
  const edges = Array.isArray(d.edges) ? d.edges : null
  if (!nodes) errors.push(err('TOO_MANY_NODES', 'nodes', 'nodes must be array'))
  if (!edges) errors.push(err('TOO_MANY_EDGES', 'edges', 'edges must be array'))

  if (nodes && nodes.length > MAX_DIAGRAM_NODES) {
    errors.push(err('TOO_MANY_NODES', 'nodes', `max ${MAX_DIAGRAM_NODES}`))
  }
  if (edges && edges.length > MAX_DIAGRAM_EDGES) {
    errors.push(err('TOO_MANY_EDGES', 'edges', `max ${MAX_DIAGRAM_EDGES}`))
  }

  const nodeIds = new Set<string>()
  if (nodes) {
    nodes.forEach((n, i) => {
      const node = n as Record<string, unknown>
      const path = `nodes[${i}]`
      const id = String(node.id ?? '')
      if (!NODE_EDGE_ID_PATTERN.test(id)) {
        errors.push(err('DUPLICATE_NODE_ID', path, 'node id format invalid'))
      } else if (nodeIds.has(id)) {
        errors.push(err('DUPLICATE_NODE_ID', path, `duplicate node id ${id}`))
      } else nodeIds.add(id)

      if (!inSet(node.type, INDUSTRIAL_DIAGRAM_NODE_TYPES)) {
        errors.push(err('INVALID_NODE_TYPE', `${path}.type`, 'invalid node type'))
      }
      if (!inSet(node.displayRole, INDUSTRIAL_DIAGRAM_DISPLAY_ROLES)) {
        errors.push(err('INVALID_NODE_TYPE', `${path}.displayRole`, 'invalid displayRole'))
      }
      checkLabel(String(node.displayLabel ?? ''), `${path}.displayLabel`, errors)
      checkPresentation(node.presentation as IndustrialDiagramPresentation | undefined, `${path}.presentation`, errors)

      const internal = node.internal as Record<string, unknown> | undefined
      if (!internal || typeof internal !== 'object') {
        errors.push(err('UNKNOWN_MISSING_INTERNAL', `${path}.internal`, 'internal required'))
      } else if (node.type === 'unknown') {
        if (!String(internal.unknownKey || '').trim() && !String(internal.answerLabel || '').trim()) {
          errors.push(
            err('UNKNOWN_MISSING_INTERNAL', `${path}.internal`, 'unknown node needs unknownKey or answerLabel'),
          )
        }
        const label = String(node.displayLabel ?? '')
        const answer = String(internal.answerLabel || '')
        if (answer && label.includes(answer)) {
          errors.push(
            err('LABEL_LEAK_RISK', `${path}.displayLabel`, 'displayLabel must not contain answerLabel'),
          )
        }
      }
    })
  }

  const edgeIds = new Set<string>()
  const edgeObjs: { from: string; to: string; type: string }[] = []
  if (edges) {
    edges.forEach((e, i) => {
      const edge = e as Record<string, unknown>
      const path = `edges[${i}]`
      const id = String(edge.id ?? '')
      if (!NODE_EDGE_ID_PATTERN.test(id)) {
        errors.push(err('DUPLICATE_EDGE_ID', path, 'edge id format invalid'))
      } else if (edgeIds.has(id)) {
        errors.push(err('DUPLICATE_EDGE_ID', path, `duplicate edge id ${id}`))
      } else edgeIds.add(id)

      if (!inSet(edge.type, INDUSTRIAL_DIAGRAM_EDGE_TYPES)) {
        errors.push(err('INVALID_EDGE_TYPE', `${path}.type`, 'invalid edge type'))
      }
      const from = String(edge.from ?? '')
      const to = String(edge.to ?? '')
      if (!nodeIds.has(from)) {
        errors.push(err('UNKNOWN_EDGE_SOURCE', `${path}.from`, `unknown from ${from}`))
      }
      if (!nodeIds.has(to)) {
        errors.push(err('UNKNOWN_EDGE_TARGET', `${path}.to`, `unknown to ${to}`))
      }
      if (from && to && from === to) {
        errors.push(err('SELF_LOOP_FORBIDDEN', path, 'self-loop forbidden'))
      }
      if (edge.displayLabel != null) {
        checkLabel(String(edge.displayLabel), `${path}.displayLabel`, errors)
      }
      checkPresentation(edge.presentation as IndustrialDiagramPresentation | undefined, `${path}.presentation`, errors)
      edgeObjs.push({ from, to, type: String(edge.type) })
    })
  }

  if (nodes && edges && errors.filter((e) => e.code === 'UNKNOWN_EDGE_SOURCE' || e.code === 'UNKNOWN_EDGE_TARGET').length === 0) {
    if (hasUnexpectedFlowCycle([...nodeIds], edgeObjs)) {
      errors.push(
        err(
          'UNEXPECTED_FLOW_CYCLE',
          'edges',
          'non-recycle flow edges form a cycle',
        ),
      )
    }
  }

  const hash = String(d.diagramContentHash ?? '')
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    errors.push(err('INVALID_DIAGRAM_ID', 'diagramContentHash', 'hash must be sha256 hex'))
  } else {
    try {
      const expected = computeDiagramContentHash(d as unknown as IndustrialDiagramDefinition)
      if (hash !== expected) {
        errors.push(
          err('INVALID_DIAGRAM_ID', 'diagramContentHash', 'diagramContentHash mismatch'),
        )
      }
    } catch {
      /* ignore */
    }
  }

  if (!VERSION_PATTERN.test(String(d.diagramVersion ?? ''))) {
    errors.push(err('INVALID_DIAGRAM_ID', 'diagramVersion', 'diagramVersion semver required'))
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateIndustrialDiagramAgainstCase(
  def: IndustrialDiagramDefinition,
  industrialCase: IndustrialCase,
): IndustrialDiagramValidationResult {
  const base = validateIndustrialDiagramDefinition(def)
  const errors = [...base.errors]
  const warnings = [...base.warnings]

  if (def.caseCode !== industrialCase.caseCode) {
    errors.push(err('CASE_CODE_MISMATCH', 'caseCode', 'caseCode mismatch'))
  }
  if (def.caseVersion !== industrialCase.version) {
    errors.push(err('CASE_VERSION_MISMATCH', 'caseVersion', 'caseVersion mismatch'))
  }
  if (def.caseContentHash !== industrialCase.contentHash) {
    errors.push(err('CASE_HASH_MISMATCH', 'caseContentHash', 'caseContentHash mismatch'))
  }

  const materialIds = new Set(industrialCase.materials.map((m) => m.materialId))
  const stepIds = new Set(industrialCase.processSteps.map((s) => s.stepId))
  const reactionRefs = new Set(industrialCase.reactions.map((r) => r.reactionReference))

  def.nodes.forEach((n, i) => {
    const path = `nodes[${i}].internal`
    const mid = n.internal.materialId
    if (mid && !materialIds.has(mid)) {
      errors.push(err('UNKNOWN_MATERIAL_REF', path, `materialId ${mid} not in case`))
    }
    const sid = n.internal.stepId
    if (sid && !stepIds.has(sid)) {
      errors.push(err('UNKNOWN_STEP_REF', path, `stepId ${sid} not in case`))
    }
    const rr = n.internal.reactionReference
    if (rr) {
      const found = industrialCase.reactions.find((r) => r.reactionReference === rr)
      if (!found && !reactionRefs.has(rr)) {
        errors.push(err('UNKNOWN_REACTION_REF', path, `reactionReference ${rr} missing`))
      } else if (found?.pendingVerification) {
        warnings.push(
          warn('UNKNOWN_REACTION_REF', path, `reaction ${rr} still pendingVerification`),
        )
      }
    }
  })

  return { valid: errors.length === 0, errors, warnings }
}

const PUBLIC_FORBIDDEN_KEYS = [
  'internal',
  'internalReferences',
  'reviewMetadata',
  'answerLabel',
  'unknownKey',
  'caseCode',
  'caseVersion',
  'caseContentHash',
]

/**
 * 仅校验 Public：白名单字段；拒绝内部敏感键；校验 publicContentHash。
 */
export function validateIndustrialDiagramPublic(
  raw: unknown,
): IndustrialDiagramValidationResult {
  const errors: DiagramIssue[] = []
  const warnings: DiagramIssue[] = []

  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      errors: [err('INVALID_DIAGRAM_ID', '$', 'public must be object')],
      warnings,
    }
  }
  const d = raw as Record<string, unknown>

  for (const k of Object.keys(d)) {
    if (
      ![
        'schemaVersion',
        'diagramId',
        'diagramVersion',
        'publicContentHash',
        'orientation',
        'title',
        'nodes',
        'edges',
      ].includes(k)
    ) {
      errors.push(err('PUBLIC_DATA_LEAK_RISK', k, `unexpected public field: ${k}`))
    }
    if (PUBLIC_FORBIDDEN_KEYS.includes(k)) {
      errors.push(err('PUBLIC_DATA_LEAK_RISK', k, `forbidden field in public: ${k}`))
    }
  }

  if (d.schemaVersion !== INDUSTRIAL_DIAGRAM_SCHEMA_VERSION) {
    errors.push(
      err(
        'INVALID_SCHEMA_VERSION',
        'schemaVersion',
        `expected ${INDUSTRIAL_DIAGRAM_SCHEMA_VERSION}`,
      ),
    )
  }
  if (!DIAGRAM_ID_PATTERN.test(String(d.diagramId ?? ''))) {
    errors.push(err('INVALID_DIAGRAM_ID', 'diagramId', 'invalid'))
  }
  if (!VERSION_PATTERN.test(String(d.diagramVersion ?? ''))) {
    errors.push(err('INVALID_DIAGRAM_ID', 'diagramVersion', 'semver required'))
  }
  if (!inSet(d.orientation, INDUSTRIAL_DIAGRAM_ORIENTATIONS)) {
    errors.push(err('INVALID_ORIENTATION', 'orientation', 'invalid'))
  }
  const title = String(d.title ?? '')
  if (!title.trim() || title.length > MAX_TITLE_LEN || CONTROL_OR_HTML.test(title)) {
    errors.push(err('INVALID_TITLE', 'title', 'invalid'))
  }

  const nodes = Array.isArray(d.nodes) ? d.nodes : null
  const edges = Array.isArray(d.edges) ? d.edges : null
  if (!nodes) errors.push(err('TOO_MANY_NODES', 'nodes', 'nodes required'))
  if (!edges) errors.push(err('TOO_MANY_EDGES', 'edges', 'edges required'))
  if (nodes && nodes.length > MAX_DIAGRAM_NODES) {
    errors.push(err('TOO_MANY_NODES', 'nodes', `max ${MAX_DIAGRAM_NODES}`))
  }
  if (edges && edges.length > MAX_DIAGRAM_EDGES) {
    errors.push(err('TOO_MANY_EDGES', 'edges', `max ${MAX_DIAGRAM_EDGES}`))
  }

  const nodeIds = new Set<string>()
  if (nodes) {
    nodes.forEach((n, i) => {
      const node = n as Record<string, unknown>
      const path = `nodes[${i}]`
      for (const fk of PUBLIC_FORBIDDEN_KEYS) {
        if (fk in node) {
          errors.push(err('PUBLIC_DATA_LEAK_RISK', `${path}.${fk}`, 'forbidden on public node'))
        }
      }
      const id = String(node.id ?? '')
      if (!NODE_EDGE_ID_PATTERN.test(id) || nodeIds.has(id)) {
        errors.push(err('DUPLICATE_NODE_ID', path, 'bad or duplicate id'))
      } else nodeIds.add(id)
      if (!inSet(node.type, INDUSTRIAL_DIAGRAM_NODE_TYPES)) {
        errors.push(err('INVALID_NODE_TYPE', `${path}.type`, 'invalid'))
      }
      checkLabel(String(node.displayLabel ?? ''), `${path}.displayLabel`, errors)
      checkPresentation(
        node.presentation as IndustrialDiagramPresentation | undefined,
        `${path}.presentation`,
        errors,
      )
    })
  }

  const edgeIds = new Set<string>()
  if (edges) {
    edges.forEach((e, i) => {
      const edge = e as Record<string, unknown>
      const path = `edges[${i}]`
      for (const fk of PUBLIC_FORBIDDEN_KEYS) {
        if (fk in edge) {
          errors.push(err('PUBLIC_DATA_LEAK_RISK', `${path}.${fk}`, 'forbidden on public edge'))
        }
      }
      const id = String(edge.id ?? '')
      if (!NODE_EDGE_ID_PATTERN.test(id) || edgeIds.has(id)) {
        errors.push(err('DUPLICATE_EDGE_ID', path, 'bad or duplicate id'))
      } else edgeIds.add(id)
      if (!inSet(edge.type, INDUSTRIAL_DIAGRAM_EDGE_TYPES)) {
        errors.push(err('INVALID_EDGE_TYPE', `${path}.type`, 'invalid'))
      }
      if (!nodeIds.has(String(edge.from))) {
        errors.push(err('UNKNOWN_EDGE_SOURCE', `${path}.from`, 'unknown'))
      }
      if (!nodeIds.has(String(edge.to))) {
        errors.push(err('UNKNOWN_EDGE_TARGET', `${path}.to`, 'unknown'))
      }
      if (edge.displayLabel != null) {
        checkLabel(String(edge.displayLabel), `${path}.displayLabel`, errors)
      }
      checkPresentation(
        edge.presentation as IndustrialDiagramPresentation | undefined,
        `${path}.presentation`,
        errors,
      )
    })
  }

  const hash = String(d.publicContentHash ?? '')
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    errors.push(err('INVALID_DIAGRAM_ID', 'publicContentHash', 'sha256 hex required'))
  } else {
    const expected = computePublicContentHash(d as never)
    if (hash !== expected) {
      errors.push(err('INVALID_DIAGRAM_ID', 'publicContentHash', 'hash mismatch'))
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
