/** 工业流程图协议常量（STEP_05） */

export const INDUSTRIAL_DIAGRAM_SCHEMA_VERSION = '1.0' as const

export const INDUSTRIAL_DIAGRAM_ORIENTATIONS = [
  'left_to_right',
  'top_to_bottom',
] as const

export type IndustrialDiagramOrientation =
  (typeof INDUSTRIAL_DIAGRAM_ORIENTATIONS)[number]

export const INDUSTRIAL_DIAGRAM_NODE_TYPES = [
  'material',
  'process',
  'reaction',
  'separation',
  'intermediate',
  'product',
  'waste',
  'unknown',
] as const

export type IndustrialDiagramNodeType =
  (typeof INDUSTRIAL_DIAGRAM_NODE_TYPES)[number]

export const INDUSTRIAL_DIAGRAM_EDGE_TYPES = [
  'material_flow',
  'reagent_input',
  'condition',
  'recycle',
  'byproduct',
] as const

export type IndustrialDiagramEdgeType =
  (typeof INDUSTRIAL_DIAGRAM_EDGE_TYPES)[number]

export const INDUSTRIAL_DIAGRAM_DISPLAY_ROLES = [
  'raw',
  'reagent',
  'process',
  'reaction',
  'separation',
  'intermediate',
  'product',
  'waste',
  'unknown_op',
  'unknown_substance',
  'other',
] as const

export type IndustrialDiagramDisplayRole =
  (typeof INDUSTRIAL_DIAGRAM_DISPLAY_ROLES)[number]

/** 受控 presentation（禁止任意 style/事件/URL） */
export const INDUSTRIAL_DIAGRAM_SHAPE_HINTS = [
  'rect',
  'rounded_rect',
  'ellipse',
  'diamond',
  'hexagon',
] as const

export type IndustrialDiagramShapeHint =
  (typeof INDUSTRIAL_DIAGRAM_SHAPE_HINTS)[number]

export const INDUSTRIAL_DIAGRAM_TONE_HINTS = [
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
  'muted',
] as const

export type IndustrialDiagramToneHint =
  (typeof INDUSTRIAL_DIAGRAM_TONE_HINTS)[number]

export const DIAGRAM_ID_PATTERN = /^[a-z][a-z0-9_.-]{2,62}$/
export const NODE_EDGE_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/

export const MAX_DIAGRAM_NODES = 40
export const MAX_DIAGRAM_EDGES = 60
export const MAX_LABEL_LEN = 40
export const MAX_TITLE_LEN = 80

export const DIAGRAM_ERROR_CODES = [
  'INVALID_SCHEMA_VERSION',
  'INVALID_DIAGRAM_ID',
  'INVALID_CASE_CODE',
  'INVALID_ORIENTATION',
  'INVALID_TITLE',
  'TOO_MANY_NODES',
  'TOO_MANY_EDGES',
  'DUPLICATE_NODE_ID',
  'DUPLICATE_EDGE_ID',
  'INVALID_NODE_TYPE',
  'INVALID_EDGE_TYPE',
  'INVALID_DISPLAY_LABEL',
  'UNKNOWN_EDGE_SOURCE',
  'UNKNOWN_EDGE_TARGET',
  'SELF_LOOP_FORBIDDEN',
  'UNEXPECTED_FLOW_CYCLE',
  'INVALID_PRESENTATION',
  'UNKNOWN_MISSING_INTERNAL',
  'LABEL_LEAK_RISK',
  'CASE_CODE_MISMATCH',
  'CASE_VERSION_MISMATCH',
  'CASE_HASH_MISMATCH',
  'UNKNOWN_MATERIAL_REF',
  'UNKNOWN_STEP_REF',
  'UNKNOWN_REACTION_REF',
  'PUBLIC_DATA_LEAK_RISK',
] as const

export type DiagramErrorCode = (typeof DIAGRAM_ERROR_CODES)[number]
