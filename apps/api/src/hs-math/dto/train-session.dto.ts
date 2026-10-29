import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
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

  /**
   * 小节（分类）。未传 / null / '' = 整章抽题（仅按专项+难度筛选）。
   * 传入时必须属于 specialtyId。
   */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsString()
  @MinLength(1)
  categoryId?: string | null

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

  /**
   * 仅抽真 H3：code LIKE 'CAND-H3%'（与「压轴=全部 difficulty=3」区分）。
   * 通常配合 difficulty=3；未传 / false = 不按 code 前缀收窄。
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false
    }
    return value
  })
  @IsBoolean()
  trueH3Only?: boolean
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
