import http, { type ApiSuccess } from './http'

export const CHEM_KB_TYPES = [
  'element',
  'substance',
  'reaction',
  'experiment',
  'formula',
  'concept',
  'knowledge',
  'question',
] as const

export type ChemKbType = (typeof CHEM_KB_TYPES)[number]

export const CHEM_KB_STATUSES = [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived',
] as const

export type ChemKbStatus = (typeof CHEM_KB_STATUSES)[number]

export const CHEM_KB_TYPE_LABELS: Record<ChemKbType, string> = {
  element: '元素',
  substance: '物质',
  reaction: '反应',
  experiment: '实验',
  formula: '公式',
  concept: '规律',
  knowledge: '知识点',
  question: '题目',
}

export const CHEM_KB_STATUS_LABELS: Record<ChemKbStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  published: '已发布',
  rejected: '已驳回',
  archived: '已归档',
}

export type ChemKbPage<T = Record<string, unknown>> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type ChemKbListQuery = {
  page?: number
  pageSize?: number
  q?: string
  status?: string
}

export async function listChemKb(
  type: ChemKbType,
  query: ChemKbListQuery = {},
) {
  const { data } = await http.get<ApiSuccess<ChemKbPage>>(
    `/chemistry/kb/${type}`,
    { params: query },
  )
  return data.data
}

export async function getChemKb(type: ChemKbType, id: string) {
  const { data } = await http.get<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/kb/${type}/${encodeURIComponent(id)}`,
  )
  return data.data
}

export async function adminListChemKb(
  type: ChemKbType,
  query: ChemKbListQuery = {},
) {
  const { data } = await http.get<ApiSuccess<ChemKbPage>>(
    `/chemistry/admin/kb/${type}`,
    { params: query },
  )
  return data.data
}

export async function adminGetChemKb(type: ChemKbType, id: string) {
  const { data } = await http.get<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/kb/${type}/${encodeURIComponent(id)}`,
  )
  return data.data
}

export async function adminCreateChemKb(
  type: ChemKbType,
  body: Record<string, unknown>,
) {
  const { data } = await http.post<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/kb/${type}`,
    body,
  )
  return data.data
}

export async function adminUpdateChemKb(
  type: ChemKbType,
  id: string,
  body: Record<string, unknown>,
) {
  const { data } = await http.patch<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/kb/${type}/${encodeURIComponent(id)}`,
    body,
  )
  return data.data
}

export async function adminSetChemKbStatus(
  type: ChemKbType,
  id: string,
  payload: { status: ChemKbStatus; reviewNote?: string },
) {
  const { data } = await http.patch<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/kb/${type}/${encodeURIComponent(id)}/status`,
    payload,
  )
  return data.data
}

export async function adminSetChemKbLinks(
  type: ChemKbType,
  id: string,
  payload: Record<string, unknown>,
) {
  const { data } = await http.put<ApiSuccess<Record<string, unknown>>>(
    `/chemistry/admin/kb/${type}/${encodeURIComponent(id)}/links`,
    payload,
  )
  return data.data
}

export type ChemKbImportResult = {
  successCount: number
  failCount: number
  results: Array<{
    index: number
    type: string
    ok: boolean
    id?: string
    errors: string[]
  }>
}

export async function adminImportChemKb(items: Array<{
  type: string
  data: Record<string, unknown>
}>) {
  const { data } = await http.post<ApiSuccess<ChemKbImportResult>>(
    '/chemistry/admin/kb/import',
    { items },
  )
  return data.data
}
