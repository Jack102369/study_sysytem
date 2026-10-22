import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import type { TrainGradeResult, TrainQtype } from '../train.constants'

@Entity('chem_train_session_items')
export class ChemTrainSessionItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'session_id', type: 'bigint', unsigned: true })
  sessionId!: string

  @Column({ name: 'sort_order', type: 'int', unsigned: true })
  sortOrder!: number

  @Column({ name: 'item_id', type: 'bigint', unsigned: true, nullable: true })
  itemId!: string | null

  @Column({ name: 'item_code', type: 'varchar', length: 64, default: '' })
  itemCode!: string

  @Column({ type: 'varchar', length: 16 })
  qtype!: TrainQtype

  @Column({ name: 'answer_type', type: 'varchar', length: 32, default: 'text' })
  answerType!: string

  @Column({ type: 'text' })
  stem!: string

  @Column({ name: 'options_json', type: 'json', nullable: true })
  optionsJson!: unknown | null

  @Column({ type: 'text' })
  answer!: string

  @Column({ name: 'answer_aliases_json', type: 'json', nullable: true })
  answerAliasesJson!: unknown | null

  @Column({ type: 'text', nullable: true })
  analysis!: string | null

  @Column({ name: 'user_answer', type: 'text', nullable: true })
  userAnswer!: string | null

  @Column({ name: 'grade_result', type: 'varchar', length: 32, nullable: true })
  gradeResult!: TrainGradeResult | null

  @Column({ name: 'grade_reason', type: 'varchar', length: 255, nullable: true })
  gradeReason!: string | null

  @Column({ name: 'answered_at', type: 'datetime', precision: 3, nullable: true })
  answeredAt!: Date | null
}
