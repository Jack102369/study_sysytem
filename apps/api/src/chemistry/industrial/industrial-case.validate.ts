import {
  CASE_CODE_PATTERN,
  INDUSTRIAL_CASE_TYPES,
  INDUSTRIAL_CATEGORY_CODES,
  INDUSTRIAL_CURRICULUM_REVIEW_STATUSES,
  INDUSTRIAL_GRADE_SCOPES,
  INDUSTRIAL_MATERIAL_TYPES,
  INDUSTRIAL_OPERATION_TYPES,
  INDUSTRIAL_PHYSICAL_STATES,
  INDUSTRIAL_REVIEW_STATUSES,
  INDUSTRIAL_SOURCE_TYPES,
  INDUSTRIAL_SPECIALTY_CODE,
  INDUSTRIAL_VERIFICATION_STATUSES,
  VERSION_PATTERN,
} from './industrial-case.constants'
import { computeIndustrialCaseContentHash, isReviewFresh } from './industrial-case.hash'
import type {
  IndustrialCase,
  IndustrialCaseValidationResult,
} from './industrial-case.types'

function inSet<T extends string>(v: unknown, allowed: readonly T[]): v is T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v)
}

/**
 * 运行时结构/引用/依据门槛校验。
 * 通过 ≠ 化学正确；publishEligible 仅表示「结构与依据门槛允许进入发布流程」，仍须人工审核。
 */
export function validateIndustrialCase(raw: unknown): IndustrialCaseValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['case must be object'], warnings, publishEligible: false }
  }
  const c = raw as Record<string, unknown>

  const caseCode = String(c.caseCode ?? '')
  if (!caseCode) errors.push('caseCode empty')
  else if (!CASE_CODE_PATTERN.test(caseCode)) errors.push('caseCode format invalid')

  if (!String(c.title ?? '').trim()) errors.push('title empty')

  if (!inSet(c.caseType, INDUSTRIAL_CASE_TYPES)) errors.push('caseType invalid')
  if (!inSet(c.gradeScope, INDUSTRIAL_GRADE_SCOPES)) errors.push('gradeScope invalid')
  if (c.specialtyCode !== INDUSTRIAL_SPECIALTY_CODE) {
    errors.push(`specialtyCode must be ${INDUSTRIAL_SPECIALTY_CODE}`)
  }

  const categoryCodes = Array.isArray(c.categoryCodes) ? c.categoryCodes.map(String) : null
  if (!categoryCodes || !categoryCodes.length) {
    errors.push('categoryCodes empty')
  } else {
    for (const code of categoryCodes) {
      if (!(INDUSTRIAL_CATEGORY_CODES as readonly string[]).includes(code)) {
        errors.push(`categoryCode not allowed: ${code}`)
      }
    }
  }

  if (!inSet(c.reviewStatus, INDUSTRIAL_REVIEW_STATUSES)) {
    errors.push('reviewStatus invalid')
  }

  const version = String(c.version ?? '')
  if (!VERSION_PATTERN.test(version)) errors.push('version format invalid')

  const difficultyRange = c.difficultyRange as { min?: number; max?: number } | undefined
  if (
    !difficultyRange ||
    typeof difficultyRange.min !== 'number' ||
    typeof difficultyRange.max !== 'number' ||
    difficultyRange.min < 1 ||
    difficultyRange.max > 3 ||
    difficultyRange.min > difficultyRange.max
  ) {
    errors.push('difficultyRange invalid')
  }

  const curriculum = c.curriculumScope as Record<string, unknown> | undefined
  if (!curriculum || typeof curriculum !== 'object') {
    errors.push('curriculumScope missing')
  } else if (
    !inSet(curriculum.curriculumReviewStatus, INDUSTRIAL_CURRICULUM_REVIEW_STATUSES)
  ) {
    errors.push('curriculumReviewStatus invalid')
  }

  const materials = Array.isArray(c.materials) ? c.materials : null
  if (!materials || !materials.length) errors.push('materials empty')
  const materialIds = new Set<string>()
  if (materials) {
    for (const m of materials as Record<string, unknown>[]) {
      const id = String(m.materialId ?? '')
      if (!id) {
        errors.push('materialId empty')
        continue
      }
      if (materialIds.has(id)) errors.push(`duplicate materialId: ${id}`)
      materialIds.add(id)
      if (!inSet(m.materialType, INDUSTRIAL_MATERIAL_TYPES)) {
        errors.push(`materialType invalid: ${id}`)
      }
      if (!inSet(m.physicalState, INDUSTRIAL_PHYSICAL_STATES)) {
        errors.push(`physicalState invalid: ${id}`)
      }
      if (m.purity != null) {
        const p = m.purity as { value?: number; unit?: string }
        if (typeof p.value !== 'number' || !String(p.unit || '').trim()) {
          errors.push(`purity invalid: ${id}`)
        }
      }
    }
  }

  const steps = Array.isArray(c.processSteps) ? c.processSteps : null
  if (!steps || !steps.length) errors.push('processSteps empty')
  const stepIds = new Set<string>()
  if (steps) {
    for (const s of steps as Record<string, unknown>[]) {
      const sid = String(s.stepId ?? '')
      if (!sid) {
        errors.push('stepId empty')
        continue
      }
      if (stepIds.has(sid)) errors.push(`duplicate stepId: ${sid}`)
      stepIds.add(sid)
      if (!inSet(s.operationType, INDUSTRIAL_OPERATION_TYPES)) {
        errors.push(`operationType invalid: ${sid}`)
      }
      for (const key of ['inputs', 'outputs', 'reagents'] as const) {
        const arr = s[key]
        if (arr == null) continue
        if (!Array.isArray(arr)) {
          errors.push(`${key} must be array: ${sid}`)
          continue
        }
        for (const mid of arr.map(String)) {
          if (!materialIds.has(mid)) {
            errors.push(`step ${sid} references missing material: ${mid}`)
          }
        }
      }
    }
  }

  const sources = Array.isArray(c.sourceReferences) ? c.sourceReferences : null
  if (!sources) errors.push('sourceReferences missing')
  let hasVerifiedSource = false
  if (sources) {
    for (const src of sources as Record<string, unknown>[]) {
      if (!inSet(src.sourceType, INDUSTRIAL_SOURCE_TYPES)) {
        errors.push('sourceType invalid')
      }
      if (!String(src.sourceTitle ?? '').trim()) errors.push('sourceTitle empty')
      if (!inSet(src.verificationStatus, INDUSTRIAL_VERIFICATION_STATUSES)) {
        errors.push('source verificationStatus invalid')
      }
      if (src.verificationStatus === 'verified') hasVerifiedSource = true
      if (
        src.verificationStatus === 'verified' &&
        !String(src.sourceIdentifier || '').trim() &&
        !String(src.kbEntityId || '').trim()
      ) {
        warnings.push('verified source without identifier/kb id')
      }
    }
  }

  const reactions = Array.isArray(c.reactions) ? c.reactions : []
  for (const r of reactions as Record<string, unknown>[]) {
    const ref = String(r.reactionReference ?? '')
    if (!ref || !/^[a-zA-Z0-9_.:-]{2,128}$/.test(ref)) {
      errors.push(`reactionReference invalid: ${ref}`)
    }
    if (r.pendingVerification !== true && r.pendingVerification !== false) {
      errors.push(`pendingVerification required: ${ref}`)
    }
    if (r.pendingVerification === false && !r.kbReactionId) {
      warnings.push(
        `reaction ${ref} marked not pending but no kbReactionId — still not chemical proof`,
      )
    }
  }

  const contentHash = String(c.contentHash ?? '')
  if (!/^[a-f0-9]{64}$/.test(contentHash)) {
    errors.push('contentHash must be sha256 hex')
  } else {
    const expected = computeIndustrialCaseContentHash(c as unknown as IndustrialCase)
    if (contentHash !== expected) {
      errors.push('contentHash mismatch with semantic payload')
    }
  }

  // 发布门槛：结构 OK 之外，须有至少一条 verified 来源，且审核态允许，且审核哈希新鲜
  const reviewStatus = String(c.reviewStatus ?? '')
  let publishEligible = errors.length === 0
  if (!hasVerifiedSource) {
    publishEligible = false
    if (reviewStatus === 'published' || reviewStatus === 'approved') {
      errors.push('cannot publish/approve without verified sourceReferences')
    }
  }
  if (reviewStatus === 'published' || reviewStatus === 'approved') {
    const asCase = c as unknown as IndustrialCase
    if (!isReviewFresh(asCase)) {
      errors.push('reviewedContentHash stale or missing for approved/published')
      publishEligible = false
    }
  }
  if (
    reviewStatus === 'published' &&
    curriculum &&
    curriculum.curriculumReviewStatus !== 'approved'
  ) {
    errors.push('published requires curriculumReviewStatus approved')
    publishEligible = false
  }

  // 未验证来源不得偷偷当 verified（已通过枚举约束）；额外警告
  if (sources) {
    for (const src of sources as Record<string, unknown>[]) {
      if (
        src.verificationStatus === 'verified' &&
        src.sourceType === 'textbook_knowledge' &&
        !String(src.sourceIdentifier || '').trim()
      ) {
        warnings.push('textbook verified without sourceIdentifier — prefer unverified')
      }
    }
  }

  const ok = errors.length === 0
  if (!ok) publishEligible = false
  return { ok, errors, warnings, publishEligible }
}

export function assertCaseStructurallyValid(raw: unknown): IndustrialCase {
  const r = validateIndustrialCase(raw)
  if (!r.ok) throw new Error(r.errors.join('; '))
  return raw as IndustrialCase
}
