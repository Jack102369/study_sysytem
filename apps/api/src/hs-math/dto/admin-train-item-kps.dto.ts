import { Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator'

/**
 * 替换题目全部 KP 关联。
 * - knowledgePointIds 为空：清空关联，primary 须为空
 * - 非空：必须指定 primaryKnowledgePointId 且属于列表
 * P1-0C：仅允许同 specialty 知识点（保守，不跨章）
 */
export class ReplaceHsMathTrainItemKpsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  knowledgePointIds!: string[]

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  @MinLength(1)
  primaryKnowledgePointId?: string | null

  /** 乐观并发：打开面板时的 content_version */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  expectedContentVersion?: number
}
