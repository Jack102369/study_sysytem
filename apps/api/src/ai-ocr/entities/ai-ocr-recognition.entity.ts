import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import {
  AI_OCR_RECOGNITION_STATUSES,
  AI_OCR_SUBJECTS,
  type AiOcrRecognitionStatus,
  type AiOcrSubject,
} from '../ai-ocr.constants'

@Entity('ai_ocr_recognitions')
export class AiOcrRecognition {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ type: 'enum', enum: AI_OCR_SUBJECTS })
  subject!: AiOcrSubject

  @Column({ name: 'attachment_id', type: 'bigint', unsigned: true })
  attachmentId!: string

  @Column({
    type: 'enum',
    enum: AI_OCR_RECOGNITION_STATUSES,
    default: 'pending',
  })
  status!: AiOcrRecognitionStatus

  @Column({ name: 'recognized_text_raw', type: 'mediumtext', nullable: true })
  recognizedTextRaw!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  engine!: string | null

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
