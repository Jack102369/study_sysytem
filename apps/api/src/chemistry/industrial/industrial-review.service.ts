import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import type { IndustrialCase } from './industrial-case.types'
import { computeAuditContentHash } from './industrial-quality.hash'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import {
  projectIndustrialDiagramPublic,
} from './industrial-diagram.project'
import {
  validateIndustrialDiagramAgainstCase,
  validateIndustrialDiagramDefinition,
} from './industrial-diagram.validate'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'
import { persistImmutableIndustrialSvg } from './industrial-svg-asset.service'
import {
  listIndustrialReviewRecords,
  loadIndustrialReviewRecord,
  saveIndustrialReviewRecord,
} from './industrial-review.store'
import type {
  CreateReviewFromGenerateInput,
  IndustrialHumanDecision,
  IndustrialReviewListItem,
  IndustrialReviewPatchInput,
  IndustrialReviewRecord,
} from './industrial-review.types'
import {
  evaluateIndustrialFormalImportGates,
  formalImportIndustrialCandidate,
  type IndustrialFormalImportDbPayload,
  type IndustrialFormalImportDbWriteResult,
} from './industrial-formal-import.service'
import { buildIndustrialAdminReviewPacket } from './industrial-admin-review-packet'
import {
  projectIndustrialCaseForPublishGates,
  resolveIndustrialCaseEffectiveReview,
} from './industrial-case-effective-review'
import {
  recordIndustrialCaseReview,
  type IndustrialCaseReviewDecision,
} from './industrial-case-review.store'

function findCase(caseCode: string): IndustrialCase | undefined {
  return ALL_CANDIDATE_CASES.find((c) => c.caseCode === caseCode)
}

function readFileUtf8Or(fallback: string, absolutePath: string): string {
  try {
    return readFileSync(absolutePath, 'utf8')
  } catch {
    return fallback.endsWith('\n') ? fallback : `${fallback}\n`
  }
}

function toListItem(r: IndustrialReviewRecord): IndustrialReviewListItem | null {
  if (!r?.candidateId || !r.caseCode || !r.candidate) {
    // eslint-disable-next-line no-console
    console.warn(
      `[industrial-review] skip list item: incomplete record candidateId=${r?.candidateId}`,
    )
    return null
  }
  const industrialCase =
    findCase(r.caseCode) ||
    ({
      caseCode: r.caseCode,
      version: r.caseVersion || '0',
      contentHash: r.caseContentHash || '',
      reviewStatus: r.caseReviewStatus || 'draft',
      curriculumScope: {
        curriculumReviewStatus: 'pending',
        grade: '',
        knowledgePoints: [],
      },
      sourceReferences: [],
      reviewedContentHash: null,
    } as never)
  const gates = evaluateIndustrialFormalImportGates(r, industrialCase)
  return {
    candidateId: r.candidateId,
    caseCode: r.caseCode,
    categoryCode: r.categoryCode,
    qtype: r.candidate.qtype,
    difficulty: r.candidate.difficulty,
    generationSource: r.generationSource,
    developmentOnly: r.developmentOnly,
    reviewStatus: r.reviewStatus,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    formalPublishEligible: gates.ok,
    qualityOverall: r.qualityReport?.overallStatus || null,
    blockingCount: r.qualityReport?.blockingIssues?.length || 0,
    warningCount: r.qualityReport?.warnings?.length || 0,
    unknownCount: r.qualityReport?.unknownIssues?.length || 0,
    svgContentHash: r.svgContentHash,
  }
}

export function createIndustrialReviewRecord(
  input: CreateReviewFromGenerateInput,
  cwd = process.cwd(),
): IndustrialReviewRecord {
  const asset = persistImmutableIndustrialSvg(input.svg, cwd)
  const audit = computeAuditContentHash({
    industrialCase: input.industrialCase,
    candidate: input.candidate,
    definition: input.definition,
    publicDiagram: input.publicDiagram,
  })
  const now = new Date().toISOString()
  const record: IndustrialReviewRecord = {
    candidateId: `cand_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    generationTaskId: input.generationTaskId,
    generationSource: input.generationSource,
    developmentOnly: input.developmentOnly,
    specialtyCode: input.specialtyCode,
    categoryCode: input.categoryCode,
    caseCode: input.industrialCase.caseCode,
    caseVersion: input.industrialCase.version,
    caseContentHash: input.industrialCase.contentHash,
    caseReviewStatus: input.industrialCase.reviewStatus,
    reviewStatus: input.qualityReport
      ? 'quality_checked'
      : 'pending_quality_review',
    candidate: input.candidate,
    definition: input.definition,
    publicDiagram: input.publicDiagram,
    // 与不可变落盘字节一致（含规范化换行），避免哈希与内容漂移
    svg: readFileUtf8Or(input.svg, asset.absolutePath),
    svgContentHash: asset.contentHash,
    svgRelativePath: asset.relativePath,
    renderReport: input.renderReport,
    qualityReport: input.qualityReport || null,
    auditContentHash: audit,
    humanDecision: null,
    humanReviewNote: null,
    humanReviewedBy: null,
    humanReviewedAt: null,
    humanReviewedAuditHash: null,
    importedItemCode: null,
    importedAt: null,
    createdAt: now,
    updatedAt: now,
    revision: 1,
  }
  if (record.qualityReport) {
    record.reviewStatus = 'pending_human_review'
  }
  saveIndustrialReviewRecord(record, cwd)
  return record
}

/** batchId 仅作筛选键；禁止路径分隔符与异常字符 */
export function normalizeIndustrialListBatchId(
  raw: unknown,
): { ok: true; batchId: string | undefined } | { ok: false; error: string } {
  if (raw == null || raw === '') return { ok: true, batchId: undefined }
  if (typeof raw !== 'string') {
    return { ok: false, error: 'BATCH_ID_INVALID_TYPE' }
  }
  const trimmed = raw.trim()
  if (!trimmed) return { ok: true, batchId: undefined }
  if (trimmed.length > 80) return { ok: false, error: 'BATCH_ID_TOO_LONG' }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { ok: false, error: 'BATCH_ID_INVALID_CHARS' }
  }
  return { ok: true, batchId: trimmed }
}

export function listIndustrialReviews(filters: {
  status?: string
  categoryCode?: string
  qtype?: string
  batchId?: string
} = {}, cwd = process.cwd()): IndustrialReviewListItem[] {
  const batchNorm = normalizeIndustrialListBatchId(filters.batchId)
  if (!batchNorm.ok) {
    throw new Error(batchNorm.error)
  }
  let rows = listIndustrialReviewRecords(cwd)
  if (filters.status) rows = rows.filter((r) => r.reviewStatus === filters.status)
  if (filters.categoryCode) {
    rows = rows.filter((r) => r.categoryCode === filters.categoryCode)
  }
  if (filters.qtype) {
    rows = rows.filter((r) => r.candidate?.qtype === filters.qtype)
  }
  if (batchNorm.batchId) {
    const bid = batchNorm.batchId
    rows = rows.filter((r) => {
      const extra = r as Record<string, unknown>
      return (
        extra.e1BatchId === bid ||
        extra.acceptanceBatchId === bid ||
        String(r.generationTaskId || '').startsWith(bid)
      )
    })
  }
  return rows
    .map(toListItem)
    .filter((x): x is IndustrialReviewListItem => x != null)
}

export function getIndustrialReview(
  candidateId: string,
  cwd = process.cwd(),
): IndustrialReviewRecord | null {
  return loadIndustrialReviewRecord(candidateId, cwd)
}

/** 详情 + 管理员审核材料包 */
export function getIndustrialReviewAdminDetail(
  candidateId: string,
  cwd = process.cwd(),
): Record<string, unknown> | null {
  const record = loadIndustrialReviewRecord(candidateId, cwd)
  if (!record) return null
  return {
    ...record,
    adminReviewPacket: buildIndustrialAdminReviewPacket(record, cwd),
  }
}

/**
 * 案例审核覆盖层写入后：使引用该 case 的候选质检/人审失效（须重质检）。
 * 不改 fixture；不自动批准候选。
 */
export function invalidateCandidatesAfterCaseReview(
  caseCode: string,
  cwd = process.cwd(),
): { invalidated: string[]; count: number } {
  const invalidated: string[] = []
  for (const r of listIndustrialReviewRecords(cwd)) {
    if (r.caseCode !== caseCode) continue
    if (r.importedItemCode) continue
    r.qualityReport = null
    r.humanDecision = null
    r.humanReviewedAt = null
    r.humanReviewedBy = null
    r.humanReviewedAuditHash = null
    r.humanReviewNote = null
    if (
      r.reviewStatus === 'approved_for_import' ||
      r.reviewStatus === 'pending_human_review' ||
      r.reviewStatus === 'quality_checked'
    ) {
      r.reviewStatus = 'needs_revision'
    }
    ;(r as Record<string, unknown>).caseReviewInvalidatedAt =
      new Date().toISOString()
    r.updatedAt = new Date().toISOString()
    r.revision += 1
    saveIndustrialReviewRecord(r, cwd)
    invalidated.push(r.candidateId)
  }
  return { invalidated, count: invalidated.length }
}

export function recordIndustrialCaseReviewForAdmin(input: {
  caseCode: string
  contentHashAtReview: string
  decision: IndustrialCaseReviewDecision
  note: string
  sourceNotes?: Array<{
    sourceTitle: string
    outcome:
      | 'verified_by_admin'
      | 'cannot_verify'
      | 'needs_revision'
      | 'not_applicable'
    evidenceNote: string
  }>
  reviewedBy: string
  expectedPriorContentHash?: string | null
  cwd?: string
}) {
  const cwd = input.cwd || process.cwd()
  const industrialCase = findCase(input.caseCode)
  if (!industrialCase) throw new Error('CASE_NOT_FOUND')
  if (input.contentHashAtReview !== industrialCase.contentHash) {
    throw new Error(
      `CASE_HASH_MISMATCH: expected ${industrialCase.contentHash.slice(0, 12)}…`,
    )
  }
  // approve_for_publish 须覆盖案例全部来源标题
  if (input.decision === 'approve_for_publish') {
    const notes = input.sourceNotes || []
    const titles = new Set(notes.map((n) => n.sourceTitle))
    for (const s of industrialCase.sourceReferences) {
      if (!titles.has(s.sourceTitle)) {
        throw new Error(
          `CASE_APPROVE_SOURCE_COVERAGE: missing note for ${s.sourceTitle}`,
        )
      }
    }
  }
  const overlay = recordIndustrialCaseReview({
    caseCode: input.caseCode,
    contentHashAtReview: input.contentHashAtReview,
    decision: input.decision,
    note: input.note,
    sourceNotes: input.sourceNotes || [],
    reviewedBy: input.reviewedBy,
    expectedPriorContentHash: input.expectedPriorContentHash,
    cwd,
  })
  const invalidated = invalidateCandidatesAfterCaseReview(input.caseCode, cwd)
  const effective = resolveIndustrialCaseEffectiveReview(
    industrialCase,
    cwd,
    overlay,
  )
  return {
    overlay,
    effective,
    fixtureUnchanged: {
      reviewStatus: industrialCase.reviewStatus,
      elevatesFixtureToPublished: false as const,
    },
    candidatesInvalidated: invalidated,
  }
}

export async function recheckIndustrialReviewQuality(
  candidateId: string,
  cwd = process.cwd(),
): Promise<IndustrialReviewRecord> {
  const record = loadIndustrialReviewRecord(candidateId, cwd)
  if (!record) throw new Error('CANDIDATE_NOT_FOUND')
  const industrialCase = findCase(record.caseCode)
  if (!industrialCase) throw new Error('CASE_NOT_FOUND')

  const report = await checkIndustrialCandidateQuality(
    {
      candidateId: record.candidateId,
      developmentOnly: record.developmentOnly,
      categoryCode: record.categoryCode,
      industrialCase,
      candidate: record.candidate,
      definition: record.definition,
      publicDiagram: record.publicDiagram,
      svg: record.svg,
      renderReport: record.renderReport,
    },
    {
      enableAiReview: true,
      useMockAiReviewer: true,
      writeReport: false,
      cwd,
    },
  )

  record.qualityReport = report
  record.auditContentHash = report.auditContentHash
  record.reviewStatus = 'pending_human_review'
  // 质检刷新使人工审核失效
  record.humanDecision = null
  record.humanReviewedAt = null
  record.humanReviewedBy = null
  record.humanReviewedAuditHash = null
  record.humanReviewNote = null
  record.updatedAt = new Date().toISOString()
  record.revision += 1
  saveIndustrialReviewRecord(record, cwd)
  return record
}

export async function patchIndustrialReview(
  candidateId: string,
  patch: IndustrialReviewPatchInput,
  cwd = process.cwd(),
): Promise<IndustrialReviewRecord> {
  const record = loadIndustrialReviewRecord(candidateId, cwd)
  if (!record) throw new Error('CANDIDATE_NOT_FOUND')
  if (patch.expectedRevision !== record.revision) {
    throw new Error(`REVISION_CONFLICT: expected ${record.revision}`)
  }
  const industrialCase = findCase(record.caseCode)
  if (!industrialCase) throw new Error('CASE_NOT_FOUND')

  if (patch.stem != null) record.candidate.stem = patch.stem
  if (patch.options !== undefined) record.candidate.options = patch.options
  if (patch.answer !== undefined) record.candidate.answer = patch.answer
  if (patch.explanation != null) record.candidate.explanation = patch.explanation
  if (patch.knowledgePoints) record.candidate.knowledgePoints = patch.knowledgePoints
  if (patch.difficulty) record.candidate.difficulty = patch.difficulty

  if (patch.definition) {
    const defVal = validateIndustrialDiagramDefinition(patch.definition)
    if (!defVal.valid) {
      throw new Error(`DEFINITION_INVALID: ${defVal.errors.map((e) => e.code).join(',')}`)
    }
    const against = validateIndustrialDiagramAgainstCase(patch.definition, industrialCase)
    if (!against.valid) {
      throw new Error(`DEFINITION_CASE: ${against.errors.map((e) => e.code).join(',')}`)
    }
    record.definition = patch.definition
    record.publicDiagram = projectIndustrialDiagramPublic(patch.definition)
    const rendered = renderIndustrialDiagramSvg(record.publicDiagram)
    if (!rendered.renderReport.valid) {
      throw new Error(`SVG_INVALID: ${rendered.renderReport.errors.join(',')}`)
    }
    record.svg = rendered.svg
    record.renderReport = rendered.renderReport
    const asset = persistImmutableIndustrialSvg(rendered.svg, cwd)
    record.svgContentHash = asset.contentHash
    record.svgRelativePath = asset.relativePath
  }

  record.auditContentHash = computeAuditContentHash({
    industrialCase,
    candidate: record.candidate,
    definition: record.definition,
    publicDiagram: record.publicDiagram,
  })
  // 语义变更：审核与质检失效
  record.qualityReport = null
  record.humanDecision = null
  record.humanReviewedAt = null
  record.humanReviewedBy = null
  record.humanReviewedAuditHash = null
  record.humanReviewNote = null
  record.reviewStatus = 'needs_revision'
  record.updatedAt = new Date().toISOString()
  record.revision += 1
  saveIndustrialReviewRecord(record, cwd)
  return record
}

const PUBLISH_FAIL_CODES = new Set(['CURR_CASE_TRUST', 'CHEM_SOURCE_VERIFIED'])

function appendReviewAudit(
  record: IndustrialReviewRecord,
  entry: Record<string, unknown>,
) {
  const extra = record as Record<string, unknown>
  const hist = Array.isArray(extra.reviewAuditHistory)
    ? (extra.reviewAuditHistory as Record<string, unknown>[])
    : []
  hist.push(entry)
  extra.reviewAuditHistory = hist.slice(-50)
}

/**
 * 人工审核状态机。
 * - reject / needs_revision：允许在质检失败时执行（管理员必须能退回）
 * - approve → approved_for_import：仅当内容质检无内容向 fail、案例可信、来源 verified、非 development_only
 * - 客户端不得传入 reviewerId / reviewedAt / reviewedContentHash（由服务端写入）
 */
export function humanReviewIndustrialCandidate(
  candidateId: string,
  input: {
    decision: IndustrialHumanDecision
    note?: string
    reviewerUserId: string
    expectedRevision: number
  },
  cwd = process.cwd(),
): IndustrialReviewRecord {
  const record = loadIndustrialReviewRecord(candidateId, cwd)
  if (!record) throw new Error('CANDIDATE_NOT_FOUND')
  if (input.expectedRevision !== record.revision) {
    throw new Error(`REVISION_CONFLICT: expected ${record.revision}`)
  }
  if (!record.qualityReport) {
    throw new Error('QUALITY_REQUIRED: 请先重新质检')
  }

  const industrialCase = findCase(record.caseCode)
  if (!industrialCase) throw new Error('CASE_NOT_FOUND')

  const now = new Date().toISOString()
  const stamp = {
    humanReviewedBy: input.reviewerUserId,
    humanReviewedAt: now,
    humanReviewedAuditHash: record.auditContentHash,
    humanReviewNote: input.note || null,
  }

  if (input.decision === 'reject' || input.decision === 'needs_revision') {
    record.humanDecision = input.decision
    Object.assign(record, stamp)
    record.reviewStatus =
      input.decision === 'reject' ? 'rejected' : 'needs_revision'
    appendReviewAudit(record, {
      at: now,
      action: input.decision,
      by: input.reviewerUserId,
      revision: record.revision,
      auditContentHash: record.auditContentHash,
      note: input.note || null,
    })
    record.updatedAt = now
    record.revision += 1
    saveIndustrialReviewRecord(record, cwd)
    return record
  }

  // approve
  const fails = (record.qualityReport.checks || []).filter((c) => c.status === 'fail')
  const contentFails = fails.filter((c) => !PUBLISH_FAIL_CODES.has(c.checkCode))
  if (contentFails.length) {
    throw new Error(
      `QUALITY_CONTENT_FAILED: 存在内容向质检失败，不得人工通过：${contentFails
        .map((c) => c.checkCode)
        .join(',')}`,
    )
  }

  if (record.developmentOnly) {
    record.humanDecision = 'approve'
    Object.assign(record, stamp)
    record.humanReviewNote =
      (input.note || '') + ' [blocked: development_only cannot approve_for_import]'
    record.reviewStatus = 'pending_human_review'
    appendReviewAudit(record, {
      at: now,
      action: 'approve_blocked_development_only',
      by: input.reviewerUserId,
      revision: record.revision,
      auditContentHash: record.auditContentHash,
    })
    record.updatedAt = now
    record.revision += 1
    saveIndustrialReviewRecord(record, cwd)
    return record
  }

  // 发布资格：读取有效案例投影（fixture 可为 draft；来源走 effective）
  const gatedCase = projectIndustrialCaseForPublishGates(industrialCase, cwd)
  const effective = resolveIndustrialCaseEffectiveReview(industrialCase, cwd)
  const gateBlockers: string[] = []
  if (record.qualityReport.overallStatus === 'failed_automatic_checks') {
    gateBlockers.push('QUALITY_FAILED_AUTOMATIC_CHECKS')
  }
  if (!record.qualityReport.formalPublishEligible) {
    gateBlockers.push('FORMAL_PUBLISH_ELIGIBLE_FALSE')
  }
  if (!['approved', 'published'].includes(gatedCase.reviewStatus)) {
    gateBlockers.push(`CASE_EFFECTIVE_STATUS:${gatedCase.reviewStatus}`)
  }
  const hasVerified =
    gatedCase.sourceReferences.some(
      (s) => s.verificationStatus === 'verified',
    ) || effective.effectiveSourceVerification === 'verified'
  if (!hasVerified) gateBlockers.push('SOURCE_UNVERIFIED_EFFECTIVE')
  if (
    !gatedCase.reviewedContentHash ||
    gatedCase.reviewedContentHash !== gatedCase.contentHash
  ) {
    gateBlockers.push('CASE_HASH_STALE_OR_MISSING_EFFECTIVE')
  }

  if (gateBlockers.length) {
    throw new Error(
      `APPROVE_FOR_IMPORT_BLOCKED: ${gateBlockers.join(' | ')}（请使用审核清单记录意见；不得强行 approved_for_import）`,
    )
  }

  record.humanDecision = 'approve'
  Object.assign(record, stamp)
  record.reviewStatus = 'approved_for_import'
  appendReviewAudit(record, {
    at: now,
    action: 'approve_for_import',
    by: input.reviewerUserId,
    revision: record.revision,
    auditContentHash: record.auditContentHash,
    note: input.note || null,
  })
  record.updatedAt = now
  record.revision += 1
  saveIndustrialReviewRecord(record, cwd)
  return record
}

/**
 * 管理员审核清单（来源/案例/KB/unknown）— 不升格 approved_for_import，不写 KB links。
 */
export function recordIndustrialAdminChecklist(
  candidateId: string,
  input: {
    expectedRevision: number
    reviewerUserId: string
    note?: string
    sourceOutcome:
      | 'verified_by_admin'
      | 'cannot_verify'
      | 'needs_revision'
      | 'not_applicable'
    caseOutcome:
      | 'acknowledge_draft'
      | 'request_changes'
      | 'sources_incomplete'
      | 'cannot_verify'
    kbPlanOk: boolean
    kbPlanNote?: string
    unknownAcknowledgedCheckIds: string[]
    apparatusNotes?: string
    flowNotes?: string
  },
  cwd = process.cwd(),
): IndustrialReviewRecord {
  const record = loadIndustrialReviewRecord(candidateId, cwd)
  if (!record) throw new Error('CANDIDATE_NOT_FOUND')
  if (input.expectedRevision !== record.revision) {
    throw new Error(`REVISION_CONFLICT: expected ${record.revision}`)
  }
  const industrialCase = findCase(record.caseCode)
  if (!industrialCase) throw new Error('CASE_NOT_FOUND')

  const now = new Date().toISOString()
  const checklist = {
    recordedAt: now,
    recordedBy: input.reviewerUserId,
    auditContentHash: record.auditContentHash,
    caseContentHash: industrialCase.contentHash,
    flowSvgContentHash: record.svgContentHash,
    apparatusSvgContentHash: record.apparatusSvgContentHash || null,
    note: input.note || null,
    sourceOutcome: input.sourceOutcome,
    caseOutcome: input.caseOutcome,
    kbPlanOk: input.kbPlanOk,
    kbPlanNote: input.kbPlanNote || null,
    kbLinksWritten: false,
    unknownAcknowledgedCheckIds: input.unknownAcknowledgedCheckIds || [],
    apparatusNotes: input.apparatusNotes || null,
    flowNotes: input.flowNotes || null,
    elevatesToApprovedForImport: false,
    elevatesCaseToPublished: false,
  }
  const extra = record as Record<string, unknown>
  const hist = Array.isArray(extra.adminChecklistHistory)
    ? (extra.adminChecklistHistory as unknown[])
    : []
  hist.push(checklist)
  extra.adminChecklist = checklist
  extra.adminChecklistHistory = hist.slice(-30)
  appendReviewAudit(record, {
    at: now,
    action: 'admin_checklist',
    by: input.reviewerUserId,
    revision: record.revision,
    auditContentHash: record.auditContentHash,
    sourceOutcome: input.sourceOutcome,
    caseOutcome: input.caseOutcome,
  })
  // 清单记录不改变人审终态；保持 pending（除非已 reject）
  if (
    record.reviewStatus === 'generated' ||
    record.reviewStatus === 'quality_checked' ||
    record.reviewStatus === 'pending_quality_review'
  ) {
    record.reviewStatus = 'pending_human_review'
  }
  record.updatedAt = now
  record.revision += 1
  saveIndustrialReviewRecord(record, cwd)
  return record
}

/**
 * 若审核记录含装置 SVG 但尚未不可变落盘，先落盘再入库。
 * 同步刷新审计哈希（含装置 contentHash）。
 */
export function ensureApparatusSvgPersisted(
  record: IndustrialReviewRecord,
  cwd = process.cwd(),
): IndustrialReviewRecord {
  if (!record.apparatusSvg) return record
  if (record.apparatusSvgRelativePath && record.apparatusSvgContentHash) {
    return record
  }
  const asset = persistImmutableIndustrialSvg(record.apparatusSvg, cwd)
  record.apparatusSvg = readFileUtf8Or(record.apparatusSvg, asset.absolutePath)
  record.apparatusSvgContentHash = asset.contentHash
  record.apparatusSvgRelativePath = asset.relativePath
  const industrialCase = findCase(record.caseCode)
  if (industrialCase) {
    record.auditContentHash = computeAuditContentHash({
      industrialCase,
      candidate: record.candidate,
      definition: record.definition,
      publicDiagram: record.publicDiagram,
      apparatusContentHash: record.apparatusDefinition?.apparatusContentHash || null,
      apparatusPublicContentHash: record.apparatusPublic?.publicContentHash || null,
    })
  }
  record.updatedAt = new Date().toISOString()
  saveIndustrialReviewRecord(record, cwd)
  return record
}

export async function attemptFormalImport(
  candidateId: string,
  opts: {
    dryRun?: boolean
    reviewerUserId: string
    dbWriter?: (
      payload: IndustrialFormalImportDbPayload,
    ) => Promise<IndustrialFormalImportDbWriteResult>
  } = { dryRun: true, reviewerUserId: '0' },
  cwd = process.cwd(),
) {
  let record = loadIndustrialReviewRecord(candidateId, cwd)
  if (!record) throw new Error('CANDIDATE_NOT_FOUND')
  record = ensureApparatusSvgPersisted(record, cwd)
  const industrialCase = findCase(record.caseCode)
  if (!industrialCase) throw new Error('CASE_NOT_FOUND')
  const result = await formalImportIndustrialCandidate(record, industrialCase, {
    dryRun: opts.dryRun !== false,
    reviewerUserId: opts.reviewerUserId,
    dbWriter: opts.dbWriter,
    cwd,
  })
  if (result.ok && !result.dryRun && result.itemCode) {
    record.importedItemCode = result.itemCode
    record.importedAt = new Date().toISOString()
    record.reviewStatus = 'imported'
    record.updatedAt = new Date().toISOString()
    record.revision += 1
    saveIndustrialReviewRecord(record, cwd)
  }
  return result
}
