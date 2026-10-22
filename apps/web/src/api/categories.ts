import http, { type ApiSuccess } from './http'

export type ErrorCategory = {
  id: string
  name: string
  subjectId: string | null
  parentId: string | null
  sortOrder: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export async function listErrorCategories(params?: {
  subjectId?: string
  includeArchived?: boolean
  includeGlobal?: boolean
}) {
  const { data } = await http.get<ApiSuccess<ErrorCategory[]>>('/error-categories', {
    params: {
      subjectId: params?.subjectId,
      includeArchived: params?.includeArchived ? true : undefined,
      includeGlobal: params?.includeGlobal ? true : undefined,
    },
  })
  return data.data
}

/** 确保「月考模拟卷」特殊分类存在 */
export async function ensureSpecialExtensionCategory() {
  const { data } = await http.post<ApiSuccess<ErrorCategory>>(
    '/error-categories/ensure-special',
  )
  return data.data
}

export async function createErrorCategory(payload: {
  name: string
  subjectId?: string | null
  parentId?: string | null
  sortOrder?: number
}) {
  const { data } = await http.post<ApiSuccess<ErrorCategory>>('/error-categories', payload)
  return data.data
}

export async function updateErrorCategory(
  id: string,
  payload: Partial<{
    name: string
    subjectId: string | null
    parentId: string | null
    sortOrder: number
    isArchived: boolean
  }>,
) {
  const { data } = await http.patch<ApiSuccess<ErrorCategory>>(
    `/error-categories/${id}`,
    payload,
  )
  return data.data
}
