import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'

export class ScoreItemDto {
  @IsString()
  subjectId!: string

  @Type(() => Number)
  @IsNumber()
  score!: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fullScore?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classRank?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classSize?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolRank?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolSize?: number | null

  @IsOptional()
  @IsString()
  note?: string | null
}

export class CreateAssessmentDto {
  @IsString()
  typeId!: string

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  title!: string

  @IsDateString()
  heldAt!: string

  @IsOptional()
  @IsString()
  note?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalScore?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classRank?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolRank?: number | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[]

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  scores!: ScoreItemDto[]
}

export class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  typeId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  title?: string

  @IsOptional()
  @IsDateString()
  heldAt?: string

  @IsOptional()
  @IsString()
  note?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalScore?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classRank?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolRank?: number | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  scores?: ScoreItemDto[]
}

export class ListAssessmentsQueryDto {
  @IsOptional()
  @IsString()
  typeId?: string

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string

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

export class TrendsQueryDto {
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsString()
  typeId?: string

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string
}
