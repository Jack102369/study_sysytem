import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'
import {
  HS_MATH_DIFFICULTIES,
  HS_MATH_ITEM_STATUSES,
  HS_MATH_POOLS,
  HS_MATH_QTYPES,
  HS_MATH_SOURCE_LICENSE_STATUSES,
  HS_MATH_SOURCE_TYPES,
  HS_MATH_SOURCE_VERIFICATION_STATUSES,
} from '../hs-math.constants'

export class CreateHsMathTrainItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string

  @IsOptional()
  @IsIn([...HS_MATH_POOLS])
  pool?: (typeof HS_MATH_POOLS)[number]

  @IsIn([...HS_MATH_QTYPES])
  qtype!: (typeof HS_MATH_QTYPES)[number]

  @IsString()
  @MinLength(1)
  stem!: string

  /** single/multi 必填；judge/numeric 应省略或 null */
  @IsOptional()
  optionsJson?: unknown

  @IsObject()
  answerPayloadJson!: Record<string, unknown>

  @IsOptional()
  @IsString()
  analysis?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...HS_MATH_DIFFICULTIES])
  difficulty?: number

  @IsString()
  @MinLength(1)
  specialtyId!: string

  @IsString()
  @MinLength(1)
  categoryId!: string

  @IsOptional()
  @IsString()
  knowledgePointId?: string | null
}

export class UpdateHsMathTrainItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string

  @IsOptional()
  @IsIn([...HS_MATH_POOLS])
  pool?: (typeof HS_MATH_POOLS)[number]

  @IsOptional()
  @IsIn([...HS_MATH_QTYPES])
  qtype?: (typeof HS_MATH_QTYPES)[number]

  @IsOptional()
  @IsString()
  @MinLength(1)
  stem?: string

  @IsOptional()
  optionsJson?: unknown

  @IsOptional()
  @IsObject()
  answerPayloadJson?: Record<string, unknown>

  @IsOptional()
  @IsString()
  analysis?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...HS_MATH_DIFFICULTIES])
  difficulty?: number

  @IsOptional()
  @IsString()
  @MinLength(1)
  specialtyId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  knowledgePointId?: string | null

  @IsOptional()
  @IsIn([...HS_MATH_SOURCE_TYPES])
  sourceType?: (typeof HS_MATH_SOURCE_TYPES)[number]

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2100)
  sourceYear?: number | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(128)
  sourceExamName?: string | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(32)
  sourceQuestionNo?: string | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(512)
  sourceReference?: string | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(512)
  sourceAdaptationNote?: string | null

  @IsOptional()
  @IsIn([...HS_MATH_SOURCE_VERIFICATION_STATUSES])
  sourceVerificationStatus?: (typeof HS_MATH_SOURCE_VERIFICATION_STATUSES)[number]

  @IsOptional()
  @IsIn([...HS_MATH_SOURCE_LICENSE_STATUSES])
  sourceLicenseStatus?: (typeof HS_MATH_SOURCE_LICENSE_STATUSES)[number]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  expectedContentVersion?: number

  /** 禁止通过更新接口改 status；请用 status 接口 */
}

export class PatchHsMathTrainItemStatusDto {
  @IsIn([...HS_MATH_ITEM_STATUSES])
  status!: (typeof HS_MATH_ITEM_STATUSES)[number]

  /**
   * 当 status=approved 时必须为 true（正式发布二次确认）。
   * 其他状态可省略。
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  confirmPublish?: boolean
}

export class ListHsMathTrainItemsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number

  @IsOptional()
  @IsIn([...HS_MATH_POOLS])
  pool?: (typeof HS_MATH_POOLS)[number]

  @IsOptional()
  @IsIn([...HS_MATH_ITEM_STATUSES])
  status?: (typeof HS_MATH_ITEM_STATUSES)[number]

  @IsOptional()
  @IsIn([...HS_MATH_QTYPES])
  qtype?: (typeof HS_MATH_QTYPES)[number]

  @IsOptional()
  @IsString()
  specialtyId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  q?: string
}

/** 题库库存统计口径 */
export class HsMathInventoryStatsQueryDto {
  /**
   * drawable = formal+approved+is_active（默认可抽题）
   * all_formal = pool=formal 全部状态（含 draft/disabled）
   */
  @IsOptional()
  @IsIn(['drawable', 'all_formal'])
  scope?: 'drawable' | 'all_formal'
}
