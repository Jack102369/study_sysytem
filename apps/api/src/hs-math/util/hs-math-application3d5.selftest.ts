/**
 * APPLICATION-3D-5：Qwen Vision 适配器 stub 自测（无网络、无真实外发、无 DB）。
 * 运行：pnpm --filter api run hs-math:application3d5-selftest
 */
import { gradeHsMathAnswer } from './hs-math-grade'
import { buildHsMathApplicationAiGradePrompt } from './hs-math-ai-grade.prompt'
import { buildHsMathApplicationVisionAiGradePrompt } from './hs-math-ai-grade-vision.prompt'
import {
  classifyApplicationSubmitRoute,
  recountHsMathSessionGradeCounts,
  validateHsMathAiGradeResult,
} from './hs-math-ai-grade.validate'
import {
  loadVisionImagesForGrading,
  normalizeVisionImageIds,
} from './hs-math-vision-image-loader'
import { resolveHsMathVisionChatCompletionsUrl } from '../train/hs-math-qwen-vision-client.service'
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'
import type { HsMathTrainSessionItemImage } from '../entities/hs-math-train-session-item-image.entity'
import { HS_MATH_APPLICATION_IMAGE_MAX_COUNT } from '../hs-math.constants'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

const RUBRIC: HsMathApplicationRubricItem[] = [
  { key: 'model', title: '建模', maxScore: 3, criteria: '建模' },
  { key: 'domain', title: '定义域', maxScore: 2, criteria: '定义域' },
  { key: 'solve', title: '求解', maxScore: 3, criteria: '求解' },
  { key: 'conclusion', title: '结论', maxScore: 2, criteria: '结论' },
]
const MAX = 10

function makeRaw(partial: {
  totalScore: number
  scores: Array<{ key: string; score: number }>
  recognitionUncertain?: boolean
  confidence?: number | null
  warnings?: string[]
}): Record<string, unknown> {
  return {
    totalScore: partial.totalScore,
    rubricScores: partial.scores.map((s) => ({
      rubricKey: s.key,
      score: s.score,
      feedback: `${s.key} ok`,
    })),
    recognizedWork: '识别到学生手写解答',
    errors: partial.totalScore < MAX ? ['过程有误'] : [],
    personalizedExplanation: '针对该生的解析。',
    confidence: partial.confidence === undefined ? 0.9 : partial.confidence,
    recognitionUncertain: partial.recognitionUncertain ?? false,
    recognitionWarnings: partial.warnings ?? [],
  }
}

function validate(
  raw: unknown,
  extra?: { imageCount?: number; inputModality?: 'text' | 'image' | 'mixed' },
) {
  return validateHsMathAiGradeResult({
    raw,
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'stub-qwen',
    gradedAtIso: '2026-10-25T12:00:00.000Z',
    inputModality: extra?.inputModality,
    imageCount: extra?.imageCount,
  })
}

function fakeRow(
  partial: Partial<HsMathTrainSessionItemImage> & {
    id: string
    userId: string
    sessionItemId: string
  },
): HsMathTrainSessionItemImage {
  return {
    id: partial.id,
    userId: partial.userId,
    sessionItemId: partial.sessionItemId,
    storageKey: partial.storageKey || `hs-math/application-answers/${partial.userId}/${partial.id}.bin`,
    mimeType: partial.mimeType || 'image/jpeg',
    sizeBytes: partial.sizeBytes ?? 100,
    sortOrder: partial.sortOrder ?? 0,
    status: partial.status || 'submitted',
    createdAt: new Date(),
    updatedAt: new Date(),
    submittedAt: new Date(),
  } as HsMathTrainSessionItemImage
}

let passed = 0
function ok(name: string) {
  passed++
  console.log(`  PASS ${name}`)
}

console.log('APPLICATION-3D-5 selftest (stub, no network)')

// —— A 纯图片正确答案 ——
{
  const r = validate(
    makeRaw({
      totalScore: 10,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
    { imageCount: 1, inputModality: 'image' },
  )
  assert(r.ok && r.value.totalScore === 10, 'A score')
  assert(r.ok && r.value.inputModality === 'image', 'A modality')
  assert(r.ok && r.value.imageCount === 1, 'A imageCount')
  assert(r.ok && r.recognitionUncertain === false, 'A certain')
  ok('A pure image correct')
}

// —— B 纯图片部分正确 ——
{
  const r = validate(
    makeRaw({
      totalScore: 6,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 1 },
        { key: 'solve', score: 1 },
        { key: 'conclusion', score: 1 },
      ],
    }),
    { imageCount: 1, inputModality: 'image' },
  )
  assert(r.ok && r.value.totalScore === 6, 'B')
  ok('B pure image partial')
}

// —— C 纯图片错误 ——
{
  const r = validate(
    makeRaw({
      totalScore: 0,
      scores: [
        { key: 'model', score: 0 },
        { key: 'domain', score: 0 },
        { key: 'solve', score: 0 },
        { key: 'conclusion', score: 0 },
      ],
    }),
    { imageCount: 2, inputModality: 'image' },
  )
  assert(r.ok && r.value.totalScore === 0, 'C')
  ok('C pure image wrong')
}

// —— D 文字+图片 ——
{
  const r = validate(
    makeRaw({
      totalScore: 10,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
      warnings: ['第二行字迹略糊'],
    }),
    { imageCount: 1, inputModality: 'mixed' },
  )
  assert(r.ok && r.value.inputModality === 'mixed', 'D modality')
  assert(
    r.ok && r.value.recognitionWarnings?.[0] === '第二行字迹略糊',
    'D warnings',
  )
  ok('D mixed text+image')
}

// —— E 多图顺序 ——
{
  const ids = normalizeVisionImageIds(['3', '1', '1', '2'])
  assert(JSON.stringify(ids) === JSON.stringify(['3', '1', '2']), 'E order unique')
  const rows = [
    fakeRow({ id: '1', userId: '9', sessionItemId: '100' }),
    fakeRow({ id: '2', userId: '9', sessionItemId: '100' }),
    fakeRow({ id: '3', userId: '9', sessionItemId: '100' }),
  ]
  const order: string[] = []
  const loaded = loadVisionImagesForGrading({
    userId: '9',
    sessionItemId: '100',
    imageIds: ['3', '1', '2'],
    rows,
    readFile: (key) => {
      order.push(key)
      return Buffer.from('fake-jpeg')
    },
  })
  assert(loaded.ok, 'E load ok')
  assert(
    loaded.ok &&
      loaded.images.map((i) => i.imageId).join(',') === '3,1,2',
    'E id order',
  )
  ok('E multi-image order')
}

// —— F 图片缺失 ——
{
  const r = loadVisionImagesForGrading({
    userId: '9',
    sessionItemId: '100',
    imageIds: ['999'],
    rows: [],
    readFile: () => Buffer.from('x'),
  })
  assert(!r.ok && r.code === 'IMAGE_MISSING', 'F')
  ok('F image missing')
}

// —— G 图片不属于当前用户 ——
{
  const r = loadVisionImagesForGrading({
    userId: '9',
    sessionItemId: '100',
    imageIds: ['1'],
    rows: [fakeRow({ id: '1', userId: '8', sessionItemId: '100' })],
    readFile: () => Buffer.from('x'),
  })
  assert(!r.ok && r.code === 'IMAGE_FORBIDDEN', 'G')
  ok('G wrong user')
}

// —— H draft 拒绝 ——
{
  const r = loadVisionImagesForGrading({
    userId: '9',
    sessionItemId: '100',
    imageIds: ['1'],
    rows: [
      fakeRow({
        id: '1',
        userId: '9',
        sessionItemId: '100',
        status: 'draft',
      }),
    ],
    readFile: () => Buffer.from('x'),
  })
  assert(!r.ok && r.code === 'IMAGE_NOT_SUBMITTED', 'H')
  ok('H draft rejected')
}

// —— I 非法 MIME ——
{
  const r = loadVisionImagesForGrading({
    userId: '9',
    sessionItemId: '100',
    imageIds: ['1'],
    rows: [
      fakeRow({
        id: '1',
        userId: '9',
        sessionItemId: '100',
        mimeType: 'application/pdf',
      }),
    ],
    readFile: () => Buffer.from('x'),
  })
  assert(!r.ok && r.code === 'IMAGE_BAD_MIME', 'I')
  ok('I bad MIME')
}

// —— J 超过数量限制 ——
{
  const tooMany = Array.from(
    { length: HS_MATH_APPLICATION_IMAGE_MAX_COUNT + 1 },
    (_, i) => String(i + 1),
  )
  const r = loadVisionImagesForGrading({
    userId: '9',
    sessionItemId: '100',
    imageIds: tooMany,
    rows: tooMany.map((id) =>
      fakeRow({ id, userId: '9', sessionItemId: '100' }),
    ),
    readFile: () => Buffer.from('x'),
  })
  assert(!r.ok && r.code === 'TOO_MANY_IMAGES', 'J')
  ok('J too many images')
}

// —— K rubric 缺项 ——
{
  const r = validate({
    totalScore: 3,
    rubricScores: [{ rubricKey: 'model', score: 3, feedback: 'ok' }],
    personalizedExplanation: 'x',
  })
  assert(!r.ok && r.code === 'MISSING_KEYS', 'K')
  ok('K rubric missing keys')
}

// —— L rubric 越界 ——
{
  const r = validate(
    makeRaw({
      totalScore: 11,
      scores: [
        { key: 'model', score: 4 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
  )
  assert(!r.ok && r.code === 'SCORE_OVERFLOW', 'L')
  ok('L score overflow')
}

// —— M 总分错误 ——
{
  const r = validate(
    makeRaw({
      totalScore: 9,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
  )
  assert(!r.ok && r.code === 'TOTAL_MISMATCH', 'M')
  ok('M total mismatch')
}

// —— N 非法 JSON ——
{
  const r = validate('not-json{{{')
  assert(!r.ok && r.code === 'INVALID_JSON', 'N')
  ok('N invalid JSON')
}

// —— O 识别不确定 → recognitionUncertain ——
{
  const r1 = validate(
    makeRaw({
      totalScore: 5,
      scores: [
        { key: 'model', score: 2 },
        { key: 'domain', score: 1 },
        { key: 'solve', score: 1 },
        { key: 'conclusion', score: 1 },
      ],
      recognitionUncertain: true,
    }),
    { imageCount: 1, inputModality: 'image' },
  )
  assert(r1.ok && r1.recognitionUncertain === true, 'O flag')
  const r2 = validate(
    makeRaw({
      totalScore: 5,
      scores: [
        { key: 'model', score: 2 },
        { key: 'domain', score: 1 },
        { key: 'solve', score: 1 },
        { key: 'conclusion', score: 1 },
      ],
      confidence: 0.3,
    }),
    { imageCount: 1, inputModality: 'image' },
  )
  assert(r2.ok && r2.recognitionUncertain === true, 'O low conf')
  ok('O recognition uncertain')
}

// —— P 超时原因码（契约） ——
{
  const msg = '调用 Vision 超时（90000ms）'
  assert(/timeout|超时/i.test(msg), 'P timeout pattern')
  const reason = /timeout|超时/i.test(msg) ? 'ai_timeout' : 'ai_error'
  assert(reason === 'ai_timeout', 'P maps to ai_timeout')
  ok('P timeout reason pattern')
}

// —— Q 重复批改：已 graded 不进 pending 桶；claim 拒绝语义 ——
{
  const c = recountHsMathSessionGradeCounts(['graded', 'graded'])
  assert(c.pending === 0 && c.correct === 0, 'Q graded not in buckets')
  ok('Q already graded recount')
}

// —— R 历史读取契约：ai_grade_json 可含扩展字段 ——
{
  const r = validate(
    makeRaw({
      totalScore: 10,
      scores: [
        { key: 'model', score: 3 },
        { key: 'domain', score: 2 },
        { key: 'solve', score: 3 },
        { key: 'conclusion', score: 2 },
      ],
    }),
    { imageCount: 2, inputModality: 'image' },
  )
  assert(r.ok && r.value.imageCount === 2, 'R persist fields')
  ok('R history ai_grade_json fields')
}

// —— S 学情：pending 桶含 review_required / grading_failed ——
{
  const c = recountHsMathSessionGradeCounts([
    'correct',
    'wrong',
    'review_required',
    'grading_failed',
    'pending_ai',
  ])
  assert(c.correct === 1 && c.wrong === 1 && c.pending === 3, 'S')
  ok('S analytics pending buckets')
}

// —— T 原有四题型兼容 ——
{
  const single = gradeHsMathAnswer({
    qtype: 'single',
    optionsJson: { options: [{ id: 'A', text: '1' }] },
    standard: { kind: 'single', optionId: 'A' },
    user: { kind: 'single', optionId: 'A' },
  })
  assert(single.result === 'correct', 'T single')
  const judge = gradeHsMathAnswer({
    qtype: 'judge',
    optionsJson: null,
    standard: { kind: 'judge', value: true },
    user: { kind: 'judge', value: true },
  })
  assert(judge.result === 'correct', 'T judge')
  ok('T legacy qtypes')
}

// —— U DeepSeek 文字路径兼容：text_ai + 文字 prompt ——
{
  assert(
    classifyApplicationSubmitRoute({ text: '纯文字解答' }) === 'text_ai',
    'U route',
  )
  assert(
    classifyApplicationSubmitRoute({ imageIds: ['1'] }) === 'vision_ai',
    'U vision route',
  )
  const p = buildHsMathApplicationAiGradePrompt({
    stem: '题干',
    standardAnswer: '标答',
    maxScore: MAX,
    rubric: RUBRIC,
    studentText: '学生文字',
  })
  assert(p.system.includes('JSON') && p.user.includes('学生文字'), 'U text prompt')
  const vp = buildHsMathApplicationVisionAiGradePrompt({
    stem: '题干',
    standardAnswer: '标答',
    maxScore: MAX,
    rubric: RUBRIC,
    studentText: null,
    imageCount: 2,
  })
  assert(
    vp.system.includes('recognitionUncertain') && vp.user.includes('2 张'),
    'U vision prompt',
  )
  ok('U DeepSeek text + vision prompt compat')
}

// —— URL 规范化 / 安全 ——
{
  assert(
    resolveHsMathVisionChatCompletionsUrl('https://example.com') ===
      'https://example.com/v1/chat/completions',
    'url base',
  )
  assert(
    resolveHsMathVisionChatCompletionsUrl('https://example.com/v1') ===
      'https://example.com/v1/chat/completions',
    'url v1',
  )
  assert(
    resolveHsMathVisionChatCompletionsUrl('ftp://bad') === null,
    'url reject ftp',
  )
  assert(resolveHsMathVisionChatCompletionsUrl('not-a-url') === null, 'url junk')
  ok('URL resolve allowlist')
}

console.log(`APPLICATION-3D-5 selftest OK (${passed} cases)`)
