import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { GRADES, type Grade } from '../common/constants/grades'
import { USER_ROLES, type UserRole } from '../common/constants/biz'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 128, unique: true })
  email!: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string

  @Column({ type: 'varchar', length: 64 })
  nickname!: string

  @Column({
    type: 'enum',
    enum: GRADES,
  })
  grade!: Grade

  @Column({
    type: 'enum',
    enum: USER_ROLES,
    default: 'USER',
  })
  role!: UserRole

  @Column({ name: 'is_disabled', type: 'tinyint', width: 1, default: 0 })
  isDisabled!: boolean

  /** 是否可用 OCR（含管理员账号，需单独开通） */
  @Column({ name: 'ocr_enabled', type: 'tinyint', width: 1, default: 0 })
  ocrEnabled!: boolean

  /** 是否可用 AI 参考（含管理员账号，需单独开通） */
  @Column({ name: 'ai_enabled', type: 'tinyint', width: 1, default: 0 })
  aiEnabled!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
