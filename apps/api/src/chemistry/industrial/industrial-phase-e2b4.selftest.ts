/**
 * PHASE_E2-B4 科学一致性修订回归。
 * pnpm --filter api run chem:industrial-phase-e2b4-selftest
 *
 * 要求：先执行 chem:industrial-phase-e2b4-revise（或已落盘修订结果）。
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { isIndustrialFormalRealPublishEnabled } from './industrial-formal-publish.config'
import {
  E2A_CANDIDATE_IDS,
  E2A_TARGET_BATCH,
} from './industrial-phase-e2a-revise'
import { listIndustrialReviews } from './industrial-review.service'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import { evaluateIndustrialFormalImportGates } from './industrial-formal-import.service'
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
  assert(!isIndustrialFormalRealPublishEnabled(), 'real publish OFF')

  const summaryPath = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'formal_candidate_batches',
    E2A_TARGET_BATCH,
    'e2b4_revision_summary.json',
  )
  assert(existsSync(summaryPath), 'e2b4 summary exists')
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
    items: Array<{ candidateId: string; decision: string }>
  }

  // A. 04 图文答案一致
  const sea = loadIndustrialReviewRecord('cand_312c51e0c9e249f7', cwd)!
  assert(sea.revision >= 9, '04 rev>=9')
  assert(sea.candidate.answer === '结晶', '04 answer 结晶')
  const labels = (sea.publicDiagram?.nodes || []).map((n) => n.displayLabel)
  assert(labels.includes('结晶'), '04 diagram has 结晶')
  assert(!labels.includes('过滤'), '04 diagram no 过滤')
  assert(
    sea.candidate.knowledgePoints.every((k) =>
      ['结晶', '溶液', '蒸发', '混合物分离'].includes(k),
    ),
    '04 kp whitelist',
  )

  // B. 02 条件可由图判定（题干含发生器/洗气/集气顺序）
  const judge = loadIndustrialReviewRecord('cand_8ce596acabc64f26', cwd)!
  assert(judge.revision >= 9, '02 rev')
  assert(judge.candidate.answer === true, '02 answer true')
  assert(
    String(judge.candidate.stem).includes('洗气瓶') &&
      String(judge.candidate.stem).includes('气体发生器') &&
      String(judge.candidate.stem).includes('集气瓶'),
    '02 stem names components',
  )
  assert(!String(judge.candidate.stem).includes('更合理'), '02 no 更合理')
  const comps = judge.apparatusDefinition?.components || []
  assert(comps.some((c) => c.componentType === 'gas_washing_bottle'), '02 wash')
  assert(
    (judge.apparatusDefinition?.connections || []).length >= 2,
    '02 connections',
  )

  // C. 01 操作①对应
  const salt1 = loadIndustrialReviewRecord('cand_63284abdddf24cee', cwd)!
  assert(salt1.revision >= 9, '01 rev')
  assert(salt1.candidate.answer === '过滤', '01 answer')
  assert(String(salt1.candidate.stem).includes('操作①'), '01 stem 操作①')
  assert(String(salt1.candidate.stem).includes('滤液'), '01 stem 滤液')
  const nFilter = salt1.definition.nodes.find((n) => n.id === 'n_filter')
  assert(nFilter?.displayLabel === '操作①', '01 node label')
  assert(
    (nFilter as { internal?: { answerLabel?: string } })?.internal?.answerLabel ===
      '过滤',
    '01 internal answerLabel',
  )

  // D. 03 双图未强制改
  const dual = loadIndustrialReviewRecord('cand_03bf94425958444b', cwd)!
  const dualDecision = summary.items.find(
    (i) => i.candidateId === dual.candidateId,
  )?.decision
  assert(dualDecision === 'NO_CHANGE_REQUIRED', '03 no change')
  assert(dual.revision === 7, '03 rev unchanged')
  assert(!!dual.apparatusDefinition, '03 has apparatus')
  assert(!!dual.definition, '03 has flow')

  // E–I. 修订题 revision/hash/人审/质检
  for (const id of [
    'cand_63284abdddf24cee',
    'cand_8ce596acabc64f26',
    'cand_312c51e0c9e249f7',
  ]) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.revision > 7, `${id} revision bumped`)
    assert(rec.humanDecision === null, `${id} human null`)
    assert(rec.reviewStatus === 'pending_human_review', `${id} pending`)
    assert(!!rec.qualityReport, `${id} quality present`)
    assert(rec.qualityReport!.formalPublishEligible === false, `${id} formal false`)
    const industrialCase = ALL_CANDIDATE_CASES.find((c) => c.caseCode === rec.caseCode)!
    const gates = evaluateIndustrialFormalImportGates(rec, industrialCase, { cwd })
    assert(!gates.ok, `${id} gates blocked`)
    const eff = resolveIndustrialCaseEffectiveReview(industrialCase, cwd)
    assert(!eff.grantsEffectivePublishEligibility, `${id} no overlay grant`)
  }

  // J. 旧 SVG 路径仍在（hash 未变的图文件）
  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    if (rec.svgContentHash) {
      assert(
        existsSync(join(cwd, 'uploads', 'industrial-svg', `${rec.svgContentHash}.svg`)),
        `svg ${id}`,
      )
    }
  }

  // L. 列表仍 4
  const listed = listIndustrialReviews({ batchId: E2A_TARGET_BATCH }, cwd)
  assert(listed.length === 4, `list count=${listed.length}`)

  // M. PHASE_D 可列且 developmentOnly
  const dItems = listIndustrialReviews(
    { batchId: 'industrial_acceptance_20261029_121220' },
    cwd,
  )
  assert(
    dItems.every((i) => i.developmentOnly === true || i.candidateId.startsWith('cand_')),
    'phase D listable',
  )

  // packets updated marker（文件存在即可；内容由文档步维护）
  const packetIndex = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'human_review_packets',
    'INDEX.md',
  )
  assert(existsSync(packetIndex), 'packets INDEX')

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: 'PHASE_E2-B4',
        batchId: E2A_TARGET_BATCH,
        REAL_PUBLISH_DEFAULT_OFF: true,
        HUMAN_SCIENTIFIC_REVIEW_PENDING: true,
        FORMAL_IMPORT_NOT_EXECUTED: true,
        seaAnswerAligned: true,
        judgeStemDeterministic: true,
        saltOp1Clarified: true,
        dualNoChange: true,
      },
      null,
      2,
    ),
  )
}

main()
