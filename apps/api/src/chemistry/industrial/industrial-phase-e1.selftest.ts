/**
 * PHASE_E1 自检（不写 DB）
 * pnpm --filter api run chem:industrial-phase-e1-selftest
 */
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { hashSvgContent } from './industrial-svg-asset.service'
import { evaluateIndustrialFormalImportGates } from './industrial-formal-import.service'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'

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
  const latestPath = join(cwd, 'var', 'industrial-review', '_phase_e1_latest_batch.json')
  assert(existsSync(latestPath), 'run chem:industrial-phase-e1-prepare first')
  const latest = JSON.parse(readFileSync(latestPath, 'utf8')) as {
    batchId: string
    batchDir: string
    itemCount: number
  }
  assert(latest.batchId.startsWith('industrial_formal_candidate_'), 'e1 batch prefix')
  assert(!latest.batchId.includes('industrial_acceptance_'), 'not phase D batch')
  assert(latest.itemCount >= 3 && latest.itemCount <= 4, '3-4 candidates')

  const summary = JSON.parse(
    readFileSync(join(latest.batchDir, 'summary.json'), 'utf8'),
  ) as {
    generationSource: string
    readyForFormalImport: boolean
    items: Array<Record<string, unknown>>
    phaseDBatchUntouched: string
  }
  assert(summary.generationSource === 'manual_fixture', 'manual_fixture')
  assert(summary.readyForFormalImport === false, 'not ready formal')
  assert(
    summary.phaseDBatchUntouched === 'industrial_acceptance_20261029_121220',
    'phase D untouched note',
  )

  const diffs = new Set(summary.items.map((i) => Number(i.difficulty)))
  // E1 初始含 1/2/3；E2-A 可将超范围难度下调为 2，仍须覆盖 ≥2 档
  assert(diffs.has(1) && diffs.has(2), 'diff covers 1 and 2')
  assert([...diffs].every((d) => d >= 1 && d <= 3), 'diff in 1..3')

  let dual = 0
  let flow = 0
  let app = 0
  for (const it of summary.items) {
    const rec = loadIndustrialReviewRecord(String(it.candidateId), cwd)
    assert(!!rec, 'record')
    assert(rec!.generationSource === 'manual_fixture', 'source')
    assert(rec!.developmentOnly === false, 'not development_only')
    assert(rec!.reviewStatus === 'pending_human_review', 'pending')
    assert(rec!.humanDecision === null, 'no auto approve')
    assert(rec!.importedItemCode === null, 'not imported')
    assert(it.dbTrainItemId === 'NOT_CREATED', 'no db')
    assert(it.dbKbLinkIds === 'NOT_BOUND', 'no kb')
    assert(it.readyForFormalImport === false, 'item not ready')

    const kinds = (it.diagramKinds as string[]) || []
    if (kinds.includes('flow')) flow++
    if (kinds.includes('apparatus')) app++
    if (kinds.includes('flow') && kinds.includes('apparatus') && it.apparatusSvgContentHash) {
      dual++
    }

    assert(hashSvgContent(rec!.svg) === rec!.svgContentHash, 'flow hash')
    if (rec!.apparatusSvg && rec!.apparatusSvgContentHash) {
      const ah = hashSvgContent(
        rec!.apparatusSvg.endsWith('\n') ? rec!.apparatusSvg : `${rec!.apparatusSvg}\n`,
      )
      assert(ah === rec!.apparatusSvgContentHash, 'app hash')
    }

    const industrialCase = ALL_CANDIDATE_CASES.find((c) => c.caseCode === rec!.caseCode)
    assert(!!industrialCase, 'case')
    const gates = evaluateIndustrialFormalImportGates(rec!, industrialCase!)
    assert(!gates.ok, 'gates must block without human/case trust')
    assert(
      !gates.blockers.some((b) => b.includes('MOCK_GENERATED')),
      'manual_fixture not mocked as mock_generated',
    )
  }

  assert(flow >= 1 && app >= 1 && dual >= 1, 'diagram coverage')

  const checklist = JSON.parse(
    readFileSync(join(latest.batchDir, 'human_review_checklist.json'), 'utf8'),
  ) as { items?: Array<{ checks?: Record<string, string> }> }
  assert(Array.isArray(checklist.items) && checklist.items.length >= 3, 'checklist items')
  for (const row of checklist.items) {
    const checks = row.checks || {}
    for (const [k, v] of Object.entries(checks)) {
      if (v === 'N/A') continue
      assert(v === 'PENDING_HUMAN_REVIEW', `checklist ${k}`)
    }
  }

  // PHASE_D pointer still exists and distinct
  const dPath = join(cwd, 'var', 'industrial-review', '_phase_d_latest_batch.json')
  if (existsSync(dPath)) {
    const d = JSON.parse(readFileSync(dPath, 'utf8')) as { batchId: string }
    assert(d.batchId !== latest.batchId, 'e1 != d batch')
  }

  const files = readdirSync(latest.batchDir)
  assert(files.includes('summary.json'), 'summary')
  assert(files.includes('human_review_checklist.json'), 'checklist file')

  console.log(
    `chem:industrial-phase-e1-selftest PASS batch=${latest.batchId} n=${summary.items.length} dual=${dual}`,
  )
}

main()
