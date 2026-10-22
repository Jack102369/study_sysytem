import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('listening_materials')
export class ListeningMaterial {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  title!: string | null

  @Column({ name: 'content_text', type: 'mediumtext' })
  contentText!: string

  @Column({ name: 'attachment_id', type: 'bigint', unsigned: true, nullable: true })
  attachmentId!: string | null

  @Column({ name: 'voice_key', type: 'varchar', length: 64, nullable: true })
  voiceKey!: string | null

  @Column({
    name: 'length_scale',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 1.0,
  })
  lengthScale!: string

  @Column({ name: 'duration_ms', type: 'int', unsigned: true, nullable: true })
  durationMs!: number | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
