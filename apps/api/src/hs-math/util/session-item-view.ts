import type { HsMathTrainSessionItem } from '../entities/hs-math-train-session-item.entity'
import type { SubmittedHistoryImageView } from './hs-math-application-image-policy'

export type SessionItemKpLabel = {
  code: string
  name: string
  isPrimary: boolean
}

/** 题目当前有效方法关联（非会话快照） */
export type SessionItemMethodLabel = {
  code: string
  name: string
  summary: string
  isPrimary: boolean
}

/** 开训快照中的题干插图元数据（不含二进制；始终可展示） */
export type SessionItemDiagramRef = {
  objectId: string
  sortOrder: number
  altText: string | null
  mimeType: string
  contentSha256: string
}

export type SessionItemViewOptions = {
  /** APPLICATION-2D：仅 completed reveal 时附带已提交引用图 */
  applicationImages?: SubmittedHistoryImageView[]
  /** DIAGRAM-1B：session 插图快照元数据 */
  diagrams?: SessionItemDiagramRef[]
}

/**
 * 学生可见题目视图：reveal=false 时剥离标准答案/解析/判题结果。
 * cancelled 与 in_progress 均应 reveal=false。
 * KP 快照 code 可始终返回（不含答案）；名称由调用方按 code 解析后传入。
 * methods 为题目当前有效关联（非答题时快照）；无关联或 itemId 空时传 []。
 */
export function toStudentSessionItemView(
  item: Pick<
    HsMathTrainSessionItem,
    | 'id'
    | 'sortOrder'
    | 'itemId'
    | 'itemCode'
    | 'qtype'
    | 'stem'
    | 'optionsJson'
    | 'userAnswerPayloadJson'
    | 'answeredAt'
    | 'contentVersion'
    | 'gradeRuleVersion'
    | 'difficulty'
    | 'answerPayloadJson'
    | 'analysis'
    | 'gradeResult'
    | 'gradeReason'
    | 'aiGradeJson'
    | 'aiModel'
    | 'aiGradedAt'
    | 'knowledgePointCodesJson'
    | 'primaryKnowledgePointCode'
  >,
  reveal: boolean,
  kpLabels: SessionItemKpLabel[] = [],
  methods: SessionItemMethodLabel[] = [],
  options: SessionItemViewOptions = {},
) {
  const codes = Array.isArray(item.knowledgePointCodesJson)
    ? item.knowledgePointCodesJson
    : null
  const base = {
    id: String(item.id),
    sortOrder: item.sortOrder,
    itemId: item.itemId ? String(item.itemId) : null,
    itemCode: item.itemCode,
    qtype: item.qtype,
    stem: item.stem,
    optionsJson: item.optionsJson,
    userAnswerPayloadJson: item.userAnswerPayloadJson,
    answeredAt: item.answeredAt,
    contentVersion: item.contentVersion,
    gradeRuleVersion: item.gradeRuleVersion,
    difficulty: item.difficulty,
    knowledgePointCodes: codes,
    primaryKnowledgePointCode: item.primaryKnowledgePointCode ?? null,
    knowledgePoints: kpLabels,
    methods,
    diagrams: options.diagrams ?? [],
  }
  if (!reveal) return base
  const revealed: Record<string, unknown> = {
    ...base,
    answerPayloadJson: item.answerPayloadJson,
    analysis: item.analysis,
    gradeResult: item.gradeResult,
    gradeReason: item.gradeReason,
  }
  // APPLICATION-3A：仅 completed reveal 时返回 AI 批改（无密钥）
  if (item.qtype === 'application' && item.aiGradeJson) {
    revealed.aiGrade = item.aiGradeJson
    revealed.aiModel = item.aiModel ?? null
    revealed.aiGradedAt = item.aiGradedAt ?? null
  }
  // 应用题历史：仅附加答案引用的已提交图（不含 draft 上传列表）
  if (
    item.qtype === 'application' &&
    Array.isArray(options.applicationImages)
  ) {
    revealed.images = options.applicationImages
  }
  return revealed
}
