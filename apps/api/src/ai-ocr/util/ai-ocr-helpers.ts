import {
  AI_OCR_COMPARE_VERDICTS,
  AI_OCR_INPUT_TEXT_MAX_CHARS,
  AI_OCR_VERDICTS,
  type AiOcrCompareVerdict,
  type AiOcrVerdict,
} from '../ai-ocr.constants'

export function toSafeErrorMessage(
  raw: string | null | undefined,
  fallback: string,
): string {
  const t = String(raw || '')
    .replace(/[/\\][^\s]{0,200}/g, '[path]')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return fallback.slice(0, 255)
  return t.slice(0, 255)
}

/**
 * Vision OCR 常把下标写成 $m\_1$ / $\mu\_2$，导致显示与 KaTeX 下标错误。
 * 将数学片段内（及全文常见）的 \_ → _，不改动其它反斜杠命令。
 */
export function normalizeOcrLatexEscapes(
  raw: string | null | undefined,
): string {
  const text = String(raw || '')
  if (!text) return ''
  const fixSeg = (s: string) => s.replace(/\\_/g, '_')
  return text.replace(
    /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g,
    (full, display, inline) => {
      if (display != null) return `$$${fixSeg(display)}$$`
      return `$${fixSeg(inline || '')}$`
    },
  )
}

export function isImageAttachment(input: {
  mimeType?: string | null
  url?: string | null
}): boolean {
  const mime = String(input.mimeType || '').toLowerCase()
  const url = String(input.url || '')
  if (mime.includes('svg') || /\.svg(\?|$)/i.test(url)) return false
  if (mime.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url)
}

export function buildParseSystemPrompt(subjectLabel: string): string {
  return [
    `你是中学${subjectLabel}教师助手。只输出一个完整可解析的 JSON；禁止输出思考草稿、Markdown 围栏。`,
    '格式：{"answer":"...","analysis":"...","knowledgePoints":"...","methodSummary":"...","selfCheck":"..."}。',
    '流程（脑中完成，勿把草稿写入 analysis）：①逐问求解 ②用答案做模型内自检 ③不通过则改正后再输出 JSON。',
    '自检（必须，仅针对本模型答案）：把 answer 代入原题条件；或由答案反推所需中间量/摩擦力/加速度是否自洽；多问则逐问检查。',
    '明显矛盾红线（命中则禁止原样输出，须先改正）：条件已变更（翻面、μ 互换、更换接触面等）后不得照搬变更前结论；',
    '若答案隐含相对静止/整体匀速，必须核验最大静摩擦（或等价上限）是否≥所需力，不成立则不能仍写“摩擦力=拉力/两处都等于 F”之类。',
    '另检：对称用 f(a+t)+f(a-t)=2b；任意存在→值域包含方向；含参分段 min/max；answer 与 analysis 一致。',
    'answer：最终结论（纯文本优先）；analysis≤200字只写正确关键步骤，禁止“不对/重新/等等”；',
    'knowledgePoints≤40字；methodSummary≤50字；selfCheck≤110字（写清每问：代入或反推了什么、是否通过/已改正）。',
    '纪律：有理函数先化简；不确定处在 answer/selfCheck 标明，禁止硬猜。',
    'JSON 内换行只能 \\n；LaTeX 反斜杠必须 \\\\；所有字符串必须写完并闭合。',
  ].join('')
}

/** 去掉模型前后噪声（思考标签、围栏、BOM） */
export function stripModelNoise(content: string): string {
  return String(content || '')
    .replace(/^\uFEFF/, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<redacted_thinking>[\s\S]*?<\/redacted_thinking>/gi, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
}

/** 模型常输出 \frac 未转义成 \\frac，修补后再 JSON.parse */
export function repairJsonBackslashes(content: string): string {
  // \frac/\bar 等会被 JSON 当成 \f/\b 合法转义，须先抬成 \\\\command
  let s = content.replace(
    /(?<!\\)\\(frac|bar|binom|mathbb|mathfrak|text|triangle|times|cdot|neq|notin|nu|nabla|leq|geq|to|big|left|right)\b/g,
    '\\\\$1',
  )
  s = s.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
  return s
}

/** 去掉对象/数组中的尾逗号 */
export function repairJsonTrailingCommas(content: string): string {
  return content.replace(/,(\s*[}\]])/g, '$1')
}

function tryParseJsonObject(raw: string): Record<string, unknown> | null {
  const attempts = [
    raw,
    repairJsonTrailingCommas(raw),
    repairJsonBackslashes(raw),
    repairJsonRawNewlinesInStrings(raw),
    repairJsonBackslashes(repairJsonRawNewlinesInStrings(raw)),
    repairJsonTrailingCommas(
      repairJsonBackslashes(repairJsonRawNewlinesInStrings(raw)),
    ),
  ]
  for (const text of attempts) {
    try {
      const obj = JSON.parse(text) as unknown
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return obj as Record<string, unknown>
      }
    } catch {
      /* next */
    }
  }
  return null
}

/** 收集可能的 JSON 对象片段（优先含 answer 的） */
function collectJsonObjectCandidates(src: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (s: string | null | undefined) => {
    const t = String(s || '').trim()
    if (!t || seen.has(t)) return
    seen.add(t)
    out.push(t)
  }
  push(src)
  let from = 0
  while (from < src.length) {
    const idx = src.indexOf('"answer"', from)
    if (idx < 0) break
    const brace = src.lastIndexOf('{', idx)
    if (brace >= 0) push(sliceBalanced(src.slice(brace), '{', '}'))
    from = idx + 8
  }
  push(sliceBalanced(src, '{', '}'))
  const lastBrace = src.lastIndexOf('{')
  if (lastBrace > 0) push(sliceBalanced(src.slice(lastBrace), '{', '}'))
  return out
}

export function buildParseUserPrompt(snapshot: string): string {
  const text = String(snapshot || '').slice(0, AI_OCR_INPUT_TEXT_MAX_CHARS)
  return `【题目识别文字】\n${text}\n\n请按约定返回 JSON。`
}

/** 字符串感知的括号切片，避免把 LaTeX \{ \} 或字符串内括号当结构 */
function sliceBalanced(src: string, open: string, close: string): string | null {
  const start = src.indexOf(open)
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < src.length; i++) {
    const ch = src[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') {
      inStr = true
      continue
    }
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return src.slice(start, i + 1)
    }
  }
  return null
}

/** 将 JSON 字符串字面量内的裸换行/回车转成 \\n / \\r，便于解析截断前的合法片段 */
export function repairJsonRawNewlinesInStrings(content: string): string {
  let out = ''
  let inStr = false
  let esc = false
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (inStr) {
      if (esc) {
        out += ch
        esc = false
        continue
      }
      if (ch === '\\') {
        out += ch
        esc = true
        continue
      }
      if (ch === '"') {
        out += ch
        inStr = false
        continue
      }
      if (ch === '\n') {
        out += '\\n'
        continue
      }
      if (ch === '\r') {
        out += '\\r'
        continue
      }
      if (ch === '\t') {
        out += '\\t'
        continue
      }
      out += ch
      continue
    }
    if (ch === '"') {
      inStr = true
      out += ch
      continue
    }
    out += ch
  }
  return out
}

function optionalTrimmedString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t || null
}

function coerceJsonTextField(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) {
    const parts = v
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
    return parts.length ? parts.join('\n') : null
  }
  return null
}

/** 从可能被截断的 JSON 文本中捞出已写出的字符串字段 */
function extractJsonStringFieldLoose(
  src: string,
  key: string,
): { value: string; closed: boolean } | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"`)
  const m = re.exec(src)
  if (!m) return null
  let i = m.index + m[0].length
  let out = ''
  let esc = false
  const unescape = (s: string) =>
    s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  for (; i < src.length; i++) {
    const ch = src[i]
    if (esc) {
      out += ch
      esc = false
      continue
    }
    if (ch === '\\') {
      out += ch
      esc = true
      continue
    }
    if (ch === '"') {
      return { value: unescape(out), closed: true }
    }
    out += ch
  }
  const t = unescape(out).trim()
  return t ? { value: t, closed: false } : null
}

function salvageTruncatedAnalysisJson(src: string): {
  answer: string
  analysis: string
  knowledgePoints: string | null
  methodSummary: string | null
  selfCheck: string | null
} | null {
  const answerHit = extractJsonStringFieldLoose(src, 'answer')
  if (!answerHit?.value.trim()) return null
  // answer 都没闭合则不可信
  if (!answerHit.closed) return null
  const analysisHit = extractJsonStringFieldLoose(src, 'analysis')
  let analysis: string
  if (!analysisHit?.value.trim()) {
    analysis =
      '（解析正文不完整或被截断，答案供参考；建议改用 DeepSeek 重试）'
  } else if (!analysisHit.closed) {
    analysis = `${analysisHit.value.trim()}\n…（后文被截断）`
  } else {
    analysis = analysisHit.value.trim()
  }
  const kp = extractJsonStringFieldLoose(src, 'knowledgePoints')
  const ms = extractJsonStringFieldLoose(src, 'methodSummary')
  const sc = extractJsonStringFieldLoose(src, 'selfCheck')
  return {
    answer: answerHit.value.trim(),
    analysis,
    knowledgePoints: kp?.closed ? kp.value.trim() || null : null,
    methodSummary: ms?.closed ? ms.value.trim() || null : null,
    selfCheck: sc?.closed ? sc.value.trim() || null : null,
  }
}

export function parseModelAnalysisJson(
  content: string | null | undefined,
):
  | {
      ok: true
      value: {
        answer: string
        analysis: string
        knowledgePoints: string | null
        methodSummary: string | null
        selfCheck: string | null
      }
    }
  | { ok: false; reason: string } {
  const trimmed = String(content || '').trim()
  if (!trimmed) return { ok: false, reason: 'empty_model_content' }
  const noFence = stripModelNoise(trimmed)
  if (!noFence) return { ok: false, reason: 'empty_model_content' }
  const candidates = collectJsonObjectCandidates(noFence)
  let sawInvalidFields = false
  let sawEmptyFields = false
  for (const c of candidates) {
    const obj = tryParseJsonObject(c)
    if (!obj) continue
    const answer = coerceJsonTextField(obj.answer)
    const analysis = coerceJsonTextField(obj.analysis)
    if (answer == null || analysis == null) {
      sawInvalidFields = true
      continue
    }
    const a = answer.trim()
    const an = analysis.trim()
    if (!a || !an) {
      sawEmptyFields = true
      continue
    }
    return {
      ok: true,
      value: {
        answer: a,
        analysis: an,
        knowledgePoints: optionalTrimmedString(
          coerceJsonTextField(obj.knowledgePoints) ?? undefined,
        ),
        methodSummary: optionalTrimmedString(
          coerceJsonTextField(obj.methodSummary) ?? undefined,
        ),
        selfCheck: optionalTrimmedString(
          coerceJsonTextField(obj.selfCheck) ?? undefined,
        ),
      },
    }
  }
  const salvaged = salvageTruncatedAnalysisJson(noFence)
  if (salvaged) {
    return { ok: true, value: salvaged }
  }
  if (sawEmptyFields) return { ok: false, reason: 'empty_fields' }
  if (sawInvalidFields) return { ok: false, reason: 'invalid_fields' }
  return { ok: false, reason: 'unparseable_json' }
}

/** 失败排查用：压缩模型原文预览（不抛路径） */
export function previewModelContent(
  content: string | null | undefined,
  max = 180,
): string {
  const t = String(content || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return ''
  return t.slice(0, max)
}

export function resolveInputSnapshot(opts: {
  inputText?: string | null
  recognizedTextRaw: string
}): { ok: true; snapshot: string } | { ok: false; reason: string } {
  const raw = String(opts.recognizedTextRaw || '').trim()
  if (!raw) return { ok: false, reason: 'empty_recognized_text' }
  if (opts.inputText === undefined || opts.inputText === null) {
    if (raw.length > AI_OCR_INPUT_TEXT_MAX_CHARS) {
      return { ok: false, reason: 'input_too_long' }
    }
    return { ok: true, snapshot: raw }
  }
  const corrected = String(opts.inputText).trim()
  if (!corrected) return { ok: false, reason: 'empty_input_text' }
  if (corrected.length > AI_OCR_INPUT_TEXT_MAX_CHARS) {
    return { ok: false, reason: 'input_too_long' }
  }
  return { ok: true, snapshot: corrected }
}

export function subjectLabel(subject: string): string {
  if (subject === 'math') return '数学'
  if (subject === 'physics') return '物理'
  if (subject === 'chemistry') return '化学'
  return subject
}

export function buildNoAnswerGradeSystemPrompt(subjectLabel: string): string {
  return [
    `你是中学${subjectLabel}教师助手。学生未提交作答，请仅根据题目文字给出标准答案与解析。`,
    '只输出一个 JSON 对象，格式严格为：{"correctAnswer":"...","correctAnalysis":"..."}。',
    'correctAnswer：最终答案（简洁）；correctAnalysis：解题步骤与要点。',
    'JSON 字符串内：换行写成 \\n；LaTeX 反斜杠必须写成 \\\\（例如 \\\\frac{1}{a}）。',
    '若题目不完整，请在字段中明确写出不确定之处，禁止硬猜。',
    '不要输出 Markdown 代码围栏，不要输出 JSON 以外的文字，不要输出 HTML/脚本。',
  ].join('')
}

export function buildNoAnswerGradeUserPrompt(question: string): string {
  const text = String(question || '').slice(0, AI_OCR_INPUT_TEXT_MAX_CHARS)
  return `【题目文字】\n${text}\n\n学生未作答。请按约定返回 JSON。`
}

export function buildGradeSystemPrompt(subjectLabel: string): string {
  return [
    `你是中学${subjectLabel}教师助手。对照「题目文字」与「学生作答」批改打分，并给出标准答案与解析。`,
    '只输出一个 JSON 对象，格式严格为：',
    '{"score":0,"verdict":"correct|partial|wrong","feedback":"...","correctAnswer":"...","correctAnalysis":"..."}。',
    'score：0-100 整数；verdict：correct=全对，partial=部分正确，wrong=错误。',
    'feedback：针对学生作答的过程点评（指出对错与改进点）；correctAnswer/correctAnalysis：标准答案与解题步骤。',
    '标准答案纪律：有理函数先化简再换元；对称中心须验算；值域题先写包含关系再分段求 min/max；correctAnswer 须与 correctAnalysis 一致。',
    'JSON 字符串内：换行写成 \\n；LaTeX 反斜杠必须写成 \\\\（例如 \\\\frac{1}{a}）。',
    '若题目或作答不完整，请在 feedback 中说明，并尽量给出可确定部分；禁止硬猜。',
    '不要输出 Markdown 代码围栏，不要输出 JSON 以外的文字，不要输出 HTML/脚本。',
  ].join('')
}

export function buildGradeUserPrompt(opts: {
  question: string
  studentAnswer: string
}): string {
  const q = String(opts.question || '').slice(0, AI_OCR_INPUT_TEXT_MAX_CHARS)
  const a = String(opts.studentAnswer || '').slice(0, AI_OCR_INPUT_TEXT_MAX_CHARS)
  return `【题目文字】\n${q}\n\n【学生作答】\n${a}\n\n请按约定返回 JSON。`
}

function clampScore(n: unknown): number | null {
  if (typeof n === 'number' && Number.isFinite(n)) {
    return Math.max(0, Math.min(100, Math.round(n)))
  }
  if (typeof n === 'string' && n.trim() !== '') {
    const v = Number(n)
    if (Number.isFinite(v)) return Math.max(0, Math.min(100, Math.round(v)))
  }
  return null
}

function isVerdict(v: unknown): v is AiOcrVerdict {
  return typeof v === 'string' && (AI_OCR_VERDICTS as readonly string[]).includes(v)
}

export function parseModelNoAnswerGradeJson(
  content: string | null | undefined,
):
  | { ok: true; value: { correctAnswer: string; correctAnalysis: string } }
  | { ok: false; reason: string } {
  const trimmed = String(content || '').trim()
  if (!trimmed) return { ok: false, reason: 'empty_model_content' }
  const noFence = trimmed
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const candidates = [noFence]
  const balanced = sliceBalanced(noFence, '{', '}')
  if (balanced) candidates.push(balanced)
  for (const c of candidates) {
    const obj = tryParseJsonObject(c)
    if (!obj) continue
    const correctAnswer = obj.correctAnswer
    const correctAnalysis = obj.correctAnalysis
    if (
      typeof correctAnswer !== 'string' ||
      typeof correctAnalysis !== 'string'
    ) {
      return { ok: false, reason: 'invalid_fields' }
    }
    const a = correctAnswer.trim()
    const an = correctAnalysis.trim()
    if (!a || !an) return { ok: false, reason: 'empty_fields' }
    return { ok: true, value: { correctAnswer: a, correctAnalysis: an } }
  }
  return { ok: false, reason: 'unparseable_json' }
}

export function parseModelGradeJson(
  content: string | null | undefined,
):
  | {
      ok: true
      value: {
        score: number
        verdict: Exclude<AiOcrVerdict, 'no_answer'>
        feedback: string
        correctAnswer: string
        correctAnalysis: string
      }
    }
  | { ok: false; reason: string } {
  const trimmed = String(content || '').trim()
  if (!trimmed) return { ok: false, reason: 'empty_model_content' }
  const noFence = trimmed
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const candidates = [noFence]
  const balanced = sliceBalanced(noFence, '{', '}')
  if (balanced) candidates.push(balanced)
  for (const c of candidates) {
    const obj = tryParseJsonObject(c)
    if (!obj) continue
    const score = clampScore(obj.score)
    const verdict = obj.verdict
    const feedback = obj.feedback
    const correctAnswer = obj.correctAnswer
    const correctAnalysis = obj.correctAnalysis
    if (score === null) return { ok: false, reason: 'invalid_score' }
    if (
      !isVerdict(verdict) ||
      verdict === 'no_answer' ||
      typeof feedback !== 'string' ||
      typeof correctAnswer !== 'string' ||
      typeof correctAnalysis !== 'string'
    ) {
      return { ok: false, reason: 'invalid_fields' }
    }
    const fb = feedback.trim()
    const a = correctAnswer.trim()
    const an = correctAnalysis.trim()
    if (!fb || !a || !an) return { ok: false, reason: 'empty_fields' }
    return {
      ok: true,
      value: {
        score,
        verdict,
        feedback: fb,
        correctAnswer: a,
        correctAnalysis: an,
      },
    }
  }
  return { ok: false, reason: 'unparseable_json' }
}

/** 解析题目文字快照：优先用户修正，否则用识别原文 */
export function resolveQuestionSnapshot(opts: {
  questionText?: string | null
  recognizedTextRaw: string
}): { ok: true; snapshot: string } | { ok: false; reason: string } {
  return resolveInputSnapshot({
    inputText: opts.questionText,
    recognizedTextRaw: opts.recognizedTextRaw,
  })
}

/**
 * 作答快照：
 * - 显式传入 studentAnswerText（含空串）→ 以用户文字为准（空=未作答）
 * - 未传文字 → 回退 OCR raw；都无则未作答
 */
export function resolveStudentAnswerSnapshot(opts: {
  studentAnswerText?: string | null
  studentAnswerRaw?: string | null
}):
  | { ok: true; empty: true; snapshot: null }
  | { ok: true; empty: false; snapshot: string }
  | { ok: false; reason: string } {
  const raw = String(opts.studentAnswerRaw || '').trim()
  if (
    opts.studentAnswerText !== undefined &&
    opts.studentAnswerText !== null
  ) {
    const typed = String(opts.studentAnswerText).trim()
    if (!typed) return { ok: true, empty: true, snapshot: null }
    if (typed.length > AI_OCR_INPUT_TEXT_MAX_CHARS) {
      return { ok: false, reason: 'input_too_long' }
    }
    return { ok: true, empty: false, snapshot: typed }
  }
  if (!raw) return { ok: true, empty: true, snapshot: null }
  if (raw.length > AI_OCR_INPUT_TEXT_MAX_CHARS) {
    return { ok: false, reason: 'input_too_long' }
  }
  return { ok: true, empty: false, snapshot: raw }
}

export function buildCompareSystemPrompt(subjectLabel: string): string {
  return [
    `你是中学${subjectLabel}教师。对照同一道题两份模型答案，判断实质是否一致并标明区别；禁止改写任何一方答案。`,
    '只输出 JSON：{"verdict":"agree|differ|uncertain","note":"..."}。',
    '判定前先做代数/物理等价检查：可用本题其它小问结果互代化简（如用 (2) 的 μ1 化简 (1)）；',
    '允许 ≥/\\ge、分数写法、因子顺序、纯文本与 LaTeX 不同。等价则该问视为一致。',
    'agree：各问实质一致（含等价变形）；differ：代入/化简后仍有关键结论矛盾；uncertain：题干不足。',
    'note≤140字：按小问写。仅写法不同写「(k)等价：…」；真不一致写两边结论 Diff。不要写“应改成谁的答案”。',
    '禁止 Markdown 围栏与 JSON 外文字；换行用 \\n；LaTeX 反斜杠写成 \\\\。',
  ].join('')
}

export function buildCompareUserPrompt(opts: {
  question: string
  priorProvider: string
  priorAnswer: string
  currentProvider: string
  currentAnswer: string
}): string {
  const q = String(opts.question || '').slice(0, AI_OCR_INPUT_TEXT_MAX_CHARS)
  const pa = String(opts.priorAnswer || '').slice(0, 2000)
  const ca = String(opts.currentAnswer || '').slice(0, 2000)
  return [
    `【题目】\n${q}`,
    `\n【先前模型 ${opts.priorProvider} 答案】\n${pa}`,
    `\n【当前模型 ${opts.currentProvider} 答案】\n${ca}`,
    '\n请按约定返回 JSON。',
  ].join('\n')
}

function isCompareVerdict(v: unknown): v is AiOcrCompareVerdict {
  return (
    typeof v === 'string' &&
    (AI_OCR_COMPARE_VERDICTS as readonly string[]).includes(v)
  )
}

export function parseModelCompareJson(
  content: string | null | undefined,
):
  | { ok: true; value: { verdict: AiOcrCompareVerdict; note: string } }
  | { ok: false; reason: string } {
  const trimmed = String(content || '').trim()
  if (!trimmed) return { ok: false, reason: 'empty_model_content' }
  const noFence = stripModelNoise(trimmed)
  if (!noFence) return { ok: false, reason: 'empty_model_content' }
  const candidates: string[] = []
  const seen = new Set<string>()
  const push = (s: string | null | undefined) => {
    const t = String(s || '').trim()
    if (!t || seen.has(t)) return
    seen.add(t)
    candidates.push(t)
  }
  push(noFence)
  let from = 0
  while (from < noFence.length) {
    const idx = noFence.indexOf('"verdict"', from)
    if (idx < 0) break
    const brace = noFence.lastIndexOf('{', idx)
    if (brace >= 0) push(sliceBalanced(noFence.slice(brace), '{', '}'))
    from = idx + 9
  }
  push(sliceBalanced(noFence, '{', '}'))
  for (const c of candidates) {
    const obj = tryParseJsonObject(c)
    if (!obj) continue
    if (!isCompareVerdict(obj.verdict)) continue
    const note = coerceJsonTextField(obj.note)
    if (note == null) continue
    const n = note.trim()
    if (!n) continue
    return { ok: true, value: { verdict: obj.verdict, note: n } }
  }
  return { ok: false, reason: 'unparseable_json' }
}
