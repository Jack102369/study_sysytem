/**
 * 工业案例领域模型自检（无 DB、无 Nest、无网络）。
 * pnpm --filter api run chem:industrial-case-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  ALL_CANDIDATE_CASES,
  CASE_METAL_RECOVERY,
  CASE_SALT_PURIFICATION,
  CASE_SEAWATER_BASIC,
} from './industrial-case.fixtures'
import {
  computeIndustrialCaseContentHash,
  isReviewFresh,
} from './industrial-case.hash'
import type { IndustrialCase } from './industrial-case.types'
import { validateIndustrialCase } from './industrial-case.validate'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

function findCasesJsonDir(): string | null {
  const cwd = process.cwd()
  const roots = [cwd, join(cwd, '..'), join(cwd, '..', '..')]
  for (const root of roots) {
    const p = join(root, 'docs', 'chemistry_industrial_experiment', 'cases')
    if (existsSync(join(p, 'salt_purification_basic.json'))) return p
  }
  return null
}

function main() {
  // 1 合法案例通过
  for (const c of ALL_CANDIDATE_CASES) {
    const r = validateIndustrialCase(c)
    assert(r.ok, `${c.caseCode} should pass: ${r.errors.join('; ')}`)
    assert(!r.publishEligible, `${c.caseCode} must not be publishEligible (unverified)`)
    assert(c.reviewStatus === 'draft', `${c.caseCode} must stay draft`)
  }

  // 2 caseCode 空
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    bad.caseCode = ''
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    assert(!validateIndustrialCase(bad).ok, 'empty caseCode')
  }

  // 3 非法 caseType
  {
    const bad = clone(CASE_SALT_PURIFICATION) as IndustrialCase & { caseType: string }
    bad.caseType = 'fake_type'
    bad.contentHash = computeIndustrialCaseContentHash(bad as IndustrialCase)
    assert(!validateIndustrialCase(bad).ok, 'bad caseType')
  }

  // 4 非法 specialty
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    ;(bad as { specialtyCode: string }).specialtyCode = 'experiment'
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    assert(!validateIndustrialCase(bad).ok, 'bad specialty')
  }

  // 5 非法 category
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    bad.categoryCodes = ['not_a_real_cat' as IndustrialCase['categoryCodes'][number]]
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    assert(!validateIndustrialCase(bad).ok, 'bad category')
  }

  // 6 重复 materialId
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    bad.materials = [...bad.materials, { ...bad.materials[0] }]
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    assert(!validateIndustrialCase(bad).ok, 'dup material')
  }

  // 7 重复 stepId
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    bad.processSteps = [...bad.processSteps, { ...bad.processSteps[0] }]
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    assert(!validateIndustrialCase(bad).ok, 'dup step')
  }

  // 8 步骤引用缺失物料
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    bad.processSteps[0].inputs = ['m_missing']
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    assert(!validateIndustrialCase(bad).ok, 'missing material ref')
  }

  // 9 非法 difficulty
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    bad.difficultyRange = { min: 2, max: 1 }
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    assert(!validateIndustrialCase(bad).ok, 'bad difficulty')
  }

  // 10 非法审核状态
  {
    const bad = clone(CASE_SALT_PURIFICATION) as IndustrialCase & { reviewStatus: string }
    bad.reviewStatus = 'shipped'
    bad.contentHash = computeIndustrialCaseContentHash(bad as IndustrialCase)
    assert(!validateIndustrialCase(bad).ok, 'bad reviewStatus')
  }

  // 11 缺少 verified 来源不能 publish
  {
    const bad = clone(CASE_SALT_PURIFICATION)
    bad.reviewStatus = 'published'
    bad.curriculumScope.curriculumReviewStatus = 'approved'
    bad.reviewedContentHash = bad.contentHash
    bad.contentHash = computeIndustrialCaseContentHash(bad)
    const r = validateIndustrialCase(bad)
    assert(!r.ok, 'publish without verified source')
    assert(
      r.errors.some((e) => e.includes('verified source')),
      'expect verified source error',
    )
  }

  // 12 unverified 不得自动变 verified（枚举约束 + 案例保持）
  assert(
    CASE_SALT_PURIFICATION.sourceReferences.every((s) => s.verificationStatus !== 'verified'),
    'candidates must not auto-verify',
  )

  // 13 内容变化哈希变化
  {
    const a = CASE_SALT_PURIFICATION.contentHash
    const mutated = clone(CASE_SALT_PURIFICATION)
    mutated.title = `${mutated.title}!`
    const b = computeIndustrialCaseContentHash(mutated)
    assert(a !== b, 'hash must change on semantic edit')
  }

  // 14 相同语义稳定哈希
  {
    const again = computeIndustrialCaseContentHash({
      ...CASE_SALT_PURIFICATION,
      contentHash: 'x'.repeat(64),
    })
    assert(again === CASE_SALT_PURIFICATION.contentHash, 'stable hash')
  }

  // 15 JSON 可读
  const dir = findCasesJsonDir()
  assert(!!dir, 'cases json dir missing — run write-candidate-cases first')
  for (const code of [
    'salt_purification_basic',
    'seawater_resource_basic',
    'metal_recovery_basic',
  ]) {
    const raw = JSON.parse(readFileSync(join(dir!, `${code}.json`), 'utf8'))
    const r = validateIndustrialCase(raw)
    assert(r.ok, `json ${code}: ${r.errors.join('; ')}`)
  }

  // 16 不能自动认定已审核
  assert(CASE_SEAWATER_BASIC.reviewStatus === 'draft', 'seawater draft')
  assert(!isReviewFresh(CASE_SEAWATER_BASIC), 'no fresh review')

  // 17 教材简化 ≠ 真实工业
  assert(CASE_SALT_PURIFICATION.caseType === 'textbook_simplification', 'salt type')
  assert(CASE_SEAWATER_BASIC.caseType === 'textbook_simplification', 'sea type')
  assert(CASE_METAL_RECOVERY.caseType === 'teaching_simulation', 'metal type')
  assert(
    ALL_CANDIDATE_CASES.every((c) => c.caseType !== 'real_industrial_process'),
    'no fake real_industrial_process',
  )

  // 18 金属反应 pending
  assert(
    CASE_METAL_RECOVERY.reactions.every((r) => r.pendingVerification === true),
    'metal reactions pending',
  )

  // eslint-disable-next-line no-console
  console.log('industrial-case.selftest OK (no DB writes)')
}

main()
