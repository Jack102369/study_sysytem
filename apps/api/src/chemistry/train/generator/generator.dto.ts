import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

const KB_TYPES = [
  'element',
  'substance',
  'reaction',
  'experiment',
  'formula',
  'concept',
  'knowledge',
] as const

const QTYPES = ['single', 'judge', 'blank'] as const

export class GeneratorPreviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  specialtyCode?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryCode?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsIn(KB_TYPES, { each: true })
  kbTypes?: (typeof KB_TYPES)[number][]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(QTYPES, { each: true })
  qtypes?: (typeof QTYPES)[number][]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(2, { each: true })
  difficulties?: number[]

  /** 目标题量：从候选中截取，不会为凑数重复造题 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  targetCount?: number

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @IsString({ each: true })
  sourceCodes?: string[]
}

export class GeneratorConfirmDto {
  @IsUUID()
  previewId!: string

  /** 可选：二次确认题量上限（≤ preview 候选数） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  confirmCount?: number

  /** 确认写入前停用 specialty_cover_filler（默认 true） */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1)
  @IsBoolean()
  deactivateFiller?: boolean
}
