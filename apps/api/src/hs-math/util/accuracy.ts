/**
 * 正确率：correct / (correct + wrong)；pending 不计分母。
 * 分母为 0 → null（禁止返回 1 / 100 / NaN）。
 */
export function accuracyRatio(
  correctCount: number,
  wrongCount: number,
): number | null {
  const c = Number(correctCount) || 0
  const w = Number(wrongCount) || 0
  const den = c + w
  if (den <= 0) return null
  const r = c / den
  if (!Number.isFinite(r)) return null
  return Math.round(r * 10000) / 10000
}
