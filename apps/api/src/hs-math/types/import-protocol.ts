/**
 * P1-0D JSON 批量导入协议（跨环境用 code，不用数据库 ID）。
 * 客户端不得传 status / contentVersion / approved。
 */
export type HsMathImportItem = {
  code: string
  specialtyCode: string
  categoryCode: string
  qtype: 'single' | 'multi' | 'judge' | 'numeric'
  difficulty: 1 | 2 | 3
  stem: string
  /** single/multi 必填；judge/numeric 须省略或 null */
  options?: { options: Array<{ id: string; text: string }> } | null
  answerPayload: Record<string, unknown>
  analysis: string
  knowledgePointCodes: string[]
  primaryKnowledgePointCode: string
  /** 可选；默认 formal。不允许客户端指定 status */
  pool?: 'formal' | 'test'
  /** CORE-1A 可选来源；缺省 → original/unverified/unknown */
  sourceType?: 'original' | 'adapted' | 'past_exam'
  sourceYear?: number | null
  sourceExamName?: string | null
  sourceQuestionNo?: string | null
  sourceReference?: string | null
  sourceAdaptationNote?: string | null
  sourceVerificationStatus?: 'unverified' | 'verified'
  sourceLicenseStatus?: 'unknown' | 'permitted' | 'restricted' | 'forbidden'
  /** 方法 code 列表；缺省无关联 */
  methodCodes?: string[]
  primaryMethodCode?: string | null
}

export type HsMathImportIssue = {
  level: 'error' | 'warning'
  code: string
  message: string
}

export type HsMathImportItemReport = {
  index: number
  code: string
  ok: boolean
  errors: HsMathImportIssue[]
  warnings: HsMathImportIssue[]
  resolved?: {
    specialtyId: string
    categoryId: string
    knowledgePointIds: string[]
    primaryKnowledgePointId: string
    methodIds?: string[]
    primaryMethodId?: string | null
  }
}

export const HS_MATH_IMPORT_MAX_ITEMS = 100
export const HS_MATH_IMPORT_PREVIEW_TTL_MS = 30 * 60 * 1000
