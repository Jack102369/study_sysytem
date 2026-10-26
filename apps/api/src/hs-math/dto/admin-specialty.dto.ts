import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateHsMathSpecialtyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  bookCode?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  chapterNo?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(255)
  intro?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateHsMathSpecialtyDto {
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
  @IsString()
  @MaxLength(32)
  bookCode?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  chapterNo?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(255)
  intro?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
