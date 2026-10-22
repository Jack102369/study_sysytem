import http, { type ApiSuccess } from './http'

export type LearnStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'

export type ExtensionMaterial = {
  id: string
  subjectId: string
  subjectName: string | null
  categoryId: string
  categoryName: string | null
  title: string | null
  contentText: string | null
  answerText: string | null
  questionAttachmentId: string | null
  questionAttachmentUrl: string | null
  questionFileName: string | null
  learnStatus: LearnStatus
  createdAt: string
  updatedAt: string
}

export async function listExtensionMaterials(params: Record<string, unknown> = {}) {
  const { data } = await http.get<
    ApiSuccess<{
      items: ExtensionMaterial[]
      total: number
      page: number
      pageSize: number
    }>
  >('/extension-materials', { params })
  return data.data
}

export async function createExtensionMaterial(payload: Record<string, unknown>) {
  const { data } = await http.post<ApiSuccess<ExtensionMaterial>>('/extension-materials', payload)
  return data.data
}

export async function updateExtensionMaterial(id: string, payload: Record<string, unknown>) {
  const { data } = await http.patch<ApiSuccess<ExtensionMaterial>>(
    `/extension-materials/${id}`,
    payload,
  )
  return data.data
}

export async function deleteExtensionMaterial(id: string) {
  const { data } = await http.delete<ApiSuccess<{ id: string }>>(`/extension-materials/${id}`)
  return data.data
}
