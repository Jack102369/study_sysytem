/**
 * 题目来源统一校验与规范化（CORE-1A）。
 * Controller / Service / 导入 / 批准门禁共用，禁止分叉实现。
 */
import { BadRequestException } from '@nestjs/common'
import {
  HS_MATH_SOURCE_LICENSE_DEFAULT,
  HS_MATH_SOURCE_LICENSE_STATUSES,
  HS_MATH_SOURCE_TYPE_DEFAULT,
  HS_MATH_SOURCE_TYPES,
  HS_MATH_SOURCE_VERIFICATION_DEFAULT,
  HS_MATH_SOURCE_VERIFICATION_STATUSES,
  type HsMathSourceLicenseStatus,
  type HsMathSourceType,
  type HsMathSourceVerificationStatus,
} from '../hs-math.constants'

export type HsMathSourceFields = {
  sourceType: HsMathSourceType
  sourceYear: number | null
  sourceExamName: string | null
  sourceQuestionNo: string | null
  sourceReference: string | null
  sourceAdaptationNote: string | null
  sourceVerificationStatus: HsMathSourceVerificationStatus
  sourceLicenseStatus: HsMathSourceLicenseStatus
}

export type HsMathSourceInput = {
  sourceType?: string | null
  sourceYear?: number | null
  sourceExamName?: string | null
  sourceQuestionNo?: string | null
  sourceReference?: string | null
  sourceAdaptationNote?: string | null
  sourceVerificationStatus?: string | null
  sourceLicenseStatus?: string | null
}

function emptyToNull(s: string | null | undefined): string | null {
  if (s == null) return null
  const t = String(s).trim()
  return t.length ? t : null
}

/** 稳定规范化：缺省与迁移默认值一致，供指纹/比较使用 */
export function normalizeSourceFields(
  input?: HsMathSourceInput | null,
): HsMathSourceFields {
  const rawType = emptyToNull(input?.sourceType as string | null)
  const sourceType = (rawType ||
    HS_MATH_SOURCE_TYPE_DEFAULT) as HsMathSourceType

  const rawVer = emptyToNull(input?.sourceVerificationStatus as string | null)
  const sourceVerificationStatus = (rawVer ||
    HS_MATH_SOURCE_VERIFICATION_DEFAULT) as HsMathSourceVerificationStatus

  const rawLic = emptyToNull(input?.sourceLicenseStatus as string | null)
  const sourceLicenseStatus = (rawLic ||
    HS_MATH_SOURCE_LICENSE_DEFAULT) as HsMathSourceLicenseStatus

  let sourceYear: number | null = null
  if (input?.sourceYear != null && input.sourceYear !== ('' as any)) {
    const n = Number(input.sourceYear)
    sourceYear = Number.isFinite(n) ? Math.trunc(n) : null
  }

  return {
    sourceType,
    sourceYear,
    sourceExamName: emptyToNull(input?.sourceExamName),
    sourceQuestionNo: emptyToNull(input?.sourceQuestionNo),
    sourceReference: emptyToNull(input?.sourceReference),
    sourceAdaptationNote: emptyToNull(input?.sourceAdaptationNote),
    sourceVerificationStatus,
    sourceLicenseStatus,
  }
}

/** 是否为「旧题兼容默认元数据」（无真实业务标注） */
export function isDefaultSourceMeta(s: HsMathSourceFields): boolean {
  return (
    s.sourceType === HS_MATH_SOURCE_TYPE_DEFAULT &&
    s.sourceVerificationStatus === HS_MATH_SOURCE_VERIFICATION_DEFAULT &&
    s.sourceLicenseStatus === HS_MATH_SOURCE_LICENSE_DEFAULT &&
    s.sourceYear == null &&
    !s.sourceExamName &&
    !s.sourceQuestionNo &&
    !s.sourceReference &&
    !s.sourceAdaptationNote
  )
}

export type SourceValidateMode = 'persist' | 'publish'

/**
 * 校验来源。persist=保存/导入；publish=正式批准 formal 加严。
 */
export function assertValidSourceFields(
  input: HsMathSourceInput | null | undefined,
  mode: SourceValidateMode = 'persist',
): HsMathSourceFields {
  const s = normalizeSourceFields(input)

  if (!(HS_MATH_SOURCE_TYPES as readonly string[]).includes(s.sourceType)) {
    throw new BadRequestException(`非法 source_type：${s.sourceType}`)
  }
  if (
    !(HS_MATH_SOURCE_VERIFICATION_STATUSES as readonly string[]).includes(
      s.sourceVerificationStatus,
    )
  ) {
    throw new BadRequestException(
      `非法 source_verification_status：${s.sourceVerificationStatus}`,
    )
  }
  if (
    !(HS_MATH_SOURCE_LICENSE_STATUSES as readonly string[]).includes(
      s.sourceLicenseStatus,
    )
  ) {
    throw new BadRequestException(
      `非法 source_license_status：${s.sourceLicenseStatus}`,
    )
  }

  if (s.sourceYear != null) {
    if (
      !Number.isInteger(s.sourceYear) ||
      s.sourceYear < 1990 ||
      s.sourceYear > 2100
    ) {
      throw new BadRequestException('source_year 须为 1990–2100 的整数')
    }
  }
  if (s.sourceExamName && s.sourceExamName.length > 128) {
    throw new BadRequestException('source_exam_name 过长')
  }
  if (s.sourceQuestionNo && s.sourceQuestionNo.length > 32) {
    throw new BadRequestException('source_question_no 过长')
  }
  if (s.sourceReference && s.sourceReference.length > 512) {
    throw new BadRequestException('source_reference 过长')
  }
  if (s.sourceAdaptationNote && s.sourceAdaptationNote.length > 512) {
    throw new BadRequestException('source_adaptation_note 过长')
  }

  const needsProvenance =
    s.sourceType === 'adapted' || s.sourceType === 'past_exam'

  if (needsProvenance) {
    if (
      s.sourceYear == null ||
      !s.sourceExamName ||
      !s.sourceQuestionNo ||
      !s.sourceReference
    ) {
      throw new BadRequestException(
        `${s.sourceType} 须提供年份、试卷名称、题号与出处（source_reference）`,
      )
    }
    if (s.sourceType === 'adapted' && !s.sourceAdaptationNote) {
      throw new BadRequestException('adapted 须提供改编说明')
    }
    if (s.sourceVerificationStatus !== 'verified') {
      throw new BadRequestException(
        `${s.sourceType} 须 source_verification_status=verified（禁止未核实冒充真题/改编）`,
      )
    }
  }

  if (mode === 'publish') {
    assertSourceAllowsFormalPublish(s)
  }

  return s
}

/** formal 批准许可门禁（approve 写入与只读评估共用；禁止分叉规则） */
export function assertSourceAllowsFormalPublish(s: HsMathSourceFields): void {
  if (s.sourceLicenseStatus === 'forbidden') {
    throw new BadRequestException(
      'source_license_status=forbidden，禁止正式批准',
    )
  }
  if (s.sourceLicenseStatus === 'restricted') {
    throw new BadRequestException(
      'source_license_status=restricted，禁止正式批准到公开学生池',
    )
  }
  if (s.sourceType === 'adapted' || s.sourceType === 'past_exam') {
    if (s.sourceVerificationStatus !== 'verified') {
      throw new BadRequestException('真题/改编须核实后才能正式批准')
    }
    if (s.sourceLicenseStatus !== 'permitted') {
      throw new BadRequestException(
        '真题/改编须 source_license_status=permitted 才能正式批准',
      )
    }
    // 再次确保齐全
    assertValidSourceFields(s, 'persist')
  }
  // original + unverified + unknown：兼容旧题，允许批准（展示须标明未核实）
}

/**
 * 只读评估：复用 assertSourceAllowsFormalPublish，将 BadRequestException 转为原因列表。
 * 非 BadRequestException 必须上抛（不得吞掉无关异常）。
 * 供 review-panel 等只读接口填充 publishBlockReasons；不写库、不 approve。
 */
export function collectSourcePublishBlockReasons(
  input?: HsMathSourceInput | HsMathSourceFields | null,
): string[] {
  const s = normalizeSourceFields(input)
  try {
    assertSourceAllowsFormalPublish(s)
    return []
  } catch (e) {
    if (e instanceof BadRequestException) {
      return [messageFromBadRequest(e)]
    }
    throw e
  }
}

function messageFromBadRequest(e: BadRequestException): string {
  const res = e.getResponse()
  if (typeof res === 'string' && res.trim()) return res.trim()
  if (res && typeof res === 'object') {
    const msg = (res as { message?: string | string[] }).message
    if (Array.isArray(msg)) {
      const joined = msg.map((x) => String(x)).filter(Boolean).join('; ')
      if (joined) return joined
    } else if (typeof msg === 'string' && msg.trim()) {
      return msg.trim()
    }
  }
  const fallback = String(e.message || '').trim()
  return fallback || 'source publish blocked'
}

/** 供指纹的稳定对象（键齐全，空串而非缺键） */
export function sourceFieldsForFingerprint(s: HsMathSourceFields) {
  return {
    sourceType: s.sourceType,
    sourceYear: s.sourceYear,
    sourceExamName: s.sourceExamName || '',
    sourceQuestionNo: s.sourceQuestionNo || '',
    sourceReference: s.sourceReference || '',
    sourceAdaptationNote: s.sourceAdaptationNote || '',
    sourceVerificationStatus: s.sourceVerificationStatus,
    sourceLicenseStatus: s.sourceLicenseStatus,
  }
}
