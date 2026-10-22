import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { WritingReviewJson } from '../ai-reference/deepseek-client.service'

export const WRITING_SUBJECT_TRACKS = ['chinese', 'english'] as const
export type WritingSubjectTrack = (typeof WRITING_SUBJECT_TRACKS)[number]

export const WRITING_TOPIC_SOURCES = ['manual', 'ai'] as const
export type WritingTopicSource = (typeof WRITING_TOPIC_SOURCES)[number]

export const WRITING_REVIEW_MODES = ['structure', 'gaokao'] as const
export type WritingReviewMode = (typeof WRITING_REVIEW_MODES)[number]

@Entity('writing_coach_sessions')
export class WritingCoachSession {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'subject_track', type: 'enum', enum: WRITING_SUBJECT_TRACKS })
  subjectTrack!: WritingSubjectTrack

  @Column({
    name: 'topic_source',
    type: 'enum',
    enum: WRITING_TOPIC_SOURCES,
    default: 'manual',
  })
  topicSource!: WritingTopicSource

  @Column({
    name: 'review_mode',
    type: 'enum',
    enum: WRITING_REVIEW_MODES,
    default: 'structure',
  })
  reviewMode!: WritingReviewMode

  @Column({ name: 'topic_text', type: 'mediumtext' })
  topicText!: string

  @Column({ name: 'topic_requirements', type: 'mediumtext', nullable: true })
  topicRequirements!: string | null

  @Column({ name: 'outline_text', type: 'mediumtext', nullable: true })
  outlineText!: string | null

  @Column({ name: 'opening_text', type: 'mediumtext', nullable: true })
  openingText!: string | null

  @Column({ name: 'final_draft_text', type: 'mediumtext', nullable: true })
  finalDraftText!: string | null

  @Column({ name: 'review_json', type: 'json', nullable: true })
  reviewJson!: WritingReviewJson | null

  @Column({ name: 'review_model', type: 'varchar', length: 64, nullable: true })
  reviewModel!: string | null

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 3, nullable: true })
  reviewedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
