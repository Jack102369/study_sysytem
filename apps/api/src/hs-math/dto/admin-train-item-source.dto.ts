import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator'
import {
  HS_MATH_SOURCE_LICENSE_STATUSES,
  HS_MATH_SOURCE_TYPES,
  HS_MATH_SOURCE_VERIFICATION_STATUSES,
} from '../hs-math.constants'

/** 来源字段补丁（均可选；校验在 Service 统一走 assertValidSourceFields） */
export class HsMathSourcePatchDto {
  @IsOptional()
  @IsIn([...HS_MATH_SOURCE_TYPES])
  sourceType?: (typeof HS_MATH_SOURCE_TYPES)[number]

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2100)
  sourceYear?: number | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(128)
  sourceExamName?: string | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(32)
  sourceQuestionNo?: string | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(512)
  sourceReference?: string | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(512)
  sourceAdaptationNote?: string | null

  @IsOptional()
  @IsIn([...HS_MATH_SOURCE_VERIFICATION_STATUSES])
  sourceVerificationStatus?: (typeof HS_MATH_SOURCE_VERIFICATION_STATUSES)[number]

  @IsOptional()
  @IsIn([...HS_MATH_SOURCE_LICENSE_STATUSES])
  sourceLicenseStatus?: (typeof HS_MATH_SOURCE_LICENSE_STATUSES)[number]
}
