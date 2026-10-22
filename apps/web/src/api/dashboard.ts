import http, { type ApiSuccess } from './http'
import type { PointsSummary } from './points'
import type { StudyPrefs } from './study-prefs'

export type DashboardMoodItem = {
  subjectId: string
  subjectName: string
  mood: 'up' | 'down' | 'flat' | 'skip'
  face: string
  label: string
  detail: string
  warn: boolean
  unmasteredErrorCount: number
  todayReviewCount: number
  masteryRate: number
}

export type DashboardOverview = {
  todayReviewCount: number
  urgentReviews: unknown[]
  scoreTrend30d: unknown[]
  weakSubjects: unknown[]
  topCategories: unknown[]
  errorStats: Record<string, unknown>
  studyPrefs?: StudyPrefs
  points?: PointsSummary
  mood?: {
    compareMode: StudyPrefs['compareMode']
    assessmentId: string | null
    title: string | null
    heldAt: string | null
    items: DashboardMoodItem[]
    summary: string
  }
}

export async function fetchDashboard() {
  const { data } = await http.get<ApiSuccess<DashboardOverview>>('/dashboard')
  return data.data
}

export async function seedDefaults() {
  const { data } = await http.post('/settings/seed-defaults')
  return data.data
}
