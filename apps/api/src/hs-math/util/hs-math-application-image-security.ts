/**
 * APPLICATION-2A：应用题图片 MIME / 魔数 / 大小校验（无 DB、无外网）。
 * 不依赖额外库；JPEG/PNG/WebP 头检测。
 */
import {
  HS_MATH_APPLICATION_IMAGE_MAX_BYTES,
  HS_MATH_APPLICATION_IMAGE_MAX_COUNT,
  HS_MATH_APPLICATION_IMAGE_MIMES,
  type HsMathApplicationImageMime,
} from '../hs-math.constants'

export type ImageSecurityOk = {
  ok: true
  mime: HsMathApplicationImageMime
  sizeBytes: number
}

export type ImageSecurityErr = {
  ok: false
  code: string
  message: string
}

export type ImageSecurityResult = ImageSecurityOk | ImageSecurityErr

const MIME_SET = new Set<string>(HS_MATH_APPLICATION_IMAGE_MIMES)

function isJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
}

function isPng(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
}

/** RIFF....WEBP */
function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
}

export function detectImageMimeFromMagic(
  buf: Buffer,
): HsMathApplicationImageMime | null {
  if (isJpeg(buf)) return 'image/jpeg'
  if (isPng(buf)) return 'image/png'
  if (isWebp(buf)) return 'image/webp'
  return null
}

/**
 * 校验上传缓冲：非空、≤10MB、声明 MIME 白名单、魔数一致。
 * declaredMime 可空：仅以魔数为准。
 */
export function validateApplicationImageBuffer(
  buf: Buffer,
  declaredMime?: string | null,
): ImageSecurityResult {
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return { ok: false, code: 'EMPTY', message: '图片不能为空' }
  }
  if (buf.length > HS_MATH_APPLICATION_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      code: 'TOO_LARGE',
      message: `单张图片不能超过 ${HS_MATH_APPLICATION_IMAGE_MAX_BYTES} 字节`,
    }
  }

  const magic = detectImageMimeFromMagic(buf)
  if (!magic) {
    return {
      ok: false,
      code: 'BAD_MAGIC',
      message: '不支持的图片格式（仅 JPEG/PNG/WebP）',
    }
  }

  if (declaredMime != null && String(declaredMime).trim()) {
    const d = String(declaredMime).trim().toLowerCase()
    // image/jpg → image/jpeg
    const normalized = d === 'image/jpg' ? 'image/jpeg' : d
    if (!MIME_SET.has(normalized)) {
      return {
        ok: false,
        code: 'BAD_DECLARED_MIME',
        message: `声明 MIME 不在白名单：${declaredMime}`,
      }
    }
    if (normalized !== magic) {
      return {
        ok: false,
        code: 'MIME_MISMATCH',
        message: `声明 MIME（${normalized}）与文件内容（${magic}）不一致`,
      }
    }
  }

  return { ok: true, mime: magic, sizeBytes: buf.length }
}

export function assertImageCountWithinLimit(currentCount: number): void {
  if (currentCount >= HS_MATH_APPLICATION_IMAGE_MAX_COUNT) {
    throw new Error(
      `单题最多 ${HS_MATH_APPLICATION_IMAGE_MAX_COUNT} 张图片`,
    )
  }
}

export function isAllowedSessionImageStatus(s: string): boolean {
  return s === 'draft' || s === 'submitted'
}
