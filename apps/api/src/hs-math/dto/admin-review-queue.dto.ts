import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import {
  HS_MATH_DIFFICULTIES,
  HS_MATH_ITEM_STATUSES,
  HS_MATH_QTYPES,
} from '../hs-math.constants'

/** 审核队列筛选：reviewStatus 为派生态（含 none/stale） */
export const HS_MATH_QUEUE_REVIEW_FILTERS = [
  'none',
  'passed',
  'rejected',
  'deferred',
  'stale',
] as const

export class ListHsMathReviewQueueQueryDto {
  @IsOptional()
  @IsString()
  specialtyId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsIn([...HS_MATH_QTYPES])
  qtype?: (typeof HS_MATH_QTYPES)[number]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...HS_MATH_DIFFICULTIES])
  difficulty?: number

  @IsOptional()
  @IsIn([...HS_MATH_ITEM_STATUSES])
  status?: (typeof HS_MATH_ITEM_STATUSES)[number]

  @IsOptional()
  @IsIn([...HS_MATH_QUEUE_REVIEW_FILTERS])
  reviewStatus?: (typeof HS_MATH_QUEUE_REVIEW_FILTERS)[number]

  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string

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
}
