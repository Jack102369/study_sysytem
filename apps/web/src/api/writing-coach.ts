import http, { type ApiSuccess } from './http'

export type WritingSubjectTrack = 'chinese' | 'english'
export type WritingTopicSource = 'manual' | 'ai'
export type WritingReviewMode = 'structure' | 'gaokao'
export type WritingReviewLevel = 'pass' | 'weak' | 'fail'

export type WritingReviewDimension = {
  level: WritingReviewLevel
  reason: string
  suggestion: string
}

export type WritingStructureReview = {
  onTopic: WritingReviewDimension
  evidence: WritingReviewDimension
  transition: WritingReviewDimension
  overallHint: string
}

export type WritingGaokaoDimension = {
  key: string
  label: string
  score: number
  fullScore: number
  comment: string
}

export type WritingGaokaoReview = {
  kind: 'gaokao'
  totalScore: number
  fullScore: number
  dimensions: WritingGaokaoDimension[]
  analysis: string
  deductions: string[]
  suggestions: string[]
  overall: string
  modelEssay?: string
  modelEssayNotes?: string[]
}

export type WritingReviewJson = WritingStructureReview | WritingGaokaoReview

export function isGaokaoReview(r: WritingReviewJson | null | undefined): r is WritingGaokaoReview {
  return !!r && (r as WritingGaokaoReview).kind === 'gaokao'
}

export type WritingCoachSession = {
  id: string
  subjectTrack: WritingSubjectTrack
  topicSource: WritingTopicSource
  reviewMode: WritingReviewMode
  topicText: string
  topicRequirements: string | null
  outlineText: string | null
  openingText: string | null
  finalDraftText: string | null
  review: WritingReviewJson | null
  reviewModel: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export async function listWritingCoach(params: {
  subjectTrack?: WritingSubjectTrack
  topicSource?: WritingTopicSource
  reviewMode?: WritingReviewMode
  hasReview?: 'yes' | 'no'
  keyword?: string
  page?: number
  pageSize?: number
} = {}) {
  const { data } = await http.get<
    ApiSuccess<{
      items: WritingCoachSession[]
      total: number
      page: number
      pageSize: number
    }>
  >('/writing-coach', { params })
  return data.data
}

export async function getWritingCoach(id: string) {
  const { data } = await http.get<ApiSuccess<WritingCoachSession>>(`/writing-coach/${id}`)
  return data.data
}

export async function createWritingCoach(payload: {
  subjectTrack: WritingSubjectTrack
  topicSource?: WritingTopicSource
  reviewMode?: WritingReviewMode
  topicText: string
  topicRequirements?: string | null
  outlineText?: string | null
  openingText?: string | null
  finalDraftText?: string | null
}) {
  const { data } = await http.post<ApiSuccess<WritingCoachSession>>('/writing-coach', payload)
  return data.data
}

export async function updateWritingCoach(
  id: string,
  payload: {
    topicSource?: WritingTopicSource
    reviewMode?: WritingReviewMode
    topicText?: string
    topicRequirements?: string | null
    outlineText?: string | null
    openingText?: string | null
    finalDraftText?: string | null
  },
) {
  const { data } = await http.patch<ApiSuccess<WritingCoachSession>>(
    `/writing-coach/${id}`,
    payload,
  )
  return data.data
}

export async function deleteWritingCoach(id: string) {
  const { data } = await http.delete<ApiSuccess<{ id: string }>>(`/writing-coach/${id}`)
  return data.data
}

export async function generateWritingTopic(payload: {
  subjectTrack: WritingSubjectTrack
  hint?: string | null
}) {
  const { data } = await http.post<
    ApiSuccess<{
      subjectTrack: WritingSubjectTrack
      topicSource: 'ai'
      topicText: string
      topicRequirements: string | null
      model: string
    }>
  >('/writing-coach/generate-topic', payload, { timeout: 180000 })
  return data.data
}

export async function reviewWritingCoach(payload: {
  id?: string
  subjectTrack?: WritingSubjectTrack
  topicText?: string
  topicRequirements?: string | null
  outlineText?: string
  openingText?: string
}) {
  const { data } = await http.post<
    ApiSuccess<{
      session: WritingCoachSession | null
      review: WritingStructureReview
      model: string
    }>
  >('/writing-coach/review', payload, { timeout: 180000 })
  return data.data
}

export async function reviewGaokaoWritingCoach(payload: {
  id?: string
  subjectTrack?: WritingSubjectTrack
  topicText?: string
  topicRequirements?: string | null
  essayText?: string
}) {
  const { data } = await http.post<
    ApiSuccess<{
      session: WritingCoachSession | null
      review: WritingGaokaoReview
      model: string
    }>
  >('/writing-coach/gaokao-review', payload, { timeout: 180000 })
  return data.data
}

export async function ocrWritingCoachImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.post<
    ApiSuccess<{ text: string; confidence: number | null; engine: string }>
  >('/writing-coach/ocr', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  })
  return data.data
}
