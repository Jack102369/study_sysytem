import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { LEARN_STATUSES, type LearnStatus } from '../common/constants/biz'

@Entity('extension_materials')
export class ExtensionMaterial {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'subject_id', type: 'bigint', unsigned: true })
  subjectId!: string

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  title!: string | null

  @Column({ name: 'content_text', type: 'mediumtext', nullable: true })
  contentText!: string | null

  @Column({ name: 'answer_text', type: 'mediumtext', nullable: true })
  answerText!: string | null

  @Column({ name: 'question_attachment_id', type: 'bigint', unsigned: true, nullable: true })
  questionAttachmentId!: string | null

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName!: string | null

  @Column({
    name: 'learn_status',
    type: 'enum',
    enum: LEARN_STATUSES,
    default: 'NOT_STARTED',
  })
  learnStatus!: LearnStatus

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
