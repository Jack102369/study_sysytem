import { IsOptional, IsString } from 'class-validator'

export class ListSubjectsQueryDto {
  @IsOptional()
  @IsString()
  includeArchived?: string
}
