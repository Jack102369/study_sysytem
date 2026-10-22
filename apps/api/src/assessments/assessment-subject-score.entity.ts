import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Assessment } from './assessment.entity'

@Entity('assessment_subject_scores')
export class AssessmentSubjectScore {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'assessment_id', type: 'bigint', unsigned: true })
  assessmentId!: string

  @Column({ name: 'subject_id', type: 'bigint', unsigned: true })
  subjectId!: string

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  score!: string

  @Column({ name: 'full_score', type: 'decimal', precision: 6, scale: 2, nullable: true })
  fullScore!: string | null

  @Column({ name: 'class_rank', type: 'int', unsigned: true, nullable: true })
  classRank!: number | null

  @Column({ name: 'class_size', type: 'int', unsigned: true, nullable: true })
  classSize!: number | null

  @Column({ name: 'school_rank', type: 'int', unsigned: true, nullable: true })
  schoolRank!: number | null

  @Column({ name: 'school_size', type: 'int', unsigned: true, nullable: true })
  schoolSize!: number | null

  @Column({ type: 'text', nullable: true })
  note!: string | null

  @ManyToOne(() => Assessment, (a) => a.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment!: Assessment
}
