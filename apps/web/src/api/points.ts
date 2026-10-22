import http, { type ApiSuccess } from './http'

export type RewardTier = {
  id: string
  pointsNeeded: number
  title: string
  rewardNote: string | null
  sortOrder: number
  unlocked: boolean
  remain?: number
}

export type PointsSummary = {
  totalPoints: number
  weekPoints: number
  weekStart: string
  dailyCap: number
  nextTier: RewardTier | null
  unlockedTiers: RewardTier[]
  tiers: RewardTier[]
}

export type PointLedgerItem = {
  id: string
  reason: string
  reasonLabel: string
  points: number
  refType: string | null
  refId: string | null
  note: string | null
  createdAt: string
}

export async function getPointsMe() {
  const { data } = await http.get<ApiSuccess<PointsSummary>>('/points/me')
  return data.data
}

export async function listPointLedger(params: { page?: number; pageSize?: number } = {}) {
  const { data } = await http.get<
    ApiSuccess<{ items: PointLedgerItem[]; total: number; page: number; pageSize: number }>
  >('/points/ledger', { params })
  return data.data
}

export async function listRewardTiers() {
  const { data } = await http.get<ApiSuccess<{ items: RewardTier[] }>>('/points/tiers')
  return data.data
}

export async function updateRewardTier(
  id: string,
  payload: { title?: string; rewardNote?: string | null; pointsNeeded?: number },
) {
  const { data } = await http.patch<ApiSuccess<RewardTier>>(`/points/tiers/${id}`, payload)
  return data.data
}
