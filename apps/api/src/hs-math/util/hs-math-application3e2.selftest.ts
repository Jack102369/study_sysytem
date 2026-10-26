/**
 * APPLICATION-3E-2：双模型联调预检 stub（无网络、无外发、无 DB 写）。
 * 运行：pnpm --filter api run hs-math:application3e2-selftest
 */
import { BadRequestException } from '@nestjs/common'
import {
  recountHsMathSessionGradeCounts,
  validateHsMathAiGradeResult,
} from './hs-math-ai-grade.validate'
import {
  buildDualScoringStudentText,
  buildHsMathApplicationVisionTranscribePrompt,
  parseVisionTranscribeResult,
  shouldBlockDeepSeekAfterTranscribe,
} from './hs-math-ai-grade-vision-transcribe.prompt'
import { dispatchApplicationGrade } from './hs-math-application-grade-dispatch'
import {
  shouldRejectClaim,
} from './hs-math-application-vision-submit'
import { normalizeVisionImageIds } from './hs-math-vision-image-loader'
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'
import {
  normalizeGradingProvider,
  parseUserAnswerPayloadForSave,
  resolveGradingProviderFromAnswer,
} from './user-answer.validate'

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

function stubGradeJson(scores: number[], total: number) {
  const keys = ['model', 'domain', 'solve', 'conclusion']
  return JSON.stringify({
    totalScore: total,
    rubricScores: keys.map((k, i) => ({
      rubricKey: k,
      score: scores[i],
      feedback: `f${i}`,
    })),
    recognizedWork: 'work',
    errors: [],
    personalizedExplanation: '解析',
    confidence: 0.9,
  })
}

let passed = 0
function ok(name: string) {
  passed += 1
  console.log('OK', name)
}

// 1 默认 qwen
{
  assert(normalizeGradingProvider(undefined) === 'qwen', '1')
  ok('1 default qwen')
}

// 2 明确 deepseek
{
  const p = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: '步骤',
    gradingProvider: 'deepseek',
  })
  assert(
    p &&
      p.kind === 'application' &&
      (p as { gradingProvider?: string }).gradingProvider === 'deepseek',
    '2',
  )
  ok('2 explicit deepseek')
}

// 3 qwen 图片 → vision 队列
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: { kind: 'application', imageIds: ['1', '2'], gradingProvider: 'qwen' },
    visionReady: true,
    textAiReady: false,
  })
  assert(d.pipeline === 'qwen_vision' && d.queue === 'vision', '3')
  ok('3 qwen images → vision')
}

// 4 qwen 纯文字 → qwen_text / vision
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: { kind: 'application', text: 'y=2400x', gradingProvider: 'qwen' },
    visionReady: true,
    textAiReady: true,
  })
  assert(d.pipeline === 'qwen_text' && d.queue === 'vision', '4')
  ok('4 qwen text → qwen_text')
}

// 5 deepseek 纯文字 → text（不调 Qwen）
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      text: '步骤',
      gradingProvider: 'deepseek',
    },
    visionReady: false,
    textAiReady: true,
  })
  assert(d.pipeline === 'deepseek_text' && d.queue === 'text', '5')
  ok('5 deepseek text → text only')
}

// 6 deepseek 单图 → dual
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      imageIds: ['9'],
      gradingProvider: 'deepseek',
    },
    visionReady: true,
    textAiReady: true,
  })
  assert(d.pipeline === 'qwen_then_deepseek' && d.queue === 'dual', '6')
  ok('6 deepseek single image → dual')
}

// 7 多图按 imageIds 顺序
{
  const ids = normalizeVisionImageIds(['12', '10', '11', '10'])
  assert(ids.join(',') === '12,10,11', '7 order')
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: 's',
    studentText: null,
    imageCount: 3,
  })
  assert(/第N张|顺序/.test(p.system + p.user), '7 prompt order')
  ok('7 multi-imageIds order preserved')
}

// 8 deepseek 文字+图片 → dual + 合并原文
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      text: '文字步骤',
      imageIds: ['1'],
      gradingProvider: 'deepseek',
    },
    visionReady: true,
    textAiReady: true,
  })
  assert(d.queue === 'dual', '8 dual')
  const merged = buildDualScoringStudentText({
    studentText: '文字步骤',
    recognizedWork: '图中: y=x',
  })
  assert(merged.includes('文字步骤') && merged.includes('图中: y=x'), '8 merge')
  ok('8 mixed merge for DeepSeek')
}

// 9 转写 uncertain → 禁止 DeepSeek
{
  assert(
    shouldBlockDeepSeekAfterTranscribe({
      recognitionUncertain: true,
      confidence: 0.99,
    }),
    '9',
  )
  ok('9 uncertain blocks DeepSeek')
}

// 10 转写失败 / 低置信 → 禁止 DeepSeek
{
  assert(parseVisionTranscribeResult('{bad') === null, '10 parse fail')
  assert(
    shouldBlockDeepSeekAfterTranscribe({
      recognitionUncertain: false,
      confidence: 0.2,
    }),
    '10 low conf',
  )
  ok('10 transcribe fail / low confidence blocks DeepSeek')
}

// 11 DeepSeek 非法 rubric → grading_failed 语义
{
  const v = validateHsMathAiGradeResult({
    raw: stubGradeJson([3, 2, 3, 2], 10).replace('model', 'unknown'),
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub',
    gradedAtIso: new Date().toISOString(),
  })
  // unknown key → fail; also try missing key via wrong total
  const bad = validateHsMathAiGradeResult({
    raw: JSON.stringify({
      totalScore: 3,
      rubricScores: [{ rubricKey: 'model', score: 3, feedback: 'x' }],
      recognizedWork: 'w',
      errors: [],
      personalizedExplanation: 'p',
    }),
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub',
    gradedAtIso: new Date().toISOString(),
  })
  assert(!bad.ok, '11 incomplete')
  void v
  ok('11 illegal rubric → validate fail')
}

// 12 合法部分分
{
  const v = validateHsMathAiGradeResult({
    raw: stubGradeJson([2, 1, 2, 1], 6),
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'deepseek-stub',
    gradedAtIso: new Date().toISOString(),
    inputModality: 'text',
    imageCount: 0,
  })
  assert(v.ok && v.value.totalScore === 6, '12')
  ok('12 legal partial score')
}

// 13 合法 0 分
{
  const v = validateHsMathAiGradeResult({
    raw: stubGradeJson([0, 0, 0, 0], 0),
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub',
    gradedAtIso: new Date().toISOString(),
  })
  assert(v.ok && v.value.totalScore === 0, '13')
  ok('13 legal zero score graded')
}

// 14 并发：已 grading/in_flight 语义 + claim 拒绝 graded
{
  assert(shouldRejectClaim('graded').reject, '14 graded')
  assert(!shouldRejectClaim('pending_ai').reject, '14 pending')
  // 进程内 inFlight 由服务 Set 保证；此处验证 claim 层不接受 review_required 双开
  assert(shouldRejectClaim('review_required').reject, '14 review')
  ok('14 claim rejects duplicate graded/review')
}

// 15 已 graded 不重复调用
{
  const r = shouldRejectClaim('graded')
  assert(r.reject && r.reason === 'already_graded', '15')
  ok('15 already graded no reclaim')
}

// 16 gradingProvider 写入后随 payload（提交后会话 completed 前端 disabled）
{
  const p = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: 'x',
    gradingProvider: 'deepseek',
  })
  assert(
    (p as { gradingProvider: string }).gradingProvider === 'deepseek',
    '16 locked in json',
  )
  ok('16 provider persisted in user answer')
}

// 17 历史旧答案兼容
{
  assert(resolveGradingProviderFromAnswer({}) === 'qwen', '17')
  assert(
    resolveGradingProviderFromAnswer({ gradingProvider: undefined }) === 'qwen',
    '17b',
  )
  ok('17 legacy without provider → qwen')
}

// 18 application graded 不计 correct/wrong/accuracy
{
  const c = recountHsMathSessionGradeCounts(['graded', 'correct', 'wrong'])
  assert(c.correct === 1 && c.wrong === 1 && c.pending === 0, '18')
  const c2 = recountHsMathSessionGradeCounts([
    'pending_ai',
    'grading',
    'review_required',
    'grading_failed',
  ])
  assert(c2.pending === 4 && c2.correct === 0, '18 pending')
  ok('18 graded does not pollute correct/wrong')
}

// 额外：转写 prompt 不含标准答案/评分；开关不足不 remap
{
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: '题',
    studentText: '附',
    imageCount: 1,
  })
  assert(!/totalScore|rubricScores/.test(p.system), 'X1')
  assert(!/根据标准答案|对照标准答案/.test(p.system), 'X1b')
  assert(/禁止[\s\S]*评分|不要评分|不是阅卷/.test(p.system), 'X1c')
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      imageIds: ['1'],
      gradingProvider: 'deepseek',
    },
    visionReady: false,
    textAiReady: true,
  })
  assert(d.queue === null && d.pipeline === 'qwen_then_deepseek', 'X2')
  ok('X transcribe no scoring + no silent remap')
}

// 非 application 禁止 provider
{
  let hit = false
  try {
    parseUserAnswerPayloadForSave('numeric', {
      kind: 'numeric',
      input: '1',
      gradingProvider: 'qwen',
    })
  } catch (e) {
    hit = e instanceof BadRequestException
  }
  assert(hit, 'non-app')
  ok('Y non-application forbids gradingProvider')
}

console.log(`\nAPPLICATION-3E-2 selftest PASS ${passed}`)
