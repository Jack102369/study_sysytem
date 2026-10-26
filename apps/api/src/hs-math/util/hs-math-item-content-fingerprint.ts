/**
 * 题目内容指纹（P1-0F-C3B）：与导入 canonicalize 同构，服务端重算。
 */
import { validateAnswerPayload } from './answer-payload.validate'
import {
  canonicalizeImportItem,
  fingerprintCanonicalItem,
} from './import-preview-token'

export type ItemFingerprintInput = {
  code: string
  specialtyCode: string
  categoryCode: string
  qtype: string
  difficulty: number
  stem: string
  optionsJson: unknown
  answerPayloadJson: unknown
  analysis: string | null
  knowledgePointCodes: string[]
  primaryKnowledgePointCode: string
  pool?: string
  /** CORE-1A 可选；缺省按兼容默认（不入指纹） */
  sourceType?: string | null
  sourceYear?: number | null
  sourceExamName?: string | null
  sourceQuestionNo?: string | null
  sourceReference?: string | null
  sourceAdaptationNote?: string | null
  sourceVerificationStatus?: string | null
  sourceLicenseStatus?: string | null
  methodCodes?: string[]
  primaryMethodCode?: string | null
  /** 按 sort_order 的插图 content_sha256；空/缺省不入指纹 */
  diagramSha256List?: string[]
}

/** 规范化后计算单题内容指纹；选项/答案走判题协议规范化。 */
export function fingerprintTrainItemContent(
  input: ItemFingerprintInput,
): string {
  const qtype = input.qtype as
    | 'single'
    | 'multi'
    | 'judge'
    | 'numeric'
    | 'application'
  const norm = validateAnswerPayload({
    qtype,
    optionsJson: input.optionsJson ?? null,
    answerPayload: input.answerPayloadJson,
  })
  const canon = canonicalizeImportItem({
    code: input.code,
    specialtyCode: input.specialtyCode,
    categoryCode: input.categoryCode,
    qtype: input.qtype,
    difficulty: Number(input.difficulty),
    stem: input.stem,
    options: norm.optionsJson,
    answerPayload: norm.answerPayload,
    analysis: input.analysis ?? '',
    knowledgePointCodes: input.knowledgePointCodes,
    primaryKnowledgePointCode: input.primaryKnowledgePointCode,
    pool: 'formal',
    sourceType: input.sourceType,
    sourceYear: input.sourceYear,
    sourceExamName: input.sourceExamName,
    sourceQuestionNo: input.sourceQuestionNo,
    sourceReference: input.sourceReference,
    sourceAdaptationNote: input.sourceAdaptationNote,
    sourceVerificationStatus: input.sourceVerificationStatus,
    sourceLicenseStatus: input.sourceLicenseStatus,
    methodCodes: input.methodCodes ?? [],
    primaryMethodCode: input.primaryMethodCode ?? '',
    diagramSha256List: input.diagramSha256List ?? [],
  })
  if (!canon) {
    throw new Error('无法规范化题目内容以计算指纹')
  }
  canon.difficulty = Number(canon.difficulty)
  return fingerprintCanonicalItem(canon)
}

export function isMysqlNoSuchTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as {
    code?: string
    errno?: number
    message?: string
    driverError?: { code?: string; errno?: number; message?: string }
  }
  const code = e.code || e.driverError?.code
  const errno = e.errno ?? e.driverError?.errno
  const msg = `${e.message || ''} ${e.driverError?.message || ''}`
  return (
    code === 'ER_NO_SUCH_TABLE' ||
    errno === 1146 ||
    /doesn't exist/i.test(msg) ||
    /Unknown table/i.test(msg)
  )
}
