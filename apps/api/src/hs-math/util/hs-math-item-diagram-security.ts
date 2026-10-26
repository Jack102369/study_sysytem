/**
 * DIAGRAM-1B：题干插图 MIME/魔数/SVG 清洗（无第三方库）。
 * SVG：fail-closed；禁止 script/事件/foreignObject/外链；输出仅供 <img> blob，禁止 v-html。
 * 栅格化：本阶段无 sharp；SVG 清洗后存 image/svg+xml（sanitize_status=passed）。
 * 优先建议作者上传 PNG/WebP；后续可授权引入栅格化依赖。
 */
import { createHash } from 'crypto'
import {
  HS_MATH_ITEM_DIAGRAM_MAX_BYTES,
  HS_MATH_ITEM_DIAGRAM_MAX_PX,
  HS_MATH_ITEM_DIAGRAM_MIMES,
  type HsMathItemDiagramMime,
} from '../hs-math.constants'

export type DiagramValidateOk = {
  ok: true
  mime: HsMathItemDiagramMime
  buffer: Buffer
  sizeBytes: number
  widthPx: number | null
  heightPx: number | null
  sanitizeStatus: 'passed' | 'rasterized_png'
  contentSha256: string
  sourceMimeType: string | null
}

export type DiagramValidateErr = {
  ok: false
  code: string
  message: string
}

export type DiagramValidateResult = DiagramValidateOk | DiagramValidateErr

function isPng(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
}

function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
}

function looksLikeSvg(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(buf.length, 512)).toString('utf8')
  const t = head.replace(/^\uFEFF/, '').trimStart()
  return (
    t.startsWith('<?xml') ||
    t.startsWith('<svg') ||
    /<svg[\s>]/i.test(t)
  )
}

function readPngSize(buf: Buffer): { w: number; h: number } | null {
  if (!isPng(buf) || buf.length < 24) return null
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  if (!w || !h) return null
  return { w, h }
}

/** 简化：仅解析部分 VP8X/VP8 尺寸；失败则尺寸留空仍允许（上限靠字节） */
function readWebpSize(buf: Buffer): { w: number; h: number } | null {
  if (!isWebp(buf) || buf.length < 30) return null
  const fourcc = buf.toString('ascii', 12, 16)
  if (fourcc === 'VP8X' && buf.length >= 30) {
    const w = 1 + buf[24] + (buf[25] << 8) + (buf[26] << 16)
    const h = 1 + buf[27] + (buf[28] << 8) + (buf[29] << 16)
    return { w, h }
  }
  if (fourcc === 'VP8 ' && buf.length >= 30) {
    const w = buf[26] | (buf[27] << 8)
    const h = buf[28] | (buf[29] << 8)
    return { w: w & 0x3fff, h: h & 0x3fff }
  }
  return null
}

const ALLOWED_SVG_TAGS = new Set(
  [
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyline',
    'polygon',
    'text',
    'tspan',
    'defs',
    'clippath',
    'mask',
    'use',
    'title',
    'desc',
    'marker',
    'lineargradient',
    'radialgradient',
    'stop',
  ].map((x) => x.toLowerCase()),
)

const FORBIDDEN_ATTR_RE =
  /^(on|xmlns:xlink$)/i

function isDangerousUrl(v: string): boolean {
  const s = v.trim().toLowerCase()
  if (!s) return false
  if (s.startsWith('javascript:')) return true
  if (s.startsWith('data:')) return true
  if (s.startsWith('http:') || s.startsWith('https:') || s.startsWith('//')) {
    return true
  }
  return false
}

/**
 * Fail-closed SVG 清洗：去掉危险标签/属性/外链；仅保留绘图白名单。
 */
export function sanitizeSvgXml(raw: string): { ok: true; xml: string } | DiagramValidateErr {
  if (!raw || !raw.trim()) {
    return { ok: false, code: 'EMPTY_SVG', message: 'SVG 为空' }
  }
  if (raw.includes('\0')) {
    return { ok: false, code: 'NULL_BYTE', message: 'SVG 含非法空字节' }
  }
  const lower = raw.toLowerCase()
  if (
    lower.includes('<script') ||
    lower.includes('foreignobject') ||
    lower.includes('<iframe') ||
    lower.includes('<object') ||
    lower.includes('<embed') ||
    lower.includes('<image') || // 外链/嵌入图风险；题干示意图用 path/形状
    lower.includes('<!entity') ||
    lower.includes('<!doctype')
  ) {
    return {
      ok: false,
      code: 'SVG_FORBIDDEN_TAG',
      message: 'SVG 含禁止标签（script/foreignObject/外链图等）',
    }
  }
  if (/xlink:href\s*=\s*["']?\s*https?:/i.test(raw) || /href\s*=\s*["']?\s*https?:/i.test(raw)) {
    return {
      ok: false,
      code: 'SVG_EXTERNAL',
      message: 'SVG 禁止外部资源引用',
    }
  }

  // 去掉注释与处理指令中的可疑内容
  let xml = raw.replace(/<!--[\s\S]*?-->/g, '')
  xml = xml.replace(/<\?[\s\S]*?\?>/g, '')

  // 标签扫描
  const tagRe = /<\/?([A-Za-z][\w:-]*)\b([^<>]*)\/?>/g
  let m: RegExpExecArray | null
  const rebuilt: string[] = []
  let last = 0
  let openSvg = 0
  while ((m = tagRe.exec(xml))) {
    rebuilt.push(xml.slice(last, m.index))
    const full = m[0]
    const name = m[1].toLowerCase().replace(/^svg:/, '')
    const isClose = full.startsWith('</')
    const selfClose = /\/>\s*$/.test(full)
    if (!ALLOWED_SVG_TAGS.has(name)) {
      return {
        ok: false,
        code: 'SVG_TAG_NOT_ALLOWED',
        message: `SVG 标签不允许：${name}`,
      }
    }
    if (name === 'svg' && !isClose) openSvg++
    if (name === 'svg' && isClose) openSvg--

    if (isClose) {
      rebuilt.push(`</${name}>`)
    } else {
      const attrsRaw = m[2] || ''
      const attrRe =
        /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g
      let am: RegExpExecArray | null
      const safeAttrs: string[] = []
      while ((am = attrRe.exec(attrsRaw))) {
        const an = am[1]
        const av = am[2] ?? am[3] ?? am[4] ?? ''
        const anl = an.toLowerCase()
        if (FORBIDDEN_ATTR_RE.test(anl) || anl.startsWith('on')) {
          return {
            ok: false,
            code: 'SVG_EVENT_ATTR',
            message: `禁止事件/危险属性：${an}`,
          }
        }
        if (
          anl === 'href' ||
          anl === 'xlink:href' ||
          anl.endsWith(':href') ||
          anl === 'src'
        ) {
          if (isDangerousUrl(av) || (av && !av.startsWith('#'))) {
            return {
              ok: false,
              code: 'SVG_HREF',
              message: 'SVG href 仅允许同文档片段 #id',
            }
          }
        }
        if (anl === 'style' && /expression|url\s*\(\s*['"]?\s*https?:/i.test(av)) {
          return {
            ok: false,
            code: 'SVG_STYLE',
            message: 'SVG style 含危险内容',
          }
        }
        safeAttrs.push(`${an}="${av.replace(/"/g, '&quot;')}"`)
      }
      const body = safeAttrs.length ? ' ' + safeAttrs.join(' ') : ''
      rebuilt.push(selfClose ? `<${name}${body} />` : `<${name}${body}>`)
    }
    last = m.index + full.length
  }
  rebuilt.push(xml.slice(last))
  const out = rebuilt.join('').trim()
  if (!/^<svg[\s>]/i.test(out) || !/<\/svg>\s*$/i.test(out)) {
    return { ok: false, code: 'SVG_ROOT', message: 'SVG 必须以 <svg> 为根' }
  }
  if (openSvg !== 0) {
    return { ok: false, code: 'SVG_UNBALANCED', message: 'SVG 标签不平衡' }
  }
  return { ok: true, xml: out }
}

export function validateItemDiagramBuffer(
  buf: Buffer,
  declaredMime?: string | null,
): DiagramValidateResult {
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return { ok: false, code: 'EMPTY', message: '图片不能为空' }
  }
  if (buf.length > HS_MATH_ITEM_DIAGRAM_MAX_BYTES) {
    return {
      ok: false,
      code: 'TOO_LARGE',
      message: `单张插图不能超过 ${HS_MATH_ITEM_DIAGRAM_MAX_BYTES} 字节`,
    }
  }

  const declared = String(declaredMime || '')
    .trim()
    .toLowerCase()

  if (isPng(buf)) {
    if (declared && declared !== 'image/png') {
      return { ok: false, code: 'MIME_MISMATCH', message: '声明 MIME 与内容不符' }
    }
    const sz = readPngSize(buf)
    if (sz && (sz.w > HS_MATH_ITEM_DIAGRAM_MAX_PX || sz.h > HS_MATH_ITEM_DIAGRAM_MAX_PX)) {
      return { ok: false, code: 'DIM_TOO_LARGE', message: '图片尺寸过大' }
    }
    const contentSha256 = createHash('sha256').update(buf).digest('hex')
    return {
      ok: true,
      mime: 'image/png',
      buffer: buf,
      sizeBytes: buf.length,
      widthPx: sz?.w ?? null,
      heightPx: sz?.h ?? null,
      sanitizeStatus: 'passed',
      contentSha256,
      sourceMimeType: null,
    }
  }

  if (isWebp(buf)) {
    if (declared && declared !== 'image/webp') {
      return { ok: false, code: 'MIME_MISMATCH', message: '声明 MIME 与内容不符' }
    }
    const sz = readWebpSize(buf)
    if (sz && (sz.w > HS_MATH_ITEM_DIAGRAM_MAX_PX || sz.h > HS_MATH_ITEM_DIAGRAM_MAX_PX)) {
      return { ok: false, code: 'DIM_TOO_LARGE', message: '图片尺寸过大' }
    }
    const contentSha256 = createHash('sha256').update(buf).digest('hex')
    return {
      ok: true,
      mime: 'image/webp',
      buffer: buf,
      sizeBytes: buf.length,
      widthPx: sz?.w ?? null,
      heightPx: sz?.h ?? null,
      sanitizeStatus: 'passed',
      contentSha256,
      sourceMimeType: null,
    }
  }

  if (looksLikeSvg(buf) || declared === 'image/svg+xml') {
    let text: string
    try {
      text = buf.toString('utf8')
    } catch {
      return { ok: false, code: 'SVG_ENCODING', message: 'SVG 编码非法' }
    }
    const cleaned = sanitizeSvgXml(text)
    if (!cleaned.ok) return cleaned
    const outBuf = Buffer.from(cleaned.xml, 'utf8')
    if (outBuf.length > HS_MATH_ITEM_DIAGRAM_MAX_BYTES) {
      return { ok: false, code: 'TOO_LARGE', message: '清洗后 SVG 过大' }
    }
    const contentSha256 = createHash('sha256').update(outBuf).digest('hex')
    return {
      ok: true,
      mime: 'image/svg+xml',
      buffer: outBuf,
      sizeBytes: outBuf.length,
      widthPx: null,
      heightPx: null,
      sanitizeStatus: 'passed',
      contentSha256,
      sourceMimeType: 'image/svg+xml',
    }
  }

  return {
    ok: false,
    code: 'BAD_MAGIC',
    message: `不支持的格式（仅 ${HS_MATH_ITEM_DIAGRAM_MIMES.join('/')}）`,
  }
}

/** 有序 sha 列表；空则不入指纹（兼容旧题） */
export function normalizeDiagramSha256ListForFingerprint(
  orderedSha256: string[],
): string[] {
  return orderedSha256
    .map((x) => String(x || '').trim().toLowerCase())
    .filter((x) => /^[0-9a-f]{64}$/.test(x))
}
