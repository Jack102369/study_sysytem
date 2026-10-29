import {
  INDUSTRIAL_CATEGORY_CODES,
  INDUSTRIAL_SPECIALTY_CODE,
} from './industrial-case.constants'
import type { IndustrialCase } from './industrial-case.types'
import { validateIndustrialCase } from './industrial-case.validate'
import {
  INDUSTRIAL_AI_GENERATION_MODES,
  INDUSTRIAL_AI_QTYPES,
  type IndustrialAiGenerateRequest,
  type IndustrialAiValidationStageResult,
} from './industrial-ai-generator.types'
import { INDUSTRIAL_AI_OUTPUT_SCHEMA_VERSION } from './prompts/industrial-question.schema'
import type { IndustrialAiRawOutput } from './prompts/industrial-question.schema'
import type { IndustrialDiagramDefinition } from './industrial-diagram.types'

const MAX_QUESTIONS = 3
const MAX_STEM = 800
const MAX_EXPL = 2000

export function validateIndustrialAiGenerateRequest(
  raw: unknown,
): IndustrialAiValidationStageResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!raw || typeof raw !== 'object') {
    return { stage: 'request', ok: false, errors: ['request must be object'], warnings }
  }
  const r = raw as Record<string, unknown>

  if (r.specialtyCode !== INDUSTRIAL_SPECIALTY_CODE) {
    errors.push(`specialtyCode must be ${INDUSTRIAL_SPECIALTY_CODE}`)
  }
  if (
    typeof r.categoryCode !== 'string' ||
    !(INDUSTRIAL_CATEGORY_CODES as readonly string[]).includes(r.categoryCode)
  ) {
    errors.push('categoryCode invalid (must be one of D029 12 categories)')
  }
  if (typeof r.caseCode !== 'string' || !/^[a-z][a-z0-9_]{2,62}$/.test(r.caseCode)) {
    errors.push('caseCode invalid')
  }
  if (!Array.isArray(r.knowledgePoints) || r.knowledgePoints.length < 1) {
    errors.push('knowledgePoints required')
  } else if (r.knowledgePoints.length > 12) {
    errors.push('knowledgePoints too many')
  }
  if (![1, 2, 3].includes(Number(r.difficulty))) {
    errors.push('difficulty must be 1|2|3')
  }
  if (!(INDUSTRIAL_AI_QTYPES as readonly string[]).includes(String(r.qtype))) {
    errors.push('qtype must be single|judge|blank')
  }
  const qc = Number(r.questionCount)
  if (!Number.isInteger(qc) || qc < 1 || qc > MAX_QUESTIONS) {
    errors.push(`questionCount must be 1..${MAX_QUESTIONS}`)
  }
  if (typeof r.diagramRequired !== 'boolean') {
    errors.push('diagramRequired boolean required')
  }
  if (!(INDUSTRIAL_AI_GENERATION_MODES as readonly string[]).includes(String(r.generationMode))) {
    errors.push('generationMode must be formal_candidate|development_test')
  }

  return { stage: 'request', ok: errors.length === 0, errors, warnings }
}

/**
 * 正式候选：必须结构合法 + publishEligible + approved/published + 课程审核 approved + 哈希一致。
 * 开发测试：结构合法即可，强制 development_only。
 */
export function evaluateCaseTrust(
  industrialCase: IndustrialCase,
  mode: 'formal_candidate' | 'development_test',
): IndustrialAiValidationStageResult {
  const errors: string[] = []
  const warnings: string[] = []
  const v = validateIndustrialCase(industrialCase)
  if (!v.ok) {
    errors.push(...v.errors.map((e) => `case:${e}`))
  }
  warnings.push(...v.warnings.map((w) => `case:${w}`))

  if (mode === 'formal_candidate') {
    if (!v.publishEligible) {
      errors.push('formal_candidate requires publishEligible case')
    }
    if (!['approved', 'published'].includes(industrialCase.reviewStatus)) {
      errors.push(`formal_candidate rejects reviewStatus=${industrialCase.reviewStatus}`)
    }
    if (industrialCase.curriculumScope.curriculumReviewStatus !== 'approved') {
      errors.push('formal_candidate requires curriculumReviewStatus=approved')
    }
    const hasVerified = industrialCase.sourceReferences.some(
      (s) => s.verificationStatus === 'verified',
    )
    if (!hasVerified) errors.push('formal_candidate requires verified sourceReferences')
    if (
      !industrialCase.reviewedContentHash ||
      industrialCase.reviewedContentHash !== industrialCase.contentHash
    ) {
      errors.push('formal_candidate requires reviewedContentHash match contentHash')
    }
  } else {
    warnings.push('development_test allows draft/unverified cases; output must be development_only')
  }

  return { stage: 'case_trust', ok: errors.length === 0, errors, warnings }
}

export function parseIndustrialAiJson(content: string): {
  ok: boolean
  value: IndustrialAiRawOutput | null
  error?: string
} {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try {
    const value = JSON.parse(trimmed) as IndustrialAiRawOutput
    return { ok: true, value }
  } catch (e) {
    return { ok: false, value: null, error: `JSON parse failed: ${(e as Error).message}` }
  }
}

export function validateIndustrialAiRawOutput(
  raw: unknown,
  req: IndustrialAiGenerateRequest,
): IndustrialAiValidationStageResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!raw || typeof raw !== 'object') {
    return { stage: 'ai_schema', ok: false, errors: ['output not object'], warnings }
  }
  const o = raw as Record<string, unknown>
  if (o.schemaVersion !== INDUSTRIAL_AI_OUTPUT_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${INDUSTRIAL_AI_OUTPUT_SCHEMA_VERSION}`)
  }
  if (o.qtype !== req.qtype) errors.push(`qtype mismatch: got ${o.qtype}`)
  if (Number(o.difficulty) !== req.difficulty) {
    // 允许模型微调难度但需在 1–3；与请求不一致记警告
    if (![1, 2, 3].includes(Number(o.difficulty))) errors.push('difficulty invalid')
    else warnings.push(`difficulty differs from request (${req.difficulty}→${o.difficulty})`)
  }
  const q = o.question as Record<string, unknown> | undefined
  if (!q || typeof q.stem !== 'string' || !q.stem.trim()) errors.push('question.stem required')
  if (q && String(q.stem).length > MAX_STEM) errors.push('stem too long')
  if (q && q.answerType !== req.qtype) errors.push('question.answerType mismatch')
  if (req.qtype === 'single') {
    if (!Array.isArray(q?.options) || q!.options!.length < 2 || q!.options!.length > 6) {
      errors.push('single requires 2–6 options')
    }
  }
  if (o.answer === undefined || o.answer === null || o.answer === '') {
    errors.push('answer required')
  }
  if (typeof o.explanation !== 'string' || !o.explanation.trim()) {
    errors.push('explanation required')
  } else if (o.explanation.length > MAX_EXPL) {
    errors.push('explanation too long')
  }
  if (!Array.isArray(o.knowledgePoints) || o.knowledgePoints.length < 1) {
    errors.push('knowledgePoints required')
  }
  const cr = o.caseReferences as Record<string, unknown> | undefined
  if (!cr || cr.caseCode !== req.caseCode) {
    errors.push('caseReferences.caseCode mismatch')
  }
  if (!o.diagramDefinition || typeof o.diagramDefinition !== 'object') {
    if (req.diagramRequired) errors.push('diagramDefinition required')
  }

  // 禁止模型伪造系统审核字段
  const forbidden = ['curriculum_ok', 'verify_blocked', 'ban_default_train', 'approved', 'pool']
  const blob = JSON.stringify(o)
  for (const f of forbidden) {
    if (new RegExp(`"${f}"\\s*:\\s*true`, 'i').test(blob)) {
      errors.push(`forbidden system status claim: ${f}=true`)
    }
  }

  return { stage: 'ai_schema', ok: errors.length === 0, errors, warnings }
}

/** 题干引用的节点/标签必须出现在 Definition 中 */
export function validateQuestionDiagramConsistency(
  raw: IndustrialAiRawOutput,
  def: IndustrialDiagramDefinition,
): IndustrialAiValidationStageResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set(def.nodes.map((n) => n.id))
  const labels = new Set(def.nodes.map((n) => n.displayLabel))
  for (const id of raw.question.referencedNodeIds || []) {
    if (!ids.has(id)) errors.push(`referencedNodeId missing in diagram: ${id}`)
  }
  for (const lab of raw.question.referencedLabels || []) {
    if (![...labels].some((l) => l.includes(lab) || lab.includes(l))) {
      warnings.push(`referencedLabel not found as node label: ${lab}`)
    }
  }
  // 题干含「操作①」类时检查
  const stem = raw.question.stem
  const opMatch = stem.match(/操作[①②③④⑤⑥⑦⑧⑨⑩]/g) || []
  for (const op of opMatch) {
    if (![...labels].some((l) => l.includes(op))) {
      errors.push(`stem mentions ${op} but diagram has no such label`)
    }
  }
  return { stage: 'stem_diagram_consistency', ok: errors.length === 0, errors, warnings }
}
