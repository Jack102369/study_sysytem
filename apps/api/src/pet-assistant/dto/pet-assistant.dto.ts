import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { PET_SKIN_IDS } from '../pet-skins'

export class PetChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant'

  @IsString()
  @MaxLength(2000)
  content!: string
}

export class PetChatDto {
  @IsString()
  @MaxLength(1000)
  message!: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PetChatMessageDto)
  history?: PetChatMessageDto[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string

  @IsOptional()
  @IsIn([...PET_SKIN_IDS])
  skinId?: (typeof PET_SKIN_IDS)[number]
}

export class UpdatePetPrefsDto {
  @IsOptional()
  @IsIn([...PET_SKIN_IDS])
  skinId?: (typeof PET_SKIN_IDS)[number]

  @IsOptional()
  @IsBoolean()
  petEnabled?: boolean

  /** 按 skinId 覆盖唤醒词；传空对象可清空 */
  @IsOptional()
  @IsObject()
  wakeWordOverrides?: Record<string, string>
}
