import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateErrorCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name?: string

  @IsOptional()
  @IsString()
  subjectId?: string | null

  @IsOptional()
  @IsString()
  parentId?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isArchived?: boolean
}
