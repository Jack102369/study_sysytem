import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type {
  HsMathMode,
  HsMathPool,
  HsMathSessionKind,
  HsMathSessionStatus,
} from '../hs-math.constants'

@Entity('hs_math_train_sessions')
export class HsMathTrainSession {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({
    name: 'session_kind',
    type: 'varchar',
    length: 16,
    default: 'specialty',
  })
  sessionKind!: HsMathSessionKind

  /** Asia/Shanghai 日历日；P0 预留，P1 daily 使用 */
  @Column({ name: 'daily_date', type: 'date', nullable: true })
  dailyDate!: string | null

  @Column({ name: 'specialty_id', type: 'bigint', unsigned: true })
  specialtyId!: string

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string

  @Column({ name: 'pool_mode', type: 'varchar', length: 16 })
  poolMode!: HsMathPool

  @Column({ type: 'tinyint', unsigned: true })
  difficulty!: number

  @Column({ name: 'planned_count', type: 'int', unsigned: true })
  plannedCount!: number

  @Column({ name: 'actual_count', type: 'int', unsigned: true })
  actualCount!: number

  @Column({ type: 'varchar', length: 16 })
  mode!: HsMathMode

  @Column({ type: 'varchar', length: 16, default: 'in_progress' })
  status!: HsMathSessionStatus

  @Column({ name: 'answered_count', type: 'int', unsigned: true, default: 0 })
  answeredCount!: number

  @Column({ name: 'correct_count', type: 'int', unsigned: true, default: 0 })
  correctCount!: number

  @Column({ name: 'wrong_count', type: 'int', unsigned: true, default: 0 })
  wrongCount!: number

  @Column({ name: 'pending_count', type: 'int', unsigned: true, default: 0 })
  pendingCount!: number

  @Column({ name: 'duration_ms', type: 'int', unsigned: true, default: 0 })
  durationMs!: number

  @Column({ name: 'started_at', type: 'datetime', precision: 3 })
  startedAt!: Date

  @Column({
    name: 'submitted_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  submittedAt!: Date | null

  @Column({
    name: 'counts_formal_stats',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  countsFormalStats!: boolean

  @Column({
    name: 'grade_rule_version',
    type: 'varchar',
    length: 16,
    default: 'v1',
  })
  gradeRuleVersion!: string

  /** P1 错题变式预留；无 FK */
  @Column({
    name: 'source_wrong_item_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  sourceWrongItemId!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
