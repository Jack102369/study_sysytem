/**
 * PHASE_E2-B7：多模型审核包导出自检（不改审核态；不写 DB）。
 * pnpm --filter api run chem:industrial-review-export-selftest
 */
import { inflateRawSync } from 'zlib'
import {
  buildIndustrialMultiModelReviewExport,
  isExternalReviewStale,
} from './industrial-review-export.service'
import { loadIndustrialReviewRecord } from './industrial-review.store'
import { normalizeIndustrialListBatchId } from './industrial-review.service'
import { E2A_TARGET_BATCH } from './industrial-phase-e2a-revise'

const BATCH = E2A_TARGET_BATCH
const EXPECT_REV: Record<string, number> = {
  cand_63284abdddf24cee: 9,
  cand_8ce596acabc64f26: 9,
  cand_03bf94425958444b: 7,
  cand_312c51e0c9e249f7: 9,
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

/** 最小 ZIP 解压（仅 DEFLATE local entries） */
function unzipNamesAndTexts(zip: Buffer): Map<string, string> {
  const out = new Map<string, string>()
  let o = 0
  while (o + 30 <= zip.length) {
    const sig = zip.readUInt32LE(o)
    if (sig !== 0x04034b50) break
    const method = zip.readUInt16LE(o + 8)
    const compSize = zip.readUInt32LE(o + 18)
    const uncompSize = zip.readUInt32LE(o + 22)
    const nameLen = zip.readUInt16LE(o + 26)
    const extraLen = zip.readUInt16LE(o + 28)
    const name = zip.slice(o + 30, o + 30 + nameLen).toString('utf8')
    const dataStart = o + 30 + nameLen + extraLen
    const comp = zip.slice(dataStart, dataStart + compSize)
    let raw: Buffer
    if (method === 8) raw = inflateRawSync(comp)
    else if (method === 0) raw = comp
    else throw new Error(`UNSUPPORTED_METHOD:${method}`)
    assert(raw.length === uncompSize, `size mismatch ${name}`)
    out.set(name, raw.toString('utf8'))
    o = dataStart + compSize
  }
  return out
}

function expectThrow(fn: () => void, includes: string) {
  let threw = false
  try {
    fn()
  } catch (e) {
    threw = true
    assert(String((e as Error).message || e).includes(includes), `want ${includes} got ${e}`)
  }
  assert(threw, `expected throw ${includes}`)
}

function main() {
  // O/P/Q
  assert(normalizeIndustrialListBatchId('').ok, 'empty list ok')
  expectThrow(() => buildIndustrialMultiModelReviewExport(''), 'BATCH_ID_REQUIRED')
  expectThrow(() => buildIndustrialMultiModelReviewExport('../etc/passwd'), 'BATCH_ID')
  expectThrow(() => buildIndustrialMultiModelReviewExport('no_such_batch_zzzz'), 'BATCH_NOT_FOUND')

  const before = Object.keys(EXPECT_REV).map((id) => {
    const r = loadIndustrialReviewRecord(id)!
    return {
      id,
      revision: r.revision,
      status: r.reviewStatus,
      human: r.humanDecision,
      audit: r.auditContentHash,
    }
  })

  const result = buildIndustrialMultiModelReviewExport(BATCH)
  assert(result.candidateIds.length === 4, 'A: 4 cands')
  assert(result.fileName === 'industrial_review_bundle_20261029_121958.zip', 'filename')
  assert(result.zip[0] === 0x50 && result.zip[1] === 0x4b, 'zip magic')

  for (const id of Object.keys(EXPECT_REV)) {
    const i = result.candidateIds.indexOf(id)
    assert(i >= 0, `missing ${id}`)
    assert(result.revisions[i] === EXPECT_REV[id], `B rev ${id}`)
  }

  const files = unzipNamesAndTexts(result.zip)
  assert(files.has('FULL_REVIEW.md'), 'has FULL')
  assert(files.has('manifest.json'), 'has manifest')
  assert(files.has('README.md'), 'readme')
  const full = files.get('FULL_REVIEW.md')!
  assert(full.includes('cand_63284abdddf24cee'), 'C id in full')
  assert(full.includes('标准答案'), 'C answer section')
  assert(full.includes('统一审核说明'), 'C instructions')
  assert(full.includes('工业实验'), 'C specialty')

  for (let n = 1; n <= 4; n++) {
    const p = `candidates/candidate_0${n}.md`
    const j = `candidates/candidate_0${n}.json`
    assert(files.has(p), `D ${p}`)
    assert(files.has(j), `E ${j}`)
  }

  const flow = [...files.keys()].filter((k) => k.endsWith('_flow.svg'))
  const app = [...files.keys()].filter((k) => k.endsWith('_apparatus.svg'))
  assert(flow.length === 4, `F flow=${flow.length}`)
  assert(app.length === 2, `G apparatus=${app.length}`) // 02+03

  for (const s of [
    'sources/SOURCE_REGISTRY.md',
    'sources/FACT_MATRIX.md',
    'sources/FACT_SOURCE_COVERAGE.md',
    'sources/QUESTION_EVIDENCE_MAPPING.md',
  ]) {
    assert(files.has(s), `H ${s}`)
  }

  const manifest = JSON.parse(files.get('manifest.json')!)
  assert(manifest.bundleContentHash === result.manifest.bundleContentHash, 'I hash match')
  assert(Array.isArray(manifest.files) && manifest.files.length >= 20, 'I files list')
  assert(manifest.candidateCount === 4, 'I count')

  // J already unzipped
  const joinedPaths = [...files.keys()].join('\n')
  assert(!joinedPaths.includes('.env'), 'K no .env')
  assert(!/\bjwt\b/i.test(joinedPaths), 'L no jwt path')
  assert(!joinedPaths.toLowerCase().includes('password'), 'M no password')
  assert(!joinedPaths.includes('student'), 'N no student')
  assert(!joinedPaths.includes('_phase_'), 'S no phase summary as cand')

  assert(files.has('review_templates/REVIEW_TEMPLATE.md'), 'template')
  assert(files.has('review_templates/REVIEW_RESULT_SCHEMA.json'), 'schema')
  assert(files.has('review_templates/MULTI_MODEL_COMPARISON.md'), 'compare')
  assert(files.has('quality/QUALITY_SUMMARY.md'), 'quality')
  assert(files.has('cases/salt_purification_basic.md'), 'case salt')
  assert(files.has('cases/gas_wash_teaching_basic.md'), 'case gas')
  assert(files.has('cases/seawater_resource_basic.md'), 'case sea')

  // T: status unchanged
  for (const b of before) {
    const r = loadIndustrialReviewRecord(b.id)!
    assert(r.revision === b.revision, `T rev ${b.id}`)
    assert(r.reviewStatus === b.status, `T status ${b.id}`)
    assert(r.humanDecision === b.human, `T human ${b.id}`)
    assert(r.auditContentHash === b.audit, `T audit ${b.id}`)
  }

  // Y stale
  assert(
    isExternalReviewStale({
      reviewedBundleContentHash: 'old',
      currentBundleContentHash: String(manifest.bundleContentHash),
    }),
    'Y stale',
  )
  assert(
    !isExternalReviewStale({
      reviewedBundleContentHash: String(manifest.bundleContentHash),
      currentBundleContentHash: String(manifest.bundleContentHash),
    }),
    'Y fresh',
  )

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: 'PHASE_E2-B7',
        batchId: BATCH,
        fileName: result.fileName,
        candidateCount: 4,
        revisions: result.revisions,
        flowSvg: flow.length,
        apparatusSvg: app.length,
        zipBytes: result.zip.length,
        bundleContentHash: manifest.bundleContentHash,
        AUTHENTICATED_HTTP_NOT_EXECUTED: true,
        BROWSER_DOWNLOAD_NOT_EXECUTED: true,
        HUMAN_REVIEW_NOT_EXECUTED: true,
        FORMAL_IMPORT_NOT_EXECUTED: true,
        REAL_PUBLISH_DEFAULT_OFF: true,
      },
      null,
      2,
    ),
  )
}

main()
