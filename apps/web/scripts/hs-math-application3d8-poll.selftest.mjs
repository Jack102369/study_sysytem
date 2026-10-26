/**
 * APPLICATION-3D-8 · 前端 AI 轮询条件自测
 * 运行：node apps/web/scripts/hs-math-application3d8-poll.selftest.mjs
 */
import assert from 'node:assert/strict'

/** 与 src/utils/hs-math-ai-grade-poll.ts 对齐的自包含副本 */
const ACTIVE = new Set(['pending_ai', 'grading'])
const MAX_TICKS = 90
const MAX_ERRORS = 5

function isAiGradePollActiveResult(gradeResult) {
  return !!gradeResult && ACTIVE.has(gradeResult)
}

function sessionNeedsAiGradePoll(items) {
  if (!items?.length) return false
  return items.some((i) => isAiGradePollActiveResult(i.gradeResult))
}

function nextAiGradePollIntervalMs(documentHidden) {
  return documentHidden ? 15_000 : 4_000
}

function shouldStopAiGradePoll(input) {
  if (!input.needsPoll) return true
  const maxTicks = input.maxTicks ?? MAX_TICKS
  const maxErrors = input.maxErrors ?? MAX_ERRORS
  if (input.tickCount >= maxTicks) return true
  if (input.errorCount >= maxErrors) return true
  return false
}

function applicationAiStatusMessage(input) {
  // APPLICATION-4A/4C-1 对齐 src/utils/hs-math-ai-grade-poll.ts
  const r = input.gradeResult
  if (r === 'pending_ai') return '等待 AI 批改。'
  if (r === 'grading') return 'AI 正在批改。'
  if (r === 'grading_failed') {
    return '本次 AI 批改未完成，暂时无法提供分数。'
  }
  if (r === 'review_required') {
    const reason = String(input.gradeReason || '').trim()
    if (
      reason === 'awaiting_multimodal' ||
      reason.startsWith('awaiting_multimodal:') ||
      reason === 'awaiting_text_ai'
    ) {
      return '本次提交时 AI 图片批改未启用，因此尚未进行批改。你的答案图片已保存，目前没有产生评分结果。'
    }
    if (
      reason === 'uncertain_recognition' ||
      reason === 'recognition_uncertain' ||
      reason === 'low_confidence' ||
      reason === 'critical_recognition_warning'
    ) {
      return 'AI 未能可靠识别本次解答，因此没有给出分数。'
    }
    return '本次 AI 批改尚未得到有效评分结果。'
  }
  return null
}

let n = 0
function ok(name) {
  n += 1
  console.log('OK', name)
}

assert.equal(sessionNeedsAiGradePoll([{ gradeResult: 'pending_ai' }]), true)
assert.equal(sessionNeedsAiGradePoll([{ gradeResult: 'grading' }]), true)
assert.equal(sessionNeedsAiGradePoll([{ gradeResult: 'review_required' }]), false)
assert.equal(sessionNeedsAiGradePoll([{ gradeResult: 'grading_failed' }]), false)
assert.equal(sessionNeedsAiGradePoll([{ gradeResult: 'graded' }]), false)
ok('S poll only pending_ai/grading')

assert.equal(
  shouldStopAiGradePoll({ needsPoll: false, tickCount: 0, errorCount: 0 }),
  true,
)
assert.equal(
  shouldStopAiGradePoll({ needsPoll: true, tickCount: 0, errorCount: 0 }),
  false,
)
assert.equal(
  shouldStopAiGradePoll({ needsPoll: true, tickCount: 90, errorCount: 0 }),
  true,
)
assert.equal(
  shouldStopAiGradePoll({ needsPoll: true, tickCount: 1, errorCount: 5 }),
  true,
)
ok('S stop conditions')

assert.equal(nextAiGradePollIntervalMs(false), 4000)
assert.equal(nextAiGradePollIntervalMs(true), 15000)
ok('S hidden interval')

assert.equal(
  applicationAiStatusMessage({ gradeResult: 'pending_ai' }),
  '等待 AI 批改。',
)
assert.equal(
  applicationAiStatusMessage({ gradeResult: 'grading' }),
  'AI 正在批改。',
)
assert.equal(
  applicationAiStatusMessage({ gradeResult: 'grading_failed' }),
  '本次 AI 批改未完成，暂时无法提供分数。',
)
assert.equal(
  applicationAiStatusMessage({
    gradeResult: 'review_required',
    gradeReason: 'uncertain_recognition',
  }),
  'AI 未能可靠识别本次解答，因此没有给出分数。',
)
ok('S status copy')

console.log(`PASS ${n} APPLICATION-3D-8 poll selftests`)
