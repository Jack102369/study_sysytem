/**
 * APPLICATION-3E-8：转写 warning 精准分类与门禁（无网络、无外发、无 DB 写）。
 * 运行：pnpm --filter api run hs-math:application3e8-selftest
 *
 * 含 3E-7 session 122/123 脱敏持久化片段（非伪造 raw HTTP body）。
 */
import {
  buildDualScoringStudentText,
  buildHsMathApplicationVisionTranscribePrompt,
  evaluateTranscribeForDeepSeek,
  isAllowlistedAuxiliaryWarning,
  parseStructuredRecognitionWarning,
  parseVisionTranscribeResult,
} from './hs-math-ai-grade-vision-transcribe.prompt'
import {
  recountHsMathSessionGradeCounts,
  validateHsMathAiGradeResult,
} from './hs-math-ai-grade.validate'
import { normalizeVisionImageIds } from './hs-math-vision-image-loader'
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

const PARTIAL = [
  '第1张',
  'y=x(2400-30x)=2400x-30x^2',
  'x∈{30,31,...,60}',
  '第2张',
  'y=-30(x-50)^2+48000',
  '当 x=50 时最大收入为 48000 元',
].join('\n')

const AUX = {
  pageIndex: 1,
  location: '页眉备注',
  category: 'auxiliary_text' as const,
  severity: 'minor' as const,
  description: '页眉测试标记编码瑕疵，不影响公式',
  affectsScoring: false,
}

function pack(work: string, warnings: unknown[], extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    recognizedWork: work,
    recognitionUncertain: false,
    recognitionWarnings: warnings,
    confidence: 0.9,
    ...extra,
  })
}

// —— 1–3 错误步骤保留 ——
{
  const t = parseVisionTranscribeResult(pack(PARTIAL, []))
  assert(t!.recognizedWork.includes('x=50'), '1')
  assert(!/x=40/.test(t!.recognizedWork), '1b')
  assert(evaluateTranscribeForDeepSeek(t!).ok, '1g')
  ok('1 clear x=50 preserved')
}
{
  const t = parseVisionTranscribeResult(
    pack('y=-30(x-50)^2；结论 x=50', []),
  )
  assert(t!.recognizedWork.includes('x=50') && !t!.recognizedWork.includes('x=40'), '2')
  ok('2 x=50 not rewritten to x=40')
}
{
  const t = parseVisionTranscribeResult(
    pack(PARTIAL, [
      {
        ...AUX,
        description: '学生答案与标准解不一致（数学错误）',
      },
    ]),
  )
  assert(evaluateTranscribeForDeepSeek(t!).ok, '3')
  ok('3 math error != recognition failure')
}

// —— 4 辅助中文模糊但公式完整 ——
{
  const t = parseVisionTranscribeResult(pack(PARTIAL, [AUX]), {
    imageCount: 2,
  })
  assert(t && isAllowlistedAuxiliaryWarning(AUX), '4a')
  assert(evaluateTranscribeForDeepSeek(t!).ok, '4g')
  ok('4 auxiliary_text minor allows DeepSeek')
}

// —— 5–9 关键内容模糊 ——
for (const [name, cat, desc] of [
  ['5', 'math_expression', '关键二次项看不清'],
  ['6', 'numeric_value', '关键系数无法判断是 30 还是 50'],
  ['7', 'problem_condition', '定义域集合主体模糊'],
  ['8', 'final_conclusion', '最终结论行无法辨认'],
  ['9', 'reasoning_step', '配方推理中文关键步骤模糊'],
] as const) {
  const t = parseVisionTranscribeResult(
    pack(PARTIAL, [
      {
        pageIndex: 2,
        location: '主公式区',
        category: cat,
        severity: 'minor',
        description: desc,
        affectsScoring: false,
      },
    ]),
    { imageCount: 2 },
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'non_auxiliary_warning', name)
  ok(`${name} ${cat} blocks even if affectsScoring=false`)
}

// —— 10 unknown 影响范围 ——
{
  const t = parseVisionTranscribeResult(
    pack(PARTIAL, [
      {
        pageIndex: 1,
        location: 'unknown',
        category: 'unknown',
        severity: 'unknown',
        description: '无法判断乱码是否覆盖结论',
        affectsScoring: true,
      },
    ]),
    { imageCount: 2 },
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok, '10')
  ok('10 unknown scope blocks')
}

// —— 11 缺 severity ——
{
  assert(
    parseVisionTranscribeResult(
      pack(PARTIAL, [
        {
          pageIndex: 1,
          location: '右',
          category: 'auxiliary_text',
          description: 'x',
          affectsScoring: false,
        },
      ]),
    ) === null,
    '11',
  )
  ok('11 missing severity → parse null')
}

// —— 12 缺 affectsScoring ——
{
  assert(
    parseVisionTranscribeResult(
      pack(PARTIAL, [
        {
          pageIndex: 1,
          location: '右',
          category: 'auxiliary_text',
          severity: 'minor',
          description: 'x',
        },
      ]),
    ) === null,
    '12',
  )
  ok('12 missing affectsScoring → parse null')
}

// —— 13 非法 category ——
{
  assert(
    parseVisionTranscribeResult(
      pack(PARTIAL, [
        {
          pageIndex: 1,
          location: '右',
          category: 'not_a_category',
          severity: 'minor',
          description: 'x',
          affectsScoring: false,
        },
      ]),
    ) === null,
    '13',
  )
  ok('13 illegal category → parse null')
}

// —— 14 pageIndex 越界 ——
{
  assert(
    parseVisionTranscribeResult(
      pack(PARTIAL, [
        {
          pageIndex: 3,
          location: '右',
          category: 'auxiliary_text',
          severity: 'minor',
          description: 'x',
          affectsScoring: false,
        },
      ]),
      { imageCount: 2 },
    ) === null,
    '14',
  )
  ok('14 pageIndex out of range → parse null')
}

// —— 15 旧字符串 warning 兼容 ——
{
  const mild = parseVisionTranscribeResult(
    pack(PARTIAL, ['第2张末尾句号略糊']),
  )
  assert(evaluateTranscribeForDeepSeek(mild!).ok, '15 mild')
  const crit = parseVisionTranscribeResult(
    pack(PARTIAL, ['图片中大量中文无法辨认具体语义']),
  )
  const g = evaluateTranscribeForDeepSeek(crit!)
  assert(!g.ok && g.reason === 'critical_recognition_warning', '15 crit')
  ok('15 legacy string warnings compatible')
}

// —— 16–18 基础门禁 ——
{
  const t = parseVisionTranscribeResult(
    pack(PARTIAL, [], { recognitionUncertain: true }),
  )
  assert(!evaluateTranscribeForDeepSeek(t!).ok, '16')
  ok('16 uncertain=true blocks')
}
{
  const t = parseVisionTranscribeResult(pack(PARTIAL, [], { confidence: 0.2 }))
  assert(
    !evaluateTranscribeForDeepSeek(t!).ok &&
      evaluateTranscribeForDeepSeek(t!).ok === false,
    '17',
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(g.ok === false && g.reason === 'low_confidence', '17r')
  ok('17 low confidence blocks')
}
{
  assert(
    parseVisionTranscribeResult(
      JSON.stringify({
        recognizedWork: '  ',
        recognitionUncertain: false,
        confidence: 0.9,
      }),
    ) === null,
    '18',
  )
  ok('18 empty recognizedWork → null')
}

// —— 19 多图顺序 ——
{
  assert(normalizeVisionImageIds(['48', '49', '48']).join(',') === '48,49', '19')
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: 's',
    studentText: null,
    imageCount: 2,
  })
  assert(/pageIndex|第N张/.test(p.system + p.user), '19p')
  ok('19 multi-image order + prompt pageIndex')
}

// —— 20 模型疑似补写 ——
{
  const t = parseVisionTranscribeResult(
    pack(PARTIAL, [
      '已根据乱码前后的数学公式和符号保留了关键的数学推导步骤',
    ]),
  )
  const g = evaluateTranscribeForDeepSeek(t!)
  assert(!g.ok && g.reason === 'model_supplementation_suspected', '20')
  ok('20 model supplementation suspected blocks')
}

// —— 21 合法转写进入 DeepSeek ——
{
  const t = parseVisionTranscribeResult(pack(PARTIAL, [AUX]), {
    imageCount: 2,
  })
  assert(evaluateTranscribeForDeepSeek(t!).ok, '21')
  const m = buildDualScoringStudentText({
    studentText: null,
    recognizedWork: t!.recognizedWork,
  })
  assert(m.includes('x=50'), '21m')
  ok('21 legal transcription may call DeepSeek')
}

// —— 22 不可靠 → DeepSeek 0 ——
{
  const t = parseVisionTranscribeResult(
    pack(PARTIAL, ['关键数字无法辨认']),
  )
  assert(!evaluateTranscribeForDeepSeek(t!).ok, '22')
  ok('22 unreliable → DeepSeek 0')
}

// —— 23 合法部分分 rubric ——
{
  const raw = JSON.stringify({
    totalScore: 7,
    rubricScores: [
      { rubricKey: 'model', score: 3, feedback: 'a' },
      { rubricKey: 'domain', score: 2, feedback: 'b' },
      { rubricKey: 'solve', score: 1, feedback: 'c' },
      { rubricKey: 'conclusion', score: 1, feedback: 'd' },
    ],
    recognizedWork: PARTIAL,
    errors: ['对称轴错误'],
    personalizedExplanation: '最大值求解有误',
  })
  const v = validateHsMathAiGradeResult({
    raw,
    rubric: RUBRIC,
    maxScore: MAX,
    model: 'deepseek-stub',
    gradedAtIso: new Date().toISOString(),
  })
  assert(v.ok && v.value.totalScore === 7, '23')
  ok('23 legal partial rubric validate')
}

// —— 24 部分分不污染 accuracy ——
{
  const c = recountHsMathSessionGradeCounts(['graded', 'review_required'])
  assert(c.correct === 0 && c.wrong === 0 && c.pending === 1, '24')
  ok('24 graded/review do not pollute correct/wrong')
}

// —— 3E-7 真实持久化脱敏：122/123 必须继续拦截 ——
{
  // 来自 _tmp_application3e7_live_raw.json（持久化诊断，非伪造 HTTP body）
  const a = parseVisionTranscribeResult(
    pack(
      '第1张\ny = x(2400 - 30x)=2400x-30x^2\nx∈{30..60}\n第2张\ny=-30(x-50)^2+48000\nx=50 最大收入48000',
      [
        '图片中大量中文叙述文字显示为乱码（如“鈃?E-6”等），无法辨认具体语义。',
        '已根据乱码前后的数学公式和符号保留了关键的数学推导步骤，如“y = x(2400 - 30x)”及“y = -30(x - 50)^2 + 48000”。',
      ],
    ),
  )
  const ga = evaluateTranscribeForDeepSeek(a!)
  assert(!ga.ok, '122 block')
  ok('R1 session122-style warnings still blocked (UNKNOWN/supplement)')
}
{
  const b = parseVisionTranscribeResult(
    pack(
      '第1张\ny=x(2400-30x)\n第2张\ny=-30(x-50)^2+48000\nx=50',
      [
        '图片中的中文文字存在严重的字符编码错误（乱码），无法识别具体含义，仅保留了清晰可读的数字、字母、数学符号和表达式。',
        '第1张顶部和第2张顶部的题干复述部分乱码严重。',
      ],
    ),
  )
  const gb = evaluateTranscribeForDeepSeek(b!)
  assert(!gb.ok && gb.reason === 'critical_recognition_warning', '123')
  ok('R2 session123-style string warnings still blocked')
}

// —— Prompt 不含标准答案分值；含结构化字段 ——
{
  const p = buildHsMathApplicationVisionTranscribePrompt({
    stem: '题',
    studentText: null,
    imageCount: 2,
  })
  assert(!/rubricScores|totalScore/.test(p.system), 'P1')
  assert(/affectsScoring|auxiliary_text|final_conclusion/.test(p.system), 'P2')
  assert(/禁止[\s\S]*补写|不要补写/.test(p.system), 'P3')
  ok('P prompt structured warning rules')
}

// —— parseStructuredRecognitionWarning 单测 ——
{
  assert(
    parseStructuredRecognitionWarning({
      pageIndex: 1,
      location: 'a',
      category: 'auxiliary_text',
      severity: 'minor',
      description: 'd',
      affectsScoring: false,
    }) != null,
    'S1',
  )
  assert(
    parseStructuredRecognitionWarning({
      pageIndex: 1,
      location: 'a',
      category: 'auxiliary_text',
      severity: 'minor',
      description: 'd',
      affectsScoring: 'false',
    }) === null,
    'S2 no coerce',
  )
  ok('S structured parser no default coerce')
}

console.log(`\nAPPLICATION-3E-8 selftest PASS ${passed}`)
