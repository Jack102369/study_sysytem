/** 工业装置图协议常量（STEP_13）— 与流程图协议语义独立 */

export const INDUSTRIAL_APPARATUS_SCHEMA_VERSION = '1.0' as const
export const INDUSTRIAL_APPARATUS_PROTOCOL_VERSION = '1.0.0' as const

export const INDUSTRIAL_APPARATUS_ORIENTATIONS = [
  'left_to_right',
  'top_to_bottom',
] as const
export type IndustrialApparatusOrientation =
  (typeof INDUSTRIAL_APPARATUS_ORIENTATIONS)[number]

/** 第一批教学示意设备（schematic，非工程施工图） */
export const INDUSTRIAL_APPARATUS_COMPONENT_TYPES = [
  'reaction_vessel',
  'gas_generator',
  'heater',
  'cooler',
  'condenser',
  'filter',
  'distillation_unit',
  'gas_washing_bottle',
  'drying_tube',
  'gas_collector',
  'tail_gas_absorber',
  'liquid_tank',
  'solid_liquid_separator',
  'pipe',
  'valve',
  'temperature_sensor',
  'pressure_sensor',
  'pressure_relief',
] as const
export type IndustrialApparatusComponentType =
  (typeof INDUSTRIAL_APPARATUS_COMPONENT_TYPES)[number]

export const INDUSTRIAL_APPARATUS_MEDIA_TYPES = [
  'gas',
  'liquid',
  'solid',
  'coolant',
  'heat',
  'waste_gas',
] as const
export type IndustrialApparatusMediaType =
  (typeof INDUSTRIAL_APPARATUS_MEDIA_TYPES)[number]

export const INDUSTRIAL_APPARATUS_PORT_DIRECTIONS = [
  'in',
  'out',
  'bidirectional',
] as const
export type IndustrialApparatusPortDirection =
  (typeof INDUSTRIAL_APPARATUS_PORT_DIRECTIONS)[number]

export const INDUSTRIAL_APPARATUS_CONNECTION_FLOW_TYPES = [
  'gas',
  'liquid',
  'solid',
  'coolant',
  'heat',
  'waste_gas',
] as const
export type IndustrialApparatusConnectionFlowType =
  (typeof INDUSTRIAL_APPARATUS_CONNECTION_FLOW_TYPES)[number]

export const APPARATUS_ID_PATTERN = /^[a-z][a-z0-9_.-]{2,62}$/
export const COMPONENT_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/
export const PORT_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/

export const MAX_APPARATUS_COMPONENTS = 24
export const MAX_APPARATUS_CONNECTIONS = 40
export const MAX_APPARATUS_LABEL_LEN = 40
export const MAX_APPARATUS_TITLE_LEN = 80

export const APPARATUS_ERROR_CODES = [
  'INVALID_SCHEMA_VERSION',
  'INVALID_APPARATUS_ID',
  'INVALID_ORIENTATION',
  'INVALID_TITLE',
  'TOO_MANY_COMPONENTS',
  'TOO_MANY_CONNECTIONS',
  'DUPLICATE_COMPONENT_ID',
  'DUPLICATE_CONNECTION_ID',
  'UNSUPPORTED_COMPONENT_TYPE',
  'INVALID_PORT',
  'UNKNOWN_SOURCE_COMPONENT',
  'UNKNOWN_TARGET_COMPONENT',
  'UNKNOWN_SOURCE_PORT',
  'UNKNOWN_TARGET_PORT',
  'PORT_DIRECTION_MISMATCH',
  'MEDIA_INCOMPATIBLE',
  'SELF_CONNECTION_FORBIDDEN',
  'REQUIRED_PORT_MISSING',
  'PUBLIC_DATA_LEAK_RISK',
  'CASE_CODE_MISMATCH',
  'CASE_HASH_MISMATCH',
  'INVALID_LAYOUT_HINT',
] as const
export type ApparatusErrorCode = (typeof APPARATUS_ERROR_CODES)[number]

/** 正式资源绑定默认（复用 D043 asset_type；不新建表） */
export const DEFAULT_INDUSTRIAL_APPARATUS_ASSET = {
  assetType: 'industrial_apparatus_svg' as const,
  assetRole: 'supporting_diagram' as const,
  mimeType: 'image/svg+xml' as const,
  sortOrder: 1,
}
