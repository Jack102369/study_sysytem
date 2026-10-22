import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class WrongQuestionListQueryDto {
  @IsOptional()
  @IsString()
  status?: string

  /** 1/true：仅今日建议复习（open + 到期 consolidating） */
  @IsOptional()
  @IsString()
  dueToday?: string

  @IsOptional()
  @IsString()
  specialtyCode?: string

  @IsOptional()
  @IsString()
  categoryCode?: string

  @IsOptional()
  @IsString()
  difficultyBand?: string

  @IsOptional()
  @IsIn(['priority', 'wrong_count', 'recent_wrong'])
  sort?: 'priority' | 'wrong_count' | 'recent_wrong'

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
}

export class WrongQuestionWeakQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}

export class CreateWrongPracticeDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([5, 10, 20])
  count!: number
}

export class CreateWrongVariationPracticeDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([5, 10, 20])
  count!: number
}
