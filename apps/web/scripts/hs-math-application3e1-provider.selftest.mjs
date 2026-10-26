/**
 * APPLICATION-3E-1 · 前端 provider draft / 展示文案 stub
 * 运行：node apps/web/scripts/hs-math-application3e1-provider.selftest.mjs
 */
import assert from 'node:assert/strict'

function emptyApplicationDraft() {
  return { text: '', imageIds: [], gradingProvider: 'qwen' }
}

function dedupeImageIds(ids) {
  const out = []
  const seen = new Set()
  for (const x of ids) {
    const id = String(x)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function buildApplicationUserAnswer(
  text,
  imageIds,
  uploading = false,
  gradingProvider = 'qwen',
) {
  if (uploading) return null
  const t = text.trim()
  const ids = dedupeImageIds(imageIds)
  if (!t && !ids.length) return null
  const provider = gradingProvider === 'deepseek' ? 'deepseek' : 'qwen'
  const out = { kind: 'application', gradingProvider: provider }
  if (t) out.text = text
  if (ids.length) out.imageIds = ids
  return out
}

function draftFromApplicationPayload(payload) {
  if (!payload || typeof payload !== 'object') return emptyApplicationDraft()
  if (payload.kind !== 'application') return emptyApplicationDraft()
  const text = typeof payload.text === 'string' ? payload.text : ''
  const imageIds = Array.isArray(payload.imageIds)
    ? dedupeImageIds(payload.imageIds)
    : []
  const gradingProvider =
    payload.gradingProvider === 'deepseek' ? 'deepseek' : 'qwen'
  return { text, imageIds, gradingProvider }
}

function formatAiGradingProviderLabel(grade) {
  // APPLICATION-4A 对齐：方法与模型分行语义（合并标签兼容旧断言字段）
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

let n = 0
function ok(name) {
  n += 1
  console.log('OK', name)
}

{
  const d = emptyApplicationDraft()
  assert.equal(d.gradingProvider, 'qwen')
  ok('default draft = qwen')
}

{
  const a = buildApplicationUserAnswer('步骤', [], false, 'deepseek')
  assert.equal(a.gradingProvider, 'deepseek')
  assert.equal(a.text, '步骤')
  ok('build carries deepseek')
}

{
  const a = buildApplicationUserAnswer('', ['1'], false)
  assert.equal(a.gradingProvider, 'qwen')
  assert.deepEqual(a.imageIds, ['1'])
  ok('build default qwen with images')
}

{
  const d = draftFromApplicationPayload({
    kind: 'application',
    text: 'x',
    gradingProvider: 'deepseek',
  })
  assert.equal(d.gradingProvider, 'deepseek')
  ok('draftFromPayload deepseek')
}

{
  const d = draftFromApplicationPayload({ kind: 'application', text: 'x' })
  assert.equal(d.gradingProvider, 'qwen')
  ok('legacy payload → draft qwen')
}

{
  const label = formatAiGradingProviderLabel({
    gradingProvider: 'qwen',
    pipeline: 'qwen_vision',
    scoringModel: 'qwen-vl',
  })
  assert.equal(label, '千问 · qwen-vl')
  ok('label qwen')
}

{
  const label = formatAiGradingProviderLabel({
    gradingProvider: 'deepseek',
    pipeline: 'qwen_then_deepseek',
    visionModel: 'qwen-vl',
    scoringModel: 'deepseek-chat',
  })
  assert.equal(
    label,
    'DeepSeek（千问识别） · 评分 deepseek-chat · 识别 qwen-vl',
  )
  assert.equal(
    recognizedWorkCaption({ pipeline: 'qwen_then_deepseek' }),
    '识别过程（AI 转写）',
  )
  ok('label dual + caption')
}

console.log(`\nAPPLICATION-3E-1 web provider selftest PASS ${n}`)
