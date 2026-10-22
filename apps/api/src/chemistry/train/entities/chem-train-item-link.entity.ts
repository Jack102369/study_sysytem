import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('chem_train_item_links')
export class ChemTrainItemLink {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'item_id', type: 'bigint', unsigned: true })
  itemId!: string

  @Column({ name: 'entity_type', type: 'varchar', length: 32 })
  entityType!: string

  @Column({ name: 'entity_id', type: 'bigint', unsigned: true })
  entityId!: string
}
