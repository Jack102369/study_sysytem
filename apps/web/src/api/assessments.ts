import http, { type ApiSuccess } from './http'

export type Assessment = {
  id: string
  typeId: string
  title: string
  heldAt: string
  note: string | null
  totalScore: number
  subjectsSumScore?: number
  totalFull: number | null
  classRank: number | null
  schoolRank: number | null
  scores: Array<{
    id: string
    subjectId: string
    score: number
    fullScore: number | null
    classRank: number | null
    schoolRank: number | null
    note: string | null
  }>
  tags: Array<{ id: string; name: string; color: string | null }>
}

export async function listAssessments(params: Record<string, unknown> = {}) {
  const { data } = await http.get<
    ApiSuccess<{ items: Assessment[]; total: number; page: number; pageSize: number }>
  >('/assessments', { params })
  return data.data
}

export async function getAssessment(id: string) {
  const { data } = await http.get<ApiSuccess<Assessment>>(`/assessments/${id}`)
  return data.data
}

export async function createAssessment(payload: Record<string, unknown>) {
  const { data } = await http.post<ApiSuccess<Assessment>>('/assessments', payload)
  return data.data
}

export async function updateAssessment(id: string, payload: Record<string, unknown>) {
  const { data } = await http.patch<ApiSuccess<Assessment>>(`/assessments/${id}`, payload)
  return data.data
}

export async function deleteAssessment(id: string) {
  const { data } = await http.delete(`/assessments/${id}`)
  return data.data
}

export async function fetchTrends(params: Record<string, unknown> = {}) {
  const { data } = await http.get('/assessments/trends', { params })
  return data.data
}

export async function fetchInsight(subjectId: string) {
  const { data } = await http.get(`/assessments/insight/${subjectId}`)
  return data.data
}
