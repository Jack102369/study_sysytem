import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { INDUSTRIAL_SVG_STORAGE_SUBDIR } from './industrial-asset.constants'
import {
  assertSafeIndustrialSvgStoragePath,
  validateIndustrialSvgForImmutableStorage,
} from './industrial-svg-security'

export function hashSvgContent(svg: string): string {
  return createHash('sha256').update(svg, 'utf8').digest('hex')
}

export function resolveUploadsRoot(cwd = process.cwd()): string {
  return join(cwd, 'uploads')
}

/**
 * 不可变 SVG 资源：文件名=内容哈希，禁止覆盖不同内容。
 * 路径：uploads/industrial-svg/<sha256>.svg
 */
export function persistImmutableIndustrialSvg(
  svg: string,
  cwd = process.cwd(),
): { contentHash: string; relativePath: string; absolutePath: string; fileSize: number } {
  const security = validateIndustrialSvgForImmutableStorage(svg)
  if (!security.ok) {
    throw new Error(`SVG_SECURITY_REJECTED: ${security.errors.join('; ')}`)
  }

  const normalized = svg.endsWith('\n') ? svg : `${svg}\n`
  const contentHash = hashSvgContent(normalized)
  const dir = join(resolveUploadsRoot(cwd), INDUSTRIAL_SVG_STORAGE_SUBDIR)
  mkdirSync(dir, { recursive: true })
  const fileName = `${contentHash}.svg`
  const absolutePath = join(dir, fileName)
  const relativePath = `${INDUSTRIAL_SVG_STORAGE_SUBDIR}/${fileName}`
  assertSafeIndustrialSvgStoragePath(contentHash, relativePath)

  if (existsSync(absolutePath)) {
    const existing = readFileSync(absolutePath, 'utf8')
    if (existing !== normalized) {
      // 同哈希不同内容：拒绝覆盖
      throw new Error('SVG_HASH_COLLISION: refusing to overwrite immutable asset')
    }
    // 同内容：幂等复用
  } else {
    writeFileSync(absolutePath, normalized, 'utf8')
  }

  return {
    contentHash,
    relativePath,
    absolutePath,
    fileSize: Buffer.byteLength(normalized, 'utf8'),
  }
}

export function readImmutableIndustrialSvg(
  contentHash: string,
  cwd = process.cwd(),
): string | null {
  if (!/^[a-f0-9]{64}$/.test(contentHash)) return null
  const relativePath = `${INDUSTRIAL_SVG_STORAGE_SUBDIR}/${contentHash}.svg`
  try {
    assertSafeIndustrialSvgStoragePath(contentHash, relativePath)
  } catch {
    return null
  }
  const p = join(resolveUploadsRoot(cwd), INDUSTRIAL_SVG_STORAGE_SUBDIR, `${contentHash}.svg`)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

/**
 * 历史训练 / 正式题图契约（STEP_09 + STEP_10）。
 *
 * 已实现：
 * - 内容寻址不可变文件
 * - 题-资源关联 chem_train_item_assets（D043）
 * - 会话快照 chem_train_session_item_assets（D045，支持一题多图）
 * - 学生受控读取 GET /chemistry/train/sessions/.../assets/:id/svg
 * - 公开 /uploads/industrial-svg 已在 main.ts 403 阻断
 * - 题目禁用后历史仍用会话快照哈希还原
 */
export const INDUSTRIAL_SVG_SESSION_CONTRACT = {
  version: '1.2',
  rule: 'Session must persist multi-asset snapshots (contentHash+role+sort); never use current item_assets as history; never overwrite hash-named files',
  storagePattern: 'uploads/industrial-svg/{sha256}.svg',
  publicStaticBlocked: true,
  publicUrlPattern: '/uploads/industrial-svg/{sha256}.svg',
  adminControlledPattern: '/chemistry/admin/industrial-candidates/svg/{sha256}',
  studentControlledPattern:
    '/chemistry/train/sessions/{sessionId}/items/{sessionItemId}/assets/{snapshotId}/svg',
  itemAssetTable: 'chem_train_item_assets',
  sessionAssetTable: 'chem_train_session_item_assets',
  sessionSnapshot: 'IMPLEMENTED_STEP_10',
  note: 'CASCADE on item/session_item delete removes association/snapshot rows only; physical SVG retained',
} as const

/** 学生/训练侧安全资源描述（不含绝对路径与内部审核字段） */
export type IndustrialSafeAssetDto = {
  assetType: string
  assetRole: string
  contentHash: string
  diagramVersion: string
  mimeType: string
  sortOrder: number
  /** 内容寻址资源键；非服务器绝对路径 */
  resourceKey: string
  /**
   * 建议读取标识：admin 受控路径或 content-addressed 静态前缀。
   * STEP_10 学生端应替换为会话授权读取。
   */
  safeResourceUrl: string
}
