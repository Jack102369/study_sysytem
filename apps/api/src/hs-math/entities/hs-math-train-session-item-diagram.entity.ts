import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('hs_math_train_session_item_diagrams')
export class HsMathTrainSessionItemDiagram {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'session_item_id', type: 'bigint', unsigned: true })
  sessionItemId!: string

  @Column({ name: 'object_id', type: 'bigint', unsigned: true })
  objectId!: string

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true })
  sortOrder!: number

  @Column({ name: 'alt_text', type: 'varchar', length: 256, nullable: true })
  altText!: string | null

  @Column({ name: 'content_sha256', type: 'char', length: 64 })
  contentSha256!: string

  @Column({ name: 'mime_type', type: 'varchar', length: 64 })
  mimeType!: string

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
