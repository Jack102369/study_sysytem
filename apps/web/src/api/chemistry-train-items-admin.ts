import http, { type ApiSuccess } from './http'

export type TrainItemAdminRow = {
  id: string
  code: string
  stem: string
  qtype: string
  answerType: string
  answer: string
  difficulty: number
  specialtyCode: string
  specialtyName: string
  categoryCode: string
  categoryName: string
  pool: string
  status: string
  isActive: boolean
  qaConclusion: string | null
  verifyClass: string | null
  trialAccess: string | null
  trialAllowed: boolean
  formalAllowed: boolean
  limitReason: string
  sources: {
    entityType: string
    entityId: string
    kbCode: string | null
    kbStatus: string | null
    humanUnreviewed: boolean
  }[]
  analysis: string | null
  gateNote: string
}

export async function listAdminTrainItems(params: {
  specialtyCode?: string
  categoryCode?: string
  qa?: string
  trialFilter?: string
  pool?: string
  q?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<
    ApiSuccess<{
      total: number
      page: number
      pageSize: number
      items: TrainItemAdminRow[]
      stats: Record<string, number>
    }>
  >('/chemistry/admin/train-items', { params })
  return data.data
}
