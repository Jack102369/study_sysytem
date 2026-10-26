/**
 * APPLICATION-4C-4B · 结果页状态文案 stub（额度耗尽 ≠ 识别失败）
 */
import assert from 'node:assert/strict'

const RECOGNITION_UNRELIABLE_REASONS = new Set([
  'recognition_uncertain',
  'uncertain_recognition',
  'low_confidence',
  'critical_recognition_warning',
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

function isApplicationDeepseekQuotaExceededReason(gradeReason) {
  return normalizeGradeReason(gradeReason) === 'deepseek_daily_quota_exceeded'
}

function isApplicationRecognitionUnreliableReason(gradeReason) {
  const reason = normalizeGradeReason(gradeReason)
  if (!reason) return false
  if (RECOGNITION_UNRELIABLE_REASONS.has(reason)) return true
  if (reason.startsWith('critical_recognition_warning')) return true
  return false
}

function applicationAiStatusMessage(input) {
  const r = input.gradeResult
  if (r === 'pending_ai') return '等待 AI 批改。'
  if (r === 'grading') return 'AI 正在批改。'
  if (r === 'grading_failed') {
    if (isApplicationDeepseekQuotaExceededReason(input.gradeReason)) {
      return '今日 DeepSeek 批改次数已用完，请明天再试。'
    }
    return '本次 AI 批改未完成，暂时无法提供分数。'
  }
  if (r === 'review_required') {
    const reason = normalizeGradeReason(input.gradeReason)
    if (isApplicationAiNotScheduledReason(reason)) {
      return 'AI 当前未启用。'
    }
    if (isApplicationDeepseekQuotaExceededReason(reason)) {
      return '今日 DeepSeek 批改次数已用完，请明天再试。'
    }
    if (isApplicationRecognitionUnreliableReason(reason)) {
      return 'AI 未能可靠识别本次解答，因此没有给出分数。'
    }
    return '本次 AI 批改尚未得到有效评分结果。'
  }
  return null
}

function canShowApplicationAiScore(gradeResult) {
  return gradeResult === 'graded'
}

let n = 0
function ok(name) {
  n += 1
  console.log('OK', name)
}

{
  const msg = applicationAiStatusMessage({
    gradeResult: 'grading_failed',
    gradeReason: 'deepseek_daily_quota_exceeded',
  })
  assert.equal(msg, '今日 DeepSeek 批改次数已用完，请明天再试。')
  assert.equal(canShowApplicationAiScore('grading_failed'), false)
  ok('1 quota exceeded copy')
}

{
  const msg = applicationAiStatusMessage({
    gradeResult: 'review_required',
    gradeReason: 'recognition_uncertain',
  })
  assert.match(msg, /识别/)
  assert.notEqual(
    applicationAiStatusMessage({
      gradeResult: 'grading_failed',
      gradeReason: 'deepseek_daily_quota_exceeded',
    }),
    msg,
  )
  ok('2 quota ≠ recognition')
}

{
  assert.equal(
    applicationAiStatusMessage({ gradeResult: 'grading' }),
    'AI 正在批改。',
  )
  ok('3 grading in progress')
}

{
  const msg = applicationAiStatusMessage({
    gradeResult: 'review_required',
    gradeReason: 'awaiting_multimodal',
  })
  assert.ok(msg.includes('未启用') || msg.includes('AI'))
  ok('4 AI not enabled')
}

{
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'grading_failed',
      gradeReason: 'ai_error',
    }),
    '本次 AI 批改未完成，暂时无法提供分数。',
  )
  ok('5 grading failed generic')
}

console.log(`\nAPPLICATION-4C-4B web stub PASS ${n}/5`)
