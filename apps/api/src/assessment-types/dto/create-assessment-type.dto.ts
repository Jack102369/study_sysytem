import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateAssessmentTypeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number
}
