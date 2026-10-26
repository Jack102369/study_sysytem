/**
 * P1-0F-C3C.2：STALE 分页正确性（Mock，不连库、不插 2000 真题）。
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  assertPagesCoverExactOnce,
  filterThenPaginateByStatus,
  paginateStableList,
} from './hs-math-review-queue-paginate'
import { summarizeCurrentReview } from './hs-math-review-gate'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const root = path.resolve(__dirname, '../../../../../')

function main() {
  // --- summarize：指纹失效 → stale ---
  {
    const s = summarizeCurrentReview({
      contentVersion: 1,
      contentFingerprint: 'fp-new',
      reviewsForItem: [
        {
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp-old',
          reviewComment: 'x',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
    })
    assert(s.currentReviewStatus === 'stale', 'fp mismatch → stale')
  }

  // --- 2500 候选 Mock：混合状态，筛 stale 后跨页无遗漏/重复 ---
  const N = 2500
  const candidates = Array.from({ length: N }, (_, i) => ({
    id: String(i + 1).padStart(6, '0'),
  }))
  // 每 5 条：none / passed / rejected / deferred / stale
  const statuses = candidates.map((_, i) => {
    const m = i % 5
    if (m === 0) return 'none'
    if (m === 1) return 'passed'
    if (m === 2) return 'rejected'
    if (m === 3) return 'deferred'
    return 'stale'
  })
  const staleExpected = candidates
    .filter((_, i) => statuses[i] === 'stale')
    .map((c) => c.id)
  assert(staleExpected.length === 500, `stale count=${staleExpected.length}`)

  const pageSize = 17
  const pages: { id: string }[][] = []
  let page = 1
  let total = -1
  for (;;) {
    const r = filterThenPaginateByStatus(
      candidates,
      statuses,
      'stale',
      page,
      pageSize,
    )
    if (total < 0) total = r.total
    assert(r.total === 500, `total must be 500 got ${r.total}`)
    assert(r.items.length <= pageSize, 'pageSize cap')
    if (page < Math.ceil(500 / pageSize)) {
      assert(r.items.length === pageSize, `full page ${page}`)
    }
    pages.push(r.items.map((x) => ({ id: x.id })))
    if (r.items.length === 0) break
    if ((page - 1) * pageSize + r.items.length >= r.total) break
    page++
    if (page > 500) throw new Error('loop guard')
  }
  const cover = assertPagesCoverExactOnce(pages, staleExpected)
  assert(cover.ok, cover.ok === false ? cover.reason : '')

  // passed 子集
  const passedExpected = candidates
    .filter((_, i) => statuses[i] === 'passed')
    .map((c) => c.id)
  const p1 = filterThenPaginateByStatus(
    candidates,
    statuses,
    'passed',
    1,
    100,
  )
  assert(p1.total === passedExpected.length, 'passed total')
  assert(p1.items.length === 100, 'passed page1 size')
  const pLast = filterThenPaginateByStatus(
    candidates,
    statuses,
    'passed',
    Math.ceil(passedExpected.length / 100),
    100,
  )
  assert(
    pLast.items[pLast.items.length - 1]?.id ===
      passedExpected[passedExpected.length - 1],
    'passed last id',
  )

  // 无筛选：total=N，跨页覆盖
  const allPages: { id: string }[][] = []
  const ps = 100
  for (let pg = 1; pg <= Math.ceil(N / ps); pg++) {
    const r = paginateStableList(candidates, pg, ps)
    assert(r.total === N, 'all total')
    allPages.push(r.items.map((x) => ({ id: x.id })))
  }
  const coverAll = assertPagesCoverExactOnce(
    allPages,
    candidates.map((c) => c.id),
  )
  assert(coverAll.ok, coverAll.ok === false ? coverAll.reason : '')

  // 源码：禁止 take(2000) / 先分页再丢弃模式
  const svc = fs.readFileSync(
    path.join(
      root,
      'apps/api/src/hs-math/admin/hs-math-admin-train-item-reviews.service.ts',
    ),
    'utf8',
  )
  assert(!/\.take\(\s*2000\s*\)/.test(svc), 'no .take(2000) call')
  assert(svc.includes('paginateStableList'), 'uses paginateStableList')
  assert(svc.includes('enrichQueueRowsBatched'), 'batched enrich')
  assert(svc.includes('getMany()'), 'load full candidates then filter')
  assert(
    !/skip\(\(page[\s\S]*getManyAndCount/.test(svc),
    'no SQL skip+count before enrich filter',
  )

  const fe = fs.readFileSync(
    path.join(
      root,
      'apps/web/src/views/settings/hs-math/HsMathTrainItemsReviewView.vue',
    ),
    'utf8',
  )
  assert(fe.includes('fetchReviewQueue'), 'FE queue')
  assert(fe.includes('MathStem'), 'KaTeX')
  assert(fe.includes('confirmPublish') === false || fe.includes('publishReviewedTrainItem'), 'publish via API')
  assert(fe.includes('409'), '409 handling')

  console.log('hs-math P1-0F-C3C.2 unit selftest PASS')
  console.log(
    `Mock: N=${N} stale=${staleExpected.length} pages=${pages.length} pageSize=${pageSize}`,
  )
}

main()
