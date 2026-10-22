import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('user_points')
export class UserPoints {
  @PrimaryColumn({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'total_points', type: 'int', unsigned: true, default: 0 })
  totalPoints!: number

  @Column({ name: 'week_points', type: 'int', unsigned: true, default: 0 })
  weekPoints!: number

  @Column({ name: 'week_start', type: 'date' })
  weekStart!: string

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}

@Entity('point_ledger')
export class PointLedger {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ type: 'varchar', length: 64 })
  reason!: string

  @Column({ type: 'int' })
  points!: number

  @Column({ name: 'ref_type', type: 'varchar', length: 32, nullable: true })
  refType!: string | null

  @Column({ name: 'ref_id', type: 'varchar', length: 64, nullable: true })
  refId!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  note!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}

@Entity('reward_tiers')
export class RewardTier {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'points_needed', type: 'int', unsigned: true })
  pointsNeeded!: number

  @Column({ type: 'varchar', length: 64 })
  title!: string

  @Column({ name: 'reward_note', type: 'varchar', length: 255, nullable: true })
  rewardNote!: string | null

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}

@Entity('user_reward_unlocks')
export class UserRewardUnlock {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'tier_id', type: 'bigint', unsigned: true })
  tierId!: string

  @CreateDateColumn({ name: 'unlocked_at', type: 'datetime', precision: 3 })
  unlockedAt!: Date
}
