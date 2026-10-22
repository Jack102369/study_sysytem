import http, { type ApiSuccess } from './http'

export async function fetchGrades() {
  const { data } = await http.get<ApiSuccess<string[]>>('/meta/grades')
  return data.data
}
