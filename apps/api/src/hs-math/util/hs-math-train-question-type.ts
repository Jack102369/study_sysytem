/**
 * 学生训练抽题：题型筛选纯函数（无 DB / 无网络）。
 * 未传 questionType → 保留全部合法五种题型；传入则只保留该题型。
 */
import { HS_MATH_QTYPES, type HsMathQtype } from '../hs-math.constants'

const QTYPE_SET = new Set<string>(HS_MATH_QTYPES)

export function isHsMathQuestionType(v: unknown): v is HsMathQtype {
  return typeof v === 'string' && QTYPE_SET.has(v)
}

export function filterTrainItemsByQuestionType<T extends { qtype: string }>(
  items: T[],
  questionType?: HsMathQtype | null,
): T[] {
  let eligible = items.filter((i) => QTYPE_SET.has(i.qtype))
  if (questionType) {
    eligible = eligible.filter((i) => i.qtype === questionType)
  }
  return eligible
}

/** 题量不足时取前 count 道；返回 shortfall */
export function pickTrainItemsWithShortfall<T>(
  eligible: T[],
  count: number,
): { picked: T[]; shortfall: number } {
  const n = Math.max(0, Math.floor(count))
  const picked = eligible.slice(0, n)
  return { picked, shortfall: Math.max(0, n - picked.length) }
}
