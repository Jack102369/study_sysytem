/** 错题状态：存库仍用英文枚举，界面统一中文 */

export const ERROR_STATUS_OPTIONS = [
  { value: 'NEW', label: '新建' },
  { value: 'REVIEWING', label: '复习中' },
  { value: 'MASTERED', label: '已掌握' },
  { value: 'ARCHIVED', label: '已归档' },
] as const

const LABEL_MAP: Record<string, string> = Object.fromEntries(
  ERROR_STATUS_OPTIONS.map((o) => [o.value, o.label]),
)

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  return LABEL_MAP[status] || status
}

/** 延伸训练学习状态 */
export const LEARN_STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: '未学' },
  { value: 'IN_PROGRESS', label: '学习中' },
  { value: 'DONE', label: '已学' },
] as const

const LEARN_LABEL_MAP: Record<string, string> = Object.fromEntries(
  LEARN_STATUS_OPTIONS.map((o) => [o.value, o.label]),
)

export function learnStatusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  return LEARN_LABEL_MAP[status] || status
}

export function learnStatusTagType(
  status: string | null | undefined,
): 'info' | 'warning' | 'success' {
  if (status === 'IN_PROGRESS') return 'warning'
  if (status === 'DONE') return 'success'
  return 'info'
}
