import {
  loadIndustrialAiProviderConfig,
  summarizeConfig,
} from './industrial-ai-config'
import {
  IndustrialAiError,
  type IndustrialAiChatRequest,
  type IndustrialAiChatResponse,
  type IndustrialAiProvider,
  type IndustrialAiProviderConfig,
  type IndustrialAiTokenUsage,
} from './industrial-ai-provider.types'

function classifyHttpStatus(status: number): IndustrialAiError {
  if (status === 401 || status === 403) {
    return new IndustrialAiError('AI_AUTH_FAILED', `HTTP ${status} auth failed`, {
      status,
      retryable: false,
    })
  }
  if (status === 404 || status === 502 || status === 503) {
    return new IndustrialAiError(
      'AI_MODEL_UNAVAILABLE',
      `HTTP ${status} model/service unavailable`,
      { status, retryable: status >= 500 },
    )
  }
  return new IndustrialAiError('AI_HTTP_ERROR', `HTTP ${status}`, {
    status,
    retryable: status >= 500,
  })
}

/**
 * OpenAI 兼容 HTTP Provider（原生 fetch）。
 * 复用仓库 DeepSeek 环境约定；不依赖 Nest；启动不强制要求密钥。
 */
export class IndustrialAiHttpProvider implements IndustrialAiProvider {
  readonly kind = 'http' as const
  private readonly cfg: IndustrialAiProviderConfig

  constructor(cfg?: IndustrialAiProviderConfig) {
    this.cfg = cfg ?? loadIndustrialAiProviderConfig()
  }

  isAvailable(): boolean {
    return this.cfg.enabled && Boolean(this.cfg.apiKey) && Boolean(this.cfg.baseUrl)
  }

  getConfigSummary() {
    return summarizeConfig(this.cfg)
  }

  async chat(req: IndustrialAiChatRequest): Promise<IndustrialAiChatResponse> {
    if (!this.cfg.enabled) {
      throw new IndustrialAiError('AI_DISABLED', 'INDUSTRIAL_AI_ENABLED is false or no key')
    }
    if (!this.cfg.apiKey) {
      throw new IndustrialAiError('AI_CONFIG_MISSING', 'API key not configured')
    }

    const maxAttempts = 1 + Math.max(0, this.cfg.maxRetries)
    let lastErr: IndustrialAiError | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.once(req)
      } catch (e) {
        const err =
          e instanceof IndustrialAiError
            ? e
            : new IndustrialAiError('AI_UNKNOWN', String((e as Error).message || e), {
                retryable: false,
                cause: e,
              })
        lastErr = err
        if (!err.retryable || attempt >= maxAttempts - 1) throw err
      }
    }
    throw lastErr || new IndustrialAiError('AI_UNKNOWN', 'chat failed')
  }

  private async once(req: IndustrialAiChatRequest): Promise<IndustrialAiChatResponse> {
    const started = Date.now()
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), this.cfg.timeoutMs)
    let res: Response
    try {
      const body: Record<string, unknown> = {
        model: this.cfg.model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 4096,
      }
      if (req.forceJson !== false) {
        body.response_format = { type: 'json_object' }
      }
      res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
    } catch (e) {
      const msg = (e as Error).message || String(e)
      const timedOut =
        (e as Error).name === 'AbortError' || /aborted|timeout/i.test(msg)
      throw new IndustrialAiError(
        timedOut ? 'AI_TIMEOUT' : 'AI_NETWORK_ERROR',
        timedOut ? `timeout ${this.cfg.timeoutMs}ms` : msg,
        { retryable: true, cause: e },
      )
    } finally {
      clearTimeout(timer)
    }

    const raw = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
      usage?: {
        prompt_tokens?: number
        completion_tokens?: number
        total_tokens?: number
      }
      choices?: Array<{
        message?: { content?: string; reasoning_content?: string }
        finish_reason?: string
      }>
    }

    if (!res.ok) {
      const err = classifyHttpStatus(res.status)
      throw new IndustrialAiError(err.code, raw.error?.message || err.message, {
        status: res.status,
        retryable: err.retryable,
      })
    }

    const msg = raw.choices?.[0]?.message
    const content = (msg?.content || msg?.reasoning_content || '').trim()
    if (!content) {
      throw new IndustrialAiError('AI_EMPTY_RESPONSE', 'empty model content', {
        retryable: true,
      })
    }

    const usage: IndustrialAiTokenUsage =
      raw.usage != null
        ? {
            promptTokens: raw.usage.prompt_tokens ?? null,
            completionTokens: raw.usage.completion_tokens ?? null,
            totalTokens: raw.usage.total_tokens ?? null,
            available: true,
          }
        : {
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            available: false,
          }

    return {
      providerKind: 'http',
      model: this.cfg.model,
      content,
      durationMs: Date.now() - started,
      tokenUsage: usage,
      rawFinishReason: raw.choices?.[0]?.finish_reason ?? null,
    }
  }
}
