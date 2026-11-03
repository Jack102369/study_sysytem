/** 对齐 OcrClient 内部 Vision URL 规范逻辑（不依赖 HsMath） */
export function resolveAiOcrVisionChatCompletionsUrl(
  rawUrl: string,
): string | null {
  const t = String(rawUrl || '').trim().replace(/\/$/, '')
  if (!t) return null
  let u: URL
  try {
    u = new URL(t)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  let path = u.pathname.replace(/\/$/, '') || ''
  if (path.endsWith('/chat/completions')) return `${u.origin}${path}`
  if (path.endsWith('/v1')) return `${u.origin}${path}/chat/completions`
  if (!path || path === '/') return `${u.origin}/v1/chat/completions`
  return `${u.origin}${path}/v1/chat/completions`
}
