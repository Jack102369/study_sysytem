import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { TrainMode, TrainPool, TrainSessionStatus } from '../train.constants'

export type ChemTrainSessionKind =
  | 'specialty'
  | 'daily'
  | 'advanced'
  | 'wrong_review'
  | 'wrong_variation'

@Entity('chem_train_sessions')
export class ChemTrainSession {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'session_kind', type: 'varchar', length: 16, default: 'specialty' })
  sessionKind!: ChemTrainSessionKind

  /** Asia/Shanghai 日历日 YYYY-MM-DD；仅 daily 使用 */
  @Column({ name: 'daily_date', type: 'date', nullable: true })
  dailyDate!: string | null

  @Column({ name: 'specialty_id', type: 'bigint', unsigned: true, nullable: true })
  specialtyId!: string | null

  @Column({ name: 'category_id', type: 'bigint', unsigned: true, nullable: true })
  categoryId!: string | null

  @Column({ name: 'pool_mode', type: 'varchar', length: 16 })
  poolMode!: TrainPool

  @Column({ type: 'tinyint', unsigned: true })
  difficulty!: number

  @Column({ name: 'planned_count', type: 'int', unsigned: true })
  plannedCount!: number

  @Column({ name: 'actual_count', type: 'int', unsigned: true })
  actualCount!: number

  @Column({ type: 'varchar', length: 16 })
  mode!: TrainMode

  @Column({ type: 'varchar', length: 16, default: 'in_progress' })
  status!: TrainSessionStatus

  @Column({ name: 'answered_count', type: 'int', unsigned: true, default: 0 })
  answeredCount!: number

  @Column({ name: 'correct_count', type: 'int', unsigned: true, default: 0 })
  correctCount!: number

  @Column({ name: 'wrong_count', type: 'int', unsigned: true, default: 0 })
  wrongCount!: number

  @Column({ name: 'pending_count', type: 'int', unsigned: true, default: 0 })
  pendingCount!: number

  /** 开始到提交的经过时间（非专注时长） */
  @Column({ name: 'duration_ms', type: 'int', unsigned: true, default: 0 })
  durationMs!: number

  @Column({ name: 'started_at', type: 'datetime', precision: 3 })
  startedAt!: Date

  @Column({ name: 'submitted_at', type: 'datetime', precision: 3, nullable: true })
  submittedAt!: Date | null

  @Column({ name: 'counts_formal_stats', type: 'tinyint', width: 1, default: 1 })
  countsFormalStats!: boolean

  /** 变式训练来源错题主表 id；仅 wrong_variation 使用 */
  @Column({ name: 'source_wrong_item_id', type: 'bigint', unsigned: true, nullable: true })
  sourceWrongItemId!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
