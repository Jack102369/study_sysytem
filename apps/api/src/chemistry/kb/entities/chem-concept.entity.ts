import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ChemKbStatus } from '../kb.constants'

@Entity('chem_concepts')
export class ChemConcept {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 128 })
  name!: string

  @Column({ type: 'text', nullable: true })
  definition!: string | null

  @Column({ type: 'text', nullable: true })
  principle!: string | null

  @Column({ name: 'applicable_conditions', type: 'text', nullable: true })
  applicableConditions!: string | null

  @Column({ name: 'judge_methods', type: 'text', nullable: true })
  judgeMethods!: string | null

  @Column({ type: 'text', nullable: true })
  examples!: string | null

  @Column({ name: 'common_mistakes', type: 'text', nullable: true })
  commonMistakes!: string | null

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status!: ChemKbStatus

  @Column({ name: 'review_note', type: 'varchar', length: 255, default: '' })
  reviewNote!: string

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
