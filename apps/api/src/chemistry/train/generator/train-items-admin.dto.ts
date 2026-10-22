import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class ListTrainItemsAdminQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  specialtyCode?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryCode?: string

  @IsOptional()
  @IsIn(['PASS', 'NEEDS_FIX', 'NEEDS_VERIFICATION'])
  qa?: 'PASS' | 'NEEDS_FIX' | 'NEEDS_VERIFICATION'

  @IsOptional()
  @IsIn(['allow', 'block', 'pending_human'])
  trialFilter?: 'allow' | 'block' | 'pending_human'

  @IsOptional()
  @IsIn(['test', 'formal'])
  pool?: 'test' | 'formal'

  @IsOptional()
  @IsString()
  @MaxLength(64)
  q?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}
