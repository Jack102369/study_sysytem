import http, { type ApiSuccess } from './http'

export type ListeningVoice = {
  key: string
  label: string
  gender: string
  locale: string
  available: boolean
  modelPath: string | null
}

export type ListeningMaterial = {
  id: string
  title: string | null
  contentText: string
  attachmentId: string | null
  audioUrl: string | null
  voiceKey: string | null
  lengthScale: number
  durationMs: number | null
  createdAt: string
  updatedAt: string
}

export async function listListeningVoices() {
  const { data } = await http.get<ApiSuccess<{ items: ListeningVoice[] }>>(
    '/listening-materials/voices',
  )
  return data.data
}

export async function listListeningMaterials(params: Record<string, unknown> = {}) {
  const { data } = await http.get<
    ApiSuccess<{
      items: ListeningMaterial[]
      total: number
      page: number
      pageSize: number
    }>
  >('/listening-materials', { params })
  return data.data
}

export async function createListeningMaterial(payload: {
  contentText: string
  title?: string | null
  voiceKey?: string
  lengthScale?: number
}) {
  const { data } = await http.post<ApiSuccess<ListeningMaterial>>(
    '/listening-materials',
    payload,
  )
  return data.data
}

export async function deleteListeningMaterial(id: string) {
  const { data } = await http.delete<ApiSuccess<{ id: string }>>(
    `/listening-materials/${id}`,
  )
  return data.data
}
