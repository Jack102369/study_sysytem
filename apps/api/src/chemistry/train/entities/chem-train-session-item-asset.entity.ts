import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

/**
 * chem_train_session_item_assets（D045 / STEP_10）
 * 开训时固定图形版本；历史回看禁止改查 chem_train_item_assets 当前关联。
 */
@Entity('chem_train_session_item_assets')
@Index('idx_chem_sess_item_asset_si', ['sessionItemId', 'sortOrder'])
@Index('idx_chem_sess_item_asset_hash', ['contentHash'])
@Index(
  'uk_chem_sess_item_asset',
  ['sessionItemId', 'assetType', 'assetRole', 'contentHash'],
  { unique: true },
)
export class ChemTrainSessionItemAsset {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'session_item_id', type: 'bigint', unsigned: true })
  sessionItemId!: string

  @Column({
    name: 'source_item_asset_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  sourceItemAssetId!: string | null

  @Column({ name: 'asset_type', type: 'varchar', length: 32 })
  assetType!: string

  @Column({ name: 'asset_role', type: 'varchar', length: 32 })
  assetRole!: string

  @Column({ name: 'content_hash', type: 'char', length: 64 })
  contentHash!: string

  @Column({ name: 'mime_type', type: 'varchar', length: 64, default: 'image/svg+xml' })
  mimeType!: string

  @Column({ name: 'diagram_version', type: 'varchar', length: 32, default: '' })
  diagramVersion!: string

  @Column({ name: 'sort_order', type: 'smallint', unsigned: true, default: 0 })
  sortOrder!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
