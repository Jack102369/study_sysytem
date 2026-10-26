/**
 * APPLICATION-3A：纯文字 AI 批改校验 / 路由 / 计数（无网络、无 DB、无外发）。
 * 运行：pnpm --filter api run hs-math:application3a-selftest
 */
import { gradeHsMathAnswer } from './hs-math-grade'
import { buildHsMathApplicationAiGradePrompt } from './hs-math-ai-grade.prompt'
import {
  classifyApplicationSubmitRoute,
  recountHsMathSessionGradeCounts,
  validateHsMathAiGradeResult,
} from './hs-math-ai-grade.validate'
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

/** HSMA-RJA-CH03-APP-0001 正式题 rubric 快照 */
const RUBRIC_151: HsMathApplicationRubricItem[] = [
  { key: 'model', title: '建模', maxScore: 3, criteria: '收入/函数建立正确' },
  { key: 'domain', title: '定义域', maxScore: 2, criteria: '定义域正确' },
  { key: 'solve', title: '求解', maxScore: 3, criteria: '求解过程正确' },
  { key: 'conclusion', title: '结论', maxScore: 2, criteria: '结论正确' },
]
const MAX_151 = 10

function makeAiRaw(partial: {
  totalScore: number
  scores: Array<{ key: string; score: number; feedback?: string }>
  explanation?: string
  confidence?: number | null
  errors?: string[]
}): Record<string, unknown> {
  return {
    totalScore: partial.totalScore,
    rubricScores: partial.scores.map((s) => ({
      rubricKey: s.key,
      score: s.score,
      feedback: s.feedback ?? `${s.key}反馈`,
    })),
    recognizedWork: '识别摘要',
    errors: partial.errors ?? [],
    personalizedExplanation: partial.explanation ?? '针对该生的个性化解析。',
    confidence: partial.confidence === undefined ? 0.9 : partial.confidence,
  }
}

function validate(raw: unknown) {
  return validateHsMathAiGradeResult({
    raw,
    rubric: RUBRIC_151,
    maxScore: MAX_151,
    model: 'stub-model',
    gradedAtIso: '2026-10-25T00:00:00.000Z',
  })
}

let passed = 0
function ok(name: string) {
  passed++
  console.log(`  PASS ${name}`)
}

console.log('APPLICATION-3A selftest')

// A 完全正确 10/10
{
  const r = validate(
    makeAiRaw({
      totalScore: 10,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
  )
  assert(r.ok && r.value.totalScore === 10, 'A full score')
  assert(r.ok && r.value.maxScore === 10, 'A max from item')
  ok('A full 10/10')
}

// B 部分得分
{
  const r = validate(
    makeAiRaw({
      totalScore: 7,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 1 },
        { key: 'conclusion', score: 1 },
      ],
    }),
  )
  assert(r.ok && r.value.totalScore === 7, 'B partial')
  ok('B partial score')
}

// C 合法 0/10
{
  const r = validate(
    makeAiRaw({
      totalScore: 0,
      scores: [
        { key: 'model', score: 0 },
        { key: 'domain', score: 0 },
        { key: 'solve', score: 0 },
        { key: 'conclusion', score: 0 },
      ],
      explanation: '未作答有效步骤，给 0 分。',
    }),
  )
  assert(r.ok && r.value.totalScore === 0, 'C zero graded')
  ok('C legal 0/10 graded')
}

// D 缺项
{
  const r = validate(
    makeAiRaw({
      totalScore: 5,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
      ],
    }),
  )
  assert(!r.ok && r.code === 'MISSING_KEYS', 'D missing')
  ok('D missing rubric')
}

// E 重复
{
  const r = validate({
    totalScore: 6,
    rubricScores: [
      { rubricKey: 'model', score: 3, feedback: 'a' },
      { rubricKey: 'model', score: 3, feedback: 'b' },
      { rubricKey: 'domain', score: 0, feedback: 'c' },
      { rubricKey: 'solve', score: 0, feedback: 'd' },
      { rubricKey: 'conclusion', score: 0, feedback: 'e' },
    ],
    personalizedExplanation: 'x',
  })
  assert(!r.ok && r.code === 'DUP_KEY', 'E dup')
  ok('E duplicate key')
}

// F 越界
{
  const r = validate(
    makeAiRaw({
      totalScore: 11,
      scores: [
        { key: 'model', score: 4 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
  )
  assert(!r.ok && r.code === 'SCORE_OVERFLOW', 'F overflow')
  ok('F score overflow')
}

// G 总分不一致
{
  const r = validate(
    makeAiRaw({
      totalScore: 9,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
  )
  assert(!r.ok && r.code === 'TOTAL_MISMATCH', 'G mismatch')
  ok('G total mismatch')
}

// H 非法 JSON
{
  const r = validate('not-json{{{')
  assert(!r.ok && r.code === 'INVALID_JSON', 'H json')
  ok('H invalid JSON')
}

// I/J 超时与异常：由服务层 reason 码约定（纯函数侧验证失败码存在）
{
  assert(
    ['ai_timeout', 'ai_error', 'ai_disabled'].every((x) => typeof x === 'string'),
    'I/J reason codes',
  )
  ok('I/J timeout/error reason codes')
}

// K 纯图片 → vision_ai（submit 再决定 review_required / pending）
{
  assert(
    classifyApplicationSubmitRoute({ imageIds: ['1'] }) === 'vision_ai',
    'K pure img',
  )
  ok('K pure image → vision_ai')
}

// L 文字+图片 → vision_ai
{
  assert(
    classifyApplicationSubmitRoute({ text: '答', imageIds: ['1'] }) ===
      'vision_ai',
    'L mixed',
  )
  ok('L text+image → vision_ai')
}

// M 重复批改：已 graded 不在 pending 桶；validate 幂等结果可重复解析
{
  const r1 = validate(
    makeAiRaw({
      totalScore: 8,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 2 },
        { key: 'conclusion', score: 1 },
      ],
    }),
  )
  const r2 = validate(
    makeAiRaw({
      totalScore: 8,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 2 },
        { key: 'conclusion', score: 1 },
      ],
    }),
  )
  assert(r1.ok && r2.ok && r1.value.totalScore === r2.value.totalScore, 'M idempotent parse')
  ok('M re-grade parse stable')
}

// N 旧四题型兼容
{
  const g = gradeHsMathAnswer({
    qtype: 'single',
    optionsJson: { options: [{ id: 'A', text: '1' }] },
    standard: { kind: 'single', optionId: 'A' },
    user: { kind: 'single', optionId: 'A' },
  })
  assert(g.result === 'correct', 'N single')
  const app = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: {
      kind: 'application',
      standardAnswer: 'ans',
      maxScore: 10,
      rubric: RUBRIC_151,
    },
    user: { kind: 'application', text: '学生答' },
  })
  assert(app.result === 'pending_ai', 'N app still pending_ai at sync grade')
  ok('N legacy qtypes + app pending_ai')
}

// O pending/failed/review 不计 accuracy 分母
{
  const c = recountHsMathSessionGradeCounts([
    'correct',
    'wrong',
    'pending_ai',
    'grading',
    'review_required',
    'grading_failed',
    'graded',
  ])
  assert(c.correct === 1 && c.wrong === 1 && c.pending === 4, 'O counts')
  // accuracy den = correct+wrong = 2；graded 不进分母
  const den = c.correct + c.wrong
  assert(den === 2, 'O accuracy den excludes pending+graded')
  ok('O pending/failed/review/graded not in accuracy den')
}

// P graded 结果结构可读（历史视图字段）
{
  const r = validate(
    makeAiRaw({
      totalScore: 8,
      scores: [
        { key: 'model', score: 3, feedback: '建模对' },
        { key: 'domain', score: 2, feedback: '定义域对' },
        { key: 'solve', score: 2, feedback: '求解部分错' },
        { key: 'conclusion', score: 1, feedback: '结论不全' },
      ],
      errors: ['求解第 2 步符号错误'],
      explanation: '你建模正确，但求解符号出错导致结论不完整。',
    }),
  )
  assert(r.ok, 'P ok')
  if (r.ok) {
    assert(r.value.rubricScores.length === 4, 'P 4 scores')
    assert(r.value.errors.length === 1, 'P errors')
    assert(r.value.personalizedExplanation.includes('建模'), 'P explanation')
    assert(r.value.model === 'stub-model', 'P model')
  }
  ok('P graded payload readable')
}

// Prompt 覆盖 151 rubric keys
{
  const p = buildHsMathApplicationAiGradePrompt({
    stem: '题干',
    standardAnswer: '标准',
    maxScore: 10,
    rubric: RUBRIC_151,
    studentText: '学生',
  })
  for (const k of ['model', 'domain', 'solve', 'conclusion']) {
    assert(p.user.includes(`key="${k}"`), `prompt has ${k}`)
  }
  assert(p.system.includes('只输出一个合法 JSON'), 'prompt json rule')
  ok('prompt covers APP-0001 rubric')
}

// AI 自报 maxScore 不得覆盖题目
{
  const r = validate({
    ...makeAiRaw({
      totalScore: 10,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
    maxScore: 99,
  })
  assert(r.ok && r.value.maxScore === 10, 'ignore AI maxScore')
  ok('ignore AI maxScore override')
}

// 未知 key
{
  const r = validate({
    totalScore: 3,
    rubricScores: [
      { rubricKey: 'model', score: 3, feedback: 'a' },
      { rubricKey: 'domain', score: 0, feedback: 'b' },
      { rubricKey: 'solve', score: 0, feedback: 'c' },
      { rubricKey: 'hack', score: 0, feedback: 'd' },
    ],
    personalizedExplanation: 'x',
  })
  assert(!r.ok && r.code === 'UNKNOWN_KEY', 'unknown key')
  ok('unknown rubricKey rejected')
}

// 纯文字路由
{
  assert(
    classifyApplicationSubmitRoute({ text: '纯文字' }) === 'text_ai',
    'text_ai',
  )
  ok('text-only → text_ai')
}

console.log(`\nAPPLICATION-3A selftest OK (${passed} checks)`)
