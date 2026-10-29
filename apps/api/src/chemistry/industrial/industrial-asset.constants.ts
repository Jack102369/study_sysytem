/** 工业题图资源类型（本步开放流程图；装置图枚举预留） */
export const INDUSTRIAL_ASSET_TYPES = [
  'industrial_flow_svg',
  'industrial_apparatus_svg',
] as const

export type IndustrialAssetType = (typeof INDUSTRIAL_ASSET_TYPES)[number]

export const INDUSTRIAL_ASSET_ROLES = [
  'question_diagram',
  'supporting_diagram',
] as const

export type IndustrialAssetRole = (typeof INDUSTRIAL_ASSET_ROLES)[number]

export const INDUSTRIAL_FLOW_SVG_MIME = 'image/svg+xml' as const

/** 正式入库默认题图角色/类型 */
export const DEFAULT_INDUSTRIAL_FLOW_ASSET = {
  assetType: 'industrial_flow_svg' as const,
  assetRole: 'question_diagram' as const,
  mimeType: INDUSTRIAL_FLOW_SVG_MIME,
  sortOrder: 0,
}

/** 不可变目录相对 uploads */
export const INDUSTRIAL_SVG_STORAGE_SUBDIR = 'industrial-svg' as const

/** SVG 字节上限（防止超大写入） */
export const INDUSTRIAL_SVG_MAX_BYTES = 512 * 1024
