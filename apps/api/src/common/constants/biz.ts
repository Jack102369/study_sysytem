export const ERROR_STATUSES = ['NEW', 'REVIEWING', 'MASTERED', 'ARCHIVED'] as const
export type ErrorStatus = (typeof ERROR_STATUSES)[number]

export const ATTEMPT_RESULTS = ['CORRECT', 'WRONG', 'PARTIAL'] as const
export type AttemptResult = (typeof ATTEMPT_RESULTS)[number]

export const ATTACHMENT_ROLES = ['STEM', 'ANALYSIS', 'OTHER'] as const
export type AttachmentRole = (typeof ATTACHMENT_ROLES)[number]

/** 附件上传上限（含解析视频） */
export const ATTACHMENT_MAX_BYTES = 500 * 1024 * 1024

export const DEFAULT_TAGS = [
  { name: '计算失误', color: '#F56C6C' },
  { name: '审题不清', color: '#E6A23C' },
  { name: '时间不够', color: '#909399' },
  { name: '概念不清', color: '#409EFF' },
  { name: '粗心大意', color: '#67C23A' },
] as const

export const DEFAULT_ASSESSMENT_TYPES = [
  { name: '周回顾', sortOrder: 1 },
  { name: '月考', sortOrder: 2 },
  { name: '期中考试', sortOrder: 3 },
  { name: '期末考试', sortOrder: 4 },
  { name: '模拟考', sortOrder: 5 },
] as const

/** 延伸训练专用全局分类（subject_id 为空） */
export const SPECIAL_EXTENSION_CATEGORY_NAME = '月考模拟卷'

/** 延伸训练学习状态 */
export const LEARN_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'DONE'] as const
export type LearnStatus = (typeof LEARN_STATUSES)[number]

export const USER_ROLES = ['ADMIN', 'USER'] as const
export type UserRole = (typeof USER_ROLES)[number]

