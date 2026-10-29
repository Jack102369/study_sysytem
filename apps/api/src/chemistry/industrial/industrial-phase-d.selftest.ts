/**
 * PHASE_D 批次自检（不写 DB）
 * pnpm --filter api run chem:industrial-phase-d-selftest
 */
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { hashSvgContent } from './industrial-svg-asset.service'

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
  const latestPath = join(cwd, 'var', 'industrial-review', '_phase_d_latest_batch.json')
  assert(existsSync(latestPath), 'latest batch pointer missing — run chem:industrial-phase-d-prepare first')
  const latest = JSON.parse(readFileSync(latestPath, 'utf8')) as {
    batchId: string
    batchDir: string
    itemCount: number
  }
  assert(latest.itemCount >= 3 && latest.itemCount <= 5, 'candidate count 3-5')
  const summaryPath = join(latest.batchDir, 'summary.json')
  assert(existsSync(summaryPath), 'summary.json')
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
    items: Array<Record<string, unknown>>
    kbBindingPlan: unknown[]
  }
  const items = summary.items
  assert(items.length === latest.itemCount, 'summary items match')

  const diffs = new Set(items.map((i) => Number(i.difficulty)))
  assert(diffs.has(1) && diffs.has(2) && diffs.has(3), 'difficulty 1/2/3')

  let flowN = 0
  let appN = 0
  let dualN = 0
  for (const it of items) {
    const id = String(it.candidateId)
    const rec = loadIndustrialReviewRecord(id, cwd)
    assert(!!rec, `record ${id}`)
    assert(rec!.developmentOnly === true, 'development_only')
    assert(rec!.generationSource === 'mock_generated', 'mock source')
    assert(rec!.reviewStatus === 'pending_human_review', 'pending human')
    assert(rec!.humanDecision === null, 'no auto approve')
    assert(rec!.importedItemCode === null, 'not imported')
    assert(rec!.qualityReport != null, 'quality report')
    assert(rec!.qualityReport!.requiresHumanReview === true, 'human review flag')
    assert(it.dbTrainItemId === 'NOT_CREATED', 'no db item')
    assert(it.dbKbLinkIds === 'NOT_BOUND', 'no kb link')
    assert(it.pool === 'NOT_WRITTEN', 'no pool write')

    const kinds = (it.diagramKinds as string[]) || []
    if (kinds.includes('flow')) flowN++
    if (kinds.includes('apparatus')) appN++
    if (kinds.includes('flow') && kinds.includes('apparatus') && it.apparatusSvgContentHash) {
      dualN++
    }

    const h = hashSvgContent(rec!.svg)
    assert(h === rec!.svgContentHash, 'flow hash match')
    if (rec!.apparatusSvg && rec!.apparatusSvgContentHash) {
      const ah = hashSvgContent(
        rec!.apparatusSvg.endsWith('\n') ? rec!.apparatusSvg : `${rec!.apparatusSvg}\n`,
      )
      assert(ah === rec!.apparatusSvgContentHash, 'apparatus hash match')
      assert(rec!.apparatusSvgContentHash !== rec!.svgContentHash, 'hashes differ')
    }
  }

  assert(flowN >= 1, 'has flow')
  assert(appN >= 1, 'has apparatus')
  assert(dualN >= 1, 'has dual')
  assert(Array.isArray(summary.kbBindingPlan) && summary.kbBindingPlan.length >= 1, 'kb plan')

  const batchFiles = readdirSync(join(root, 'docs', 'chemistry_industrial_experiment', 'acceptance_batches', latest.batchId))
  assert(batchFiles.some((f) => f.endsWith('_flow.svg')), 'batch flow svg copies')

  console.log(
    `chem:industrial-phase-d-selftest PASS batch=${latest.batchId} n=${items.length} flow=${flowN} app=${appN} dual=${dualN}`,
  )
}

main()
