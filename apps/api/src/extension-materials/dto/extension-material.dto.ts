import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { LEARN_STATUSES } from '../../common/constants/biz'

export class ListExtensionMaterialsQueryDto {
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsIn([...LEARN_STATUSES])
  learnStatus?: (typeof LEARN_STATUSES)[number]

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

export class CreateExtensionMaterialDto {
  @IsString()
  @MinLength(1)
  subjectId!: string

  @IsString()
  @MinLength(1)
  categoryId!: string

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

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string | null

  @IsOptional()
  @IsIn([...LEARN_STATUSES])
  learnStatus?: (typeof LEARN_STATUSES)[number]
}

export class UpdateExtensionMaterialDto {
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

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

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string | null

  @IsOptional()
  @IsIn([...LEARN_STATUSES])
  learnStatus?: (typeof LEARN_STATUSES)[number]
}
