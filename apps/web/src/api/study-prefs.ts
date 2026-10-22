import http, { type ApiSuccess } from './http'

export type StudyCompareMode = 'score' | 'class_rank' | 'school_rank'

export type StudyPrefs = {
  userId: string
  compareMode: StudyCompareMode
  scoreThreshold: number
  rankThreshold: number
  updatedAt: string
}

export async function getStudyPrefs() {
  const { data } = await http.get<ApiSuccess<StudyPrefs>>('/study-prefs')
  return data.data
}

export async function updateStudyPrefs(payload: {
  compareMode?: StudyCompareMode
  scoreThreshold?: number
  rankThreshold?: number
}) {
  const { data } = await http.patch<ApiSuccess<StudyPrefs>>('/study-prefs', payload)
  return data.data
}
