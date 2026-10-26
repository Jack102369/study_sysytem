import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { HsMathCategory } from './hs-math-category.entity'
import { HsMathSpecialty } from './hs-math-specialty.entity'

@Entity('hs_math_knowledge_points')
export class HsMathKnowledgePoint {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 64 })
  code!: string

  @Column({ type: 'varchar', length: 128 })
  name!: string

  @Column({ name: 'specialty_id', type: 'bigint', unsigned: true })
  specialtyId!: string

  @ManyToOne(() => HsMathSpecialty, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'specialty_id' })
  specialty!: HsMathSpecialty

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string

  @ManyToOne(() => HsMathCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: HsMathCategory

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId!: string | null

  @ManyToOne(() => HsMathKnowledgePoint, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: HsMathKnowledgePoint | null

  @Column({ type: 'varchar', length: 512, nullable: true })
  summary!: string | null

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
