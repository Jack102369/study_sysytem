import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { resolveAiOcrVisionChatCompletionsUrl } from './util/ai-ocr-vision-url'

/** Qwen 纯文本解析；配置与 OCR Vision 一致，禁止传图 */
@Injectable()
export class AiOcrQwenTextClient {
  constructor(private readonly config: ConfigService) {}

  private visionApiUrlRaw(): string {
    return (
      this.config.get<string>('OCR_VISION_API_URL', '') ||
      this.config.get<string>('HS_MATH_VISION_API_URL', '') ||
      ''
    ).trim()
  }

  private visionApiKey(): string {
    return (
      this.config.get<string>('OCR_VISION_API_KEY', '') ||
      this.config.get<string>('HS_MATH_VISION_API_KEY', '') ||
      ''
    ).trim()
  }

  private visionModel(): string {
    return (
      (
        this.config.get<string>('OCR_VISION_MODEL', '') ||
        this.config.get<string>('HS_MATH_VISION_MODEL', '') ||
        'qwen3.8-27b'
      ).trim() || 'qwen3.8-27b'
    )
  }

  private visionTimeoutMs(): number {
    const n = Number(
      this.config.get<string>('OCR_VISION_TIMEOUT_MS', '') || '180000',
    )
    return Number.isFinite(n) && n >= 5000 ? n : 180_000
  }

  async chatText(params: {
    system: string
    user: string
    maxTokens?: number
  }): Promise<{ content: string; model: string; finishReason: string | null }> {
    const key = this.visionApiKey()
    const endpoint = resolveAiOcrVisionChatCompletionsUrl(this.visionApiUrlRaw())
    if (!key || !endpoint) {
      throw new ServiceUnavailableException(
        '未配置 Qwen Vision（OCR_VISION_* 或 HS_MATH_VISION_*），无法解析',
      )
    }
    const model = this.visionModel()
    const timeoutMs = this.visionTimeoutMs()
    // 上游网关对超长生成常 504 空包；默认 2048，配合短 JSON prompt
    const maxTokens =
      typeof params.maxTokens === 'number' && params.maxTokens >= 256
        ? Math.min(Math.floor(params.maxTokens), 4096)
        : 2048

    const attempt = async (tokens: number) => {
      const body = {
        model,
        messages: [
          { role: 'system', content: String(params.system) },
          { role: 'user', content: String(params.user) },
        ],
        max_tokens: tokens,
        temperature: 0.1,
        stream: false,
      }
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), timeoutMs)
      let res: Response
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
          signal: ac.signal,
        })
      } catch (e) {
        const aborted =
          (e instanceof Error && e.name === 'AbortError') ||
          String(e).toLowerCase().includes('abort')
        throw new ServiceUnavailableException(
          aborted
            ? `Qwen 解析超时（${timeoutMs}ms）`
            : `Qwen 解析失败: ${(e as Error).message || e}`,
        )
      } finally {
        clearTimeout(timer)
      }
      const bodyText = await res.text()
      let raw: {
        error?: { message?: string }
        model?: string
        choices?: Array<{
          message?: { content?: string }
          finish_reason?: string
        }>
      }
      try {
        raw = JSON.parse(bodyText || '{}') as typeof raw
      } catch {
        throw new ServiceUnavailableException(
          bodyText.trim()
            ? `Qwen 返回非 JSON（HTTP ${res.status}），可能被网关超时截断`
            : `Qwen 返回空响应（HTTP ${res.status}），请稍后重试或改用 DeepSeek`,
        )
      }
      if (!res.ok) {
        const err = new ServiceUnavailableException(
          raw.error?.message
            ? `Qwen 解析失败: ${String(raw.error.message).slice(0, 120)}`
            : `Qwen 解析 HTTP ${res.status}`,
        ) as ServiceUnavailableException & { httpStatus?: number }
        err.httpStatus = res.status
        throw err
      }
      const choice = raw.choices?.[0]
      const content = String(choice?.message?.content || '').trim()
      if (!content) {
        throw new ServiceUnavailableException('Qwen 未返回有效解析内容')
      }
      return {
        content,
        model: String(raw.model || model).slice(0, 64),
        finishReason: choice?.finish_reason
          ? String(choice.finish_reason)
          : null,
      }
    }

    try {
      return await attempt(maxTokens)
    } catch (e) {
      const httpStatus = (e as { httpStatus?: number })?.httpStatus
      // 网关 504/502 空包时降 token 再试一次
      if (httpStatus === 504 || httpStatus === 502 || httpStatus === 524) {
        const retryTokens = Math.min(1024, maxTokens)
        try {
          return await attempt(retryTokens)
        } catch {
          throw e
        }
      }
      throw e
    }
  }
}
