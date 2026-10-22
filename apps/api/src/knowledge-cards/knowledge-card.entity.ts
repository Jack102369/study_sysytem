import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export const KNOWLEDGE_KINDS = ['formula', 'axiom', 'theorem', 'method'] as const
export type KnowledgeKind = (typeof KNOWLEDGE_KINDS)[number]

export const KNOWLEDGE_CARD_STATUSES = ['draft', 'active'] as const
export type KnowledgeCardStatus = (typeof KNOWLEDGE_CARD_STATUSES)[number]

@Entity('knowledge_cards')
export class KnowledgeCard {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'subject_id', type: 'bigint', unsigned: true })
  subjectId!: string

  @Column({ type: 'enum', enum: KNOWLEDGE_KINDS, default: 'method' })
  kind!: KnowledgeKind

  @Column({ type: 'varchar', length: 128 })
  title!: string

  @Column({ type: 'text' })
  content!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  tip!: string | null

  @Column({
    type: 'enum',
    enum: KNOWLEDGE_CARD_STATUSES,
    default: 'active',
  })
  status!: KnowledgeCardStatus

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}

@Entity('error_question_knowledge_cards')
export class ErrorQuestionKnowledgeCard {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'error_question_id', type: 'bigint', unsigned: true })
  errorQuestionId!: string

  @Column({ name: 'knowledge_card_id', type: 'bigint', unsigned: true })
  knowledgeCardId!: string

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
