import axios from 'axios'
import { clearToken, getToken } from '@/utils/auth-token'
import { apiBaseUrl } from '@/utils/api-base'

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiFail = {
  success: false
  message: string
}

const http = axios.create({
  baseURL: apiBaseUrl() || undefined,
  timeout: 15000,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    if (status === 401) {
      clearToken()
      const { default: router } = await import('@/router')
      if (router.currentRoute.value.path !== '/login') {
        await router.push({
          path: '/login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    }
    return Promise.reject(error)
  },
)

export default http
