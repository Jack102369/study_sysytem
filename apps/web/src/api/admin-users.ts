import http, { type ApiSuccess } from './http'

export type AdminUser = {
  id: string
  email: string
  nickname: string
  grade: string
  role: 'ADMIN' | 'USER'
  isDisabled: boolean
  ocrEnabled: boolean
  aiEnabled: boolean
  /** 个人化学 AI 试运行（USER 需授权；ADMIN 恒为 true） */
  chemTrainTestEnabled: boolean
  createdAt: string
}

export async function listAdminUsers() {
  const { data } = await http.get<ApiSuccess<AdminUser[]>>('/admin/users')
  return data.data
}

export async function createAdminUser(payload: {
  email: string
  password: string
  nickname: string
  grade: string
  role?: 'ADMIN' | 'USER'
}) {
  const { data } = await http.post<ApiSuccess<AdminUser>>('/admin/users', payload)
  return data.data
}

export async function setUserDisabled(id: string, isDisabled: boolean) {
  const { data } = await http.patch<ApiSuccess<AdminUser>>(`/admin/users/${id}/disabled`, {
    isDisabled,
  })
  return data.data
}

export async function setUserOcrEnabled(id: string, ocrEnabled: boolean) {
  const { data } = await http.patch<ApiSuccess<AdminUser>>(`/admin/users/${id}/ocr-enabled`, {
    ocrEnabled,
  })
  return data.data
}

export async function setUserAiEnabled(id: string, aiEnabled: boolean) {
  const { data } = await http.patch<ApiSuccess<AdminUser>>(`/admin/users/${id}/ai-enabled`, {
    aiEnabled,
  })
  return data.data
}

export async function setUserChemTrainTestEnabled(
  id: string,
  chemTrainTestEnabled: boolean,
) {
  const { data } = await http.patch<ApiSuccess<AdminUser>>(
    `/admin/users/${id}/chem-train-test-enabled`,
    { chemTrainTestEnabled },
  )
  return data.data
}

export async function resetUserPassword(id: string, password: string) {
  const { data } = await http.post<ApiSuccess<{ ok: true }>>(
    `/admin/users/${id}/reset-password`,
    { password },
  )
  return data.data
}
