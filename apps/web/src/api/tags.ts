import http, { type ApiSuccess } from './http'

export type Tag = {
  id: string
  name: string
  color: string | null
  createdAt: string
}

export async function listTags() {
  const { data } = await http.get<ApiSuccess<Tag[]>>('/tags')
  return data.data
}

export async function createTag(payload: { name: string; color?: string | null }) {
  const { data } = await http.post<ApiSuccess<Tag>>('/tags', payload)
  return data.data
}

export async function updateTag(
  id: string,
  payload: Partial<{ name: string; color: string | null }>,
) {
  const { data } = await http.patch<ApiSuccess<Tag>>(`/tags/${id}`, payload)
  return data.data
}

export async function deleteTag(id: string) {
  const { data } = await http.delete<ApiSuccess<{ id: string }>>(`/tags/${id}`)
  return data.data
}
