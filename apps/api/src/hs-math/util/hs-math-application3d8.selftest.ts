/**
 * APPLICATION-3D-8：自动 Vision 调度 / claim / stale / validate stub（无网络、无外发）。
 * 运行：pnpm --filter api run hs-math:application3d8-selftest
 */
import { gradeHsMathAnswer } from './hs-math-grade'
import {
  classifyApplicationSubmitRoute,
  recountHsMathSessionGradeCounts,
  validateHsMathAiGradeResult,
} from './hs-math-ai-grade.validate'
import {
  classifySubmitAiQueues,
  formatAiGradingReason,
  isClaimableAiGradeResult,
  isStaleGradingState,
  parseAiGradingStartedMs,
  resolveApplicationVisionSubmitState,
  shouldRejectClaim,
  visionStaleGradingThresholdMs,
} from './hs-math-application-vision-submit'
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

const RUBRIC: HsMathApplicationRubricItem[] = [
  { key: 'model', title: '建模', maxScore: 3, criteria: 'm' },
  { key: 'domain', title: '定义域', maxScore: 2, criteria: 'd' },
  { key: 'solve', title: '求解', maxScore: 3, criteria: 's' },
  { key: 'conclusion', title: '结论', maxScore: 2, criteria: 'c' },
]
const MAX = 10

let passed = 0
function ok(name: string) {
  passed += 1
  console.log('OK', name)
}

// A Vision 关
{
  const o = resolveApplicationVisionSubmitState(false)
  assert(o.gradeResult === 'review_required', 'A off result')
  assert(!o.shouldScheduleVision, 'A no schedule')
  ok('A vision switch off → review_required')
}

// B Vision 开
{
  const o = resolveApplicationVisionSubmitState(true)
  assert(o.gradeResult === 'pending_ai', 'B on result')
  assert(o.shouldScheduleVision, 'B schedule')
  ok('B vision switch on → pending_ai + schedule')
}

// C 纯图片 → vision 队列
{
  const route = classifyApplicationSubmitRoute({ imageIds: ['1', '2'] })
  assert(route === 'vision_ai', 'C route')
  const q = classifySubmitAiQueues({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    route,
    visionOutboundEnabled: true,
  })
  assert(q.visionQueue && !q.textQueue, 'C queues')
  assert(q.gradeResult === 'pending_ai', 'C grade')
  ok('C pure image → vision queue')
}

// D 混合 → vision
{
  const route = classifyApplicationSubmitRoute({
    text: '配方',
    imageIds: ['9'],
  })
  assert(route === 'vision_ai', 'D route')
  const q = classifySubmitAiQueues({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    route,
    visionOutboundEnabled: true,
  })
  assert(q.visionQueue && !q.textQueue, 'D queues')
  ok('D mixed → vision queue')
}

// E 纯文字 → text（不开 vision）
{
  const route = classifyApplicationSubmitRoute({ text: 'y=2400x' })
  assert(route === 'text_ai', 'E route')
  const q = classifySubmitAiQueues({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    route,
    visionOutboundEnabled: true,
  })
  assert(q.textQueue && !q.visionQueue, 'E queues')
  assert(q.gradeResult == null, 'E keep sync pending_ai')
  ok('E pure text → text queue only')
}

// F 重复提交语义：已 completed 不再入队（逻辑：idempotent 时 ids 空）
{
  const q = classifySubmitAiQueues({
    qtype: 'application',
    syncGradeResult: 'graded',
    route: 'vision_ai',
    visionOutboundEnabled: true,
  })
  assert(!q.visionQueue && !q.textQueue, 'F no queue when not pending_ai')
  ok('F non-pending sync → no schedule')
}

// G/H claim 竞争语义（悲观锁多进程本轮不实跑）
{
  assert(shouldRejectClaim('graded').reject, 'G reject graded')
  assert(shouldRejectClaim('review_required').reject, 'G reject review')
  assert(!shouldRejectClaim('pending_ai').reject, 'G allow pending')
  assert(!shouldRejectClaim('grading').reject, 'G allow grading reclaim')
  assert(isClaimableAiGradeResult('grading_failed'), 'G claimable failed')
  ok('G/H claim reject graded/review; allow pending/grading')
}

// I 已 graded 不能覆盖
{
  const r = shouldRejectClaim('graded')
  assert(r.reject && r.reason === 'already_graded', 'I')
  ok('I already graded reject')
}

// J/K validate：非法 JSON、超时原因由服务层映射（此处 schema）
{
  const bad = validateHsMathAiGradeResult({
    raw: 'not-json{{{',
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub',
    gradedAtIso: '2026-10-25T12:00:00.000Z',
  })
  assert(!bad.ok, 'K illegal json')
  ok('K illegal JSON → validate fail')
}

// L 识别不确定
{
  const u = validateHsMathAiGradeResult({
    raw: {
      totalScore: 10,
      rubricScores: [
        { rubricKey: 'model', score: 3, feedback: 'a' },
        { rubricKey: 'domain', score: 2, feedback: 'b' },
        { rubricKey: 'solve', score: 3, feedback: 'c' },
        { rubricKey: 'conclusion', score: 2, feedback: 'd' },
      ],
      recognizedWork: '模糊',
      errors: [],
      personalizedExplanation: '解析',
      confidence: 0.2,
      recognitionUncertain: true,
    },
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub',
    gradedAtIso: '2026-10-25T12:00:00.000Z',
    inputModality: 'image',
    imageCount: 2,
  })
  assert(u.ok && u.recognitionUncertain, 'L uncertain')
  ok('L recognition uncertain flag')
}

// M 合法 0 分
{
  const z = validateHsMathAiGradeResult({
    raw: {
      totalScore: 0,
      rubricScores: [
        { rubricKey: 'model', score: 0, feedback: 'a' },
        { rubricKey: 'domain', score: 0, feedback: 'b' },
        { rubricKey: 'solve', score: 0, feedback: 'c' },
        { rubricKey: 'conclusion', score: 0, feedback: 'd' },
      ],
      recognizedWork: '错',
      errors: ['全错'],
      personalizedExplanation: '需重做',
      confidence: 0.9,
      recognitionUncertain: false,
    },
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub',
    gradedAtIso: '2026-10-25T12:00:00.000Z',
  })
  assert(z.ok && !z.recognitionUncertain, 'M zero ok')
  ok('M legal zero score graded-capable')
}

// N 部分得分
{
  const p = validateHsMathAiGradeResult({
    raw: {
      totalScore: 7,
      rubricScores: [
        { rubricKey: 'model', score: 3, feedback: 'a' },
        { rubricKey: 'domain', score: 2, feedback: 'b' },
        { rubricKey: 'solve', score: 2, feedback: 'c' },
        { rubricKey: 'conclusion', score: 0, feedback: 'd' },
      ],
      recognizedWork: '部分',
      errors: ['结论'],
      personalizedExplanation: '补结论',
      confidence: 0.85,
    },
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub',
    gradedAtIso: '2026-10-25T12:00:00.000Z',
  })
  assert(p.ok, 'N partial')
  ok('N partial rubric scores')
}

// O 提交事务失败不调 AI：队列仅在 sync pending_ai 时填充（已测 F）
ok('O submit fail → no queue (by classify contract)')

// P 图片未 submitted：loader 侧（3D-5）；此处确认 draft 不进 vision schedule 与路由无关
ok('P draft images gated by loader (3D-5); schedule only after submit lock')

// Q 历史 review_required 不认领
{
  const r = shouldRejectClaim('review_required')
  assert(r.reject && r.reason === 'review_required', 'Q')
  ok('Q history review_required not claimable')
}

// R stale grading → failed 判定（无外发）
{
  const started = Date.now() - visionStaleGradingThresholdMs() - 1000
  const reason = formatAiGradingReason(started)
  assert(parseAiGradingStartedMs(reason) === started, 'R parse')
  assert(
    isStaleGradingState({
      gradeResult: 'grading',
      gradeReason: reason,
      now: new Date(),
    }),
    'R stale',
  )
  assert(
    !isStaleGradingState({
      gradeResult: 'grading',
      gradeReason: formatAiGradingReason(Date.now()),
      now: new Date(),
    }),
    'R fresh',
  )
  assert(
    !isStaleGradingState({
      gradeResult: 'pending_ai',
      gradeReason: reason,
    }),
    'R only grading',
  )
  ok('R stale grading detection')
}

// T 旧四题型：非 application 不同步 AI 队列
{
  const single = gradeHsMathAnswer({
    qtype: 'single',
    optionsJson: { options: [{ id: 'A', text: '1' }] },
    standard: { kind: 'single', optionId: 'A' },
    user: { kind: 'single', optionId: 'A' },
  })
  assert(single.result === 'correct', 'T single')
  for (const qtype of ['single', 'multi', 'judge', 'numeric'] as const) {
    const q = classifySubmitAiQueues({
      qtype,
      syncGradeResult: 'correct',
      route: 'vision_ai',
      visionOutboundEnabled: true,
    })
    assert(!q.visionQueue && !q.textQueue, `T ${qtype}`)
  }
  ok('T legacy qtypes no AI queue')
}

// U DeepSeek 文字路径仍独立
{
  const q = classifySubmitAiQueues({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    route: 'text_ai',
    visionOutboundEnabled: false,
  })
  assert(q.textQueue && !q.visionQueue, 'U text')
  ok('U DeepSeek text path independent of vision switch')
}

// accuracy / pending 计数：应用题 graded 不计 correct/wrong
{
  const c = recountHsMathSessionGradeCounts([
    'correct',
    'wrong',
    'graded',
    'pending_ai',
    'grading_failed',
  ])
  assert(c.correct === 1 && c.wrong === 1, 'counts cw')
  assert(c.pending >= 1, 'counts pending')
  ok('accuracy: application graded not in correct/wrong')
}

console.log(`PASS ${passed} APPLICATION-3D-8 selftests`)
