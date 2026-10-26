/** 统一「今日」：Asia/Shanghai 日历日 YYYY-MM-DD */
export function shanghaiDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Shanghai 日历日往前推 days 天（按日历，非 24h 滚动） */
export function shanghaiDateMinusDays(
  days: number,
  from: Date = new Date(),
): string {
  const key = shanghaiDateString(from)
  const [y, m, d] = key.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() - days)
  const yy = utc.getUTCFullYear()
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(utc.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** 枚举 [start, end] 闭区间的每个上海自然日（升序） */
export function eachShanghaiDateInclusive(
  startYmd: string,
  endYmd: string,
): string[] {
  const out: string[] = []
  const [ys, ms, ds] = startYmd.split('-').map(Number)
  const [ye, me, de] = endYmd.split('-').map(Number)
  const cur = new Date(Date.UTC(ys, ms - 1, ds))
  const end = new Date(Date.UTC(ye, me - 1, de))
  while (cur.getTime() <= end.getTime()) {
    const yy = cur.getUTCFullYear()
    const mm = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(cur.getUTCDate()).padStart(2, '0')
    out.push(`${yy}-${mm}-${dd}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
}
