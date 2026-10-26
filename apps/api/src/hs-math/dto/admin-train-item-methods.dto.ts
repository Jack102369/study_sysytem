import { Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { HsMathSourcePatchDto } from './admin-train-item-source.dto'

export class ReplaceHsMathTrainItemMethodsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  methodIds!: string[]

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MinLength(1)
  primaryMethodId?: string | null

  /** 乐观并发：打开面板时的 content_version */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  expectedContentVersion?: number
}

/** 同源+方法原子更新 */
export class PutHsMathTrainItemContentMetaDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HsMathSourcePatchDto)
  source?: HsMathSourcePatchDto

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  methodIds?: string[]

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MinLength(1)
  primaryMethodId?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  expectedContentVersion?: number
}
