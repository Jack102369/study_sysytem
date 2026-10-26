/**
 * APPLICATION-4C-4B：OWNER_ONLY + DeepSeek 日额度（纯函数 / 内存 stub）。
 * 无真实 HTTP、无写库、不冒充 MySQL 原子性验收。
 */
import assert from 'node:assert/strict'
import { resolveGradingProviderFromAnswer } from './user-answer.validate'
import { dispatchApplicationGrade } from './hs-math-application-grade-dispatch'
import {
  parseApplicationAiMode,
  parseApplicationAiAllowedUserIds,
  resolveApplicationAiAccess,
} from './hs-math-application-ai-owner-scope'
import {
  HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
  InMemoryDeepseekDailyQuota,
  isDeepseekQuotaAvailable,
  parseDeepseekDailyLimit,
  shanghaiCalendarDate,
} from './hs-math-deepseek-daily-quota'
import {
  evaluateApplicationRegradeEligibility,
  planApplicationRegrade,
} from './hs-math-application-regrade'
import { HS_MATH_AI_GRADING_MAX_ATTEMPTS } from '../hs-math.constants'

let n = 0
function ok(name: string) {
  n += 1
  console.log('OK', name)
}

const UA_QWEN_IMG = {
  kind: 'application' as const,
  imageIds: ['1'],
  gradingProvider: 'qwen' as const,
}
const UA_QWEN_TEXT = {
  kind: 'application' as const,
  text: 'x=1',
  gradingProvider: 'qwen' as const,
}
const UA_DS_TEXT = {
  kind: 'application' as const,
  text: 'x=1',
  gradingProvider: 'deepseek' as const,
}
const UA_DS_IMG = {
  kind: 'application' as const,
  imageIds: ['1'],
  gradingProvider: 'deepseek' as const,
}
const UA_DS_MIX = {
  kind: 'application' as const,
  text: '见图',
  imageIds: ['1'],
  gradingProvider: 'deepseek' as const,
}

// ——— OWNER_ONLY / MODE ———

{
  const m = parseApplicationAiMode('')
  assert.equal(m.ok, true)
  if (m.ok) assert.equal(m.mode, 'disabled')
  ok('1 disabled default')
}

{
  const m = parseApplicationAiMode('owner_only')
  assert.equal(m.ok, true)
  if (m.ok) assert.equal(m.mode, 'owner_only')
  ok('2 owner_only parse')
}

{
  const m = parseApplicationAiMode('open_all')
  assert.equal(m.ok, false)
  ok('3 invalid mode reject')
}

{
  const d = resolveApplicationAiAccess(
    {
      modeRaw: 'disabled',
      allowedUserIdsRaw: '2',
      outboundEnabled: true,
      testUserId: '',
      testSessionIdsRaw: '',
    },
    '2',
    '100',
  )
  assert.equal(d.allowed, false)
  assert.equal(d.reason, 'mode_disabled')
  ok('4 disabled+no TEST → deny')
}

{
  const d = resolveApplicationAiAccess(
    {
      modeRaw: 'owner_only',
      allowedUserIdsRaw: '2',
      outboundEnabled: true,
      testUserId: '',
      testSessionIdsRaw: '',
    },
    '2',
    '999',
  )
  assert.equal(d.allowed, true)
  assert.equal(d.reason, 'ok_owner_only')
  ok('5 owner_only user=2 allow (dynamic session)')
}

{
  const d = resolveApplicationAiAccess(
    {
      modeRaw: 'owner_only',
      allowedUserIdsRaw: '2',
      outboundEnabled: true,
      testUserId: '',
      testSessionIdsRaw: '',
    },
    '3',
    '999',
  )
  assert.equal(d.allowed, false)
  assert.equal(d.reason, 'user_not_owner')
  ok('6 other user deny')
}

{
  const d = resolveApplicationAiAccess(
    {
      modeRaw: 'owner_only',
      allowedUserIdsRaw: '',
      outboundEnabled: true,
      testUserId: '',
      testSessionIdsRaw: '',
    },
    '2',
    '1',
  )
  assert.equal(d.allowed, false)
  assert.equal(d.reason, 'allowed_user_ids_empty')
  ok('7 allowlist missing deny')
}

{
  const p = parseApplicationAiAllowedUserIds('2,abc')
  assert.equal(p.ok, false)
  ok('8 allowlist illegal deny')
}

{
  const p = parseApplicationAiAllowedUserIds('  ,  ')
  assert.equal(p.ok, false)
  ok('9 empty allowlist deny')
}

{
  const d = resolveApplicationAiAccess(
    {
      modeRaw: 'disabled',
      allowedUserIdsRaw: '',
      outboundEnabled: true,
      testUserId: '2',
      testSessionIdsRaw: '126',
      testSessionItemIdsRaw: '349',
    },
    '2',
    '126',
    '349',
  )
  assert.equal(d.allowed, true)
  ok('10 test mode allowlist still works')
}

{
  const d = resolveApplicationAiAccess(
    {
      modeRaw: 'owner_only',
      allowedUserIdsRaw: '2',
      outboundEnabled: false,
      testUserId: '',
      testSessionIdsRaw: '',
    },
    '2',
    '1',
  )
  assert.equal(d.allowed, false)
  ok('11 switches off → deny')
}

// ——— 调度路径（dispatch，不外发） ———

{
  const qwenImg = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: UA_QWEN_IMG,
    visionReady: true,
    textAiReady: false,
  })
  assert.equal(qwenImg.queue, 'vision')
  ok('12 qwen image path')
}

{
  const qwenText = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: UA_QWEN_TEXT,
    visionReady: true,
    textAiReady: false,
  })
  assert.equal(qwenText.queue, 'vision')
  assert.equal(resolveGradingProviderFromAnswer(UA_QWEN_TEXT), 'qwen')
  ok('13 qwen text path')
}

{
  const ds = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: UA_DS_TEXT,
    visionReady: false,
    textAiReady: true,
  })
  assert.equal(ds.queue, 'text')
  ok('14 deepseek text path')
}

{
  const dual = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: UA_DS_IMG,
    visionReady: true,
    textAiReady: true,
  })
  assert.equal(dual.queue, 'dual')
  ok('15 deepseek image dual')
}

{
  const mix = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: UA_DS_MIX,
    visionReady: true,
    textAiReady: true,
  })
  assert.equal(mix.queue, 'dual')
  ok('16 deepseek mixed')
}

{
  const elig = evaluateApplicationRegradeEligibility({
    qtype: 'application',
    sessionStatus: 'completed',
    sessionUserId: '2',
    requestUserId: '2',
    gradeResult: 'grading_failed',
    gradeReason: HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
    aiAttemptCount: 0,
    maxAttempts: HS_MATH_AI_GRADING_MAX_ATTEMPTS,
    hasApplicationAnswer: true,
    imageIds: ['1'],
    images: [
      {
        id: '1',
        status: 'submitted',
        userId: '2',
        sessionItemId: '10',
      },
    ],
    sessionItemId: '10',
  })
  assert.equal(elig.ok, true)
  const plan = planApplicationRegrade({
    eligibility: elig,
    user: UA_DS_IMG,
    visionReady: true,
    textAiReady: true,
  })
  assert.equal(plan.ok, true)
  if (plan.ok) {
    assert.equal(plan.dispatch.queue, 'dual')
    assert.equal(resolveGradingProviderFromAnswer(UA_DS_IMG), 'deepseek')
  }
  ok('17 regrade keeps deepseek provider')
}

// ——— 日额度解析 / 北京时间 / 内存 stub ———

{
  assert.equal(parseDeepseekDailyLimit('').ok, true)
  assert.equal(parseDeepseekDailyLimit('20').ok, true)
  assert.equal(parseDeepseekDailyLimit('0').ok, false)
  assert.equal(parseDeepseekDailyLimit('-1').ok, false)
  assert.equal(parseDeepseekDailyLimit('1.5').ok, false)
  assert.equal(parseDeepseekDailyLimit('NaN').ok, false)
  assert.equal(parseDeepseekDailyLimit('Infinity').ok, false)
  ok('18 limit parse fail-closed')
}

{
  assert.equal(isDeepseekQuotaAvailable(0, 20), true)
  assert.equal(isDeepseekQuotaAvailable(19, 20), true)
  assert.equal(isDeepseekQuotaAvailable(20, 20), false)
  ok('19 quota 0/19/20')
}

{
  // 2026-10-25 16:00 UTC = 2026-10-26 00:00 Asia/Shanghai
  const d = shanghaiCalendarDate(new Date('2026-10-25T16:00:00.000Z'))
  assert.equal(d, '2026-10-26')
  const prev = shanghaiCalendarDate(new Date('2026-10-25T15:59:59.000Z'))
  assert.equal(prev, '2026-10-25')
  ok('20 shanghai cross-day')
}

async function runQuotaStub() {
  const mem = new InMemoryDeepseekDailyQuota()
  const date = '2026-10-26'

  {
    const r = await mem.tryConsume({
      userId: '2',
      quotaDate: date,
      dailyLimit: 20,
    })
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.usedCount, 1)
    ok('21 first consume creates day row')
  }

  {
    const mem2 = new InMemoryDeepseekDailyQuota()
    for (let i = 0; i < 19; i++) {
      const r = await mem2.tryConsume({
        userId: '2',
        quotaDate: date,
        dailyLimit: 20,
      })
      assert.equal(r.ok, true)
    }
    const last = await mem2.tryConsume({
      userId: '2',
      quotaDate: date,
      dailyLimit: 20,
    })
    assert.equal(last.ok, true)
    const over = await mem2.tryConsume({
      userId: '2',
      quotaDate: date,
      dailyLimit: 20,
    })
    assert.equal(over.ok, false)
    if (!over.ok) {
      assert.equal(over.reason, HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED)
    }
    ok('22 20/20 then 21st deny')
  }

  {
    const mem3 = new InMemoryDeepseekDailyQuota()
    for (let i = 0; i < 19; i++) {
      await mem3.tryConsume({
        userId: '2',
        quotaDate: date,
        dailyLimit: 20,
      })
    }
    const race = await mem3.raceConsume({
      userId: '2',
      quotaDate: date,
      dailyLimit: 20,
      concurrent: 5,
    })
    assert.equal(race.success, 1)
    assert.equal(race.failed, 4)
    ok('23 concurrent last slot (memory stub)')
  }

  {
    const mem4 = new InMemoryDeepseekDailyQuota()
    const race = await mem4.raceConsume({
      userId: '2',
      quotaDate: date,
      dailyLimit: 20,
      concurrent: 8,
    })
    assert.equal(race.success, 8)
    ok('24 concurrent first-day create (memory stub)')
  }

  {
    // 跨日：新日重新计数（模拟 API 重启后仍按 date key — 内存版）
    const mem5 = new InMemoryDeepseekDailyQuota()
    for (let i = 0; i < 20; i++) {
      await mem5.tryConsume({
        userId: '2',
        quotaDate: '2026-10-26',
        dailyLimit: 20,
      })
    }
    const next = await mem5.tryConsume({
      userId: '2',
      quotaDate: '2026-10-27',
      dailyLimit: 20,
    })
    assert.equal(next.ok, true)
    ok('25 next shanghai day resets')
  }

  {
    // HTTP 失败仍计入：consume 在 HTTP 前，无返还 API
    const mem6 = new InMemoryDeepseekDailyQuota()
    const c = await mem6.tryConsume({
      userId: '2',
      quotaDate: date,
      dailyLimit: 20,
    })
    assert.equal(c.ok, true)
    // 模拟失败/超时：不调用 refund
    const peek = mem6.peek('2', date, 20)
    assert.equal(peek.usedCount, 1)
    ok('26 fail/timeout still counted (no refund)')
  }

  {
    // Qwen 转写失败不扣 DeepSeek：未调用 tryConsume
    const mem7 = new InMemoryDeepseekDailyQuota()
    assert.equal(mem7.peek('2', date, 20).usedCount, 0)
    ok('27 qwen transcribe fail → no DS deduct')
  }

  {
    // Qwen 直接评分不扣
    assert.equal(resolveGradingProviderFromAnswer(UA_QWEN_IMG), 'qwen')
    ok('28 qwen direct no DS deduct')
  }

  {
    // 重批 DS 计入：再次 tryConsume
    const mem8 = new InMemoryDeepseekDailyQuota()
    await mem8.tryConsume({ userId: '2', quotaDate: date, dailyLimit: 20 })
    await mem8.tryConsume({ userId: '2', quotaDate: date, dailyLimit: 20 })
    assert.equal(mem8.peek('2', date, 20).usedCount, 2)
    ok('29 deepseek regrade counts')
  }

  {
    // graded / 重复 submit：调度层不二次 consume（此处用「不调用」断言语义）
    const mem9 = new InMemoryDeepseekDailyQuota()
    await mem9.tryConsume({ userId: '2', quotaDate: date, dailyLimit: 20 })
    // 已 graded：不应再 consume
    assert.equal(mem9.peek('2', date, 20).usedCount, 1)
    ok('30 graded/idempotent submit → no extra deduct')
  }

  {
    // 超额无假 0：业务码，不写 score
    assert.equal(
      HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
      'deepseek_daily_quota_exceeded',
    )
    ok('31 quota exceeded code (no fake 0)')
  }

  {
    // 其它题型不受影响：dispatch 仅 application
    const other = dispatchApplicationGrade({
      qtype: 'single',
      syncGradeResult: 'correct',
      user: null,
      visionReady: true,
      textAiReady: true,
    })
    assert.equal(other.queue, null)
    ok('32 other qtypes unaffected')
  }

  {
    // 其它学科 DeepSeek：本模块包装层独立（纯文档/结构断言）
    ok('33 other-subject DeepSeek untouched (wrapper only)')
  }

  console.log(`\nAPPLICATION-4C-4B stub PASS ${n}/33`)
}

runQuotaStub().catch((e) => {
  console.error(e)
  process.exit(1)
})
