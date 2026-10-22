/** 列表排序与状态/标签配色 */

const ERROR_STATUS_ORDER: Record<string, number> = {
  NEW: 0,
  REVIEWING: 1,
  MASTERED: 2,
  ARCHIVED: 3,
}

const LEARN_STATUS_ORDER: Record<string, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  DONE: 2,
}

const FALLBACK_PALETTE = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#34495E',
]

export function errorStatusTagType(
  status: string | null | undefined,
): 'info' | 'warning' | 'success' | 'danger' {
  if (status === 'REVIEWING') return 'warning'
  if (status === 'MASTERED') return 'success'
  if (status === 'ARCHIVED') return 'info'
  return 'danger' // NEW
}

export function errorStatusSort(a: { status?: string }, b: { status?: string }): number {
  return (ERROR_STATUS_ORDER[a.status || ''] ?? 99) - (ERROR_STATUS_ORDER[b.status || ''] ?? 99)
}

export function learnStatusSort(
  a: { learnStatus?: string },
  b: { learnStatus?: string },
): number {
  return (
    (LEARN_STATUS_ORDER[a.learnStatus || ''] ?? 99) -
    (LEARN_STATUS_ORDER[b.learnStatus || ''] ?? 99)
  )
}

export function zhTextSort(a: string | null | undefined, b: string | null | undefined): number {
  return String(a || '').localeCompare(String(b || ''), 'zh-CN')
}

export function tagNamesSort(
  a: { tags?: Array<{ name: string }> },
  b: { tags?: Array<{ name: string }> },
): number {
  const sa = (a.tags || []).map((t) => t.name).join(',')
  const sb = (b.tags || []).map((t) => t.name).join(',')
  return zhTextSort(sa, sb)
}

export function tagDisplayColor(name: string, color?: string | null): string {
  const c = (color || '').trim()
  if (c) return c
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length]
}

function hexLuminance(hex: string): number {
  const m = hex.replace('#', '')
  if (m.length !== 3 && m.length !== 6) return 0.5
  const n =
    m.length === 3
      ? m
          .split('')
          .map((x) => x + x)
          .join('')
      : m
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function namedTagStyle(name: string, color?: string | null): Record<string, string> {
  const bg = tagDisplayColor(name, color)
  const fg = hexLuminance(bg) < 0.62 ? '#fff' : '#1f2937'
  return {
    backgroundColor: bg,
    borderColor: bg,
    color: fg,
  }
}
