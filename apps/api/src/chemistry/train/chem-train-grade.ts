import type { TrainGradeResult, TrainQtype } from './train.constants'
import {
  gradeChemFormula,
  normalizeAnswerType,
  type TrainAnswerType,
} from './chem-formula.util'

function normalizeExact(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/／/g, '/')
}

function parseAliases(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((x) => String(x))
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw)
      return Array.isArray(j) ? j.map((x) => String(x)) : []
    } catch {
      return []
    }
  }
  return []
}

export type GradeAnswerOutput = {
  result: TrainGradeResult
  reason?: string | null
}

/**
 * 保守判题：
 * - 单选/判断：精确匹配
 * - 填空 text：标准答案 + 等价答案精确匹配；否则 pending_review
 * - 填空 chem_formula：专用规则（下标等价、大小写严格；明确错误 → wrong）
 */
export function gradeAnswer(input: {
  qtype: TrainQtype
  standardAnswer: string
  aliasesJson: unknown
  userAnswer: string | null | undefined
  answerType?: TrainAnswerType | string | null
}): GradeAnswerOutput {
  const user = String(input.userAnswer ?? '').trim()
  if (!user) {
    return { result: 'pending_review', reason: '未作答' }
  }

  const std = String(input.standardAnswer ?? '').trim()
  const aliases = parseAliases(input.aliasesJson)
  const answerType = normalizeAnswerType(input.answerType)

  if (input.qtype === 'single' || input.qtype === 'judge') {
    if (normalizeExact(user) === normalizeExact(std)) {
      return { result: 'correct' }
    }
    return { result: 'wrong' }
  }

  if (input.qtype === 'blank') {
    if (answerType === 'chem_formula') {
      const g = gradeChemFormula({
        standardAnswer: std,
        aliases,
        userAnswer: user,
      })
      return { result: g.result, reason: g.reason ?? null }
    }

    // 普通文本 / 未标记：保持原规则
    const candidates = [std, ...aliases].map(normalizeExact).filter(Boolean)
    const u = normalizeExact(user)
    if (!candidates.length) {
      return { result: 'pending_review', reason: '缺少标准答案' }
    }
    if (candidates.includes(u)) return { result: 'correct' }
    return { result: 'pending_review' }
  }

  return { result: 'pending_review' }
}
