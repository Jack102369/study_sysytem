import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator'

export class ListIndustrialReviewQueryDto {
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  categoryCode?: string

  @IsOptional()
  @IsString()
  qtype?: string

  /** E1/E2 批次过滤，如 industrial_formal_candidate_20261029_121958 */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'batchId must be alphanumeric / underscore / hyphen only',
  })
  batchId?: string
}

/** PHASE_E2-B7：多模型审核包导出（batchId 必填） */
export class ExportIndustrialReviewBundleQueryDto {
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'batchId must be alphanumeric / underscore / hyphen only',
  })
  batchId!: string
}

/** PHASE_E2-B7：多模型审核包导出；batchId 必填且禁止路径字符 */
export class ExportMultiModelReviewBundleQueryDto {
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'batchId must be alphanumeric / underscore / hyphen only',
  })
  batchId!: string
}

export class PatchIndustrialReviewDto {
  @IsInt()
  @Min(1)
  expectedRevision!: number

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  stem?: string

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsArray()
  options?: string[] | null

  @IsOptional()
  answer?: string | boolean | string[]

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  explanation?: string

  @IsOptional()
  @IsArray()
  knowledgePoints?: string[]

  @IsOptional()
  @IsIn([1, 2, 3])
  difficulty?: 1 | 2 | 3
}

export class HumanReviewDto {
  @IsIn(['approve', 'reject', 'needs_revision'])
  decision!: 'approve' | 'reject' | 'needs_revision'

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string

  @IsInt()
  @Min(1)
  expectedRevision!: number
}

/** 管理员审核清单：记录来源/案例/KB/unknown 意见；不升格入库、不写 KB links */
export class AdminChecklistDto {
  @IsInt()
  @Min(1)
  expectedRevision!: number

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string

  @IsIn([
    'verified_by_admin',
    'cannot_verify',
    'needs_revision',
    'not_applicable',
  ])
  sourceOutcome!:
    | 'verified_by_admin'
    | 'cannot_verify'
    | 'needs_revision'
    | 'not_applicable'

  @IsIn([
    'acknowledge_draft',
    'request_changes',
    'sources_incomplete',
    'cannot_verify',
  ])
  caseOutcome!:
    | 'acknowledge_draft'
    | 'request_changes'
    | 'sources_incomplete'
    | 'cannot_verify'

  @IsBoolean()
  kbPlanOk!: boolean

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  kbPlanNote?: string

  @IsOptional()
  @IsArray()
  unknownAcknowledgedCheckIds?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  apparatusNotes?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  flowNotes?: string
}

export class CaseReviewOverlayDto {
  @IsString()
  @MaxLength(64)
  caseCode!: string

  @IsString()
  @MaxLength(64)
  contentHashAtReview!: string

  @IsIn([
    'acknowledge_draft',
    'request_changes',
    'sources_incomplete',
    'cannot_verify',
    'approve_for_publish',
  ])
  decision!:
    | 'acknowledge_draft'
    | 'request_changes'
    | 'sources_incomplete'
    | 'cannot_verify'
    | 'approve_for_publish'

  @IsString()
  @MaxLength(2000)
  note!: string

  @IsOptional()
  @IsArray()
  sourceNotes?: Array<{
    sourceTitle: string
    outcome:
      | 'verified_by_admin'
      | 'cannot_verify'
      | 'needs_revision'
      | 'not_applicable'
    evidenceNote: string
  }>

  /** 并发：若提供则须与当前覆盖层 contentHashAtReview 一致 */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  expectedPriorContentHash?: string | null
}

export class FormalImportDto {
  /**
   * 默认 true。仅当 false 且 confirmRealPublish=true 且
   * INDUSTRIAL_FORMAL_REAL_PUBLISH 开启时才可能真实写库。
   */
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean

  /** 显式真实发布意图；缺省/false 时强制 dry-run */
  @IsOptional()
  @IsBoolean()
  confirmRealPublish?: boolean

  @IsInt()
  @Min(1)
  expectedRevision!: number
}

/** STEP_11：管理员为工业正式题绑定已 published 知识实体（不放宽 eligibility） */
export class IndustrialKbBindDto {
  @IsString()
  @MaxLength(64)
  trainItemId!: string

  @IsString()
  @MaxLength(64)
  entityType!: string

  @IsString()
  @MaxLength(64)
  entityId!: string
}
