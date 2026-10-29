/**
 * 工业审核与入库闸门自检（无真实 MySQL 写入）。
 * pnpm --filter api run chem:industrial-review-selftest
 */
import { existsSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { CASE_SALT_PURIFICATION } from './industrial-case.fixtures'
import { generateIndustrialAiCandidateWithMock } from './industrial-ai-generator.service'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import {
  evaluateGatesForTestFixture,
  evaluateIndustrialFormalImportGates,
  formalImportIndustrialCandidate,
  FORMAL_ALLOWED_DESIGN_NOTE,
  stableImportIdempotencyKey,
} from './industrial-formal-import.service'
import {
  createIndustrialReviewRecord,
  getIndustrialReview,
  humanReviewIndustrialCandidate,
  listIndustrialReviews,
  patchIndustrialReview,
  recheckIndustrialReviewQuality,
} from './industrial-review.service'
import { INDUSTRIAL_SVG_SESSION_CONTRACT } from './industrial-svg-asset.service'
import { cloneDeep } from './industrial-quality.selftest-util'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const cwd = mkdtempSync(join(tmpdir(), 'ind-review-'))
  try {
    assert(FORMAL_ALLOWED_DESIGN_NOTE.includes('formalAllowed'), 'design note')
    assert(INDUSTRIAL_SVG_SESSION_CONTRACT.version === '1.2', 'svg contract')
    assert(INDUSTRIAL_SVG_SESSION_CONTRACT.itemAssetTable === 'chem_train_item_assets', 'table')
    assert(INDUSTRIAL_SVG_SESSION_CONTRACT.sessionSnapshot === 'IMPLEMENTED_STEP_10', 'step10 done')
    assert(INDUSTRIAL_SVG_SESSION_CONTRACT.publicStaticBlocked === true, 'static blocked')

    const gen = await generateIndustrialAiCandidateWithMock(
      {
        specialtyCode: 'industrial_experiment',
        categoryCode: 'industrial_separation_purification',
        caseCode: 'salt_purification_basic',
        knowledgePoints: ['过滤', '固液分离'],
        difficulty: 1,
        qtype: 'single',
        questionCount: 1,
        diagramRequired: true,
        generationMode: 'development_test',
      },
      'success_single',
      { writeFiles: false },
    )
    assert(gen.ok && gen.candidate && gen.svg, 'gen')

    const quality = await checkIndustrialCandidateQuality(
      {
        candidateId: gen.task.taskId,
        developmentOnly: true,
        categoryCode: 'industrial_separation_purification',
        industrialCase: CASE_SALT_PURIFICATION,
        candidate: gen.candidate!,
        definition: gen.diagramDefinition!,
        publicDiagram: gen.publicDiagram!,
        svg: gen.svg!,
        renderReport: gen.renderReport!,
      },
      { useMockAiReviewer: true, writeReport: false },
    )

    const record = createIndustrialReviewRecord(
      {
        generationTaskId: gen.task.taskId,
        generationSource: 'mock_generated',
        developmentOnly: true,
        specialtyCode: 'industrial_experiment',
        categoryCode: 'industrial_separation_purification',
        industrialCase: CASE_SALT_PURIFICATION,
        candidate: gen.candidate!,
        definition: gen.diagramDefinition!,
        publicDiagram: gen.publicDiagram!,
        svg: gen.svg!,
        renderReport: gen.renderReport!,
        qualityReport: quality,
      },
      cwd,
    )
    assert(existsSync(join(cwd, 'uploads', 'industrial-svg', `${record.svgContentHash}.svg`)), 'svg file')
    assert(listIndustrialReviews({}, cwd).length >= 1, 'list')
    assert(getIndustrialReview(record.candidateId, cwd)?.candidateId === record.candidateId, 'get')

    const patched = await patchIndustrialReview(
      record.candidateId,
      {
        expectedRevision: record.revision,
        stem: `${record.candidate.stem}（修订）`,
      },
      cwd,
    )
    assert(patched.reviewStatus === 'needs_revision', 'needs_revision')
    assert(patched.qualityReport === null, 'quality cleared')
    assert(patched.humanDecision === null, 'human cleared')

    const rechecked = await recheckIndustrialReviewQuality(patched.candidateId, cwd)
    assert(rechecked.qualityReport, 'quality back')
    assert(rechecked.reviewStatus === 'pending_human_review', 'pending human')

    const human = humanReviewIndustrialCandidate(
      rechecked.candidateId,
      {
        decision: 'approve',
        note: 'test',
        reviewerUserId: '99',
        expectedRevision: rechecked.revision,
      },
      cwd,
    )
    assert(human.reviewStatus !== 'approved_for_import', 'dev cannot import status')
    assert(human.humanDecision === 'approve', 'decision recorded')

    const gates = evaluateIndustrialFormalImportGates(human, CASE_SALT_PURIFICATION)
    assert(!gates.ok, 'gates block')
    assert(gates.blockers.some((b) => b.includes('DEVELOPMENT_ONLY')), 'dev block')
    assert(gates.blockers.some((b) => b.includes('MOCK')), 'mock block')
    assert(gates.blockers.some((b) => b.includes('SOURCE_UNVERIFIED') || b.includes('CASE_')), 'case block')
    assert(!gates.blockers.some((b) => b.includes('SVG_DB_BINDING_PROPOSED')), 'no proposed blocker')

    const imp = await formalImportIndustrialCandidate(human, CASE_SALT_PURIFICATION, {
      dryRun: true,
    })
    assert(!imp.ok, 'import blocked')

    const r2 = cloneDeep(human)
    r2.candidate.answer = 'A'
    const g2 = evaluateIndustrialFormalImportGates(r2, CASE_SALT_PURIFICATION)
    assert(g2.blockers.some((b) => b.includes('QUALITY_STALE') || b.includes('DEVELOPMENT')), 'stale or other')

    let conflict = false
    try {
      await patchIndustrialReview(
        human.candidateId,
        { expectedRevision: 1, stem: 'x' },
        cwd,
      )
    } catch (e) {
      conflict = String((e as Error).message).includes('REVISION_CONFLICT')
    }
    assert(conflict, 'revision conflict')

    const k1 = stableImportIdempotencyKey(human)
    const k2 = stableImportIdempotencyKey(human)
    assert(k1 === k2, 'idempotent key')

    const tf = evaluateGatesForTestFixture(human, CASE_SALT_PURIFICATION)
    assert(!tf.ok, 'fixture still blocked without verified case')

    const rejected = humanReviewIndustrialCandidate(
      human.candidateId,
      {
        decision: 'reject',
        note: 'reject test',
        reviewerUserId: '99',
        expectedRevision: getIndustrialReview(human.candidateId, cwd)!.revision,
      },
      cwd,
    )
    assert(rejected.reviewStatus === 'rejected', 'rejected')

    // eslint-disable-next-line no-console
    console.log(
      'industrial-review.selftest: OK (D043 approved; gates keep blocking draft/mock/dev; no MySQL write)',
    )
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
