/**
 * APPLICATION-4C-2：前端重批按钮可见性（对齐 hs-math-ai-grade-poll.ts）。
 */
import assert from 'node:assert/strict'

const RECOGNITION_UNRELIABLE_REASONS = new Set([
  'recognition_uncertain',
  'uncertain_recognition',
  'low_confidence',
  'critical_recognition_warning',
  'unknown_warning_scope',
  'warning_affects_scoring',
  'non_auxiliary_warning',
  'model_supplementation_suspected',
  'missing_recognized_work',
])

function normalizeGradeReason(gradeReason) {
  return String(gradeReason || '').trim()
}

function isApplicationAiNotScheduledReason(gradeReason) {
  const reason = normalizeGradeReason(gradeReason)
  if (!reason) return false
  if (reason === 'awaiting_multimodal') return true
  if (reason.startsWith('awaiting_multimodal:')) return true
  if (reason === 'awaiting_text_ai') return true
  return false
}

function isApplicationRecognitionUnreliableReason(gradeReason) {
  const reason = normalizeGradeReason(gradeReason)
  if (!reason) return false
  if (RECOGNITION_UNRELIABLE_REASONS.has(reason)) return true
  if (reason.startsWith('critical_recognition_warning')) return true
  if (reason.startsWith('uncertain_recognition')) return true
  return false
}

function canRequestApplicationRegrade(input) {
  if (input.qtype !== 'application') return false
  if (input.sessionStatus !== 'completed') return false
  const gr = input.gradeResult
  if (gr === 'grading_failed') return true
  if (gr === 'review_required') {
    if (isApplicationRecognitionUnreliableReason(input.gradeReason)) {
      return false
    }
    return isApplicationAiNotScheduledReason(input.gradeReason)
  }
  return false
}

function sessionNeedsAiGradePoll(items) {
  if (!items?.length) return false
  return items.some((i) =>
    ['pending_ai', 'grading'].includes(i.gradeResult),
  )
}

let n = 0
function ok(name) {
  n += 1
  console.log('OK', name)
}

const s126 = {
  qtype: 'application',
  sessionStatus: 'completed',
  gradeResult: 'review_required',
  gradeReason: 'awaiting_multimodal',
}

assert.equal(canRequestApplicationRegrade(s126), true)
ok('1 session126 show button')

assert.equal(
  canRequestApplicationRegrade({
    ...s126,
    gradeReason: 'uncertain_recognition',
  }),
  false,
)
ok('2 recognition hide button')

assert.equal(
  canRequestApplicationRegrade({ ...s126, gradeResult: 'graded' }),
  false,
)
ok('3 graded hide')

assert.equal(
  canRequestApplicationRegrade({ ...s126, gradeResult: 'pending_ai' }),
  false,
)
ok('4 pending hide')

assert.equal(
  canRequestApplicationRegrade({ ...s126, gradeResult: 'grading' }),
  false,
)
ok('5 grading hide')

assert.equal(
  canRequestApplicationRegrade({
    ...s126,
    gradeResult: 'grading_failed',
    gradeReason: 'timeout',
  }),
  true,
)
ok('6 grading_failed show')

assert.equal(
  canRequestApplicationRegrade({ ...s126, qtype: 'numeric' }),
  false,
)
ok('7 non-application hide')

assert.equal(
  canRequestApplicationRegrade({ ...s126, sessionStatus: 'in_progress' }),
  false,
)
ok('8 incomplete hide')

assert.equal(
  sessionNeedsAiGradePoll([{ gradeResult: 'pending_ai' }]),
  true,
)
assert.equal(
  sessionNeedsAiGradePoll([{ gradeResult: 'review_required' }]),
  false,
)
ok('9 poll only after accept pending')

assert.equal(
  canRequestApplicationRegrade({
    ...s126,
    gradeReason: 'awaiting_text_ai',
  }),
  true,
)
ok('10 awaiting_text_ai show')

// 刷新不自动申请：可见性函数无副作用
assert.equal(canRequestApplicationRegrade(s126), true)
assert.equal(canRequestApplicationRegrade(s126), true)
ok('11 refresh not auto-regrade')

console.log(`PASS ${n}/11 APPLICATION-4C-2 web regrade selftests`)
