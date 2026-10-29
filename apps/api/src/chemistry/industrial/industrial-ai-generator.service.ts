import { randomUUID } from 'crypto'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import type { IndustrialCase } from './industrial-case.types'
import {
  INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
  type IndustrialDiagramDisplayRole,
  type IndustrialDiagramEdgeType,
  type IndustrialDiagramNodeType,
  type IndustrialDiagramOrientation,
} from './industrial-diagram.constants'
import { computeDiagramContentHash } from './industrial-diagram.hash'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import {
  validateIndustrialDiagramAgainstCase,
  validateIndustrialDiagramDefinition,
  validateIndustrialDiagramPublic,
} from './industrial-diagram.validate'
import type {
  IndustrialDiagramDefinition,
  IndustrialDiagramEdgeDefinition,
  IndustrialDiagramNodeDefinition,
} from './industrial-diagram.types'
import { writeIndustrialAiCandidateArtifacts } from './industrial-ai-candidate.service'
import {
  evaluateCaseTrust,
  parseIndustrialAiJson,
  validateIndustrialAiGenerateRequest,
  validateIndustrialAiRawOutput,
  validateQuestionDiagramConsistency,
} from './industrial-ai-generator.validate'
import type {
  IndustrialAiGenerateOptions,
  IndustrialAiGenerateRequest,
  IndustrialAiGenerateResult,
  IndustrialAiTaskMetadata,
  IndustrialAiValidationStageResult,
} from './industrial-ai-generator.types'
import { IndustrialAiMockProvider } from './industrial-ai-provider.mock'
import { IndustrialAiHttpProvider } from './industrial-ai-provider.http'
import {
  IndustrialAiError,
  type IndustrialAiProvider,
  type MockProviderScenario,
} from './industrial-ai-provider.types'
import { buildIndustrialQuestionSystemPrompt } from './prompts/industrial-question.system'
import { buildIndustrialQuestionUserPrompt } from './prompts/industrial-question.user'
import type { IndustrialAiRawOutput } from './prompts/industrial-question.schema'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'

function findCase(caseCode: string): IndustrialCase | undefined {
  return ALL_CANDIDATE_CASES.find((c) => c.caseCode === caseCode)
}

function rebuildDefinitionFromAi(
  fragment: IndustrialAiRawOutput['diagramDefinition'],
  industrialCase: IndustrialCase,
): IndustrialDiagramDefinition {
  const nodes: IndustrialDiagramNodeDefinition[] = (fragment.nodes || []).map((n) => {
    const displayRole = (n.displayRole ||
      (n.type === 'unknown' ? 'unknown_op' : n.type === 'product' ? 'product' : 'process')) as IndustrialDiagramDisplayRole
    return {
      id: n.id,
      type: n.type as IndustrialDiagramNodeType,
      displayLabel: n.displayLabel,
      displayRole,
      presentation: n.presentation as IndustrialDiagramNodeDefinition['presentation'],
      internal: {
        materialId: n.internal?.materialId ?? null,
        stepId: n.internal?.stepId ?? null,
        reactionReference: n.internal?.reactionReference ?? null,
        unknownKey: n.internal?.unknownKey ?? null,
        answerLabel: n.internal?.answerLabel ?? null,
      },
    }
  })
  const edges: IndustrialDiagramEdgeDefinition[] = (fragment.edges || []).map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    type: e.type as IndustrialDiagramEdgeType,
    displayLabel: e.displayLabel,
    presentation: e.presentation as IndustrialDiagramEdgeDefinition['presentation'],
  }))

  const draft: Omit<IndustrialDiagramDefinition, 'diagramContentHash'> = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: fragment.diagramId,
    caseCode: industrialCase.caseCode,
    caseVersion: industrialCase.version,
    caseContentHash: industrialCase.contentHash,
    diagramVersion: fragment.diagramVersion || '0.1.0',
    title: fragment.title,
    orientation: (fragment.orientation || 'left_to_right') as IndustrialDiagramOrientation,
    nodes,
    edges,
    internalReferences: {
      caseCode: industrialCase.caseCode,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      notes: 'rebuilt by industrial AI generator; AI hashes ignored',
    },
    reviewMetadata: {
      chemicallyReviewed: false,
      structureOnly: true,
      notes: 'AI-generated structure; pending STEP_08 quality review',
    },
  }
  return { ...draft, diagramContentHash: computeDiagramContentHash(draft) }
}

function resolveProvider(
  req: IndustrialAiGenerateRequest,
  opts: IndustrialAiGenerateOptions,
): IndustrialAiProvider {
  if (opts.mockScenario) {
    return new IndustrialAiMockProvider(opts.mockScenario as MockProviderScenario)
  }
  if (req.generationMode === 'development_test') {
    // 开发测试默认 mock，避免无密钥时误调外网
    return new IndustrialAiMockProvider(
      req.qtype === 'judge'
        ? 'success_judge'
        : req.qtype === 'blank'
          ? 'success_blank'
          : 'success_single',
    )
  }
  return new IndustrialAiHttpProvider()
}

/**
 * 工业实验 AI 出题核心（纯服务，不依赖 Nest DI）。
 * 不写 chem_train_items；不改案例审核态。
 */
export async function generateIndustrialAiCandidate(
  request: IndustrialAiGenerateRequest,
  options: IndustrialAiGenerateOptions = {},
): Promise<IndustrialAiGenerateResult> {
  const taskId = `task_${randomUUID().replace(/-/g, '').slice(0, 16)}`
  const startedAt = new Date().toISOString()
  const startedMs = Date.now()
  const validationResults: IndustrialAiValidationStageResult[] = []
  let retryCount = 0

  const fail = (
    partial: Partial<IndustrialAiTaskMetadata> & {
      errorCode: string
      errorMessage: string
    },
  ): IndustrialAiGenerateResult => {
    const finishedAt = new Date().toISOString()
    const developmentOnly = request.generationMode === 'development_test'
    const task: IndustrialAiTaskMetadata = {
      taskId,
      provider: partial.provider || 'mock',
      model: partial.model || 'unknown',
      generationMode: request.generationMode,
      caseCode: request.caseCode,
      caseVersion: partial.caseVersion || '',
      caseContentHash: partial.caseContentHash || '',
      categoryCode: request.categoryCode,
      difficulty: request.difficulty,
      qtype: request.qtype,
      startedAt,
      finishedAt,
      durationMs: Date.now() - startedMs,
      status: 'generation_failed',
      retryCount,
      validationResults,
      errorCode: partial.errorCode,
      errorMessage: partial.errorMessage,
      tokenUsage: partial.tokenUsage || { available: false },
      developmentOnly,
      generationSource: partial.provider === 'http' ? 'ai_generated' : 'mock_generated',
    }
    return {
      ok: false,
      task,
      candidate: null,
      diagramDefinition: null,
      publicDiagram: null,
      svg: null,
      renderReport: null,
      rawOutput: null,
      outputDir: null,
      industrialCaseSnapshot: null,
    }
  }

  const reqCheck = validateIndustrialAiGenerateRequest(request)
  validationResults.push(reqCheck)
  if (!reqCheck.ok) {
    return fail({
      errorCode: 'REQUEST_INVALID',
      errorMessage: reqCheck.errors.join('; '),
    })
  }

  const industrialCase = options.industrialCase || findCase(request.caseCode)
  if (!industrialCase) {
    return fail({
      errorCode: 'CASE_NOT_FOUND',
      errorMessage: `case not found: ${request.caseCode}`,
    })
  }
  const trust = evaluateCaseTrust(industrialCase, request.generationMode)
  validationResults.push(trust)
  if (!trust.ok) {
    return fail({
      errorCode: 'CASE_TRUST_REJECTED',
      errorMessage: trust.errors.join('; '),
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
    })
  }

  if (!industrialCase.categoryCodes.includes(request.categoryCode as never)) {
    validationResults.push({
      stage: 'category_case',
      ok: false,
      errors: [`case does not list category ${request.categoryCode}`],
      warnings: [],
    })
    return fail({
      errorCode: 'CATEGORY_MISMATCH',
      errorMessage: `case categories do not include ${request.categoryCode}`,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
    })
  }

  const provider = resolveProvider(request, options)
  const maxAttempts = Math.max(1, Math.min(3, options.maxModelAttempts ?? 2))
  let rawOutput: IndustrialAiRawOutput | null = null
  let lastProviderMeta: {
    provider: 'http' | 'mock'
    model: string
    tokenUsage: IndustrialAiTaskMetadata['tokenUsage']
  } = {
    provider: provider.kind,
    model: provider.getConfigSummary().model,
    tokenUsage: { available: false },
  }

  if (request.generationMode === 'formal_candidate' && !provider.isAvailable()) {
    return fail({
      errorCode: 'AI_CONFIG_MISSING',
      errorMessage: 'formal_candidate requires available HTTP AI provider',
      provider: provider.kind,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
    })
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) retryCount += 1
    try {
      const chat = await provider.chat({
        requestId: `${taskId}_${attempt}`,
        system: buildIndustrialQuestionSystemPrompt(),
        user: buildIndustrialQuestionUserPrompt(industrialCase, request),
        temperature: 0.25,
        forceJson: true,
      })
      lastProviderMeta = {
        provider: chat.providerKind,
        model: chat.model,
        tokenUsage: chat.tokenUsage,
      }
      const parsed = parseIndustrialAiJson(chat.content)
      if (!parsed.ok || !parsed.value) {
        validationResults.push({
          stage: 'ai_json',
          ok: false,
          errors: [parsed.error || 'parse failed'],
          warnings: [],
        })
        continue
      }
      const schema = validateIndustrialAiRawOutput(parsed.value, request)
      validationResults.push(schema)
      if (!schema.ok) continue
      rawOutput = parsed.value
      break
    } catch (e) {
      const err =
        e instanceof IndustrialAiError
          ? e
          : new IndustrialAiError('AI_UNKNOWN', String((e as Error).message || e))
      validationResults.push({
        stage: 'ai_provider',
        ok: false,
        errors: [`${err.code}:${err.message}`],
        warnings: [],
      })
      if (!err.retryable) {
        return fail({
          errorCode: err.code,
          errorMessage: err.message,
          provider: provider.kind,
          model: lastProviderMeta.model,
          caseVersion: industrialCase.version,
          caseContentHash: industrialCase.contentHash,
          tokenUsage: lastProviderMeta.tokenUsage,
        })
      }
    }
  }

  if (!rawOutput) {
    return fail({
      errorCode: 'AI_CONTENT_VALIDATION_FAILED',
      errorMessage: 'exhausted retries without valid AI output',
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  // 程序重建 Definition 元数据（忽略 AI 伪造 hash/审核）
  const def = rebuildDefinitionFromAi(rawOutput.diagramDefinition, industrialCase)
  const defVal = validateIndustrialDiagramDefinition(def)
  validationResults.push({
    stage: 'diagram_definition',
    ok: defVal.valid,
    errors: defVal.errors.map((e) => `${e.code}:${e.path}:${e.message}`),
    warnings: defVal.warnings.map((w) => `${w.code}:${w.message}`),
  })
  if (!defVal.valid) {
    return fail({
      errorCode: 'DIAGRAM_DEFINITION_INVALID',
      errorMessage: defVal.errors.map((e) => e.code).join(','),
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  const against = validateIndustrialDiagramAgainstCase(def, industrialCase)
  validationResults.push({
    stage: 'diagram_case_bind',
    ok: against.valid,
    errors: against.errors.map((e) => `${e.code}:${e.message}`),
    warnings: against.warnings.map((w) => `${w.code}:${w.message}`),
  })
  if (!against.valid) {
    return fail({
      errorCode: 'DIAGRAM_CASE_REF_INVALID',
      errorMessage: against.errors.map((e) => e.code).join(','),
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  const consistency = validateQuestionDiagramConsistency(rawOutput, def)
  validationResults.push(consistency)
  if (!consistency.ok) {
    return fail({
      errorCode: 'STEM_DIAGRAM_INCONSISTENT',
      errorMessage: consistency.errors.join('; '),
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  validationResults.push({
    stage: 'structure_validated',
    ok: true,
    errors: [],
    warnings: [],
  })

  const pub = projectIndustrialDiagramPublic(def)
  const pubVal = validateIndustrialDiagramPublic(pub)
  validationResults.push({
    stage: 'public_project',
    ok: pubVal.valid,
    errors: pubVal.errors.map((e) => `${e.code}:${e.message}`),
    warnings: pubVal.warnings.map((w) => `${w.code}:${w.message}`),
  })
  if (!pubVal.valid) {
    return fail({
      errorCode: 'PUBLIC_INVALID',
      errorMessage: pubVal.errors.map((e) => e.code).join(','),
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  // 泄漏检查：Public / SVG 不得含 answerLabel
  const pubJson = JSON.stringify(pub)
  if (pubJson.includes('answerLabel') || pubJson.includes('unknownKey')) {
    return fail({
      errorCode: 'PUBLIC_LEAK',
      errorMessage: 'public diagram contains internal fields',
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  let svg = ''
  let renderReport = null as ReturnType<typeof renderIndustrialDiagramSvg>['renderReport'] | null
  try {
    const rendered = renderIndustrialDiagramSvg(pub)
    svg = rendered.svg
    renderReport = rendered.renderReport
    validationResults.push({
      stage: 'svg_render',
      ok: rendered.renderReport.valid,
      errors: rendered.renderReport.errors,
      warnings: rendered.renderReport.warnings,
    })
    if (!rendered.renderReport.valid) {
      return fail({
        errorCode: 'SVG_RENDER_INVALID',
        errorMessage: rendered.renderReport.errors.join('; '),
        provider: lastProviderMeta.provider,
        model: lastProviderMeta.model,
        caseVersion: industrialCase.version,
        caseContentHash: industrialCase.contentHash,
        tokenUsage: lastProviderMeta.tokenUsage,
      })
    }
  } catch (e) {
    return fail({
      errorCode: 'SVG_RENDER_FAILED',
      errorMessage: String((e as Error).message || e),
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  if (svg.includes('answerLabel') || svg.includes('reviewMetadata')) {
    return fail({
      errorCode: 'SVG_LEAK',
      errorMessage: 'svg contains internal fields',
      provider: lastProviderMeta.provider,
      model: lastProviderMeta.model,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
      tokenUsage: lastProviderMeta.tokenUsage,
    })
  }

  const developmentOnly = request.generationMode === 'development_test'
  const finishedAt = new Date().toISOString()
  const candidate = {
    stem: rawOutput.question.stem,
    options: rawOutput.question.options ?? null,
    answerType: rawOutput.qtype,
    answer: rawOutput.answer,
    explanation: rawOutput.explanation,
    difficulty: rawOutput.difficulty,
    qtype: rawOutput.qtype,
    knowledgePoints: rawOutput.knowledgePoints,
    requiresManualReview: Boolean(rawOutput.requiresManualReview) || developmentOnly,
    referencedNodeIds: rawOutput.question.referencedNodeIds || [],
    referencedLabels: rawOutput.question.referencedLabels || [],
  }

  const task: IndustrialAiTaskMetadata = {
    taskId,
    provider: lastProviderMeta.provider,
    model: lastProviderMeta.model,
    generationMode: request.generationMode,
    caseCode: industrialCase.caseCode,
    caseVersion: industrialCase.version,
    caseContentHash: industrialCase.contentHash,
    categoryCode: request.categoryCode,
    difficulty: request.difficulty,
    qtype: request.qtype,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedMs,
    status: developmentOnly ? 'development_only' : 'pending_quality_review',
    retryCount,
    validationResults,
    errorCode: null,
    errorMessage: null,
    tokenUsage: lastProviderMeta.tokenUsage,
    developmentOnly,
    generationSource:
      lastProviderMeta.provider === 'mock' ? 'mock_generated' : 'ai_generated',
  }

  const result: IndustrialAiGenerateResult = {
    ok: true,
    task,
    candidate,
    diagramDefinition: def,
    publicDiagram: pub,
    svg,
    renderReport,
    rawOutput,
    outputDir: null,
    industrialCaseSnapshot: {
      caseCode: industrialCase.caseCode,
      caseVersion: industrialCase.version,
      contentHash: industrialCase.contentHash,
      reviewStatus: industrialCase.reviewStatus,
    },
  }

  if (options.writeFiles !== false) {
    result.outputDir = writeIndustrialAiCandidateArtifacts(
      result,
      options.candidatesRoot,
    )
  }

  return result
}

/** 导出供自检：强制 mock 场景 */
export async function generateIndustrialAiCandidateWithMock(
  request: IndustrialAiGenerateRequest,
  scenario: MockProviderScenario,
  options: Omit<IndustrialAiGenerateOptions, 'mockScenario'> = {},
): Promise<IndustrialAiGenerateResult> {
  return generateIndustrialAiCandidate(request, { ...options, mockScenario: scenario })
}
