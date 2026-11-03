import { Type } from 'class-transformer'
import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import {
  AI_OCR_INPUT_TEXT_MAX_CHARS,
  AI_OCR_PROVIDERS,
  AI_OCR_SUBJECTS,
} from '../ai-ocr.constants'

export class CreateAiOcrRecognitionDto {
  @IsIn([...AI_OCR_SUBJECTS])
  subject!: 'math' | 'physics' | 'chemistry'

  @IsString()
  @MinLength(1)
  attachmentId!: string

  @IsBoolean()
  @Equals(true, { message: '请先确认隐私提示后再发起识别' })
  consentAccepted!: true
}

export class ListAiOcrRecognitionsQueryDto {
  @IsOptional()
  @IsIn([...AI_OCR_SUBJECTS])
  subject?: 'math' | 'physics' | 'chemistry'

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

export class CreateAiOcrAnalysisDto {
  @IsIn([...AI_OCR_PROVIDERS])
  provider!: 'qwen' | 'deepseek'

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(AI_OCR_INPUT_TEXT_MAX_CHARS)
  inputText?: string

  @IsBoolean()
  @Equals(true, { message: '请先确认隐私提示后再发起解析' })
  consentAccepted!: true
}

export class ListAiOcrAnalysesQueryDto {
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

export class CreateAiOcrGradingDto {
  @IsIn([...AI_OCR_PROVIDERS])
  provider!: 'qwen' | 'deepseek'

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(AI_OCR_INPUT_TEXT_MAX_CHARS)
  questionText?: string

  /** 可空：空字符串表示未作答（与无作答图一起时走 0 分路径） */
  @IsOptional()
  @IsString()
  @MaxLength(AI_OCR_INPUT_TEXT_MAX_CHARS)
  studentAnswerText?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  answerAttachmentId?: string

  @IsBoolean()
  @Equals(true, { message: '请先确认隐私提示后再发起批改' })
  consentAccepted!: true
}

export class ListAiOcrGradingsQueryDto {
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
