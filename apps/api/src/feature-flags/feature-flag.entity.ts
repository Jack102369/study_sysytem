import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryColumn({ name: 'flag_key', type: 'varchar', length: 64 })
  flagKey!: string

  @Column({ type: 'tinyint', width: 1, default: 1 })
  enabled!: boolean

  @Column({ name: 'module_name', type: 'varchar', length: 64 })
  moduleName!: string

  @Column({ type: 'varchar', length: 128 })
  label!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
