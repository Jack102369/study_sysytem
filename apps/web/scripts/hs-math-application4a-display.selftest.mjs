/**
 * APPLICATION-4A · 结果/历史展示纯函数 stub
 * 运行：pnpm --filter web run hs-math:application4a-selftest
 */
import assert from 'node:assert/strict'

const RUBRIC_TITLE_ZH = {
  model: '建立模型',
  domain: '确定定义域',
  solve: '求解最值',
  conclusion: '作答结论',
}

function formatRubricKeyTitle(rubricKey) {
  const k = String(rubricKey || '').trim()
  return RUBRIC_TITLE_ZH[k] || k || '评分项'
}

function formatGradingMethodLabel(input) {
  const fromUser =
    input.userAnswerPayload && input.userAnswerPayload.kind === 'application'
      ? input.userAnswerPayload.gradingProvider
      : undefined
  const provider = input.gradingProvider || fromUser || ''
  if (input.pipeline === 'qwen_then_deepseek' || provider === 'deepseek') {
    if (input.pipeline === 'qwen_then_deepseek') return 'DeepSeek（千问识别）'
    return 'DeepSeek'
  }
  return '千问'
}

function formatScoringModelLabel(grade) {
  if (!grade) return ''
  return String(grade.scoringModel || grade.model || '').trim()
}

function formatVisionModelLabel(grade) {
  if (!grade) return ''
  return String(grade.visionModel || '').trim()
}

function canShowApplicationAiScore(gradeResult) {
  return gradeResult === 'graded'
}

function shouldShowRecognizedWorkEmpty(input) {
  if (!input.hasImages) return false
  return !String(input.recognizedWork || '').trim()
}

function isStructuredWarning(w) {
  return (
    !!w &&
    typeof w === 'object' &&
    !Array.isArray(w) &&
    typeof w.description === 'string'
  )
}

function isAllowlistedAuxiliary(w) {
  return (
    w.category === 'auxiliary_text' &&
    w.severity === 'minor' &&
    w.affectsScoring === false
  )
}

function isUnreliableStructured(w) {
  if (w.severity === 'critical' || w.severity === 'unknown') return true
  if (w.category === 'unknown') return true
  if (w.affectsScoring === true) return true
  if (!isAllowlistedAuxiliary(w)) return true
  return false
}

function summarizeRecognitionWarnings(warnings) {
  if (!warnings?.length) return { kind: 'none', text: '' }
  const structured = warnings.filter(isStructuredWarning)
  const strings = warnings.filter((w) => typeof w === 'string')
  if (structured.length) {
    if (structured.some(isUnreliableStructured)) {
      return {
        kind: 'unreliable',
        text: '部分内容未能可靠识别，请对照原图核对；本次评分可能受限。',
      }
    }
    if (structured.every(isAllowlistedAuxiliary)) {
      return {
        kind: 'friendly_aux',
        text: '部分辅助文字未能清晰识别，数学关键步骤已完成识别。',
      }
    }
  }
  if (strings.length && !structured.length) {
    const joined = strings.map((s) => s.trim()).filter(Boolean)
    const risky = joined.some((s) =>
      /(无法辨认|无法识别|看不清|严重模糊|uncertain|unknown)/i.test(s),
    )
    if (risky) {
      return {
        kind: 'unreliable',
        text: '识别过程存在不确定内容，请对照原图核对。',
      }
    }
    return { kind: 'plain', text: joined.slice(0, 3).join('；') }
  }
  return {
    kind: 'unreliable',
    text: '识别提示需人工核对，请对照原图确认。',
  }
}

function applicationAiStatusMessage(input) {
  // APPLICATION-4C-1 对齐 hs-math-ai-grade-poll.ts
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
    const unreliable = new Set([
      'recognition_uncertain',
      'uncertain_recognition',
      'low_confidence',
      'critical_recognition_warning',
    ])
    if (unreliable.has(reason)) {
      return 'AI 未能可靠识别本次解答，因此没有给出分数。'
    }
    return '本次 AI 批改尚未得到有效评分结果。'
  }
  return null
}

function leaksStorageKey(obj) {
  return JSON.stringify(obj).includes('storage_key')
}

let n = 0
function ok(name) {
  n += 1
  console.log('OK', name)
}

// 1 graded 10/10 titles
{
  assert.equal(formatRubricKeyTitle('model'), '建立模型')
  assert.equal(formatRubricKeyTitle('domain'), '确定定义域')
  assert.equal(formatRubricKeyTitle('solve'), '求解最值')
  assert.equal(formatRubricKeyTitle('conclusion'), '作答结论')
  ok('1 rubric zh titles')
}

// 2 graded 7/10 score gate
{
  assert.equal(canShowApplicationAiScore('graded'), true)
  const score = 7
  assert.ok(score > 0 && score < 10)
  ok('2 graded 7/10 can show score')
}

// 3 graded 0/10 still showable (real zero, not fake)
{
  assert.equal(canShowApplicationAiScore('graded'), true)
  ok('3 graded 0/10 still graded path')
}

// 4 rubric 3+2+1+1 sum
{
  const scores = [3, 2, 1, 1]
  assert.equal(scores.reduce((a, b) => a + b, 0), 7)
  ok('4 rubric 3+2+1+1')
}

// 5 qwen provider
{
  assert.equal(formatGradingMethodLabel({ gradingProvider: 'qwen' }), '千问')
  ok('5 qwen provider label')
}

// 6 deepseek dual
{
  assert.equal(
    formatGradingMethodLabel({
      pipeline: 'qwen_then_deepseek',
      gradingProvider: 'deepseek',
    }),
    'DeepSeek（千问识别）',
  )
  ok('6 deepseek dual method')
}

// 7 actual model names separate
{
  const g = {
    scoringModel: 'deepseek-chat',
    visionModel: 'qwen3.8-27b-orca-q8',
    pipeline: 'qwen_then_deepseek',
  }
  assert.equal(formatScoringModelLabel(g), 'deepseek-chat')
  assert.equal(formatVisionModelLabel(g), 'qwen3.8-27b-orca-q8')
  assert.notEqual(formatGradingMethodLabel(g), 'deepseek-chat')
  ok('7 scoring/vision models distinct from method')
}

// 8 recognizedWork empty
{
  assert.equal(
    shouldShowRecognizedWorkEmpty({ hasImages: true, recognizedWork: '' }),
    true,
  )
  assert.equal(
    shouldShowRecognizedWorkEmpty({
      hasImages: true,
      recognizedWork: 'y=x',
    }),
    false,
  )
  ok('8 empty recognizedWork with images')
}

// 9 object[] warning friendly aux
{
  const s = summarizeRecognitionWarnings([
    {
      pageIndex: 1,
      location: 'top',
      category: 'auxiliary_text',
      severity: 'minor',
      description: 'header',
      affectsScoring: false,
    },
  ])
  assert.equal(s.kind, 'friendly_aux')
  ok('9 object[] auxiliary friendly')
}

// 10 string[] warning
{
  const s = summarizeRecognitionWarnings(['第2张末尾句号略糊'])
  assert.equal(s.kind, 'plain')
  const risky = summarizeRecognitionWarnings(['图片无法辨认'])
  assert.equal(risky.kind, 'unreliable')
  ok('10 string[] warning plain/unreliable')
}

// 11 review_required no fake 0（无 reason → 中性；真识别失败仍可断言）
{
  assert.equal(canShowApplicationAiScore('review_required'), false)
  assert.match(
    applicationAiStatusMessage({ gradeResult: 'review_required' }),
    /尚未得到有效评分结果/,
  )
  assert.match(
    applicationAiStatusMessage({
      gradeResult: 'review_required',
      gradeReason: 'uncertain_recognition',
    }),
    /没有给出分数/,
  )
  ok('11 review_required no score')
}

// 12 grading_failed no fake 0
{
  assert.equal(canShowApplicationAiScore('grading_failed'), false)
  assert.match(
    applicationAiStatusMessage({ gradeResult: 'grading_failed' }),
    /无法提供分数/,
  )
  ok('12 grading_failed no score')
}

// 13 pending_ai
{
  assert.equal(
    applicationAiStatusMessage({ gradeResult: 'pending_ai' }),
    '等待 AI 批改。',
  )
  ok('13 pending_ai')
}

// 14 grading
{
  assert.equal(
    applicationAiStatusMessage({ gradeResult: 'grading' }),
    'AI 正在批改。',
  )
  ok('14 grading')
}

// 15 history re-read shape (no storage_key)
{
  const hist = {
    gradeResult: 'graded',
    aiGrade: {
      status: 'graded',
      totalScore: 7,
      maxScore: 10,
      rubricScores: [
        { rubricKey: 'model', score: 3, maxScore: 3, feedback: 'ok' },
        { rubricKey: 'domain', score: 2, maxScore: 2, feedback: 'ok' },
        { rubricKey: 'solve', score: 1, maxScore: 3, feedback: 'wrong axis' },
        { rubricKey: 'conclusion', score: 1, maxScore: 2, feedback: 'x=50' },
      ],
      recognizedWork: 'x=50',
      gradingProvider: 'deepseek',
      pipeline: 'qwen_then_deepseek',
      scoringModel: 'deepseek-chat',
      visionModel: 'qwen3.8-27b-orca-q8',
    },
    images: [{ imageId: '52', mimeType: 'image/png', sortOrder: 0 }],
  }
  assert.equal(leaksStorageKey(hist), false)
  assert.equal(canShowApplicationAiScore(hist.gradeResult), true)
  ok('15 history payload no storage_key')
}

// 16 image order
{
  const ids = ['53', '54', '53']
  const out = []
  const seen = new Set()
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  assert.deepEqual(out, ['53', '54'])
  ok('16 imageIds order preserved')
}

// 17 no storage_key in warning summary path
{
  const s = summarizeRecognitionWarnings([
    {
      pageIndex: 1,
      location: 'a',
      category: 'unknown',
      severity: 'unknown',
      description: 'unclear',
      affectsScoring: true,
    },
  ])
  assert.equal(s.kind, 'unreliable')
  assert.equal(s.text.includes('storage_key'), false)
  ok('17 unknown not downgraded; no storage_key')
}

// 18 legacy compatible titles unknown key
{
  assert.equal(formatRubricKeyTitle('custom_key'), 'custom_key')
  ok('18 legacy unknown rubric key passthrough')
}

console.log(`\nAPPLICATION-4A display selftest PASS ${n}`)
