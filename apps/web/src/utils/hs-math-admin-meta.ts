/**
 * CORE-1A-3.1：管理员来源/方法/审核版本纯逻辑（无 I/O，供 UI 与 Mock 自测复用）
 */
import type {
  HsMathAdminTrainItem,
  HsMathAdminTrainItemMethod,
  HsMathReviewPanel,
  HsMathSourceLicense,
  HsMathSourceType,
  HsMathSourceVerification,
  PutHsMathContentMetaBody,
} from '@/api/hs-math-admin'

export type SourceMethodDraft = {
  sourceType: HsMathSourceType
  sourceYear: number | null
  sourceExamName: string
  sourceQuestionNo: string
  sourceReference: string
  sourceAdaptationNote: string
  sourceVerificationStatus: HsMathSourceVerification
  sourceLicenseStatus: HsMathSourceLicense
  methodIds: string[]
  primaryMethodId: string
}

export const HS_MATH_SOURCE_FIELD_LIMITS = {
  sourceExamName: 128,
  sourceQuestionNo: 32,
  sourceReference: 512,
  sourceAdaptationNote: 512,
  methodCode: 64,
  methodName: 64,
  methodSummary: 512,
} as const

export function normalizeSourceMethodDraft(
  d: SourceMethodDraft,
): SourceMethodDraft {
  const methodIds = [...new Set(d.methodIds.filter(Boolean))]
  let primary = d.primaryMethodId || ''
  if (primary && !methodIds.includes(primary)) primary = ''
  if (!primary && methodIds.length === 1) primary = methodIds[0]
  return {
    sourceType: d.sourceType || 'original',
    sourceYear: d.sourceYear == null || Number.isNaN(d.sourceYear) ? null : d.sourceYear,
    sourceExamName: (d.sourceExamName || '').trim(),
    sourceQuestionNo: (d.sourceQuestionNo || '').trim(),
    sourceReference: (d.sourceReference || '').trim(),
    sourceAdaptationNote: (d.sourceAdaptationNote || '').trim(),
    sourceVerificationStatus: d.sourceVerificationStatus || 'unverified',
    sourceLicenseStatus: d.sourceLicenseStatus || 'unknown',
    methodIds,
    primaryMethodId: primary,
  }
}

export function draftFromTrainItem(
  detail: Pick<
    HsMathAdminTrainItem,
    | 'sourceType'
    | 'sourceYear'
    | 'sourceExamName'
    | 'sourceQuestionNo'
    | 'sourceReference'
    | 'sourceAdaptationNote'
    | 'sourceVerificationStatus'
    | 'sourceLicenseStatus'
    | 'methods'
  >,
): SourceMethodDraft {
  const methods = detail.methods || []
  return normalizeSourceMethodDraft({
    sourceType: detail.sourceType || 'original',
    sourceYear: detail.sourceYear ?? null,
    sourceExamName: detail.sourceExamName || '',
    sourceQuestionNo: detail.sourceQuestionNo || '',
    sourceReference: detail.sourceReference || '',
    sourceAdaptationNote: detail.sourceAdaptationNote || '',
    sourceVerificationStatus: detail.sourceVerificationStatus || 'unverified',
    sourceLicenseStatus: detail.sourceLicenseStatus || 'unknown',
    methodIds: methods.map((m) => m.id),
    primaryMethodId: methods.find((m) => m.isPrimary)?.id || '',
  })
}

export function sourcePartEqual(a: SourceMethodDraft, b: SourceMethodDraft): boolean {
  return (
    a.sourceType === b.sourceType &&
    a.sourceYear === b.sourceYear &&
    a.sourceExamName === b.sourceExamName &&
    a.sourceQuestionNo === b.sourceQuestionNo &&
    a.sourceReference === b.sourceReference &&
    a.sourceAdaptationNote === b.sourceAdaptationNote &&
    a.sourceVerificationStatus === b.sourceVerificationStatus &&
    a.sourceLicenseStatus === b.sourceLicenseStatus
  )
}

export function methodsPartEqual(a: SourceMethodDraft, b: SourceMethodDraft): boolean {
  if (a.methodIds.length !== b.methodIds.length) return false
  for (let i = 0; i < a.methodIds.length; i++) {
    if (a.methodIds[i] !== b.methodIds[i]) return false
  }
  const pa = a.methodIds.length ? a.primaryMethodId || null : null
  const pb = b.methodIds.length ? b.primaryMethodId || null : null
  return pa === pb
}

export function contentMetaEqual(a: SourceMethodDraft, b: SourceMethodDraft): boolean {
  const na = normalizeSourceMethodDraft(a)
  const nb = normalizeSourceMethodDraft(b)
  return sourcePartEqual(na, nb) && methodsPartEqual(na, nb)
}

export type ContentMetaDiff = {
  sourceChanged: boolean
  methodsChanged: boolean
  changed: boolean
}

export function diffContentMeta(
  baseline: SourceMethodDraft,
  current: SourceMethodDraft,
): ContentMetaDiff {
  const a = normalizeSourceMethodDraft(baseline)
  const b = normalizeSourceMethodDraft(current)
  const sourceChanged = !sourcePartEqual(a, b)
  const methodsChanged = !methodsPartEqual(a, b)
  return {
    sourceChanged,
    methodsChanged,
    changed: sourceChanged || methodsChanged,
  }
}

export function validateSourceMethodDraft(d: SourceMethodDraft): string | null {
  const n = normalizeSourceMethodDraft(d)
  const L = HS_MATH_SOURCE_FIELD_LIMITS
  if (n.sourceExamName.length > L.sourceExamName) {
    return `试卷名称过长（≤${L.sourceExamName}）`
  }
  if (n.sourceQuestionNo.length > L.sourceQuestionNo) {
    return `题号过长（≤${L.sourceQuestionNo}）`
  }
  if (n.sourceReference.length > L.sourceReference) {
    return `出处过长（≤${L.sourceReference}）`
  }
  if (n.sourceAdaptationNote.length > L.sourceAdaptationNote) {
    return `改编说明过长（≤${L.sourceAdaptationNote}）`
  }
  if (n.methodIds.length && !n.primaryMethodId) {
    return '有方法关联时请指定主要方法'
  }
  if (n.primaryMethodId && !n.methodIds.includes(n.primaryMethodId)) {
    return '主方法必须属于已选方法'
  }
  if (
    (n.sourceType === 'adapted' || n.sourceType === 'past_exam') &&
    n.sourceYear != null &&
    (n.sourceYear < 1990 || n.sourceYear > 2100)
  ) {
    return '年份须在 1990–2100'
  }
  return null
}

export function validateMethodForm(input: {
  code: string
  name: string
  summary?: string
  isCreate: boolean
}): string | null {
  const code = (input.code || '').trim()
  const name = (input.name || '').trim()
  const summary = (input.summary || '').trim()
  if (input.isCreate && !code) return '请填写 code'
  if (!name) return '请填写名称'
  if (code.length > HS_MATH_SOURCE_FIELD_LIMITS.methodCode) {
    return `code 过长（≤${HS_MATH_SOURCE_FIELD_LIMITS.methodCode}）`
  }
  if (name.length > HS_MATH_SOURCE_FIELD_LIMITS.methodName) {
    return `名称过长（≤${HS_MATH_SOURCE_FIELD_LIMITS.methodName}）`
  }
  if (summary.length > HS_MATH_SOURCE_FIELD_LIMITS.methodSummary) {
    return `简介过长（≤${HS_MATH_SOURCE_FIELD_LIMITS.methodSummary}）`
  }
  return null
}

/**
 * 构造 content-meta body：仅包含实际变更块，避免无变化 PUT / 误触禁用方法校验。
 * 无变更时返回 null。
 */
export function buildContentMetaBody(
  baseline: SourceMethodDraft,
  current: SourceMethodDraft,
  expectedContentVersion: number,
): PutHsMathContentMetaBody | null {
  const a = normalizeSourceMethodDraft(baseline)
  const b = normalizeSourceMethodDraft(current)
  const diff = diffContentMeta(a, b)
  if (!diff.changed) return null

  const body: PutHsMathContentMetaBody = {
    expectedContentVersion,
  }

  if (diff.sourceChanged) {
    body.source = {
      sourceType: b.sourceType,
      sourceYear: b.sourceYear,
      sourceExamName: b.sourceExamName || null,
      sourceQuestionNo: b.sourceQuestionNo || null,
      sourceReference: b.sourceReference || null,
      sourceAdaptationNote: b.sourceAdaptationNote || null,
      sourceVerificationStatus: b.sourceVerificationStatus,
      sourceLicenseStatus: b.sourceLicenseStatus,
    }
  }

  if (diff.methodsChanged) {
    body.methodIds = [...b.methodIds]
    body.primaryMethodId = b.methodIds.length ? b.primaryMethodId || null : null
  }

  return body
}

export function contentMetaChangeSummary(
  baseline: SourceMethodDraft,
  current: SourceMethodDraft,
): string[] {
  const diff = diffContentMeta(baseline, current)
  const lines: string[] = []
  if (diff.sourceChanged) lines.push('来源信息有变更')
  if (diff.methodsChanged) {
    const b = normalizeSourceMethodDraft(current)
    if (!b.methodIds.length) lines.push('方法关联将清空')
    else lines.push(`方法关联：${b.methodIds.length} 个（含主方法）`)
  }
  return lines
}

export function httpStatusOf(e: unknown): number | null {
  const any = e as { response?: { status?: number }; status?: number }
  const s = any?.response?.status ?? any?.status
  return typeof s === 'number' ? s : null
}

export function isConflictHttpError(e: unknown): boolean {
  return httpStatusOf(e) === 409
}

export function adminWriteErrorHint(e: unknown, fallback: string): string {
  const s = httpStatusOf(e)
  if (s === 401) return '未登录或登录已过期（401）'
  if (s === 403) return '无管理员权限（403）'
  if (s === 404) return '资源不存在（404）'
  if (s === 409) return '版本冲突或 code 唯一冲突（409）：请刷新后重试，勿覆盖他人修改'
  if (s === 400) {
    const msg =
      (e as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message
    if (Array.isArray(msg)) return msg.join('；')
    if (typeof msg === 'string' && msg) return msg
    return '请求参数非法（400）'
  }
  return fallback
}

export type ReviewMetaMerge =
  | {
      ok: true
      itemId: string
      contentVersion: number
      detail: HsMathAdminTrainItem
    }
  | {
      ok: false
      reason: 'detail_missing' | 'id_mismatch' | 'version_mismatch'
      panelVersion: number
      detailVersion: number | null
      message: string
    }

/** 审核 panel 与 getById 合并前必须身份+版本一致 */
export function mergeReviewPanelWithDetail(
  panel: Pick<HsMathReviewPanel, 'itemId' | 'contentVersion'>,
  detail: HsMathAdminTrainItem | null,
): ReviewMetaMerge {
  if (!detail) {
    return {
      ok: false,
      reason: 'detail_missing',
      panelVersion: panel.contentVersion,
      detailVersion: null,
      message: '来源/方法详情未加载；请刷新。未确认版本前不得合并展示。',
    }
  }
  if (String(detail.id) !== String(panel.itemId)) {
    return {
      ok: false,
      reason: 'id_mismatch',
      panelVersion: panel.contentVersion,
      detailVersion: detail.contentVersion,
      message: '题目身份不一致，已阻止混合展示。请刷新。',
    }
  }
  const pv = Number(panel.contentVersion)
  const dv = Number(detail.contentVersion)
  if (pv !== dv) {
    return {
      ok: false,
      reason: 'version_mismatch',
      panelVersion: pv,
      detailVersion: dv,
      message: `题目已更新：审核面板 v${pv} 与详情 v${dv} 不一致。请刷新后再审核/批准。`,
    }
  }
  return {
    ok: true,
    itemId: panel.itemId,
    contentVersion: pv,
    detail,
  }
}

export function splitPrimaryAuxMethods(methods: HsMathAdminTrainItemMethod[] | undefined): {
  primary: HsMathAdminTrainItemMethod | null
  aux: HsMathAdminTrainItemMethod[]
} {
  const list = methods || []
  const primary = list.find((m) => m.isPrimary) || null
  const aux = list.filter((m) => !m.isPrimary)
  return { primary, aux }
}

export function canActOnReviewMerge(merge: ReviewMetaMerge): boolean {
  return merge.ok === true
}
