import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateHsMathMethodDto {
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
  @MaxLength(512)
  summary?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateHsMathMethodDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  summary?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class ListHsMathMethodsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean
}
