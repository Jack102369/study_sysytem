/**
 * APPLICATION-3D-5：Qwen Vision OpenAI 兼容客户端（原生 fetch，无 axios）。
 * 默认不外发：须 HS_MATH_VISION_GRADING_ENABLED + URL + KEY。
 * 禁止日志记录 API Key / 完整 Base64 / 学生全文。
 */
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  HS_MATH_VISION_API_KEY_ENV,
  HS_MATH_VISION_API_URL_ENV,
  HS_MATH_VISION_GRADING_ENV_ENABLED,
  HS_MATH_VISION_GRADING_TIMEOUT_MS,
  HS_MATH_VISION_LIVE_HTTP_BUDGET_ENV,
  HS_MATH_VISION_MAX_TOKENS,
  HS_MATH_VISION_MODEL_DEFAULT,
  HS_MATH_VISION_MODEL_ENV,
} from '../hs-math.constants'
import {
  HsMathVisionLiveHttpBudget,
  parseVisionLiveHttpBudget,
} from '../util/hs-math-vision-live-scope'

export type HsMathVisionImagePart = {
  mime: string
  /** base64 不含 data: 前缀 */
  base64: string
  byteLength: number
}

export type HsMathVisionGradeRequest = {
  system: string
  textUser: string
  images: HsMathVisionImagePart[]
  timeoutMs?: number
}

export type HsMathVisionGradeResponse = {
  content: string
  model: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  } | null
}

/** 将配置的 base 规范为 …/v1/chat/completions */
export function resolveHsMathVisionChatCompletionsUrl(
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
  // 禁止把任意相对路径当入口；必须绝对 URL
  let path = u.pathname.replace(/\/$/, '') || ''
  if (path.endsWith('/chat/completions')) {
    return `${u.origin}${path}`
  }
  if (path.endsWith('/v1')) {
    return `${u.origin}${path}/chat/completions`
  }
  if (!path || path === '/') {
    return `${u.origin}/v1/chat/completions`
  }
  // 其它 path：追加 /v1/chat/completions
  return `${u.origin}${path}/v1/chat/completions`
}

@Injectable()
export class HsMathQwenVisionClientService {
  private readonly logger = new Logger(HsMathQwenVisionClientService.name)
  private liveBudget: HsMathVisionLiveHttpBudget | null = null

  constructor(private readonly config: ConfigService) {}

  private getLiveBudget(): HsMathVisionLiveHttpBudget {
    if (!this.liveBudget) {
      const max = parseVisionLiveHttpBudget(
        this.config.get<string>(HS_MATH_VISION_LIVE_HTTP_BUDGET_ENV, '') || '',
      )
      this.liveBudget = new HsMathVisionLiveHttpBudget(max)
    }
    return this.liveBudget
  }

  /** 进程内已用真实 HTTP 次数（含失败） */
  getLiveHttpUsed(): number {
    return this.getLiveBudget().usedCount
  }

  getLiveHttpBudgetMax(): number {
    return this.getLiveBudget().max
  }

  isOutboundEnabled(): boolean {
    const flag = (
      this.config.get<string>(HS_MATH_VISION_GRADING_ENV_ENABLED, '') || ''
    )
      .trim()
      .toLowerCase()
    if (flag !== 'true' && flag !== '1') return false
    const key = (
      this.config.get<string>(HS_MATH_VISION_API_KEY_ENV, '') || ''
    ).trim()
    const url = resolveHsMathVisionChatCompletionsUrl(
      this.config.get<string>(HS_MATH_VISION_API_URL_ENV, '') || '',
    )
    return !!key && !!url
  }

  private apiKey(): string {
    return (this.config.get<string>(HS_MATH_VISION_API_KEY_ENV, '') || '').trim()
  }

  private model(): string {
    return (
      this.config.get<string>(HS_MATH_VISION_MODEL_ENV, '') ||
      HS_MATH_VISION_MODEL_DEFAULT
    ).trim() || HS_MATH_VISION_MODEL_DEFAULT
  }

  private endpoint(): string {
    const url = resolveHsMathVisionChatCompletionsUrl(
      this.config.get<string>(HS_MATH_VISION_API_URL_ENV, '') || '',
    )
    if (!url) {
      throw new ServiceUnavailableException(
        '未配置合法 HS_MATH_VISION_API_URL（须 http(s) 绝对地址）',
      )
    }
    return url
  }

  async gradeApplicationVision(
    params: HsMathVisionGradeRequest,
  ): Promise<HsMathVisionGradeResponse> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 HS_MATH_VISION_API_KEY',
      )
    }
    const endpoint = this.endpoint()
    const model = this.model()
    const timeoutMs =
      params.timeoutMs && params.timeoutMs > 0
        ? params.timeoutMs
        : HS_MATH_VISION_GRADING_TIMEOUT_MS

    // APPLICATION-3D-9：进程内 HTTP 预算（失败也计数；超限不重试）
    const budget = this.getLiveBudget()
    if (!budget.tryConsume()) {
      this.logger.warn(
        `vision http_budget_exceeded used=${budget.usedCount} max=${budget.max}`,
      )
      throw new ServiceUnavailableException(
        `Vision HTTP 预算已用尽（${budget.usedCount}/${budget.max}）`,
      )
    }
    this.logger.warn(
      `vision http_budget consume used=${budget.usedCount} max=${budget.max || 'unlimited'}`,
    )

    const content: Array<Record<string, unknown>> = [
      { type: 'text', text: `${params.system}\n\n${params.textUser}` },
    ]
    let totalBytes = 0
    // 顺序 = 调用方传入的 imageIds 提交顺序；每张前插入「第N张」标注（不依赖文件名/上传时间）
    params.images.forEach((img, idx) => {
      const n = idx + 1
      content.push({
        type: 'text',
        text: `【学生解答图片·第${n}张】（共 ${params.images.length} 张，按提交顺序）`,
      })
      const mime = String(img.mime || 'image/jpeg').trim().toLowerCase()
      const b64 = String(img.base64 || '')
      totalBytes += img.byteLength || Math.floor((b64.length * 3) / 4)
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${mime};base64,${b64}`,
        },
      })
    })

    const body = {
      model,
      messages: [{ role: 'user', content }],
      max_tokens: HS_MATH_VISION_MAX_TOKENS,
      stream: false,
    }

    const t0 = Date.now()
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
      const msg = (e as Error).message || String(e)
      const timedOut =
        (e as Error).name === 'AbortError' || /aborted|timeout/i.test(msg)
      this.logger.warn(
        `vision call fail timedOut=${timedOut} images=${params.images.length} bytes≈${totalBytes}`,
      )
      throw new ServiceUnavailableException(
        timedOut
          ? `调用 Vision 超时（${timeoutMs}ms）`
          : `调用 Vision 失败: ${msg}`,
      )
    } finally {
      clearTimeout(timer)
    }

    const raw = (await res.json()) as {
      error?: { message?: string }
      model?: string
      usage?: {
        prompt_tokens?: number
        completion_tokens?: number
        total_tokens?: number
      }
      choices?: Array<{ message?: { content?: string | null } }>
    }

    const latency = Date.now() - t0
    if (!res.ok) {
      this.logger.warn(
        `vision HTTP ${res.status} images=${params.images.length} ms=${latency}`,
      )
      throw new ServiceUnavailableException(
        `Vision API 错误 ${res.status}: ${raw.error?.message || res.statusText}`,
      )
    }

    const text = raw.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) {
      throw new ServiceUnavailableException('Vision 未返回有效 content')
    }

    const returnedModel = (raw.model || model).slice(0, 64)
    this.logger.log(
      `vision ok model=${returnedModel} images=${params.images.length} bytes≈${totalBytes} ms=${latency} usage=${raw.usage?.total_tokens ?? '-'}`,
    )

    return {
      content: text,
      model: returnedModel,
      usage: raw.usage ?? null,
    }
  }
}
