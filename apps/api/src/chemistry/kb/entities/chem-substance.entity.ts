import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ChemKbStatus } from '../kb.constants'

@Entity('chem_substances')
export class ChemSubstance {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 128 })
  name!: string

  @Column({ name: 'canonical_formula', type: 'varchar', length: 64 })
  canonicalFormula!: string

  @Column({ name: 'common_names', type: 'varchar', length: 255, default: '' })
  commonNames!: string

  @Column({ type: 'varchar', length: 64, default: '' })
  color!: string

  @Column({ name: 'state_label', type: 'varchar', length: 32, default: '' })
  stateLabel!: string

  @Column({ type: 'text', nullable: true })
  solubility!: string | null

  @Column({ name: 'physical_props', type: 'text', nullable: true })
  physicalProps!: string | null

  @Column({ name: 'chemical_props', type: 'text', nullable: true })
  chemicalProps!: string | null

  @Column({ name: 'common_uses', type: 'text', nullable: true })
  commonUses!: string | null

  @Column({ name: 'test_methods', type: 'text', nullable: true })
  testMethods!: string | null

  @Column({ name: 'storage_methods', type: 'text', nullable: true })
  storageMethods!: string | null

  @Column({ name: 'safety_notes', type: 'text', nullable: true })
  safetyNotes!: string | null

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

@Entity('chem_substance_tags')
export class ChemSubstanceTag {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'substance_id', type: 'bigint', unsigned: true })
  substanceId!: string

  @Column({ type: 'varchar', length: 32 })
  tag!: string
}

@Entity('chem_substance_elements')
export class ChemSubstanceElement {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'substance_id', type: 'bigint', unsigned: true })
  substanceId!: string

  @Column({ name: 'element_id', type: 'bigint', unsigned: true })
  elementId!: string

  @Column({ name: 'atom_count', type: 'int', unsigned: true, default: 1 })
  atomCount!: number
}
