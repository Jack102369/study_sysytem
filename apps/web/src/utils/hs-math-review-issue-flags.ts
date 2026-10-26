/**
 * 开发侧数学复核备注（非 DB 人工审核）。
 * 仅提示管理员查阅 review_issues.md，不得当作 passed。
 */
const DEV_MATH_REVIEW_NOTE_CODES = new Set([
  'HSMA-RJA-CH01-0004',
  'HSMA-RJA-CH01-0008',
  'HSMA-RJA-CH01-0009',
])

export function hasDevMathReviewNote(code: string): boolean {
  return DEV_MATH_REVIEW_NOTE_CODES.has(String(code || '').trim())
}

export const DEV_MATH_REVIEW_NOTE_LABEL =
  '本题存在待关注的数学复核备注（开发材料，非数据库人工审核记录）'
