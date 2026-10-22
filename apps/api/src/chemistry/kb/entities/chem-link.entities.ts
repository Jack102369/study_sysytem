import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('chem_entity_specialties')
export class ChemEntitySpecialty {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'entity_type', type: 'varchar', length: 32 })
  entityType!: string

  @Column({ name: 'entity_id', type: 'bigint', unsigned: true })
  entityId!: string

  @Column({ name: 'specialty_id', type: 'bigint', unsigned: true })
  specialtyId!: string
}

@Entity('chem_entity_categories')
export class ChemEntityCategory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'entity_type', type: 'varchar', length: 32 })
  entityType!: string

  @Column({ name: 'entity_id', type: 'bigint', unsigned: true })
  entityId!: string

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string
}

@Entity('chem_kp_links')
export class ChemKpLink {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'knowledge_point_id', type: 'bigint', unsigned: true })
  knowledgePointId!: string

  @Column({ name: 'target_type', type: 'varchar', length: 32 })
  targetType!: string

  @Column({ name: 'target_id', type: 'bigint', unsigned: true })
  targetId!: string
}

@Entity('chem_question_kps')
export class ChemQuestionKp {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'question_id', type: 'bigint', unsigned: true })
  questionId!: string

  @Column({ name: 'knowledge_point_id', type: 'bigint', unsigned: true })
  knowledgePointId!: string
}

@Entity('chem_reaction_substances')
export class ChemReactionSubstance {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'reaction_id', type: 'bigint', unsigned: true })
  reactionId!: string

  @Column({ name: 'substance_id', type: 'bigint', unsigned: true })
  substanceId!: string
}

@Entity('chem_reaction_elements')
export class ChemReactionElement {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'reaction_id', type: 'bigint', unsigned: true })
  reactionId!: string

  @Column({ name: 'element_id', type: 'bigint', unsigned: true })
  elementId!: string
}

@Entity('chem_experiment_reactions')
export class ChemExperimentReaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'experiment_id', type: 'bigint', unsigned: true })
  experimentId!: string

  @Column({ name: 'reaction_id', type: 'bigint', unsigned: true })
  reactionId!: string
}

@Entity('chem_experiment_substances')
export class ChemExperimentSubstance {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'experiment_id', type: 'bigint', unsigned: true })
  experimentId!: string

  @Column({ name: 'substance_id', type: 'bigint', unsigned: true })
  substanceId!: string
}

@Entity('chem_kb_links')
export class ChemKbLink {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ name: 'from_type', type: 'varchar', length: 32 })
  fromType!: string

  @Column({ name: 'from_id', type: 'bigint', unsigned: true })
  fromId!: string

  @Column({ name: 'to_type', type: 'varchar', length: 32 })
  toType!: string

  @Column({ name: 'to_id', type: 'bigint', unsigned: true })
  toId!: string

  @Column({ type: 'varchar', length: 128, default: '' })
  note!: string
}
