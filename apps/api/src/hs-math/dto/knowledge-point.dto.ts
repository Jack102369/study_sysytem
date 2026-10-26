import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'

function toOptionalBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return undefined
  if (value === true || value === 'true' || value === '1' || value === 1)
    return true
  if (value === false || value === 'false' || value === '0' || value === 0)
    return false
  return value
}

/** 稳定 KP code：如 rja.1.1.01 */
const KP_CODE_RE = /^[a-z][a-z0-9_-]*(\.[a-z0-9_-]+)+$/i

export class ListHsMathKnowledgePointsQueryDto {
  @IsOptional()
  @IsString()
  specialtyId?: string

  @IsOptional()
  @IsString()
  categoryId?: string
}

export class CreateHsMathKnowledgePointDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(KP_CODE_RE, {
    message: 'code 格式非法，应为如 rja.1.1.01',
  })
  code!: string

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsString()
  @MinLength(1)
  specialtyId!: string

  @IsString()
  @MinLength(1)
  categoryId!: string

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  parentId?: string | null

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

export class UpdateHsMathKnowledgePointDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(KP_CODE_RE, {
    message: 'code 格式非法，应为如 rja.1.1.01',
  })
  code?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  specialtyId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  parentId?: string | null

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

export class ListHsMathAdminKnowledgePointsQueryDto {
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
  @IsString()
  specialtyId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(64)
  q?: string

  @IsOptional()
  @IsIn(['sortOrder', 'code', 'name', 'updatedAt'])
  sortBy?: 'sortOrder' | 'code' | 'name' | 'updatedAt'

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortDir?: string
}
