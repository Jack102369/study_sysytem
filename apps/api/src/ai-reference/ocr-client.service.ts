import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'

export type OcrMode = 'general' | 'formula' | 'smart'

export type OcrResult = {
  text: string
  confidence: number | null
  engine?: string
}

@Injectable()
export class OcrClientService {
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

  async health(): Promise<boolean> {
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
    if (mode === 'smart') {
      const form = new FormData()
      form.append('path', absolutePath)
      return this.postOcr(form, 'smart')
    }
    if (mode === 'formula') {
      return this.ocrFormulaSmartFromForms(() => {
        const f = new FormData()
        f.append('path', absolutePath)
        return f
      })
    }
    const form = new FormData()
    form.append('path', absolutePath)
    return this.postOcr(form, 'general')
  }

  async ocrByFile(
    absolutePath: string,
    mode: OcrMode = 'general',
  ): Promise<OcrResult> {
    if (!existsSync(absolutePath)) {
      throw new ServiceUnavailableException(`图片不存在: ${absolutePath}`)
    }
    const buf = await import('node:fs/promises').then((fs) => fs.readFile(absolutePath))
    return this.ocrByBuffer(buf, basename(absolutePath), mode)
  }

  async ocrByBuffer(
    buf: Buffer,
    filename: string,
    mode: OcrMode = 'general',
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

  resolveUploadAbsolutePath(relativeUrl: string): string {
    const cleaned = relativeUrl.replace(/^\//, '')
    return join(process.cwd(), cleaned)
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
