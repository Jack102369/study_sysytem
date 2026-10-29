/**
 * PHASE_E2-B6 PART A：真实人审就绪检查（不代审、不写覆盖层批准）。
 * pnpm --filter api run chem:industrial-phase-e2b6-selftest
 */
import { existsSync } from 'fs'
import { join } from 'path'
import { isIndustrialFormalRealPublishEnabled } from './industrial-formal-publish.config'
import { E2A_CANDIDATE_IDS, E2A_TARGET_BATCH } from './industrial-phase-e2a-revise'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import { resolveIndustrialCaseEffectiveReview } from './industrial-case-effective-review'
import { buildIndustrialAdminReviewPacket } from './industrial-admin-review-packet'
import { getIndustrialScientificEvidenceHelpers } from './industrial-scientific-evidence-helpers'

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

const EXPECT_REV: Record<string, number> = {
  cand_63284abdddf24cee: 9,
  cand_8ce596acabc64f26: 9,
  cand_03bf94425958444b: 7,
  cand_312c51e0c9e249f7: 9,
}

function main() {
  assert(!isIndustrialFormalRealPublishEnabled(), 'real publish OFF')
  const root = repoRoot()
  const cwd = apiCwd()

  for (const f of [
    'PHASE_E2B6_ADMIN_ACTION_CHECKLIST.md',
    'PHASE_E2B6_ADMIN_REVIEW_READINESS_REPORT.md',
  ]) {
    assert(
      existsSync(join(root, 'docs', 'chemistry_industrial_experiment', f)),
      `missing ${f}`,
    )
  }

  const gas = getIndustrialScientificEvidenceHelpers('gas_wash_teaching_basic')
  assert(!!gas, 'gas helpers')
  assert(gas!.sourceEvidenceStatus === 'SOURCE_EVIDENCE_INCOMPLETE', 'gas incomplete')
  assert(gas!.links.every((l) => l.accessStatus === 'ACCESS_FAILED'), 'gas links failed')

  const salt = getIndustrialScientificEvidenceHelpers('salt_purification_basic')
  assert(salt!.links.some((l) => l.accessStatus === 'ACCESSED'), 'salt accessed')

  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.e1BatchId === E2A_TARGET_BATCH, `${id} batch`)
    assert(rec.revision === EXPECT_REV[id], `${id} rev want ${EXPECT_REV[id]} got ${rec.revision}`)
    assert(rec.humanDecision === null, `${id} human null`)
    assert(rec.reviewStatus === 'pending_human_review', `${id} pending`)
    const packet = buildIndustrialAdminReviewPacket(rec, cwd)
    assert(Array.isArray(packet.reviewWorkflowSteps), `${id} steps`)
    assert(!!packet.scientificEvidenceHelpers, `${id} helpers`)
    assert(packet.packetVersion === 'e2b6-1.0', `${id} packet ver`)
  }

  for (const code of [
    'salt_purification_basic',
    'gas_wash_teaching_basic',
    'seawater_resource_basic',
  ]) {
    const c = ALL_CANDIDATE_CASES.find((x) => x.caseCode === code)!
    assert(c.reviewStatus === 'draft', `${code} draft`)
    assert(
      c.sourceReferences.every((s) => s.verificationStatus === 'unverified'),
      `${code} unverified`,
    )
    const eff = resolveIndustrialCaseEffectiveReview(c, cwd)
    assert(!eff.grantsEffectivePublishEligibility, `${code} no overlay grant`)
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: 'PHASE_E2-B6_PART_A',
        REAL_PUBLISH_DEFAULT_OFF: true,
        HUMAN_REVIEW_NOT_EXECUTED: true,
        HUMAN_BROWSER_REVIEW_PENDING: true,
        SCIENTIFIC_SOURCE_VERIFIED: false,
        CASE_APPROVED: false,
        FORMAL_IMPORT_NOT_EXECUTED: true,
      },
      null,
      2,
    ),
  )
}

main()
