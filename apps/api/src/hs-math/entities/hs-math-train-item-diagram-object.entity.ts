import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('hs_math_train_item_diagram_objects')
export class HsMathTrainItemDiagramObject {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'content_sha256', type: 'char', length: 64 })
  contentSha256!: string

  @Column({ name: 'storage_key', type: 'varchar', length: 512 })
  storageKey!: string

  @Column({ name: 'mime_type', type: 'varchar', length: 64 })
  mimeType!: string

  @Column({ name: 'size_bytes', type: 'int', unsigned: true })
  sizeBytes!: number

  @Column({ name: 'width_px', type: 'int', unsigned: true, nullable: true })
  widthPx!: number | null

  @Column({ name: 'height_px', type: 'int', unsigned: true, nullable: true })
  heightPx!: number | null

  @Column({
    name: 'sanitize_status',
    type: 'varchar',
    length: 16,
    default: 'passed',
  })
  sanitizeStatus!: string

  @Column({
    name: 'source_mime_type',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  sourceMimeType!: string | null

  @Column({ name: 'uploaded_by', type: 'bigint', unsigned: true, nullable: true })
  uploadedBy!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
