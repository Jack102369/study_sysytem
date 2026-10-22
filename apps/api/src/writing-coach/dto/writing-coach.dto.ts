import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import {
  WRITING_REVIEW_MODES,
  WRITING_SUBJECT_TRACKS,
  WRITING_TOPIC_SOURCES,
} from '../writing-coach-session.entity'

export class ListWritingCoachQueryDto {
  @IsOptional()
  @IsIn([...WRITING_SUBJECT_TRACKS])
  subjectTrack?: (typeof WRITING_SUBJECT_TRACKS)[number]

  @IsOptional()
  @IsIn([...WRITING_TOPIC_SOURCES])
  topicSource?: (typeof WRITING_TOPIC_SOURCES)[number]

  @IsOptional()
  @IsIn([...WRITING_REVIEW_MODES])
  reviewMode?: (typeof WRITING_REVIEW_MODES)[number]

  /** yes=有点评 no=无点评 */
  @IsOptional()
  @IsIn(['yes', 'no'])
  hasReview?: 'yes' | 'no'

  @IsOptional()
  @IsString()
  @MaxLength(200)
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
  pageSize?: number
}

export class GenerateWritingTopicDto {
  @IsIn([...WRITING_SUBJECT_TRACKS])
  subjectTrack!: (typeof WRITING_SUBJECT_TRACKS)[number]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  hint?: string | null
}

export class CreateWritingCoachDto {
  @IsIn([...WRITING_SUBJECT_TRACKS])
  subjectTrack!: (typeof WRITING_SUBJECT_TRACKS)[number]

  @IsOptional()
  @IsIn([...WRITING_TOPIC_SOURCES])
  topicSource?: (typeof WRITING_TOPIC_SOURCES)[number]

  @IsOptional()
  @IsIn([...WRITING_REVIEW_MODES])
  reviewMode?: (typeof WRITING_REVIEW_MODES)[number]

  @IsString()
  @MinLength(1)
  topicText!: string

  @IsOptional()
  @IsString()
  topicRequirements?: string | null

  @IsOptional()
  @IsString()
  outlineText?: string | null

  @IsOptional()
  @IsString()
  openingText?: string | null

  @IsOptional()
  @IsString()
  finalDraftText?: string | null
}

export class UpdateWritingCoachDto {
  @IsOptional()
  @IsIn([...WRITING_TOPIC_SOURCES])
  topicSource?: (typeof WRITING_TOPIC_SOURCES)[number]

  @IsOptional()
  @IsIn([...WRITING_REVIEW_MODES])
  reviewMode?: (typeof WRITING_REVIEW_MODES)[number]

  @IsOptional()
  @IsString()
  @MinLength(1)
  topicText?: string

  @IsOptional()
  @IsString()
  topicRequirements?: string | null

  @IsOptional()
  @IsString()
  outlineText?: string | null

  @IsOptional()
  @IsString()
  openingText?: string | null

  @IsOptional()
  @IsString()
  finalDraftText?: string | null
}

export class ReviewWritingCoachDto {
  /** 传入则点评并写回该会话；不传则仅返回点评（需带提纲/首段） */
  @IsOptional()
  @IsString()
  id?: string

  @IsOptional()
  @IsIn([...WRITING_SUBJECT_TRACKS])
  subjectTrack?: (typeof WRITING_SUBJECT_TRACKS)[number]

  @IsOptional()
  @IsString()
  topicText?: string

  @IsOptional()
  @IsString()
  topicRequirements?: string | null

  @IsOptional()
  @IsString()
  outlineText?: string

  @IsOptional()
  @IsString()
  openingText?: string
}

export class GaokaoReviewWritingCoachDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsOptional()
  @IsIn([...WRITING_SUBJECT_TRACKS])
  subjectTrack?: (typeof WRITING_SUBJECT_TRACKS)[number]

  @IsOptional()
  @IsString()
  topicText?: string

  @IsOptional()
  @IsString()
  topicRequirements?: string | null

  @IsOptional()
  @IsString()
  essayText?: string
}
