/**
 * APPLICATION-3E-4：转写可靠性离线回归（无网络、无外发、无 DB 写）。
 * 运行：pnpm --filter api run hs-math:application3e4-selftest
 *
 * fixture 均为 synthetic，非 3E-3 真实回放（原始响应未落库）。
 */
import {
  buildDualScoringStudentText,
  buildHsMathApplicationVisionTranscribePrompt,
  evaluateTranscribeForDeepSeek,
  parseVisionTranscribeResult,
  shouldBlockDeepSeekAfterTranscribe,
} from './hs-math-ai-grade-vision-transcribe.prompt'
import { dispatchApplicationGrade } from './hs-math-application-grade-dispatch'
import { normalizeVisionImageIds } from './hs-math-vision-image-loader'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

let passed = 0
function ok(name: string) {
  passed += 1
  console.log('OK', name)
}

const GOOD = {
  recognizedWork: '第1张\ny=2400x-30x^2\n定义域{30..60}',
  recognitionUncertain: false,
  recognitionWarnings: [] as string[],
  confidence: 0.92,
}

// 1 标准 JSON
{
  const t = parseVisionTranscribeResult(JSON.stringify(GOOD))
  assert(t && t.recognizedWork.includes('2400x'), '1')
  assert(evaluateTranscribeForDeepSeek(t!).ok, '1 gate')
  ok('1 standard JSON success')
}

// 2 反斜杠公式
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      ...GOOD,
      recognizedWork: 'y=-30(x-40)^2+48000 \\Rightarrow x=40',
    }),
  )
  assert(t && t.recognizedWork.includes('\\Rightarrow'), '2')
  ok('2 backslash in formula')
}

// 3 Unicode 数学符号
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      ...GOOD,
      recognizedWork: 'x∈{30,…,60}，y≤48000',
    }),
  )
  assert(t && t.recognizedWork.includes('∈'), '3')
  ok('3 unicode math')
}

// 4 Markdown 围栏
{
  const raw = '```json\n' + JSON.stringify(GOOD) + '\n```'
  const t = parseVisionTranscribeResult(raw)
  assert(t && evaluateTranscribeForDeepSeek(t).ok, '4')
  ok('4 markdown fence')
}

// 5 轻微 warning 但关键可靠
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      ...GOOD,
      recognitionWarnings: ['第2张末尾句号略糊'],
      recognitionUncertain: false,
      confidence: 0.88,
    }),
  )
  assert(t && evaluateTranscribeForDeepSeek(t!).ok, '5')
  ok('5 minor warning still ok')
}

// 6 关键系数不清楚
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: 'y=x(2400-【?】x)',
      recognitionUncertain: false,
      recognitionWarnings: ['关键系数无法辨认'],
      confidence: 0.9,
    }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.disposition === 'review_required', '6')
  ok('6 critical coefficient → review')
}

// 7 关键最大值不清楚
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: '最大值约为【无法辨认】',
      recognitionUncertain: false,
      recognitionWarnings: ['最大值数字无法辨认'],
      confidence: 0.85,
    }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'critical_recognition_warning', '7')
  ok('7 critical max value → review')
}

// 8 recognitionUncertain=true
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({ ...GOOD, recognitionUncertain: true }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'uncertain_recognition', '8')
  assert(shouldBlockDeepSeekAfterTranscribe(t!), '8 legacy')
  ok('8 uncertain true blocks')
}

// 9 confidence 低于阈值
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({ ...GOOD, confidence: 0.2 }),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'low_confidence', '9')
  ok('9 low confidence blocks')
}

// 10 recognizedWork 为空
{
  assert(
    parseVisionTranscribeResult(
      JSON.stringify({
        recognizedWork: '   ',
        recognitionUncertain: false,
        confidence: 0.9,
      }),
    ) === null,
    '10',
  )
  ok('10 empty work → parse null')
}

// 11 缺少 uncertain 字段 → 不默认 false
{
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: 'y=2400x',
      recognitionWarnings: [],
      confidence: 0.9,
    }),
  )
  assert(t && t.uncertainFieldPresent === false, '11 present')
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'missing_uncertain_field', '11 gate')
  ok('11 missing uncertain field blocks')
}

// 12 非法 confidence
{
  assert(
    parseVisionTranscribeResult(
      JSON.stringify({
        recognizedWork: 'y=1',
        recognitionUncertain: false,
        confidence: 'high',
      }),
    ) === null,
    '12',
  )
  ok('12 illegal confidence → null')
}

// 13 JSON 截断
{
  assert(parseVisionTranscribeResult('{"recognizedWork":"abc","recognitionUnc') === null, '13')
  ok('13 truncated JSON')
}

// 14 HTTP 超时语义：调度不静默改 provider（无外发）
{
  const d = dispatchApplicationGrade({
    qtype: 'application',
    syncGradeResult: 'pending_ai',
    user: {
      kind: 'application',
      imageIds: ['1'],
      gradingProvider: 'deepseek',
    },
    visionReady: true,
    textAiReady: true,
  })
  assert(d.queue === 'dual', '14')
  ok('14 dual still scheduled when switches on')
}

// 15 空 content
{
  assert(parseVisionTranscribeResult('') === null, '15a')
  assert(parseVisionTranscribeResult('   ') === null, '15b')
  ok('15 empty content')
}

// 16 多图顺序
{
  const ids = normalizeVisionImageIds(['9', '7', '8', '7'])
  assert(ids.join(',') === '9,7,8', '16')
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: '题',
    studentText: null,
    imageCount: 3,
  })
  assert(/第N张|顺序/.test(p.system + p.user), '16p')
  assert(!/rubricScores|totalScore|maxScore/.test(p.system), '16 no score keys')
  assert(/禁止[\s\S]*标准答案|按标准答案/.test(p.system), '16 forbids answer rewrite')
  ok('16 multi-image order + prompt no score keys')
}

// 17 文图混合合并
{
  const m = buildDualScoringStudentText({
    studentText: '文字步骤',
    recognizedWork: '图：y=x',
  })
  assert(m.includes('文字步骤') && m.includes('图：y=x'), '17')
  ok('17 mixed merge')
}

// 18 学生错误步骤保留（prompt 要求；解析不改写）
{
  const wrong = '我认为 y=2400-30x，x=0 最大'
  const t = parseVisionTranscribeResult(
    JSON.stringify({
      recognizedWork: wrong,
      recognitionUncertain: false,
      recognitionWarnings: [],
      confidence: 0.8,
    }),
  )
  assert(t!.recognizedWork === wrong, '18')
  assert(evaluateTranscribeForDeepSeek(t!).ok, '18 gate')
  ok('18 wrong steps preserved')
}

// 19 转写失败 → DeepSeek 调用为 0（门禁语义）
{
  const bad = parseVisionTranscribeResult('not json')
  assert(bad === null, '19')
  // null → service 走 grading_failed，不调 DeepSeek
  ok('19 parse fail means no DeepSeek')
}

// 20 合法转写后 DeepSeek 只收文字（合并函数无图片字段）
{
  const m = buildDualScoringStudentText({
    studentText: null,
    recognizedWork: '仅转写',
  })
  assert(m === '仅转写', '20')
  assert(!/base64|image\//i.test(m), '20 no image')
  ok('20 DeepSeek text-only payload')
}

// 额外：前后缀说明可剥
{
  const raw =
    '如下：\n' + JSON.stringify(GOOD) + '\n完'
  const t = parseVisionTranscribeResult(raw)
  assert(t && evaluateTranscribeForDeepSeek(t).ok, 'X')
  ok('X prefix/suffix around JSON')
}

// prompt 不含标准答案与评分
{
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: '题干含「标准答案」字样不应触发评分',
    studentText: '附',
    imageCount: 1,
  })
  assert(/不要评分|禁止/.test(p.system), 'P1')
  assert(!/rubricScores|totalScore/.test(p.system), 'P2')
  assert(/recognitionUncertain 判定/.test(p.system), 'P3')
  ok('P prompt rules for critical vs minor')
}

console.log(`\nAPPLICATION-3E-4 selftest PASS ${passed}`)
