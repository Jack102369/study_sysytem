import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ErrorQuestion } from './error-question.entity'

@Entity('extensions')
export class Extension {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'error_question_id', type: 'bigint', unsigned: true })
  errorQuestionId!: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  title!: string | null

  @Column({ name: 'content_text', type: 'mediumtext', nullable: true })
  contentText!: string | null

  @Column({ name: 'answer_text', type: 'mediumtext', nullable: true })
  answerText!: string | null

  @Column({ name: 'question_attachment_id', type: 'bigint', unsigned: true, nullable: true })
  questionAttachmentId!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @ManyToOne(() => ErrorQuestion, (eq) => eq.extensions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'error_question_id' })
  errorQuestion!: ErrorQuestion
}
