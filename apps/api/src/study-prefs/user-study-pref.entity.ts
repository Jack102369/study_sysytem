import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

export type StudyCompareMode = 'score' | 'class_rank' | 'school_rank'

@Entity('user_study_prefs')
export class UserStudyPref {
  @PrimaryColumn({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({
    name: 'compare_mode',
    type: 'enum',
    enum: ['score', 'class_rank', 'school_rank'],
    default: 'score',
  })
  compareMode!: StudyCompareMode

  @Column({
    name: 'score_threshold',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 1,
  })
  scoreThreshold!: string

  @Column({ name: 'rank_threshold', type: 'int', unsigned: true, default: 1 })
  rankThreshold!: number

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
