/**
 * PHASE_E2-B5：科学来源证据包完整性（不改审核态）。
 * pnpm --filter api run chem:industrial-phase-e2b5-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { isIndustrialFormalRealPublishEnabled } from './industrial-formal-publish.config'
import { E2A_CANDIDATE_IDS, E2A_TARGET_BATCH } from './industrial-phase-e2a-revise'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import { resolveIndustrialCaseEffectiveReview } from './industrial-case-effective-review'

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

function main() {
  assert(!isIndustrialFormalRealPublishEnabled(), 'real publish OFF')
  const root = repoRoot()
  const cwd = apiCwd()
  const dir = join(root, 'docs', 'chemistry_industrial_experiment', 'scientific_source_packets')
  const required = [
    'INDEX.md',
    'FACT_MATRIX.md',
    'SOURCE_REGISTRY.md',
    'FACT_SOURCE_COVERAGE.md',
    'QUESTION_EVIDENCE_MAPPING.md',
    'salt_purification_basic.md',
    'gas_wash_teaching_basic.md',
    'seawater_resource_basic.md',
  ]
  for (const f of required) {
    assert(existsSync(join(dir, f)), `missing ${f}`)
  }
  assert(
    existsSync(
      join(
        root,
        'docs',
        'chemistry_industrial_experiment',
        'PHASE_E2B5_SOURCE_VERIFICATION_GUIDE.md',
      ),
    ),
    'guide',
  )

  const index = readFileSync(join(dir, 'INDEX.md'), 'utf8')
  assert(index.includes('≠ verified_by_admin'), 'disclaimer')
  assert(index.includes('ACCESSED'), 'access summary')

  const cases = ['salt_purification_basic', 'gas_wash_teaching_basic', 'seawater_resource_basic']
  for (const code of cases) {
    const c = ALL_CANDIDATE_CASES.find((x) => x.caseCode === code)!
    assert(c.reviewStatus === 'draft', `${code} draft`)
    assert(
      c.sourceReferences.every((s) => s.verificationStatus === 'unverified'),
      `${code} sources unverified`,
    )
    const eff = resolveIndustrialCaseEffectiveReview(c, cwd)
    assert(!eff.grantsEffectivePublishEligibility, `${code} no overlay grant`)
  }

  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.e1BatchId === E2A_TARGET_BATCH || (rec as any).e1BatchId === E2A_TARGET_BATCH, id)
    assert(rec.humanDecision === null, `${id} human null`)
    assert(rec.reviewStatus === 'pending_human_review', `${id} pending`)
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: 'PHASE_E2-B5',
        packetsPresent: true,
        REAL_PUBLISH_DEFAULT_OFF: true,
        CASE_OVERLAY_NOT_WRITTEN: true,
        HUMAN_SOURCE_VERIFICATION_NOT_EXECUTED: true,
        FORMAL_IMPORT_NOT_EXECUTED: true,
      },
      null,
      2,
    ),
  )
}

main()
