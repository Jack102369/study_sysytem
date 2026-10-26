import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { HS_MATH_SESSION_STATUSES } from '../hs-math.constants'

export const HS_MATH_SESSION_SORT_FIELDS = [
  'startedAt',
  'submittedAt',
] as const

export class ListHsMathTrainSessionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number

  @IsOptional()
  @IsIn([...HS_MATH_SESSION_STATUSES])
  status?: (typeof HS_MATH_SESSION_STATUSES)[number]

  @IsOptional()
  @IsString()
  @MinLength(1)
  specialtyId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string

  /** YYYY-MM-DD，按 started_at 上海日过滤下界（含） */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom?: string

  /** YYYY-MM-DD，按 started_at 上海日过滤上界（含） */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo?: string

  @IsOptional()
  @IsIn([...HS_MATH_SESSION_SORT_FIELDS])
  sortBy?: (typeof HS_MATH_SESSION_SORT_FIELDS)[number]

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC'
}
