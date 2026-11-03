import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import {
  AI_OCR_GRADING_STATUSES,
  AI_OCR_PROVIDERS,
  AI_OCR_VERDICTS,
  type AiOcrGradingStatus,
  type AiOcrProvider,
  type AiOcrVerdict,
} from '../ai-ocr.constants'

@Entity('ai_ocr_gradings')
export class AiOcrGrading {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'recognition_id', type: 'bigint', unsigned: true })
  recognitionId!: string

  @Column({ type: 'enum', enum: AI_OCR_PROVIDERS })
  provider!: AiOcrProvider

  @Column({
    type: 'enum',
    enum: AI_OCR_GRADING_STATUSES,
    default: 'pending',
  })
  status!: AiOcrGradingStatus

  @Column({
    name: 'answer_attachment_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  answerAttachmentId!: string | null

  @Column({ name: 'student_answer_raw', type: 'mediumtext', nullable: true })
  studentAnswerRaw!: string | null

  @Column({
    name: 'student_answer_snapshot',
    type: 'mediumtext',
    nullable: true,
  })
  studentAnswerSnapshot!: string | null

  @Column({ name: 'question_text_snapshot', type: 'mediumtext' })
  questionTextSnapshot!: string

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  score!: number | null

  @Column({ type: 'enum', enum: AI_OCR_VERDICTS, nullable: true })
  verdict!: AiOcrVerdict | null

  @Column({ name: 'feedback_text', type: 'mediumtext', nullable: true })
  feedbackText!: string | null

  @Column({ name: 'correct_answer_text', type: 'mediumtext', nullable: true })
  correctAnswerText!: string | null

  @Column({ name: 'correct_analysis_text', type: 'mediumtext', nullable: true })
  correctAnalysisText!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  model!: string | null

  @Column({ name: 'prompt_version', type: 'varchar', length: 32, nullable: true })
  promptVersion!: string | null

  @Column({ name: 'error_code', type: 'varchar', length: 64, nullable: true })
  errorCode!: string | null

  @Column({ name: 'error_message', type: 'varchar', length: 255, nullable: true })
  errorMessage!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
