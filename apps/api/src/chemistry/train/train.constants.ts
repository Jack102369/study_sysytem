export const TRAIN_POOLS = ['formal', 'test'] as const
export type TrainPool = (typeof TRAIN_POOLS)[number]

export const TRAIN_QTYPES = ['single', 'judge', 'blank'] as const
export type TrainQtype = (typeof TRAIN_QTYPES)[number]

export const TRAIN_ITEM_STATUSES = ['draft', 'approved', 'disabled'] as const
export type TrainItemStatus = (typeof TRAIN_ITEM_STATUSES)[number]

export const TRAIN_MODES = ['sequential', 'random'] as const
export type TrainMode = (typeof TRAIN_MODES)[number]

export const TRAIN_SESSION_STATUSES = [
  'in_progress',
  'completed',
  'cancelled',
] as const
export type TrainSessionStatus = (typeof TRAIN_SESSION_STATUSES)[number]

export const TRAIN_GRADE_RESULTS = [
  'correct',
  'wrong',
  'pending_review',
] as const
export type TrainGradeResult = (typeof TRAIN_GRADE_RESULTS)[number]

export const TRAIN_COUNTS = [5, 10, 20] as const
export const TRAIN_DIFFICULTIES = [1, 2, 3] as const

export const DIFFICULTY_LABELS: Record<number, string> = {
  0: '提高+挑战',
  1: '基础',
  2: '提高',
  3: '挑战',
}

/** KB 表名映射（准入检查用） */
export const KB_TABLE_BY_TYPE: Record<string, string> = {
  element: 'chem_elements',
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
}
