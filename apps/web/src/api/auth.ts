import http, { type ApiSuccess } from './http'

export type AuthUser = {
  id: string
  email: string
  nickname: string
  grade: string
  role: 'ADMIN' | 'USER'
  isDisabled?: boolean
  ocrEnabled?: boolean
  aiEnabled?: boolean
}

export async function register(payload: {
  email: string
  password: string
  nickname: string
  grade: string
}) {
  const { data } = await http.post<ApiSuccess<AuthUser>>('/auth/register', payload)
  return data.data
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await http.post<ApiSuccess<{ accessToken: string }>>('/auth/login', payload)
  return data.data
}

export async function fetchMe() {
  const { data } = await http.get<ApiSuccess<AuthUser>>('/auth/me')
  return data.data
}
