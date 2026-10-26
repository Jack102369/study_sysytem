/**
 * APPLICATION-3D-9：Vision live scope / HTTP 预算 stub（无网络）。
 * 运行：pnpm --filter api run hs-math:application3d9-selftest
 */
import {
  canAutoVisionGrade,
  HsMathVisionLiveHttpBudget,
  parseVisionLiveHttpBudget,
  parseVisionTestSessionIds,
  resolveApplicationVisionSubmitStateScoped,
} from './hs-math-vision-live-scope'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

let n = 0
function ok(name: string) {
  n += 1
  console.log('OK', name)
}

{
  const s = parseVisionTestSessionIds(' 108, 109 ;110 ')
  assert(s.has('108') && s.has('109') && s.has('110'), 'parse')
  assert(parseVisionTestSessionIds('').size === 0, 'empty')
  ok('parse session allowlist')
}

{
  const d = canAutoVisionGrade(
    { outboundEnabled: false, testUserId: '2', testSessionIdsRaw: '108' },
    '2',
    '108',
  )
  assert(!d.allowed && d.reason === 'vision_disabled', 'off')
  ok('disabled → deny')
}

{
  const d = canAutoVisionGrade(
    { outboundEnabled: true, testUserId: '2', testSessionIdsRaw: '' },
    '2',
    '108',
  )
  assert(!d.allowed && d.reason === 'session_allowlist_empty', 'empty list')
  ok('TEST_USER set + empty sessions → fail-closed')
}

{
  const d = canAutoVisionGrade(
    { outboundEnabled: true, testUserId: '2', testSessionIdsRaw: '108' },
    '9',
    '108',
  )
  assert(!d.allowed && d.reason === 'user_not_allowlisted', 'user')
  ok('wrong user → deny')
}

{
  const d = canAutoVisionGrade(
    { outboundEnabled: true, testUserId: '2', testSessionIdsRaw: '108' },
    '2',
    '999',
  )
  assert(!d.allowed && d.reason === 'session_not_allowlisted', 'sess')
  ok('session not in allowlist → deny')
}

{
  const d = canAutoVisionGrade(
    { outboundEnabled: true, testUserId: '2', testSessionIdsRaw: '108' },
    '2',
    '108',
  )
  assert(d.allowed, 'ok')
  ok('user+session allowlisted → allow')
}

{
  const d = canAutoVisionGrade(
    {
      outboundEnabled: true,
      testUserId: '2',
      testSessionIdsRaw: '126',
      testSessionItemIdsRaw: '349',
    },
    '2',
    '126',
    '349',
  )
  assert(d.allowed, 'item ok')
  const bad = canAutoVisionGrade(
    {
      outboundEnabled: true,
      testUserId: '2',
      testSessionIdsRaw: '126',
      testSessionItemIdsRaw: '349',
    },
    '2',
    '126',
    '999',
  )
  assert(!bad.allowed && bad.reason === 'session_item_not_allowlisted', 'item')
  const sched = canAutoVisionGrade(
    {
      outboundEnabled: true,
      testUserId: '2',
      testSessionIdsRaw: '126',
      testSessionItemIdsRaw: '349',
    },
    '2',
    '126',
  )
  assert(sched.allowed, 'schedule without item still session-ok')
  ok('4C-3 sessionItem allowlist')
}

{
  const d = canAutoVisionGrade(
    { outboundEnabled: true, testUserId: '', testSessionIdsRaw: '' },
    '2',
    '1',
  )
  assert(d.allowed && d.reason === 'ok_no_test_scope', 'prod')
  ok('no TEST_USER → outbound only')
}

{
  const o = resolveApplicationVisionSubmitStateScoped({
    outboundEnabled: true,
    testUserId: '2',
    testSessionIdsRaw: '',
    userId: '2',
    sessionId: '1',
  })
  assert(o.gradeResult === 'review_required' && !o.shouldScheduleVision, 'sub')
  ok('submit scoped empty allowlist → review_required')
}

{
  assert(parseVisionLiveHttpBudget('') === 0, 'b0')
  assert(parseVisionLiveHttpBudget('2') === 2, 'b2')
  const b = new HsMathVisionLiveHttpBudget(2)
  assert(b.tryConsume() && b.usedCount === 1, 'c1')
  assert(b.tryConsume() && b.usedCount === 2, 'c2')
  assert(!b.tryConsume() && b.usedCount === 2, 'c3 deny')
  ok('HTTP budget 2 then deny')
}

{
  const u = new HsMathVisionLiveHttpBudget(0)
  assert(u.tryConsume() && u.tryConsume(), 'unlimited')
  ok('budget 0 = unlimited consume')
}

// 3E-3：DeepSeek 预算解析与 Vision 共用同一计数器类（5 次封顶）
{
  assert(parseVisionLiveHttpBudget('5') === 5, 'ds5')
  const b = new HsMathVisionLiveHttpBudget(5)
  for (let i = 0; i < 5; i++) assert(b.tryConsume(), `ds-c${i}`)
  assert(!b.tryConsume() && b.usedCount === 5, 'ds deny')
  ok('DeepSeek-style HTTP budget 5 then deny')
}

console.log(`PASS ${n} APPLICATION-3D-9 scope selftests`)
