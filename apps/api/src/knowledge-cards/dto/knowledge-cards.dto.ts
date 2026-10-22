import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import {
  KNOWLEDGE_CARD_STATUSES,
  KNOWLEDGE_KINDS,
} from '../knowledge-card.entity'

export class ListKnowledgeCardsQueryDto {
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

  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsIn([...KNOWLEDGE_KINDS])
  kind?: string

  @IsOptional()
  @IsIn([...KNOWLEDGE_CARD_STATUSES])
  status?: string

  @IsOptional()
  @IsString()
  errorQuestionId?: string
}

export class CreateKnowledgeCardDto {
  @IsString()
  subjectId!: string

  @IsIn([...KNOWLEDGE_KINDS])
  kind!: string

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  content!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tip?: string | null

  @IsOptional()
  @IsIn([...KNOWLEDGE_CARD_STATUSES])
  status?: string

  @IsOptional()
  @IsString()
  linkErrorQuestionId?: string | null
}

export class BatchCreateKnowledgeCardsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CreateKnowledgeCardDto)
  items!: CreateKnowledgeCardDto[]
}

export class UpdateKnowledgeCardDto {
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsIn([...KNOWLEDGE_KINDS])
  kind?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  content?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tip?: string | null

  @IsOptional()
  @IsIn([...KNOWLEDGE_CARD_STATUSES])
  status?: string
}

export class AiFetchKnowledgeDto {
  /** 有 errorQuestionId 时可省略，自动用错题科目 */
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string

  @IsOptional()
  @IsString()
  errorQuestionId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count?: number
}

export class LinkErrorDto {
  @IsString()
  errorQuestionId!: string
}
