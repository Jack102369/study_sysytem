import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ChemKbStatus } from '../kb.constants'

@Entity('chem_reactions')
export class ChemReaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 128 })
  name!: string

  @Column({ name: 'canonical_equation', type: 'varchar', length: 255 })
  canonicalEquation!: string

  @Column({ type: 'varchar', length: 255 })
  equation!: string

  @Column({ name: 'ionic_equation', type: 'varchar', length: 255, nullable: true })
  ionicEquation!: string | null

  @Column({ type: 'varchar', length: 255, default: '' })
  conditions!: string

  @Column({ type: 'text', nullable: true })
  phenomenon!: string | null

  @Column({ type: 'text', nullable: true })
  principle!: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  oxidant!: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  reductant!: string | null

  @Column({ name: 'ox_product', type: 'varchar', length: 128, nullable: true })
  oxProduct!: string | null

  @Column({ name: 're_product', type: 'varchar', length: 128, nullable: true })
  reProduct!: string | null

  @Column({ name: 'electron_transfer', type: 'text', nullable: true })
  electronTransfer!: string | null

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  difficulty!: number

  @Column({ type: 'tinyint', unsigned: true, default: 3 })
  importance!: number

  @Column({ name: 'is_verified', type: 'tinyint', width: 1, default: 0 })
  isVerified!: boolean

  @Column({ name: 'train_types', type: 'varchar', length: 255, default: '' })
  trainTypes!: string

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

@Entity('chem_reaction_tags')
export class ChemReactionTag {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'reaction_id', type: 'bigint', unsigned: true })
  reactionId!: string

  @Column({ type: 'varchar', length: 32 })
  tag!: string
}

@Entity('chem_reaction_species')
export class ChemReactionSpecies {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'reaction_id', type: 'bigint', unsigned: true })
  reactionId!: string

  @Column({ type: 'varchar', length: 16 })
  role!: string

  @Column({ name: 'substance_id', type: 'bigint', unsigned: true, nullable: true })
  substanceId!: string | null

  @Column({ type: 'varchar', length: 64 })
  formula!: string

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  coefficient!: string

  @Column({ name: 'state_symbol', type: 'varchar', length: 8, nullable: true })
  stateSymbol!: string | null

  @Column({ name: 'is_gas', type: 'tinyint', width: 1, default: 0 })
  isGas!: boolean

  @Column({ name: 'is_precipitate', type: 'tinyint', width: 1, default: 0 })
  isPrecipitate!: boolean

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number
}
