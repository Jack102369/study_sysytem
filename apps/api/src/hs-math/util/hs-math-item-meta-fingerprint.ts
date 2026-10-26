/**
 * CORE-1A：来源 + 方法 指纹兼容层。
 *
 * 规则：默认来源且无方法关联 → 指纹与迁移前 V1 一致（不误伤旧审核）。
 * 一旦来源非默认或存在方法关联 → 指纹纳入 V2 元数据块，真实变更必 STALE。
 */
import {
  isDefaultSourceMeta,
  normalizeSourceFields,
  sourceFieldsForFingerprint,
  type HsMathSourceFields,
  type HsMathSourceInput,
} from './hs-math-source.validate'

export type MethodLinkForFingerprint = {
  code: string
  isPrimary: boolean
}

export function normalizeMethodLinksForFingerprint(
  links: MethodLinkForFingerprint[],
): { methodCodes: string[]; primaryMethodCode: string } {
  const codes = [
    ...new Set(
      links
        .map((l) => String(l.code || '').trim())
        .filter(Boolean),
    ),
  ].sort()
  const primary =
    links.find((l) => l.isPrimary && String(l.code || '').trim())?.code || ''
  const primaryMethodCode = String(primary || '').trim()
  return { methodCodes: codes, primaryMethodCode }
}

export function isDefaultMethodMeta(methodCodes: string[]): boolean {
  return methodCodes.length === 0
}

/**
 * 是否应将元数据并入指纹（非默认业务元数据）。
 */
export function shouldAttachMetaToFingerprint(
  source: HsMathSourceFields,
  methodCodes: string[],
): boolean {
  return !isDefaultSourceMeta(source) || !isDefaultMethodMeta(methodCodes)
}

/** 合并到 canonicalize 结果上的可选 V2 块 */
export function buildFingerprintMetaBlock(opts: {
  source?: HsMathSourceInput | null
  methodLinks?: MethodLinkForFingerprint[]
}): Record<string, unknown> | null {
  const source = normalizeSourceFields(opts.source)
  const { methodCodes, primaryMethodCode } =
    normalizeMethodLinksForFingerprint(opts.methodLinks || [])
  if (!shouldAttachMetaToFingerprint(source, methodCodes)) {
    return null
  }
  return {
    metaSchema: 'v2',
    source: sourceFieldsForFingerprint(source),
    methodCodes,
    primaryMethodCode,
  }
}
