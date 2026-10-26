/**
 * APPLICATION-3E-6：部分得分专项离线预检（无网络、无外发、无 DB 写）。
 * 运行：pnpm --filter api run hs-math:application3e6-selftest
 *
 * Stub 验证代码逻辑；不能证明真实 Qwen 一定不纠错。
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildDualScoringStudentText,
  buildHsMathApplicationVisionTranscribePrompt,
  evaluateTranscribeForDeepSeek,
  isCriticalRecognitionWarning,
  parseVisionTranscribeResult,
} from './hs-math-ai-grade-vision-transcribe.prompt'
import {
  recountHsMathSessionGradeCounts,
  validateHsMathAiGradeResult,
} from './hs-math-ai-grade.validate'
import { normalizeVisionImageIds } from './hs-math-vision-image-loader'
import { dispatchApplicationGrade } from './hs-math-application-grade-dispatch'
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

let passed = 0
function ok(name: string) {
  passed += 1
  console.log('OK', name)
}

const RUBRIC: HsMathApplicationRubricItem[] = [
  { key: 'model', title: '建模', maxScore: 3, criteria: 'm' },
  { key: 'domain', title: '定义域', maxScore: 2, criteria: 'd' },
  { key: 'solve', title: '求解', maxScore: 3, criteria: 's' },
  { key: 'conclusion', title: '结论', maxScore: 2, criteria: 'c' },
]
const MAX = 10

const PARTIAL_WORK = [
  '第1张',
  'y=x(2400-30x)=2400x-30x^2',
  'x∈{30,31,...,60}',
  '',
  '第2张',
  'y=-30(x-50)^2+48000',
  '当 x=50 时最大收入为 48000 元',
].join('\n')

function stubPartialGradeJson(scores: number[], total: number) {
  const keys = ['model', 'domain', 'solve', 'conclusion']
  return JSON.stringify({
    totalScore: total,
    rubricScores: keys.map((rubricKey, i) => ({
      rubricKey,
      score: scores[i],
      feedback: `stub ${rubricKey}`,
    })),
    recognizedWork: PARTIAL_WORK,
    errors: ['对称轴误为 x=50'],
    personalizedExplanation: '建模与定义域正确，配方对称轴错误。',
  })
}

// 1 清晰错误步骤 → 原样转写（解析不改写）
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: PARTIAL_WORK,
      recognitionUncertain: false,
      recognitionWarnings: [],
      confidence: 0.9,
    }),
  )
  assert(t!.recognizedWork === PARTIAL_WORK, '1 preserve')
  assert(t!.recognizedWork.includes('x=50'), '1 x=50')
  assert(!t!.recognizedWork.includes('x=40'), '1 no auto 40')
  assert(evaluateTranscribeForDeepSeek(t!).ok, '1 gate')
  ok('1 clear wrong steps preserved as-is')
}

// 2 x=50 不能自动变成 x=40
{
  const raw = JSON.stringify({
    recognizedWork: 'y=-30(x-50)^2+48000；x=50',
    recognitionUncertain: false,
    recognitionWarnings: [],
    confidence: 0.88,
  })
  const t = parseVisionTranscribeResult(raw)
  assert(t!.recognizedWork.includes('x=50'), '2')
  assert(!/x=40/.test(t!.recognizedWork), '2 no 40')
  ok('2 x=50 not rewritten to x=40')
}

// 3 可识别数学错误不能仅因答案错误而 uncertain
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: PARTIAL_WORK,
      recognitionUncertain: false,
      recognitionWarnings: ['学生结论与常见正确解不一致（数学错误，非识别问题）'],
      confidence: 0.9,
    }),
  )
  assert(evaluateTranscribeForDeepSeek(t!).ok, '3')
  assert(!isCriticalRecognitionWarning(t!.recognitionWarnings[0]), '3 not critical')
  ok('3 math error alone does not block')
}

// 4 真正无法辨认的 40/50 → uncertain
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: 'y=-30(x-【?】)^2+48000，无法判断是 40 还是 50',
      recognitionUncertain: true,
      recognitionWarnings: ['关键数字看不清，40 与 50 无法区分'],
      confidence: 0.4,
    }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'uncertain_recognition', '4')
  ok('4 ambiguous 40/50 → uncertain blocks')
}

// 5 recognitionUncertain=true → DeepSeek 0
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: PARTIAL_WORK,
      recognitionUncertain: true,
      recognitionWarnings: [],
      confidence: 0.9,
    }),
  )
  assert(!evaluateTranscribeForDeepSeek(t!).ok, '5')
  ok('5 uncertain=true → DeepSeek 0')
}

// 6 confidence 低 → DeepSeek 0
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: PARTIAL_WORK,
      recognitionUncertain: false,
      recognitionWarnings: [],
      confidence: 0.2,
    }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'low_confidence', '6')
  ok('6 low confidence → DeepSeek 0')
}

// 7 关键 warning → DeepSeek 0
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: 'y=x(2400-【?】x)',
      recognitionUncertain: false,
      recognitionWarnings: ['关键系数无法辨认'],
      confidence: 0.85,
    }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'critical_recognition_warning', '7')
  ok('7 critical warning → DeepSeek 0')
}

// 8 非关键 warning（含考点词但无识别失败语义）→ 放行
{
  const warn =
    "第1张中文叙述有编码瑕疵；乱码处对应叙述‘收入函数解析式’，公式 2400x-30x^2 清晰"
  assert(!isCriticalRecognitionWarning(warn), '8 regex')
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: PARTIAL_WORK,
      recognitionUncertain: false,
      recognitionWarnings: [warn],
      confidence: 0.85,
    }),
  )
  assert(evaluateTranscribeForDeepSeek(t!).ok, '8 gate')
  ok('8 non-critical warning with topic words still ok')
}

// 9 合法转写 → DeepSeek 接收到错误步骤
{
  const m = buildDualScoringStudentText({
    studentText: null,
    recognizedWork: PARTIAL_WORK,
  })
  assert(m.includes('x=50') && m.includes('2400x-30x^2'), '9')
  assert(!m.includes('x=40'), '9 no correct axis')
  ok('9 DeepSeek payload keeps wrong steps')
}

// 10 DeepSeek 按 rubric 返回合理部分分
{
  const v = validateHsMathAiGradeResult({
    raw: stubPartialGradeJson([3, 2, 1, 1], 7),
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'deepseek-stub',
    gradedAtIso: new Date().toISOString(),
    inputModality: 'text',
    imageCount: 0,
  })
  assert(v.ok && v.value.totalScore === 7, '10')
  assert(v.value.totalScore < MAX, '10 partial')
  ok('10 legal partial score via rubric')
}

// 11 合法部分分可持久化语义（校验通过即可落库；本 stub 无 DB）
{
  const v = validateHsMathAiGradeResult({
    raw: stubPartialGradeJson([3, 2, 0, 0], 5),
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'deepseek-stub',
    gradedAtIso: new Date().toISOString(),
  })
  assert(v.ok && v.value.totalScore === 5, '11')
  ok('11 partial grade validate ok (persistable)')
}

// 12 部分分不污染 correct/wrong/accuracy
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      imageIds: ['1', '2'],
      gradingProvider: 'deepseek',
    },
    visionReady: true,
    textAiReady: true,
  })
  assert(d.queue === 'dual' && d.pipeline === 'qwen_then_deepseek', '12 dual')
  // application graded 不进 correct/wrong/pending 三桶（accuracy 由上层对 application 置 null）
  const counts = recountHsMathSessionGradeCounts(['graded', 'graded'])
  assert(
    counts.correct === 0 && counts.wrong === 0 && counts.pending === 0,
    '12 cw',
  )
  ok('12 application graded does not pollute correct/wrong/pending')
}

// 13 转写不被标准答案自动纠正（解析层 + prompt 约束）
{
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: '正确对称轴为 x=40；标准答案勿用于纠错',
    studentText: null,
    imageCount: 2,
  })
  assert(/数学错误/.test(p.system) && /识别不确定/.test(p.system), '13a')
  assert(/禁止[\s\S]*数学逻辑|依据「数学逻辑」/.test(p.system), '13b')
  assert(!/rubricScores|totalScore/.test(p.system + p.user), '13c')
  assert(/不得用于纠错|勿输出标准答案/.test(p.user), '13d')
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: 'x=50',
      recognitionUncertain: false,
      recognitionWarnings: [],
      confidence: 0.9,
    }),
  )
  assert(t!.recognizedWork === 'x=50', '13e')
  ok('13 no answer-driven rewrite (prompt+parse)')
}

// 14 图片顺序保持正确
{
  const ids = normalizeVisionImageIds(['45', '46', '45'])
  assert(ids.join(',') === '45,46', '14')
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: 's',
    studentText: null,
    imageCount: 2,
  })
  assert(/第N张|顺序=提交 imageIds/.test(p.user), '14p')
  ok('14 image order preserved')
}

// 15 混合答案保留学生原文
{
  const m = buildDualScoringStudentText({
    studentText: '我认为对称轴是 x=50',
    recognizedWork: PARTIAL_WORK,
  })
  assert(m.includes('我认为对称轴是 x=50'), '15 text')
  assert(m.includes('y=-30(x-50)^2+48000'), '15 work')
  ok('15 mixed keeps student text + transcription')
}

// 16 考点词 alone 不触发 critical 正则；含「根据公式推断」时 3E-8 按补写嫌疑拦截
{
  const bWarn =
    "根据数学公式推断，第1张乱码原意应为‘收入函数解析式’，定义域公式清晰"
  assert(!isCriticalRecognitionWarning(bWarn), '16 regex')
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: PARTIAL_WORK,
      recognitionUncertain: false,
      recognitionWarnings: [bWarn],
      confidence: 0.85,
    }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'model_supplementation_suspected', '16 gate')
  const topicOnly =
    "第1张中文叙述编码瑕疵；旁侧收入函数与定义域公式 2400x-30x^2 清晰可读"
  assert(!isCriticalRecognitionWarning(topicOnly), '16b regex')
  const t2 = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: PARTIAL_WORK,
      recognitionUncertain: false,
      recognitionWarnings: [topicOnly],
      confidence: 0.85,
    }),
  )
  assert(evaluateTranscribeForDeepSeek(t2!).ok, '16b gate')
  ok('16 topic-word regex ok; supplement language blocks (3E-8)')
}

// 17 样张文件存在与基本质量（本地，无模型）
{
  const base = resolve(
    process.cwd(),
    'src/hs-math/integration/fixtures/application3e6',
  )
  const manifestPath = resolve(base, 'MANIFEST.json')
  assert(existsSync(manifestPath), '17 manifest')
  const manifest = JSON.parse(
    readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''),
  ) as {
    samples: Array<{
      id: string
      files: string[]
      kind: string
      notes?: string
    }>
  }
  assert(manifest.samples.length >= 3, '17 samples')
  for (const s of manifest.samples) {
    assert(
      s.kind === 'PRINTED_SYNTHETIC' ||
        s.kind === 'HANDWRITING_STYLE_SYNTHETIC',
      `17 kind ${s.id}`,
    )
    assert(s.kind !== 'REAL_HANDWRITING_PHOTO', '17 no fake real')
    for (const f of s.files) {
      const p = resolve(base, f)
      assert(existsSync(p), `17 file ${f}`)
      const st = statSync(p)
      assert(st.size > 800 && st.size < 5_000_000, `17 size ${f}`)
      const buf = readFileSync(p)
      assert(buf[0] === 0x89 && buf[1] === 0x50, `17 png ${f}`)
    }
  }
  ok('17 fixtures exist + png + size + kind labels')
}

console.log(`\nAPPLICATION-3E-6 selftest PASS ${passed}`)
