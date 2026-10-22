import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { TRAIN_COUNTS, TRAIN_MODES, TRAIN_POOLS } from '../train.constants'

export const ADVANCED_DIFFICULTY_MODES = ['raise', 'challenge', 'mix'] as const
export type AdvancedDifficultyMode = (typeof ADVANCED_DIFFICULTY_MODES)[number]

export const ADVANCED_ITEM_SCOPES = ['all', 's60'] as const
export type AdvancedItemScope = (typeof ADVANCED_ITEM_SCOPES)[number]

export class AdvancedAvailabilityQueryDto {
  /** 空或 all = 全部专项 */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  specialtyCode?: string

  /** 仅在选定单专项时有效；空 = 该专项下全部二级 */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryCode?: string

  @IsIn([...ADVANCED_DIFFICULTY_MODES])
  difficultyMode!: AdvancedDifficultyMode

  @IsOptional()
  @IsIn([...ADVANCED_ITEM_SCOPES])
  itemScope?: AdvancedItemScope

  @IsOptional()
  @IsIn([...TRAIN_POOLS])
  poolMode?: 'formal' | 'test'
}

export class CreateAdvancedTrainSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  specialtyCode?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryCode?: string

  @IsIn([...ADVANCED_DIFFICULTY_MODES])
  difficultyMode!: AdvancedDifficultyMode

  @IsOptional()
  @IsIn([...ADVANCED_ITEM_SCOPES])
  itemScope?: AdvancedItemScope

  @Type(() => Number)
  @IsInt()
  @IsIn([...TRAIN_COUNTS])
  count!: number

  @IsIn([...TRAIN_MODES])
  mode!: 'sequential' | 'random'

  @IsOptional()
  @IsIn([...TRAIN_POOLS])
  poolMode?: 'formal' | 'test'
}
