import { IsOptional, IsString } from 'class-validator'

export class ListAssessmentTypesQueryDto {
  @IsOptional()
  @IsString()
  includeArchived?: string
}
