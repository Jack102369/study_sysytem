/** 统一按北京时间（Asia/Shanghai）展示 */

const TZ = 'Asia/Shanghai'

export function formatDateTime(
  raw: string | Date | null | undefined,
  opts?: { withSeconds?: boolean },
): string {
  if (raw == null || raw === '') return '—'
  const d = raw instanceof Date ? raw : new Date(raw)
  if (Number.isNaN(d.getTime())) {
    // 非标准时间串：尽量可读
    return String(raw).slice(0, 19).replace('T', ' ')
  }
  const withSeconds = opts?.withSeconds !== false
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  })
    .format(d)
    .replace(/\//g, '-')
}
