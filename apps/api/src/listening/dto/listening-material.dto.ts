import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { PIPER_VOICE_KEYS } from '../piper-voices'

export class ListListeningMaterialsQueryDto {
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

export class CreateListeningMaterialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  contentText!: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string | null

  /** Piper 音色 key，见 GET /listening-materials/voices */
  @IsOptional()
  @IsString()
  @IsIn([...PIPER_VOICE_KEYS])
  voiceKey?: string

  /** Piper length_scale：越大越慢，范围 0.7～1.8 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.7)
  @Max(1.8)
  lengthScale?: number
}
