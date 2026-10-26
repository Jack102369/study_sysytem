/**
 * APPLICATION-2E · 前端纯逻辑自测（无 HTTP / 无浏览器）
 * 运行：node apps/web/scripts/hs-math-application2e.selftest.mjs
 *
 * 与 apps/web/src/utils/hs-math-auth-image.ts / hs-math-format 行为对齐（自包含副本）。
 */
import assert from 'node:assert/strict'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_COUNT = 5
const MIMES = ['image/jpeg', 'image/png', 'image/webp']

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

function validateClientImageFile(file, currentCount) {
  if (currentCount >= MAX_COUNT) {
    return { ok: false, message: `单题最多 ${MAX_COUNT} 张图片` }
  }
  const mime = (file.type || '').toLowerCase()
  if (!MIMES.includes(mime)) {
    return { ok: false, message: '仅支持 JPEG / PNG / WebP' }
  }
  if (file.size <= 0) return { ok: false, message: '文件为空' }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: '过大' }
  }
  return { ok: true }
}

function canBuildApplicationAnswer(text, imageIds, uploading) {
  if (uploading) return false
  const t = text.trim()
  const ids = dedupeImageIds(imageIds)
  return t.length > 0 || ids.length > 0
}

function buildApplicationUserAnswer(text, imageIds, uploading = false) {
  if (uploading) return null
  const t = text.trim()
  const ids = dedupeImageIds(imageIds)
  if (!t && !ids.length) return null
  const out = { kind: 'application' }
  if (t) out.text = text
  if (ids.length) out.imageIds = ids
  return out
}

function formatApplicationDisplay(payload) {
  if (!payload || typeof payload !== 'object') return '（未作答）'
  if (typeof payload.standardAnswer === 'string') {
    return payload.standardAnswer.trim() ? payload.standardAnswer : '（无标准答案）'
  }
  const text = typeof payload.text === 'string' ? payload.text.trim() : ''
  const hasImages =
    Array.isArray(payload.imageIds) &&
    payload.imageIds.map(String).filter(Boolean).length > 0
  if (text) return payload.text
  if (hasImages) return '（图片作答）'
  return '（未作答）'
}

// 1 纯文字
{
  const a = buildApplicationUserAnswer('步骤', [], false)
  assert.equal(a?.kind, 'application')
  assert.equal(a?.text, '步骤')
  assert.equal(a?.imageIds, undefined)
}

// 2 纯图片
{
  const a = buildApplicationUserAnswer('', ['1', '2'], false)
  assert.deepEqual(a?.imageIds, ['1', '2'])
  assert.equal(a?.text, undefined)
  assert.equal(formatApplicationDisplay(a), '（图片作答）')
}

// 3 混合
{
  const a = buildApplicationUserAnswer('说明', ['9'], false)
  assert.equal(a?.text, '说明')
  assert.deepEqual(a?.imageIds, ['9'])
}

// 4 空答案
assert.equal(buildApplicationUserAnswer('  ', [], false), null)
assert.equal(canBuildApplicationAnswer('', [], false), false)

// 5 去重
{
  const a = buildApplicationUserAnswer('', ['1', '1', 2, '2'], false)
  assert.deepEqual(a?.imageIds, ['1', '2'])
}

// 6 上传中禁止
assert.equal(canBuildApplicationAnswer('x', ['1'], true), false)
assert.equal(buildApplicationUserAnswer('x', ['1'], true), null)

// 7 数量限制
{
  const f = { type: 'image/jpeg', size: 100 }
  assert.equal(validateClientImageFile(f, 5).ok, false)
  assert.equal(validateClientImageFile(f, 4).ok, true)
}

// 8 大小 / MIME
{
  assert.equal(
    validateClientImageFile({ type: 'image/gif', size: 10 }, 0).ok,
    false,
  )
  assert.equal(
    validateClientImageFile({ type: 'image/png', size: MAX_BYTES + 1 }, 0).ok,
    false,
  )
  assert.equal(
    validateClientImageFile({ type: 'image/webp', size: 1024 }, 0).ok,
    true,
  )
}

// 9 旧文字兼容展示
assert.equal(formatApplicationDisplay({ kind: 'application', text: '旧' }), '旧')
assert.equal(formatApplicationDisplay({ kind: 'application', text: '  ' }), '（未作答）')

// 10 Blob URL 释放语义（Node 无 URL.createObjectURL 时跳过真实 revoke，仅测守卫）
function revokeAuthImageObjectUrl(url) {
  if (!url) return
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }
}
revokeAuthImageObjectUrl(null)
revokeAuthImageObjectUrl(undefined)
assert.ok(true, 'revoke null-safe')

// 11 completed 禁止删除：前端仅 disabled 时不调 DELETE（语义标记）
function canShowDelete(disabled, imageStatus) {
  return !disabled && imageStatus === 'draft'
}
assert.equal(canShowDelete(true, 'draft'), false)
assert.equal(canShowDelete(false, 'submitted'), false)
assert.equal(canShowDelete(false, 'draft'), true)

console.log('hs-math APPLICATION-2E selftest PASS')
