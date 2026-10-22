import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('chem_wrong_items')
export class ChemWrongItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'item_id', type: 'bigint', unsigned: true })
  itemId!: string

  /** open | consolidating | mastered */
  @Column({ type: 'varchar', length: 16, default: 'open' })
  status!: string

  @Column({ name: 'first_wrong_at', type: 'datetime', precision: 3 })
  firstWrongAt!: Date

  @Column({ name: 'last_wrong_at', type: 'datetime', precision: 3 })
  lastWrongAt!: Date

  @Column({ name: 'wrong_count', type: 'int', unsigned: true, default: 0 })
  wrongCount!: number

  @Column({ name: 'correct_after_wrong_count', type: 'int', unsigned: true, default: 0 })
  correctAfterWrongCount!: number

  @Column({ name: 'last_correct_at', type: 'datetime', precision: 3, nullable: true })
  lastCorrectAt!: Date | null

  @Column({
    name: 'first_correct_after_wrong_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  firstCorrectAfterWrongAt!: Date | null

  @Column({ name: 'last_grade_result', type: 'varchar', length: 32, nullable: true })
  lastGradeResult!: string | null

  @Column({ name: 'last_practiced_at', type: 'datetime', precision: 3, nullable: true })
  lastPracticedAt!: Date | null

  @Column({ name: 'last_session_kind', type: 'varchar', length: 16, nullable: true })
  lastSessionKind!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
