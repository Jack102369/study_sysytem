/**
 * P1-0D.1 单元自检（不连 MySQL）：
 * - 规范化哈希 / 键序无关
 * - 令牌绑定与篡改拒绝
 * - 批准阻断前缀
 * - 源码审计：幂等须内容比对
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  canonicalizeImportItem,
  fingerprintCanonicalItem,
  hashImportItems,
  signImportPreviewToken,
  verifyImportPreviewToken,
} from './import-preview-token'
import {
  isBlockedFromApprove,
  isForbiddenTrainItemCode,
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

function sample(over: Record<string, unknown> = {}) {
  return {
    code: 'rja.1.1.q.p10d1.001',
    specialtyCode: 'rja-ch1',
    categoryCode: '1.1',
    qtype: 'single',
    difficulty: 1,
    stem: '集合题干足够长度用于自检',
    options: {
      options: [
        { id: 'A', text: '甲' },
        { id: 'B', text: '乙' },
      ],
    },
    answerPayload: { kind: 'single', optionId: 'A' },
    analysis: '解析',
    knowledgePointCodes: ['rja.1.1.02', 'rja.1.1.01'],
    primaryKnowledgePointCode: 'rja.1.1.01',
    ...over,
  }
}

function main() {
  const a = sample()
  const b = {
    primaryKnowledgePointCode: a.primaryKnowledgePointCode,
    knowledgePointCodes: ['rja.1.1.01', 'rja.1.1.02'],
    analysis: a.analysis,
    answerPayload: a.answerPayload,
    options: a.options,
    stem: a.stem,
    difficulty: a.difficulty,
    qtype: a.qtype,
    categoryCode: a.categoryCode,
    specialtyCode: a.specialtyCode,
    code: a.code,
  }
  assert(
    hashImportItems([a]) === hashImportItems([b]),
    '导入内容哈希键序无关',
  )
  assert(
    fingerprintCanonicalItem(canonicalizeImportItem(a)!) ===
      fingerprintCanonicalItem(canonicalizeImportItem(b)!),
    '指纹键序无关',
  )
  const c = sample({ stem: '不同题干足够长度用于自检XX' })
  assert(
    hashImportItems([a]) !== hashImportItems([c]),
    '题干变化改变哈希',
  )

  const secret = 'unit-test-secret-do-not-use-prod'
  const items = [a]
  const hash = hashImportItems(items)
  const token = signImportPreviewToken(secret, {
    v: 1,
    uid: '9',
    exp: Date.now() + 60_000,
    hash,
    n: 'nonce1',
  })
  verifyImportPreviewToken(secret, token, { userId: '9', contentHash: hash })
  assert(true, '合法令牌可验证')

  expectThrow(
    () =>
      verifyImportPreviewToken(secret, token, {
        userId: '8',
        contentHash: hash,
      }),
    '跨管理员令牌拒绝',
  )
  expectThrow(
    () =>
      verifyImportPreviewToken(secret, token, {
        userId: '9',
        contentHash: hashImportItems([c]),
      }),
    '篡改 items 哈希拒绝',
  )
  const expired = signImportPreviewToken(secret, {
    v: 1,
    uid: '9',
    exp: Date.now() - 10,
    hash,
    n: 'n2',
  })
  expectThrow(
    () =>
      verifyImportPreviewToken(secret, expired, {
        userId: '9',
        contentHash: hash,
      }),
    '过期令牌拒绝',
  )
  expectThrow(
    () =>
      verifyImportPreviewToken(secret, 'a'.repeat(5000), {
        userId: '9',
        contentHash: hash,
      }),
    '超长令牌拒绝',
  )

  assert(isBlockedFromApprove('HS_MATH_P1_0D1_IT_single'), 'IT 前缀不可批准')
  assert(isBlockedFromApprove('HS_MATH_P0_E2E_X'), 'P0 前缀不可批准')
  assert(!isForbiddenTrainItemCode('HS_MATH_P1_0D1_IT_single'), 'IT 允许导入 draft')
  assert(!isBlockedFromApprove('rja.1.1.q.001'), '正式 code 可批准（结构另检）')

  const imp = read(
    'apps/api/src/hs-math/admin/hs-math-admin-train-items-import.service.ts',
  )
  assert(imp.includes('assertExistingMatchesImport'), '幂等须内容比对')
  assert(imp.includes('内容不一致'), '内容不一致冲突文案')
  assert(imp.includes('确认时知识点已停用'), '事务内再校验 KP')
  assert(imp.includes('treatExistingCodeAsError: false'), 'confirm 不误拦幂等')

  const gate = read(
    'apps/api/src/hs-math/admin/hs-math-admin-train-items.service.ts',
  )
  assert(gate.includes('isBlockedFromApprove'), '批准使用阻断前缀')
  assert(gate.includes('assertApproveQualityGate'), '批准门禁存在')

  const fe = read(
    'apps/web/src/views/settings/hs-math/HsMathTrainItemsImportView.vue',
  )
  assert(!/localStorage\.setItem.*previewToken/i.test(fe), '前端不持久化 token')
  assert(fe.includes('confirmLock'), '确认防重复点击')
  assert(!fe.includes("status: 'approved'"), '前端无自动批准')

  console.log('hs-math P1-0D.1 unit selftest PASS')
}

main()
