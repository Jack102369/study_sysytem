import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ChemKbStatus } from '../kb.constants'

@Entity('chem_experiments')
export class ChemExperiment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 128 })
  name!: string

  @Column({ type: 'varchar', length: 32, default: 'other' })
  category!: string

  @Column({ type: 'text', nullable: true })
  purpose!: string | null

  @Column({ type: 'text', nullable: true })
  principle!: string | null

  @Column({ type: 'text', nullable: true })
  instruments!: string | null

  @Column({ type: 'text', nullable: true })
  reagents!: string | null

  @Column({ type: 'text', nullable: true })
  steps!: string | null

  @Column({ type: 'text', nullable: true })
  phenomenon!: string | null

  @Column({ type: 'text', nullable: true })
  conclusion!: string | null

  @Column({ type: 'text', nullable: true })
  precautions!: string | null

  @Column({ name: 'safety_notes', type: 'text', nullable: true })
  safetyNotes!: string | null

  @Column({ name: 'is_hazardous', type: 'tinyint', width: 1, default: 0 })
  isHazardous!: boolean

  @Column({
    name: 'home_forbidden_note',
    type: 'varchar',
    length: 255,
    default: '危险实验请在实验室由教师指导下完成，禁止在家自行操作。',
  })
  homeForbiddenNote!: string

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

@Entity('chem_experiment_images')
export class ChemExperimentImage {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'experiment_id', type: 'bigint', unsigned: true })
  experimentId!: string

  @Column({ name: 'attachment_id', type: 'bigint', unsigned: true })
  attachmentId!: string

  @Column({ type: 'varchar', length: 255, default: '' })
  caption!: string

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number
}
