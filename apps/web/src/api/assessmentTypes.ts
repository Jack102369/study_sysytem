import http, { type ApiSuccess } from './http'

export type AssessmentType = {
  id: string
  name: string
  sortOrder: number
  isArchived: boolean
  createdAt: string
}

export async function listAssessmentTypes(includeArchived = false) {
  const { data } = await http.get<ApiSuccess<AssessmentType[]>>('/assessment-types', {
    params: includeArchived ? { includeArchived: true } : undefined,
  })
  return data.data
}

export async function createAssessmentType(payload: {
  name: string
  sortOrder?: number
}) {
  const { data } = await http.post<ApiSuccess<AssessmentType>>(
    '/assessment-types',
    payload,
  )
  return data.data
}

export async function updateAssessmentType(
  id: string,
  payload: Partial<{ name: string; sortOrder: number; isArchived: boolean }>,
) {
  const { data } = await http.patch<ApiSuccess<AssessmentType>>(
    `/assessment-types/${id}`,
    payload,
  )
  return data.data
}
