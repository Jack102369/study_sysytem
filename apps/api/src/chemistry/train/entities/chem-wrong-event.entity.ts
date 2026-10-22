import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('chem_wrong_events')
export class ChemWrongEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'wrong_item_id', type: 'bigint', unsigned: true })
  wrongItemId!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'item_id', type: 'bigint', unsigned: true })
  itemId!: string

  @Column({ name: 'session_id', type: 'bigint', unsigned: true })
  sessionId!: string

  @Column({ name: 'session_item_id', type: 'bigint', unsigned: true })
  sessionItemId!: string

  @Column({ name: 'session_kind', type: 'varchar', length: 16, default: '' })
  sessionKind!: string

  /** wrong | correct */
  @Column({ name: 'event_type', type: 'varchar', length: 16 })
  eventType!: string

  @Column({ name: 'occurred_at', type: 'datetime', precision: 3 })
  occurredAt!: Date

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
