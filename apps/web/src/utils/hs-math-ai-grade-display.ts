/**
 * APPLICATION-4A：应用题 AI 批改结果展示纯函数（无网络）。
 */
import type {
  HsMathAiGrade,
  HsMathApplicationUserAnswer,
  HsMathUserAnswerPayload,
} from '@/api/hs-math-train'

export type HsMathRecognitionWarningStructured = {
  pageIndex: number
  location: string
  category: string
  severity: string
  description: string
  affectsScoring: boolean
}

export type HsMathRecognitionWarning =
  | string
  | HsMathRecognitionWarningStructured

const RUBRIC_TITLE_ZH: Record<string, string> = {
  model: '建立模型',
  domain: '确定定义域',
  solve: '求解最值',
  conclusion: '作答结论',
}

export function formatRubricKeyTitle(rubricKey: string): string {
  const k = String(rubricKey || '').trim()
  return RUBRIC_TITLE_ZH[k] || k || '评分项'
}

/** 批改方式（学生选择 / pipeline），不含具体模型名冒充 */
export function formatGradingMethodLabel(input: {
  gradingProvider?: string | null
  pipeline?: string | null
  userAnswerPayload?: HsMathUserAnswerPayload | null
}): string {
  const fromUser =
    input.userAnswerPayload &&
    input.userAnswerPayload.kind === 'application'
      ? (input.userAnswerPayload as HsMathApplicationUserAnswer).gradingProvider
      : undefined
  const provider = input.gradingProvider || fromUser || ''
  if (
    input.pipeline === 'qwen_then_deepseek' ||
    provider === 'deepseek'
  ) {
    if (input.pipeline === 'qwen_then_deepseek') {
      return 'DeepSeek（千问识别）'
    }
    return 'DeepSeek'
  }
  return '千问'
}

export function formatScoringModelLabel(
  grade: Pick<HsMathAiGrade, 'scoringModel' | 'model'> | null | undefined,
): string {
  if (!grade) return ''
  return String(grade.scoringModel || grade.model || '').trim()
}

export function formatVisionModelLabel(
  grade: Pick<HsMathAiGrade, 'visionModel' | 'pipeline'> | null | undefined,
): string {
  if (!grade) return ''
  const v = String(grade.visionModel || '').trim()
  if (v) return v
  return ''
}

export function formatGradedAtLabel(gradedAt: string | null | undefined): string {
  if (!gradedAt || !String(gradedAt).trim()) return ''
  const d = new Date(gradedAt)
  if (Number.isNaN(d.getTime())) return String(gradedAt).trim()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 兼容旧版「单一标签」展示；仍不把 provider 当模型名。
 * 新 UI 优先用 method / scoring / vision 分行。
 */
export function formatAiGradingProviderLabel(
  grade: Pick<
    HsMathAiGrade,
    'gradingProvider' | 'pipeline' | 'visionModel' | 'scoringModel' | 'model'
  > | null | undefined,
): string {
  if (!grade) return ''
  const method = formatGradingMethodLabel(grade)
  const scoring = formatScoringModelLabel(grade)
  const vision = formatVisionModelLabel(grade)
  if (grade.pipeline === 'qwen_then_deepseek') {
    const parts = [method]
    if (scoring) parts.push(`评分 ${scoring}`)
    if (vision) parts.push(`识别 ${vision}`)
    return parts.join(' · ')
  }
  if (scoring) return `${method} · ${scoring}`
  if (vision) return `${method} · ${vision}`
  return method
}

export function recognizedWorkCaption(
  grade: Pick<HsMathAiGrade, 'pipeline'> | null | undefined,
): string {
  if (grade?.pipeline === 'qwen_then_deepseek') return '识别过程（AI 转写）'
  return '识别过程'
}

export function shouldShowRecognizedWorkEmpty(input: {
  hasImages: boolean
  recognizedWork?: string | null
}): boolean {
  if (!input.hasImages) return false
  return !String(input.recognizedWork || '').trim()
}

function isStructuredWarning(w: unknown): w is HsMathRecognitionWarningStructured {
  return (
    !!w &&
    typeof w === 'object' &&
    !Array.isArray(w) &&
    typeof (w as HsMathRecognitionWarningStructured).description === 'string'
  )
}

function isAllowlistedAuxiliary(w: HsMathRecognitionWarningStructured): boolean {
  return (
    w.category === 'auxiliary_text' &&
    w.severity === 'minor' &&
    w.affectsScoring === false
  )
}

function isUnreliableStructured(w: HsMathRecognitionWarningStructured): boolean {
  if (w.severity === 'critical' || w.severity === 'unknown') return true
  if (w.category === 'unknown') return true
  if (w.affectsScoring === true) return true
  if (!isAllowlistedAuxiliary(w)) return true
  return false
}

/**
 * 识别警告友好摘要；不得把 UNKNOWN/critical 降级为「辅助文字」。
 */
export function summarizeRecognitionWarnings(
  warnings: HsMathRecognitionWarning[] | null | undefined,
): { kind: 'none' | 'friendly_aux' | 'unreliable' | 'plain'; text: string } {
  if (!warnings?.length) return { kind: 'none', text: '' }

  const structured = warnings.filter(isStructuredWarning)
  const strings = warnings.filter((w): w is string => typeof w === 'string')

  if (structured.length) {
    if (structured.some(isUnreliableStructured)) {
      return {
        kind: 'unreliable',
        text: '部分内容未能可靠识别，请对照原图核对；本次评分可能受限。',
      }
    }
    if (structured.every(isAllowlistedAuxiliary)) {
      return {
        kind: 'friendly_aux',
        text: '部分辅助文字未能清晰识别，数学关键步骤已完成识别。',
      }
    }
  }

  // 旧 string[]：无法证明 auxiliary → 不使用友好降级句
  if (strings.length && !structured.length) {
    const joined = strings.map((s) => s.trim()).filter(Boolean)
    const risky = joined.some((s) =>
      /(无法辨认|无法识别|看不清|严重模糊|uncertain|unknown)/i.test(s),
    )
    if (risky) {
      return {
        kind: 'unreliable',
        text: '识别过程存在不确定内容，请对照原图核对。',
      }
    }
    return {
      kind: 'plain',
      text: joined.slice(0, 3).join('；'),
    }
  }

  // mixed
  return {
    kind: 'unreliable',
    text: '识别提示需人工核对，请对照原图确认。',
  }
}

export function formatRecognitionWarningLine(w: HsMathRecognitionWarning): string {
  if (typeof w === 'string') return w.trim()
  if (isStructuredWarning(w)) {
    const title = w.category || 'warning'
    return `[${title}] ${w.description}`.trim()
  }
  return ''
}

/** 是否允许在 UI 展示分数（禁止 review/failed 假 0） */
export function canShowApplicationAiScore(
  gradeResult: string | null | undefined,
): boolean {
  return gradeResult === 'graded'
}
