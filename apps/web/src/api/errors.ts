import http, { type ApiSuccess } from './http'

export type ErrorTag = { id: string; name: string; color: string | null }

export type ErrorQuestionListItem = {
  id: string
  subjectId: string
  subjectName: string | null
  categoryId: string | null
  categoryName: string | null
  occurredAt: string
  title: string | null
  stemPreview?: string | null
  hasStemImage?: boolean
  stemImageUrl?: string | null
  source: string | null
  difficulty: number | null
  status: string
  nextReviewAt: string | null
  tags: ErrorTag[]
}

export type ErrorQuestionDetail = ErrorQuestionListItem & {
  stemText: string | null
  analysisText: string | null
  keyPoints: string | null
  hasCorrectAttempt?: boolean
  extensions: Array<{
    id: string
    title: string | null
    contentText: string | null
    answerText: string | null
    questionAttachmentId: string | null
    questionAttachmentUrl: string | null
    createdAt: string
  }>
  attempts: Array<{
    id: string
    attemptedAt: string
    result: string
    timeSpentSeconds: number | null
    note: string | null
    answerAttachmentId: string | null
    answerAttachmentUrl: string | null
  }>
  attachments: Array<{
    id: string
    url: string
    mimeType: string | null
    role: string
    sortOrder: number
  }>
}

export async function listErrorQuestions(params: Record<string, unknown> = {}) {
  const { data } = await http.get<
    ApiSuccess<{ items: ErrorQuestionListItem[]; total: number; page: number; pageSize: number }>
  >('/error-questions', { params })
  return data.data
}

export async function getErrorQuestion(id: string) {
  const { data } = await http.get<ApiSuccess<ErrorQuestionDetail>>(`/error-questions/${id}`)
  return data.data
}

export async function createErrorQuestion(payload: Record<string, unknown>) {
  const { data } = await http.post<ApiSuccess<ErrorQuestionDetail>>('/error-questions', payload)
  return data.data
}

export async function updateErrorQuestion(id: string, payload: Record<string, unknown>) {
  const { data } = await http.patch<ApiSuccess<ErrorQuestionDetail>>(
    `/error-questions/${id}`,
    payload,
  )
  return data.data
}

export async function deleteErrorQuestion(id: string) {
  const { data } = await http.delete<ApiSuccess<{ id: string }>>(`/error-questions/${id}`)
  return data.data
}

export async function addExtension(id: string, payload: Record<string, unknown>) {
  const { data } = await http.post(`/error-questions/${id}/extensions`, payload)
  return data.data
}

export async function removeExtension(id: string, extensionId: string) {
  const { data } = await http.delete(`/error-questions/${id}/extensions/${extensionId}`)
  return data.data
}

export async function addAttempt(id: string, payload: Record<string, unknown>) {
  const { data } = await http.post(`/error-questions/${id}/attempts`, payload)
  return data.data
}

export async function getErrorStats() {
  const { data } = await http.get('/error-questions/stats/overview')
  return data.data
}

export async function linkAttachment(
  id: string,
  payload: { attachmentId: string; role: string; sortOrder?: number },
) {
  const { data } = await http.post(`/error-questions/${id}/attachments`, payload)
  return data.data
}

export async function unlinkAttachment(id: string, attachmentId: string) {
  const { data } = await http.delete(`/error-questions/${id}/attachments/${attachmentId}`)
  return data.data
}

export async function ocrErrorAttachment(
  attachmentId: string,
  mode: 'general' | 'formula' | 'smart' = 'general',
) {
  const { data } = await http.post<
    ApiSuccess<{
      attachmentId: string
      text: string
      confidence: number | null
      mode?: string
      engine?: string | null
    }>
  >(
    '/error-questions/ocr-attachment',
    { attachmentId, mode },
    { timeout: 180000 },
  )
  return data.data
}
