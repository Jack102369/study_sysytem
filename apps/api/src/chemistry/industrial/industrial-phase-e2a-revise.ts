/**
 * POST_STEP_13 PHASE_E2-A：对 E1 批次 4 道正式候选做阻塞诊断后的可确定修复 + 重质检。
 * pnpm --filter api run chem:industrial-phase-e2a-revise
 *
 * - 保留 candidateId / batchId；写修订历史；使人审与旧质检失效
 * - 不写 formal / KB / sessions；不自动 approve；不改 PHASE_D
 * - 案例仍 draft；来源仍 unverified（不伪造 verified）
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  CASE_GAS_WASH_TEACHING,
  CASE_SALT_PURIFICATION,
  CASE_SEAWATER_BASIC,
} from './industrial-case.fixtures'
import type { IndustrialCase } from './industrial-case.types'
import {
  buildSaltPurificationDiagram,
  buildSeawaterDiagram,
} from './industrial-diagram.fixtures'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'
import {
  APP_FILTER,
  APP_GAS_PURIFY_COLLECT,
} from './industrial-apparatus.fixtures'
import { computeApparatusContentHash } from './industrial-apparatus.hash'
import { projectIndustrialApparatusPublic } from './industrial-apparatus.project'
import { renderIndustrialApparatusSvg } from './industrial-apparatus-svg-renderer'
import { checkIndustrialApparatusSafety } from './industrial-apparatus-safety'
import { persistImmutableIndustrialSvg } from './industrial-svg-asset.service'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import { computeAuditContentHash } from './industrial-quality.hash'
import {
  loadIndustrialReviewRecord,
  saveIndustrialReviewRecord,
} from './industrial-review.store'
import type { IndustrialReviewRecord } from './industrial-review.types'
import type { IndustrialDiagramDefinition } from './industrial-diagram.types'
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'
import { INDUSTRIAL_DIAGRAM_SCHEMA_VERSION } from './industrial-diagram.constants'
import { computeDiagramContentHash } from './industrial-diagram.hash'
import type { IndustrialAiCandidateQuestion } from './industrial-ai-generator.types'

export const E2A_TARGET_BATCH = 'industrial_formal_candidate_20261029_121958'
export const E2A_CANDIDATE_IDS = [
  'cand_63284abdddf24cee',
  'cand_8ce596acabc64f26',
  'cand_03bf94425958444b',
  'cand_312c51e0c9e249f7',
] as const

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

function minimalFlowStubForCase(c: IndustrialCase): IndustrialDiagramDefinition {
  const draft = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: `flow_stub_${c.caseCode}`.slice(0, 48),
    caseCode: c.caseCode,
    caseVersion: c.version,
    caseContentHash: c.contentHash,
    diagramVersion: '1.0.0',
    title: '流程占位（装置主图·教学示意）',
    orientation: 'left_to_right' as const,
    nodes: [
      {
        id: 'n1',
        type: 'process' as const,
        displayLabel: '装置示意',
        displayRole: 'process' as const,
        internal: {},
      },
    ],
    edges: [],
    internalReferences: {
      caseCode: c.caseCode,
      caseVersion: c.version,
      caseContentHash: c.contentHash,
    },
    reviewMetadata: {
      chemicallyReviewed: false,
      structureOnly: true,
      notes: '装置题流程占位；与案例 version/hash 对齐',
    },
  }
  return { ...draft, diagramContentHash: computeDiagramContentHash(draft) }
}

function apparatusWithCase(
  base: IndustrialApparatusDefinition,
  c: IndustrialCase,
): IndustrialApparatusDefinition {
  const { apparatusContentHash: _drop, ...rest } = base
  const draft = {
    ...rest,
    caseCode: c.caseCode,
    caseVersion: c.version,
    caseContentHash: c.contentHash,
    schematicDisclaimer:
      rest.schematicDisclaimer ||
      '教学示意装置图（schematic），非工程施工图',
    reviewMetadata: {
      ...rest.reviewMetadata,
      chemicallyReviewed: false,
      schematicOnly: true,
    },
  }
  return {
    ...draft,
    apparatusContentHash: computeApparatusContentHash(draft),
  }
}

type RevisePlan = {
  candidateId: string
  seq: number
  title: string
  changeReasons: string[]
  industrialCase: IndustrialCase
  categoryCode: string
  difficulty: 1 | 2 | 3
  qtype: 'single' | 'judge' | 'blank'
  stem: string
  options: string[] | null
  answer: string | boolean
  explanation: string
  knowledgePoints: string[]
  definition: IndustrialDiagramDefinition
  apparatus: IndustrialApparatusDefinition | null
  diagramKinds: Array<'flow' | 'apparatus'>
  sourceBasis: string[]
  kbPlan: Array<Record<string, unknown>>
}

const LOCAL_KB = {
  expFilter: {
    entityType: 'experiment',
    entityId: '20',
    entityName: '过滤操作',
    status: 'published',
    reviewNoteFlags: ['ai_trial', 'human_unreviewed', 'trial_run'],
    note: '本地 chem_experiments.id=20；published 但 review_note 含 human_unreviewed',
  },
  expDissolve: {
    entityType: 'experiment',
    entityId: '19',
    entityName: '溶解与搅拌',
    status: 'published',
    reviewNoteFlags: ['ai_trial', 'human_unreviewed', 'trial_run'],
    note: '本地 chem_experiments.id=19',
  },
  kpGasWash: {
    entityType: 'knowledge',
    entityId: '61',
    entityName: '气体的洗涤与干燥',
    status: 'published',
    reviewNoteFlags: [],
    note: '本地 chem_knowledge_points.id=61',
  },
  substanceWater: {
    entityType: 'substance',
    entityId: '2',
    entityName: '水',
    status: 'published',
    reviewNoteFlags: [],
    note: '本地 chem_substances.id=2',
  },
} as const

function buildPlans(): RevisePlan[] {
  const gasCase = CASE_GAS_WASH_TEACHING
  const salt = CASE_SALT_PURIFICATION
  const sea = CASE_SEAWATER_BASIC
  return [
    {
      candidateId: 'cand_63284abdddf24cee',
      seq: 1,
      title: '粗盐提纯·过滤识读（E2-A 修订）',
      changeReasons: [
        '澄清题干：强调除去不溶性杂质；去掉易混淆 PHASE 备注噪音',
        '解析改写避免歧义；内容化学结论不变',
      ],
      industrialCase: salt,
      categoryCode: 'flow_diagram_read',
      difficulty: 1,
      qtype: 'single',
      stem:
        '粗盐提纯教学流程图中，用于除去不溶性杂质（泥沙等）的关键操作是？\n（教学案例仍为 draft；正式发布前须人工审核）',
      options: ['过滤', '电解', '焰色反应', '中和滴定'],
      answer: '过滤',
      explanation:
        '过滤实现固液分离，除去泥沙等不溶杂质。蒸发结晶得到晶体。本教学流程不覆盖可溶性杂质的化学除杂。',
      knowledgePoints: ['过滤', '溶解', '蒸发'],
      definition: buildSaltPurificationDiagram(),
      apparatus: null,
      diagramKinds: ['flow'],
      sourceBasis: [
        'CASE_SALT_PURIFICATION（draft / unverified）',
        LOCAL_KB.expFilter.note,
        LOCAL_KB.expDissolve.note,
        'SOURCE_VERIFICATION_INCOMPLETE：无外部教材页码',
      ],
      kbPlan: [
        { ...LOCAL_KB.expFilter, currentLink: 'NOT_BOUND', adminConfirmRequired: true },
        { ...LOCAL_KB.expDissolve, currentLink: 'NOT_BOUND', adminConfirmRequired: true },
        { ...LOCAL_KB.substanceWater, currentLink: 'NOT_BOUND', adminConfirmRequired: true },
      ],
    },
    {
      candidateId: 'cand_8ce596acabc64f26',
      seq: 2,
      title: '气体洗涤装置流向判断（E2-A 修订）',
      changeReasons: [
        '案例由粗盐改为 CASE_GAS_WASH_TEACHING，消除分类/主题错配',
        '流程占位 stub 绑定真实 caseVersion/contentHash，修复 DIAG_CASE_BIND',
        '装置 Definition 同步案例元数据；明确 schematic',
      ],
      industrialCase: gasCase,
      categoryCode: 'industrial_apparatus_analysis',
      difficulty: 1,
      qtype: 'judge',
      stem:
        '判断：教学装置示意图中，气体先经洗气再收集的示意，比「任意颠倒连接且忽略导管插入」更合理。\n（示意图=schematic，非工程施工图；案例 draft）',
      options: null,
      answer: true,
      explanation:
        '气体洗涤与干燥教学要求注意气路顺序与导管浸入情况。本图为 schematic。倒吸/尾气等安全项可能仍为 unknown，须人工复核。',
      knowledgePoints: ['气体洗涤', '干燥', '收集'],
      definition: minimalFlowStubForCase(gasCase),
      apparatus: apparatusWithCase(APP_GAS_PURIFY_COLLECT, gasCase),
      diagramKinds: ['apparatus', 'flow'],
      sourceBasis: [
        LOCAL_KB.kpGasWash.note,
        'CASE_GAS_WASH_TEACHING（draft / unverified）',
        'APP_GAS_PURIFY_COLLECT schematic',
      ],
      kbPlan: [
        { ...LOCAL_KB.kpGasWash, currentLink: 'NOT_BOUND', adminConfirmRequired: true },
      ],
    },
    {
      candidateId: 'cand_03bf94425958444b',
      seq: 3,
      title: '提纯流程+过滤装置双图综合（E2-A 修订）',
      changeReasons: [
        '解析改写：避免触发 FILTER_SOLUBLE_SALT 误判的肯定错误模式措辞',
        '明确过滤对象为不溶固体；可溶杂质另法（正确教学）',
        '双图重渲染并刷新 auditContentHash',
      ],
      industrialCase: salt,
      categoryCode: 'industrial_separation_purification',
      difficulty: 2,
      qtype: 'single',
      stem:
        '同时给出粗盐提纯流程与过滤装置示意时，过滤的主要目的是？\n（双图教学候选；案例 draft）',
      options: [
        '除去不溶性杂质，实现固液分离',
        '除去全部可溶性杂质离子',
        '直接冶炼得到金属单质',
        '完成电解精炼',
      ],
      answer: '除去不溶性杂质，实现固液分离',
      explanation:
        '过滤用于固液分离，除去泥沙等不溶固体。可溶性杂质不能靠过滤除去，需另选化学方法（本案例未覆盖）。双图各自 contentHash。',
      knowledgePoints: ['过滤', '固液分离', '粗盐提纯'],
      definition: buildSaltPurificationDiagram(),
      apparatus: apparatusWithCase(APP_FILTER, salt),
      diagramKinds: ['flow', 'apparatus'],
      sourceBasis: [
        LOCAL_KB.expFilter.note,
        'CASE_SALT_PURIFICATION + APP_FILTER',
      ],
      kbPlan: [
        { ...LOCAL_KB.expFilter, currentLink: 'NOT_BOUND', adminConfirmRequired: true },
        { ...LOCAL_KB.expDissolve, currentLink: 'NOT_BOUND', adminConfirmRequired: true },
      ],
    },
    {
      candidateId: 'cand_312c51e0c9e249f7',
      seq: 4,
      title: '海水资源流程·固液分离填空（E2-A 修订）',
      changeReasons: [
        '难度由 3 调整为 2，落在案例 difficultyRange 内',
        '知识点对齐案例白名单（溶液/蒸发/结晶/混合物分离 + 过滤）',
        '题干/解析澄清考查「过滤」',
      ],
      industrialCase: sea,
      categoryCode: 'industrial_production_cases',
      difficulty: 2,
      qtype: 'blank',
      stem:
        '阅读海水资源利用教学流程图，写出图中用于固液分离的核心单元操作名称。\n（案例 draft；SOURCE_VERIFICATION_INCOMPLETE）',
      options: null,
      answer: '过滤',
      explanation:
        '教学流程中固液分离常用过滤。案例与来源尚未正式科学审核，正式发布前必须人工确认图文与答案。',
      knowledgePoints: ['过滤', '溶液', '蒸发', '混合物分离'],
      definition: buildSeawaterDiagram(),
      apparatus: null,
      diagramKinds: ['flow'],
      sourceBasis: [
        'CASE_SEAWATER_BASIC（draft / unverified）',
        LOCAL_KB.expFilter.note,
      ],
      kbPlan: [
        { ...LOCAL_KB.expFilter, currentLink: 'NOT_BOUND', adminConfirmRequired: true },
      ],
    },
  ]
}

function classifyBlockers(quality: {
  checks: Array<{
    checkCode: string
    status: string
    severity: string
    message: string
    dimension: string
  }>
  blockingIssues: string[]
  unknownIssues: string[]
  overallStatus: string
  formalPublishEligible: boolean
}) {
  const fails = quality.checks.filter((c) => c.status === 'fail')
  const publishCodes = new Set(['CURR_CASE_TRUST', 'CHEM_SOURCE_VERIFIED'])
  const qualityContent = fails.filter((c) => !publishCodes.has(c.checkCode))
  const publishElig = fails.filter((c) => publishCodes.has(c.checkCode))
  return {
    QUALITY_BLOCKERS: qualityContent.map((c) => ({
      checkCode: c.checkCode,
      dimension: c.dimension,
      severity: c.severity,
      message: c.message,
    })),
    PUBLISH_ELIGIBILITY_BLOCKERS: publishElig.map((c) => ({
      checkCode: c.checkCode,
      dimension: c.dimension,
      severity: c.severity,
      message: c.message,
    })),
    HUMAN_REVIEW_PENDING: true,
    KB_BINDING_BLOCKERS: ['KB_NOT_BOUND'],
    UNKNOWN_SCIENCE_ITEMS: quality.unknownIssues.slice(0, 40),
    overallStatus: quality.overallStatus,
    formalPublishEligible: quality.formalPublishEligible,
  }
}

export async function runPhaseE2aRevise(opts?: {
  cwd?: string
  root?: string
}): Promise<{
  batchId: string
  items: Record<string, unknown>[]
  fixLog: Record<string, unknown>[]
}> {
  const cwd = opts?.cwd || apiCwd()
  const root = opts?.root || repoRoot()
  const plans = buildPlans()
  const batchDir = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'formal_candidate_batches',
    E2A_TARGET_BATCH,
  )
  mkdirSync(batchDir, { recursive: true })

  const items: Record<string, unknown>[] = []
  const fixLog: Record<string, unknown>[] = []
  const revisedAt = new Date().toISOString()

  for (const plan of plans) {
    const prev = loadIndustrialReviewRecord(plan.candidateId, cwd)
    if (!prev) {
      throw new Error(`MISSING_CANDIDATE ${plan.candidateId}`)
    }
    const prevBatch =
      (prev as Record<string, unknown>).e1BatchId ||
      String(prev.generationTaskId || '').replace(/_\d+$/, '')
    if (prevBatch && String(prevBatch) !== E2A_TARGET_BATCH) {
      throw new Error(
        `BATCH_MISMATCH ${plan.candidateId} expected=${E2A_TARGET_BATCH} got=${prevBatch}`,
      )
    }

    const before = {
      auditContentHash: prev.auditContentHash,
      questionContentHash: prev.qualityReport?.questionContentHash || null,
      diagramContentHash: prev.definition?.diagramContentHash || null,
      publicContentHash: prev.publicDiagram?.publicContentHash || null,
      flowSvgHash: prev.svgContentHash || null,
      apparatusSvgHash: prev.apparatusSvgContentHash || null,
      qualityOverall: prev.qualityReport?.overallStatus || null,
      qualityBlocking: prev.qualityReport?.blockingIssues?.length ?? null,
      qualityUnknown: prev.qualityReport?.unknownIssues?.length ?? null,
      reviewStatus: prev.reviewStatus,
      humanDecision: prev.humanDecision,
      caseCode: prev.caseCode,
      categoryCode: prev.categoryCode,
      revision: prev.revision,
    }

    const flowPub = projectIndustrialDiagramPublic(plan.definition)
    const flowRendered = renderIndustrialDiagramSvg(flowPub)
    const flowPersisted = persistImmutableIndustrialSvg(flowRendered.svg, cwd)

    const candidate: IndustrialAiCandidateQuestion = {
      qtype: plan.qtype,
      answerType: plan.qtype,
      stem: plan.stem,
      options: plan.options,
      answer: plan.answer,
      explanation: plan.explanation,
      knowledgePoints: plan.knowledgePoints,
      difficulty: plan.difficulty,
      requiresManualReview: true,
      referencedNodeIds: plan.definition.nodes
        .filter((n) => n.type === 'unknown')
        .map((n) => n.id),
      referencedLabels: plan.definition.nodes
        .map((n) => n.displayLabel)
        .slice(0, 8),
    }

    let apparatusDef: IndustrialApparatusDefinition | null = null
    let apparatusPub = null
    let apparatusSvg: string | null = null
    let apparatusHash: string | null = null
    let apparatusRel: string | null = null
    let apparatusSafety = null

    if (plan.apparatus) {
      apparatusDef = plan.apparatus
      apparatusPub = projectIndustrialApparatusPublic(plan.apparatus)
      const ar = renderIndustrialApparatusSvg(apparatusPub)
      apparatusSvg = ar.svg.endsWith('\n') ? ar.svg : `${ar.svg}\n`
      const persisted = persistImmutableIndustrialSvg(ar.svg, cwd)
      apparatusHash = persisted.contentHash
      apparatusRel = persisted.relativePath
      apparatusSafety = checkIndustrialApparatusSafety(plan.apparatus)
    }

    const quality = await checkIndustrialCandidateQuality(
      {
        candidateId: plan.candidateId,
        developmentOnly: false,
        categoryCode: plan.categoryCode,
        industrialCase: plan.industrialCase,
        candidate,
        definition: plan.definition,
        publicDiagram: flowPub,
        svg: flowRendered.svg,
        renderReport: flowRendered.renderReport,
        apparatusDefinition: apparatusDef || undefined,
      },
      { useMockAiReviewer: true, writeReport: false, enableAiReview: true },
    )

    const blockers = classifyBlockers(quality)
    const auditContentHash = computeAuditContentHash({
      industrialCase: plan.industrialCase,
      candidate,
      definition: plan.definition,
      publicDiagram: flowPub,
      apparatusContentHash: apparatusDef?.apparatusContentHash || null,
      apparatusPublicContentHash: apparatusPub?.publicContentHash || null,
    })

    const next: IndustrialReviewRecord = {
      ...prev,
      generationSource: 'manual_fixture',
      developmentOnly: false,
      specialtyCode: prev.specialtyCode,
      categoryCode: plan.categoryCode,
      caseCode: plan.industrialCase.caseCode,
      caseVersion: plan.industrialCase.version,
      caseContentHash: plan.industrialCase.contentHash,
      caseReviewStatus: plan.industrialCase.reviewStatus,
      candidate,
      definition: plan.definition,
      publicDiagram: flowPub,
      svg: flowRendered.svg.endsWith('\n')
        ? flowRendered.svg
        : `${flowRendered.svg}\n`,
      svgContentHash: flowPersisted.contentHash,
      svgRelativePath: flowPersisted.relativePath,
      renderReport: flowRendered.renderReport,
      qualityReport: quality,
      reviewStatus: 'pending_human_review',
      humanDecision: null,
      humanReviewedBy: null,
      humanReviewedAt: null,
      humanReviewedAuditHash: null,
      humanReviewNote: null,
      importedItemCode: null,
      importedAt: null,
      revision: (prev.revision || 0) + 1,
      auditContentHash,
      updatedAt: revisedAt,
    }

    if (apparatusDef && apparatusSvg && apparatusHash && apparatusRel) {
      next.apparatusDefinition = apparatusDef
      next.apparatusPublic = apparatusPub
      next.apparatusSvg = apparatusSvg
      next.apparatusSvgContentHash = apparatusHash
      next.apparatusSvgRelativePath = apparatusRel
      next.apparatusSafety = apparatusSafety
    } else {
      delete (next as Record<string, unknown>).apparatusDefinition
      delete (next as Record<string, unknown>).apparatusPublic
      delete (next as Record<string, unknown>).apparatusSvg
      delete (next as Record<string, unknown>).apparatusSvgContentHash
      delete (next as Record<string, unknown>).apparatusSvgRelativePath
      delete (next as Record<string, unknown>).apparatusSafety
    }

    const extra = next as Record<string, unknown>
    extra.e1BatchId = E2A_TARGET_BATCH
    extra.phase = 'PHASE_E2A'
    extra.phaseE2aRevisedAt = revisedAt
    extra.formalCandidateIntent = true
    extra.formalImportBlocked = true
    extra.diagramKinds = plan.diagramKinds
    extra.sourceBasis = plan.sourceBasis
    extra.sourceVerificationStatus = 'SOURCE_VERIFICATION_INCOMPLETE'
    extra.sourceVerificationNote =
      '仅依据仓库 fixture + 本地 DB published 实体；未做外部教材页码/DOI；不得伪造 verified'
    extra.kbBindingPlan = plan.kbPlan.map((k) => ({
      ...k,
      bindWhen: 'PHASE_E2_after_human_approve_and_formal_import',
    }))
    extra.e2aBlockerClassification = blockers
    extra.readyForHumanReview =
      blockers.QUALITY_BLOCKERS.length === 0 &&
      next.reviewStatus === 'pending_human_review'
    extra.readyForFormalImport = false
    extra.revisionHistory = [
      ...(((prev as Record<string, unknown>).revisionHistory as unknown[]) ||
        []),
      {
        at: revisedAt,
        fromRevision: before.revision,
        toRevision: next.revision,
        phase: 'PHASE_E2A',
        changeReasons: plan.changeReasons,
        beforeHashes: before,
        afterHashes: {
          auditContentHash,
          questionContentHash: quality.questionContentHash,
          diagramContentHash: plan.definition.diagramContentHash,
          publicContentHash: flowPub.publicContentHash,
          flowSvgHash: flowPersisted.contentHash,
          apparatusSvgHash: apparatusHash,
          qualityOverall: quality.overallStatus,
          qualityBlocking: quality.blockingIssues.length,
          qualityUnknown: quality.unknownIssues.length,
        },
      },
    ]

    saveIndustrialReviewRecord(next, cwd)

    const meta = {
      batchId: E2A_TARGET_BATCH,
      seq: plan.seq,
      candidateId: plan.candidateId,
      plannedItemCode:
        (prev as Record<string, unknown>).plannedItemCode ||
        `ifc_20261029_121958_${String(plan.seq).padStart(2, '0')}`,
      title: plan.title,
      phase: 'PHASE_E2A',
      revision: next.revision,
      qtype: plan.qtype,
      difficulty: plan.difficulty,
      categoryCode: plan.categoryCode,
      caseCode: plan.industrialCase.caseCode,
      caseReviewStatus: plan.industrialCase.reviewStatus,
      generationSource: 'manual_fixture',
      developmentOnly: false,
      reviewStatus: next.reviewStatus,
      humanDecision: null,
      qualityOverall: quality.overallStatus,
      qualityBlocking: quality.blockingIssues.length,
      qualityUnknown: quality.unknownIssues.length,
      requiresHumanReview: true,
      formalPublishEligible: quality.formalPublishEligible,
      readyForHumanReview: extra.readyForHumanReview,
      readyForFormalImport: false,
      blockerClassification: blockers,
      diagramKinds: plan.diagramKinds,
      flowSvgContentHash: flowPersisted.contentHash,
      apparatusSvgContentHash: apparatusHash,
      auditContentHash,
      changeReasons: plan.changeReasons,
      sourceVerificationStatus: 'SOURCE_VERIFICATION_INCOMPLETE',
      kbBindingPlan: extra.kbBindingPlan,
      dbTrainItemId: 'NOT_CREATED',
      dbAssetIds: 'NOT_CREATED',
      dbKbLinkIds: 'NOT_BOUND',
      pool: 'NOT_WRITTEN',
      revisedAt,
    }
    writeFileSync(
      join(
        batchDir,
        `${String(plan.seq).padStart(2, '0')}_${plan.candidateId}.meta.json`,
      ),
      `${JSON.stringify(meta, null, 2)}\n`,
      'utf8',
    )
    writeFileSync(
      join(batchDir, `${String(plan.seq).padStart(2, '0')}_flow.svg`),
      next.svg,
      'utf8',
    )
    if (apparatusSvg) {
      writeFileSync(
        join(batchDir, `${String(plan.seq).padStart(2, '0')}_apparatus.svg`),
        apparatusSvg,
        'utf8',
      )
    }

    items.push(meta)
    fixLog.push({
      candidateId: plan.candidateId,
      seq: plan.seq,
      changed: true,
      changeReasons: plan.changeReasons,
      before,
      after: meta,
    })
  }

  const summary = {
    batchId: E2A_TARGET_BATCH,
    phase: 'PHASE_E2A',
    e1BatchId: E2A_TARGET_BATCH,
    generationSource: 'manual_fixture',
    readyForFormalImport: false,
    revisedAt,
    candidateCount: items.length,
    itemCount: items.length,
    note: 'Content/rule fixes applied; case draft + unverified source remain; no formal write; human review still pending',
    phaseDBatchUntouched: 'industrial_acceptance_20261029_121220',
    sourceVerification: 'SOURCE_VERIFICATION_INCOMPLETE',
    items: items.map((it) => ({
      ...it,
      dbTrainItemId: 'NOT_CREATED',
      dbAssetIds: 'NOT_CREATED',
      dbKbLinkIds: 'NOT_BOUND',
      pool: 'NOT_WRITTEN',
      diagramKinds: it.diagramKinds || ['flow'],
    })),
  }
  writeFileSync(
    join(batchDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(batchDir, 'e2a_fix_log.json'),
    `${JSON.stringify({ revisedAt, fixLog }, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(cwd, 'var', 'industrial-review', '_phase_e2a_latest_batch.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  )

  // human checklist machine-readable
  const checkLabels = [
    'stem',
    'answer',
    'explanation',
    'chemistry',
    'case_source',
    'process',
    'apparatus',
    'flow_diagram',
    'apparatus_diagram',
    'safety',
    'consistency',
    'curriculum',
    'difficulty',
    'kb',
    'unknown',
  ]
  const checklistRows = items.map((it) => {
    const checks: Record<string, string> = {}
    for (const k of checkLabels) checks[k] = 'PENDING_HUMAN_REVIEW'
    return {
      candidateId: it.candidateId,
      revision: it.revision,
      auditContentHash: it.auditContentHash,
      qualityOverall: it.qualityOverall,
      readyForHumanReview: it.readyForHumanReview,
      readyForFormalImport: false,
      checks,
    }
  })
  writeFileSync(
    join(batchDir, 'human_review_checklist.json'),
    `${JSON.stringify(
      {
        batchId: E2A_TARGET_BATCH,
        phase: 'PHASE_E2A',
        items: checklistRows,
        checklist: checklistRows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  return { batchId: E2A_TARGET_BATCH, items, fixLog }
}

async function main() {
  const { batchId, items } = await runPhaseE2aRevise()
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        batchId,
        count: items.length,
        readyForHumanReview: items.map((i) => ({
          id: i.candidateId,
          ready: i.readyForHumanReview,
          overall: i.qualityOverall,
          qualityBlockers: (i.blockerClassification as { QUALITY_BLOCKERS: unknown[] })
            ?.QUALITY_BLOCKERS?.length,
          publishBlockers: (
            i.blockerClassification as { PUBLISH_ELIGIBILITY_BLOCKERS: unknown[] }
          )?.PUBLISH_ELIGIBILITY_BLOCKERS?.length,
        })),
      },
      null,
      2,
    ),
  )
}

if (require.main === module) {
  main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
}
