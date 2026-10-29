/**
 * POST_STEP_13 PHASE_E2-B4：E1 正式候选科学一致性修订 + 重质检。
 * pnpm --filter api run chem:industrial-phase-e2b4-revise
 *
 * - 经 patchIndustrialReview / recheckIndustrialReviewQuality 工作流
 * - 保留 candidateId / e1BatchId；写 revisionHistory；使人审与旧质检失效
 * - 不改案例 fixture；不伪造 verified；不 approve；不开 real publish；不写 DB
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  E2A_CANDIDATE_IDS,
  E2A_TARGET_BATCH,
} from './industrial-phase-e2a-revise'
import {
  loadIndustrialReviewRecord,
  saveIndustrialReviewRecord,
} from './industrial-review.store'
import {
  patchIndustrialReview,
  recheckIndustrialReviewQuality,
} from './industrial-review.service'
import { isIndustrialFormalRealPublishEnabled } from './industrial-formal-publish.config'
import type { IndustrialReviewPatchInput } from './industrial-review.types'

export { E2A_CANDIDATE_IDS as E2B4_CANDIDATE_IDS, E2A_TARGET_BATCH as E2B4_TARGET_BATCH }

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

type ReviseAction =
  | {
      candidateId: string
      seq: number
      decision: 'REVISED'
      changeReasons: string[]
      scientificBasis: string
      patch: Omit<IndustrialReviewPatchInput, 'expectedRevision'>
      /** 可选：修订后更新 kbBindingPlan / sourceBasis（不改案例） */
      afterMeta?: (rec: Record<string, unknown>) => void
    }
  | {
      candidateId: string
      seq: number
      decision: 'NO_CHANGE_REQUIRED'
      changeReasons: string[]
      scientificBasis: string
    }

function buildActions(): ReviseAction[] {
  return [
    {
      candidateId: 'cand_63284abdddf24cee',
      seq: 1,
      decision: 'REVISED',
      changeReasons: [
        '题干明确「操作①」位于混合液之后且分出滤液/滤渣，与答案「过滤」对应关系可从图读出',
        '不改流程图 Definition（保留读图考查意图）；不改变案例科学事实',
      ],
      scientificBasis:
        'salt_purification_basic 含 s2_filter；图节点 n_filter 内 answerLabel=过滤；滤液/滤渣为过滤产物',
      patch: {
        stem:
          '粗盐提纯教学流程图中，位于混合液之后、并分出「滤液」与「滤渣」的编号「操作①」，对应的单元操作名称是？\n（教学案例仍为 draft；正式发布前须人工审核）',
        explanation:
          '图中「操作①」承接混合液并分出滤液与滤渣，对应过滤（固液分离除去不溶杂质）。蒸发结晶得到晶体。本教学流程不覆盖可溶性杂质的化学除杂。',
      },
    },
    {
      candidateId: 'cand_8ce596acabc64f26',
      seq: 2,
      decision: 'REVISED',
      changeReasons: [
        '去掉「更合理/任意颠倒」比较句；改为可由图中连接唯一判定的命题',
        '不虚构气体种类、洗气液或收集方法；装置 Definition 不变',
      ],
      scientificBasis:
        '装置连接 gen1→wash1→collect1（FACT）；命题仅陈述图示顺序',
      patch: {
        stem:
          '判断：本教学装置示意图中，洗气瓶接在气体发生器与集气瓶之间（气体自发生器先进入洗气瓶，再进入集气瓶）。\n（示意图=schematic，非工程施工图；未指定具体气体与洗涤剂；案例 draft）',
        answer: true,
        explanation:
          '由图中连接（气体发生器→洗气瓶→集气瓶）可直接读出该顺序。本题只考查图示连接，不涉及具体气体、洗涤剂或收集方法选择；尾气处理等安全项可能仍为 unknown，须人工复核。',
      },
    },
    {
      candidateId: 'cand_03bf94425958444b',
      seq: 3,
      decision: 'NO_CHANGE_REQUIRED',
      changeReasons: [
        '题干明确考查过滤目的；装置图为过滤器；流程含操作①（内部为过滤）与滤液/滤渣',
        '选项与解析一致区分不溶杂质 vs 可溶杂质；无图文答案冲突',
      ],
      scientificBasis:
        '双图主题均为过滤固液分离；与 salt_purification_basic 一致',
    },
    {
      candidateId: 'cand_312c51e0c9e249f7',
      seq: 4,
      decision: 'REVISED',
      changeReasons: [
        '方案 B：海水案例与流程图均无过滤步骤，不得虚构过滤工艺',
        '题干/答案/解析改为对应图中「结晶」节点；知识点对齐案例白名单',
      ],
      scientificBasis:
        'seawater_resource_basic processSteps：蒸发浓缩→结晶；图节点含「结晶」→粗盐',
      patch: {
        stem:
          '阅读海水资源利用教学流程图，写出图中由浓缩卤水得到粗盐的单元操作名称（与图中节点标签一致）。\n（案例 draft；SOURCE_VERIFICATION_INCOMPLETE）',
        answer: '结晶',
        explanation:
          '图中浓缩卤水经「结晶」得到粗盐。本教学案例为海水蒸发制盐简化流程，不含过滤除泥沙；勿与粗盐提纯（溶解→过滤→蒸发）混淆。案例与来源仍 draft/unverified，正式发布前须人工确认。',
        knowledgePoints: ['结晶', '溶液', '蒸发', '混合物分离'],
      },
      afterMeta: (rec) => {
        rec.sourceBasis = [
          'CASE_SEAWATER_BASIC（draft / unverified）',
          '流程图节点「结晶」与案例 step 结晶析出粗盐一致（E2-B4 方案 B）',
        ]
        rec.kbBindingPlan = [
          {
            entityType: 'knowledge',
            entityId: 'pending_crystallization',
            entityName: '结晶（待管理员指定已发布 KB）',
            status: 'planned',
            reviewNoteFlags: ['human_unreviewed'],
            note: 'E2-B4：不再绑定过滤实验 #20（与本题图文不符）；正式绑定待 E2-C',
            currentLink: 'NOT_BOUND',
            adminConfirmRequired: true,
            bindWhen: 'PHASE_E2_after_human_approve_and_formal_import',
          },
        ]
      },
    },
  ]
}

export async function runPhaseE2b4Revise(opts?: {
  cwd?: string
  root?: string
}): Promise<{
  batchId: string
  revisedAt: string
  items: Record<string, unknown>[]
  fixLog: Record<string, unknown>[]
}> {
  if (isIndustrialFormalRealPublishEnabled()) {
    throw new Error('REFUSE: INDUSTRIAL_FORMAL_REAL_PUBLISH must stay OFF for E2-B4')
  }
  const cwd = opts?.cwd || apiCwd()
  const root = opts?.root || repoRoot()
  const revisedAt = new Date().toISOString()
  const actions = buildActions()
  const items: Record<string, unknown>[] = []
  const fixLog: Record<string, unknown>[] = []

  const outDir = join(
    root,
    'docs',
    'chemistry_industrial_experiment',
    'formal_candidate_batches',
    E2A_TARGET_BATCH,
  )
  mkdirSync(outDir, { recursive: true })

  for (const action of actions) {
    const prev = loadIndustrialReviewRecord(action.candidateId, cwd)
    if (!prev) throw new Error(`MISSING ${action.candidateId}`)
    const e1 = (prev as Record<string, unknown>).e1BatchId
    if (e1 !== E2A_TARGET_BATCH) {
      throw new Error(`BATCH_MISMATCH ${action.candidateId}`)
    }
    if (!E2A_CANDIDATE_IDS.includes(action.candidateId as (typeof E2A_CANDIDATE_IDS)[number])) {
      throw new Error(`NOT_E1 ${action.candidateId}`)
    }

    const before = {
      revision: prev.revision,
      auditContentHash: prev.auditContentHash,
      svgContentHash: prev.svgContentHash,
      apparatusSvgContentHash: prev.apparatusSvgContentHash || null,
      stem: prev.candidate.stem,
      answer: prev.candidate.answer,
      reviewStatus: prev.reviewStatus,
      humanDecision: prev.humanDecision,
      qualityOverall: prev.qualityReport?.overallStatus || null,
      formalPublishEligible: prev.qualityReport?.formalPublishEligible ?? null,
    }

    if (action.decision === 'NO_CHANGE_REQUIRED') {
      const snap = {
        candidateId: action.candidateId,
        seq: action.seq,
        decision: action.decision,
        changeReasons: action.changeReasons,
        scientificBasis: action.scientificBasis,
        before,
        after: before,
        flowSvgChanged: false,
        apparatusSvgChanged: false,
      }
      items.push(snap)
      fixLog.push(snap)
      continue
    }

    const patched = await patchIndustrialReview(
      action.candidateId,
      {
        expectedRevision: prev.revision,
        ...action.patch,
      },
      cwd,
    )

    // 附加元数据（kb/sourceBasis）并记 E2-B4 history 段
    let mid = loadIndustrialReviewRecord(action.candidateId, cwd)!
    const extra = mid as Record<string, unknown>
    if (action.afterMeta) action.afterMeta(extra)
    extra.phase = 'PHASE_E2B4'
    extra.phaseE2b4RevisedAt = revisedAt
    extra.formalImportBlocked = true
    extra.readyForFormalImport = false
    extra.sourceVerificationStatus = 'SOURCE_VERIFICATION_INCOMPLETE'
    const hist = Array.isArray(extra.revisionHistory)
      ? [...(extra.revisionHistory as unknown[])]
      : []
    hist.push({
      at: revisedAt,
      action: 'phase_e2b4_patch',
      phase: 'PHASE_E2B4',
      fromRevision: before.revision,
      toRevision: patched.revision,
      changeReasons: action.changeReasons,
      scientificBasis: action.scientificBasis,
      note: 'content patch; quality cleared pending recheck',
    })
    extra.revisionHistory = hist
    saveIndustrialReviewRecord(mid, cwd)

    const rechecked = await recheckIndustrialReviewQuality(action.candidateId, cwd)
    mid = loadIndustrialReviewRecord(action.candidateId, cwd)!
    const ex2 = mid as Record<string, unknown>
    const hist2 = Array.isArray(ex2.revisionHistory)
      ? [...(ex2.revisionHistory as unknown[])]
      : []
    hist2.push({
      at: new Date().toISOString(),
      action: 'phase_e2b4_recheck_quality',
      phase: 'PHASE_E2B4',
      revision: rechecked.revision,
      qualityOverall: rechecked.qualityReport?.overallStatus,
      formalPublishEligible: rechecked.qualityReport?.formalPublishEligible,
      note: 'mock AI review; humanDecision remains null',
    })
    ex2.revisionHistory = hist2
    ex2.phase = 'PHASE_E2B4'
    ex2.readyForHumanReview = true
    ex2.readyForFormalImport = false
    ex2.formalImportBlocked = true
    ex2.humanDecision = null
    saveIndustrialReviewRecord(mid, cwd)

    const after = loadIndustrialReviewRecord(action.candidateId, cwd)!
    const snap = {
      candidateId: action.candidateId,
      seq: action.seq,
      decision: action.decision,
      changeReasons: action.changeReasons,
      scientificBasis: action.scientificBasis,
      before,
      after: {
        revision: after.revision,
        auditContentHash: after.auditContentHash,
        svgContentHash: after.svgContentHash,
        apparatusSvgContentHash: after.apparatusSvgContentHash || null,
        stem: after.candidate.stem,
        answer: after.candidate.answer,
        reviewStatus: after.reviewStatus,
        humanDecision: after.humanDecision,
        qualityOverall: after.qualityReport?.overallStatus || null,
        formalPublishEligible: after.qualityReport?.formalPublishEligible ?? null,
        qualityBlocking: after.qualityReport?.blockingIssues?.length ?? null,
        qualityUnknown: after.qualityReport?.unknownIssues?.length ?? null,
      },
      flowSvgChanged: before.svgContentHash !== after.svgContentHash,
      apparatusSvgChanged:
        (before.apparatusSvgContentHash || null) !==
        (after.apparatusSvgContentHash || null),
    }
    items.push(snap)
    fixLog.push(snap)
  }

  const summary = {
    batchId: E2A_TARGET_BATCH,
    phase: 'PHASE_E2B4',
    revisedAt,
    realPublishEnabled: isIndustrialFormalRealPublishEnabled(),
    humanDecisionAllNull: true,
    caseOverlayNotTouched: true,
    formalImportNotExecuted: true,
    items,
  }
  writeFileSync(
    join(outDir, 'e2b4_revision_summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(cwd, 'var', 'industrial-review', '_phase_e2b4_latest_batch.json'),
    `${JSON.stringify(
      {
        batchId: E2A_TARGET_BATCH,
        phase: 'PHASE_E2B4',
        revisedAt,
        itemCount: items.length,
        revisedCount: items.filter((i) => i.decision === 'REVISED').length,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  return { batchId: E2A_TARGET_BATCH, revisedAt, items, fixLog }
}

async function main() {
  const result = await runPhaseE2b4Revise()
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        batchId: result.batchId,
        revisedAt: result.revisedAt,
        decisions: result.items.map((i) => ({
          id: i.candidateId,
          decision: i.decision,
          revBefore: (i.before as { revision: number }).revision,
          revAfter: (i.after as { revision: number }).revision,
          answerAfter: (i.after as { answer: unknown }).answer,
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
