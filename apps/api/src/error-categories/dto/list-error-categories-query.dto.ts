import { IsOptional, IsString } from 'class-validator'

export class ListErrorCategoriesQueryDto {
  @IsOptional()
  @IsString()
  subjectId?: string

  @IsOptional()
  @IsString()
  includeArchived?: string

  /** 为 true 时，按科目筛选也会带上 subject_id 为空的全局特殊分类（如月考模拟卷） */
  @IsOptional()
  @IsString()
  includeGlobal?: string
}
