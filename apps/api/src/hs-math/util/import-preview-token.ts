import * as crypto from 'crypto'
import { buildFingerprintMetaBlock } from './hs-math-item-meta-fingerprint'

export type ImportPreviewClaims = {
  v: 1
  uid: string
  exp: number
  hash: string
  n: string
}

/** 令牌载荷上限（claims 很小；防恶意超大 token） */
export const HS_MATH_IMPORT_TOKEN_MAX_CHARS = 4096

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8')
  return b
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64')
}

/** 递归按键排序后序列化，降低键序导致的哈希抖动 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(',')}}`
}

/**
 * 将导入条目规范为可比较结构（用于 token 内容绑定与幂等比对）。
 * 忽略 status / contentVersion 等禁止字段。
 * CORE-1A：默认来源+无方法时不附 meta（与迁移前指纹兼容）；非默认则附 metaSchema=v2。
 */
export function canonicalizeImportItem(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const kpCodes = Array.isArray(o.knowledgePointCodes)
    ? o.knowledgePointCodes.map((x) => String(x || '').trim()).filter(Boolean)
    : []
  const sortedKp = [...kpCodes].sort()
  const base: Record<string, unknown> = {
    code: typeof o.code === 'string' ? o.code.trim() : '',
    specialtyCode:
      typeof o.specialtyCode === 'string' ? o.specialtyCode.trim() : '',
    categoryCode:
      typeof o.categoryCode === 'string' ? o.categoryCode.trim() : '',
    qtype: o.qtype,
    difficulty: o.difficulty,
    stem: typeof o.stem === 'string' ? o.stem.trim() : '',
    options: o.options ?? null,
    answerPayload: o.answerPayload ?? null,
    analysis: typeof o.analysis === 'string' ? o.analysis.trim() : '',
    knowledgePointCodes: sortedKp,
    primaryKnowledgePointCode:
      typeof o.primaryKnowledgePointCode === 'string'
        ? o.primaryKnowledgePointCode.trim()
        : '',
    pool: 'formal',
  }

  const methodCodes = Array.isArray(o.methodCodes)
    ? o.methodCodes.map((x) => String(x || '').trim()).filter(Boolean)
    : []
  const primaryMethodCode =
    typeof o.primaryMethodCode === 'string'
      ? o.primaryMethodCode.trim()
      : ''
  const methodLinks = methodCodes.map((code) => ({
    code,
    isPrimary: code === primaryMethodCode,
  }))

  const meta = buildFingerprintMetaBlock({
    source: {
      sourceType: o.sourceType as string | undefined,
      sourceYear: o.sourceYear as number | null | undefined,
      sourceExamName: o.sourceExamName as string | undefined,
      sourceQuestionNo: o.sourceQuestionNo as string | undefined,
      sourceReference: o.sourceReference as string | undefined,
      sourceAdaptationNote: o.sourceAdaptationNote as string | undefined,
      sourceVerificationStatus: o.sourceVerificationStatus as string | undefined,
      sourceLicenseStatus: o.sourceLicenseStatus as string | undefined,
    },
    methodLinks,
  })
  if (meta) {
    Object.assign(base, meta)
  }
  // DIAGRAM-1B：仅当存在插图时纳入有序 sha 列表；缺省/空数组不入指纹（旧题兼容）
  const diagramRaw = Array.isArray(o.diagramSha256List)
    ? o.diagramSha256List.map((x) => String(x || '').trim().toLowerCase())
    : []
  const diagramSha256List = diagramRaw.filter((x) => /^[0-9a-f]{64}$/.test(x))
  if (diagramSha256List.length) {
    base.diagramSha256List = diagramSha256List
  }
  return base
}

/** 规范化导入条目后计算内容哈希（防篡改；键序无关） */
export function hashImportItems(items: unknown[]): string {
  const canonical = items.map((it) => canonicalizeImportItem(it))
  return crypto
    .createHash('sha256')
    .update(stableStringify(canonical), 'utf8')
    .digest('hex')
}

export function fingerprintCanonicalItem(
  item: Record<string, unknown>,
): string {
  return crypto
    .createHash('sha256')
    .update(stableStringify(item), 'utf8')
    .digest('hex')
}

export function signImportPreviewToken(
  secret: string,
  claims: ImportPreviewClaims,
): string {
  if (!secret || secret.length < 8) {
    throw new Error('导入预览签名密钥不可用')
  }
  const payload = b64url(JSON.stringify(claims))
  const sig = crypto
    .createHmac('sha256', `${secret}:hs-math-import-v1`)
    .update(payload)
    .digest()
  return `${payload}.${b64url(sig)}`
}

export function verifyImportPreviewToken(
  secret: string,
  token: string,
  opts: { userId: string; contentHash: string; now?: number },
): ImportPreviewClaims {
  if (!secret || secret.length < 8) {
    throw new Error('导入预览签名密钥不可用')
  }
  if (typeof token !== 'string' || token.length > HS_MATH_IMPORT_TOKEN_MAX_CHARS) {
    throw new Error('预览令牌过长或非法')
  }
  const parts = token.split('.')
  if (parts.length !== 2) throw new Error('预览令牌格式非法')
  const [payload, sig] = parts
  if (!payload || !sig) throw new Error('预览令牌格式非法')
  const expect = crypto
    .createHmac('sha256', `${secret}:hs-math-import-v1`)
    .update(payload)
    .digest()
  let actual: Buffer
  try {
    actual = fromB64url(sig)
  } catch {
    throw new Error('预览令牌签名无效')
  }
  if (
    expect.length !== actual.length ||
    !crypto.timingSafeEqual(expect, actual)
  ) {
    throw new Error('预览令牌签名无效')
  }
  let claims: ImportPreviewClaims
  try {
    claims = JSON.parse(fromB64url(payload).toString('utf8'))
  } catch {
    throw new Error('预览令牌载荷非法')
  }
  if (
    claims.v !== 1 ||
    !claims.uid ||
    !claims.hash ||
    !claims.exp ||
    !claims.n ||
    typeof claims.hash !== 'string' ||
    typeof claims.n !== 'string'
  ) {
    throw new Error('预览令牌字段不完整')
  }
  if (String(claims.uid) !== String(opts.userId)) {
    throw new Error('预览令牌与当前管理员不匹配')
  }
  const now = opts.now ?? Date.now()
  if (now > Number(claims.exp)) throw new Error('预览令牌已过期，请重新预览')
  if (claims.hash !== opts.contentHash) {
    throw new Error('预览数据与确认数据不一致，请重新预览')
  }
  return claims
}
