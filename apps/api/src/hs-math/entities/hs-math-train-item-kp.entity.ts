import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { HsMathKnowledgePoint } from './hs-math-knowledge-point.entity'
import { HsMathTrainItem } from './hs-math-train-item.entity'

@Entity('hs_math_train_item_kps')
export class HsMathTrainItemKp {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'item_id', type: 'bigint', unsigned: true })
  itemId!: string

  @ManyToOne(() => HsMathTrainItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: HsMathTrainItem

  @Column({ name: 'knowledge_point_id', type: 'bigint', unsigned: true })
  knowledgePointId!: string

  @ManyToOne(() => HsMathKnowledgePoint, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'knowledge_point_id' })
  knowledgePoint!: HsMathKnowledgePoint

  @Column({ name: 'is_primary', type: 'tinyint', width: 1, default: 0 })
  isPrimary!: boolean

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
