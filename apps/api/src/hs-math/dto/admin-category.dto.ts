import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateHsMathCategoryDto {
  @IsString()
  @MinLength(1)
  specialtyId!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateHsMathCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  specialtyId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class ListHsMathAdminCategoriesQueryDto {
  @IsOptional()
  @IsString()
  specialtyId?: string
}
