/**
 * APPLICATION-3E-1：双模型批改调度 / provider 校验 / 转写解析 stub（无网络、无外发）。
 * 运行：pnpm --filter api run hs-math:application3e1-selftest
 */
import { BadRequestException } from '@nestjs/common'
import { dispatchApplicationGrade } from './hs-math-application-grade-dispatch'
import {
  buildHsMathApplicationVisionTranscribePrompt,
  parseVisionTranscribeResult,
} from './hs-math-ai-grade-vision-transcribe.prompt'
import {
  normalizeGradingProvider,
  parseUserAnswerPayloadForSave,
  resolveGradingProviderFromAnswer,
} from './user-answer.validate'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

let passed = 0
function ok(name: string) {
  passed += 1
  console.log('OK', name)
}

// A 缺省 provider → qwen
{
  assert(normalizeGradingProvider(undefined) === 'qwen', 'A default')
  assert(normalizeGradingProvider('') === 'qwen', 'A empty')
  assert(resolveGradingProviderFromAnswer({}) === 'qwen', 'A resolve old')
  ok('A default gradingProvider = qwen')
}

// B 非法 provider → 400
{
  let hit = false
  try {
    normalizeGradingProvider('openai')
  } catch (e) {
    hit = e instanceof BadRequestException
  }
  assert(hit, 'B bad provider')
  ok('B illegal gradingProvider → 400')
}

// C 非 application 禁止 gradingProvider
{
  let hit = false
  try {
    parseUserAnswerPayloadForSave('single', {
      kind: 'single',
      optionId: 'A',
      gradingProvider: 'qwen',
    })
  } catch (e) {
    hit = e instanceof BadRequestException
  }
  assert(hit, 'C non-app')
  ok('C non-application forbids gradingProvider')
}

// D 新 application 答案写入默认 qwen
{
  const p = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: '建模 y=2400x',
  })
  assert(p && p.kind === 'application', 'D kind')
  assert(
    (p as { gradingProvider?: string }).gradingProvider === 'qwen',
    'D default written',
  )
  ok('D save defaults gradingProvider=qwen')
}

// E qwen + 有图 + vision 开 → vision 队列
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: { kind: 'application', imageIds: ['1'], gradingProvider: 'qwen' },
    visionReady: true,
    textAiReady: false,
  })
  assert(d.pipeline === 'qwen_vision', 'E pipe')
  assert(d.queue === 'vision', 'E queue')
  assert(d.gradeResult === 'pending_ai', 'E pending')
  ok('E qwen+images → vision queue')
}

// F qwen 纯文字 + vision 开 → vision 队列（qwen_text）
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: { kind: 'application', text: '步骤', gradingProvider: 'qwen' },
    visionReady: true,
    textAiReady: true,
  })
  assert(d.pipeline === 'qwen_text', 'F pipe')
  assert(d.queue === 'vision', 'F queue')
  assert(d.gradeReason === 'awaiting_qwen_text_ai', 'F reason')
  ok('F qwen text-only → vision/qwen_text')
}

// G qwen + vision 关 → review_required，不静默改 deepseek
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: { kind: 'application', text: '步骤', gradingProvider: 'qwen' },
    visionReady: false,
    textAiReady: true,
  })
  assert(d.queue === null, 'G no queue')
  assert(d.gradeResult === 'review_required', 'G rr')
  assert(d.pipeline === 'qwen_text', 'G keep pipeline')
  ok('G qwen switch off → review_required (no remap)')
}

// H deepseek 纯文字 + AI 开 → text 队列
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
  assert(d.pipeline === 'deepseek_text', 'H pipe')
  assert(d.queue === 'text', 'H queue')
  ok('H deepseek text → text queue')
}

// I deepseek 纯文字 + AI 关 → review_required
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      text: '步骤',
      gradingProvider: 'deepseek',
    },
    visionReady: true,
    textAiReady: false,
  })
  assert(d.queue === null, 'I no queue')
  assert(d.gradeResult === 'review_required', 'I rr')
  assert(d.gradeReason === 'awaiting_text_ai', 'I reason')
  ok('I deepseek text AI off → review_required')
}

// J deepseek + 有图 + 双开 → dual
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      imageIds: ['9'],
      text: '附注',
      gradingProvider: 'deepseek',
    },
    visionReady: true,
    textAiReady: true,
  })
  assert(d.pipeline === 'qwen_then_deepseek', 'J pipe')
  assert(d.queue === 'dual', 'J queue')
  ok('J deepseek+images → dual')
}

// K deepseek + 有图 + Vision 关 → review_required（不改 qwen）
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      imageIds: ['9'],
      gradingProvider: 'deepseek',
    },
    visionReady: false,
    textAiReady: true,
  })
  assert(d.queue === null, 'K no queue')
  assert(d.gradeResult === 'review_required', 'K rr')
  assert(d.pipeline === 'qwen_then_deepseek', 'K pipe kept')
  ok('K deepseek+images vision off → review_required')
}

// L 转写 prompt 不含评分字段要求（仅识别）
{
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: '题干',
    studentText: null,
    imageCount: 2,
  })
  assert(!/totalScore|rubricScores/i.test(p.system), 'L no score keys')
  assert(/recognizedWork/.test(p.system), 'L has recognizedWork')
  ok('L transcribe prompt no scoring')
}

// M 转写 uncertain → 可解析且 flag
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: 'y=2400x',
      recognitionUncertain: true,
      recognitionWarnings: ['模糊'],
      confidence: 0.4,
    }),
  )
  assert(t && t.recognitionUncertain, 'M uncertain')
  assert(t!.recognizedWork === 'y=2400x', 'M work')
  ok('M parse uncertain transcribe')
}

// N 转写缺 recognizedWork → null
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({ recognitionUncertain: false, confidence: 1 }),
  )
  assert(t === null, 'N null')
  ok('N missing recognizedWork → null')
}

// O 旧答案无 provider → resolve qwen（不改写）
{
  assert(
    resolveGradingProviderFromAnswer({
      gradingProvider: undefined,
    }) === 'qwen',
    'O',
  )
  ok('O legacy answer resolves qwen')
}

console.log(`\nAPPLICATION-3E-1 selftest PASS ${passed}`)
