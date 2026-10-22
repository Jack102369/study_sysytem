import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { TRAIN_COUNTS, TRAIN_DIFFICULTIES, TRAIN_MODES, TRAIN_POOLS } from '../train.constants'

export class TrainAvailabilityQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  specialtyCode!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  categoryCode!: string

  @Type(() => Number)
  @IsInt()
  @IsIn([...TRAIN_DIFFICULTIES])
  difficulty!: number

  @IsOptional()
  @IsIn([...TRAIN_POOLS])
  poolMode?: 'formal' | 'test'
}

export class CreateTrainSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  specialtyCode!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  categoryCode!: string

  @Type(() => Number)
  @IsInt()
  @IsIn([...TRAIN_DIFFICULTIES])
  difficulty!: number

  @Type(() => Number)
  @IsInt()
  @IsIn([...TRAIN_COUNTS])
  count!: number

  @IsIn([...TRAIN_MODES])
  mode!: 'sequential' | 'random'

  /** 仅服务端在用户具备测试权限时允许 test；普通用户传 test 会被拒绝 */
  @IsOptional()
  @IsIn([...TRAIN_POOLS])
  poolMode?: 'formal' | 'test'
}

export class SaveTrainAnswerDto {
  @Type(() => Number)
  @IsInt()
  sortOrder!: number

  @IsString()
  @MaxLength(2000)
  answer!: string
}

export class ListTrainSessionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number

  /** 默认仅 formal；test 需授权且显式请求 */
  @IsOptional()
  @IsIn(['formal', 'test', 'all'])
  poolFilter?: 'formal' | 'test' | 'all'

  /** 默认 specialty；advanced/daily/wrong_review/wrong_variation/all 需显式请求 */
  @IsOptional()
  @IsIn(['specialty', 'advanced', 'daily', 'wrong_review', 'wrong_variation', 'all'])
  kindFilter?:
    | 'specialty'
    | 'advanced'
    | 'daily'
    | 'wrong_review'
    | 'wrong_variation'
    | 'all'
}
