import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { HsMathGradeResult, HsMathQtype } from '../hs-math.constants'
import type {
  HsMathAnswerPayload,
  HsMathOptionsJson,
  HsMathUserAnswerPayload,
} from '../types/answer-protocol'

@Entity('hs_math_train_session_items')
export class HsMathTrainSessionItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'session_id', type: 'bigint', unsigned: true })
  sessionId!: string

  @Column({ name: 'sort_order', type: 'int', unsigned: true })
  sortOrder!: number

  @Column({ name: 'item_id', type: 'bigint', unsigned: true, nullable: true })
  itemId!: string | null

  @Column({ name: 'item_code', type: 'varchar', length: 64, default: '' })
  itemCode!: string

  @Column({ type: 'varchar', length: 16 })
  qtype!: HsMathQtype

  @Column({ type: 'text' })
  stem!: string

  @Column({ name: 'options_json', type: 'json', nullable: true })
  optionsJson!: HsMathOptionsJson | null

  @Column({ name: 'answer_payload_json', type: 'json' })
  answerPayloadJson!: HsMathAnswerPayload

  @Column({ type: 'text', nullable: true })
  analysis!: string | null

  @Column({
    name: 'knowledge_point_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  knowledgePointId!: string | null

  /** P1-0A：KP code 快照；旧会话可为 null；写入逻辑留 P1-0C */
  @Column({
    name: 'knowledge_point_codes_json',
    type: 'json',
    nullable: true,
  })
  knowledgePointCodesJson!: string[] | null

  @Column({
    name: 'primary_knowledge_point_code',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  primaryKnowledgePointCode!: string | null

  @Column({
    name: 'specialty_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  specialtyId!: string | null

  @Column({
    name: 'category_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  categoryId!: string | null

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  difficulty!: number | null

  @Column({ name: 'content_version', type: 'int', default: 1 })
  contentVersion!: number

  @Column({
    name: 'grade_rule_version',
    type: 'varchar',
    length: 16,
    default: 'v1',
  })
  gradeRuleVersion!: string

  @Column({ name: 'user_answer_payload_json', type: 'json', nullable: true })
  userAnswerPayloadJson!: HsMathUserAnswerPayload | null

  @Column({ name: 'grade_result', type: 'varchar', length: 32, nullable: true })
  gradeResult!: HsMathGradeResult | null

  @Column({ name: 'grade_reason', type: 'varchar', length: 255, nullable: true })
  gradeReason!: string | null

  /** APPLICATION-3A：校验通过后的 AI 批改结构化结果 */
  @Column({ name: 'ai_grade_json', type: 'json', nullable: true })
  aiGradeJson!: Record<string, unknown> | null

  @Column({ name: 'ai_model', type: 'varchar', length: 64, nullable: true })
  aiModel!: string | null

  @Column({
    name: 'ai_graded_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  aiGradedAt!: Date | null

  @Column({
    name: 'ai_attempt_count',
    type: 'int',
    unsigned: true,
    default: 0,
  })
  aiAttemptCount!: number

  @Column({
    name: 'answered_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  answeredAt!: Date | null
}
