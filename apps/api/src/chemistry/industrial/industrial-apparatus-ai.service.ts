/**
 * AI 装置图候选生成适配（STEP_13 + PHASE_A HTTP）。
 * 仅输出结构化 JSON → 校验 → Public → SVG → 安全/质检。
 * 禁止接受 AI 任意 SVG。Mock 路径标记 development_only。
 */
import { randomUUID } from 'crypto'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import { APP_GAS_PURIFY_COLLECT, ALL_APPARATUS_SAMPLES } from './industrial-apparatus.fixtures'
import { projectIndustrialApparatusPublic } from './industrial-apparatus.project'
import { validateIndustrialApparatusDefinition } from './industrial-apparatus.validate'
import { renderIndustrialApparatusSvg } from './industrial-apparatus-svg-renderer'
import { checkIndustrialApparatusSafety } from './industrial-apparatus-safety'
import { checkApparatusQualityDimension } from './industrial-quality.apparatus'
import { createIndustrialReviewRecord } from './industrial-review.service'
import { persistImmutableIndustrialSvg } from './industrial-svg-asset.service'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'
import { computeApparatusContentHash } from './industrial-apparatus.hash'
import { INDUSTRIAL_APPARATUS_SCHEMA_VERSION } from './industrial-apparatus.constants'
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'
import type { IndustrialDiagramDefinition } from './industrial-diagram.types'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'
import { computeDiagramContentHash } from './industrial-diagram.hash'
import { INDUSTRIAL_DIAGRAM_SCHEMA_VERSION } from './industrial-diagram.constants'
import { IndustrialAiHttpProvider } from './industrial-ai-provider.http'
import {
  IndustrialAiError,
  type IndustrialAiProvider,
} from './industrial-ai-provider.types'
import { computeAuditContentHash } from './industrial-quality.hash'
import type { IndustrialCase } from './industrial-case.types'

export type ApparatusAiGenerateResult = {
  ok: boolean
  developmentOnly: boolean
  formalImportBlocked: boolean
  providerKind: 'mock' | 'http'
  apparatus: IndustrialApparatusDefinition | null
  publicApparatus: ReturnType<typeof projectIndustrialApparatusPublic> | null
  svg: string | null
  flowSvg: string | null
  safetyBlocking: string[]
  unknownIssues: string[]
  candidateId: string | null
  message: string
  errorCode?: string
}

function minimalFlowStub(caseCode: string): IndustrialDiagramDefinition {
  const draft = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: `flow_stub_${caseCode}`.slice(0, 48),
    caseCode,
    caseVersion: '1.0.0',
    caseContentHash: '0'.repeat(64),
    diagramVersion: '1.0.0',
    title: '流程占位（装置主图）',
    orientation: 'left_to_right' as const,
    nodes: [
      {
        id: 'n1',
        type: 'process' as const,
        displayLabel: '装置主图',
        displayRole: 'process' as const,
        internal: {},
      },
    ],
    edges: [],
    internalReferences: {
      caseCode,
      caseVersion: '1.0.0',
      caseContentHash: '0'.repeat(64),
    },
    reviewMetadata: { chemicallyReviewed: false, structureOnly: true },
  }
  return {
    ...draft,
    diagramContentHash: computeDiagramContentHash(draft),
  }
}

const APPARATUS_HTTP_SYSTEM = `你是高中化学「工业实验」装置图出题助手。
只输出一个 JSON 对象（不要 markdown），字段：
{
  "apparatusId": string,
  "title": string,
  "orientation": "left_to_right"|"top_to_bottom",
  "schematicDisclaimer": string,
  "components": [{
    "componentId": string,
    "componentType": string,
    "displayLabel": string,
    "ports": [{"portId": string, "direction": "in"|"out"|"bidirectional", "media": string[]}],
    "paramLabels": string[],
    "internal": {}
  }],
  "connections": [{
    "connectionId": string,
    "sourceComponentId": string,
    "sourcePortId": string,
    "targetComponentId": string,
    "targetPortId": string,
    "flowType": "gas"|"liquid"|"solid"|"heat"|"signal"|"unknown",
    "displayLabel": string,
    "internal": {}
  }],
  "intentionallyInvalid": boolean
}
禁止输出 SVG、HTML、答案键、hazardNotes。componentType 仅用常见实验室装置枚举。`

function buildApparatusHttpUserPrompt(industrialCase: IndustrialCase): string {
  return [
    `案例 code=${industrialCase.caseCode}`,
    `标题=${industrialCase.title}`,
    `知识点=${industrialCase.curriculumScope.knowledgePoints.slice(0, 8).join(',')}`,
    '请生成一道「装置连接示意」教学图 JSON（故意错误样例请 intentionallyInvalid=true）。',
  ].join('\n')
}

function coerceApparatusFromAi(
  raw: Record<string, unknown>,
  industrialCase: IndustrialCase,
): IndustrialApparatusDefinition {
  const draft: Omit<IndustrialApparatusDefinition, 'apparatusContentHash'> = {
    schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
    apparatusId: String(raw.apparatusId || `app_ai_${randomUUID().slice(0, 8)}`).slice(0, 48),
    caseCode: industrialCase.caseCode,
    caseVersion: industrialCase.version,
    caseContentHash: industrialCase.contentHash,
    apparatusVersion: '1.0.0',
    title: String(raw.title || 'AI 装置示意').slice(0, 80),
    orientation:
      raw.orientation === 'top_to_bottom' ? 'top_to_bottom' : 'left_to_right',
    schematicDisclaimer: String(
      raw.schematicDisclaimer || '示意图仅供教学，不代表真实工业装置比例。',
    ).slice(0, 200),
    components: Array.isArray(raw.components)
      ? (raw.components as IndustrialApparatusDefinition['components'])
      : [],
    connections: Array.isArray(raw.connections)
      ? (raw.connections as IndustrialApparatusDefinition['connections'])
      : [],
    reviewMetadata: {
      chemicallyReviewed: false,
      schematicOnly: true,
      notes: 'ai_http_generated',
    },
    intentionallyInvalid: Boolean(raw.intentionallyInvalid),
  }
  return {
    ...draft,
    apparatusContentHash: computeApparatusContentHash(draft),
  }
}

async function attachDualAssetReview(opts: {
  industrialCase: IndustrialCase
  sample: IndustrialApparatusDefinition
  pub: ReturnType<typeof projectIndustrialApparatusPublic>
  apparatusSvg: string
  apparatusPublicHash: string
  safety: ReturnType<typeof checkIndustrialApparatusSafety>
  qChecks: ReturnType<typeof checkApparatusQualityDimension>
  generationSource: 'ai_generated' | 'mock_generated' | 'manual_fixture'
  developmentOnly: boolean
  stem: string
  answer: string
  explanation: string
  cwd?: string
}): Promise<string> {
  const cwd = opts.cwd || process.cwd()
  const flow = minimalFlowStub(opts.industrialCase.caseCode)
  const flowPub = projectIndustrialDiagramPublic(flow)
  const flowRendered = renderIndustrialDiagramSvg(flowPub)
  const record = createIndustrialReviewRecord(
    {
      generationTaskId: `app_task_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      generationSource: opts.generationSource,
      developmentOnly: opts.developmentOnly,
      specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
      categoryCode: opts.industrialCase.categoryCodes[0] || 'industrial_apparatus_analysis',
      industrialCase: opts.industrialCase,
      candidate: {
        qtype: 'single',
        answerType: 'single',
        stem: opts.stem,
        options: ['正确示意', '错误示意', '无法判断', '与题无关'],
        answer: opts.answer,
        explanation: opts.explanation,
        knowledgePoints: opts.industrialCase.curriculumScope.knowledgePoints.slice(0, 3),
        difficulty: 1,
        requiresManualReview: true,
        referencedNodeIds: [],
        referencedLabels: opts.sample.components.map((c) => c.displayLabel),
      },
      definition: flow,
      publicDiagram: flowPub,
      svg: flowRendered.svg,
      renderReport: flowRendered.renderReport,
      qualityReport: null,
    },
    cwd,
  )

  const appAsset = persistImmutableIndustrialSvg(opts.apparatusSvg, cwd)
  const { loadIndustrialReviewRecord, saveIndustrialReviewRecord } = await import(
    './industrial-review.store'
  )
  const full = loadIndustrialReviewRecord(record.candidateId, cwd)
  if (full) {
    full.apparatusDefinition = opts.sample
    full.apparatusPublic = opts.pub
    full.apparatusSvg = opts.apparatusSvg.endsWith('\n')
      ? opts.apparatusSvg
      : `${opts.apparatusSvg}\n`
    full.apparatusSvgContentHash = appAsset.contentHash
    full.apparatusSvgRelativePath = appAsset.relativePath
    full.apparatusSafety = opts.safety
    full.apparatusQualityChecks = opts.qChecks
    full.auditContentHash = computeAuditContentHash({
      industrialCase: opts.industrialCase,
      candidate: full.candidate,
      definition: full.definition,
      publicDiagram: full.publicDiagram,
      apparatusContentHash: opts.sample.apparatusContentHash,
      apparatusPublicContentHash: opts.apparatusPublicHash,
    })
    full.updatedAt = new Date().toISOString()
    saveIndustrialReviewRecord(full, cwd)
  }
  return record.candidateId
}

/**
 * Mock：从样例库取合法装置 JSON（非在线 AI）。
 */
export async function generateIndustrialApparatusCandidateWithMock(opts?: {
  sampleId?: string
  writeReview?: boolean
  cwd?: string
}): Promise<ApparatusAiGenerateResult> {
  const sample =
    ALL_APPARATUS_SAMPLES.find((s) => s.apparatusId === opts?.sampleId) ||
    APP_GAS_PURIFY_COLLECT
  const industrialCase = ALL_CANDIDATE_CASES[0]
  if (!industrialCase) {
    return {
      ok: false,
      developmentOnly: true,
      formalImportBlocked: true,
      providerKind: 'mock',
      apparatus: null,
      publicApparatus: null,
      svg: null,
      flowSvg: null,
      safetyBlocking: [],
      unknownIssues: [],
      candidateId: null,
      message: '无案例 fixtures',
      errorCode: 'NO_CASE',
    }
  }

  const v = validateIndustrialApparatusDefinition(sample)
  if (!v.valid && !sample.intentionallyInvalid) {
    return {
      ok: false,
      developmentOnly: true,
      formalImportBlocked: true,
      providerKind: 'mock',
      apparatus: sample,
      publicApparatus: null,
      svg: null,
      flowSvg: null,
      safetyBlocking: v.errors.map((e) => e.message),
      unknownIssues: [],
      candidateId: null,
      message: '装置 JSON 校验失败',
      errorCode: 'SCHEMA_FAIL',
    }
  }

  const pub = projectIndustrialApparatusPublic(sample)
  const rendered = renderIndustrialApparatusSvg(pub)
  const flow = minimalFlowStub(industrialCase.caseCode)
  const flowSvg = renderIndustrialDiagramSvg(projectIndustrialDiagramPublic(flow)).svg
  const safety = checkIndustrialApparatusSafety(sample)
  const qChecks = checkApparatusQualityDimension({
    apparatus: sample,
    stem: '装置示意题干',
  })

  let candidateId: string | null = null
  if (opts?.writeReview !== false) {
    candidateId = await attachDualAssetReview({
      industrialCase,
      sample,
      pub,
      apparatusSvg: rendered.svg,
      apparatusPublicHash: rendered.publicContentHash,
      safety,
      qChecks,
      generationSource: 'mock_generated',
      developmentOnly: true,
      stem: `【装置图Mock】${sample.title}`,
      answer: sample.intentionallyInvalid ? '错误示意' : '正确示意',
      explanation: `Mock 装置候选；development_only。apparatusId=${sample.apparatusId}`,
      cwd: opts?.cwd,
    })
  }

  return {
    ok: true,
    developmentOnly: true,
    formalImportBlocked: true,
    providerKind: 'mock',
    apparatus: sample,
    publicApparatus: pub,
    svg: rendered.svg,
    flowSvg,
    safetyBlocking: safety.blocking,
    unknownIssues: safety.unknowns,
    candidateId,
    message: sample.intentionallyInvalid
      ? '已生成故意错误装置样例（禁止 formal）'
      : 'Mock 装置候选已生成（development_only；禁止 formal；双图：flow+apparatus）',
  }
}

/**
 * HTTP：真实 AI 仅生成装置 JSON；程序渲染 SVG。
 * 不自动正式入库；仍需质检 + 人工审核。
 * 自检可注入 provider；无密钥时返回 AI_UNAVAILABLE（不算 PASS 冒充在线）。
 */
export async function generateIndustrialApparatusCandidateWithHttp(opts?: {
  caseCode?: string
  writeReview?: boolean
  cwd?: string
  /** 自检注入；默认 IndustrialAiHttpProvider */
  provider?: IndustrialAiProvider
}): Promise<ApparatusAiGenerateResult> {
  const industrialCase =
    ALL_CANDIDATE_CASES.find((c) => c.caseCode === opts?.caseCode) ||
    ALL_CANDIDATE_CASES[0]
  if (!industrialCase) {
    return {
      ok: false,
      developmentOnly: false,
      formalImportBlocked: true,
      providerKind: 'http',
      apparatus: null,
      publicApparatus: null,
      svg: null,
      flowSvg: null,
      safetyBlocking: [],
      unknownIssues: [],
      candidateId: null,
      message: '无案例 fixtures',
      errorCode: 'NO_CASE',
    }
  }

  const provider = opts?.provider || new IndustrialAiHttpProvider()
  if (!provider.isAvailable()) {
    return {
      ok: false,
      developmentOnly: false,
      formalImportBlocked: true,
      providerKind: 'http',
      apparatus: null,
      publicApparatus: null,
      svg: null,
      flowSvg: null,
      safetyBlocking: [],
      unknownIssues: [],
      candidateId: null,
      message: 'HTTP AI 不可用（未启用或缺少密钥）',
      errorCode: 'AI_UNAVAILABLE',
    }
  }

  let rawText: string
  try {
    const chat = await provider.chat({
      requestId: `app_http_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      system: APPARATUS_HTTP_SYSTEM,
      user: buildApparatusHttpUserPrompt(industrialCase),
      temperature: 0.2,
      maxTokens: 4096,
      forceJson: true,
    })
    rawText = chat.content
  } catch (e) {
    const code =
      e instanceof IndustrialAiError ? e.code : 'AI_UNKNOWN'
    return {
      ok: false,
      developmentOnly: false,
      formalImportBlocked: true,
      providerKind: 'http',
      apparatus: null,
      publicApparatus: null,
      svg: null,
      flowSvg: null,
      safetyBlocking: [],
      unknownIssues: [],
      candidateId: null,
      message: String((e as Error).message || e).slice(0, 200),
      errorCode: code,
    }
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawText) as Record<string, unknown>
  } catch {
    return {
      ok: false,
      developmentOnly: false,
      formalImportBlocked: true,
      providerKind: 'http',
      apparatus: null,
      publicApparatus: null,
      svg: null,
      flowSvg: null,
      safetyBlocking: [],
      unknownIssues: [],
      candidateId: null,
      message: 'AI 返回非 JSON',
      errorCode: 'AI_JSON_PARSE',
    }
  }

  const sample = coerceApparatusFromAi(parsed, industrialCase)
  const v = validateIndustrialApparatusDefinition(sample)
  if (!v.valid && !sample.intentionallyInvalid) {
    return {
      ok: false,
      developmentOnly: false,
      formalImportBlocked: true,
      providerKind: 'http',
      apparatus: sample,
      publicApparatus: null,
      svg: null,
      flowSvg: null,
      safetyBlocking: v.errors.map((e) => e.message),
      unknownIssues: [],
      candidateId: null,
      message: '装置 JSON 校验失败',
      errorCode: 'SCHEMA_FAIL',
    }
  }

  const pub = projectIndustrialApparatusPublic(sample)
  const rendered = renderIndustrialApparatusSvg(pub)
  const flow = minimalFlowStub(industrialCase.caseCode)
  const flowSvg = renderIndustrialDiagramSvg(projectIndustrialDiagramPublic(flow)).svg
  const safety = checkIndustrialApparatusSafety(sample)
  const qChecks = checkApparatusQualityDimension({
    apparatus: sample,
    stem: sample.title,
  })

  let candidateId: string | null = null
  if (opts?.writeReview !== false) {
    candidateId = await attachDualAssetReview({
      industrialCase,
      sample,
      pub,
      apparatusSvg: rendered.svg,
      apparatusPublicHash: rendered.publicContentHash,
      safety,
      qChecks,
      generationSource: 'ai_generated',
      developmentOnly: false,
      stem: `【装置图AI】${sample.title}`,
      answer: sample.intentionallyInvalid ? '错误示意' : '正确示意',
      explanation: `HTTP AI 装置候选；仍需质检与人工审核。apparatusId=${sample.apparatusId}`,
      cwd: opts?.cwd,
    })
  }

  return {
    ok: true,
    developmentOnly: false,
    formalImportBlocked: false,
    providerKind: 'http',
    apparatus: sample,
    publicApparatus: pub,
    svg: rendered.svg,
    flowSvg,
    safetyBlocking: safety.blocking,
    unknownIssues: safety.unknowns,
    candidateId,
    message: 'HTTP AI 装置候选已生成（双图落盘；未自动 formal；待人审）',
  }
}
