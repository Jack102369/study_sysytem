/**
 * POST_STEP_13 PHASE_E1：正式候选准备（文件级；人工编写 + 程序渲染）。
 * pnpm --filter api run chem:industrial-phase-e1-prepare
 *
 * - generationSource=manual_fixture（非 Mock 冒充、非未调用却声称的 HTTP AI）
 * - developmentOnly=false（正式候选意图）但仍须人审；≠已批准/已入库
 * - 不写 chem_train_items / links / sessions
 * - 不碰 PHASE_D Mock 批次
 * - 案例保持 draft；不伪造 reviewedContentHash / published
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
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
import { projectIndustrialApparatusPublic } from './industrial-apparatus.project'
import { renderIndustrialApparatusSvg } from './industrial-apparatus-svg-renderer'
import { checkIndustrialApparatusSafety } from './industrial-apparatus-safety'
import { createIndustrialReviewRecord } from './industrial-review.service'
import { persistImmutableIndustrialSvg } from './industrial-svg-asset.service'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import { computeAuditContentHash } from './industrial-quality.hash'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'
import type { IndustrialAiCandidateQuestion } from './industrial-ai-generator.types'
import type { IndustrialDiagramDefinition } from './industrial-diagram.types'
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'
import { INDUSTRIAL_DIAGRAM_SCHEMA_VERSION } from './industrial-diagram.constants'
import { computeDiagramContentHash } from './industrial-diagram.hash'
import {
  loadIndustrialReviewRecord,
  saveIndustrialReviewRecord,
} from './industrial-review.store'

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

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function minimalFlowStubForCase(c: IndustrialCase): IndustrialDiagramDefinition {
  const draft = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: `flow_stub_${c.caseCode}`.slice(0, 48),
    caseCode: c.caseCode,
    caseVersion: c.version,
    caseContentHash: c.contentHash,
    diagramVersion: '1.0.0',
    title: '流程占位（装置主图）',
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
    reviewMetadata: { chemicallyReviewed: false, structureOnly: true },
  }
  return { ...draft, diagramContentHash: computeDiagramContentHash(draft) }
}

/** 本地已读 KB：仅仓库/DB 可读记录；不作外部 DOI/页码断言 */
const LOCAL_KB_SOURCES = {
  expFilter: {
    entityType: 'experiment',
    entityId: '20',
    entityName: '过滤操作',
    status: 'published',
    reviewNoteFlags: ['ai_trial', 'human_unreviewed', 'trial_run'],
    note: '本地 chem_experiments.id=20；published 但 review_note 含 human_unreviewed → 关联前须管理员确认',
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
    note: '本地 chem_substances.id=2（溶解溶剂教学）',
  },
} as const

type Spec = {
  seq: number
  title: string
  difficulty: 1 | 2 | 3
  qtype: 'single' | 'judge' | 'blank'
  categoryCode: string
  industrialCase: IndustrialCase
  definition: IndustrialDiagramDefinition
  apparatus: IndustrialApparatusDefinition | null
  stem: string
  options: string[] | null
  answer: string | boolean
  explanation: string
  knowledgePoints: string[]
  diagramKinds: Array<'flow' | 'apparatus'>
  sourceBasis: string[]
  humanTodos: string[]
  kbPlanRefs: Array<keyof typeof LOCAL_KB_SOURCES>
}

async function main() {
  const cwd = apiCwd()
  const root = repoRoot()
  const now = new Date()
  const batchId = `industrial_formal_candidate_${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
  const codePrefix = `ifc_${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`

  const specs: Spec[] = [
    {
      seq: 1,
      title: '粗盐提纯·过滤识读（正式候选准备）',
      difficulty: 1,
      qtype: 'single',
      categoryCode: 'flow_diagram_read',
      industrialCase: CASE_SALT_PURIFICATION,
      definition: buildSaltPurificationDiagram(),
      apparatus: null,
      stem:
        '粗盐提纯教学流程图中，用于除去不溶性杂质的关键操作是？\n（PHASE_E1 正式候选准备；案例仍为 draft，待人工审核；依据本地已发布实验「过滤操作」）',
      options: ['过滤', '电解', '焰色反应', '中和滴定'],
      answer: '过滤',
      explanation:
        '过滤实现固液分离，除去泥沙等不溶杂质。蒸发结晶得到晶体；本教学流程不覆盖可溶性杂质化学除杂。',
      knowledgePoints: ['过滤', '溶解', '蒸发'],
      diagramKinds: ['flow'],
      sourceBasis: [
        'CASE_SALT_PURIFICATION（仓库 fixture；reviewStatus=draft；source verificationStatus=unverified）',
        LOCAL_KB_SOURCES.expFilter.note,
        LOCAL_KB_SOURCES.expDissolve.note,
        '高一实验基础操作常识：过滤/溶解/蒸发（未绑定具体教材页码；禁止虚构页码）',
      ],
      humanTodos: [
        '确认题干与流程图「操作①」语义一致',
        '确认答案「过滤」与解析无误',
        '确认案例来源是否足以支持正式发布',
        '确认 KB experiment#20/#19 与本题考查点相关',
      ],
      kbPlanRefs: ['expFilter', 'expDissolve', 'substanceWater'],
    },
    {
      seq: 2,
      title: '气体洗涤装置流向判断',
      difficulty: 1,
      qtype: 'judge',
      categoryCode: 'industrial_apparatus_analysis',
      industrialCase: CASE_GAS_WASH_TEACHING,
      definition: minimalFlowStubForCase(CASE_GAS_WASH_TEACHING),
      apparatus: APP_GAS_PURIFY_COLLECT,
      stem:
        '判断：教学装置示意图中，气体先经洗气再收集的示意，比「任意颠倒连接且忽略导管插入」更合理。\n（PHASE_E1；示意图非工程施工图；依据本地知识点「气体的洗涤与干燥」）',
      options: null,
      answer: true,
      explanation:
        '气体洗涤与干燥教学要求注意气路顺序与导管浸入情况；本图为 schematic。装置安全规则仍可能标 unknown，须人工复核。',
      knowledgePoints: ['气体洗涤', '干燥', '收集'],
      diagramKinds: ['apparatus', 'flow'],
      sourceBasis: [
        LOCAL_KB_SOURCES.kpGasWash.note,
        'CASE_GAS_WASH_TEACHING（draft / unverified）',
        'APP_GAS_PURIFY_COLLECT fixture（教学示意；chemicallyReviewed=false）',
      ],
      humanTodos: [
        '核对洗气瓶/收集装置连接与气路',
        '核对判断题答案与解析',
        '复核倒吸/导管插入等安全 unknown',
        '确认 knowledge#61 关联合理',
      ],
      kbPlanRefs: ['kpGasWash'],
    },
    {
      seq: 3,
      title: '提纯流程+过滤装置双图综合',
      difficulty: 2,
      qtype: 'single',
      categoryCode: 'industrial_separation_purification',
      industrialCase: CASE_SALT_PURIFICATION,
      definition: buildSaltPurificationDiagram(),
      apparatus: APP_FILTER,
      stem:
        '同时给出粗盐提纯流程与过滤装置示意时，过滤的主要目的是？\n（PHASE_E1 双图正式候选准备）',
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
      diagramKinds: ['flow', 'apparatus'],
      sourceBasis: [
        LOCAL_KB_SOURCES.expFilter.note,
        'CASE_SALT_PURIFICATION + APP_FILTER fixtures',
      ],
      humanTodos: [
        '确认双图与题干一致、无矛盾',
        '确认装置端口连接合理',
        '确认难度 2 是否合适',
        '确认拟绑定 KB 相关性',
      ],
      kbPlanRefs: ['expFilter', 'expDissolve'],
    },
    {
      seq: 4,
      title: '海水资源流程·固液分离填空',
      difficulty: 2,
      qtype: 'blank',
      categoryCode: 'industrial_production_cases',
      industrialCase: CASE_SEAWATER_BASIC,
      definition: buildSeawaterDiagram(),
      apparatus: null,
      stem:
        '阅读海水资源利用教学流程图，写出图中用于固液分离的核心单元操作名称。\n（PHASE_E1；案例 draft；答案以图示与基础操作为准）',
      options: null,
      answer: '过滤',
      explanation:
        '教学流程中固液分离常用过滤。案例与来源尚未正式科学审核，正式发布前必须人工确认图文与答案。',
      knowledgePoints: ['过滤', '溶液', '蒸发', '混合物分离'],
      diagramKinds: ['flow'],
      sourceBasis: [
        'CASE_SEAWATER_BASIC fixture（draft/unverified）',
        LOCAL_KB_SOURCES.expFilter.note,
      ],
      humanTodos: [
        '核对流程图是否确实考查「过滤」',
        '核对 blank 判题别名需求',
        '确认海水案例是否适合正式发布',
        'SOURCE_VERIFICATION_INCOMPLETE：无外部教材页码核验',
      ],
      kbPlanRefs: ['expFilter'],
    },
  ]

  const batchDir = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'formal_candidate_batches',
    batchId,
  )
  mkdirSync(batchDir, { recursive: true })

  const items: Record<string, unknown>[] = []
  const humanChecklist: Record<string, unknown>[] = []

  for (const spec of specs) {
    const plannedCode = `${codePrefix}_${pad2(spec.seq)}`
    if (plannedCode.length > 64) throw new Error(`CODE_TOO_LONG ${plannedCode.length}`)

    const flowPub = projectIndustrialDiagramPublic(spec.definition)
    const flowRendered = renderIndustrialDiagramSvg(flowPub)

    const candidate: IndustrialAiCandidateQuestion = {
      qtype: spec.qtype,
      answerType: spec.qtype,
      stem: spec.stem,
      options: spec.options,
      answer: spec.answer,
      explanation: spec.explanation,
      knowledgePoints: spec.knowledgePoints,
      difficulty: spec.difficulty,
      requiresManualReview: true,
      referencedNodeIds: spec.definition.nodes
        .filter((n) => n.type === 'unknown')
        .map((n) => n.id),
      referencedLabels: spec.definition.nodes.map((n) => n.displayLabel).slice(0, 8),
    }

    let apparatusSvg: string | null = null
    let apparatusHash: string | null = null
    let apparatusRel: string | null = null
    let apparatusDef: IndustrialApparatusDefinition | null = null
    let apparatusPub = null
    let apparatusSafety = null

    if (spec.apparatus) {
      apparatusDef = spec.apparatus
      apparatusPub = projectIndustrialApparatusPublic(spec.apparatus)
      const ar = renderIndustrialApparatusSvg(apparatusPub)
      apparatusSvg = ar.svg
      const persisted = persistImmutableIndustrialSvg(ar.svg, cwd)
      apparatusHash = persisted.contentHash
      apparatusRel = persisted.relativePath
      apparatusSafety = checkIndustrialApparatusSafety(spec.apparatus)
    }

    const record = createIndustrialReviewRecord(
      {
        generationTaskId: `${batchId}_${pad2(spec.seq)}`,
        generationSource: 'manual_fixture',
        developmentOnly: false,
        specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
        categoryCode: spec.categoryCode,
        industrialCase: spec.industrialCase,
        candidate,
        definition: spec.definition,
        publicDiagram: flowPub,
        svg: flowRendered.svg,
        renderReport: flowRendered.renderReport,
        qualityReport: null,
      },
      cwd,
    )

    const quality = await checkIndustrialCandidateQuality(
      {
        candidateId: record.candidateId,
        developmentOnly: false,
        categoryCode: spec.categoryCode,
        industrialCase: spec.industrialCase,
        candidate,
        definition: spec.definition,
        publicDiagram: flowPub,
        svg: record.svg,
        renderReport: flowRendered.renderReport,
        apparatusDefinition: apparatusDef || undefined,
      },
      { useMockAiReviewer: true, writeReport: false, enableAiReview: true },
    )

    const full = loadIndustrialReviewRecord(record.candidateId, cwd)!
    full.qualityReport = quality
    full.reviewStatus = 'pending_human_review'
    full.humanDecision = null
    full.humanReviewedBy = null
    full.humanReviewedAt = null
    full.humanReviewedAuditHash = null
    full.importedItemCode = null
    full.importedAt = null
    ;(full as Record<string, unknown>).e1BatchId = batchId
    ;(full as Record<string, unknown>).phase = 'PHASE_E1'
    ;(full as Record<string, unknown>).plannedItemCode = plannedCode
    ;(full as Record<string, unknown>).formalCandidateIntent = true
    ;(full as Record<string, unknown>).formalImportBlocked =
      !quality.formalPublishEligible ||
      full.caseReviewStatus === 'draft' ||
      quality.requiresHumanReview
    ;(full as Record<string, unknown>).diagramKinds = spec.diagramKinds
    ;(full as Record<string, unknown>).sourceBasis = spec.sourceBasis
    ;(full as Record<string, unknown>).sourceVerificationStatus =
      'SOURCE_VERIFICATION_INCOMPLETE'
    ;(full as Record<string, unknown>).sourceVerificationNote =
      '仅依据仓库 fixture + 本地 DB published 实体；未做外部教材页码/DOI 核验；KB 实体 review_note 可能含 human_unreviewed'

    if (apparatusDef && apparatusSvg && apparatusHash && apparatusRel) {
      full.apparatusDefinition = apparatusDef
      full.apparatusPublic = apparatusPub
      full.apparatusSvg = apparatusSvg.endsWith('\n') ? apparatusSvg : `${apparatusSvg}\n`
      full.apparatusSvgContentHash = apparatusHash
      full.apparatusSvgRelativePath = apparatusRel
      full.apparatusSafety = apparatusSafety
    }

    full.auditContentHash = computeAuditContentHash({
      industrialCase: spec.industrialCase,
      candidate,
      definition: spec.definition,
      publicDiagram: flowPub,
      apparatusContentHash: apparatusDef?.apparatusContentHash || null,
      apparatusPublicContentHash: apparatusPub?.publicContentHash || null,
    })
    full.updatedAt = new Date().toISOString()
    saveIndustrialReviewRecord(full, cwd)

    const kbPlan = spec.kbPlanRefs.map((k) => ({
      ...LOCAL_KB_SOURCES[k],
      currentLink: 'NOT_BOUND',
      bindWhen: 'PHASE_E2_after_human_approve_and_formal_import',
      adminConfirmRequired: true,
    }))

    const itemMeta = {
      batchId,
      seq: spec.seq,
      candidateId: full.candidateId,
      plannedItemCode: plannedCode,
      title: spec.title,
      qtype: spec.qtype,
      difficulty: spec.difficulty,
      categoryCode: spec.categoryCode,
      specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
      caseCode: spec.industrialCase.caseCode,
      caseReviewStatus: spec.industrialCase.reviewStatus,
      generationSource: full.generationSource,
      developmentOnly: full.developmentOnly,
      reviewStatus: full.reviewStatus,
      humanDecision: full.humanDecision,
      qualityOverall: quality.overallStatus,
      qualityBlocking: quality.blockingIssues.length,
      qualityUnknown: quality.unknownIssues.length,
      requiresHumanReview: quality.requiresHumanReview,
      formalPublishEligible: quality.formalPublishEligible,
      readyForFormalImport: false,
      readyForFormalImportBlockers: [
        'HUMAN_REVIEW_PENDING',
        'CASE_DRAFT_OR_UNTRUSTED',
        quality.formalPublishEligible ? null : `QUALITY:${quality.overallStatus}`,
        'SOURCE_VERIFICATION_INCOMPLETE',
        'KB_NOT_BOUND',
      ].filter(Boolean),
      flowSvgContentHash: full.svgContentHash,
      flowSvgRelativePath: full.svgRelativePath,
      apparatusSvgContentHash: apparatusHash,
      apparatusSvgRelativePath: apparatusRel,
      diagramKinds: spec.diagramKinds,
      sourceBasis: spec.sourceBasis,
      kbBindingPlan: kbPlan,
      dbTrainItemId: 'NOT_CREATED',
      dbAssetIds: 'NOT_CREATED',
      dbKbLinkIds: 'NOT_BOUND',
      pool: 'NOT_WRITTEN',
      createdAt: full.createdAt,
    }
    writeFileSync(
      join(batchDir, `${pad2(spec.seq)}_${full.candidateId}.meta.json`),
      `${JSON.stringify(itemMeta, null, 2)}\n`,
      'utf8',
    )
    writeFileSync(join(batchDir, `${pad2(spec.seq)}_flow.svg`), full.svg, 'utf8')
    if (apparatusSvg) {
      writeFileSync(
        join(batchDir, `${pad2(spec.seq)}_apparatus.svg`),
        apparatusSvg.endsWith('\n') ? apparatusSvg : `${apparatusSvg}\n`,
        'utf8',
      )
    }

    humanChecklist.push({
      candidateId: full.candidateId,
      plannedItemCode: plannedCode,
      title: spec.title,
      checks: {
        stemCorrect: 'PENDING_HUMAN_REVIEW',
        answerCorrect: 'PENDING_HUMAN_REVIEW',
        explanationCorrect: 'PENDING_HUMAN_REVIEW',
        chemistryFacts: 'PENDING_HUMAN_REVIEW',
        caseSourceTrusted: 'PENDING_HUMAN_REVIEW',
        processStepsReasonable: 'PENDING_HUMAN_REVIEW',
        apparatusConnections: spec.apparatus
          ? 'PENDING_HUMAN_REVIEW'
          : 'N/A',
        flowDiagramCorrect: 'PENDING_HUMAN_REVIEW',
        apparatusDiagramCorrect: spec.apparatus
          ? 'PENDING_HUMAN_REVIEW'
          : 'N/A',
        safetyIssues: 'PENDING_HUMAN_REVIEW',
        diagramTextConsistency: 'PENDING_HUMAN_REVIEW',
        curriculumScope: 'PENDING_HUMAN_REVIEW',
        difficultyReasonable: 'PENDING_HUMAN_REVIEW',
        kbAssociationReasonable: 'PENDING_HUMAN_REVIEW',
        unknownItemsReviewed: 'PENDING_HUMAN_REVIEW',
        needsRevision: 'PENDING_HUMAN_REVIEW',
        adminDecision: 'PENDING_HUMAN_REVIEW',
      },
      autoQualityOverall: quality.overallStatus,
      unknownCount: quality.unknownIssues.length,
      blockingCount: quality.blockingIssues.length,
      humanTodos: spec.humanTodos,
      auditContentHash: full.auditContentHash,
      flowSvgContentHash: full.svgContentHash,
      apparatusSvgContentHash: apparatusHash,
    })

    items.push(itemMeta)
  }

  const summary = {
    batchId,
    phase: 'PHASE_E1',
    createdAt: now.toISOString(),
    generationSource: 'manual_fixture',
    note:
      'DeepSeek key may exist but E1 intentionally uses manual_fixture (curated) to avoid uncontrolled live AI cost; not claimed as HTTP AI output. PHASE_D Mock batch untouched.',
    phaseDBatchUntouched: 'industrial_acceptance_20261029_121220',
    sourceVerification: 'SOURCE_VERIFICATION_INCOMPLETE',
    readyForFormalImport: false,
    candidateCount: items.length,
    dbWrites: {
      chem_train_items: 'NOT_CREATED',
      chem_train_item_assets: 'NOT_CREATED',
      chem_train_item_links: 'NOT_BOUND',
      chem_train_sessions: 'NOT_CREATED',
    },
    items,
    localKbCatalog: LOCAL_KB_SOURCES,
  }
  writeFileSync(join(batchDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  writeFileSync(
    join(batchDir, 'human_review_checklist.json'),
    `${JSON.stringify({ batchId, items: humanChecklist }, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(cwd, 'var', 'industrial-review', `_phase_e1_latest_batch.json`),
    `${JSON.stringify({ batchId, batchDir, createdAt: now.toISOString(), itemCount: items.length }, null, 2)}\n`,
    'utf8',
  )

  console.log(JSON.stringify({ ok: true, batchId, count: items.length, batchDir }, null, 2))
  console.log('chem:industrial-phase-e1-prepare: DONE')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
