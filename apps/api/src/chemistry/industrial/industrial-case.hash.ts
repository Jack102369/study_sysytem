import { createHash } from 'crypto'
import type { IndustrialCase } from './industrial-case.types'

/** 参与语义哈希的字段（排除审核态与时间戳、contentHash 自身） */
export function semanticPayloadForHash(
  c: Omit<IndustrialCase, 'contentHash' | 'reviewedContentHash' | 'createdAt' | 'updatedAt' | 'reviewStatus'> &
    Partial<Pick<IndustrialCase, 'reviewStatus' | 'contentHash' | 'reviewedContentHash' | 'createdAt' | 'updatedAt'>>,
): unknown {
  return {
    caseCode: c.caseCode,
    title: c.title,
    description: c.description,
    caseType: c.caseType,
    gradeScope: c.gradeScope,
    curriculumScope: c.curriculumScope,
    specialtyCode: c.specialtyCode,
    categoryCodes: [...(c.categoryCodes || [])].sort(),
    sourceReferences: c.sourceReferences,
    materials: c.materials,
    processSteps: c.processSteps,
    reactions: c.reactions,
    knowledgeLinks: c.knowledgeLinks,
    learningObjectives: c.learningObjectives,
    difficultyRange: c.difficultyRange,
    safetyNotes: c.safetyNotes,
    version: c.version,
    openIssues: c.openIssues || [],
  }
}

/** 键排序稳定序列化（供案例/流程图哈希复用） */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((x) => stableStringify(x)).join(',')}]`
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

export function sha256Stable(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload), 'utf8').digest('hex')
}

export function computeIndustrialCaseContentHash(
  caseWithoutHash: Omit<IndustrialCase, 'contentHash'> | IndustrialCase,
): string {
  const payload = semanticPayloadForHash(caseWithoutHash as IndustrialCase)
  return sha256Stable(payload)
}

/** 审核是否仍对应当前语义内容 */
export function isReviewFresh(c: IndustrialCase): boolean {
  if (!c.reviewedContentHash) return false
  return c.reviewedContentHash === c.contentHash
}
