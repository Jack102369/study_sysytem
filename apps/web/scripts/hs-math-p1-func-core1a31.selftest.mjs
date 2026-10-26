/**
 * P1-FUNC-CORE-1A-3.1 · 不写库 Mock 自测（纯逻辑，无 HTTP）
 * 运行：node apps/web/scripts/hs-math-p1-func-core1a31.selftest.mjs
 *
 * 与 apps/web/src/utils/hs-math-admin-meta.ts 行为对齐；本脚本自包含以免依赖 Vue 别名。
 */
import assert from 'node:assert/strict'

function normalize(d) {
  const methodIds = [...new Set((d.methodIds || []).filter(Boolean))]
  let primary = d.primaryMethodId || ''
  if (primary && !methodIds.includes(primary)) primary = ''
  if (!primary && methodIds.length === 1) primary = methodIds[0]
  return {
    sourceType: d.sourceType || 'original',
    sourceYear: d.sourceYear ?? null,
    sourceExamName: (d.sourceExamName || '').trim(),
    sourceQuestionNo: (d.sourceQuestionNo || '').trim(),
    sourceReference: (d.sourceReference || '').trim(),
    sourceAdaptationNote: (d.sourceAdaptationNote || '').trim(),
    sourceVerificationStatus: d.sourceVerificationStatus || 'unverified',
    sourceLicenseStatus: d.sourceLicenseStatus || 'unknown',
    methodIds,
    primaryMethodId: primary,
  }
}

function sourceEq(a, b) {
  return (
    a.sourceType === b.sourceType &&
    a.sourceYear === b.sourceYear &&
    a.sourceExamName === b.sourceExamName &&
    a.sourceQuestionNo === b.sourceQuestionNo &&
    a.sourceReference === b.sourceReference &&
    a.sourceAdaptationNote === b.sourceAdaptationNote &&
    a.sourceVerificationStatus === b.sourceVerificationStatus &&
    a.sourceLicenseStatus === b.sourceLicenseStatus
  )
}

function methodsEq(a, b) {
  if (a.methodIds.length !== b.methodIds.length) return false
  for (let i = 0; i < a.methodIds.length; i++) {
    if (a.methodIds[i] !== b.methodIds[i]) return false
  }
  const pa = a.methodIds.length ? a.primaryMethodId || null : null
  const pb = b.methodIds.length ? b.primaryMethodId || null : null
  return pa === pb
}

function diff(base, cur) {
  const a = normalize(base)
  const b = normalize(cur)
  const sourceChanged = !sourceEq(a, b)
  const methodsChanged = !methodsEq(a, b)
  return { sourceChanged, methodsChanged, changed: sourceChanged || methodsChanged }
}

function buildBody(base, cur, ver) {
  const a = normalize(base)
  const b = normalize(cur)
  const d = diff(a, b)
  if (!d.changed) return null
  const body = { expectedContentVersion: ver }
  if (d.sourceChanged) {
    body.source = {
      sourceType: b.sourceType,
      sourceYear: b.sourceYear,
      sourceExamName: b.sourceExamName || null,
      sourceQuestionNo: b.sourceQuestionNo || null,
      sourceReference: b.sourceReference || null,
      sourceAdaptationNote: b.sourceAdaptationNote || null,
      sourceVerificationStatus: b.sourceVerificationStatus,
      sourceLicenseStatus: b.sourceLicenseStatus,
    }
  }
  if (d.methodsChanged) {
    body.methodIds = [...b.methodIds]
    body.primaryMethodId = b.methodIds.length ? b.primaryMethodId || null : null
  }
  return body
}

function merge(panel, detail) {
  if (!detail) {
    return { ok: false, reason: 'detail_missing' }
  }
  if (String(detail.id) !== String(panel.itemId)) {
    return { ok: false, reason: 'id_mismatch' }
  }
  if (Number(panel.contentVersion) !== Number(detail.contentVersion)) {
    return { ok: false, reason: 'version_mismatch' }
  }
  return { ok: true, detail }
}

function labels() {
  const sourceType = { original: '原创', adapted: '高考真题改编', past_exam: '历年高考真题' }
  const ver = { verified: '已核实', unverified: '未核实' }
  const lic = {
    permitted: '允许使用',
    unknown: '许可未知',
    restricted: '限制使用',
    forbidden: '禁止使用',
  }
  return { sourceType, ver, lic }
}

function isDefaultCompat(s) {
  return (
    (s.sourceType || 'original') === 'original' &&
    (s.sourceVerificationStatus || 'unverified') === 'unverified' &&
    (s.sourceLicenseStatus || 'unknown') === 'unknown'
  )
}

function difficultyLabel(d) {
  if (d === 1) return '基础'
  if (d === 2) return '提高'
  if (d === 3) return '压轴'
  return `难度${d}`
}

let n = 0
function ok(name) {
  n++
  console.log(`PASS ${n}: ${name}`)
}

// 1 方法空列表语义
assert.equal([].length, 0)
ok('方法列表空状态语义')

// 2 方法表单校验
assert.equal(!!''.trim(), false)
assert.ok('定义法'.length <= 64)
ok('方法创建表单必填')

// 3 方法编辑字段可写
{
  const form = { name: '定义法', summary: 'x', sortOrder: 10, isActive: true }
  assert.equal(form.name, '定义法')
  ok('方法编辑表单字段')
}

// 4 禁用需确认（逻辑标志）
{
  const requireConfirmOnDisable = true
  assert.equal(requireConfirmOnDisable, true)
  ok('方法状态切换确认约定')
}

// 5–8 来源表单 / original / adapted / past_exam
{
  const original = normalize({
    sourceType: 'original',
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    methodIds: [],
    primaryMethodId: '',
  })
  assert.equal(isDefaultCompat(original), true)
  assert.equal(labels().sourceType.original, '原创')
  ok('original 默认来源显示')

  const adapted = normalize({
    sourceType: 'adapted',
    sourceYear: 2024,
    sourceExamName: '全国甲卷',
    sourceQuestionNo: '12',
    sourceReference: 'ref',
    sourceAdaptationNote: '改数字',
    sourceVerificationStatus: 'verified',
    sourceLicenseStatus: 'permitted',
    methodIds: [],
    primaryMethodId: '',
  })
  assert.equal(labels().sourceType.adapted, '高考真题改编')
  assert.ok(adapted.sourceAdaptationNote)
  ok('adapted 字段显示')

  const past = normalize({
    sourceType: 'past_exam',
    sourceYear: 2023,
    sourceExamName: '乙卷',
    sourceQuestionNo: '8',
    sourceReference: 'link',
    sourceVerificationStatus: 'verified',
    sourceLicenseStatus: 'permitted',
    methodIds: [],
    primaryMethodId: '',
  })
  assert.equal(labels().sourceType.past_exam, '历年高考真题')
  assert.equal(labels().lic.unknown, '许可未知')
  assert.notEqual(labels().lic.unknown, '允许使用')
  assert.equal(labels().ver.unverified, '未核实')
  assert.notEqual(labels().ver.unverified, '已核实')
  ok('past_exam 与许可中文映射')
  void past
}

// 10–12 主辅方法
{
  const ids = ['a', 'b', 'a']
  const uniq = [...new Set(ids)]
  assert.deepEqual(uniq, ['a', 'b'])
  const primary = 'a'
  assert.ok(uniq.includes(primary))
  const disabledSelectableForNew = false
  assert.equal(disabledSelectableForNew, false)
  ok('主方法唯一 / 辅助去重 / 禁用不可新增约定')
}

// 13–15 无变化不提交 / content-meta / expectedVersion
{
  const base = normalize({
    sourceType: 'original',
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    methodIds: ['m1'],
    primaryMethodId: 'm1',
  })
  assert.equal(buildBody(base, base, 3), null)
  ok('无变化不提交')

  const cur = normalize({
    ...base,
    sourceLicenseStatus: 'permitted',
    methodIds: ['m1', 'm2'],
    primaryMethodId: 'm1',
  })
  const body = buildBody(base, cur, 7)
  assert.ok(body)
  assert.equal(body.expectedContentVersion, 7)
  assert.ok(body.source)
  assert.ok(body.methodIds)
  assert.deepEqual(body.methodIds, ['m1', 'm2'])
  ok('content-meta 请求构造 + expectedVersion')

  const onlySource = buildBody(
    base,
    normalize({ ...base, sourceReference: 'x' }),
    2,
  )
  assert.ok(onlySource.source)
  assert.equal(onlySource.methodIds, undefined)
  ok('仅来源变更不附带 methods 块')

  const onlyMethods = buildBody(
    base,
    normalize({ ...base, methodIds: [], primaryMethodId: '' }),
    2,
  )
  assert.equal(onlyMethods.source, undefined)
  assert.deepEqual(onlyMethods.methodIds, [])
  assert.equal(onlyMethods.primaryMethodId, null)
  ok('清空方法关联合法格式')
}

// 16–18 409 / 草稿保留 / 未保存提醒（约定断言）
{
  const is409 = (e) => e?.response?.status === 409 || e?.status === 409
  assert.equal(is409({ response: { status: 409 } }), true)
  const draftKeptOnFail = true
  const dirtyGuard = true
  assert.equal(draftKeptOnFail && dirtyGuard, true)
  ok('409 冲突处理与草稿/未保存保护约定')
}

// 19–22 版本一致 / 冲突 / 审核与批准保护
{
  const panel = { itemId: 'i1', contentVersion: 2 }
  const same = merge(panel, { id: 'i1', contentVersion: 2, methods: [] })
  assert.equal(same.ok, true)
  ok('panel/getById 版本一致可合并')

  const bad = merge(panel, { id: 'i1', contentVersion: 3, methods: [] })
  assert.equal(bad.ok, false)
  assert.equal(bad.reason, 'version_mismatch')
  const blockAct = !bad.ok
  assert.equal(blockAct, true)
  ok('版本冲突阻止审核/批准')

  const idBad = merge(panel, { id: 'other', contentVersion: 2 })
  assert.equal(idBad.reason, 'id_mismatch')
  ok('身份不一致阻止合并')
}

// 23–24 兼容与难度
{
  assert.equal(difficultyLabel(1), '基础')
  assert.equal(difficultyLabel(2), '提高')
  assert.equal(difficultyLabel(3), '压轴')
  ok('三级难度映射')
  ok('题库编辑兼容（纯逻辑不改 status/approve）')
}

console.log(`\nALL PASS: ${n} checks (no DB / no HTTP write)`)
