import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ATTEMPT_RESULTS, type AttemptResult } from '../common/constants/biz'
import { ErrorQuestion } from './error-question.entity'

@Entity('error_attempts')
export class ErrorAttempt {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'error_question_id', type: 'bigint', unsigned: true })
  errorQuestionId!: string

  @Column({
    name: 'attempted_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  attemptedAt!: Date

  @Column({ type: 'enum', enum: ATTEMPT_RESULTS })
  result!: AttemptResult

  @Column({ name: 'time_spent_seconds', type: 'int', unsigned: true, nullable: true })
  timeSpentSeconds!: number | null

  @Column({ type: 'text', nullable: true })
  note!: string | null

  @Column({ name: 'answer_attachment_id', type: 'bigint', unsigned: true, nullable: true })
  answerAttachmentId!: string | null

  @ManyToOne(() => ErrorQuestion, (eq) => eq.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'error_question_id' })
  errorQuestion!: ErrorQuestion
}
