import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ERROR_STATUSES, type ErrorStatus } from '../common/constants/biz'
import { Tag } from '../tags/tag.entity'
import { ErrorAttempt } from './error-attempt.entity'
import { Extension } from './extension.entity'

@Entity('error_questions')
export class ErrorQuestion {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'subject_id', type: 'bigint', unsigned: true })
  subjectId!: string

  @Column({ name: 'category_id', type: 'bigint', unsigned: true, nullable: true })
  categoryId!: string | null

  @Column({ name: 'occurred_at', type: 'date' })
  occurredAt!: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  title!: string | null

  @Column({ name: 'stem_text', type: 'mediumtext', nullable: true })
  stemText!: string | null

  @Column({ name: 'analysis_text', type: 'mediumtext', nullable: true })
  analysisText!: string | null

  @Column({ name: 'key_points', type: 'text', nullable: true })
  keyPoints!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  source!: string | null

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  difficulty!: number | null

  @Column({ type: 'enum', enum: ERROR_STATUSES, default: 'NEW' })
  status!: ErrorStatus

  @Column({ name: 'next_review_at', type: 'datetime', precision: 3, nullable: true })
  nextReviewAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'error_question_tags',
    joinColumn: { name: 'error_question_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[]

  @OneToMany(() => Extension, (ext) => ext.errorQuestion)
  extensions!: Extension[]

  @OneToMany(() => ErrorAttempt, (attempt) => attempt.errorQuestion)
  attempts!: ErrorAttempt[]
}
