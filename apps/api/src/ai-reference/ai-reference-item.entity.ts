import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export const AI_REFERENCE_STATUSES = ['UNVERIFIED', 'VERIFIED'] as const
export type AiReferenceStatus = (typeof AI_REFERENCE_STATUSES)[number]

@Entity('ai_reference_items')
export class AiReferenceItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'source_error_question_id', type: 'bigint', unsigned: true, nullable: true })
  sourceErrorQuestionId!: string | null

  @Column({ name: 'stem_text', type: 'mediumtext' })
  stemText!: string

  @Column({ name: 'answer_text', type: 'mediumtext', nullable: true })
  answerText!: string | null

  @Column({ name: 'analysis_text', type: 'mediumtext', nullable: true })
  analysisText!: string | null

  @Column({ type: 'enum', enum: AI_REFERENCE_STATUSES, default: 'UNVERIFIED' })
  status!: AiReferenceStatus

  @Column({ type: 'varchar', length: 64, nullable: true })
  model!: string | null

  @Column({ name: 'verify_count', type: 'int', unsigned: true, default: 0 })
  verifyCount!: number

  @Column({ name: 'verified_at', type: 'datetime', precision: 3, nullable: true })
  verifiedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
