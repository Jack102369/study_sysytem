/**
 * APPLICATION-3A/3D-5：AI 批改结果严格校验（纯函数，无网络）。
 */
import { HS_MATH_VISION_CONFIDENCE_REVIEW_THRESHOLD } from '../hs-math.constants'
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'
import type {
  HsMathAiGradeJson,
  HsMathAiGradeValidateResult,
  HsMathAiInputModality,
  HsMathAiRubricScore,
} from '../types/ai-grade-protocol'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && Number.isFinite(v)
}

function isValidText(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/**
 * 校验 AI 原始输出相对题目 rubric / maxScore。
 * - 不允许缺项 / 重复 / 未知 key
 * - 分项整数、边界、总和一致
 * - 不信任 AI 返回的 maxScore 覆盖题目满分
 */
export function validateHsMathAiGradeResult(input: {
  raw: unknown
  rubric: HsMathApplicationRubricItem[]
  maxScore: number
  model: string
  gradedAtIso: string
  /** 3D-5 可选元数据（写入 ai_grade_json） */
  inputModality?: HsMathAiInputModality
  imageCount?: number
}): HsMathAiGradeValidateResult {
  const { rubric, maxScore, model, gradedAtIso } = input

  if (!Array.isArray(rubric) || rubric.length === 0) {
    return { ok: false, code: 'EMPTY_RUBRIC', message: '题目 rubric 为空' }
  }
  if (!isNonNegInt(maxScore) || maxScore <= 0) {
    return { ok: false, code: 'BAD_ITEM_MAX', message: '题目 maxScore 非法' }
  }
  const rubricSum = rubric.reduce((s, r) => s + r.maxScore, 0)
  if (rubricSum !== maxScore) {
    return {
      ok: false,
      code: 'ITEM_SCORE_MISMATCH',
      message: `题目 rubric 合计 ${rubricSum} ≠ maxScore ${maxScore}`,
    }
  }

  if (typeof input.raw === 'string') {
    const trimmed = input.raw.trim()
    if (!trimmed) {
      return { ok: false, code: 'EMPTY_JSON', message: 'AI 返回空内容' }
    }
    try {
      input = { ...input, raw: JSON.parse(stripMarkdownFence(trimmed)) }
    } catch {
      return { ok: false, code: 'INVALID_JSON', message: 'AI 返回非法 JSON' }
    }
  }

  if (!isPlainObject(input.raw)) {
    return { ok: false, code: 'NOT_OBJECT', message: 'AI 返回非对象' }
  }
  const raw = input.raw

  const scoresRaw = Array.isArray(raw.rubricScores)
    ? raw.rubricScores
    : Array.isArray(raw.rubric_scores)
      ? raw.rubric_scores
      : null
  if (!scoresRaw) {
    return { ok: false, code: 'MISSING_RUBRIC_SCORES', message: '缺少 rubricScores' }
  }

  const expectedKeys = rubric.map((r) => r.key)
  const expectedMap = new Map(rubric.map((r) => [r.key, r]))
  const seen = new Set<string>()
  const rubricScores: HsMathAiRubricScore[] = []

  for (const row of scoresRaw) {
    if (!isPlainObject(row)) {
      return { ok: false, code: 'BAD_SCORE_ITEM', message: 'rubricScores 项非法' }
    }
    const keyRaw =
      typeof row.rubricKey === 'string'
        ? row.rubricKey
        : typeof row.key === 'string'
          ? row.key
          : ''
    const rubricKey = keyRaw.trim()
    if (!rubricKey) {
      return { ok: false, code: 'EMPTY_KEY', message: 'rubricKey 为空' }
    }
    if (seen.has(rubricKey)) {
      return {
        ok: false,
        code: 'DUP_KEY',
        message: `rubricKey 重复：${rubricKey}`,
      }
    }
    seen.add(rubricKey)
    const expected = expectedMap.get(rubricKey)
    if (!expected) {
      return {
        ok: false,
        code: 'UNKNOWN_KEY',
        message: `未知 rubricKey：${rubricKey}`,
      }
    }
    if (!isNonNegInt(row.score)) {
      return {
        ok: false,
        code: 'BAD_SCORE',
        message: `${rubricKey} score 必须为非负整数`,
      }
    }
    if (row.score > expected.maxScore) {
      return {
        ok: false,
        code: 'SCORE_OVERFLOW',
        message: `${rubricKey} score ${row.score} > max ${expected.maxScore}`,
      }
    }
    if (!isValidText(row.feedback)) {
      return {
        ok: false,
        code: 'EMPTY_FEEDBACK',
        message: `${rubricKey} feedback 不能为空`,
      }
    }
    // 忽略 AI 自报 maxScore，强制使用题目分值
    rubricScores.push({
      rubricKey,
      score: row.score,
      maxScore: expected.maxScore,
      feedback: String(row.feedback).trim().slice(0, 2000),
    })
  }

  if (seen.size !== expectedKeys.length) {
    const missing = expectedKeys.filter((k) => !seen.has(k))
    return {
      ok: false,
      code: 'MISSING_KEYS',
      message: `rubric 缺项：${missing.join(',')}`,
    }
  }

  // 按题目 rubric 顺序重排，便于展示稳定
  rubricScores.sort(
    (a, b) => expectedKeys.indexOf(a.rubricKey) - expectedKeys.indexOf(b.rubricKey),
  )

  const sumScores = rubricScores.reduce((s, r) => s + r.score, 0)
  if (!isNonNegInt(raw.totalScore)) {
    return {
      ok: false,
      code: 'BAD_TOTAL',
      message: 'totalScore 必须为非负整数',
    }
  }
  if (raw.totalScore !== sumScores) {
    return {
      ok: false,
      code: 'TOTAL_MISMATCH',
      message: `totalScore ${raw.totalScore} ≠ 分项合计 ${sumScores}`,
    }
  }
  if (raw.totalScore > maxScore) {
    return {
      ok: false,
      code: 'TOTAL_OVERFLOW',
      message: `totalScore ${raw.totalScore} > maxScore ${maxScore}`,
    }
  }

  if (!isValidText(raw.personalizedExplanation)) {
    return {
      ok: false,
      code: 'EMPTY_EXPLANATION',
      message: 'personalizedExplanation 不能为空',
    }
  }

  let confidence: number | null = null
  if (raw.confidence !== undefined && raw.confidence !== null) {
    const c = Number(raw.confidence)
    if (!Number.isFinite(c) || c < 0 || c > 1) {
      return {
        ok: false,
        code: 'BAD_CONFIDENCE',
        message: 'confidence 须在 [0,1]',
      }
    }
    confidence = Math.round(c * 10000) / 10000
  }

  const errors = Array.isArray(raw.errors)
    ? raw.errors
        .map((e) => String(e).trim())
        .filter(Boolean)
        .slice(0, 20)
    : []

  const recognizedWork =
    typeof raw.recognizedWork === 'string'
      ? raw.recognizedWork.trim().slice(0, 8000)
      : typeof raw.recognized_work === 'string'
        ? String(raw.recognized_work).trim().slice(0, 8000)
        : ''

  const warningsRaw = Array.isArray(raw.recognitionWarnings)
    ? raw.recognitionWarnings
    : Array.isArray(raw.recognition_warnings)
      ? raw.recognition_warnings
      : []
  // 3E-8：兼容 string 与结构化 object；非法对象仅保留 description 文本（直评路径不阻断）
  type WarningEntry = NonNullable<
    import('../types/ai-grade-protocol').HsMathAiGradeJson['recognitionWarnings']
  >[number]
  const recognitionWarnings: WarningEntry[] = []
  for (const w of warningsRaw.slice(0, 20)) {
    if (typeof w === 'string') {
      const s = w.trim()
      if (s) recognitionWarnings.push(s)
      continue
    }
    if (w && typeof w === 'object' && !Array.isArray(w)) {
      const o = w as Record<string, unknown>
      if (typeof o.description === 'string' && o.description.trim()) {
        recognitionWarnings.push({
          pageIndex: typeof o.pageIndex === 'number' ? o.pageIndex : 0,
          location: typeof o.location === 'string' ? o.location : 'unknown',
          category: typeof o.category === 'string' ? o.category : 'unknown',
          severity: typeof o.severity === 'string' ? o.severity : 'unknown',
          description: String(o.description).trim().slice(0, 500),
          affectsScoring:
            typeof o.affectsScoring === 'boolean' ? o.affectsScoring : true,
        })
      }
    }
  }

  const flagUncertain =
    raw.recognitionUncertain === true ||
    raw.recognition_uncertain === true ||
    String(raw.recognitionUncertain || '').toLowerCase() === 'true'

  const lowConfidence =
    confidence != null &&
    confidence < HS_MATH_VISION_CONFIDENCE_REVIEW_THRESHOLD &&
    (input.imageCount ?? 0) > 0

  const recognitionUncertain = flagUncertain || lowConfidence

  const value: HsMathAiGradeJson = {
    status: 'graded',
    totalScore: raw.totalScore,
    maxScore,
    rubricScores,
    recognizedWork,
    errors,
    personalizedExplanation: String(raw.personalizedExplanation)
      .trim()
      .slice(0, 8000),
    confidence,
    model: (model || 'unknown').slice(0, 64),
    gradedAt: gradedAtIso,
  }
  if (input.inputModality) value.inputModality = input.inputModality
  if (typeof input.imageCount === 'number') value.imageCount = input.imageCount
  if (recognitionWarnings.length) value.recognitionWarnings = recognitionWarnings

  return { ok: true, value, recognitionUncertain }
}

function stripMarkdownFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

/** 会话计数：graded 不计 correct/wrong/pending；pending-like 计 pending */
export function recountHsMathSessionGradeCounts(
  results: Array<string | null | undefined>,
): { correct: number; wrong: number; pending: number } {
  let correct = 0
  let wrong = 0
  let pending = 0
  for (const r of results) {
    if (r === 'correct') correct++
    else if (r === 'wrong') wrong++
    else if (
      r === 'pending_review' ||
      r === 'pending_ai' ||
      r === 'grading' ||
      r === 'review_required' ||
      r === 'grading_failed'
    ) {
      pending++
    }
    // graded / null / 其它：不计三桶（graded 单独用 ai_grade_json 展示）
  }
  return { correct, wrong, pending }
}

/**
 * 纯文字 → text_ai；含图 → vision_ai（submit 侧再按 Vision 开关决定 pending_ai / review_required）。
 * 兼容旧名：不得再返回 review_required（由 train submit 写入）。
 */
export function classifyApplicationSubmitRoute(user: {
  text?: string
  imageIds?: string[]
}): 'text_ai' | 'vision_ai' | 'empty' {
  const hasText = typeof user.text === 'string' && !!user.text.trim()
  const hasImages = Array.isArray(user.imageIds) && user.imageIds.length > 0
  if (!hasText && !hasImages) return 'empty'
  if (hasImages) return 'vision_ai'
  return 'text_ai'
}
