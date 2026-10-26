/**
 * APPLICATION-3E-1/3E-4/3E-8：Qwen Vision 仅转写（不评分），供 DeepSeek 第二阶段使用。
 * 3E-8：结构化 recognitionWarnings + 精准门禁（auxiliary minor 可放行；UNKNOWN/关键 fail-closed）。
 */
import { HS_MATH_VISION_CONFIDENCE_REVIEW_THRESHOLD } from '../hs-math.constants'

export const HS_MATH_RECOGNITION_WARNING_CATEGORIES = [
  'math_expression',
  'numeric_value',
  'problem_condition',
  'reasoning_step',
  'final_conclusion',
  'auxiliary_text',
  'unknown',
] as const

export type HsMathRecognitionWarningCategory =
  (typeof HS_MATH_RECOGNITION_WARNING_CATEGORIES)[number]

export const HS_MATH_RECOGNITION_WARNING_SEVERITIES = [
  'minor',
  'critical',
  'unknown',
] as const

export type HsMathRecognitionWarningSeverity =
  (typeof HS_MATH_RECOGNITION_WARNING_SEVERITIES)[number]

export type HsMathRecognitionWarningStructured = {
  pageIndex: number
  location: string
  category: HsMathRecognitionWarningCategory
  severity: HsMathRecognitionWarningSeverity
  description: string
  affectsScoring: boolean
}

/** 兼容旧 string 与新结构化 object */
export type HsMathRecognitionWarning =
  | string
  | HsMathRecognitionWarningStructured

/**
 * 旧字符串 warning 的严格启发式（无法证明 minor 时沿用）。
 * 不得仅因出现考点词就拦截；须带识别失败语义。
 */
const CRITICAL_STRING_WARNING_RE =
  /(无法辨认|无法识别|看不清|严重模糊|空白|空图|整页不可读|无法可靠|完全无法|关键系数.{0,12}(?:无法|不清|模糊|缺失)|关键数字.{0,12}(?:无法|不清|模糊|缺失)|(?:最大值|最值|收入函数|定义域|对称轴|顶点).{0,16}(?:无法辨认|无法识别|看不清|不清|模糊|缺失|无法可靠)|(?:无法辨认|无法识别|看不清|模糊).{0,16}(?:最大值|最值|收入函数|定义域|对称轴|顶点|关键系数|关键数字))/i

/** 疑似按乱码/逻辑补写或还原学生原文 */
const MODEL_SUPPLEMENT_RE =
  /(依据|根据).{0,24}(数学逻辑|公式|乱码|常见解法).{0,24}(还原|推断|补写|补全|保留了|原意)/i

export function isCriticalRecognitionWarning(warning: string): boolean {
  return CRITICAL_STRING_WARNING_RE.test(warning)
}

export function looksLikeModelSupplementation(text: string): boolean {
  return MODEL_SUPPLEMENT_RE.test(text)
}

export function isStructuredRecognitionWarning(
  w: unknown,
): w is HsMathRecognitionWarningStructured {
  return (
    !!w &&
    typeof w === 'object' &&
    !Array.isArray(w) &&
    typeof (w as HsMathRecognitionWarningStructured).pageIndex === 'number' &&
    typeof (w as HsMathRecognitionWarningStructured).category === 'string' &&
    typeof (w as HsMathRecognitionWarningStructured).severity === 'string' &&
    typeof (w as HsMathRecognitionWarningStructured).affectsScoring === 'boolean'
  )
}

export function buildHsMathApplicationVisionTranscribePrompt(input: {
  stem: string
  studentText: string | null
  imageCount: number
}): { system: string; user: string } {
  const system = [
    '你是高中数学解答图片转写助手（OCR/转写），不是阅卷老师。',
    '目标：按提交图片顺序，忠实转写学生实际写下的解题步骤。',
    '硬性禁止：求解题目、评分、按标准答案改写/补全、纠正学生错误、编造未见公式。',
    '硬性禁止：根据「数学逻辑」「常见解法」或题干推断后改写学生原文；禁止把清晰写出的错误数字改成正确数字。',
    '硬性禁止：对乱码中文「猜测原意」后写进 recognizedWork；看不清就标【?】或【无法辨认】，不要补写。',
    '必须保留：原始表达式、错误计算、错误数字（如 x=50）、错误结论、遗漏步骤、学生自己的用语。',
    '',
    '数学错误 ≠ 识别不确定：',
    '- 数学错误：清晰可读但步骤/结论不正确（如 y=-30(x-50)^2+48000 或 x=50）→ 原样转写，recognitionUncertain=false。',
    '- 识别不确定：无法判断学生实际写了什么（关键数字糊成 40/50 难辨、整页严重模糊）→ recognitionUncertain=true。',
    '',
    'recognitionUncertain 判定（务必严格执行）：',
    '- true：关键评分内容无法辨认，或整页严重模糊/空白，或步骤无法按页连贯理解，或你曾靠推断补写关键内容。',
    '- false：主要公式与关键数字可读（即使有数学错误）；仅辅助叙述略糊且不影响评分。',
    '- 不得虚报高置信度；不得为了放行评分而标 false。',
    '',
    'recognitionWarnings：优先输出结构化对象数组（不要只用笼统一句话）。每项字段必须齐全、禁止默认猜测：',
    '{"pageIndex":1,"location":"第二行右侧或 unknown","category":"auxiliary_text","severity":"minor","description":"...","affectsScoring":false}',
    `category 仅允许：${HS_MATH_RECOGNITION_WARNING_CATEGORIES.join('|')}`,
    `severity 仅允许：${HS_MATH_RECOGNITION_WARNING_SEVERITIES.join('|')}`,
    'affectsScoring 必须是 JSON 布尔 true/false（不得省略；不确定时必须 true 或把 severity/category 标 unknown）。',
    'pageIndex：从 1 起，对应提交图片顺序（第1张=1）。',
    'location：指出模糊位置；无法指出时写 "unknown"。',
    '分类提示：',
    '- auxiliary_text：明确仅为辅助连接词/页眉备注等，且不影响公式、定义域、推理与结论。',
    '- final_conclusion / reasoning_step / math_expression / numeric_value / problem_condition：评分相关，不得标成 auxiliary_text。',
    '- 「所以 x=50 时收入最大」这类结论文字属于 final_conclusion，即使是中文也不是 auxiliary_text。',
    '- 影响范围说不清 → category=unknown 或 severity=unknown，且不得 affectsScoring=false。',
    '',
    'confidence：0～1；关键内容清晰时可较高，但不得为过关虚报。',
    '',
    '只输出一个 JSON 对象（不要 Markdown 代码围栏，不要前后缀说明）：',
    '{"recognizedWork":"string","recognitionUncertain":false,"recognitionWarnings":[],"confidence":0.0}',
    'recognizedWork：按「第1张」「第2张」…分段；勿把学生附加文字整段复制进 recognizedWork。',
  ].join('\n')

  const user = [
    `【题干·仅作背景·不是标准答案·不得用于纠错】\n${input.stem.slice(0, 8000)}`,
    input.studentText
      ? `【学生附加文字·仅上下文·勿当标准答案·转写仍以图片为准】\n${input.studentText.slice(0, 4000)}`
      : '【学生附加文字】无。',
    `【图片】共 ${input.imageCount} 张，按「第N张」顺序转写（顺序=提交 imageIds，与文件名无关）。`,
    '请只输出规定 JSON。勿输出标准答案、勿输出 rubric、勿评分。',
  ].join('\n\n')

  return { system, user }
}

export function buildDualScoringStudentText(input: {
  studentText: string | null | undefined
  recognizedWork: string
}): string {
  const text =
    typeof input.studentText === 'string' ? input.studentText.trim() : ''
  const work = String(input.recognizedWork || '').trim()
  if (text && work) {
    return `【学生文字解答】\n${text}\n\n【图片转写】\n${work}`
  }
  return work || text
}

export type HsMathVisionTranscribeResult = {
  recognizedWork: string
  recognitionUncertain: boolean
  uncertainFieldPresent: boolean
  recognitionWarnings: HsMathRecognitionWarning[]
  confidence: number | null
}

export type HsMathTranscribeGate =
  | { ok: true }
  | {
      ok: false
      disposition: 'review_required' | 'grading_failed'
      reason: string
    }

function stripMarkdownFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function isCategory(v: unknown): v is HsMathRecognitionWarningCategory {
  return (
    typeof v === 'string' &&
    (HS_MATH_RECOGNITION_WARNING_CATEGORIES as readonly string[]).includes(v)
  )
}

function isSeverity(v: unknown): v is HsMathRecognitionWarningSeverity {
  return (
    typeof v === 'string' &&
    (HS_MATH_RECOGNITION_WARNING_SEVERITIES as readonly string[]).includes(v)
  )
}

/**
 * 校验单条结构化 warning；失败返回 null（禁止自动填默认值）。
 */
export function parseStructuredRecognitionWarning(
  raw: unknown,
  opts?: { imageCount?: number },
): HsMathRecognitionWarningStructured | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>

  if (typeof o.pageIndex !== 'number' || !Number.isInteger(o.pageIndex)) {
    return null
  }
  if (o.pageIndex < 1) return null
  if (
    opts?.imageCount != null &&
    (o.pageIndex > opts.imageCount || opts.imageCount < 1)
  ) {
    return null
  }

  if (!isCategory(o.category)) return null
  if (!isSeverity(o.severity)) return null
  if (typeof o.affectsScoring !== 'boolean') return null

  const description =
    typeof o.description === 'string' ? o.description.trim() : ''
  if (!description) return null

  const location = typeof o.location === 'string' ? o.location.trim() : ''
  if (!location) return null

  return {
    pageIndex: o.pageIndex,
    location: location.slice(0, 200),
    category: o.category,
    severity: o.severity,
    description: description.slice(0, 500),
    affectsScoring: o.affectsScoring,
  }
}

/** 仅 auxiliary_text + minor + affectsScoring=false 可视为已验证的可忽略警告 */
export function isAllowlistedAuxiliaryWarning(
  w: HsMathRecognitionWarningStructured,
): boolean {
  return (
    w.category === 'auxiliary_text' &&
    w.severity === 'minor' &&
    w.affectsScoring === false
  )
}

function evaluateStructuredWarning(
  w: HsMathRecognitionWarningStructured,
): HsMathTranscribeGate | null {
  if (w.severity === 'critical' || w.severity === 'unknown') {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'critical_recognition_warning',
    }
  }
  if (w.category === 'unknown') {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'unknown_warning_scope',
    }
  }
  if (w.affectsScoring === true) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'warning_affects_scoring',
    }
  }
  if (w.location === 'unknown' && !isAllowlistedAuxiliaryWarning(w)) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'unknown_warning_scope',
    }
  }
  if (looksLikeModelSupplementation(w.description)) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'model_supplementation_suspected',
    }
  }
  if (!isAllowlistedAuxiliaryWarning(w)) {
    // 非 auxiliary 的 minor+false 仍不确定 → fail-closed
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'non_auxiliary_warning',
    }
  }
  return null
}

function evaluateLegacyStringWarning(w: string): HsMathTranscribeGate | null {
  if (looksLikeModelSupplementation(w)) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'model_supplementation_suspected',
    }
  }
  if (isCriticalRecognitionWarning(w)) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'critical_recognition_warning',
    }
  }
  // 无法证明 minor → 仍拦截（比「仅 critical 正则」更严的一档：非空且非明确轻微？）
  // 任务：不能可靠证明 minor 则按原严格门禁。原门禁=critical 正则。
  // 保留：不匹配 critical 的短轻微描述可放行（兼容 3E-4「句号略糊」）。
  return null
}

/** 解析转写 JSON；失败返回 null（不猜测补全、不填默认 severity/affectsScoring） */
export function parseVisionTranscribeResult(
  raw: string,
  opts?: { imageCount?: number },
): HsMathVisionTranscribeResult | null {
  const t0 = stripMarkdownFence(String(raw || '').trim())
  if (!t0) return null

  let obj: unknown
  try {
    const start = t0.indexOf('{')
    const end = t0.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    obj = JSON.parse(t0.slice(start, end + 1))
  } catch {
    return null
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
  const o = obj as Record<string, unknown>

  const workRaw =
    typeof o.recognizedWork === 'string'
      ? o.recognizedWork
      : typeof o.recognized_work === 'string'
        ? o.recognized_work
        : null
  if (workRaw === null || !String(workRaw).trim()) return null

  const warningsRaw = Array.isArray(o.recognitionWarnings)
    ? o.recognitionWarnings
    : Array.isArray(o.recognition_warnings)
      ? o.recognition_warnings
      : null

  const recognitionWarnings: HsMathRecognitionWarning[] = []
  if (warningsRaw) {
    for (const item of warningsRaw.slice(0, 30)) {
      if (typeof item === 'string') {
        const s = item.trim()
        if (s) recognitionWarnings.push(s.slice(0, 500))
        continue
      }
      if (item && typeof item === 'object') {
        const structured = parseStructuredRecognitionWarning(item, opts)
        if (!structured) return null // 无效结构 → 整单解析失败（fail-closed）
        recognitionWarnings.push(structured)
        continue
      }
      return null
    }
  }

  const uncertainKeyPresent =
    'recognitionUncertain' in o || 'recognition_uncertain' in o
  let recognitionUncertain = false
  if (uncertainKeyPresent) {
    const u = o.recognitionUncertain ?? o.recognition_uncertain
    recognitionUncertain = u === true || String(u).toLowerCase() === 'true'
  }

  let confidence: number | null = null
  if (typeof o.confidence === 'number' && Number.isFinite(o.confidence)) {
    confidence = Math.min(1, Math.max(0, o.confidence))
  } else if (o.confidence !== undefined && o.confidence !== null) {
    return null
  }

  return {
    recognizedWork: String(workRaw).trim().slice(0, 8000),
    recognitionUncertain,
    uncertainFieldPresent: uncertainKeyPresent,
    recognitionWarnings,
    confidence,
  }
}

/**
 * 转写后是否允许调用 DeepSeek。
 * 仅允许已验证 auxiliary_text+minor+affectsScoring=false；其余 fail-closed。
 */
export function evaluateTranscribeForDeepSeek(
  t: HsMathVisionTranscribeResult,
  _opts?: { imageCount?: number },
): HsMathTranscribeGate {
  if (!t.recognizedWork.trim()) {
    return {
      ok: false,
      disposition: 'grading_failed',
      reason: 'empty_recognized_work',
    }
  }
  if (!t.uncertainFieldPresent) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'missing_uncertain_field',
    }
  }
  if (t.recognitionUncertain) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'uncertain_recognition',
    }
  }
  if (
    t.confidence != null &&
    t.confidence < HS_MATH_VISION_CONFIDENCE_REVIEW_THRESHOLD
  ) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'low_confidence',
    }
  }
  if (looksLikeModelSupplementation(t.recognizedWork)) {
    return {
      ok: false,
      disposition: 'review_required',
      reason: 'model_supplementation_suspected',
    }
  }

  for (const w of t.recognitionWarnings) {
    if (typeof w === 'string') {
      const g = evaluateLegacyStringWarning(w)
      if (g) return g
      continue
    }
    const g = evaluateStructuredWarning(w)
    if (g) return g
  }

  return { ok: true }
}

/** @deprecated 使用 evaluateTranscribeForDeepSeek；保留兼容旧 stub */
export function shouldBlockDeepSeekAfterTranscribe(input: {
  recognitionUncertain: boolean
  confidence: number | null
  recognitionWarnings?: HsMathRecognitionWarning[]
  uncertainFieldPresent?: boolean
}): boolean {
  const gate = evaluateTranscribeForDeepSeek({
    recognizedWork: 'x',
    recognitionUncertain: input.recognitionUncertain,
    uncertainFieldPresent: input.uncertainFieldPresent !== false,
    recognitionWarnings: input.recognitionWarnings || [],
    confidence: input.confidence,
  })
  return !gate.ok
}
