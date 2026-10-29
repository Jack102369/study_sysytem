import { sha256Stable, stableStringify } from './industrial-case.hash'
import type { IndustrialAiCandidateQuestion } from './industrial-ai-generator.types'
import type { IndustrialCase } from './industrial-case.types'
import type {
  IndustrialDiagramDefinition,
  IndustrialDiagramPublic,
} from './industrial-diagram.types'
import type { IndustrialQualityReport } from './industrial-quality.types'

export function computeQuestionContentHash(
  q: IndustrialAiCandidateQuestion,
): string {
  return sha256Stable({
    stem: q.stem,
    options: q.options,
    answerType: q.answerType,
    answer: q.answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    qtype: q.qtype,
    knowledgePoints: [...q.knowledgePoints].sort(),
    referencedNodeIds: [...(q.referencedNodeIds || [])].sort(),
    referencedLabels: [...(q.referencedLabels || [])].sort(),
  })
}

export function computeAuditContentHash(input: {
  industrialCase: IndustrialCase
  candidate: IndustrialAiCandidateQuestion
  definition: IndustrialDiagramDefinition
  publicDiagram: IndustrialDiagramPublic
  svgRendererHint?: string
  /** 可选装置副图：纳入人审审计哈希，避免只审流程、装置漂移后仍可入库 */
  apparatusContentHash?: string | null
  apparatusPublicContentHash?: string | null
}): string {
  return sha256Stable({
    caseCode: input.industrialCase.caseCode,
    caseVersion: input.industrialCase.version,
    caseContentHash: input.industrialCase.contentHash,
    question: {
      stem: input.candidate.stem,
      options: input.candidate.options,
      answer: input.candidate.answer,
      explanation: input.candidate.explanation,
      qtype: input.candidate.qtype,
      difficulty: input.candidate.difficulty,
      knowledgePoints: [...input.candidate.knowledgePoints].sort(),
    },
    diagramContentHash: input.definition.diagramContentHash,
    publicContentHash: input.publicDiagram.publicContentHash,
    svgRendererHint: input.svgRendererHint || 'industrial-svg-1.0.0',
    apparatusContentHash: input.apparatusContentHash || null,
    apparatusPublicContentHash: input.apparatusPublicContentHash || null,
  })
}

/**
 * 判断历史质量报告是否仍对应当前候选语义内容。
 */
export function isIndustrialQualityReportCurrent(
  report: IndustrialQualityReport,
  current: {
    industrialCase: IndustrialCase
    candidate: IndustrialAiCandidateQuestion
    definition: IndustrialDiagramDefinition
    publicDiagram: IndustrialDiagramPublic
  },
): boolean {
  if (report.caseContentHash !== current.industrialCase.contentHash) return false
  if (report.caseVersion !== current.industrialCase.version) return false
  if (report.diagramContentHash !== current.definition.diagramContentHash) {
    return false
  }
  if (report.publicContentHash !== current.publicDiagram.publicContentHash) {
    return false
  }
  const qHash = computeQuestionContentHash(current.candidate)
  if (report.questionContentHash !== qHash) return false
  const audit = computeAuditContentHash({
    industrialCase: current.industrialCase,
    candidate: current.candidate,
    definition: current.definition,
    publicDiagram: current.publicDiagram,
  })
  return report.auditContentHash === audit
}

export function fingerprintForDebug(v: unknown): string {
  return stableStringify(v).slice(0, 120)
}
