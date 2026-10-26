/**
 * CORE-1A-2D.1 / 2D.1a：来源 / 方法 / KP / PATCH 内容业务语义相等性。
 * 无真实变化则不升 content_version。
 */
import { stableStringify } from './import-preview-token'
import {
  normalizeSourceFields,
  type HsMathSourceFields,
  type HsMathSourceInput,
} from './hs-math-source.validate'

/** 方法关联计划：有序 methodId 列表 + 主方法（与写入 sort_order 一致，顺序敏感） */
export type MethodLinkPlan = {
  methodIds: string[]
  primaryMethodId: string | null
}

/** KP 关联计划：有序 knowledgePointId + 主 KP（展示顺序敏感，与 methods 一致） */
export type KnowledgePointLinkPlan = {
  knowledgePointIds: string[]
  primaryKnowledgePointId: string | null
}

export function normalizeMethodLinkPlan(plan: {
  methodIds: string[]
  primaryMethodId?: string | null
}): MethodLinkPlan {
  const methodIds = plan.methodIds.map((x) => String(x).trim()).filter(Boolean)
  const raw = plan.primaryMethodId
  const primaryMethodId =
    raw === undefined || raw === null || String(raw).trim() === ''
      ? null
      : String(raw).trim()
  return { methodIds, primaryMethodId }
}

export function normalizeKnowledgePointLinkPlan(plan: {
  knowledgePointIds: string[]
  primaryKnowledgePointId?: string | null
}): KnowledgePointLinkPlan {
  const knowledgePointIds = plan.knowledgePointIds
    .map((x) => String(x).trim())
    .filter(Boolean)
  const raw = plan.primaryKnowledgePointId
  const primaryKnowledgePointId =
    raw === undefined || raw === null || String(raw).trim() === ''
      ? null
      : String(raw).trim()
  return { knowledgePointIds, primaryKnowledgePointId }
}

/**
 * 方法关联是否业务相等。
 * - 身份：methodId（稳定）
 * - 顺序敏感（sort_order 按数组序写入，属题目展示业务内容）
 * - 主方法敏感
 */
export function methodLinkPlansEqual(
  a: MethodLinkPlan,
  b: MethodLinkPlan,
): boolean {
  const na = normalizeMethodLinkPlan(a)
  const nb = normalizeMethodLinkPlan(b)
  if (na.methodIds.length !== nb.methodIds.length) return false
  for (let i = 0; i < na.methodIds.length; i++) {
    if (na.methodIds[i] !== nb.methodIds[i]) return false
  }
  return na.primaryMethodId === nb.primaryMethodId
}

export function knowledgePointLinkPlansEqual(
  a: KnowledgePointLinkPlan,
  b: KnowledgePointLinkPlan,
): boolean {
  const na = normalizeKnowledgePointLinkPlan(a)
  const nb = normalizeKnowledgePointLinkPlan(b)
  if (na.knowledgePointIds.length !== nb.knowledgePointIds.length) return false
  for (let i = 0; i < na.knowledgePointIds.length; i++) {
    if (na.knowledgePointIds[i] !== nb.knowledgePointIds[i]) return false
  }
  return na.primaryKnowledgePointId === nb.primaryKnowledgePointId
}

/** 从已加载的关联行构建计划（须已按 sort_order ASC 排序） */
export function methodLinkPlanFromRows(
  rows: Array<{ methodId: string | number; isPrimary: boolean | number }>,
): MethodLinkPlan {
  const methodIds = rows.map((r) => String(r.methodId))
  const primary =
    rows.find((r) => Boolean(r.isPrimary))?.methodId ?? null
  return {
    methodIds,
    primaryMethodId: primary == null ? null : String(primary),
  }
}

export function knowledgePointLinkPlanFromRows(
  rows: Array<{
    knowledgePointId: string | number
    isPrimary: boolean | number
  }>,
): KnowledgePointLinkPlan {
  const knowledgePointIds = rows.map((r) => String(r.knowledgePointId))
  const primary =
    rows.find((r) => Boolean(r.isPrimary))?.knowledgePointId ?? null
  return {
    knowledgePointIds,
    primaryKnowledgePointId: primary == null ? null : String(primary),
  }
}

export function sourceFieldsEqual(
  a: HsMathSourceFields,
  b: HsMathSourceFields,
): boolean {
  return (
    a.sourceType === b.sourceType &&
    a.sourceYear === b.sourceYear &&
    a.sourceExamName === b.sourceExamName &&
    a.sourceQuestionNo === b.sourceQuestionNo &&
    a.sourceReference === b.sourceReference &&
    a.sourceAdaptationNote === b.sourceAdaptationNote &&
    a.sourceVerificationStatus === b.sourceVerificationStatus &&
    a.sourceLicenseStatus === b.sourceLicenseStatus
  )
}

/** 将实体行规范化后与目标来源比较 */
export function sourceInputEqualsPersisted(
  persisted: HsMathSourceInput,
  next: HsMathSourceFields,
): boolean {
  return sourceFieldsEqual(normalizeSourceFields(persisted), next)
}

function normText(v: string | null | undefined): string {
  if (v == null) return ''
  return String(v).trim()
}

function normJson(v: unknown): string {
  if (v === undefined) return 'null'
  return stableStringify(v ?? null)
}

/**
 * PATCH 内容快照（影响 content_version / 指纹的业务字段）。
 * pool 不纳入：指纹 canonicalize 固定 formal，且历史不因 pool 升版。
 * status 不纳入：状态走独立接口。
 */
export type TrainItemContentSnapshot = {
  code: string
  qtype: string
  stem: string
  optionsJson: string
  answerPayloadJson: string
  analysis: string
  difficulty: number
  specialtyId: string
  categoryId: string
  knowledgePointId: string | null
  source: HsMathSourceFields
}

export function snapshotTrainItemContent(row: {
  code: string
  qtype: string
  stem: string
  optionsJson: unknown
  answerPayloadJson: unknown
  analysis: string | null
  difficulty: number
  specialtyId: string | number
  categoryId: string | number
  knowledgePointId?: string | number | null
  sourceType?: string | null
  sourceYear?: number | null
  sourceExamName?: string | null
  sourceQuestionNo?: string | null
  sourceReference?: string | null
  sourceAdaptationNote?: string | null
  sourceVerificationStatus?: string | null
  sourceLicenseStatus?: string | null
}): TrainItemContentSnapshot {
  return {
    code: String(row.code || '').trim(),
    qtype: String(row.qtype || ''),
    stem: normText(row.stem),
    optionsJson: normJson(row.optionsJson),
    answerPayloadJson: normJson(row.answerPayloadJson),
    analysis: normText(row.analysis),
    difficulty: Number(row.difficulty),
    specialtyId: String(row.specialtyId),
    categoryId: String(row.categoryId),
    knowledgePointId:
      row.knowledgePointId == null || row.knowledgePointId === ''
        ? null
        : String(row.knowledgePointId),
    source: normalizeSourceFields({
      sourceType: row.sourceType,
      sourceYear: row.sourceYear,
      sourceExamName: row.sourceExamName,
      sourceQuestionNo: row.sourceQuestionNo,
      sourceReference: row.sourceReference,
      sourceAdaptationNote: row.sourceAdaptationNote,
      sourceVerificationStatus: row.sourceVerificationStatus,
      sourceLicenseStatus: row.sourceLicenseStatus,
    }),
  }
}

export function trainItemContentSnapshotsEqual(
  a: TrainItemContentSnapshot,
  b: TrainItemContentSnapshot,
): boolean {
  return (
    a.code === b.code &&
    a.qtype === b.qtype &&
    a.stem === b.stem &&
    a.optionsJson === b.optionsJson &&
    a.answerPayloadJson === b.answerPayloadJson &&
    a.analysis === b.analysis &&
    a.difficulty === b.difficulty &&
    a.specialtyId === b.specialtyId &&
    a.categoryId === b.categoryId &&
    a.knowledgePointId === b.knowledgePointId &&
    sourceFieldsEqual(a.source, b.source)
  )
}
