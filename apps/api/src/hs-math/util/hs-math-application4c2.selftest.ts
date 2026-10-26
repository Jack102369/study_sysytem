/**
 * APPLICATION-4C-2：重新申请 AI 批改（纯函数 stub，无 HTTP / 无写库）。
 */
import assert from 'node:assert/strict'
import { HS_MATH_AI_GRADING_MAX_ATTEMPTS } from '../hs-math.constants'
import {
  evaluateApplicationRegradeEligibility,
  isAwaitingAiNotScheduledReason,
  planApplicationRegrade,
  simulateConcurrentRegradeAttempts,
  type HsMathRegradeEligibilityInput,
} from './hs-math-application-regrade'
/** 与前端 canShowApplicationAiScore 一致 */
function canShowScore(gradeResult: string | null | undefined): boolean {
  return gradeResult === 'graded'
}

let n = 0
function ok(name: string) {
  n += 1
  console.log('OK', name)
}

const SESSION126: HsMathRegradeEligibilityInput = {
  qtype: 'application',
  sessionStatus: 'completed',
  sessionUserId: '2',
  requestUserId: '2',
  gradeResult: 'review_required',
  gradeReason: 'awaiting_multimodal',
  aiAttemptCount: 0,
  maxAttempts: HS_MATH_AI_GRADING_MAX_ATTEMPTS,
  hasApplicationAnswer: true,
  imageIds: ['55', '56'],
  images: [
    {
      id: '55',
      status: 'submitted',
      userId: '2',
      sessionItemId: '349',
    },
    {
      id: '56',
      status: 'submitted',
      userId: '2',
      sessionItemId: '349',
    },
  ],
  sessionItemId: '349',
}

const UA_DS_IMG = {
  kind: 'application' as const,
  imageIds: ['55', '56'],
  gradingProvider: 'deepseek' as const,
}

const UA_QWEN = {
  kind: 'application' as const,
  imageIds: ['55'],
  gradingProvider: 'qwen' as const,
}

const UA_DS_TEXT = {
  kind: 'application' as const,
  text: 'y=-30(x-40)^2+48000',
  gradingProvider: 'deepseek' as const,
}

// 1 session 126 fixture 可申请
{
  const e = evaluateApplicationRegradeEligibility(SESSION126)
  assert.equal(e.ok, true)
  ok('1 session126 fixture eligible')
}

// 2 awaiting_multimodal 可申请
{
  assert.equal(isAwaitingAiNotScheduledReason('awaiting_multimodal'), true)
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeReason: 'awaiting_multimodal',
  })
  assert.equal(e.ok, true)
  ok('2 awaiting_multimodal eligible')
}

// 3 AI 关闭拒绝
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_IMG,
    visionReady: false,
    textAiReady: false,
  })
  assert.equal(plan.ok, false)
  if (!plan.ok) assert.equal(plan.code, 'AI_GRADING_DISABLED')
  ok('3 AI off reject')
}

// 4 AI 关闭不产生 pending 规划（调用方不得写库）
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_IMG,
    visionReady: false,
    textAiReady: true,
  })
  assert.equal(plan.ok, false)
  if (!plan.ok) assert.equal(plan.code, 'AI_GRADING_DISABLED')
  ok('4 AI off no pending plan')
}

// 5 AI 关闭「HTTP=0」语义：无 queue
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_IMG,
    visionReady: false,
    textAiReady: false,
  })
  assert.ok(!plan.ok || !('dispatch' in plan && plan.dispatch.queue))
  ok('5 AI off no queue (HTTP=0)')
}

// 6 graded 拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeResult: 'graded',
    gradeReason: 'ai_graded',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'ALREADY_GRADED')
  ok('6 graded reject')
}

// 7 pending_ai 拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeResult: 'pending_ai',
    gradeReason: 'awaiting_qwen_then_deepseek',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'ALREADY_PENDING')
  ok('7 pending_ai reject')
}

// 8 grading 拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeResult: 'grading',
    gradeReason: 'ai_grading:1',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'ALREADY_GRADING')
  ok('8 grading reject')
}

// 9 recognition_uncertain 拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeReason: 'recognition_uncertain',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'RECOGNITION_BLOCKED')
  ok('9 recognition_uncertain reject')
}

// 10 low_confidence 拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeReason: 'low_confidence',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'RECOGNITION_BLOCKED')
  ok('10 low_confidence reject')
}

// 11 critical_warning 拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeReason: 'critical_recognition_warning',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'RECOGNITION_BLOCKED')
  ok('11 critical_warning reject')
}

// 12 其他题型拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    qtype: 'numeric',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'NOT_APPLICATION')
  ok('12 non-application reject')
}

// 13 跨用户拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    requestUserId: '99',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'FORBIDDEN_OWNER')
  ok('13 cross-user reject')
}

// 14 未登录语义：空 userId
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    requestUserId: '',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'FORBIDDEN_OWNER')
  ok('14 empty user reject')
}

// 15 session 未完成拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    sessionStatus: 'in_progress',
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'SESSION_NOT_COMPLETED')
  ok('15 session not completed')
}

// 16 图片未 submitted 拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    images: [
      { id: '55', status: 'draft', userId: '2', sessionItemId: '349' },
      { id: '56', status: 'submitted', userId: '2', sessionItemId: '349' },
    ],
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'IMAGES_NOT_SUBMITTED')
  ok('16 images not submitted')
}

// 17 双击幂等：第二次 ALREADY_PENDING
{
  const { first, second } = simulateConcurrentRegradeAttempts({
    base: SESSION126,
    user: UA_DS_IMG,
    visionReady: true,
    textAiReady: true,
  })
  assert.equal(first.ok, true)
  assert.equal(second.ok, false)
  if (!second.ok) assert.equal(second.code, 'ALREADY_PENDING')
  ok('17 double-click idempotent')
}

// 18 并发请求不重复外发（同 17：仅第一次有 queue）
{
  const { first, second } = simulateConcurrentRegradeAttempts({
    base: SESSION126,
    user: UA_DS_IMG,
    visionReady: true,
    textAiReady: true,
  })
  assert.ok(first.ok && first.dispatch.queue === 'dual')
  assert.equal(second.ok, false)
  ok('18 concurrent no duplicate queue')
}

// 19 qwen 路径
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_QWEN,
    visionReady: true,
    textAiReady: false,
  })
  assert.equal(plan.ok, true)
  if (plan.ok) {
    assert.equal(plan.dispatch.queue, 'vision')
    assert.equal(plan.dispatch.pipeline, 'qwen_vision')
  }
  ok('19 qwen vision path')
}

// 20 deepseek 图片双阶段
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_IMG,
    visionReady: true,
    textAiReady: true,
  })
  assert.equal(plan.ok, true)
  if (plan.ok) {
    assert.equal(plan.dispatch.queue, 'dual')
    assert.equal(plan.dispatch.pipeline, 'qwen_then_deepseek')
    assert.deepEqual(UA_DS_IMG.imageIds, ['55', '56'])
  }
  ok('20 deepseek dual path')
}

// 21 deepseek 纯文字
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_TEXT,
    visionReady: false,
    textAiReady: true,
  })
  assert.equal(plan.ok, true)
  if (plan.ok) {
    assert.equal(plan.dispatch.queue, 'text')
    assert.equal(plan.dispatch.pipeline, 'deepseek_text')
  }
  ok('21 deepseek text path')
}

// 22 gradingProvider 锁定（规划不改 user）
{
  const user = { ...UA_DS_IMG }
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user,
    visionReady: true,
    textAiReady: true,
  })
  assert.equal(plan.ok, true)
  assert.equal(user.gradingProvider, 'deepseek')
  ok('22 provider locked')
}

// 23 imageIds 顺序不变
{
  const user = {
    kind: 'application' as const,
    imageIds: ['55', '56'],
    gradingProvider: 'deepseek' as const,
  }
  planApplicationRegrade({
    eligibility: { ok: true },
    user,
    visionReady: true,
    textAiReady: true,
  })
  assert.deepEqual(user.imageIds, ['55', '56'])
  ok('23 imageIds order unchanged')
}

// 24 rubric 部分分合法：重批成功态仍仅 graded 可展示分
{
  assert.equal(canShowScore('pending_ai'), false)
  assert.equal(canShowScore('review_required'), false)
  assert.equal(canShowScore('graded'), true)
  ok('24 no fake score until graded')
}

// 25 不污染统计：pending 规划不写分
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_IMG,
    visionReady: true,
    textAiReady: true,
  })
  assert.ok(plan.ok && plan.nextGradeResult === 'pending_ai')
  assert.equal(canShowScore(plan.nextGradeResult), false)
  ok('25 pending not scored')
}

// 26 历史刷新不自动重批：资格函数无副作用（两次调用仍 eligible）
{
  const a = evaluateApplicationRegradeEligibility(SESSION126)
  const b = evaluateApplicationRegradeEligibility(SESSION126)
  assert.equal(a.ok, true)
  assert.equal(b.ok, true)
  ok('26 refresh not auto-regrade')
}

// 27 重批失败无假 0：AI off / 拒绝后仍非 graded
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_IMG,
    visionReady: false,
    textAiReady: false,
  })
  assert.equal(plan.ok, false)
  assert.equal(canShowScore('review_required'), false)
  ok('27 fail no fake 0')
}

// 28 重批成功可持久化语义：产出 pending_ai + reason + queue
{
  const plan = planApplicationRegrade({
    eligibility: { ok: true },
    user: UA_DS_IMG,
    visionReady: true,
    textAiReady: true,
  })
  assert.equal(plan.ok, true)
  if (plan.ok) {
    assert.equal(plan.nextGradeResult, 'pending_ai')
    assert.ok(plan.nextGradeReason)
    assert.equal(plan.dispatch.queue, 'dual')
  }
  ok('28 success plan persistable')
}

// 29 grading_failed 可重试
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeResult: 'grading_failed',
    gradeReason: 'timeout',
    aiAttemptCount: 1,
  })
  assert.equal(e.ok, true)
  ok('29 grading_failed retryable')
}

// 30 grading_failed 达上限拒绝
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    gradeResult: 'grading_failed',
    gradeReason: 'max_attempts',
    aiAttemptCount: HS_MATH_AI_GRADING_MAX_ATTEMPTS,
  })
  assert.equal(e.ok, false)
  if (!e.ok) assert.equal(e.code, 'MAX_ATTEMPTS')
  ok('30 max attempts reject')
}

// 31 awaiting_text_ai 可申请
{
  const e = evaluateApplicationRegradeEligibility({
    ...SESSION126,
    imageIds: [],
    images: [],
    gradeReason: 'awaiting_text_ai',
  })
  assert.equal(e.ok, true)
  ok('31 awaiting_text_ai eligible')
}

console.log(`PASS ${n}/31 APPLICATION-4C-2 regrade selftests`)
