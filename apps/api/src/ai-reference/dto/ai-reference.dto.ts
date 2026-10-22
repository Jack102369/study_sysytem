import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { AI_REFERENCE_STATUSES } from '../ai-reference-item.entity'

export class ListAiReferenceQueryDto {
  @IsOptional()
  @IsString()
  sourceErrorQuestionId?: string

  @IsOptional()
  @IsIn([...AI_REFERENCE_STATUSES])
  status?: (typeof AI_REFERENCE_STATUSES)[number]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number
}

export class UpdateAiReferenceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  stemText?: string

  @IsOptional()
  @IsString()
  answerText?: string | null

  @IsOptional()
  @IsString()
  analysisText?: string | null
}

export class GenerateAiReferenceDto {
  /** 可选：来自错题本；不传则走自由粘贴题干 */
  @IsOptional()
  @IsString()
  sourceErrorQuestionId?: string

  /** 覆盖 OCR/原题干；无来源错题时必填（服务层校验） */
  @IsOptional()
  @IsString()
  stemText?: string

  /** 自由模式下的科目（提示模型） */
  @IsOptional()
  @IsString()
  subjectId?: string

  /** 知识点（错题分类 id） */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  count?: number

  /** 同类巩固 | 拓展训练（默认） */
  @IsOptional()
  @IsIn(['SIMILAR', 'EXPAND'])
  expandMode?: 'SIMILAR' | 'EXPAND'
}

export class OcrFromErrorDto {
  @IsString()
  @MinLength(1)
  sourceErrorQuestionId!: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  saveToStemText?: boolean
}

export class SetVerifyDto {
  @IsIn(['UNVERIFIED', 'VERIFIED'])
  status!: 'UNVERIFIED' | 'VERIFIED'
}
