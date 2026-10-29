/**
 * PHASE_E2-B3：人审辅助准备回归（不写审核态、不入库）。
 * pnpm --filter api run chem:industrial-phase-e2b3-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { isIndustrialFormalRealPublishEnabled } from './industrial-formal-publish.config'
import { E2A_CANDIDATE_IDS, E2A_TARGET_BATCH } from './industrial-phase-e2a-revise'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { evaluateIndustrialFormalImportGates } from './industrial-formal-import.service'
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
  const cwd = apiCwd()
  const root = repoRoot()

  assert(!isIndustrialFormalRealPublishEnabled(), 'real publish still OFF')

  const packetDir = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'human_review_packets',
  )
  assert(existsSync(join(packetDir, 'INDEX.md')), 'INDEX.md exists')
  for (const id of E2A_CANDIDATE_IDS) {
    assert(existsSync(join(packetDir, `${id}.md`)), `packet ${id}`)
  }
  assert(
    existsSync(
      join(
        root,
        'docs',
        'chemistry_industrial_experiment',
        'PHASE_E2B3_HUMAN_REVIEW_OPERATIONS.md',
      ),
    ),
    'operations guide',
  )

  // E2-B4 后：海水填空已改为「结晶」对齐流程图（B3 曾记录 answer=过滤 的图文冲突）
  const seawater = loadIndustrialReviewRecord('cand_312c51e0c9e249f7', cwd)!
  const labels = (seawater.publicDiagram?.nodes || []).map((n) => n.displayLabel)
  assert(!labels.includes('过滤'), 'seawater diagram has no 过滤 node')
  assert(
    seawater.candidate.answer === '结晶' && labels.includes('结晶'),
    'seawater answer aligned with diagram after E2-B4',
  )

  const judge = loadIndustrialReviewRecord('cand_8ce596acabc64f26', cwd)!
  assert(judge.candidate.qtype === 'judge', 'judge type')
  assert(judge.candidate.answer === true, 'judge answer true')
  assert(judge.caseCode === 'gas_wash_teaching_basic', 'gas wash case')
  assert(
    !String(judge.candidate.stem).includes('更合理'),
    'judge stem tightened in E2-B4 (no 更合理)',
  )

  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.e1BatchId === E2A_TARGET_BATCH || (rec as any).e1BatchId === E2A_TARGET_BATCH, `batch ${id}`)
    assert(rec.humanDecision === null, `${id} human null`)
    assert(rec.reviewStatus === 'pending_human_review', `${id} pending`)
    assert(!(rec as any).importedItemCode, `${id} not imported`)
    const industrialCase = ALL_CANDIDATE_CASES.find((c) => c.caseCode === rec.caseCode)!
    const gates = evaluateIndustrialFormalImportGates(rec, industrialCase, { cwd })
    assert(!gates.ok, `${id} formal gates blocked`)
    const eff = resolveIndustrialCaseEffectiveReview(industrialCase, cwd)
    assert(!eff.grantsEffectivePublishEligibility, `${id} no effective publish grant`)
    if (rec.svgContentHash) {
      assert(
        existsSync(join(cwd, 'uploads', 'industrial-svg', `${rec.svgContentHash}.svg`)),
        `flow svg ${id}`,
      )
    }
  }

  const overlayRoot = join(cwd, 'var', 'industrial-case-review')
  if (existsSync(overlayRoot)) {
    // 允许空目录；不得在本自检中写入覆盖层
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: 'PHASE_E2-B3',
        batchId: E2A_TARGET_BATCH,
        packetsPresent: true,
        REAL_PUBLISH_DEFAULT_OFF: true,
        HUMAN_REVIEW_NOT_EXECUTED: true,
        SCIENTIFIC_SOURCE_HUMAN_VERIFICATION_PENDING: true,
        FORMAL_IMPORT_NOT_EXECUTED: true,
        seawaterDiagramAnswerMismatchDocumented: false,
        seawaterAlignedAfterE2b4: true,
      },
      null,
      2,
    ),
  )
}

main()
