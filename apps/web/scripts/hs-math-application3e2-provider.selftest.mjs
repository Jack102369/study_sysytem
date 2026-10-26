/**
 * APPLICATION-3E-2 · 前端 provider 锁定 / 结果文案 stub
 * 运行：node apps/web/scripts/hs-math-application3e2-provider.selftest.mjs
 */
import assert from 'node:assert/strict'

function emptyApplicationDraft() {
  return { text: '', imageIds: [], gradingProvider: 'qwen' }
}

function buildApplicationUserAnswer(
  text,
  imageIds,
  uploading = false,
  gradingProvider = 'qwen',
) {
  if (uploading) return null
  const t = text.trim()
  const ids = [...new Set(imageIds.map(String).filter(Boolean))]
  if (!t && !ids.length) return null
  const provider = gradingProvider === 'deepseek' ? 'deepseek' : 'qwen'
  const out = { kind: 'application', gradingProvider: provider }
  if (t) out.text = text
  if (ids.length) out.imageIds = ids
  return out
}

function draftFromApplicationPayload(payload) {
  if (!payload || typeof payload !== 'object' || payload.kind !== 'application') {
    return emptyApplicationDraft()
  }
  return {
    text: typeof payload.text === 'string' ? payload.text : '',
    imageIds: Array.isArray(payload.imageIds)
      ? [...new Set(payload.imageIds.map(String).filter(Boolean))]
      : [],
    gradingProvider:
      payload.gradingProvider === 'deepseek' ? 'deepseek' : 'qwen',
  }
}

function formatAiGradingProviderLabel(grade) {
  if (!grade) return ''
  const pipeline = grade.pipeline
  const scoring = grade.scoringModel || grade.model || ''
  const vision = grade.visionModel || ''
  if (pipeline === 'qwen_then_deepseek' || grade.gradingProvider === 'deepseek') {
    if (pipeline === 'qwen_then_deepseek') {
      const parts = ['DeepSeek（千问识别）']
      if (scoring) parts.push(`评分 ${scoring}`)
      if (vision) parts.push(`识别 ${vision}`)
      return parts.join(' · ')
    }
    return scoring ? `DeepSeek · ${scoring}` : 'DeepSeek'
  }
  const name = scoring || vision || grade.model || ''
  return name ? `千问 · ${name}` : '千问'
}

function recognizedWorkCaption(grade) {
  if (grade?.pipeline === 'qwen_then_deepseek') return '识别过程（AI 转写）'
  return '识别过程'
}

/** 会话 completed → 输入 disabled，provider 不可改（模拟） */
function canEditGradingProvider(sessionStatus) {
  return sessionStatus === 'in_progress'
}

let n = 0
function ok(name) {
  n += 1
  console.log('OK', name)
}

{
  assert.equal(emptyApplicationDraft().gradingProvider, 'qwen')
  ok('default qwen')
}

{
  const a = buildApplicationUserAnswer('x', [], false, 'deepseek')
  assert.equal(a.gradingProvider, 'deepseek')
  ok('explicit deepseek')
}

{
  assert.equal(canEditGradingProvider('in_progress'), true)
  assert.equal(canEditGradingProvider('completed'), false)
  ok('provider locked after completed')
}

{
  const d = draftFromApplicationPayload({
    kind: 'application',
    text: '旧',
  })
  assert.equal(d.gradingProvider, 'qwen')
  ok('legacy draft qwen')
}

{
  assert.equal(
    formatAiGradingProviderLabel({
      gradingProvider: 'qwen',
      pipeline: 'qwen_vision',
      scoringModel: 'qwen-vl',
    }),
    '千问 · qwen-vl',
  )
  assert.equal(
    formatAiGradingProviderLabel({
      gradingProvider: 'deepseek',
      pipeline: 'deepseek_text',
      scoringModel: 'deepseek-chat',
    }),
    'DeepSeek · deepseek-chat',
  )
  assert.equal(
    formatAiGradingProviderLabel({
      gradingProvider: 'deepseek',
      pipeline: 'qwen_then_deepseek',
      scoringModel: 'deepseek-chat',
    }),
    'DeepSeek（千问识别） · 评分 deepseek-chat',
  )
  assert.equal(
    recognizedWorkCaption({ pipeline: 'qwen_then_deepseek' }),
    '识别过程（AI 转写）',
  )
  ok('result labels match pipelines')
}

console.log(`\nAPPLICATION-3E-2 web provider selftest PASS ${n}`)
