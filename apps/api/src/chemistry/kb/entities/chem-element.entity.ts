import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ChemKbStatus } from '../kb.constants'

@Entity('chem_elements')
export class ChemElement {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 8, unique: true })
  symbol!: string

  @Column({ name: 'name_zh', type: 'varchar', length: 32 })
  nameZh!: string

  @Column({ name: 'name_en', type: 'varchar', length: 64, default: '' })
  nameEn!: string

  @Column({ name: 'atomic_number', type: 'int', unsigned: true })
  atomicNumber!: number

  @Column({
    name: 'atomic_mass',
    type: 'decimal',
    precision: 12,
    scale: 6,
    nullable: true,
  })
  atomicMass!: string | null

  @Column({ name: 'period_no', type: 'tinyint', unsigned: true, nullable: true })
  periodNo!: number | null

  @Column({ name: 'group_label', type: 'varchar', length: 16, nullable: true })
  groupLabel!: string | null

  @Column({ type: 'varchar', length: 32, nullable: true })
  category!: string | null

  @Column({ name: 'common_valences', type: 'varchar', length: 64, nullable: true })
  commonValences!: string | null

  @Column({ name: 'atom_structure', type: 'text', nullable: true })
  atomStructure!: string | null

  @Column({ name: 'electron_config', type: 'varchar', length: 128, nullable: true })
  electronConfig!: string | null

  @Column({ name: 'common_compounds', type: 'text', nullable: true })
  commonCompounds!: string | null

  @Column({ name: 'key_properties', type: 'text', nullable: true })
  keyProperties!: string | null

  @Column({ name: 'common_uses', type: 'text', nullable: true })
  commonUses!: string | null

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status!: ChemKbStatus

  @Column({ name: 'review_note', type: 'varchar', length: 255, default: '' })
  reviewNote!: string

  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy!: string | null

  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true })
  updatedBy!: string | null

  @Column({ name: 'reviewed_by', type: 'bigint', unsigned: true, nullable: true })
  reviewedBy!: string | null

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 3, nullable: true })
  reviewedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
