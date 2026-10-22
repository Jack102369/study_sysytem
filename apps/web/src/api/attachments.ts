import http, { type ApiSuccess } from './http'

export async function uploadAttachment(file: File) {
  const form = new FormData()
  form.append('file', file)
  // 浏览器侧真实文件名，避免 multer 中文乱码/丢失
  form.append('originalName', file.name)
  const { data } = await http.post<
    ApiSuccess<{
      id: string
      url: string
      mimeType: string | null
      originalName: string | null
    }>
  >('/attachments/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 5 * 60 * 1000,
  })
  return data.data
}
