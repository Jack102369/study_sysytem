/**

 * PHASE_E2-B / E2-B2：管理员集中审核材料包（只读聚合；不写 formal / 不冒充人审通过）。

 */

import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'

import {

  projectIndustrialCaseForPublishGates,

  resolveIndustrialCaseEffectiveReview,

} from './industrial-case-effective-review'

import { validateIndustrialCase } from './industrial-case.validate'

import { evaluateIndustrialFormalImportGates } from './industrial-formal-import.service'

import { isIndustrialFormalRealPublishEnabled } from './industrial-formal-publish.config'

import { isIndustrialQualityReportCurrent } from './industrial-quality.hash'

import type { IndustrialReviewRecord } from './industrial-review.types'

import { loadIndustrialCaseReviewOverlay } from './industrial-case-review.store'
import { getIndustrialScientificEvidenceHelpers } from './industrial-scientific-evidence-helpers'



const PUBLISH_FAIL_CODES = new Set(['CURR_CASE_TRUST', 'CHEM_SOURCE_VERIFIED'])



export function buildIndustrialAdminReviewPacket(

  record: IndustrialReviewRecord,

  cwd = process.cwd(),

): Record<string, unknown> {

  const industrialCase =

    ALL_CANDIDATE_CASES.find((c) => c.caseCode === record.caseCode) || null

  const caseOverlay = industrialCase

    ? loadIndustrialCaseReviewOverlay(industrialCase.caseCode, cwd)

    : null

  const effective = industrialCase

    ? resolveIndustrialCaseEffectiveReview(industrialCase, cwd, caseOverlay)

    : null

  const gatedCase = industrialCase

    ? projectIndustrialCaseForPublishGates(industrialCase, cwd)

    : null

  const caseValRaw = industrialCase

    ? validateIndustrialCase(industrialCase)

    : { ok: false, publishEligible: false, errors: ['CASE_NOT_FOUND'] }

  const caseValEffective = gatedCase

    ? validateIndustrialCase(gatedCase)

    : caseValRaw



  const checks = record.qualityReport?.checks || []

  const fails = checks.filter((c) => c.status === 'fail')

  const unknowns = checks.filter((c) => c.status === 'unknown')

  const qualityContentFails = fails.filter((c) => !PUBLISH_FAIL_CODES.has(c.checkCode))

  const publishFails = fails.filter((c) => PUBLISH_FAIL_CODES.has(c.checkCode))



  const qualityCurrent =

    !!record.qualityReport &&

    !!industrialCase &&

    isIndustrialQualityReportCurrent(record.qualityReport, {

      industrialCase,

      candidate: record.candidate,

      definition: record.definition,

      publicDiagram: record.publicDiagram,

    })



  const gates = industrialCase

    ? evaluateIndustrialFormalImportGates(record, industrialCase, { cwd })

    : {

        ok: false,

        blockers: ['CASE_NOT_FOUND'],

        warnings: [],

        mappedPreview: null,

      }



  const sourceRefs =

    industrialCase?.sourceReferences.map((s) => ({

      sourceType: s.sourceType,

      sourceTitle: s.sourceTitle,

      sourceIdentifier: s.sourceIdentifier,

      sourceDescription: s.sourceDescription,

      verificationStatus: s.verificationStatus,

      effectiveVerificationStatus:

        effective?.effectiveSourceVerification === 'verified'

          ? 'verified'

          : s.verificationStatus,

      risk:

        s.verificationStatus === 'verified' ||

        effective?.effectiveSourceVerification === 'verified'

          ? 'verified_still_needs_human_science_confirm'

          : 'SOURCE_VERIFICATION_INCOMPLETE',

    })) || []



  const kbPlan = ((record as Record<string, unknown>).kbBindingPlan as unknown[]) || []



  const formalBlockers = [

    ...gates.blockers,

    record.reviewStatus !== 'approved_for_import'

      ? `REVIEW_STATUS:${record.reviewStatus}`

      : null,

    (record as Record<string, unknown>).sourceVerificationStatus ===

    'SOURCE_VERIFICATION_INCOMPLETE' &&

    effective?.effectiveSourceVerification !== 'verified'

      ? 'SOURCE_VERIFICATION_INCOMPLETE'

      : null,

    industrialCase?.reviewStatus === 'draft' &&

    !effective?.grantsEffectivePublishEligibility

      ? 'CASE_RAW_DRAFT'

      : null,

    !caseValEffective.publishEligible ? 'CASE_NOT_PUBLISH_ELIGIBLE_EFFECTIVE' : null,

  ].filter(Boolean)



  const scientificEvidenceHelpers = getIndustrialScientificEvidenceHelpers(
    industrialCase?.caseCode,
  )

  const humanTodos = [

    '核对题干/选项/答案/解析',

    '核对流程图与题干一致',

    record.apparatusDefinition ? '核对装置图气路/端口/安全 unknown' : null,

    '核对案例 raw draft 与有效审核态（覆盖层 ≠ fixture published）',

    '核对 KB 计划是否合理（不写 links）',

    '确认 unknown 项是否可接受或须退回',

    scientificEvidenceHelpers?.sourceEvidenceStatus ===
    'SOURCE_EVIDENCE_INCOMPLETE'
      ? '科学证据不足（SOURCE_EVIDENCE_INCOMPLETE）：勿强行 approve_for_publish'
      : null,

    effective?.grantsEffectivePublishEligibility

      ? '案例有效审核已授予：候选须重新质检后再人审'

      : '先完成案例 approve_for_publish（含来源证据）',

  ].filter(Boolean)



  return {

    packetVersion: 'e2b6-1.0',

    reviewWorkflowSteps: [
      '1 科学来源核验（ACCESSED≠verified）',
      '2 工业案例有效审核（覆盖层）',
      '3 候选重新自动质检',
      '4 候选人工审核（通过≠入库）',
      '5 正式发布资格检查（real publish 默认 OFF）',
    ],

    scientificEvidenceHelpers,

    candidateId: record.candidateId,

    plannedItemCode: (record as Record<string, unknown>).plannedItemCode || null,

    e1BatchId: (record as Record<string, unknown>).e1BatchId || null,

    revision: record.revision,

    specialtyCode: record.specialtyCode,

    categoryCode: record.categoryCode,

    generationSource: record.generationSource,

    developmentOnly: record.developmentOnly,

    reviewStatus: record.reviewStatus,

    humanDecision: record.humanDecision,

    contentHashes: {

      auditContentHash: record.auditContentHash,

      questionContentHash: record.qualityReport?.questionContentHash || null,

      diagramContentHash: record.definition.diagramContentHash,

      publicContentHash: record.publicDiagram.publicContentHash,

      flowSvgContentHash: record.svgContentHash,

      apparatusSvgContentHash: record.apparatusSvgContentHash || null,

      apparatusContentHash: record.apparatusDefinition?.apparatusContentHash || null,

      caseContentHash: record.caseContentHash,

      humanReviewedAuditHash: record.humanReviewedAuditHash,

    },

    question: {

      qtype: record.candidate.qtype,

      difficulty: record.candidate.difficulty,

      stem: record.candidate.stem,

      options: record.candidate.options,

      answer: record.candidate.answer,

      explanation: record.candidate.explanation,

      knowledgePoints: record.candidate.knowledgePoints,

    },

    case: industrialCase

      ? {

          caseCode: industrialCase.caseCode,

          title: industrialCase.title,

          description: industrialCase.description,

          caseType: industrialCase.caseType,

          reviewStatus: industrialCase.reviewStatus,

          rawReviewStatus: industrialCase.reviewStatus,

          version: industrialCase.version,

          contentHash: industrialCase.contentHash,

          reviewedContentHash: industrialCase.reviewedContentHash,

          publishEligible: caseValRaw.publishEligible,

          curriculumReviewStatus:

            industrialCase.curriculumScope.curriculumReviewStatus,

          gradeScope: industrialCase.gradeScope,

          categoryCodes: industrialCase.categoryCodes,

          openIssues: industrialCase.openIssues,

          sourceReferences: sourceRefs,

          overlay: caseOverlay,

          effectiveReview: effective,

          fixtureStillDraft: industrialCase.reviewStatus === 'draft',

        }

      : { caseCode: record.caseCode, missing: true },

    sourceVerificationStatus:

      effective?.effectiveSourceVerification === 'verified'

        ? 'SOURCE_EFFECTIVE_VERIFIED'

        : (record as Record<string, unknown>).sourceVerificationStatus ||

          'SOURCE_VERIFICATION_INCOMPLETE',

    sourceBasis: (record as Record<string, unknown>).sourceBasis || [],

    sourceVerificationNote:

      (record as Record<string, unknown>).sourceVerificationNote || null,

    kbBindingPlan: kbPlan,

    kbLinksInDb: 'NOT_BOUND',

    diagrams: {

      flow: {

        present: !!record.svg,

        title: record.definition.title,

        nodeCount: record.definition.nodes.length,

        edgeCount: record.definition.edges.length,

        schematicNote: record.definition.reviewMetadata?.structureOnly

          ? '结构/教学示意；非工程施工图'

          : null,

      },

      apparatus: record.apparatusDefinition

        ? {

            present: true,

            title: record.apparatusDefinition.title,

            schematicDisclaimer:

              record.apparatusDefinition.schematicDisclaimer ||

              '教学示意装置图（schematic），非工程施工图',

            componentCount: record.apparatusDefinition.components.length,

            connectionCount: record.apparatusDefinition.connections.length,

            components: record.apparatusDefinition.components.map((c) => ({

              componentId: c.componentId,

              componentType: c.componentType,

              displayLabel: c.displayLabel,

              ports: c.ports,

            })),

            connections: record.apparatusDefinition.connections,

            safety: record.apparatusSafety || null,

          }

        : { present: false },

    },

    quality: {

      overallStatus: record.qualityReport?.overallStatus || null,

      qualityCurrent,

      requiresHumanReview: record.qualityReport?.requiresHumanReview ?? true,

      formalPublishEligible: record.qualityReport?.formalPublishEligible ?? false,

      blockingIssues: record.qualityReport?.blockingIssues || [],

      unknownIssues: record.qualityReport?.unknownIssues || [],

      qualityContentFails: qualityContentFails.map(summarizeCheck),

      publishEligibilityFails: publishFails.map(summarizeCheck),

      unknownChecks: unknowns.map(summarizeCheck),

      failChecks: fails.map(summarizeCheck),

      caseReviewInvalidatedAt:

        (record as Record<string, unknown>).caseReviewInvalidatedAt || null,

    },

    e2aBlockerClassification:

      (record as Record<string, unknown>).e2aBlockerClassification || null,

    readyForHumanReview:

      (record as Record<string, unknown>).readyForHumanReview === true,

    readyForFormalImport: false,

    formalImportBlockers: [...new Set(formalBlockers as string[])],

    humanTodos,

    adminChecklist:

      (record as Record<string, unknown>).adminChecklist || null,

    adminChecklistHistory:

      (record as Record<string, unknown>).adminChecklistHistory || [],

    realPublish: {

      envEnabled: isIndustrialFormalRealPublishEnabled(),

      defaultDryRun: true,

      note: 'E2-B2 prepares path; do not enable INDUSTRIAL_FORMAL_REAL_PUBLISH in this phase',

    },

    workflowFlags: {

      REVIEW_WORKFLOW_READY: true,

      CASE_EFFECTIVE_PUBLISH_ELIGIBLE:

        effective?.grantsEffectivePublishEligibility === true,

      HUMAN_REVIEW_COMPLETED:

        record.humanDecision === 'approve' &&

        record.reviewStatus === 'approved_for_import',

      HUMAN_REVIEW_NOT_EXECUTED:

        record.humanDecision == null &&

        (record.reviewStatus === 'pending_human_review' ||

          record.reviewStatus === 'needs_revision'),

      CASE_STILL_DRAFT_FIXTURE: industrialCase?.reviewStatus === 'draft',

      SOURCE_STILL_INCOMPLETE:

        effective?.effectiveSourceVerification !== 'verified',

      FORMAL_IMPORT_EXECUTED: !!record.importedItemCode,

      REAL_PUBLISH_ENV_OFF: !isIndustrialFormalRealPublishEnabled(),

    },

  }

}



function summarizeCheck(c: {

  checkCode: string

  dimension: string

  status: string

  severity: string

  message: string

  evidence?: string[]

}) {

  return {

    checkId: c.checkCode,

    dimension: c.dimension,

    status: c.status,

    severity: c.severity,

    message: c.message,

    evidence: c.evidence || [],

  }

}


