/** 接口与静态资源根地址；空字符串表示同域（nginx 反代） */
export function apiBaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL
  if (v === undefined || v === null) return 'http://localhost:3000'
  return String(v).replace(/\/$/, '')
}

export function fileUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = apiBaseUrl()
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}
