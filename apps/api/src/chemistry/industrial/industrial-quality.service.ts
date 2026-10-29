import { randomUUID } from 'crypto'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { validateIndustrialCase } from './industrial-case.validate'
import {
  projectIndustrialCaseForPublishGates,
  resolveIndustrialCaseEffectiveReview,
} from './industrial-case-effective-review'
import { INDUSTRIAL_QUALITY_VERSION } from './industrial-quality.constants'
import {
  computeAuditContentHash,
  computeQuestionContentHash,
} from './industrial-quality.hash'
import {
  aggregateOverallStatus,
  collectBlockingIssues,
  collectUnknownIssues,
  collectWarnings,
  computeFormalPublishEligible,
  summarizeChecks,
} from './industrial-quality.rules'
import { checkCurriculumDimension } from './industrial-quality.curriculum'
import { checkChemistryDimension } from './industrial-quality.chemistry'
import { checkProcessDimension } from './industrial-quality.process'
import { checkDiagramDimension } from './industrial-quality.diagram'
import { checkConsistencyDimension } from './industrial-quality.consistency'
import { checkTeachingDimension } from './industrial-quality.teaching'
import { checkApparatusQualityDimension } from './industrial-quality.apparatus'
import { runIndustrialAiQualityReview } from './industrial-quality.ai-reviewer'
import type {
  IndustrialQualityCandidateBundle,
  IndustrialQualityCheckOptions,
  IndustrialQualityReport,
} from './industrial-quality.types'

/**
 * 工业实验候选联合质量检查。
 * 确定性优先；AI 辅助可选；不写正式题库；不改案例审核态。
 */
export async function checkIndustrialCandidateQuality(
  bundle: IndustrialQualityCandidateBundle,
  options: IndustrialQualityCheckOptions = {},
): Promise<IndustrialQualityReport> {
  const started = Date.now()
  // E2-B2：质检读取「有效案例审核态」投影（不改 fixture；来源/课程走 effective 字段）
  const effectiveCaseReview = resolveIndustrialCaseEffectiveReview(
    bundle.industrialCase,
    options.cwd,
  )
  const gatedCase = projectIndustrialCaseForPublishGates(
    bundle.industrialCase,
    options.cwd,
  )
  const gatedBundle: IndustrialQualityCandidateBundle = {
    ...bundle,
    industrialCase: gatedCase,
    effectiveCaseReview,
  }
  const checks = [
    ...checkCurriculumDimension(gatedBundle),
    ...checkChemistryDimension(gatedBundle),
    ...checkProcessDimension(gatedBundle),
    ...checkDiagramDimension(gatedBundle),
    ...checkConsistencyDimension(gatedBundle),
    ...checkTeachingDimension(gatedBundle),
    ...(gatedBundle.apparatusDefinition
      ? checkApparatusQualityDimension({
          apparatus: gatedBundle.apparatusDefinition,
          stem: gatedBundle.candidate.stem,
          explanation: gatedBundle.candidate.explanation,
        })
      : []),
  ]

  let aiReviewStatus: IndustrialQualityReport['aiReviewStatus'] = 'not_executed'
  let aiReviewProvider: string | null = null
  const aiReviewNotes: string[] = []

  if (options.enableAiReview !== false) {
    const ai = await runIndustrialAiQualityReview(gatedBundle, {
      useMock: options.useMockAiReviewer !== false,
    })
    aiReviewStatus = ai.status
    aiReviewProvider = ai.provider
    aiReviewNotes.push(...ai.notes)
    // 辅助检查追加；AI 不得覆盖程序 fail（聚合时 fail 优先）
    checks.push(...ai.auxiliaryChecks)
  } else {
    aiReviewNotes.push('AI review disabled by options')
  }

  const overallStatus = aggregateOverallStatus(checks)
  const summary = summarizeChecks(checks)
  // 正式资格：以有效案例投影为准；报告哈希仍绑定真实 fixture contentHash
  const caseVal = validateIndustrialCase(gatedCase)
  const caseTrusted =
    caseVal.publishEligible &&
    ['approved', 'published'].includes(gatedCase.reviewStatus) &&
    gatedCase.curriculumScope.curriculumReviewStatus === 'approved'

  const questionContentHash = computeQuestionContentHash(gatedBundle.candidate)
  const auditContentHash = computeAuditContentHash({
    industrialCase: gatedCase,
    candidate: gatedBundle.candidate,
    definition: gatedBundle.definition,
    publicDiagram: gatedBundle.publicDiagram,
  })

  const report: IndustrialQualityReport = {
    reportId: `qr_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    candidateId: gatedBundle.candidateId,
    caseCode: gatedBundle.industrialCase.caseCode,
    caseVersion: gatedBundle.industrialCase.version,
    caseContentHash: bundle.industrialCase.contentHash,
    diagramVersion: bundle.definition.diagramVersion,
    diagramContentHash: bundle.definition.diagramContentHash,
    publicContentHash: bundle.publicDiagram.publicContentHash,
    questionContentHash,
    auditContentHash,
    qualityVersion: INDUSTRIAL_QUALITY_VERSION,
    generatedAt: new Date().toISOString(),
    checks,
    summary,
    blockingIssues: collectBlockingIssues(checks),
    warnings: collectWarnings(checks),
    unknownIssues: collectUnknownIssues(checks),
    overallStatus,
    requiresHumanReview: true,
    developmentOnly: bundle.developmentOnly,
    formalPublishEligible: computeFormalPublishEligible({
      overallStatus,
      developmentOnly: bundle.developmentOnly,
      caseTrusted,
      hasCriticalOrErrorFail:
        summary.criticalFail > 0 || summary.errorFail > 0,
    }),
    aiReviewStatus,
    aiReviewProvider,
    aiReviewNotes,
  }

  const elapsed = Date.now() - started
  if (options.maxDurationMs && elapsed > options.maxDurationMs) {
    report.warnings.push(`QUALITY_SLOW: took ${elapsed}ms`)
  }

  if (options.writeReport && options.outputDir) {
    mkdirSync(options.outputDir, { recursive: true })
    writeFileSync(
      join(options.outputDir, 'quality-report.json'),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    )
  }

  return report
}
