import http, { type ApiSuccess } from './http'

export type Subject = {
  id: string
  name: string
  sortOrder: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export async function listSubjects(includeArchived = false) {
  const { data } = await http.get<ApiSuccess<Subject[]>>('/subjects', {
    params: includeArchived ? { includeArchived: true } : undefined,
  })
  return data.data
}

export async function createSubject(payload: { name: string; sortOrder?: number }) {
  const { data } = await http.post<ApiSuccess<Subject>>('/subjects', payload)
  return data.data
}

export async function updateSubject(
  id: string,
  payload: Partial<{ name: string; sortOrder: number; isArchived: boolean }>,
) {
  const { data } = await http.patch<ApiSuccess<Subject>>(`/subjects/${id}`, payload)
  return data.data
}
