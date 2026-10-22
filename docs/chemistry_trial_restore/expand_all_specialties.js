/**
 * DISABLED (2026-10-19 personal open):
 * 禁止再生成 train.ai_trial.cov.* filler 凑数题。
 * 历史脚本保留仅供审计；请使用本地规则出题器阶段 A/B。
 */
'use strict'
console.error(
  JSON.stringify({
    aborted: true,
    reason:
      'expand_all_specialties filler generator is permanently disabled. Do not create train.ai_trial.cov.* items.',
  }),
)
process.exit(2)
