import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { HsMathReviewStatus } from '../hs-math.constants'
import { HsMathTrainItem } from './hs-math-train-item.entity'

/**
 * 人工审核历史（P1-0F-C3B）。
 * review_status=passed ≠ items.status=approved。
 */
@Entity('hs_math_train_item_reviews')
export class HsMathTrainItemReview {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'item_id', type: 'bigint', unsigned: true })
  itemId!: string

  @ManyToOne(() => HsMathTrainItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item!: HsMathTrainItem

  @Column({ name: 'content_version', type: 'int' })
  contentVersion!: number

  @Column({ name: 'content_fingerprint', type: 'char', length: 64 })
  contentFingerprint!: string

  @Column({ name: 'reviewer_user_id', type: 'bigint', unsigned: true })
  reviewerUserId!: string

  @Column({ name: 'review_status', type: 'varchar', length: 32 })
  reviewStatus!: HsMathReviewStatus

  @Column({ name: 'review_comment', type: 'text' })
  reviewComment!: string

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 3 })
  reviewedAt!: Date

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
