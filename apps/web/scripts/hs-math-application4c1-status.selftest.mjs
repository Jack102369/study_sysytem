/**
 * APPLICATION-4C-1：应用题 AI 状态文案（与 hs-math-ai-grade-poll.ts 对齐）。
 * stub only；禁止真实 AI / 写库。
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

function applicationAiStatusMessage(input) {
  const r = input.gradeResult
  if (r === 'pending_ai') return '等待 AI 批改。'
  if (r === 'grading') return 'AI 正在批改。'
  if (r === 'grading_failed') {
    return '本次 AI 批改未完成，暂时无法提供分数。'
  }
  if (r === 'review_required') {
    const reason = normalizeGradeReason(input.gradeReason)
    if (isApplicationAiNotScheduledReason(reason)) {
      if (reason === 'awaiting_text_ai') {
        return '本次提交时 AI 文字批改未启用，因此尚未进行批改。你的答案已保存，目前没有产生评分结果。'
      }
      return '本次提交时 AI 图片批改未启用，因此尚未进行批改。你的答案图片已保存，目前没有产生评分结果。'
    }
    if (isApplicationRecognitionUnreliableReason(reason)) {
      return 'AI 未能可靠识别本次解答，因此没有给出分数。'
    }
    return '本次 AI 批改尚未得到有效评分结果。'
  }
  return null
}

function applicationMathGradeTagLabel(input) {
  const r = input.gradeResult
  if (!r) return null
  if (r === 'correct') return '正确'
  if (r === 'wrong') return '错误'
  if (r === 'pending_review') return '待复核'
  if (r === 'pending_ai') return '等待 AI 批改'
  if (r === 'grading') return 'AI 正在批改'
  if (r === 'graded') return '已批改'
  if (r === 'grading_failed') return 'AI 批改未完成'
  if (r === 'review_required') {
    if (isApplicationAiNotScheduledReason(input.gradeReason)) {
      return 'AI 未启用·未评分'
    }
    if (isApplicationRecognitionUnreliableReason(input.gradeReason)) {
      return '识别不可靠·未评分'
    }
    return '暂无评分'
  }
  return '未判'
}

function canShowApplicationAiScore(gradeResult) {
  return gradeResult === 'graded'
}

let n = 0
function ok(name) {
  n += 1
  console.log('OK', name)
}

const FAIL_COPY = 'AI 未能可靠识别本次解答，因此没有给出分数。'
const NEUTRAL = '本次 AI 批改尚未得到有效评分结果。'
const AWAITING_IMG =
  '本次提交时 AI 图片批改未启用，因此尚未进行批改。你的答案图片已保存，目前没有产生评分结果。'

// 1 awaiting_multimodal：AI 未启用
{
  const msg = applicationAiStatusMessage({
    gradeResult: 'review_required',
    gradeReason: 'awaiting_multimodal',
  })
  assert.equal(msg, AWAITING_IMG)
  assert.match(msg, /未启用/)
  ok('1 awaiting_multimodal not enabled')
}

// 2 awaiting_multimodal：不出现识别失败文案
{
  const msg = applicationAiStatusMessage({
    gradeResult: 'review_required',
    gradeReason: 'awaiting_multimodal',
  })
  assert.ok(!msg.includes('未能可靠识别'))
  assert.ok(!msg.includes('识别不可靠'))
  ok('2 awaiting_multimodal no recognition-fail copy')
}

// 3 awaiting_multimodal：不显示 0/10
{
  assert.equal(canShowApplicationAiScore('review_required'), false)
  ok('3 awaiting_multimodal no fake score')
}

// 4 recognition_uncertain
{
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'review_required',
      gradeReason: 'recognition_uncertain',
    }),
    FAIL_COPY,
  )
  ok('4 recognition_uncertain')
}

// 5 low_confidence
{
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'review_required',
      gradeReason: 'low_confidence',
    }),
    FAIL_COPY,
  )
  ok('5 low_confidence')
}

// 6 critical_recognition_warning
{
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'review_required',
      gradeReason: 'critical_recognition_warning',
    }),
    FAIL_COPY,
  )
  ok('6 critical_recognition_warning')
}

// 7 未知 gradeReason：中性
{
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'review_required',
      gradeReason: 'some_future_code',
    }),
    NEUTRAL,
  )
  ok('7 unknown gradeReason neutral')
}

// 8 grading_failed
{
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'grading_failed',
      gradeReason: 'http_500_secret_key',
    }),
    '本次 AI 批改未完成，暂时无法提供分数。',
  )
  ok('8 grading_failed no leak')
}

// 9 pending_ai
{
  assert.equal(
    applicationAiStatusMessage({ gradeResult: 'pending_ai' }),
    '等待 AI 批改。',
  )
  ok('9 pending_ai')
}

// 10 grading
{
  assert.equal(
    applicationAiStatusMessage({ gradeResult: 'grading' }),
    'AI 正在批改。',
  )
  ok('10 grading')
}

// 11 graded 保留评分门禁
{
  assert.equal(canShowApplicationAiScore('graded'), true)
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'graded',
      gradeReason: 'ai_graded',
    }),
    null,
  )
  ok('11 graded keeps score path')
}

// 12 旧历史无 gradeReason 不报错、中性
{
  assert.equal(
    applicationAiStatusMessage({ gradeResult: 'review_required' }),
    NEUTRAL,
  )
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'review_required',
      gradeReason: null,
    }),
    NEUTRAL,
  )
  assert.equal(
    applicationMathGradeTagLabel({ gradeResult: 'review_required' }),
    '暂无评分',
  )
  ok('12 legacy missing gradeReason')
}

// 13 session 126 只读 fixture
{
  const session126 = {
    sessionId: 126,
    sessionItemId: 349,
    itemId: 151,
    gradingProvider: 'deepseek',
    imageIds: ['55', '56'],
    gradeResult: 'review_required',
    gradeReason: 'awaiting_multimodal',
    aiAttemptCount: 0,
    aiGrade: null,
  }
  const msg = applicationAiStatusMessage(session126)
  assert.equal(msg, AWAITING_IMG)
  assert.ok(!msg.includes('未能可靠识别'))
  assert.equal(canShowApplicationAiScore(session126.gradeResult), false)
  assert.equal(
    applicationMathGradeTagLabel(session126),
    'AI 未启用·未评分',
  )
  assert.equal(session126.aiAttemptCount, 0)
  assert.equal(session126.aiGrade, null)
  ok('13 session126 fixture semantics')
}

// 14 uncertain_recognition 库内别名
{
  assert.equal(
    applicationAiStatusMessage({
      gradeResult: 'review_required',
      gradeReason: 'uncertain_recognition',
    }),
    FAIL_COPY,
  )
  ok('14 uncertain_recognition alias')
}

// 15 awaiting_text_ai
{
  const msg = applicationAiStatusMessage({
    gradeResult: 'review_required',
    gradeReason: 'awaiting_text_ai',
  })
  assert.match(msg, /文字批改未启用/)
  assert.ok(!msg.includes('未能可靠识别'))
  ok('15 awaiting_text_ai')
}

console.log(`PASS ${n}/15 APPLICATION-4C-1 status selftests`)
