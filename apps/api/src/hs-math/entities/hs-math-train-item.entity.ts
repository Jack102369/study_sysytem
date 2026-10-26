import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type {
  HsMathItemStatus,
  HsMathPool,
  HsMathQtype,
  HsMathSourceLicenseStatus,
  HsMathSourceType,
  HsMathSourceVerificationStatus,
} from '../hs-math.constants'
import type {
  HsMathAnswerPayload,
  HsMathOptionsJson,
} from '../types/answer-protocol'

@Entity('hs_math_train_items')
export class HsMathTrainItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 64 })
  code!: string

  @Column({ type: 'varchar', length: 16, default: 'formal' })
  pool!: HsMathPool

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

  /** CORE-1A：来源（迁移前 Entity 已声明；运行需 MIGRATION_PENDING） */
  @Column({
    name: 'source_type',
    type: 'varchar',
    length: 16,
    default: 'original',
  })
  sourceType!: HsMathSourceType

  @Column({
    name: 'source_year',
    type: 'smallint',
    unsigned: true,
    nullable: true,
  })
  sourceYear!: number | null

  @Column({
    name: 'source_exam_name',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  sourceExamName!: string | null

  @Column({
    name: 'source_question_no',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  sourceQuestionNo!: string | null

  @Column({
    name: 'source_reference',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  sourceReference!: string | null

  @Column({
    name: 'source_adaptation_note',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  sourceAdaptationNote!: string | null

  @Column({
    name: 'source_verification_status',
    type: 'varchar',
    length: 16,
    default: 'unverified',
  })
  sourceVerificationStatus!: HsMathSourceVerificationStatus

  @Column({
    name: 'source_license_status',
    type: 'varchar',
    length: 16,
    default: 'unknown',
  })
  sourceLicenseStatus!: HsMathSourceLicenseStatus

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  difficulty!: number

  @Column({ name: 'specialty_id', type: 'bigint', unsigned: true })
  specialtyId!: string

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string

  @Column({
    name: 'knowledge_point_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  knowledgePointId!: string | null

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status!: HsMathItemStatus

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean

  @Column({
    name: 'grade_rule_version',
    type: 'varchar',
    length: 16,
    default: 'v1',
  })
  gradeRuleVersion!: string

  @Column({ name: 'content_version', type: 'int', default: 1 })
  contentVersion!: number

  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy!: string | null

  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true })
  updatedBy!: string | null

  @Column({
    name: 'reviewed_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  reviewedBy!: string | null

  @Column({
    name: 'reviewed_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  reviewedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
