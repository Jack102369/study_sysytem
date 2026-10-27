import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'

export type OcrMode = 'general' | 'formula' | 'smart'

/** 识别引擎策略；默认 vision（Qwen） */
export type OcrEnginePolicy =
  | 'vision'
  | 'local'
  | 'vision_then_local'
  | 'local_then_vision'

export type OcrResult = {
  text: string
  confidence: number | null
  engine?: string
}

function resolveVisionChatCompletionsUrl(rawUrl: string): string | null {
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

function guessMime(filename: string): string {
  const n = (filename || '').toLowerCase()
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.webp')) return 'image/webp'
  if (n.endsWith('.gif')) return 'image/gif'
  if (n.endsWith('.bmp')) return 'image/bmp'
  return 'image/jpeg'
}

@Injectable()
export class OcrClientService {
  private readonly logger = new Logger(OcrClientService.name)

  constructor(private readonly config: ConfigService) {}

  private baseUrl() {
    return this.config.get<string>('OCR_BASE_URL', 'http://127.0.0.1:9100').replace(/\/$/, '')
  }

  /** 公式 / 智能 OCR 独立服务，默认 9101 */
  private formulaBaseUrl() {
    const dedicated = this.config.get<string>('OCR_FORMULA_BASE_URL', '').trim()
    if (dedicated) return dedicated.replace(/\/$/, '')
    return this.baseUrl()
  }

  /**
   * OCR_ENGINE：vision | local | vision_then_local | local_then_vision
   * 默认 vision（Qwen）；本机 Paddle 仍可通过 local / 回退策略使用。
   */
  enginePolicy(): OcrEnginePolicy {
    const raw = (this.config.get<string>('OCR_ENGINE', 'vision') || 'vision')
      .trim()
      .toLowerCase()
    if (
      raw === 'local' ||
      raw === 'vision' ||
      raw === 'vision_then_local' ||
      raw === 'local_then_vision'
    ) {
      return raw
    }
    return 'vision'
  }

  async health(): Promise<boolean> {
    const policy = this.enginePolicy()
    if (policy === 'vision') return this.isVisionConfigured()
    if (policy === 'local') {
      try {
        const res = await fetch(`${this.baseUrl()}/health`)
        return res.ok
      } catch {
        return false
      }
    }
    // 双引擎：任一可用即 true
    if (this.isVisionConfigured()) return true
    try {
      const res = await fetch(`${this.baseUrl()}/health`)
      return res.ok
    } catch {
      return false
    }
  }

  async ocrByAbsolutePath(
    absolutePath: string,
    mode: OcrMode = 'general',
  ): Promise<OcrResult> {
    if (!existsSync(absolutePath)) {
      throw new ServiceUnavailableException(`图片不存在: ${absolutePath}`)
    }
    // 统一走 buffer，便于 Vision / 本机同一路径
    const buf = await import('node:fs/promises').then((fs) =>
      fs.readFile(absolutePath),
    )
    return this.ocrByBuffer(buf, basename(absolutePath), mode)
  }

  async ocrByFile(
    absolutePath: string,
    mode: OcrMode = 'general',
  ): Promise<OcrResult> {
    return this.ocrByAbsolutePath(absolutePath, mode)
  }

  async ocrByBuffer(
    buf: Buffer,
    filename: string,
    mode: OcrMode = 'general',
  ): Promise<OcrResult> {
    const policy = this.enginePolicy()
    if (policy === 'vision') {
      return this.visionOcrByBuffer(buf, filename, mode)
    }
    if (policy === 'local') {
      return this.localOcrByBuffer(buf, filename, mode)
    }
    if (policy === 'vision_then_local') {
      try {
        const r = await this.visionOcrByBuffer(buf, filename, mode)
        if (r.text.trim()) return r
        this.logger.warn('vision OCR empty text → fallback local')
      } catch (e) {
        this.logger.warn(
          `vision OCR fail → fallback local: ${(e as Error).message || e}`,
        )
      }
      return this.localOcrByBuffer(buf, filename, mode)
    }
    // local_then_vision
    try {
      const r = await this.localOcrByBuffer(buf, filename, mode)
      if (r.text.trim()) return r
      this.logger.warn('local OCR empty text → fallback vision')
    } catch (e) {
      this.logger.warn(
        `local OCR fail → fallback vision: ${(e as Error).message || e}`,
      )
    }
    return this.visionOcrByBuffer(buf, filename, mode)
  }

  resolveUploadAbsolutePath(relativeUrl: string): string {
    const cleaned = relativeUrl.replace(/^\//, '')
    return join(process.cwd(), cleaned)
  }

  private isVisionConfigured(): boolean {
    const key = this.visionApiKey()
    const url = resolveVisionChatCompletionsUrl(this.visionApiUrlRaw())
    return !!key && !!url
  }

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
      this.config.get<string>('OCR_VISION_MODEL', '') ||
      this.config.get<string>('HS_MATH_VISION_MODEL', '') ||
      'qwen3.8-27b'
    ).trim() || 'qwen3.8-27b'
  }

  private visionTimeoutMs(): number {
    const n = Number(
      this.config.get<string>('OCR_VISION_TIMEOUT_MS', '') || '90000',
    )
    return Number.isFinite(n) && n >= 5000 ? n : 90_000
  }

  private visionPrompt(mode: OcrMode): string {
    if (mode === 'formula') {
      return [
        '你是 OCR 引擎。只输出图片中的数学公式，优先使用 LaTeX（可用 $...$ 包裹）。',
        '不要解释、不要前言后语；若无法识别则输出空字符串。',
      ].join('')
    }
    if (mode === 'smart') {
      return [
        '你是 OCR 引擎。完整识别图片中的中文、英文与数学公式。',
        '公式用 LaTeX（$...$）；保持原有换行与题号；不要解题、不要改写。',
        '只输出识别出的正文。',
      ].join('')
    }
    return [
      '你是 OCR 引擎。识别图片中的全部文字（含中文、英文、数字）。',
      '若有公式可用 LaTeX；保持换行；不要解释、不要解题。',
      '只输出识别出的正文。',
    ].join('')
  }

  private async visionOcrByBuffer(
    buf: Buffer,
    filename: string,
    mode: OcrMode,
  ): Promise<OcrResult> {
    const key = this.visionApiKey()
    const endpoint = resolveVisionChatCompletionsUrl(this.visionApiUrlRaw())
    if (!key || !endpoint) {
      throw new ServiceUnavailableException(
        '未配置 Qwen Vision（OCR_VISION_API_URL/KEY 或 HS_MATH_VISION_API_URL/KEY），无法识别。可设 OCR_ENGINE=local 改用本机 OCR',
      )
    }
    const mime = guessMime(filename)
    const b64 = buf.toString('base64')
    const model = this.visionModel()
    const timeoutMs = this.visionTimeoutMs()
    const body = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: this.visionPrompt(mode) },
            {
              type: 'image_url',
              image_url: { url: `data:${mime};base64,${b64}` },
            },
          ],
        },
      ],
      max_tokens: 4096,
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
          ? `Qwen 识别超时（${timeoutMs}ms）`
          : `Qwen 识别失败: ${(e as Error).message || e}`,
      )
    } finally {
      clearTimeout(timer)
    }

    const raw = (await res.json()) as {
      error?: { message?: string }
      model?: string
      choices?: Array<{ message?: { content?: string | null } }>
    }
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Qwen Vision HTTP ${res.status}: ${raw.error?.message || res.statusText}`,
      )
    }
    const text = String(raw.choices?.[0]?.message?.content || '')
      .trim()
      .replace(/^```(?:latex|text|markdown)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    const returnedModel = (raw.model || model).slice(0, 64)
    return {
      text,
      confidence: null,
      engine: `qwen-vision:${returnedModel}`,
    }
  }

  private async localOcrByBuffer(
    buf: Buffer,
    filename: string,
    mode: OcrMode,
  ): Promise<OcrResult> {
    const name = filename || 'upload.png'
    const blobPart = new Uint8Array(buf)
    if (mode === 'smart') {
      const form = new FormData()
      form.append('file', new Blob([blobPart]), name)
      return this.postOcr(form, 'smart')
    }
    if (mode === 'formula') {
      return this.ocrFormulaSmartFromForms(() => {
        const form = new FormData()
        form.append('file', new Blob([blobPart]), name)
        return form
      })
    }
    const form = new FormData()
    form.append('file', new Blob([blobPart]), name)
    return this.postOcr(form, 'general')
  }

  /**
   * 纯公式模式：含中文则回退通用 OCR，避免乱码。
   * 整题中文+分式请用 mode=smart。
   */
  private async ocrFormulaSmartFromForms(
    makeForm: () => FormData,
  ): Promise<OcrResult> {
    const [generalSettled, formulaSettled] = await Promise.allSettled([
      this.postOcr(makeForm(), 'general'),
      this.postOcr(makeForm(), 'formula'),
    ])
    const general =
      generalSettled.status === 'fulfilled' ? generalSettled.value : null
    const formula =
      formulaSettled.status === 'fulfilled' ? formulaSettled.value : null

    const picked = this.pickMixedOrFormula(general, formula)
    if (picked.text) return picked

    const err =
      (generalSettled.status === 'rejected' && generalSettled.reason) ||
      (formulaSettled.status === 'rejected' && formulaSettled.reason)
    if (err instanceof ServiceUnavailableException) throw err
    throw new ServiceUnavailableException(
      '公式识别失败：含中文整题请用「智能识别」，或裁切纯公式后再试',
    )
  }

  private pickMixedOrFormula(
    general: OcrResult | null,
    formula: OcrResult | null,
  ): OcrResult {
    const g = (general?.text || '').trim()
    const f = (formula?.text || '').trim()
    const cjkInGeneral = this.countCjk(g)
    const garbage = this.looksLikeLatexGarbage(f)

    if (cjkInGeneral >= 2 && g) {
      return {
        text: g,
        confidence: general?.confidence ?? null,
        engine: 'paddleocr-mixed',
      }
    }
    if (f && !garbage) {
      return {
        text: f,
        confidence: formula?.confidence ?? null,
        engine: 'rapid_latex_ocr',
      }
    }
    if (g) {
      return {
        text: g,
        confidence: general?.confidence ?? null,
        engine: 'paddleocr-fallback',
      }
    }
    if (f) {
      return {
        text: f,
        confidence: formula?.confidence ?? null,
        engine: 'rapid_latex_ocr',
      }
    }
    return { text: '', confidence: null }
  }

  private countCjk(text: string) {
    return (text.match(/[\u4e00-\u9fff]/g) || []).length
  }

  private looksLikeLatexGarbage(text: string) {
    if (!text) return true
    if (this.countCjk(text) > 0) return false
    const hits = (
      text.match(
        /\\bar|\\partial|\\Omega|\\kappa|\\Lambda|\\phi|\\psi|\\iota|\\otimes|\\sinh|\\begin\{array\}|\\scriptstyle/g,
      ) || []
    ).length
    return hits >= 3
  }

  private async postOcr(form: FormData, mode: OcrMode): Promise<OcrResult> {
    const base =
      mode === 'formula' || mode === 'smart' ? this.formulaBaseUrl() : this.baseUrl()
    const path =
      mode === 'smart' ? '/ocr/smart' : mode === 'formula' ? '/ocr/formula' : '/ocr'
    const url = `${base}${path}`
    const timeoutMs = mode === 'smart' ? 120_000 : mode === 'formula' ? 90_000 : 60_000
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), timeoutMs)
    let res: Response
    try {
      res = await fetch(url, { method: 'POST', body: form, signal: ac.signal })
    } catch (e) {
      const aborted =
        (e instanceof Error && e.name === 'AbortError') ||
        String(e).toLowerCase().includes('abort')
      throw new ServiceUnavailableException(
        aborted
          ? mode === 'smart'
            ? '智能识别超时。请裁切更清晰后重试，或改用普通识别'
            : mode === 'formula'
              ? '公式识别超时。请裁切公式区域后重试，或改用智能/普通识别'
              : 'OCR 识别超时，请换更小/更清晰的图片后重试'
          : mode === 'smart' || mode === 'formula'
            ? '公式/智能 OCR 服务不可用，请启动 services/ocr-formula（默认 http://127.0.0.1:9101）'
            : 'OCR 服务不可用，请启动 services/ocr（默认 http://127.0.0.1:9100）',
      )
    } finally {
      clearTimeout(timer)
    }
    const raw = await res.text()
    let json: {
      success?: boolean
      data?: { text?: string; confidence?: number | null; engine?: string }
      message?: string
      detail?: string | { msg?: string } | Array<{ msg?: string }>
    }
    try {
      json = JSON.parse(raw) as typeof json
    } catch {
      throw new ServiceUnavailableException(
        `OCR 服务异常（HTTP ${res.status}）：${raw.slice(0, 200) || '非 JSON 响应'}`,
      )
    }
    if (!res.ok) {
      const detail = json.detail
      const detailMsg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d?.msg || String(d)).join('; ')
            : detail && typeof detail === 'object' && 'msg' in detail
              ? String(detail.msg)
              : ''
      throw new ServiceUnavailableException(
        detailMsg || json.message || `OCR 失败 HTTP ${res.status}`,
      )
    }
    const text = (json.data?.text || '').trim()
    return {
      text,
      confidence:
        typeof json.data?.confidence === 'number' ? json.data.confidence : null,
      engine: json.data?.engine,
    }
  }
}
