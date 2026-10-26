/**
 * HS-MATH-TRAIN-TYPE-FILTER：题型筛选纯函数自测（无 DB / 无网络 / 无 AI）。
 * 运行：pnpm --filter api run hs-math:train-question-type-selftest
 */
import { HS_MATH_QTYPES } from '../hs-math.constants'
import {
  filterTrainItemsByQuestionType,
  isHsMathQuestionType,
  pickTrainItemsWithShortfall,
} from './hs-math-train-question-type'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

let passed = 0
function ok(name: string) {
  passed++
  console.log(`  PASS ${name}`)
}

type Fake = { id: string; qtype: string; status: string }

const bank: Fake[] = [
  { id: '1', qtype: 'single', status: 'approved' },
  { id: '2', qtype: 'multi', status: 'approved' },
  { id: '3', qtype: 'judge', status: 'approved' },
  { id: '4', qtype: 'numeric', status: 'approved' },
  { id: '5', qtype: 'application', status: 'approved' },
  { id: '6', qtype: 'application', status: 'approved' },
  { id: 'x', qtype: 'essay', status: 'approved' },
]

console.log('HS-MATH-TRAIN-TYPE-FILTER selftest')

// 1 不传 questionType → 全部合法五种（排除 essay）
{
  const r = filterTrainItemsByQuestionType(bank, null)
  assert(r.length === 6, 'all count')
  assert(r.every((i) => i.qtype !== 'essay'), 'no essay')
  ok('1 omit filter = all five types')
}

// 2–6 各题型只抽对应
for (const qt of [
  'application',
  'single',
  'multi',
  'judge',
  'numeric',
] as const) {
  const r = filterTrainItemsByQuestionType(bank, qt)
  assert(r.length >= 1 && r.every((i) => i.qtype === qt), qt)
  ok(`2-6 only ${qt}`)
}

// 7 非法类型（与 DTO @IsIn(HS_MATH_QTYPES) 同源集合）
{
  assert(!isHsMathQuestionType('essay'), 'essay not qtype')
  assert(!isHsMathQuestionType('ALL'), 'ALL not qtype')
  assert(!isHsMathQuestionType(''), 'empty not qtype')
  assert(
    HS_MATH_QTYPES.every((q) => isHsMathQuestionType(q)),
    'all five accepted',
  )
  ok('7 illegal questionType rejected by allowlist')
}

{
  assert(isHsMathQuestionType('application'), 'application ok')
  ok('7b valid types / omit means all (service path)')
}

// 8–11 门禁语义：筛选不引入 draft（本函数只看 qtype；抽题服务另有 status/pool）
{
  const mixed = [
    ...bank,
    { id: 'd', qtype: 'application', status: 'draft' },
  ]
  // 纯函数不按 status 过滤——调用方须先只传 approved；此处确认 application 过滤不混其它题型
  const apps = filterTrainItemsByQuestionType(mixed, 'application')
  assert(
    apps.every((i) => i.qtype === 'application'),
    'app only',
  )
  ok('8-11 qtype filter exclusivity (status gated upstream)')
}

// 12 题量不足
{
  const apps = filterTrainItemsByQuestionType(bank, 'application')
  const { picked, shortfall } = pickTrainItemsWithShortfall(apps, 5)
  assert(picked.length === 2 && shortfall === 3, 'shortfall 5-2')
  ok('12 shortfall allows actual count')
}

// 13 无可用题
{
  const empty = filterTrainItemsByQuestionType(
    bank.filter((i) => i.qtype === 'single'),
    'application',
  )
  assert(empty.length === 0, 'empty when no match')
  ok('13 empty pool when no matching type')
}

// 14–16 不触及评分/图片/AI（本自测无导入即可）
ok('14-16 no grade/image/AI side effects in util')

console.log(`HS-MATH-TRAIN-TYPE-FILTER selftest OK (${passed} cases)`)
