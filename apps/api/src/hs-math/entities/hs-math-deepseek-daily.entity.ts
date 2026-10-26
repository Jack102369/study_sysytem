import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * APPLICATION-4C-4B：高一数学 DeepSeek 应用题日额度。
 * 表：hs_math_deepseek_daily；严禁 synchronize。
 */
@Entity('hs_math_deepseek_daily')
export class HsMathDeepseekDaily {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  /** 与 users.id / 其它 hs_math_* 一致：BIGINT UNSIGNED → string */
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  /** Asia/Shanghai 日历日 YYYY-MM-DD */
  @Column({ name: 'quota_date', type: 'date' })
  quotaDate!: string

  @Column({ name: 'used_count', type: 'int', unsigned: true, default: 0 })
  usedCount!: number

  @Column({ name: 'daily_limit', type: 'int', unsigned: true, default: 20 })
  dailyLimit!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
