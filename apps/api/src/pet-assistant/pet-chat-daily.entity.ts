import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('pet_chat_daily')
export class PetChatDaily {
  @PrimaryColumn({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @PrimaryColumn({ name: 'day_date', type: 'date' })
  dayDate!: string

  @Column({ name: 'chat_count', type: 'int', unsigned: true, default: 0 })
  chatCount!: number
}
