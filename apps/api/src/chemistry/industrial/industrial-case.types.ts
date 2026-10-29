import type {
  IndustrialCaseType,
  IndustrialCategoryCode,
  IndustrialCurriculumReviewStatus,
  IndustrialGradeScope,
  IndustrialMaterialType,
  IndustrialOperationType,
  IndustrialPhysicalState,
  IndustrialReviewStatus,
  IndustrialSourceType,
  IndustrialVerificationStatus,
} from './industrial-case.constants'

export type IndustrialSourceReference = {
  sourceType: IndustrialSourceType
  sourceTitle: string
  /** 可为空；禁止虚构页码/链接 */
  sourceIdentifier?: string | null
  sourceDescription?: string
  verificationStatus: IndustrialVerificationStatus
  /** 若引用 KB：entityType + entityId */
  kbEntityType?: string | null
  kbEntityId?: string | null
}

export type IndustrialMaterial = {
  materialId: string
  name: string
  /** 混合物等可为空；不得强行编造化学式 */
  formula?: string | null
  materialType: IndustrialMaterialType
  physicalState: IndustrialPhysicalState
  purity?: { value: number; unit: string; note?: string } | null
  impurities?: string[]
  knowledge?: string
  knowledgeReference?: string | null
}

export type IndustrialProcessStep = {
  stepId: string
  stepName: string
  operationType: IndustrialOperationType
  inputs: string[]
  outputs: string[]
  reagents?: string[]
  conditions?: string
  purpose?: string
  principle?: string
  knowledgeReferences?: string[]
  safetyNotes?: string
}

export type IndustrialReactionLink = {
  reactionReference: string
  equation?: string | null
  reactants?: string[]
  products?: string[]
  conditions?: string | null
  knowledgeReference?: string | null
  /** 关联 chem_reactions.id（若有） */
  kbReactionId?: string | null
  /** 未进入已审核 KB 时必须为 true */
  pendingVerification: boolean
}

export type IndustrialKnowledgeLink = {
  label: string
  note?: string
  kbEntityType?: string | null
  kbEntityId?: string | null
}

export type IndustrialCase = {
  caseCode: string
  title: string
  description: string
  caseType: IndustrialCaseType
  gradeScope: IndustrialGradeScope
  curriculumScope: {
    grade: string
    knowledgePoints: string[]
    curriculumNotes?: string
    curriculumReviewStatus: IndustrialCurriculumReviewStatus
  }
  specialtyCode: 'industrial_experiment'
  categoryCodes: IndustrialCategoryCode[]
  sourceReferences: IndustrialSourceReference[]
  materials: IndustrialMaterial[]
  processSteps: IndustrialProcessStep[]
  reactions: IndustrialReactionLink[]
  knowledgeLinks: IndustrialKnowledgeLink[]
  learningObjectives: string[]
  /** 对应 chem_train_items.difficulty 1–3 */
  difficultyRange: { min: number; max: number }
  safetyNotes: string
  reviewStatus: IndustrialReviewStatus
  /** 语义内容版本 semver */
  version: string
  /** 语义内容哈希（不含审核态/时间戳） */
  contentHash: string
  /** 通过审核时对应的 contentHash；与 contentHash 不一致则审核失效 */
  reviewedContentHash?: string | null
  createdAt: string
  updatedAt: string
  /** 缺失依据等说明 */
  openIssues?: string[]
}

/** 结构校验结果：通过 ≠ 化学正确 */
export type IndustrialCaseValidationResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
  /** 是否允许标记为可发布（结构+依据门槛，仍非化学证明） */
  publishEligible: boolean
}
