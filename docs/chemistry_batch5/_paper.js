/** Shared framing: paper-based experiment training only (no hands-on). */
'use strict'

const PAPER_ONLY =
  '本系统仅做书面题目训练（现象判断、操作正误、步骤排序、结论推断、装置分析、误差分析、方案评价、安全判断），不要求学生线下动手操作；禁止家用自行实验。'

function expBase(extra) {
  return {
    homeForbiddenNote: PAPER_ONLY,
    ...extra,
  }
}

module.exports = { PAPER_ONLY, expBase }
