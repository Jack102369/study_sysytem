/** 工业实验质量检查常量（STEP_08） */

export const INDUSTRIAL_QUALITY_VERSION = '1.0.0' as const

export const INDUSTRIAL_QUALITY_DIMENSIONS = [
  'curriculum',
  'chemistry',
  'process',
  'diagram',
  'consistency',
  'teaching',
] as const

export type IndustrialQualityDimension =
  (typeof INDUSTRIAL_QUALITY_DIMENSIONS)[number]

export const INDUSTRIAL_QUALITY_STATUSES = ['pass', 'fail', 'unknown'] as const
export type IndustrialQualityStatus = (typeof INDUSTRIAL_QUALITY_STATUSES)[number]

export const INDUSTRIAL_QUALITY_SEVERITIES = [
  'info',
  'warning',
  'error',
  'critical',
] as const
export type IndustrialQualitySeverity =
  (typeof INDUSTRIAL_QUALITY_SEVERITIES)[number]

export const INDUSTRIAL_QUALITY_OVERALL = [
  'passed_automatic_checks',
  'failed_automatic_checks',
  'incomplete_verification',
] as const
export type IndustrialQualityOverallStatus =
  (typeof INDUSTRIAL_QUALITY_OVERALL)[number]

/** 高一课程内常见、确定性可核对的知识点白名单（有限覆盖） */
export const HIGH_SCHOOL_1_KNOWN_KNOWLEDGE = [
  '溶解',
  '过滤',
  '蒸发',
  '结晶',
  '固液分离',
  '粗盐提纯',
  '杂质类型',
  '海水晒盐',
  '蒸发浓缩',
  '氧化还原',
  '置换反应',
  '金属回收',
  '除杂',
  '分离提纯',
] as const

/**
 * 明确禁止的工艺错误模式（确定性）。
 * 仅匹配「用过滤除去可溶…」等肯定错误表述；
 * 不得误伤「过滤不能除去可溶」「过滤针对不溶；可溶需另法」等正确教学说明。
 */
export const FORBIDDEN_PROCESS_PATTERNS = [
  {
    code: 'FILTER_SOLUBLE_SALT',
    re: /用过滤(?:的方法)?除去可溶|过滤(?:能|可以|用于|来)?除去可溶|通过过滤除去可溶|靠过滤除去可溶/,
    message: '过滤不能用于除去已溶解的可溶性盐',
  },
] as const
