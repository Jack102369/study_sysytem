import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional } from 'class-validator'

export class ChemAnalyticsQueryDto {
  /** 趋势/专项/难度/高频错误窗口：7 或 30；默认 30。日历固定 30 天。 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([7, 30])
  days?: 7 | 30
}
