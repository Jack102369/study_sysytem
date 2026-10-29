/**
 * 工业案例人工审核覆盖层（文件级）。
 * - 不修改 fixtures 源码中的 reviewStatus/verified（防伪造历史）
 * - approve_for_publish 仅授予「有效审核态」，elevatesFixtureToPublished 恒为 false
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { join } from 'path'

export type IndustrialCaseReviewDecision =
  | 'acknowledge_draft'
  | 'request_changes'
  | 'sources_incomplete'
  | 'cannot_verify'
  | 'approve_for_publish'

export type IndustrialCaseSourceNote = {
  sourceTitle: string
  outcome:
    | 'verified_by_admin'
    | 'cannot_verify'
    | 'needs_revision'
    | 'not_applicable'
  evidenceNote: string
}

export type IndustrialCaseReviewOverlay = {
  caseCode: string
  contentHashAtReview: string
  decision: IndustrialCaseReviewDecision
  note: string
  sourceNotes: IndustrialCaseSourceNote[]
  reviewedBy: string
  reviewedAt: string
  /** 服务端计算：approve_for_publish 且通过校验时 = contentHashAtReview */
  reviewedContentHash: string | null
  /** 覆盖层是否意图授予有效发布资格（≠改写 fixture published） */
  grantsEffectivePublishEligibility: boolean
  /** 永远 false：禁止把 fixture 文件改成 published */
  elevatesFixtureToPublished: false
  elevatesToPublished: false
  history: Array<Omit<IndustrialCaseReviewOverlay, 'history'>>
}

function root(cwd = process.cwd()) {
  const p = join(cwd, 'var', 'industrial-case-review')
  mkdirSync(p, { recursive: true })
  return p
}

function pathFor(caseCode: string, cwd: string) {
  if (typeof caseCode !== 'string' || !caseCode.trim()) {
    throw new Error('INVALID_CASE_CODE')
  }
  const safe = caseCode.replace(/[^a-z0-9_]/gi, '_').slice(0, 64)
  if (!safe) throw new Error('INVALID_CASE_CODE')
  return join(root(cwd), `${safe}.json`)
}

export function loadIndustrialCaseReviewOverlay(
  caseCode: string,
  cwd = process.cwd(),
): IndustrialCaseReviewOverlay | null {
  if (typeof caseCode !== 'string' || !caseCode.trim()) return null
  try {
    const p = pathFor(caseCode, cwd)
    if (!existsSync(p)) return null
    const raw = JSON.parse(readFileSync(p, 'utf8')) as IndustrialCaseReviewOverlay
    return {
      ...raw,
      elevatesFixtureToPublished: false,
      elevatesToPublished: false,
      grantsEffectivePublishEligibility:
        raw.decision === 'approve_for_publish' &&
        raw.grantsEffectivePublishEligibility === true,
    }
  } catch {
    return null
  }
}

export function saveIndustrialCaseReviewOverlay(
  overlay: IndustrialCaseReviewOverlay,
  cwd = process.cwd(),
): void {
  const p = pathFor(overlay.caseCode, cwd)
  const tmp = `${p}.${process.pid}.${Date.now()}.tmp`
  const body = `${JSON.stringify(overlay, null, 2)}\n`
  writeFileSync(tmp, body, 'utf8')
  renameSync(tmp, p)
}

function snap(
  o: IndustrialCaseReviewOverlay,
): Omit<IndustrialCaseReviewOverlay, 'history'> {
  return {
    caseCode: o.caseCode,
    contentHashAtReview: o.contentHashAtReview,
    decision: o.decision,
    note: o.note,
    sourceNotes: o.sourceNotes,
    reviewedBy: o.reviewedBy,
    reviewedAt: o.reviewedAt,
    reviewedContentHash: o.reviewedContentHash,
    grantsEffectivePublishEligibility: o.grantsEffectivePublishEligibility,
    elevatesFixtureToPublished: false,
    elevatesToPublished: false,
  }
}

export function recordIndustrialCaseReview(input: {
  caseCode: string
  contentHashAtReview: string
  decision: IndustrialCaseReviewDecision
  note: string
  sourceNotes: IndustrialCaseSourceNote[]
  reviewedBy: string
  /** 并发：若提供则必须与当前覆盖层 contentHashAtReview 一致（无覆盖层则忽略） */
  expectedPriorContentHash?: string | null
  cwd?: string
}): IndustrialCaseReviewOverlay {
  const cwd = input.cwd || process.cwd()
  const prev = loadIndustrialCaseReviewOverlay(input.caseCode, cwd)

  if (
    input.expectedPriorContentHash != null &&
    prev &&
    prev.contentHashAtReview !== input.expectedPriorContentHash
  ) {
    throw new Error(
      `CASE_REVIEW_CONFLICT: expected prior ${input.expectedPriorContentHash.slice(0, 12)}…`,
    )
  }

  if (input.decision === 'approve_for_publish') {
    if (!String(input.note || '').trim()) {
      throw new Error('CASE_APPROVE_NOTE_REQUIRED')
    }
    if (!input.sourceNotes?.length) {
      throw new Error('CASE_APPROVE_SOURCE_NOTES_REQUIRED')
    }
    const bad = input.sourceNotes.filter(
      (s) =>
        s.outcome !== 'verified_by_admin' ||
        String(s.evidenceNote || '').trim().length < 8,
    )
    if (bad.length) {
      throw new Error(
        'CASE_APPROVE_SOURCE_EVIDENCE_REQUIRED: 每条来源须 verified_by_admin 且 evidenceNote≥8',
      )
    }
  }

  const grants =
    input.decision === 'approve_for_publish' &&
    !!input.sourceNotes?.length &&
    input.sourceNotes.every(
      (s) =>
        s.outcome === 'verified_by_admin' &&
        String(s.evidenceNote || '').trim().length >= 8,
    )

  const next: IndustrialCaseReviewOverlay = {
    caseCode: input.caseCode,
    contentHashAtReview: input.contentHashAtReview,
    decision: input.decision,
    note: input.note,
    sourceNotes: input.sourceNotes,
    reviewedBy: input.reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewedContentHash: grants ? input.contentHashAtReview : null,
    grantsEffectivePublishEligibility: grants,
    elevatesFixtureToPublished: false,
    elevatesToPublished: false,
    history: [...(prev?.history || []), ...(prev ? [snap(prev)] : [])].slice(-20),
  }
  saveIndustrialCaseReviewOverlay(next, cwd)
  return next
}
