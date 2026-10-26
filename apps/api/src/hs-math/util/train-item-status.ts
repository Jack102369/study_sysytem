import { BadRequestException } from '@nestjs/common'
import type { HsMathItemStatus } from '../hs-math.constants'

/**
 * 审核状态机（P0-2）：
 * draft → approved
 * approved → disabled
 * disabled → draft
 *
 * 内容修改导致的 approved → draft 由 Service 处理，不经过本函数。
 */
const ALLOWED: Record<HsMathItemStatus, HsMathItemStatus[]> = {
  draft: ['approved'],
  approved: ['disabled'],
  disabled: ['draft'],
}

export function assertStatusTransition(
  from: HsMathItemStatus,
  to: HsMathItemStatus,
): void {
  if (from === to) {
    throw new BadRequestException(`题目已是 ${to} 状态`)
  }
  const allowed = ALLOWED[from] ?? []
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `不允许的状态转换：${from} → ${to}（允许：${allowed.join(', ') || '无'}）`,
    )
  }
}

/** 训练抽题候选：仅 approved 且 is_active */
export function isTrainCandidate(status: HsMathItemStatus, isActive: boolean): boolean {
  return status === 'approved' && !!isActive
}

/**
 * DTO 是否「触及」内容字段（字段出现判定，非值相等）。
 * CORE-1A-2D.1a：PATCH 升版改用 trainItemContentSnapshotsEqual；
 * 本函数保留给既有自测/文档语义，勿再作为唯一升版依据。
 */
export function isSubstantiveTrainItemChange(patch: {
  stem?: unknown
  optionsJson?: unknown
  answerPayloadJson?: unknown
  qtype?: unknown
  analysis?: unknown
  difficulty?: unknown
  specialtyId?: unknown
  categoryId?: unknown
  code?: unknown
  sourceType?: unknown
  sourceYear?: unknown
  sourceExamName?: unknown
  sourceQuestionNo?: unknown
  sourceReference?: unknown
  sourceAdaptationNote?: unknown
  sourceVerificationStatus?: unknown
  sourceLicenseStatus?: unknown
}): boolean {
  return (
    patch.stem !== undefined ||
    patch.optionsJson !== undefined ||
    patch.answerPayloadJson !== undefined ||
    patch.qtype !== undefined ||
    patch.analysis !== undefined ||
    patch.difficulty !== undefined ||
    patch.specialtyId !== undefined ||
    patch.categoryId !== undefined ||
    patch.code !== undefined ||
    patch.sourceType !== undefined ||
    patch.sourceYear !== undefined ||
    patch.sourceExamName !== undefined ||
    patch.sourceQuestionNo !== undefined ||
    patch.sourceReference !== undefined ||
    patch.sourceAdaptationNote !== undefined ||
    patch.sourceVerificationStatus !== undefined ||
    patch.sourceLicenseStatus !== undefined
  )
}
