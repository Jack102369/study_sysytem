/**
 * APPLICATION-3D-5：为 Vision 批改安全加载当前 session item 已提交图片。
 * 纯函数 + 仓储行输入；不外发、不改文件、不暴露 storage_key。
 */
import {
  HS_MATH_APPLICATION_IMAGE_MAX_BYTES,
  HS_MATH_APPLICATION_IMAGE_MAX_COUNT,
  HS_MATH_APPLICATION_IMAGE_MIMES,
} from '../hs-math.constants'
import type { HsMathTrainSessionItemImage } from '../entities/hs-math-train-session-item-image.entity'
import {
  HsMathApplicationImageStorageError,
  readApplicationImageFile,
} from './hs-math-application-image-storage'

const MIME_SET = new Set<string>(HS_MATH_APPLICATION_IMAGE_MIMES)

export type HsMathVisionLoadedImage = {
  imageId: string
  mime: string
  sizeBytes: number
  /** raw bytes；调用方转 Base64，勿写入日志 */
  buffer: Buffer
}

export type HsMathVisionImageLoadOk = {
  ok: true
  images: HsMathVisionLoadedImage[]
}

export type HsMathVisionImageLoadErr = {
  ok: false
  code: string
  message: string
}

export type HsMathVisionImageLoadResult =
  | HsMathVisionImageLoadOk
  | HsMathVisionImageLoadErr

/** 保序去重 imageIds */
export function normalizeVisionImageIds(imageIds: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of imageIds) {
    const id = String(raw ?? '').trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/**
 * 从已加载的图片行 + 磁盘读取 Buffer。
 * rows 须由调用方按 userId/sessionItemId 查询；本函数再校验引用与状态。
 */
export function loadVisionImagesForGrading(input: {
  userId: string
  sessionItemId: string
  imageIds: string[]
  rows: HsMathTrainSessionItemImage[]
  /** 测试可注入；默认读私有盘 */
  readFile?: (storageKey: string) => Buffer
}): HsMathVisionImageLoadResult {
  const ids = normalizeVisionImageIds(input.imageIds)
  if (!ids.length) {
    return { ok: false, code: 'NO_IMAGES', message: '无引用图片' }
  }
  if (ids.length > HS_MATH_APPLICATION_IMAGE_MAX_COUNT) {
    return {
      ok: false,
      code: 'TOO_MANY_IMAGES',
      message: `图片超过限制（最多 ${HS_MATH_APPLICATION_IMAGE_MAX_COUNT} 张）`,
    }
  }

  const byId = new Map(input.rows.map((r) => [String(r.id), r]))
  const readFile = input.readFile || readApplicationImageFile
  const images: HsMathVisionLoadedImage[] = []

  for (const id of ids) {
    const row = byId.get(id)
    if (!row) {
      return {
        ok: false,
        code: 'IMAGE_MISSING',
        message: `图片不存在或不属于本题：${id}`,
      }
    }
    if (String(row.userId) !== String(input.userId)) {
      return {
        ok: false,
        code: 'IMAGE_FORBIDDEN',
        message: '图片不属于当前用户',
      }
    }
    if (String(row.sessionItemId) !== String(input.sessionItemId)) {
      return {
        ok: false,
        code: 'IMAGE_WRONG_ITEM',
        message: '图片不属于当前 session item',
      }
    }
    if (row.status !== 'submitted') {
      return {
        ok: false,
        code: 'IMAGE_NOT_SUBMITTED',
        message: '拒绝 draft 或未提交图片',
      }
    }
    const mime = String(row.mimeType || '')
      .trim()
      .toLowerCase()
    if (!MIME_SET.has(mime)) {
      return {
        ok: false,
        code: 'IMAGE_BAD_MIME',
        message: `非法 MIME：${mime || '(empty)'}`,
      }
    }
    const declared = Number(row.sizeBytes) || 0
    if (declared <= 0 || declared > HS_MATH_APPLICATION_IMAGE_MAX_BYTES) {
      return {
        ok: false,
        code: 'IMAGE_BAD_SIZE',
        message: '图片大小非法或超限',
      }
    }

    let buffer: Buffer
    try {
      buffer = readFile(row.storageKey)
    } catch (e) {
      const code =
        e instanceof HsMathApplicationImageStorageError
          ? e.code
          : 'IMAGE_READ_FAIL'
      return {
        ok: false,
        code: code === 'NOT_FOUND' ? 'IMAGE_FILE_MISSING' : 'IMAGE_READ_FAIL',
        message: '图片文件不可读',
      }
    }
    if (!buffer?.length) {
      return {
        ok: false,
        code: 'IMAGE_FILE_EMPTY',
        message: '图片文件为空',
      }
    }
    if (buffer.length > HS_MATH_APPLICATION_IMAGE_MAX_BYTES) {
      return {
        ok: false,
        code: 'IMAGE_BAD_SIZE',
        message: '图片文件超过大小限制',
      }
    }

    images.push({
      imageId: id,
      mime,
      sizeBytes: buffer.length,
      buffer,
    })
  }

  return { ok: true, images }
}
