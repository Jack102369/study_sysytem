/**
 * P0-4 正确率 / 上海自然日纯逻辑自测。
 * 运行：含于 pnpm --filter api run hs-math:selftest
 */
import { accuracyRatio } from './accuracy'
import {
  eachShanghaiDateInclusive,
  shanghaiDateMinusDays,
  shanghaiDateString,
} from './shanghai-date'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function main() {
  assert(accuracyRatio(0, 0) === null, 'empty denom null')
  assert(accuracyRatio(0, 5) === 0, 'all wrong')
  assert(accuracyRatio(5, 0) === 1, 'all correct')
  assert(accuracyRatio(78, 18) === 0.8125, 'sample ratio')
  // pending ignored: pass only correct+wrong
  assert(accuracyRatio(1, 1) === 0.5, 'half')

  const fixed = new Date('2026-10-24T16:00:00.000Z') // 上海已是 10-25 00:00
  const sh = shanghaiDateString(fixed)
  assert(sh === '2026-10-25', `shanghai cross UTC day got ${sh}`)

  const minus = shanghaiDateMinusDays(6, fixed)
  assert(minus === '2026-10-19', `minus6 got ${minus}`)

  const days = eachShanghaiDateInclusive('2026-10-23', '2026-10-25')
  assert(days.join(',') === '2026-10-23,2026-10-24,2026-10-25', days.join(','))
  assert(days.length === 3, '3 days')

  console.log('hs-math P0-4 selftest PASS')
}

main()
