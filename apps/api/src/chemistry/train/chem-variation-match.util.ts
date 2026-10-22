import type { AdvModelEntry } from './chem-model-catalog.loader'
import { modelsAreRelated } from './chem-model-catalog.loader'

export type LinkKey = string // `${entityType}:${entityId}` — 类型必须一致，不做 knowledge↔knowledge_point 归一

export type VariationTier =
  | 'kp_same_model'
  | 'kp_related_model'
  | 'kp_diff_context'
  | 'category_with_evidence'
  | 'none'

export type AnalysisSections = {
  knowledgePoints: string | null
  breakthrough: string | null
  keyConditions: string | null
  coreMethod: string | null
  commonMistakes: string | null
  similarRecognition: string | null
}

const SECTION_PATTERNS: Array<{ key: keyof AnalysisSections; re: RegExp }> = [
  { key: 'knowledgePoints', re: /【考查知识点】\s*([\s\S]*?)(?=【|$)/ },
  { key: 'breakthrough', re: /【突破口】\s*([\s\S]*?)(?=【|$)/ },
  { key: 'keyConditions', re: /【关键条件】\s*([\s\S]*?)(?=【|$)/ },
  { key: 'coreMethod', re: /【核心方法】\s*([\s\S]*?)(?=【|$)/ },
  { key: 'commonMistakes', re: /【易错点】\s*([\s\S]*?)(?=【|$)/ },
  { key: 'similarRecognition', re: /【同类题识别】\s*([\s\S]*?)(?=【|$)/ },
]

export function parseModelIdFromGateNote(gateNote: string | null | undefined): string | null {
  const m = String(gateNote || '').match(/model=(ADV\.[A-Za-z0-9_.]+)/i)
  return m ? m[1] : null
}

export function linkKey(entityType: string, entityId: string | number): LinkKey {
  return `${entityType}:${entityId}`
}

export function sharedExactLinks(
  a: Array<{ entityType: string; entityId: string }>,
  b: Array<{ entityType: string; entityId: string }>,
): LinkKey[] {
  const set = new Set(a.map((x) => linkKey(x.entityType, x.entityId)))
  return b
    .map((x) => linkKey(x.entityType, x.entityId))
    .filter((k) => set.has(k))
}

export function parseAnalysisSections(analysis: string | null | undefined): AnalysisSections {
  const text = String(analysis || '')
  const out: AnalysisSections = {
    knowledgePoints: null,
    breakthrough: null,
    keyConditions: null,
    coreMethod: null,
    commonMistakes: null,
    similarRecognition: null,
  }
  if (!text.trim()) return out
  for (const { key, re } of SECTION_PATTERNS) {
    const m = text.match(re)
    if (m) {
      const v = m[1].trim()
      if (v) out[key] = v
    }
  }
  return out
}

/** 去数字/空白后的题干骨架，用于轻量机械重复识别（非 AI） */
export function stemSkeleton(stem: string): string {
  return String(stem || '')
    .toLowerCase()
    .replace(/[0-9０-９]+/g, '#')
    .replace(/\s+/g, '')
    .replace(/[，。、；：！？,.!?;:'"“”‘’（）()\[\]【】]/g, '')
}

export function skeletonsNearDuplicate(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  // 长度接近且较长串包含较短串（典型「只改数字」）
  const [x, y] = a.length >= b.length ? [a, b] : [b, a]
  if (y.length >= 12 && x.includes(y) && x.length - y.length <= Math.max(6, y.length * 0.15)) {
    return true
  }
  return false
}

export type RankResult = {
  tier: VariationTier
  tierRank: number
  mechanicalDup: boolean
  sharedLinks: LinkKey[]
  reason: string
}

/**
 * 变式档位（严格）：
 * 1 kp_same_model
 * 2 kp_related_model（目录内 KP/能力重叠，非仅 ADV 前缀）
 * 3 kp_diff_context（有明确共享知识链接，情境不同）
 * 4 category_with_evidence（同分类 + 至少一条共享知识链接或其他技能证据）
 * 仅同专项 / 仅同分类 / 仅同 ADV 前缀 → none
 */
export function rankVariationCandidate(opts: {
  sourceLinks: Array<{ entityType: string; entityId: string }>
  candLinks: Array<{ entityType: string; entityId: string }>
  sameCategory: boolean
  sameSpecialty: boolean
  sourceModelId: string | null
  candModelId: string | null
  sourceModel?: AdvModelEntry
  candModel?: AdvModelEntry
  sourceSkeleton: string
  candSkeleton: string
}): RankResult {
  const shared = sharedExactLinks(opts.sourceLinks, opts.candLinks)
  const mechanicalDup = skeletonsNearDuplicate(opts.sourceSkeleton, opts.candSkeleton)
  const hasKp = shared.length > 0

  if (hasKp && opts.sourceModelId && opts.candModelId && opts.sourceModelId === opts.candModelId) {
    return {
      tier: 'kp_same_model',
      tierRank: 1,
      mechanicalDup,
      sharedLinks: shared,
      reason: '相同知识点链接 + 相同题型模型',
    }
  }

  if (
    hasKp &&
    opts.sourceModelId &&
    opts.candModelId &&
    opts.sourceModelId !== opts.candModelId &&
    modelsAreRelated(opts.sourceModel, opts.candModel)
  ) {
    return {
      tier: 'kp_related_model',
      tierRank: 2,
      mechanicalDup,
      sharedLinks: shared,
      reason: '相同知识点链接 + 相关题型模型（目录 KP/能力重叠）',
    }
  }

  if (hasKp) {
    return {
      tier: 'kp_diff_context',
      tierRank: 3,
      mechanicalDup,
      sharedLinks: shared,
      reason: '相同明确知识点链接 + 不同情境/方法',
    }
  }

  // 第4档：同分类不够，必须另有可靠证据（此处要求至少一条共享知识链接——已在上面覆盖）
  // 额外技能证据：同分类 + 双方均有模型且目录判定相关（仍无共享 entity 链接时）
  if (
    opts.sameCategory &&
    opts.sourceModelId &&
    opts.candModelId &&
    modelsAreRelated(opts.sourceModel, opts.candModel)
  ) {
    return {
      tier: 'category_with_evidence',
      tierRank: 4,
      mechanicalDup,
      sharedLinks: shared,
      reason: '相同二级分类 + 题型模型目录技能/知识点重叠（非仅专项前缀）',
    }
  }

  return {
    tier: 'none',
    tierRank: 99,
    mechanicalDup,
    sharedLinks: shared,
    reason: opts.sameSpecialty
      ? '仅同专项/分类不足，拒绝推荐'
      : '关联证据不足',
  }
}

export function tierLabel(t: VariationTier): string {
  const map: Record<VariationTier, string> = {
    kp_same_model: '同知识+同模型',
    kp_related_model: '同知识+相关模型',
    kp_diff_context: '同知识+不同情境',
    category_with_evidence: '同分类+技能证据',
    none: '无合适关联',
  }
  return map[t]
}
