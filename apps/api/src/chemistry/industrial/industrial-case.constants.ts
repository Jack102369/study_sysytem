/** 工业案例领域常量（与 chem_categories / KB 状态对齐；非 DB 枚举迁移） */

export const INDUSTRIAL_SPECIALTY_CODE = 'industrial_experiment' as const

/** STEP_03 / D029 正式二级分类 */
export const INDUSTRIAL_CATEGORY_CODES = [
  'flow_diagram_read',
  'raw_material_pretreatment',
  'industrial_reaction_principle',
  'industrial_reaction_conditions',
  'industrial_separation_purification',
  'industrial_gas_preparation',
  'industrial_apparatus_analysis',
  'industrial_yield_calculation',
  'industrial_resource_recycling',
  'industrial_environment_safety',
  'industrial_production_cases',
  'flow_comprehensive',
] as const

export type IndustrialCategoryCode = (typeof INDUSTRIAL_CATEGORY_CODES)[number]

export const INDUSTRIAL_CASE_TYPES = [
  'real_industrial_process',
  'textbook_simplification',
  'teaching_simulation',
] as const

export type IndustrialCaseType = (typeof INDUSTRIAL_CASE_TYPES)[number]

/** 领域审核态；映射到 chem_experiments.status 见 INDUSTRIAL_CASE_MODEL.md */
export const INDUSTRIAL_REVIEW_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'published',
  'rejected',
] as const

export type IndustrialReviewStatus = (typeof INDUSTRIAL_REVIEW_STATUSES)[number]

export const INDUSTRIAL_SOURCE_TYPES = [
  'published_chem_kb',
  'textbook_knowledge',
  'curriculum_standard',
  'human_review_notes',
] as const

export type IndustrialSourceType = (typeof INDUSTRIAL_SOURCE_TYPES)[number]

export const INDUSTRIAL_VERIFICATION_STATUSES = [
  'unverified',
  'verified',
  'rejected',
] as const

export type IndustrialVerificationStatus =
  (typeof INDUSTRIAL_VERIFICATION_STATUSES)[number]

export const INDUSTRIAL_CURRICULUM_REVIEW_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const

export type IndustrialCurriculumReviewStatus =
  (typeof INDUSTRIAL_CURRICULUM_REVIEW_STATUSES)[number]

export const INDUSTRIAL_MATERIAL_TYPES = [
  'raw_material',
  'reagent',
  'intermediate',
  'target_product',
  'byproduct',
  'waste',
] as const

export type IndustrialMaterialType = (typeof INDUSTRIAL_MATERIAL_TYPES)[number]

export const INDUSTRIAL_PHYSICAL_STATES = [
  'solid',
  'liquid',
  'gas',
  'aqueous',
  'mixture',
  'unknown',
] as const

export type IndustrialPhysicalState = (typeof INDUSTRIAL_PHYSICAL_STATES)[number]

/** 受控工艺操作类型；具体含义可用 step 描述补充 */
export const INDUSTRIAL_OPERATION_TYPES = [
  'dissolve',
  'filter',
  'evaporate',
  'crystallize',
  'acid_leach',
  'redox_reaction',
  'gas_absorb',
  'impurity_removal',
  'material_recycle',
  'displace',
  'other',
] as const

export type IndustrialOperationType = (typeof INDUSTRIAL_OPERATION_TYPES)[number]

export const INDUSTRIAL_GRADE_SCOPES = ['high_school_1'] as const

export type IndustrialGradeScope = (typeof INDUSTRIAL_GRADE_SCOPES)[number]

export const CASE_CODE_PATTERN = /^[a-z][a-z0-9_]{2,62}$/
export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/
