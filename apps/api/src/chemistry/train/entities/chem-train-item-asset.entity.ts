import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

/**
 * chem_train_item_assets（D043-APPROVED）
 * 正式训练题 ↔ 不可变工业 SVG 等资源。
 * ON DELETE CASCADE 只删关联行，不删物理文件。
 */
@Entity('chem_train_item_assets')
@Index('idx_chem_train_item_asset_item', ['trainItemId', 'sortOrder'])
@Index('idx_chem_train_item_asset_hash', ['contentHash'])
@Index('uk_chem_train_item_asset', ['trainItemId', 'assetType', 'assetRole', 'contentHash'], {
  unique: true,
})
export class ChemTrainItemAsset {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'train_item_id', type: 'bigint', unsigned: true })
  trainItemId!: string

  /** industrial_flow_svg | industrial_apparatus_svg */
  @Column({ name: 'asset_type', type: 'varchar', length: 32 })
  assetType!: string

  /** question_diagram | supporting_diagram */
  @Column({ name: 'asset_role', type: 'varchar', length: 32 })
  assetRole!: string

  @Column({ name: 'content_hash', type: 'char', length: 64 })
  contentHash!: string

  /** 相对 uploads/，服务端生成；勿信任客户端路径 */
  @Column({ name: 'storage_path', type: 'varchar', length: 512 })
  storagePath!: string

  @Column({ name: 'mime_type', type: 'varchar', length: 64, default: 'image/svg+xml' })
  mimeType!: string

  @Column({ name: 'file_size', type: 'int', unsigned: true })
  fileSize!: number

  @Column({ name: 'diagram_version', type: 'varchar', length: 32, default: '' })
  diagramVersion!: string

  @Column({ name: 'sort_order', type: 'smallint', unsigned: true, default: 0 })
  sortOrder!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date
}
