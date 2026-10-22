import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export const STUDY_COMPARE_MODES = ['score', 'class_rank', 'school_rank'] as const

export class UpdateStudyPrefsDto {
  @IsOptional()
  @IsIn([...STUDY_COMPARE_MODES])
  compareMode?: (typeof STUDY_COMPARE_MODES)[number]

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  scoreThreshold?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  rankThreshold?: number
}
