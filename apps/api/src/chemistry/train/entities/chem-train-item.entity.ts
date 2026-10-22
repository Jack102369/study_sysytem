import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { TrainItemStatus, TrainPool, TrainQtype } from '../train.constants'

@Entity('chem_train_items')
export class ChemTrainItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 64 })
  code!: string

  @Column({ type: 'varchar', length: 16 })
  pool!: TrainPool

  @Column({ type: 'varchar', length: 16 })
  qtype!: TrainQtype

  /** text | chem_formula | equation | ionic | numeric */
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

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  difficulty!: number

  @Column({ name: 'specialty_id', type: 'bigint', unsigned: true })
  specialtyId!: string

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status!: TrainItemStatus

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean

  @Column({ name: 'curriculum_ok', type: 'tinyint', width: 1, default: 0 })
  curriculumOk!: boolean

  @Column({ name: 'verify_blocked', type: 'tinyint', width: 1, default: 0 })
  verifyBlocked!: boolean

  @Column({ name: 'ban_default_train', type: 'tinyint', width: 1, default: 0 })
  banDefaultTrain!: boolean

  @Column({ name: 'gate_note', type: 'varchar', length: 255, default: '' })
  gateNote!: string

  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy!: string | null

  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true })
  updatedBy!: string | null

  @Column({ name: 'reviewed_by', type: 'bigint', unsigned: true, nullable: true })
  reviewedBy!: string | null

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 3, nullable: true })
  reviewedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
