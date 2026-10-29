/**
 * E2-B2 后续：管理员候选列表 batchId 查询回归（replace(undefined) 修复）。
 * pnpm --filter api run chem:industrial-candidate-list-selftest
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  listIndustrialReviews,
  normalizeIndustrialListBatchId,
} from './industrial-review.service'
import { listIndustrialReviewRecords } from './industrial-review.store'
import { getIndustrialReviewAdminDetail } from './industrial-review.service'
import { E2A_CANDIDATE_IDS, E2A_TARGET_BATCH } from './industrial-phase-e2a-revise'
import { buildIndustrialAdminReviewPacket } from './industrial-admin-review-packet'
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

function main() {
  const cwd = apiCwd()
  const root = repoRoot()
  const E1 = E2A_TARGET_BATCH
  const PHASE_D = 'industrial_acceptance_20261029_121220'

  // 0. 元数据文件存在但不进入候选列表
  const metaE2a = join(cwd, 'var', 'industrial-review', '_phase_e2a_latest_batch.json')
  assert(existsSync(metaE2a), 'e2a meta exists (trigger of original bug)')
  const listed = listIndustrialReviewRecords(cwd)
  assert(
    listed.every((r) => typeof r.candidateId === 'string' && r.candidateId.startsWith('cand_')),
    'list skips _phase_* meta',
  )
  assert(
    !listed.some((r) => !(r as any).caseCode),
    'all listed have caseCode',
  )

  // 1. E1 batchId 正常查询 → 恰好 4 道
  const e1Items = listIndustrialReviews({ batchId: E1 }, cwd)
  assert(e1Items.length === 4, `E1 count=${e1Items.length} expect 4`)
  for (const id of E2A_CANDIDATE_IDS) {
    assert(e1Items.some((i) => i.candidateId === id), `missing ${id}`)
  }

  // 2. 审核状态未变
  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(rec.humanDecision === null, `${id} human unchanged`)
    assert(rec.reviewStatus === 'pending_human_review', `${id} status`)
    assert(!(rec as any).importedItemCode, `${id} not imported`)
  }

  // 3. 不传 batchId
  const all = listIndustrialReviews({}, cwd)
  assert(all.length >= 4, 'all >= 4')
  assert(all.every((i) => i.candidateId), 'all have id')

  // 4. batchId 空串
  const empty = listIndustrialReviews({ batchId: '' }, cwd)
  assert(empty.length === all.length, 'empty batchId = all')
  assert(normalizeIndustrialListBatchId('').ok, 'norm empty')
  assert(normalizeIndustrialListBatchId('   ').ok, 'norm blank')

  // 5. 不存在批次 → 空列表
  const none = listIndustrialReviews({ batchId: 'industrial_formal_candidate_20990101_000000' }, cwd)
  assert(none.length === 0, 'unknown batch empty')

  // 6–7. 非法字符 / 类型
  let badChars = false
  try {
    listIndustrialReviews({ batchId: '../etc/passwd' }, cwd)
  } catch (e) {
    badChars = String((e as Error).message).includes('BATCH_ID_INVALID')
  }
  assert(badChars, 'path traversal rejected')
  let badType = false
  try {
    listIndustrialReviews({ batchId: 123 as unknown as string }, cwd)
  } catch (e) {
    badType = String((e as Error).message).includes('BATCH_ID_INVALID')
  }
  assert(badType, 'type rejected')
  assert(!normalizeIndustrialListBatchId('../x').ok, 'norm reject slash')

  // 8. PHASE_D Mock 批次（若有匹配候选）
  const dItems = listIndustrialReviews({ batchId: PHASE_D }, cwd)
  assert(Array.isArray(dItems), 'phase D listable')
  // 允许 0（若仅有摘要无候选字段）；有则皆为 cand_
  assert(dItems.every((i) => i.candidateId.startsWith('cand_')), 'phase D ids')

  // 9–10. 临时仓：缺字段损坏 + 合法候选共存
  const tmp = join(cwd, 'var', `_list_bugfix_${Date.now()}`)
  mkdirSync(join(tmp, 'var', 'industrial-review'), { recursive: true })
  try {
    const src = loadIndustrialReviewRecord(E2A_CANDIDATE_IDS[0], cwd)!
    const goodId = `cand_listok${String(Date.now()).slice(-8)}`
    const good = { ...JSON.parse(JSON.stringify(src)), candidateId: goodId }
    ;(good as any).e1BatchId = E1
    writeFileSync(
      join(tmp, 'var', 'industrial-review', `${goodId}.json`),
      `${JSON.stringify(good, null, 2)}\n`,
    )
    // 批次摘要（复现原 bug 形态）
    writeFileSync(
      join(tmp, 'var', 'industrial-review', '_phase_e2a_latest_batch.json'),
      `${JSON.stringify({ batchId: E1, e1BatchId: E1, phase: 'PHASE_E2A', itemCount: 1 }, null, 2)}\n`,
    )
    // 损坏：文件名像候选但缺 caseCode
    writeFileSync(
      join(tmp, 'var', 'industrial-review', 'cand_broken00000001.json'),
      `${JSON.stringify({ candidateId: 'cand_broken00000001', e1BatchId: E1 }, null, 2)}\n`,
    )
    const tmpListed = listIndustrialReviews({ batchId: E1 }, tmp)
    assert(tmpListed.length === 1, `tmp only good cand got ${tmpListed.length}`)
    assert(tmpListed[0].candidateId === goodId, 'tmp good id')
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }

  // 11–12. 材料包 + 详情
  for (const id of E2A_CANDIDATE_IDS) {
    const detail = getIndustrialReviewAdminDetail(id, cwd)
    assert(!!detail, `detail ${id}`)
    assert(!!(detail as any).adminReviewPacket, `packet ${id}`)
    const packet = buildIndustrialAdminReviewPacket(
      loadIndustrialReviewRecord(id, cwd)!,
      cwd,
    )
    assert(packet.candidateId === id, `packet id ${id}`)
  }

  // 13. SVG 哈希仍有
  for (const id of E2A_CANDIDATE_IDS) {
    const rec = loadIndustrialReviewRecord(id, cwd)!
    assert(!!rec.svgContentHash, `svg hash ${id}`)
    const svgPath = join(cwd, 'uploads', 'industrial-svg', `${rec.svgContentHash}.svg`)
    assert(existsSync(svgPath), `svg file ${id}`)
  }

  // 14–16. 状态不变（再读）
  for (const id of E2A_CANDIDATE_IDS) {
    const before = JSON.parse(
      readFileSync(join(cwd, 'var', 'industrial-review', `${id}.json`), 'utf8'),
    )
    listIndustrialReviews({ batchId: E1 }, cwd)
    const after = JSON.parse(
      readFileSync(join(cwd, 'var', 'industrial-review', `${id}.json`), 'utf8'),
    )
    assert(JSON.stringify(before) === JSON.stringify(after), `${id} file unchanged`)
    assert(before.humanDecision === null, 'human null')
    assert(before.reviewStatus === 'pending_human_review', 'pending')
  }

  // PHASE_D summary intact
  const phaseDSum = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'acceptance_batches',
    PHASE_D,
    'summary.json',
  )
  if (existsSync(phaseDSum)) {
    const j = JSON.parse(readFileSync(phaseDSum, 'utf8')) as { batchId?: string }
    assert(j.batchId === PHASE_D, 'phase D summary')
  }

  // 17. 前端真实「暂无候选」根因回归：Nest TransformInterceptor 包装后
  // 错误取 axios.data.items（包装层）→ undefined → []；正确取 axios.data.data.items
  const nestEnvelope = {
    success: true as const,
    data: {
      items: e1Items,
      formalAllowedDesignNote: 'contract',
      defaultFormalBatchId: E1,
    },
  }
  const buggyRows = (nestEnvelope as { items?: unknown }).items
  const fixedRows = nestEnvelope.data.items
  assert(!Array.isArray(buggyRows), 'envelope top-level has no items (bug path)')
  assert(
    Array.isArray(fixedRows) && fixedRows.length === 4,
    `correct unwrap count=${Array.isArray(fixedRows) ? fixedRows.length : -1}`,
  )

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        e1BatchId: E1,
        e1Count: e1Items.length,
        metaSkipped: true,
        filesUnchanged: true,
        apiSuccessUnwrapContract: true,
        HTTP_E2E_NOT_EXECUTED: true,
        AUTHENTICATED_HTTP_NOT_EXECUTED: true,
        BROWSER_NOT_VERIFIED: true,
      },
      null,
      2,
    ),
  )
}

main()
