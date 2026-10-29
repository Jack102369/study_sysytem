import http, { type ApiSuccess } from './http'

export type IndustrialReviewListItem = {
  candidateId: string
  caseCode: string
  categoryCode: string
  qtype: string
  difficulty: number
  generationSource: string
  developmentOnly: boolean
  reviewStatus: string
  createdAt: string
  updatedAt: string
  formalPublishEligible: boolean
  qualityOverall: string | null
  blockingCount: number
  warningCount: number
  unknownCount: number
  svgContentHash: string
}

export type IndustrialCandidateListPayload = {
  items: IndustrialReviewListItem[]
  formalAllowedDesignNote: string
  e2bNote?: string
  realPublishEnabled?: boolean
  realPublishNote?: string
  defaultFormalBatchId?: string
  svgSessionContract?: unknown
}

/**
 * 与仓库其它 admin API 一致：TransformInterceptor → { success, data }，
 * 此处解包返回业务 data（勿在页面再取 axios.data.items）。
 */
export async function listIndustrialCandidates(params?: {
  status?: string
  categoryCode?: string
  qtype?: string
  batchId?: string
}): Promise<IndustrialCandidateListPayload> {
  const { data } = await http.get<ApiSuccess<IndustrialCandidateListPayload>>(
    '/chemistry/admin/industrial-candidates',
    { params },
  )
  return data.data
}

export async function getIndustrialCandidate(candidateId: string) {
  const { data } = await http.get<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/industrial-candidates/${candidateId}`,
  )
  return data.data
}

export async function patchIndustrialCandidate(
  candidateId: string,
  body: Record<string, unknown>,
) {
  const { data } = await http.patch<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/industrial-candidates/${candidateId}`,
    body,
  )
  return data.data
}

export async function recheckIndustrialCandidate(candidateId: string) {
  const { data } = await http.post<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/industrial-candidates/${candidateId}/recheck-quality`,
  )
  return data.data
}

export async function humanReviewIndustrialCandidate(
  candidateId: string,
  body: { decision: string; note?: string; expectedRevision: number },
) {
  const { data } = await http.post<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/industrial-candidates/${candidateId}/human-review`,
    body,
  )
  return data.data
}

export async function submitIndustrialAdminChecklist(
  candidateId: string,
  body: Record<string, unknown>,
) {
  const { data } = await http.post<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/industrial-candidates/${candidateId}/admin-checklist`,
    body,
  )
  return data.data
}

export async function submitIndustrialCaseReview(body: Record<string, unknown>) {
  const { data } = await http.post<ApiSuccess<Record<string, unknown>>>(
    '/chemistry/admin/industrial-candidates/case-review',
    body,
  )
  return data.data
}

export async function formalImportIndustrialCandidate(
  candidateId: string,
  body: {
    dryRun?: boolean
    confirmRealPublish?: boolean
    expectedRevision: number
  },
) {
  const { data } = await http.post<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/industrial-candidates/${candidateId}/formal-import`,
    body,
  )
  return data.data
}

/** STEP_11：绑定已 published KB（管理员）— E2-B 不应对候选调用 */
export async function bindIndustrialKbLink(body: {
  trainItemId: string
  entityType: string
  entityId: string
}) {
  const { data } = await http.post<ApiSuccess<Record<string, unknown>>>(
    '/chemistry/admin/industrial-candidates/kb-bind',
    body,
  )
  return data.data
}

/** PHASE_E2-B7：下载多模型审核包 ZIP（二进制；勿走 ApiSuccess 解包） */
export async function downloadIndustrialReviewBundle(batchId: string): Promise<{
  blob: Blob
  fileName: string
  bundleHash: string
}> {
  const id = String(batchId || '').trim()
  if (!id) throw new Error('请先选择批次 batchId')
  const res = await http.get('/chemistry/admin/industrial-candidates/export-review-bundle', {
    params: { batchId: id },
    responseType: 'blob',
    timeout: 120000,
  })
  const ct = String(res.headers?.['content-type'] || '')
  if (ct.includes('application/json')) {
    const text = await (res.data as Blob).text()
    let msg = text
    try {
      const j = JSON.parse(text)
      msg = j.message || j.error || text
    } catch {
      /* keep */
    }
    throw new Error(msg || '导出失败')
  }
  const dispo = String(res.headers?.['content-disposition'] || '')
  const m = /filename="?([^";]+)"?/i.exec(dispo)
  const fileName = m?.[1] || `industrial_review_bundle_${id}.zip`
  const bundleHash = String(res.headers?.['x-industrial-bundle-hash'] || '')
  return { blob: res.data as Blob, fileName, bundleHash }
}
