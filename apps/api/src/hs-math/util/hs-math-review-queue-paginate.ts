/**
 * 审核队列分页纯逻辑（P1-0F-C3C.2）。
 * 要求：筛选后的全集 → 再 total / slice；禁止先分页再丢弃。
 */

export type QueuePageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 对已按稳定键排序、且已完成状态筛选的列表做分页。
 * page 从 1 起；pageSize 上限由调用方钳制。
 */
export function paginateStableList<T>(
  sortedFiltered: T[],
  page: number,
  pageSize: number,
): QueuePageResult<T> {
  const p = Math.max(1, Math.floor(Number(page) || 1))
  const size = Math.max(1, Math.floor(Number(pageSize) || 20))
  const total = sortedFiltered.length
  const start = (p - 1) * size
  const items = sortedFiltered.slice(start, start + size)
  return { items, total, page: p, pageSize: size }
}

/** 跨页无重复、无遗漏（稳定 id 键） */
export function assertPagesCoverExactOnce(
  pages: Array<{ id: string }[]>,
  expectedIdsSorted: string[],
): { ok: true } | { ok: false; reason: string } {
  const seen = new Set<string>()
  const flat: string[] = []
  for (const page of pages) {
    for (const row of page) {
      const id = String(row.id)
      if (seen.has(id)) {
        return { ok: false, reason: `duplicate id=${id}` }
      }
      seen.add(id)
      flat.push(id)
    }
  }
  if (flat.length !== expectedIdsSorted.length) {
    return {
      ok: false,
      reason: `count ${flat.length} !== ${expectedIdsSorted.length}`,
    }
  }
  for (let i = 0; i < expectedIdsSorted.length; i++) {
    if (flat[i] !== expectedIdsSorted[i]) {
      return {
        ok: false,
        reason: `order mismatch at ${i}: ${flat[i]} vs ${expectedIdsSorted[i]}`,
      }
    }
  }
  return { ok: true }
}

/**
 * 模拟「先 SQL 粗筛 → 应用层指纹态 → 再分页」的正确性。
 * statuses[i] 为 enrich 后的 currentReviewStatus。
 */
export function filterThenPaginateByStatus<T extends { id: string }>(
  candidatesSorted: T[],
  statuses: string[],
  wantStatus: string | undefined,
  page: number,
  pageSize: number,
): QueuePageResult<T> {
  if (candidatesSorted.length !== statuses.length) {
    throw new Error('candidates/statuses length mismatch')
  }
  const filtered =
    wantStatus == null || wantStatus === ''
      ? candidatesSorted
      : candidatesSorted.filter((_, i) => statuses[i] === wantStatus)
  return paginateStableList(filtered, page, pageSize)
}
