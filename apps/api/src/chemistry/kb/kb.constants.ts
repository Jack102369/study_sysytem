export const CHEM_KB_STATUSES = [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived',
] as const

export type ChemKbStatus = (typeof CHEM_KB_STATUSES)[number]

export const CHEM_ENTITY_TYPES = [
  'element',
  'substance',
  'reaction',
  'experiment',
  'formula',
  'concept',
  'knowledge',
  'question',
] as const

export type ChemEntityType = (typeof CHEM_ENTITY_TYPES)[number]

export const SUBSTANCE_TAGS = [
  'elemental',
  'oxide',
  'acid',
  'base',
  'salt',
  'organic',
  'other',
] as const

export const REACTION_SPECIES_ROLES = ['reactant', 'product', 'catalyst'] as const

export const QUESTION_TYPES = [
  'single',
  'multi',
  'judge',
  'blank',
  'equation',
  'ionic',
  'calc',
  'experiment',
  'short',
  'inference',
  'image',
] as const
