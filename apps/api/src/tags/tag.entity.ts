import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ type: 'varchar', length: 32 })
  name!: string

  @Column({ type: 'varchar', length: 16, nullable: true })
  color!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
