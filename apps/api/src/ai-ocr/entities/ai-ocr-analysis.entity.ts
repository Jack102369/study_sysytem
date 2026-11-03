import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import {
  AI_OCR_ANALYSIS_STATUSES,
  AI_OCR_COMPARE_VERDICTS,
  AI_OCR_PROVIDERS,
  type AiOcrAnalysisStatus,
  type AiOcrCompareVerdict,
  type AiOcrProvider,
} from '../ai-ocr.constants'

@Entity('ai_ocr_analyses')
export class AiOcrAnalysis {
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
    enum: AI_OCR_ANALYSIS_STATUSES,
    default: 'pending',
  })
  status!: AiOcrAnalysisStatus

  @Column({ name: 'input_text_snapshot', type: 'mediumtext', nullable: true })
  inputTextSnapshot!: string | null

  @Column({ name: 'ai_answer_text', type: 'mediumtext', nullable: true })
  aiAnswerText!: string | null

  @Column({ name: 'ai_analysis_text', type: 'mediumtext', nullable: true })
  aiAnalysisText!: string | null

  @Column({ name: 'knowledge_points_text', type: 'mediumtext', nullable: true })
  knowledgePointsText!: string | null

  @Column({ name: 'method_summary_text', type: 'mediumtext', nullable: true })
  methodSummaryText!: string | null

  @Column({ name: 'self_check_text', type: 'mediumtext', nullable: true })
  selfCheckText!: string | null

  @Column({
    name: 'compared_analysis_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  comparedAnalysisId!: string | null

  @Column({
    name: 'compare_verdict',
    type: 'enum',
    enum: AI_OCR_COMPARE_VERDICTS,
    nullable: true,
  })
  compareVerdict!: AiOcrCompareVerdict | null

  @Column({ name: 'compare_note', type: 'mediumtext', nullable: true })
  compareNote!: string | null

  @Column({
    name: 'revised_by_compare',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  revisedByCompare!: number

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
