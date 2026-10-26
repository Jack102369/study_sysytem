import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator'
import {
  HS_MATH_COUNTS,
  HS_MATH_DIFFICULTIES,
  HS_MATH_MODES,
  HS_MATH_POOLS,
  HS_MATH_QTYPES,
} from '../hs-math.constants'

export class CreateHsMathTrainSessionDto {
  @IsString()
  @MinLength(1)
  specialtyId!: string

  @IsString()
  @MinLength(1)
  categoryId!: string

  @Type(() => Number)
  @IsInt()
  @IsIn([...HS_MATH_DIFFICULTIES])
  difficulty!: number

  @Type(() => Number)
  @IsInt()
  @IsIn([...HS_MATH_COUNTS])
  count!: number

  @IsIn([...HS_MATH_MODES])
  mode!: (typeof HS_MATH_MODES)[number]

  /** P0 默认 formal；test 需后续 grants，当前拒绝非 formal */
  @IsOptional()
  @IsIn([...HS_MATH_POOLS])
  poolMode?: (typeof HS_MATH_POOLS)[number]

  /**
   * 题型筛选（可选）。未传 / 空 = 全部五种题型（兼容旧客户端）。
   * 非法值由 class-validator → 400。
   */
  @IsOptional()
  @IsIn([...HS_MATH_QTYPES])
  questionType?: (typeof HS_MATH_QTYPES)[number]
}

export class SaveHsMathTrainAnswerDto {
  @Type(() => Number)
  @IsInt()
  sortOrder!: number

  /**
   * null / undefined = 清空作答。
   * 对象 = 覆盖为该用户答案 payload（须与题型 kind 一致）。
   */
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsObject()
  userAnswerPayload!: Record<string, unknown> | null
}
