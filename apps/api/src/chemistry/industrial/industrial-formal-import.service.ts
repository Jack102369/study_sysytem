import { createHash } from 'crypto'
import { validateIndustrialCase } from './industrial-case.validate'
import { isIndustrialQualityReportCurrent } from './industrial-quality.hash'
import type { IndustrialReviewRecord } from './industrial-review.types'
import type {
  IndustrialFormalImportGateResult,
  IndustrialFormalImportResult,
} from './industrial-review.types'
import type { IndustrialCase } from './industrial-case.types'
import {
  projectIndustrialCaseForPublishGates,
  resolveIndustrialCaseEffectiveReview,
} from './industrial-case-effective-review'
import { DEFAULT_INDUSTRIAL_FLOW_ASSET } from './industrial-asset.constants'
import { DEFAULT_INDUSTRIAL_APPARATUS_ASSET } from './industrial-apparatus.constants'
import { INDUSTRIAL_APPARATUS_SVG_RENDERER_VERSION } from './industrial-apparatus-svg-renderer'
import { validateIndustrialSvgForImmutableStorage } from './industrial-svg-security'
import { INDUSTRIAL_SVG_RENDERER_VERSION } from './industrial-svg-types'

/**
 * formalAllowed 在 train-items-admin 中硬编码 false：
 * 保护 AI 试运行题目不得进入「正式训练」叙事。
 * 工业正式入库是独立闸门服务，不得通过把 formalAllowed 改 true 绕过。
 */
export const FORMAL_ALLOWED_DESIGN_NOTE =
  'train-items-admin.formalAllowed=false is AI-trial UI/API safety; industrial import uses independent gates and still respects curriculum_ok/verify_blocked/ban_default_train/pool.'

/** 单条 D043 资产规格（主图字段或 additionalAssets 条目） */
export type IndustrialFormalImportAssetSpec = {
  svgContentHash: string
  svgRelativePath: string
  svgFileSize: number
  diagramVersion: string
  assetType: string
  assetRole: string
  sortOrder: number
  mimeType: string
}

export type IndustrialFormalImportDbPayload = {
  code: string
  stem: string
  answer: string
  analysis: string | null
  qtype: string
  difficulty: number
  answerType: string
  optionsJson: unknown | null
  specialtyCode: string
  categoryCode: string
  pool: 'test' | 'formal'
  status: 'draft' | 'approved'
  curriculumOk: boolean
  verifyBlocked: boolean
  banDefaultTrain: boolean
  gateNote: string
  reviewedBy: string | null
  /** 主图（通常 industrial_flow_svg）；兼容旧单资产路径 */
  svgContentHash: string
  svgRelativePath: string
  svgFileSize: number
  diagramVersion: string
  assetType: string
  assetRole: string
  sortOrder: number
  mimeType: string
  /** 副图（通常 industrial_apparatus_svg）；可空 */
  additionalAssets: IndustrialFormalImportAssetSpec[]
  candidateId: string
  idempotencyKey: string
}

export type IndustrialFormalImportDbWriteResult = {
  id: string
  code: string
  assetId: string
  assetIds: string[]
  reusedExisting: boolean
}

/**
 * 正式入库闸门评估。
 * D043-APPROVED 后已移除 SVG_DB_BINDING_PROPOSED；其余闸门全部保留。
 */
export function evaluateIndustrialFormalImportGates(
  record: IndustrialReviewRecord,
  industrialCase: IndustrialCase,
  opts?: { cwd?: string },
): IndustrialFormalImportGateResult {
  const blockers: string[] = []
  const warnings: string[] = []
  // E2-B2：闸门读取有效案例投影（fixture 仍可为 draft；来源/课程走 effective）
  const rawCase = industrialCase
  const effective = resolveIndustrialCaseEffectiveReview(rawCase, opts?.cwd)
  industrialCase = projectIndustrialCaseForPublishGates(rawCase, opts?.cwd)
  const effectiveOk =
    effective.grantsEffectivePublishEligibility && effective.publishEligible

  if (record.developmentOnly) {
    blockers.push('DEVELOPMENT_ONLY: 开发候选禁止正式入库')
  }
  if (record.generationSource === 'mock_generated') {
    blockers.push('MOCK_GENERATED: Mock 产物不得冒充真实 AI 正式题')
  }
  // manual_fixture：允许进入闸门后续检查，但≠已人审/已入库；仍须 human approve + 案例可信等
  if (record.reviewStatus === 'imported' && record.importedItemCode) {
    // 已入库：闸门层面允许，由 writer 幂等返回
  } else if (record.reviewStatus !== 'approved_for_import') {
    blockers.push(`REVIEW_STATUS: 当前状态 ${record.reviewStatus} 非 approved_for_import`)
  }
  if (!record.humanDecision || record.humanDecision !== 'approve') {
    blockers.push('HUMAN_REVIEW: 缺少人工审核通过')
  }
  if (!record.qualityReport) {
    blockers.push('QUALITY_REPORT: 缺少质量报告')
  } else {
    if (!isIndustrialQualityReportCurrent(record.qualityReport, {
      industrialCase,
      candidate: record.candidate,
      definition: record.definition,
      publicDiagram: record.publicDiagram,
    })) {
      blockers.push('QUALITY_STALE: 质量报告与当前内容哈希不一致')
    }
    if (record.qualityReport.overallStatus === 'failed_automatic_checks') {
      blockers.push('QUALITY_FAILED: 自动质检失败')
    }
    if (record.qualityReport.blockingIssues.length) {
      blockers.push(
        ...record.qualityReport.blockingIssues.map((b) => `BLOCKING:${b}`),
      )
    }
    if (record.qualityReport.overallStatus === 'incomplete_verification') {
      blockers.push(
        'QUALITY_INCOMPLETE: 存在 unknown；关键化学/课程 unknown 未人工核验依据',
      )
    }
    if (
      record.humanReviewedAuditHash &&
      record.auditContentHash &&
      record.humanReviewedAuditHash !== record.auditContentHash
    ) {
      blockers.push('HUMAN_AUDIT_STALE: 人工审核哈希与当前内容不一致')
    }
  }

  const caseVal = validateIndustrialCase(industrialCase)
  if (!effectiveOk && !caseVal.publishEligible) {
    blockers.push('CASE_NOT_PUBLISH_ELIGIBLE: 案例未达发布门槛')
  }
  if (!['approved', 'published'].includes(industrialCase.reviewStatus)) {
    blockers.push(`CASE_REVIEW_STATUS: ${industrialCase.reviewStatus}`)
  }
  if (
    !effectiveOk &&
    industrialCase.curriculumScope.curriculumReviewStatus !== 'approved'
  ) {
    blockers.push('CURRICULUM_NOT_APPROVED')
  }
  const hasVerified = industrialCase.sourceReferences.some(
    (s) => s.verificationStatus === 'verified',
  )
  if (!hasVerified && effective.effectiveSourceVerification !== 'verified') {
    blockers.push('SOURCE_UNVERIFIED: 知识来源未 verified')
  }
  if (
    !industrialCase.reviewedContentHash ||
    industrialCase.reviewedContentHash !== industrialCase.contentHash
  ) {
    blockers.push('CASE_HASH_STALE: reviewedContentHash 不匹配')
  }

  if (!record.svgContentHash || !record.svgRelativePath) {
    blockers.push('SVG_MISSING')
  } else {
    const sec = validateIndustrialSvgForImmutableStorage(record.svg)
    if (!sec.ok) {
      blockers.push(...sec.errors.map((e) => `SVG_SECURITY:${e}`))
    }
  }

  // 双图：若声明了装置副图，必须已落盘且通过 SVG 安全；安全规则 blocking 禁止入库
  const hasApparatusHint =
    Boolean(record.apparatusSvg) ||
    Boolean(record.apparatusSvgContentHash) ||
    Boolean(record.apparatusDefinition)
  if (hasApparatusHint) {
    if (!record.apparatusSvgContentHash || !record.apparatusSvgRelativePath || !record.apparatusSvg) {
      blockers.push('APPARATUS_SVG_MISSING: 装置副图未落盘或缺少哈希/路径')
    } else {
      const aSec = validateIndustrialSvgForImmutableStorage(record.apparatusSvg)
      if (!aSec.ok) {
        blockers.push(...aSec.errors.map((e) => `APPARATUS_SVG_SECURITY:${e}`))
      }
    }
    if (record.apparatusSafety?.blocking?.length) {
      blockers.push(
        ...record.apparatusSafety.blocking.map((b) => `APPARATUS_SAFETY:${b}`),
      )
    }
  }

  const code = buildIndustrialItemCode(record)
  const gateNote = [
    '[source:industrial_experiment]',
    `[industrial_svg_hash:${record.svgContentHash}]`,
    record.apparatusSvgContentHash
      ? `[industrial_apparatus_svg_hash:${record.apparatusSvgContentHash}]`
      : null,
    `[industrial_candidate:${record.candidateId}]`,
    '[formalAllowed_ui:false_preserved]',
    '[d043:approved]',
    hasApparatusHint ? '[dual_asset:flow+apparatus]' : null,
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 255)

  const allGatesPass = blockers.length === 0
  return {
    ok: allGatesPass,
    blockers,
    warnings,
    mappedPreview: {
      code,
      pool: allGatesPass ? 'formal' : 'test',
      status: allGatesPass ? 'approved' : 'draft',
      curriculumOk: allGatesPass,
      verifyBlocked: !allGatesPass,
      banDefaultTrain: !allGatesPass,
      gateNote,
      svgContentHash: record.svgContentHash,
    },
  }
}

export function buildIndustrialItemCode(record: IndustrialReviewRecord): string {
  // 含 candidateId，保证一候选一 code（uk_chem_train_item_code 持久化幂等）
  const short = record.candidateId.replace(/^cand_/, '').slice(0, 20)
  return `train.ind.${short}`.slice(0, 64)
}

/**
 * 从审核记录提取装置副图资产规格。
 * 要求 apparatusSvg + contentHash + relativePath 均已就绪（调用方先落盘）。
 */
export function buildApparatusAdditionalAsset(
  record: IndustrialReviewRecord,
): IndustrialFormalImportAssetSpec | null {
  const svg = record.apparatusSvg
  const hash = record.apparatusSvgContentHash
  const rel = record.apparatusSvgRelativePath
  if (!svg || !hash || !rel) return null
  const fileSize = Buffer.byteLength(svg.endsWith('\n') ? svg : `${svg}\n`, 'utf8')
  return {
    svgContentHash: hash,
    svgRelativePath: rel,
    svgFileSize: fileSize,
    diagramVersion: INDUSTRIAL_APPARATUS_SVG_RENDERER_VERSION,
    assetType: DEFAULT_INDUSTRIAL_APPARATUS_ASSET.assetType,
    assetRole: DEFAULT_INDUSTRIAL_APPARATUS_ASSET.assetRole,
    sortOrder: DEFAULT_INDUSTRIAL_APPARATUS_ASSET.sortOrder,
    mimeType: DEFAULT_INDUSTRIAL_APPARATUS_ASSET.mimeType,
  }
}

export function buildFormalImportDbPayload(
  record: IndustrialReviewRecord,
  gates: IndustrialFormalImportGateResult,
  reviewerUserId?: string,
): IndustrialFormalImportDbPayload | null {
  if (!gates.ok || !gates.mappedPreview) return null
  const diagramVersion =
    record.renderReport?.metrics?.rendererVersion || INDUSTRIAL_SVG_RENDERER_VERSION
  const fileSize = Buffer.byteLength(
    record.svg.endsWith('\n') ? record.svg : `${record.svg}\n`,
    'utf8',
  )
  const additional: IndustrialFormalImportAssetSpec[] = []
  const apparatusAsset = buildApparatusAdditionalAsset(record)
  if (apparatusAsset) {
    // 装置哈希不得与主图相同（否则可能误把流程 SVG 标成装置类型）
    if (apparatusAsset.svgContentHash !== record.svgContentHash) {
      additional.push(apparatusAsset)
    }
  }
  return {
    code: gates.mappedPreview.code,
    stem: record.candidate.stem,
    answer: Array.isArray(record.candidate.answer)
      ? record.candidate.answer.join('|')
      : String(record.candidate.answer),
    analysis: record.candidate.explanation,
    qtype: record.candidate.qtype,
    difficulty: record.candidate.difficulty,
    answerType: 'text',
    optionsJson: record.candidate.options ?? null,
    specialtyCode: record.specialtyCode,
    categoryCode: record.categoryCode,
    pool: gates.mappedPreview.pool,
    status: gates.mappedPreview.status,
    curriculumOk: gates.mappedPreview.curriculumOk,
    verifyBlocked: gates.mappedPreview.verifyBlocked,
    banDefaultTrain: gates.mappedPreview.banDefaultTrain,
    gateNote: gates.mappedPreview.gateNote,
    reviewedBy: reviewerUserId || record.humanReviewedBy,
    svgContentHash: record.svgContentHash,
    svgRelativePath: record.svgRelativePath,
    svgFileSize: fileSize,
    diagramVersion,
    assetType: DEFAULT_INDUSTRIAL_FLOW_ASSET.assetType,
    assetRole: DEFAULT_INDUSTRIAL_FLOW_ASSET.assetRole,
    sortOrder: DEFAULT_INDUSTRIAL_FLOW_ASSET.sortOrder,
    mimeType: DEFAULT_INDUSTRIAL_FLOW_ASSET.mimeType,
    additionalAssets: additional,
    candidateId: record.candidateId,
    idempotencyKey: stableImportIdempotencyKey(record),
  }
}

/**
 * 正式入库：执行闸门；默认 dryRun。
 * 真实写库通过 dbWriter（Nest 事务服务）注入；禁止绕过闸门。
 */
export async function formalImportIndustrialCandidate(
  record: IndustrialReviewRecord,
  industrialCase: IndustrialCase,
  opts: {
    dryRun?: boolean
    reviewerUserId?: string
    cwd?: string
    /** 仅自检：注入假写入 */
    injectWriter?: (
      payload: IndustrialFormalImportDbPayload,
    ) => Promise<IndustrialFormalImportDbWriteResult>
    /** 生产路径：TypeORM 事务写入 */
    dbWriter?: (
      payload: IndustrialFormalImportDbPayload,
    ) => Promise<IndustrialFormalImportDbWriteResult>
  } = {},
): Promise<IndustrialFormalImportResult> {
  const dryRun = opts.dryRun !== false
  const gates = evaluateIndustrialFormalImportGates(record, industrialCase, {
    cwd: opts.cwd,
  })

  // 已入库幂等：即使其它字段变化，也优先返回已有正式题
  if (record.reviewStatus === 'imported' && record.importedItemCode) {
    return {
      ok: true,
      dryRun: false,
      gates: {
        ...gates,
        ok: true,
        blockers: [],
        mappedPreview: gates.mappedPreview,
      },
      itemCode: record.importedItemCode,
      itemId: null,
      message: 'IDEMPOTENT: already imported (review record)',
      reusedExisting: true,
    }
  }

  if (!gates.ok || !gates.mappedPreview) {
    return {
      ok: false,
      dryRun,
      gates,
      itemCode: null,
      itemId: null,
      message: gates.blockers.join('; '),
    }
  }

  const payload = buildFormalImportDbPayload(record, gates, opts.reviewerUserId)
  if (!payload) {
    return {
      ok: false,
      dryRun,
      gates,
      itemCode: null,
      itemId: null,
      message: 'MAPPING_FAILED',
    }
  }

  if (dryRun && !opts.injectWriter && !opts.dbWriter) {
    const dual = payload.additionalAssets.length > 0
    return {
      ok: true,
      dryRun: true,
      gates,
      itemCode: payload.code,
      itemId: null,
      message: dual
        ? 'dry-run mapping ok (D043 dual-asset: flow + apparatus)'
        : 'dry-run mapping ok (D043 asset bind ready)',
    }
  }

  const writer = opts.dbWriter || opts.injectWriter
  if (writer) {
    const written = await writer(payload)
    const dual = (written.assetIds?.length || 0) > 1 || payload.additionalAssets.length > 0
    return {
      ok: true,
      dryRun: false,
      gates,
      itemCode: written.code,
      itemId: written.id,
      assetId: written.assetId,
      assetIds: written.assetIds || [written.assetId],
      message: written.reusedExisting
        ? 'IDEMPOTENT: reused existing chem_train_items + asset(s)'
        : dual
          ? 'imported with dual chem_train_item_assets (flow + apparatus)'
          : 'imported with chem_train_item_assets bind',
      reusedExisting: written.reusedExisting,
    }
  }

  return {
    ok: false,
    dryRun,
    gates,
    itemCode: null,
    itemId: null,
    message: 'DB writer not wired (Nest IndustrialFormalImportDbService required for non-dryRun)',
  }
}

/** @deprecated D043 已批准；保留别名供旧自检兼容，行为等同正式闸门 */
export function evaluateGatesForTestFixture(
  record: IndustrialReviewRecord,
  industrialCase: IndustrialCase,
): IndustrialFormalImportGateResult {
  return evaluateIndustrialFormalImportGates(record, industrialCase)
}

export function stableImportIdempotencyKey(record: IndustrialReviewRecord): string {
  return createHash('sha256')
    .update(
      `${record.candidateId}|${record.auditContentHash}|${record.svgContentHash}|${record.apparatusSvgContentHash || ''}`,
      'utf8',
    )
    .digest('hex')
}
