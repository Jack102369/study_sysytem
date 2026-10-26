/**
 * APPLICATION-2A：应用题图片魔数 / MIME / 大小校验（无 DB）。
 */
import {
  HS_MATH_APPLICATION_IMAGE_MAX_BYTES,
  HS_MATH_APPLICATION_IMAGE_MIMES,
  type HsMathApplicationImageMime,
} from '../hs-math.constants'

export type ApplicationImageValidationOk = {
  ok: true
  mimeType: HsMathApplicationImageMime
  sizeBytes: number
}

export type ApplicationImageValidationErr = {
  ok: false
  code: string
  message: string
}

export type ApplicationImageValidationResult =
  | ApplicationImageValidationOk
  | ApplicationImageValidationErr

function startsWith(buf: Buffer, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false
  }
  return true
}

/** 由文件头推断允许的 MIME（不信任客户端扩展名） */
export function detectApplicationImageMime(
  buf: Buffer,
): HsMathApplicationImageMime | null {
  if (buf.length < 12) return null
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png'
  }
  if (
    startsWith(buf, [0x52, 0x49, 0x46, 0x46]) &&
    buf.length >= 12 &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

export function validateApplicationImageBuffer(
  buf: Buffer,
  declaredMime?: string | null,
): ApplicationImageValidationResult {
  if (!buf || buf.length === 0) {
    return { ok: false, code: 'EMPTY', message: '图片文件为空' }
  }
  if (buf.length > HS_MATH_APPLICATION_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      code: 'TOO_LARGE',
      message: `单张图片不能超过 ${HS_MATH_APPLICATION_IMAGE_MAX_BYTES} 字节`,
    }
  }
  const detected = detectApplicationImageMime(buf)
  if (!detected) {
    return {
      ok: false,
      code: 'BAD_MAGIC',
      message: '仅支持 JPEG / PNG / WebP 图片',
    }
  }
  if (
    declaredMime &&
    declaredMime.trim() &&
    !HS_MATH_APPLICATION_IMAGE_MIMES.includes(
      declaredMime.trim() as HsMathApplicationImageMime,
    )
  ) {
    return {
      ok: false,
      code: 'BAD_DECLARED_MIME',
      message: '声明的 MIME 不在白名单内',
    }
  }
  if (
    declaredMime &&
    declaredMime.trim() &&
    declaredMime.trim() !== detected
  ) {
    return {
      ok: false,
      code: 'MIME_MISMATCH',
      message: '声明 MIME 与文件内容不一致',
    }
  }
  return { ok: true, mimeType: detected, sizeBytes: buf.length }
}

export function isApplicationImageStatus(
  v: string,
): v is import('../hs-math.constants').HsMathApplicationImageStatus {
  return v === 'draft' || v === 'submitted'
}
