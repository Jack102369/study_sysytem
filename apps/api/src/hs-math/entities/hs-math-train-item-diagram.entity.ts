import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('hs_math_train_item_diagrams')
export class HsMathTrainItemDiagram {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'item_id', type: 'bigint', unsigned: true })
  itemId!: string

  @Column({ name: 'object_id', type: 'bigint', unsigned: true })
  objectId!: string

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true })
  sortOrder!: number

  @Column({ name: 'alt_text', type: 'varchar', length: 256, nullable: true })
  altText!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
