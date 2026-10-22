import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Tag } from '../tags/tag.entity'
import { AssessmentSubjectScore } from './assessment-subject-score.entity'

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string

  @Column({ name: 'type_id', type: 'bigint', unsigned: true })
  typeId!: string

  @Column({ type: 'varchar', length: 128 })
  title!: string

  @Column({ name: 'held_at', type: 'date' })
  heldAt!: string

  @Column({ type: 'text', nullable: true })
  note!: string | null

  @Column({ name: 'total_score', type: 'decimal', precision: 8, scale: 2, nullable: true })
  totalScore!: string | null

  @Column({ name: 'class_rank', type: 'int', unsigned: true, nullable: true })
  classRank!: number | null

  @Column({ name: 'school_rank', type: 'int', unsigned: true, nullable: true })
  schoolRank!: number | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date

  @OneToMany(() => AssessmentSubjectScore, (s) => s.assessment)
  scores!: AssessmentSubjectScore[]

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'assessment_tags',
    joinColumn: { name: 'assessment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[]
}
