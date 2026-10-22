import http, { type ApiSuccess } from './http'

export type KnowledgeKind = 'formula' | 'axiom' | 'theorem' | 'method'
export type KnowledgeCardStatus = 'draft' | 'active'

export type KnowledgeCard = {
  id: string
  subjectId: string
  subjectName: string | null
  kind: KnowledgeKind
  title: string
  content: string
  tip: string | null
  status: KnowledgeCardStatus
  linkedErrorQuestionIds: string[]
  createdAt: string
  updatedAt: string
}

export type KnowledgeDraft = {
  kind: KnowledgeKind
  title: string
  content: string
  tip: string
  subjectId: string
  linkErrorQuestionId?: string | null
}

export async function listKnowledgeCards(params: {
  page?: number
  pageSize?: number
  subjectId?: string
  kind?: string
  status?: string
  errorQuestionId?: string
} = {}) {
  const { data } = await http.get<
    ApiSuccess<{ items: KnowledgeCard[]; total: number; page: number; pageSize: number }>
  >('/knowledge-cards', { params })
  return data.data
}

export async function listKnowledgeByError(errorId: string) {
  const { data } = await http.get<ApiSuccess<{ items: KnowledgeCard[] }>>(
    `/knowledge-cards/by-error/${errorId}`,
  )
  return data.data
}

export async function createKnowledgeCard(payload: {
  subjectId: string
  kind: KnowledgeKind
  title: string
  content: string
  tip?: string | null
  status?: KnowledgeCardStatus
  linkErrorQuestionId?: string | null
}) {
  const { data } = await http.post<ApiSuccess<KnowledgeCard>>('/knowledge-cards', payload)
  return data.data
}

export async function batchCreateKnowledgeCards(
  items: Array<{
    subjectId: string
    kind: KnowledgeKind
    title: string
    content: string
    tip?: string | null
    linkErrorQuestionId?: string | null
  }>,
) {
  const { data } = await http.post<ApiSuccess<{ items: KnowledgeCard[] }>>(
    '/knowledge-cards/batch',
    { items },
  )
  return data.data
}

export async function updateKnowledgeCard(
  id: string,
  payload: Partial<{
    subjectId: string
    kind: KnowledgeKind
    title: string
    content: string
    tip: string | null
    status: KnowledgeCardStatus
  }>,
) {
  const { data } = await http.patch<ApiSuccess<KnowledgeCard>>(
    `/knowledge-cards/${id}`,
    payload,
  )
  return data.data
}

export async function deleteKnowledgeCard(id: string) {
  const { data } = await http.delete<ApiSuccess<{ ok: boolean }>>(`/knowledge-cards/${id}`)
  return data.data
}

export async function aiFetchKnowledge(payload: {
  subjectId: string
  topic?: string
  errorQuestionId?: string
  count?: number
}) {
  const { data } = await http.post<
    ApiSuccess<{
      model: string
      subjectId: string
      linkErrorQuestionId: string | null
      items: KnowledgeDraft[]
    }>
  >('/knowledge-cards/ai-fetch', payload, { timeout: 120000 })
  return data.data
}

export async function linkKnowledgeToError(cardId: string, errorQuestionId: string) {
  const { data } = await http.post<ApiSuccess<{ ok: boolean }>>(
    `/knowledge-cards/${cardId}/link-error`,
    { errorQuestionId },
  )
  return data.data
}

export async function unlinkKnowledgeFromError(cardId: string, errorId: string) {
  const { data } = await http.delete<ApiSuccess<{ ok: boolean }>>(
    `/knowledge-cards/${cardId}/link-error/${errorId}`,
  )
  return data.data
}
