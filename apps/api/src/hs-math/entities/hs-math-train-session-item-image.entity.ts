import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { HsMathSessionImageStatus } from '../hs-math.constants'

/**
 * 应用题手写解答图片元数据（APPLICATION-2A）。
 * 二进制在私有盘 storage_key；禁止公开 /uploads 直链。
 */
@Entity('hs_math_train_session_item_images')
export class HsMathTrainSessionItemImage {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'session_item_id', type: 'bigint', unsigned: true })
  sessionItemId!: string

  /** 冗余隔离：必须与 session.user_id 一致；读取时三方校验 */
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  /** 相对 API 根，如 hs-math/application-answers/{userId}/{uuid}.bin */
  @Column({ name: 'storage_key', type: 'varchar', length: 512 })
  storageKey!: string

  @Column({ name: 'mime_type', type: 'varchar', length: 64 })
  mimeType!: string

  @Column({ name: 'size_bytes', type: 'int', unsigned: true })
  sizeBytes!: number

  @Column({ name: 'sort_order', type: 'int', unsigned: true })
  sortOrder!: number

  @Column({ type: 'varchar', length: 16 })
  status!: HsMathSessionImageStatus

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date

  @Column({
    name: 'submitted_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  submittedAt!: Date | null
}
