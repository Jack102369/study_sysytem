import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ChemSpecialty } from './chem-specialty.entity'

@Entity('chem_categories')
export class ChemCategory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'specialty_id', type: 'bigint', unsigned: true })
  specialtyId!: string

  @ManyToOne(() => ChemSpecialty, (s) => s.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialty_id' })
  specialty!: ChemSpecialty

  @Column({ type: 'varchar', length: 64 })
  code!: string

  @Column({ type: 'varchar', length: 64 })
  name!: string

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
