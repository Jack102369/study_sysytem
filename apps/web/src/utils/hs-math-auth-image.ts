/**
 * APPLICATION-2E：应用题图片客户端校验 / 鉴权 Blob URL / 答案构建（纯函数为主）。
 */
import {
  fetchHsMathSessionItemImageBlob,
  type HsMathApplicationUserAnswer,
} from '@/api/hs-math-train'

export const HS_MATH_APP_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const HS_MATH_APP_IMAGE_MAX_COUNT = 5
export const HS_MATH_APP_IMAGE_ACCEPT_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type HsMathGradingProvider = 'qwen' | 'deepseek'

export type ApplicationAnswerDraft = {
  text: string
  imageIds: string[]
  /** APPLICATION-3E-1：默认千问 */
  gradingProvider: HsMathGradingProvider
}

export function emptyApplicationDraft(): ApplicationAnswerDraft {
  return { text: '', imageIds: [], gradingProvider: 'qwen' }
}

export function dedupeImageIds(ids: Array<string | number>): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of ids) {
    const id = String(x)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function validateClientImageFile(
  file: File,
  currentCount: number,
): { ok: true } | { ok: false; message: string } {
  if (currentCount >= HS_MATH_APP_IMAGE_MAX_COUNT) {
    return {
      ok: false,
      message: `单题最多 ${HS_MATH_APP_IMAGE_MAX_COUNT} 张图片`,
    }
  }
  const mime = (file.type || '').toLowerCase()
  if (
    !(HS_MATH_APP_IMAGE_ACCEPT_MIMES as readonly string[]).includes(mime)
  ) {
    return { ok: false, message: '仅支持 JPEG / PNG / WebP' }
  }
  if (file.size <= 0) {
    return { ok: false, message: '文件为空' }
  }
  if (file.size > HS_MATH_APP_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      message: `单张图片不能超过 ${HS_MATH_APP_IMAGE_MAX_BYTES / (1024 * 1024)}MB`,
    }
  }
  return { ok: true }
}

/** 上传进行中禁止保存有效答案 / 提交会话 */
export function canBuildApplicationAnswer(
  text: string,
  imageIds: string[],
  uploading: boolean,
): boolean {
  if (uploading) return false
  const t = text.trim()
  const ids = dedupeImageIds(imageIds)
  return t.length > 0 || ids.length > 0
}

/**
 * 构建 application 用户作答；空答案返回 null。
 * uploading 时返回 null（调用方应禁止保存/提交）。
 */
export function buildApplicationUserAnswer(
  text: string,
  imageIds: string[],
  uploading = false,
  gradingProvider: HsMathGradingProvider = 'qwen',
): HsMathApplicationUserAnswer | null {
  if (uploading) return null
  const t = text.trim()
  const ids = dedupeImageIds(imageIds)
  if (!t && !ids.length) return null
  const provider =
    gradingProvider === 'deepseek' ? 'deepseek' : 'qwen'
  const out: HsMathApplicationUserAnswer = {
    kind: 'application',
    gradingProvider: provider,
  }
  if (t) out.text = text
  if (ids.length) out.imageIds = ids
  return out
}

export function draftFromApplicationPayload(
  payload: unknown,
): ApplicationAnswerDraft {
  if (!payload || typeof payload !== 'object') {
    return emptyApplicationDraft()
  }
  const p = payload as {
    kind?: string
    text?: unknown
    imageIds?: unknown
    gradingProvider?: unknown
  }
  if (p.kind !== 'application') return emptyApplicationDraft()
  const text = typeof p.text === 'string' ? p.text : ''
  const imageIds = Array.isArray(p.imageIds)
    ? dedupeImageIds(p.imageIds as Array<string | number>)
    : []
  const gradingProvider: HsMathGradingProvider =
    p.gradingProvider === 'deepseek' ? 'deepseek' : 'qwen'
  return { text, imageIds, gradingProvider }
}

export function revokeAuthImageObjectUrl(url: string | null | undefined) {
  if (!url) return
  try {
    URL.revokeObjectURL(url)
  } catch {
    /* ignore */
  }
}

/** JWT GET blob → object URL；调用方负责 revoke */
export async function loadAuthImageObjectUrl(
  sessionId: string,
  sessionItemId: string,
  imageId: string,
): Promise<string> {
  const blob = await fetchHsMathSessionItemImageBlob(
    sessionId,
    sessionItemId,
    imageId,
  )
  return URL.createObjectURL(blob)
}
