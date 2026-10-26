import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { HS_MATH_REVIEW_STATUSES } from '../hs-math.constants'

/** 提交人工审核（审核人/时间仅服务端写入；版本/指纹乐观锁必填） */
export class CreateHsMathTrainItemReviewDto {
  @IsIn([...HS_MATH_REVIEW_STATUSES])
  decision!: (typeof HS_MATH_REVIEW_STATUSES)[number]

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment!: string

  /** 打开面板时的 content_version；不匹配 → 409 */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedContentVersion!: number

  /** 打开面板时服务端下发的指纹；不匹配 → 409 */
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  @Matches(/^[a-f0-9]{64}$/i)
  expectedContentFingerprint!: string

  /** 若客户端误传，服务层拒绝 */
  @IsOptional()
  reviewerId?: unknown

  @IsOptional()
  reviewedAt?: unknown
}
