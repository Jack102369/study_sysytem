/**
 * PHASE_E2-A 自检：阻塞分类、修订哈希失效、发布闸门仍阻断。
 * pnpm --filter api run chem:industrial-phase-e2a-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { FORBIDDEN_PROCESS_PATTERNS } from './industrial-quality.constants'
import { CASE_GAS_WASH_TEACHING } from './industrial-case.fixtures'
import { validateIndustrialCase } from './industrial-case.validate'
import {
  E2A_CANDIDATE_IDS,
  E2A_TARGET_BATCH,
  runPhaseE2aRevise,
} from './industrial-phase-e2a-revise'
import { loadIndustrialReviewRecord } from './industrial-review.store'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function repoRoot(): string {
  const cwd = process.cwd()
  for (const r of [cwd, join(cwd, '..'), join(cwd, '..', '..')]) {
    if (existsSync(join(r, 'db', 'init.sql'))) return r
  }
  return cwd
}

function apiCwd(): string {
  const root = repoRoot()
  const api = join(root, 'apps', 'api')
  return existsSync(api) ? api : process.cwd()
}

async function main() {
  // 规则：肯定错误命中；正确教学不误伤
  const bad = '用过滤除去可溶性盐杂质即可'
  const good =
    '过滤针对不溶固体；可溶性杂质需另选化学方法。过滤不能用于除去可溶性盐。'
  assert(
    FORBIDDEN_PROCESS_PATTERNS.some((p) => p.re.test(bad)),
    'affirmative wrong must match',
  )
  assert(
    !FORBIDDEN_PROCESS_PATTERNS.some((p) => p.re.test(good)),
    'teaching clarification must not match',
  )

  const gasVal = validateIndustrialCase(CASE_GAS_WASH_TEACHING)
  assert(gasVal.ok, `gas case valid: ${gasVal.errors.join(';')}`)
  assert(!gasVal.publishEligible, 'gas case not publishEligible')
  assert(CASE_GAS_WASH_TEACHING.reviewStatus === 'draft', 'gas stays draft')

  const cwd = apiCwd()
  const root = repoRoot()

  // 确保 E1 候选存在（若缺失则失败，不自动 seed formal）
  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)
    assert(!!rec, `missing E1 candidate ${id}`)
  }

  const beforeSnapshots = E2A_CANDIDATE_IDS.map((id) => {
    const r = loadIndustrialReviewRecord(id, cwd)!
    return {
      id,
      audit: r.auditContentHash,
      qOverall: r.qualityReport?.overallStatus,
      revision: r.revision,
    }
  })

  const { batchId, items } = await runPhaseE2aRevise({ cwd, root })
  assert(batchId === E2A_TARGET_BATCH, 'batch preserved')
  assert(items.length === 4, '4 candidates')

  for (const it of items) {
    const id = String(it.candidateId)
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.reviewStatus === 'pending_human_review', `${id} pending human`)
    assert(rec.humanDecision === null, `${id} no auto approve`)
    assert(rec.generationSource === 'manual_fixture', `${id} source`)
    assert(rec.developmentOnly === false, `${id} not developmentOnly`)
    assert(it.readyForFormalImport === false, `${id} not formal import ready`)
    assert(rec.qualityReport?.requiresHumanReview === true, `${id} requires human`)
    assert(
      rec.qualityReport?.formalPublishEligible === false,
      `${id} formalPublishEligible false (case/source gates)`,
    )

    const cls = it.blockerClassification as {
      QUALITY_BLOCKERS: unknown[]
      PUBLISH_ELIGIBILITY_BLOCKERS: unknown[]
      HUMAN_REVIEW_PENDING: boolean
      KB_BINDING_BLOCKERS: string[]
    }
    assert(cls.HUMAN_REVIEW_PENDING === true, `${id} human pending`)
    assert(cls.KB_BINDING_BLOCKERS.includes('KB_NOT_BOUND'), `${id} kb`)
    assert(
      cls.PUBLISH_ELIGIBILITY_BLOCKERS.length >= 1,
      `${id} still has publish blockers (case/source)`,
    )
    assert(
      cls.QUALITY_BLOCKERS.length === 0,
      `${id} content quality blockers should be cleared: ${JSON.stringify(cls.QUALITY_BLOCKERS)}`,
    )
    assert(it.readyForHumanReview === true, `${id} READY_FOR_HUMAN_REVIEW`)

    const prev = beforeSnapshots.find((b) => b.id === id)!
    assert(
      prev.revision !== undefined && rec.revision === prev.revision + 1,
      `${id} revision bumped`,
    )
    assert(!!rec.qualityReport, `${id} quality report present`)
    assert(
      rec.qualityReport!.questionContentHash.length === 64,
      `${id} question hash`,
    )
    assert(
      rec.qualityReport!.diagramContentHash ===
        rec.definition.diagramContentHash,
      `${id} quality diagram hash matches definition`,
    )
    assert(
      rec.qualityReport!.publicContentHash ===
        rec.publicDiagram.publicContentHash,
      `${id} quality public hash matches`,
    )
    assert(
      rec.qualityReport!.caseContentHash === rec.caseContentHash,
      `${id} quality case hash matches record`,
    )

    // unknown 不得自动消失成「科学已证明」
    assert(
      (rec.qualityReport?.unknownIssues.length || 0) > 0,
      `${id} unknowns remain (engine scope / mock AI)`,
    )
  }

  // PHASE_D mock 批次 marker 仍在
  const phaseD = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'acceptance_batches',
    'industrial_acceptance_20261029_121220',
  )
  if (existsSync(phaseD)) {
    const sum = join(phaseD, 'summary.json')
    if (existsSync(sum)) {
      const j = JSON.parse(readFileSync(sum, 'utf8')) as { batchId?: string }
      assert(
        j.batchId === 'industrial_acceptance_20261029_121220',
        'PHASE_D batch untouched',
      )
    }
  }

  // mock / development_only 仍不能 formal（抽检记录 generationSource）
  for (const id of E2A_CANDIDATE_IDS) {
    const r = loadIndustrialReviewRecord(id, cwd)!
    assert(r.generationSource !== 'mock_generated', 'not mock')
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        batchId: E2A_TARGET_BATCH,
        readyForHumanReview: items.every((i) => i.readyForHumanReview === true),
        readyForFormalImport: false,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
