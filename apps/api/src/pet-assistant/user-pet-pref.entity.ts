import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('user_pet_prefs')
export class UserPetPref {
  @PrimaryColumn({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'skin_id', type: 'varchar', length: 32, default: 'robin' })
  skinId!: string

  @Column({ name: 'pet_enabled', type: 'tinyint', width: 1, default: 1 })
  petEnabled!: boolean

  /** 按 skinId 覆盖唤醒词，如 { "trex": "小霸王" } */
  @Column({ name: 'wake_word_overrides', type: 'json', nullable: true })
  wakeWordOverrides!: Record<string, string> | null

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
