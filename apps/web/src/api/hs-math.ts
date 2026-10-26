import http, { type ApiSuccess } from './http'

export type HsMathSpecialtySummary = {
  id: string
  code: string
  name: string
  bookCode: string | null
  chapterNo: number | null
  intro: string | null
  sortOrder: number
  categoryCount: number
}

export type HsMathCategoryItem = {
  id: string
  code: string
  name: string
  sortOrder: number
}

export type HsMathSpecialtyDetail = {
  id: string
  code: string
  name: string
  bookCode: string | null
  chapterNo: number | null
  intro: string | null
  sortOrder: number
  categories: HsMathCategoryItem[]
}

export type HsMathOverviewStats = {
  completedSessions: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  pendingCount: number
  accuracy: number | null
  totalDurationMs: number
  lastTrainingAt: string | null
}

export type HsMathTrendPoint = {
  date: string
  sessionCount: number
  questionCount: number
  correctCount: number
  wrongCount: number
  pendingCount: number
  accuracy: number | null
}

export type HsMathSessionSummary = {
  sessionId: string
  sessionKind: string
  status: 'in_progress' | 'completed' | 'cancelled'
  specialtyId: string
  specialtyCode: string | null
  specialtyName: string | null
  categoryId: string
  categoryCode: string | null
  categoryName: string | null
  difficulty: number
  poolMode: string
  plannedCount: number
  questionCount: number
  answeredCount: number
  correctCount: number | null
  wrongCount: number | null
  pendingCount: number | null
  accuracy: number | null
  durationMs: number | null
  createdAt: string
  startedAt: string
  submittedAt: string | null
}

export type HsMathHome = {
  overview: HsMathOverviewStats
  weeklyTrend: HsMathTrendPoint[]
  recentSessions: HsMathSessionSummary[]
  availableSpecialties: number
  shortcuts: {
    hasHistory: boolean
    canStartSpecialtyTrain: boolean
    dailyReviewAvailable: boolean
    wrongBookAvailable: boolean
  }
}

export async function listHsMathSpecialties() {
  const { data } = await http.get<ApiSuccess<HsMathSpecialtySummary[]>>(
    '/hs-math/specialties',
  )
  return data.data
}

export async function getHsMathSpecialty(code: string) {
  const { data } = await http.get<ApiSuccess<HsMathSpecialtyDetail>>(
    `/hs-math/specialties/${encodeURIComponent(code)}`,
  )
  return data.data
}

export async function getHsMathHome() {
  const { data } = await http.get<ApiSuccess<HsMathHome>>('/hs-math/home')
  return data.data
}

export type HsMathKnowledgeListItem = {
  code: string
  name: string
  summary: string | null
  sortOrder: number
  specialtyId: string
  categoryId: string
  parentId: string | null
}

export type HsMathKnowledgeDetail = {
  code: string
  name: string
  summary: string | null
  sortOrder: number
  specialty: { id: string; code: string; name: string }
  category: { id: string; code: string; name: string }
  parent: { code: string; name: string } | null
}

export async function listHsMathKnowledgePoints(params?: {
  specialtyId?: string
  categoryId?: string
}) {
  const { data } = await http.get<ApiSuccess<HsMathKnowledgeListItem[]>>(
    '/hs-math/knowledge-points',
    { params },
  )
  return data.data
}

export async function listHsMathCategoryKnowledgePoints(categoryId: string) {
  const { data } = await http.get<ApiSuccess<HsMathKnowledgeListItem[]>>(
    `/hs-math/categories/${encodeURIComponent(categoryId)}/knowledge-points`,
  )
  return data.data
}

export async function getHsMathKnowledgePoint(code: string) {
  const { data } = await http.get<ApiSuccess<HsMathKnowledgeDetail>>(
    `/hs-math/knowledge-points/${encodeURIComponent(code)}`,
  )
  return data.data
}
