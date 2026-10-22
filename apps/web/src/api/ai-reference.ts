import http, { type ApiSuccess } from './http'

export type AiReferenceStatus = 'UNVERIFIED' | 'VERIFIED'

export type AiReferenceItem = {
  id: string
  sourceErrorQuestionId: string | null
  stemText: string
  answerText: string | null
  analysisText: string | null
  status: AiReferenceStatus
  model: string | null
  verifyCount: number
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export async function listAiReference(params: Record<string, unknown> = {}) {
  const { data } = await http.get<
    ApiSuccess<{
      items: AiReferenceItem[]
      total: number
      page: number
      pageSize: number
    }>
  >('/ai-reference', { params })
  return data.data
}

export async function getAiReference(id: string) {
  const { data } = await http.get<ApiSuccess<AiReferenceItem>>(`/ai-reference/${id}`)
  return data.data
}

export async function updateAiReference(
  id: string,
  payload: { stemText?: string; answerText?: string | null; analysisText?: string | null },
) {
  const { data } = await http.patch<ApiSuccess<AiReferenceItem>>(`/ai-reference/${id}`, payload)
  return data.data
}

export async function setAiReferenceVerify(id: string, status: AiReferenceStatus) {
  const { data } = await http.patch<ApiSuccess<AiReferenceItem>>(`/ai-reference/${id}/verify`, {
    status,
  })
  return data.data
}

export async function deleteAiReference(id: string) {
  const { data } = await http.delete<ApiSuccess<{ id: string }>>(`/ai-reference/${id}`)
  return data.data
}

export async function ocrAiReference(payload: {
  sourceErrorQuestionId: string
  saveToStemText?: boolean
}) {
  const { data } = await http.post<
    ApiSuccess<{
      sourceErrorQuestionId: string
      text: string
      confidence: number | null
      savedToStemText: boolean
    }>
  >('/ai-reference/ocr', payload, { timeout: 180000 })
  return data.data
}

export async function generateAiReference(payload: {
  sourceErrorQuestionId?: string
  stemText?: string
  subjectId?: string
  categoryIds?: string[]
  count?: number
  expandMode?: 'SIMILAR' | 'EXPAND'
}) {
  const { data } = await http.post<
    ApiSuccess<{ items: AiReferenceItem[]; model: string }>
  >('/ai-reference/generate', payload, { timeout: 180000 })
  return data.data
}
