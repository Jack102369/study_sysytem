/**
 * P1-0D 静态自检：导入结构校验、预览令牌、批准门禁代码存在、路由。
 * 不含真实 MySQL / HTTP 鉴权（见报告 NOT_RUN）。
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  hashImportItems,
  signImportPreviewToken,
  verifyImportPreviewToken,
} from './import-preview-token'
import {
  isForbiddenTrainItemCode,
  validateImportItemStructure,
} from './train-item-import.validate'

const ROOT = path.resolve(__dirname, '../../../../../')

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
  console.log('PASS:', msg)
}

function expectThrow(fn: () => void, msg: string) {
  try {
    fn()
    console.error('FAIL:', msg, '(未抛错)')
    process.exit(1)
  } catch {
    console.log('PASS:', msg)
  }
}

function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function sampleItem(over: Record<string, unknown> = {}) {
  return {
    code: 'rja.1.1.q.selftest.001',
    specialtyCode: 'rja-ch1',
    categoryCode: '1.1',
    qtype: 'single',
    difficulty: 1,
    stem: '若 $a\\in A$，则（自检题干足够长）',
    options: {
      options: [
        { id: 'A', text: '选项A' },
        { id: 'B', text: '选项B' },
      ],
    },
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '解析非空',
    knowledgePointCodes: ['rja.1.1.01'],
    primaryKnowledgePointCode: 'rja.1.1.01',
    ...over,
  }
}

function main() {
  assert(isForbiddenTrainItemCode('HS_MATH_P0_E2E_1'), 'P0 前缀禁止')
  assert(isForbiddenTrainItemCode('EXAMPLE.foo'), 'EXAMPLE 前缀禁止')
  assert(isForbiddenTrainItemCode('DEMO.x'), 'DEMO 前缀禁止')
  assert(!isForbiddenTrainItemCode('rja.1.1.q.001'), '正式 code 允许')

  const ok = validateImportItemStructure(sampleItem(), 0)
  assert(ok.ok && ok.errors.length === 0, '合法 single 结构')

  const multi = validateImportItemStructure(
    sampleItem({
      code: 'rja.1.1.q.selftest.multi',
      qtype: 'multi',
      answerPayload: { kind: 'multi', optionIds: ['A', 'B'] },
    }),
    0,
  )
  assert(multi.ok, '合法 multi')

  const judge = validateImportItemStructure(
    sampleItem({
      code: 'rja.1.1.q.selftest.judge',
      qtype: 'judge',
      options: null,
      answerPayload: { kind: 'judge', value: true },
    }),
    0,
  )
  assert(judge.ok, '合法 judge')

  const numeric = validateImportItemStructure(
    sampleItem({
      code: 'rja.1.1.q.selftest.num',
      qtype: 'numeric',
      options: null,
      answerPayload: { kind: 'numeric', value: '3', toleranceAbs: 0 },
    }),
    0,
  )
  assert(numeric.ok, '合法 numeric')

  assert(
    !validateImportItemStructure(sampleItem({ code: 'EXAMPLE.x' }), 0).ok,
    'EXAMPLE code 拒绝',
  )
  assert(
    !validateImportItemStructure(sampleItem({ status: 'approved' }), 0).ok,
    '禁止 status',
  )
  assert(
    !validateImportItemStructure(sampleItem({ analysis: '  ' }), 0).ok,
    '空解析拒绝',
  )
  assert(
    !validateImportItemStructure(
      sampleItem({
        answerPayload: { kind: 'single', optionId: 'Z' },
      }),
      0,
    ).ok,
    'single 非法选项拒绝',
  )
  assert(
    !validateImportItemStructure(
      sampleItem({
        qtype: 'multi',
        answerPayload: { kind: 'multi', optionIds: ['A', 'A'] },
      }),
      0,
    ).ok,
    'multi 重复选项拒绝',
  )
  assert(
    !validateImportItemStructure(
      sampleItem({
        qtype: 'numeric',
        options: null,
        answerPayload: { kind: 'numeric', value: '1e3' },
      }),
      0,
    ).ok,
    'numeric 科学计数法拒绝',
  )
  assert(
    !validateImportItemStructure(
      sampleItem({ knowledgePointCodes: [], primaryKnowledgePointCode: '' }),
      0,
    ).ok,
    '无知识点拒绝',
  )
  assert(
    !validateImportItemStructure(
      sampleItem({ primaryKnowledgePointCode: 'rja.1.1.99' }),
      0,
    ).ok,
    '主 KP 不在列表拒绝',
  )
  assert(
    !validateImportItemStructure(sampleItem({ qtype: 'essay' }), 0).ok,
    '非法题型拒绝',
  )
  assert(
    !validateImportItemStructure(sampleItem({ difficulty: 9 }), 0).ok,
    '非法难度拒绝',
  )
  assert(
    !validateImportItemStructure(sampleItem({ pool: 'test' }), 0).ok,
    'pool=test 拒绝',
  )

  const secret = 'selftest-secret'
  const items = [sampleItem()]
  const hash = hashImportItems(items)
  const token = signImportPreviewToken(secret, {
    v: 1,
    uid: '1',
    exp: Date.now() + 60_000,
    hash,
    n: 'abc',
  })
  const claims = verifyImportPreviewToken(secret, token, {
    userId: '1',
    contentHash: hash,
  })
  assert(claims.hash === hash, '令牌校验通过')

  expectThrow(
    () =>
      verifyImportPreviewToken(secret, token, {
        userId: '2',
        contentHash: hash,
      }),
    '令牌绑定管理员',
  )
  expectThrow(
    () =>
      verifyImportPreviewToken(secret, token, {
        userId: '1',
        contentHash: 'deadbeef',
      }),
    '令牌绑定内容哈希',
  )
  const expired = signImportPreviewToken(secret, {
    v: 1,
    uid: '1',
    exp: Date.now() - 1,
    hash,
    n: 'x',
  })
  expectThrow(
    () =>
      verifyImportPreviewToken(secret, expired, {
        userId: '1',
        contentHash: hash,
      }),
    '令牌过期拒绝',
  )

  const ctrl = read(
    'apps/api/src/hs-math/admin/hs-math-admin-train-items.controller.ts',
  )
  assert(ctrl.includes("import/preview"), 'preview 路由存在')
  assert(ctrl.includes("import/confirm"), 'confirm 路由存在')
  assert(ctrl.includes('AdminGuard'), 'AdminGuard')

  const svc = read(
    'apps/api/src/hs-math/admin/hs-math-admin-train-items.service.ts',
  )
  assert(svc.includes('assertApproveQualityGate'), '批准门禁函数')
  assert(svc.includes('批准前至少关联一个知识点'), '批准需 KP')
  assert(svc.includes('批准前解析'), '批准需解析')

  const imp = read(
    'apps/api/src/hs-math/admin/hs-math-admin-train-items-import.service.ts',
  )
  assert(imp.includes("status: 'draft'"), 'confirm 写 draft')
  assert(imp.includes('transaction'), 'confirm 事务')

  const fe = read(
    'apps/web/src/views/settings/hs-math/HsMathTrainItemsImportView.vue',
  )
  assert(fe.includes('previewAdminHsMathTrainItemsImport'), '前端 preview')
  assert(fe.includes('confirmAdminHsMathTrainItemsImport'), '前端 confirm')

  const tpl = read(
    'docs/high_school_math/examples/hs-math-import-template.json',
  )
  assert(tpl.includes('"qtype": "single"'), '模板 single')
  assert(tpl.includes('"qtype": "multi"'), '模板 multi')
  assert(tpl.includes('"qtype": "judge"'), '模板 judge')
  assert(tpl.includes('"qtype": "numeric"'), '模板 numeric')
  assert(tpl.includes('EXAMPLE.'), '模板演示前缀')

  console.log('hs-math P1-0D selftest PASS')
}

main()
