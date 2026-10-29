import { INDUSTRIAL_SVG_MAX_BYTES } from './industrial-asset.constants'

export type IndustrialSvgSecurityResult = {
  ok: boolean
  errors: string[]
  byteLength: number
}

/**
 * 正式入库前 SVG 安全闸门（Public 图形；禁止脚本与外部引用）。
 * 不替代受控渲染器；对落盘前字节再验一次。
 */
export function validateIndustrialSvgForImmutableStorage(
  svg: string,
): IndustrialSvgSecurityResult {
  const errors: string[] = []
  const byteLength = Buffer.byteLength(svg ?? '', 'utf8')

  if (!svg || typeof svg !== 'string') {
    errors.push('SVG_EMPTY')
    return { ok: false, errors, byteLength: 0 }
  }
  if (byteLength > INDUSTRIAL_SVG_MAX_BYTES) {
    errors.push(`SVG_TOO_LARGE: ${byteLength}>${INDUSTRIAL_SVG_MAX_BYTES}`)
  }
  // 允许 XML 声明前缀；必须含根 <svg>
  if (!/^\s*(?:<\?xml[\s\S]*?\?>\s*)?<svg[\s>]/i.test(svg)) {
    errors.push('SVG_ROOT_REQUIRED')
  }
  if (/<script[\s>]/i.test(svg)) errors.push('SVG_SCRIPT_FORBIDDEN')
  if (/foreignObject/i.test(svg)) errors.push('SVG_FOREIGN_OBJECT_FORBIDDEN')
  if (/\son[a-z]+\s*=/i.test(svg)) errors.push('SVG_EVENT_HANDLER_FORBIDDEN')
  if (/javascript\s*:/i.test(svg)) errors.push('SVG_JAVASCRIPT_URI_FORBIDDEN')
  if (/xlink:href\s*=\s*["']\s*https?:/i.test(svg)) {
    errors.push('SVG_EXTERNAL_XLINK_FORBIDDEN')
  }
  if (/href\s*=\s*["']\s*https?:/i.test(svg)) {
    errors.push('SVG_EXTERNAL_HREF_FORBIDDEN')
  }
  if (/<iframe[\s>]/i.test(svg) || /<embed[\s>]/i.test(svg) || /<object[\s>]/i.test(svg)) {
    errors.push('SVG_EMBED_FORBIDDEN')
  }
  // 路径穿越相关：内容侧不应含绝对盘符或 .. 引用外部资源
  if (/\.\.[/\\]/.test(svg) && /(?:href|xlink:href|src)\s*=/i.test(svg)) {
    errors.push('SVG_PATH_TRAVERSAL_PATTERN')
  }

  return { ok: errors.length === 0, errors, byteLength }
}

/** 校验 content_hash 与相对路径形态，防路径穿越 */
export function assertSafeIndustrialSvgStoragePath(
  contentHash: string,
  storagePath: string,
): void {
  if (!/^[a-f0-9]{64}$/.test(contentHash)) {
    throw new Error('SVG_HASH_INVALID')
  }
  const expected = `industrial-svg/${contentHash}.svg`
  if (storagePath !== expected) {
    throw new Error(`SVG_STORAGE_PATH_INVALID: expected ${expected}`)
  }
  if (storagePath.includes('..') || storagePath.includes('\\') || storagePath.startsWith('/')) {
    throw new Error('SVG_PATH_TRAVERSAL_REJECTED')
  }
}
