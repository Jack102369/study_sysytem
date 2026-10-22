import http, { type ApiSuccess } from './http'
import type { ErrorQuestionListItem } from './errors'

export async function fetchTodayReviews() {
  const { data } = await http.get<ApiSuccess<ErrorQuestionListItem[]>>('/reviews/today')
  return data.data
}
