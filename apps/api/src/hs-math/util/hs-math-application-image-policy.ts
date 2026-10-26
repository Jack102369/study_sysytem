/**
 * APPLICATION-2B：图片属主 / 列表视图 / 删除规则（纯函数，无 DB）。
 */
import type { HsMathSessionImageStatus } from '../hs-math.constants'
import { HS_MATH_APPLICATION_IMAGE_MAX_COUNT } from '../hs-math.constants'

export type ImageOwnershipInput = {
  jwtUserId: string
  sessionUserId: string
  sessionId: string
  sessionItemSessionId: string
  sessionItemId: string
  /** 图片操作时必填 */
  imageUserId?: string
  imageSessionItemId?: string
}

/** 属主一致则 true；否则视为越权（对外统一当不存在） */
export function assertImageOwnershipMatches(
  input: ImageOwnershipInput,
): boolean {
  const jwt = String(input.jwtUserId)
  if (String(input.sessionUserId) !== jwt) return false
  if (String(input.sessionItemSessionId) !== String(input.sessionId)) {
    return false
  }
  if (input.imageUserId !== undefined) {
    if (String(input.imageUserId) !== jwt) return false
  }
  if (input.imageSessionItemId !== undefined) {
    if (String(input.imageSessionItemId) !== String(input.sessionItemId)) {
      return false
    }
  }
  return true
}

export function canUploadApplicationImage(input: {
  sessionStatus: string
  qtype: string
  currentImageCount: number
}): { ok: true } | { ok: false; code: string; message: string } {
  if (input.sessionStatus !== 'in_progress') {
    return {
      ok: false,
      code: 'SESSION_NOT_OPEN',
      message: '仅进行中的训练可上传图片',
    }
  }
  if (input.qtype !== 'application') {
    return {
      ok: false,
      code: 'NOT_APPLICATION',
      message: '仅应用题可上传解答图片',
    }
  }
  if (input.currentImageCount >= HS_MATH_APPLICATION_IMAGE_MAX_COUNT) {
    return {
      ok: false,
      code: 'TOO_MANY',
      message: `单题最多 ${HS_MATH_APPLICATION_IMAGE_MAX_COUNT} 张图片`,
    }
  }
  return { ok: true }
}

export function canDeleteApplicationImage(input: {
  sessionStatus: string
  imageStatus: HsMathSessionImageStatus | string
}): { ok: true } | { ok: false; code: string; message: string } {
  if (input.sessionStatus !== 'in_progress') {
    return {
      ok: false,
      code: 'SESSION_LOCKED',
      message: '会话已结束，不可删除图片',
    }
  }
  if (input.imageStatus !== 'draft') {
    return {
      ok: false,
      code: 'NOT_DRAFT',
      message: '仅 draft 状态图片可删除',
    }
  }
  return { ok: true }
}

export type HsMathSessionImagePublicView = {
  imageId: string
  mimeType: string
  sizeBytes: number
  sortOrder: number
  status: string
  createdAt: Date | string
}

/** 列表/上传响应：禁止带出 storage_key / 绝对路径 / 原始文件名 */
export function toSessionImagePublicView(row: {
  id: string
  mimeType: string
  sizeBytes: number
  sortOrder: number
  status: string
  createdAt: Date | string
  storageKey?: string
}): HsMathSessionImagePublicView {
  return {
    imageId: String(row.id),
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: row.createdAt,
  }
}

export function publicViewHasNoSecrets(
  view: Record<string, unknown>,
): boolean {
  const banned = [
    'storageKey',
    'storage_key',
    'absolutePath',
    'originalName',
    'original_name',
    'path',
  ]
  return banned.every((k) => !(k in view))
}

/** 下一 sort_order：现有最大 + 1，空则为 1 */
export function nextImageSortOrder(
  existingSortOrders: number[],
): number {
  if (!existingSortOrders.length) return 1
  return Math.max(...existingSortOrders) + 1
}

/** 保存答案时校验已加载的图片行（须与 imageIds 一一对应且齐全） */
export type ImageRowForAnswerBind = {
  id: string
  userId: string
  sessionItemId: string
  status: string
}

export function verifyApplicationImagesForAnswer(input: {
  jwtUserId: string
  sessionItemId: string
  imageIds: string[]
  /** 按 id 查到的行；缺失则 length 不等 */
  images: ImageRowForAnswerBind[]
}): { ok: true } | { ok: false; code: string; message: string } {
  const byId = new Map(input.images.map((r) => [String(r.id), r]))
  if (byId.size !== input.images.length) {
    return {
      ok: false,
      code: 'DUP_ROW',
      message: '图片数据异常',
    }
  }
  for (const id of input.imageIds) {
    const row = byId.get(String(id))
    if (!row) {
      return {
        ok: false,
        code: 'IMAGE_NOT_FOUND',
        message: '图片不存在或无权引用',
      }
    }
    if (String(row.userId) !== String(input.jwtUserId)) {
      return {
        ok: false,
        code: 'IMAGE_CROSS_USER',
        message: '图片不存在或无权引用',
      }
    }
    if (String(row.sessionItemId) !== String(input.sessionItemId)) {
      return {
        ok: false,
        code: 'IMAGE_CROSS_ITEM',
        message: '图片不存在或无权引用',
      }
    }
    if (row.status !== 'draft') {
      return {
        ok: false,
        code: 'IMAGE_NOT_DRAFT',
        message: '仅可引用 draft 状态图片',
      }
    }
  }
  return { ok: true }
}

/** 当前作答 JSON 是否引用某 imageId（删除前保护） */
export function isImageIdReferencedInUserAnswer(
  payload: unknown,
  imageId: string,
): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false
  }
  const p = payload as { kind?: string; imageIds?: unknown }
  if (p.kind !== 'application' || !Array.isArray(p.imageIds)) return false
  const want = String(imageId)
  return p.imageIds.some((x) => String(x) === want)
}

// —— APPLICATION-2D：submit 锁定 / 历史快照 / 孤儿分类 ——

/** 从 application 作答 JSON 提取 imageIds（保序、去重）；非 application 或无则 [] */
export function extractApplicationImageIds(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return []
  }
  const p = payload as { kind?: string; imageIds?: unknown }
  if (p.kind !== 'application' || !Array.isArray(p.imageIds)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of p.imageIds) {
    const id = String(x)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export type ImageRowForSubmitLock = ImageRowForAnswerBind & {
  mimeType?: string
  sortOrder?: number
}

/**
 * 提交前校验：引用图须全部存在、属主一致、同 session_item、status=draft。
 * 与 verifyApplicationImagesForAnswer 语义对齐；供 submit 事务内调用。
 */
export function planSubmitImageLocks(input: {
  jwtUserId: string
  sessionItemId: string
  imageIds: string[]
  images: ImageRowForSubmitLock[]
}):
  | { ok: true; lockIds: string[] }
  | { ok: false; code: string; message: string } {
  if (!input.imageIds.length) {
    return { ok: true, lockIds: [] }
  }
  const gate = verifyApplicationImagesForAnswer({
    jwtUserId: input.jwtUserId,
    sessionItemId: input.sessionItemId,
    imageIds: input.imageIds,
    images: input.images,
  })
  if (!gate.ok) return gate
  // 稳定锁序：按数字 id 升序（字符串十进制）
  const lockIds = [...input.imageIds].sort((a, b) => {
    const na = Number(a)
    const nb = Number(b)
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) {
      return na - nb
    }
    return String(a).localeCompare(String(b))
  })
  return { ok: true, lockIds }
}

/** 将 draft 行标记为 submitted 的纯函数结果（不写库） */
export function applyDraftToSubmittedTransition(
  rows: Array<{ id: string; status: string }>,
  lockIds: string[],
  now: Date,
):
  | {
      ok: true
      updates: Array<{ id: string; status: 'submitted'; submittedAt: Date }>
    }
  | { ok: false; code: string; message: string } {
  const want = new Set(lockIds.map(String))
  const updates: Array<{
    id: string
    status: 'submitted'
    submittedAt: Date
  }> = []
  for (const row of rows) {
    const id = String(row.id)
    if (!want.has(id)) continue
    if (row.status !== 'draft') {
      return {
        ok: false,
        code: 'IMAGE_NOT_DRAFT',
        message: '仅可引用 draft 状态图片',
      }
    }
    updates.push({ id, status: 'submitted', submittedAt: now })
  }
  if (updates.length !== want.size) {
    return {
      ok: false,
      code: 'IMAGE_NOT_FOUND',
      message: '图片不存在或无权引用',
    }
  }
  return { ok: true, updates }
}

/** 历史/结果页：仅答案引用的已提交图元数据（无 storage_key） */
export type SubmittedHistoryImageView = {
  imageId: string
  mimeType: string
  sortOrder: number
}

export function toSubmittedHistoryImages(
  payload: unknown,
  rows: Array<{
    id: string
    mimeType: string
    sortOrder: number
    status: string
    storageKey?: string
  }>,
): SubmittedHistoryImageView[] {
  const ids = extractApplicationImageIds(payload)
  if (!ids.length) return []
  const byId = new Map(rows.map((r) => [String(r.id), r]))
  const out: SubmittedHistoryImageView[] = []
  for (const id of ids) {
    const row = byId.get(id)
    if (!row) continue
    // 历史快照：只展示已提交引用；draft 未提交不上屏
    if (row.status !== 'submitted') continue
    out.push({
      imageId: String(row.id),
      mimeType: row.mimeType,
      sortOrder: Number(row.sortOrder),
    })
  }
  return out
}

export type ApplicationImageOrphanKind =
  | 'unreferenced_draft'
  | 'cancel_session_draft'
  | 'replace_left_draft'

/** 最小孤儿分类（不删除；供后续清理策略引用） */
export function classifyApplicationImageOrphan(input: {
  imageStatus: string
  referencedInAnswer: boolean
  sessionStatus: string
}): ApplicationImageOrphanKind | null {
  if (input.imageStatus === 'submitted') return null
  if (input.imageStatus !== 'draft') return null
  if (input.sessionStatus === 'cancelled' && !input.referencedInAnswer) {
    return 'cancel_session_draft'
  }
  if (!input.referencedInAnswer) {
    // 含：上传未引用、保存后又换图留下的 draft
    if (input.sessionStatus === 'completed') {
      return 'unreferenced_draft'
    }
    return 'replace_left_draft'
  }
  return null
}

/** 历史 images 项不得含敏感字段 */
export function assertHistoryImagesSafe(
  images: Array<Record<string, unknown>>,
): boolean {
  return images.every((v) => publicViewHasNoSecrets(v))
}
