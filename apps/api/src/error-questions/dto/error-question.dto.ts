import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ERROR_STATUSES } from '../../common/constants/biz'

export class CreateErrorQuestionDto {
  @IsString()
  subjectId!: string

  @IsString()
  @MinLength(1)
  categoryId!: string

  @IsDateString()
  occurredAt!: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string | null

  @IsOptional()
  @IsString()
  stemText?: string | null

  @IsOptional()
  @IsString()
  analysisText?: string | null

  @IsOptional()
  @IsString()
  keyPoints?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[]
}

export class UpdateErrorQuestionDto {
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsString()
  categoryId?: string | null

  @IsOptional()
  @IsDateString()
  occurredAt?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string | null

  @IsOptional()
  @IsString()
  stemText?: string | null

  @IsOptional()
  @IsString()
  analysisText?: string | null

  @IsOptional()
  @IsString()
  keyPoints?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number | null

  @IsOptional()
  @IsIn([...ERROR_STATUSES])
  status?: (typeof ERROR_STATUSES)[number]

  @IsOptional()
  @IsDateString()
  nextReviewAt?: string | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[]
}

export class ListErrorQuestionsQueryDto {
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsIn([...ERROR_STATUSES])
  status?: string

  @IsOptional()
  @IsString()
  tagId?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string

  @IsOptional()
  @IsString()
  keyword?: string

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
}

export class CreateExtensionDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string | null

  @IsOptional()
  @IsString()
  contentText?: string | null

  @IsOptional()
  @IsString()
  answerText?: string | null

  @IsOptional()
  @IsString()
  questionAttachmentId?: string | null
}

export class CreateAttemptDto {
  @IsIn(['CORRECT', 'WRONG', 'PARTIAL'])
  result!: 'CORRECT' | 'WRONG' | 'PARTIAL'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number | null

  @IsOptional()
  @IsString()
  note?: string | null

  @IsOptional()
  @IsString()
  answerAttachmentId?: string | null
}

export class LinkAttachmentDto {
  @IsString()
  attachmentId!: string

  @IsIn(['STEM', 'ANALYSIS', 'OTHER'])
  role!: 'STEM' | 'ANALYSIS' | 'OTHER'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number
}

export class OcrAttachmentDto {
  @IsString()
  attachmentId!: string

  @IsOptional()
  @IsIn(['general', 'formula', 'smart'])
  mode?: 'general' | 'formula' | 'smart'
}
