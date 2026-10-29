/**
 * PHASE_E2-B7：多模型独立审核包导出（只读；不改审核态；不写 DB）。
 */
import { createHash } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
import type { IndustrialCase } from './industrial-case.types'
import { INDUSTRIAL_CATEGORY_CODES } from './industrial-case.constants'
import { buildIndustrialAdminReviewPacket } from './industrial-admin-review-packet'
import {
  normalizeIndustrialListBatchId,
} from './industrial-review.service'
import {
  listIndustrialReviewRecords,
  loadIndustrialReviewRecord,
} from './industrial-review.store'
import type { IndustrialReviewRecord } from './industrial-review.types'
import { buildMinimalZip, sha256Hex, type ZipEntryInput } from './industrial-zip-minimal'

export const INDUSTRIAL_EXPORT_MAX_CANDIDATES = 20

function repoRootFromCwd(cwd: string): string {
  for (const r of [cwd, join(cwd, '..'), join(cwd, '..', '..')]) {
    if (existsSync(join(r, 'db', 'init.sql'))) return r
  }
  return cwd
}

function docsIndustrialDir(cwd: string): string {
  return join(repoRootFromCwd(cwd), 'docs', 'chemistry_industrial_experiment')
}

function readDoc(cwd: string, rel: string): string {
  const p = join(docsIndustrialDir(cwd), rel)
  if (!existsSync(p)) throw new Error(`EXPORT_DOC_MISSING:${rel}`)
  const raw = readFileSync(p, 'utf8')
  if (raw.length > 1.5 * 1024 * 1024) throw new Error(`EXPORT_DOC_TOO_LARGE:${rel}`)
  return raw
}

function safeBatchFileToken(batchId: string): string {
  return batchId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
}

function findCase(code: string): IndustrialCase | null {
  return ALL_CANDIDATE_CASES.find((c) => c.caseCode === code) || null
}

function loadBatchRecords(
  batchId: string,
  cwd: string,
): IndustrialReviewRecord[] {
  const norm = normalizeIndustrialListBatchId(batchId)
  if (!norm.ok) throw new Error(norm.error)
  if (!norm.batchId) throw new Error('BATCH_ID_REQUIRED')
  const bid = norm.batchId
  const rows = listIndustrialReviewRecords(cwd).filter((r) => {
    const extra = r as Record<string, unknown>
    return (
      extra.e1BatchId === bid ||
      extra.acceptanceBatchId === bid ||
      String(r.generationTaskId || '').startsWith(bid)
    )
  })
  if (rows.length === 0) throw new Error('BATCH_NOT_FOUND_OR_EMPTY')
  if (rows.length > INDUSTRIAL_EXPORT_MAX_CANDIDATES) {
    throw new Error('BATCH_TOO_MANY_CANDIDATES')
  }
  // 稳定排序：plannedItemCode → candidateId
  return [...rows].sort((a, b) => {
    const pa = String((a as any).plannedItemCode || '')
    const pb = String((b as any).plannedItemCode || '')
    if (pa && pb && pa !== pb) return pa.localeCompare(pb)
    return a.candidateId.localeCompare(b.candidateId)
  })
}

function mdEscape(s: unknown): string {
  return String(s ?? '').replace(/\r\n/g, '\n')
}

function describeFlow(record: IndustrialReviewRecord): string {
  const def = record.definition
  const lines: string[] = [
    `### 流程图结构化说明（diagramId=${def.diagramId}）`,
    '',
    `- 标题：${def.title}`,
    `- 方向：${def.orientation}`,
    `- diagramContentHash：\`${def.diagramContentHash}\``,
    `- flowSvgContentHash：\`${record.svgContentHash}\``,
    '',
    '**节点**',
    '',
  ]
  for (const n of def.nodes || []) {
    lines.push(
      `- \`${n.id}\` · type=${n.type} · label=${n.displayLabel} · role=${n.displayRole}`,
    )
  }
  lines.push('', '**边（物料/连接）**', '')
  for (const e of def.edges || []) {
    lines.push(
      `- \`${e.id}\`: ${e.from} → ${e.to} · type=${e.type}${e.displayLabel ? ` · ${e.displayLabel}` : ''}`,
    )
  }
  lines.push(
    '',
    '> 文字描述不能完全替代视觉检查。请同时打开 ZIP 内对应 `diagrams/*_flow.svg`。',
    '',
  )
  return lines.join('\n')
}

function describeApparatus(record: IndustrialReviewRecord): string {
  const def = record.apparatusDefinition
  if (!def) {
    return '### 装置图\n\n本候选无装置图（不适用或未绑定）。\n'
  }
  const lines: string[] = [
    `### 装置图结构化说明（apparatusId=${def.apparatusId}）`,
    '',
    `- 标题：${def.title}`,
    `- apparatusContentHash：\`${def.apparatusContentHash}\``,
    `- apparatusSvgContentHash：\`${record.apparatusSvgContentHash || '—'}\``,
    `- schematicDisclaimer：${(def as any).schematicDisclaimer || record.apparatusPublic?.schematicDisclaimer || '教学示意，非施工图'}`,
    '',
    '**组件**',
    '',
  ]
  for (const c of def.components || []) {
    lines.push(
      `- \`${c.componentId}\` · type=${c.componentType} · label=${c.displayLabel}`,
    )
  }
  if (def.connections?.length) {
    lines.push('', '**连接 / 气路**', '')
    for (const x of def.connections) {
      lines.push(
        `- \`${x.connectionId}\`: ${x.sourceComponentId}/${x.sourcePortId} → ${x.targetComponentId}/${x.targetPortId} · ${x.flowType}${x.displayLabel ? ` · ${x.displayLabel}` : ''}`,
      )
    }
  }
  const unknowns = record.apparatusSafety?.unknowns || []
  const blocking = record.apparatusSafety?.blocking || []
  if (unknowns.length) {
    lines.push('', '**装置 safety unknown（不得自动通过）**', '')
    for (const u of unknowns) lines.push(`- ${typeof u === 'string' ? u : JSON.stringify(u)}`)
  }
  if (blocking.length) {
    lines.push('', '**装置 safety blocking**', '')
    for (const b of blocking) lines.push(`- ${typeof b === 'string' ? b : JSON.stringify(b)}`)
  }
  lines.push(
    '',
    '> 请同时打开 ZIP 内对应 `diagrams/*_apparatus.svg`。教学示意 ≠ 工业工程设计。',
    '',
  )
  return lines.join('\n')
}

function qualitySection(record: IndustrialReviewRecord, packet: Record<string, unknown>): string {
  const q = record.qualityReport
  const fail = (packet.quality as any)?.failChecks || []
  const unk = (packet.quality as any)?.unknownChecks || []
  const lines = [
    `### 自动质检`,
    '',
    `- overallStatus：${q?.overallStatus ?? '—'}`,
    `- formalPublishEligible：${q?.formalPublishEligible ?? false}`,
    `- auditContentHash：\`${record.auditContentHash || '—'}\``,
    '',
    '**fail（含发布闸门 fail）**',
    '',
  ]
  if (!fail.length) lines.push('- （无）')
  for (const c of fail) {
    lines.push(`- \`${c.checkId || c.checkCode}\` [${c.severity || c.dimension}] ${c.message || ''}`)
  }
  lines.push('', '**unknown（≠ pass）**', '')
  if (!unk.length) lines.push('- （无）')
  for (const c of unk.slice(0, 40)) {
    lines.push(`- \`${c.checkId || c.checkCode}\` ${c.message || ''}`)
  }
  if (unk.length > 40) lines.push(`- …另有 ${unk.length - 40} 条`)
  lines.push('')
  return lines.join('\n')
}

function candidateMarkdown(
  index: number,
  record: IndustrialReviewRecord,
  packet: Record<string, unknown>,
): string {
  const cand = record.candidate
  const industrialCase = findCase(record.caseCode)
  const opts = (cand.options || [])
    .map((o, i) => `${i + 1}. ${o}`)
    .join('\n')
  const blockers = ((packet.formalImportBlockers as string[]) || []).join(' · ')
  return [
    `# 候选 ${String(index).padStart(2, '0')} · ${record.candidateId}`,
    '',
    `| 字段 | 值 |`,
    `|------|-----|`,
    `| candidateId | ${record.candidateId} |`,
    `| revision | **${record.revision}** |`,
    `| auditContentHash | \`${record.auditContentHash || '—'}\` |`,
    `| e1BatchId | ${(record as any).e1BatchId || '—'} |`,
    `| caseCode | ${record.caseCode} |`,
    `| categoryCode | ${record.categoryCode} |`,
    `| qtype / difficulty | ${cand.qtype} / ${cand.difficulty} |`,
    `| generationSource | ${record.generationSource} |`,
    `| reviewStatus | ${record.reviewStatus} |`,
    `| humanDecision | ${record.humanDecision ?? 'null'} |`,
    `| formalImportBlockers | ${blockers || '—'} |`,
    '',
    '## 题干',
    '',
    mdEscape(cand.stem),
    '',
    '## 选项',
    '',
    opts || '（无选项 / 填空或判断）',
    '',
    '## 标准答案（供对照；请独立判断正误）',
    '',
    mdEscape(cand.answer),
    '',
    '## 解析（供对照；请独立判断严谨性）',
    '',
    mdEscape(cand.explanation),
    '',
    '## 关联案例摘要',
    '',
    industrialCase
      ? [
          `- 标题：${industrialCase.title}`,
          `- 说明：${industrialCase.description}`,
          `- fixture reviewStatus：${industrialCase.reviewStatus}`,
          `- contentHash：\`${industrialCase.contentHash}\``,
          `- 安全：${industrialCase.safetyNotes}`,
          `- 来源：`,
          ...industrialCase.sourceReferences.map(
            (s) =>
              `  - ${s.sourceTitle} · ${s.verificationStatus} · ${s.sourceDescription || ''}`,
          ),
        ].join('\n')
      : '（案例缺失）',
    '',
    describeFlow(record),
    describeApparatus(record),
    qualitySection(record, packet),
    '## KB 拟绑定（不写正式 links）',
    '',
    JSON.stringify((record as any).kbBindingPlan || packet.kbBindingPlan || [], null, 2),
    '',
    '## 外部模型填写建议',
    '',
    '请按 `review_templates/REVIEW_RESULT_SCHEMA.json` 输出本候选意见；',
    'overallRecommendation ∈ ACCEPTABLE_FOR_HUMAN_REVIEW | REVISION_RECOMMENDED | REJECT_RECOMMENDED | INSUFFICIENT_EVIDENCE。',
    'ACCEPTABLE_FOR_HUMAN_REVIEW ≠ approved_for_import。',
    '',
  ].join('\n')
}

function caseMarkdown(c: IndustrialCase): string {
  return [
    `# 案例 ${c.caseCode}`,
    '',
    `- 标题：${c.title}`,
    `- 类型：${c.caseType}`,
    `- fixture reviewStatus：**${c.reviewStatus}**（draft ≠ published）`,
    `- version / contentHash：${c.version} / \`${c.contentHash}\``,
    '',
    '## 说明',
    '',
    c.description,
    '',
    '## 学习目标',
    '',
    ...(c.learningObjectives || []).map((x) => `- ${x}`),
    '',
    '## 工艺步骤',
    '',
    ...(c.processSteps || []).map(
      (s) =>
        `- **${s.stepName}**（${s.stepId} / ${s.operationType}）：${s.purpose || s.principle || s.conditions || ''}`,
    ),
    '',
    '## 物料',
    '',
    ...(c.materials || []).map(
      (m) => `- ${m.name}（${m.materialType} / ${m.physicalState}）`,
    ),
    '',
    '## 安全',
    '',
    c.safetyNotes,
    '',
    '## 来源（fixture）',
    '',
    ...c.sourceReferences.map(
      (s) =>
        `- **${s.sourceTitle}** · status=${s.verificationStatus} · ${s.sourceDescription || ''}`,
    ),
    '',
    '## openIssues',
    '',
    ...(c.openIssues || []).map((x) => `- ${x}`),
    '',
  ].join('\n')
}

function buildFullReview(opts: {
  batchId: string
  records: IndustrialReviewRecord[]
  packets: Record<string, unknown>[]
  bundleContentHash: string
  exportedAt: string
}): string {
  const { batchId, records, packets, bundleContentHash, exportedAt } = opts
  const parts: string[] = []
  parts.push(`# 工业实验 · 多模型独立审核包（FULL_REVIEW）`)
  parts.push('')
  parts.push(`| 字段 | 值 |`)
  parts.push(`|------|-----|`)
  parts.push(`| batchId | \`${batchId}\` |`)
  parts.push(`| exportedAt | ${exportedAt} |`)
  parts.push(`| bundleContentHash | \`${bundleContentHash}\` |`)
  parts.push(`| 候选数 | ${records.length} |`)
  parts.push(`| 声明 | **本文件供外部 AI 独立审核参考；≠ 管理员批准；≠ 正式入库** |`)
  parts.push('')
  parts.push(`## 统一审核说明（请先阅读）`)
  parts.push('')
  parts.push(`1. 独立审核每道题；先形成判断，再查看其他模型意见。`)
  parts.push(`2. 不因系统原答案存在而默认答案正确。`)
  parts.push(`3. 不因自动质检 PASS / QUALITY_BLOCKERS 为空而默认科学正确。`)
  parts.push(`4. 核查题干条件是否充分、答案是否唯一、解析是否严谨。`)
  parts.push(`5. 核查流程图 / 装置图与题目一致；同时查看原始 SVG。`)
  parts.push(`6. 核查化学事实、教学简化边界、工业工艺表述、安全风险、高一适用性。`)
  parts.push(`7. 核查科学来源是否真实支持结论；不得编造外部来源或页码。`)
  parts.push(`8. 无法确认标记 unknown；区分教学示意与实际工业工程设计。`)
  parts.push(`9. 给出可操作修订建议；**不要**替管理员批准正式发布。`)
  parts.push(`10. 若 manifest.bundleContentHash 与本文件不一致，或 revision 已变 → **STALE_REVIEW**。`)
  parts.push('')
  parts.push(`## 高一化学 · 工业实验背景`)
  parts.push('')
  parts.push(`专项 code：\`industrial_experiment\`。面向高一教学示意，不是工厂施工图或工艺设计手册。`)
  parts.push(`二级分类（12）：`)
  parts.push('')
  for (const code of INDUSTRIAL_CATEGORY_CODES) {
    parts.push(`- \`${code}\``)
  }
  parts.push('')
  parts.push(`## 批次候选一览`)
  parts.push('')
  parts.push(`| # | candidateId | rev | case | qtype | answer | auditHash前缀 |`)
  parts.push(`|---|-------------|-----|------|-------|--------|---------------|`)
  records.forEach((r, i) => {
    parts.push(
      `| ${String(i + 1).padStart(2, '0')} | ${r.candidateId} | ${r.revision} | ${r.caseCode} | ${r.candidate.qtype} | ${String(r.candidate.answer).slice(0, 24)} | ${String(r.auditContentHash || '').slice(0, 12)} |`,
    )
  })
  parts.push('')

  records.forEach((r, i) => {
    parts.push(`---`)
    parts.push('')
    parts.push(candidateMarkdown(i + 1, r, packets[i]))
  })

  parts.push(`---`)
  parts.push('')
  parts.push(`## 正式发布说明`)
  parts.push('')
  parts.push(`- real publish 默认 **OFF**`)
  parts.push(`- AI 意见 ACCEPTABLE_FOR_HUMAN_REVIEW ≠ approved_for_import ≠ 正式题库已发布`)
  parts.push(`- 多模型一致 ≠ 人工批准`)
  parts.push('')
  return parts.join('\n')
}

function reviewTemplateMd(): string {
  return `# 外部模型审核结果填写模板

对每道候选复制下方块填写。先独立判断，再参与交叉比较。

\`\`\`yaml
candidateId:
revision:
auditContentHash:
modelName:
modelVersion:   # 如已知
reviewDate:
chemistryCorrectness:     # pass | fail | unknown
processCorrectness:
apparatusCorrectness:
diagramConsistency:
answerCorrectness:
explanationCorrectness:
curriculumSuitability:
sourceReliability:
safetyConcerns: []
identifiedProblems: []
suggestedChanges: []
uncertainPoints: []
overallRecommendation:    # ACCEPTABLE_FOR_HUMAN_REVIEW | REVISION_RECOMMENDED | REJECT_RECOMMENDED | INSUFFICIENT_EVIDENCE
\`\`\`

注意：ACCEPTABLE_FOR_HUMAN_REVIEW ≠ approved_for_import；不得声称 verified_by_admin。
`
}

function reviewSchemaJson(): string {
  return `${JSON.stringify(
    {
      $comment:
        'AI review opinion only; never write humanDecision / verified_by_admin / formal import',
      type: 'object',
      required: [
        'candidateId',
        'revision',
        'auditContentHash',
        'modelName',
        'overallRecommendation',
      ],
      properties: {
        candidateId: { type: 'string' },
        revision: { type: 'integer' },
        auditContentHash: { type: 'string' },
        modelName: { type: 'string' },
        modelVersion: { type: 'string' },
        reviewDate: { type: 'string' },
        chemistryCorrectness: { enum: ['pass', 'fail', 'unknown'] },
        processCorrectness: { enum: ['pass', 'fail', 'unknown'] },
        apparatusCorrectness: { enum: ['pass', 'fail', 'unknown', 'n/a'] },
        diagramConsistency: { enum: ['pass', 'fail', 'unknown'] },
        answerCorrectness: { enum: ['pass', 'fail', 'unknown'] },
        explanationCorrectness: { enum: ['pass', 'fail', 'unknown'] },
        curriculumSuitability: { enum: ['pass', 'fail', 'unknown'] },
        sourceReliability: { enum: ['pass', 'fail', 'unknown'] },
        safetyConcerns: { type: 'array', items: { type: 'string' } },
        identifiedProblems: { type: 'array', items: { type: 'string' } },
        suggestedChanges: { type: 'array', items: { type: 'string' } },
        uncertainPoints: { type: 'array', items: { type: 'string' } },
        overallRecommendation: {
          enum: [
            'ACCEPTABLE_FOR_HUMAN_REVIEW',
            'REVISION_RECOMMENDED',
            'REJECT_RECOMMENDED',
            'INSUFFICIENT_EVIDENCE',
          ],
        },
      },
    },
    null,
    2,
  )}\n`
}

function multiModelComparisonMd(bundleContentHash: string, batchId: string): string {
  return `# 多模型交叉审核记录（空白模板）

| 字段 | 值 |
|------|-----|
| batchId | \`${batchId}\` |
| expectedBundleContentHash | \`${bundleContentHash}\` |
| 规则 | 仅当模型审核的 manifest.hash 与上表一致时有效；revision/hash 变化 → **STALE_REVIEW** |

## 模型槽位（请人工填写；禁止伪造）

| modelName | version | reviewDate | fileHashReviewed | 逐题结论摘要 | 分歧 | 待管理员裁决 |
|-----------|---------|------------|------------------|--------------|------|--------------|
| ChatGPT | | | | | | |
| Claude | | | | | | |
| Gemini | | | | | | |
| DeepSeek | | | | | | |
| （其他） | | | | | | |

多模型一致 **不等于** 人工批准 / verified_by_admin / 正式发布。
`
}

function readmeMd(batchId: string, fileName: string): string {
  return `# 工业实验多模型审核包

- 批次：\`${batchId}\`
- 文件：\`${fileName}\`
- 入口：先读 \`FULL_REVIEW.md\`，再对照 \`diagrams/*.svg\` 与 \`sources/*\`。
- 把 \`FULL_REVIEW.md\`（或整包）分别交给不同 AI；要求其**独立**审核。
- 收集意见填入 \`review_templates/\`；交叉比较用 \`MULTI_MODEL_COMPARISON.md\`。
- **禁止**：将 AI 意见直接当作 humanDecision / verified_by_admin / 正式入库。
`
}

function qualitySummary(records: IndustrialReviewRecord[]): string {
  const lines = ['# 自动质检汇总', '']
  for (const r of records) {
    const q = r.qualityReport
    const fails = (q?.checks || []).filter((c) => c.status === 'fail')
    const unks = (q?.checks || []).filter((c) => c.status === 'unknown')
    lines.push(`## ${r.candidateId} (rev ${r.revision})`)
    lines.push(`- overall：${q?.overallStatus}`)
    lines.push(`- formalPublishEligible：${q?.formalPublishEligible}`)
    lines.push(`- fail=${fails.length} unknown=${unks.length}`)
    for (const f of fails) {
      lines.push(`  - FAIL \`${f.checkCode}\`: ${f.message}`)
    }
    lines.push('')
  }
  lines.push('unknown ≠ pass；fail 含可信度闸门时 ≠ 科学已证明错误。')
  lines.push('')
  return lines.join('\n')
}

function exportCandidateJson(record: IndustrialReviewRecord): string {
  // 只导出审核需要字段；剔除可能过大的无关内容已足够；SVG 另存文件
  const slim = {
    candidateId: record.candidateId,
    revision: record.revision,
    e1BatchId: (record as any).e1BatchId || null,
    plannedItemCode: (record as any).plannedItemCode || null,
    caseCode: record.caseCode,
    caseContentHash: record.caseContentHash,
    categoryCode: record.categoryCode,
    generationSource: record.generationSource,
    developmentOnly: record.developmentOnly,
    reviewStatus: record.reviewStatus,
    humanDecision: record.humanDecision,
    auditContentHash: record.auditContentHash,
    svgContentHash: record.svgContentHash,
    apparatusSvgContentHash: record.apparatusSvgContentHash || null,
    candidate: record.candidate,
    definition: record.definition,
    apparatusDefinition: record.apparatusDefinition || null,
    apparatusSafety: record.apparatusSafety || null,
    qualityReport: record.qualityReport,
    kbBindingPlan: (record as any).kbBindingPlan || null,
    sourceVerificationStatus: (record as any).sourceVerificationStatus || null,
    formalImportBlocked: (record as any).formalImportBlocked ?? null,
    updatedAt: record.updatedAt,
  }
  return `${JSON.stringify(slim, null, 2)}\n`
}

export type IndustrialReviewExportResult = {
  fileName: string
  contentType: string
  zip: Buffer
  manifest: Record<string, unknown>
  candidateIds: string[]
  revisions: number[]
  /** 导出前快照，用于确认状态未改 */
  statusSnapshot: Array<{
    candidateId: string
    revision: number
    reviewStatus: string
    humanDecision: string | null
    auditContentHash: string | null
  }>
}

export function buildIndustrialMultiModelReviewExport(
  batchIdRaw: string,
  cwd = process.cwd(),
): IndustrialReviewExportResult {
  const norm = normalizeIndustrialListBatchId(batchIdRaw)
  if (!norm.ok) throw new Error(norm.error)
  if (!norm.batchId) throw new Error('BATCH_ID_REQUIRED')
  const batchId = norm.batchId
  if (batchId.includes('..') || batchId.includes('/') || batchId.includes('\\')) {
    throw new Error('BATCH_ID_TRAVERSAL')
  }

  const records = loadBatchRecords(batchId, cwd)
  const statusSnapshot = records.map((r) => ({
    candidateId: r.candidateId,
    revision: r.revision,
    reviewStatus: r.reviewStatus,
    humanDecision: r.humanDecision,
    auditContentHash: r.auditContentHash,
  }))

  const packets = records.map((r) => buildIndustrialAdminReviewPacket(r, cwd))
  const exportedAt = new Date().toISOString()
  const token = safeBatchFileToken(batchId)
  // 文件名：去掉 industrial_formal_candidate_ 前缀过长时可保留短 token
  const short =
    token.replace(/^industrial_formal_candidate_/, '') || token
  const fileName = `industrial_review_bundle_${short}.zip`

  const entries: ZipEntryInput[] = []
  const fileHashes: Record<string, string> = {}

  const add = (path: string, data: string | Buffer) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
    entries.push({ path, data: buf })
    fileHashes[path] = sha256Hex(buf)
  }

  // candidates + diagrams
  records.forEach((r, i) => {
    const n = String(i + 1).padStart(2, '0')
    add(`candidates/candidate_${n}.md`, candidateMarkdown(i + 1, r, packets[i]))
    add(`candidates/candidate_${n}.json`, exportCandidateJson(r))
    if (!r.svg || !String(r.svg).includes('<svg')) {
      throw new Error(`FLOW_SVG_MISSING:${r.candidateId}`)
    }
    add(`diagrams/candidate_${n}_flow.svg`, r.svg)
    if (r.apparatusSvg && String(r.apparatusSvg).includes('<svg')) {
      add(`diagrams/candidate_${n}_apparatus.svg`, r.apparatusSvg)
    }
  })

  // cases
  const caseCodes = [...new Set(records.map((r) => r.caseCode))]
  for (const code of caseCodes) {
    const c = findCase(code)
    if (!c) throw new Error(`CASE_MISSING:${code}`)
    add(`cases/${code}.md`, caseMarkdown(c))
  }

  // sources from docs
  for (const rel of [
    'scientific_source_packets/SOURCE_REGISTRY.md',
    'scientific_source_packets/FACT_MATRIX.md',
    'scientific_source_packets/FACT_SOURCE_COVERAGE.md',
    'scientific_source_packets/QUESTION_EVIDENCE_MAPPING.md',
  ]) {
    const base = rel.split('/').pop()!
    add(`sources/${base}`, readDoc(cwd, rel))
  }

  add(`quality/QUALITY_SUMMARY.md`, qualitySummary(records))

  // pre-hash for templates that embed bundle hash: compute from candidate hashes + batch
  const preManifestCore = {
    batchId,
    exportedAt,
    candidates: records.map((r) => ({
      candidateId: r.candidateId,
      revision: r.revision,
      auditContentHash: r.auditContentHash,
      svgContentHash: r.svgContentHash,
      apparatusSvgContentHash: r.apparatusSvgContentHash || null,
      caseCode: r.caseCode,
      caseContentHash: r.caseContentHash,
    })),
  }
  const bundleContentHash = sha256Hex(JSON.stringify(preManifestCore))

  const fullReview = buildFullReview({
    batchId,
    records,
    packets,
    bundleContentHash,
    exportedAt,
  })
  add('FULL_REVIEW.md', fullReview)
  add('README.md', readmeMd(batchId, fileName))
  add('review_templates/REVIEW_TEMPLATE.md', reviewTemplateMd())
  add('review_templates/REVIEW_RESULT_SCHEMA.json', reviewSchemaJson())
  add(
    'review_templates/MULTI_MODEL_COMPARISON.md',
    multiModelComparisonMd(bundleContentHash, batchId),
  )

  const manifest = {
    schemaVersion: 'e2b7-1.0',
    batchId,
    exportedAt,
    fileName,
    bundleContentHash,
    candidateCount: records.length,
    caseCount: caseCodes.length,
    candidates: preManifestCore.candidates,
    files: Object.keys(fileHashes)
      .sort()
      .map((path) => ({ path, sha256: fileHashes[path] })),
    staleRule:
      'If any candidate revision/auditContentHash/svg hash changes, prior external AI reviews are STALE_REVIEW',
    securityNote:
      'Read-only export; no .env/JWT/DB secrets/student PII; AI opinions ≠ humanDecision',
    realPublishDefault: 'OFF',
  }
  add('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)

  // forbidden content scan on entry paths/names
  for (const e of entries) {
    const low = e.path.toLowerCase()
    if (
      low.includes('.env') ||
      low.includes('jwt') ||
      low.includes('password') ||
      low.includes('secret') ||
      low.includes('backup') ||
      low.includes('uploads/')
    ) {
      throw new Error(`EXPORT_FORBIDDEN_PATH:${e.path}`)
    }
  }

  const zip = buildMinimalZip(entries)

  // 再读盘确认状态未变（只读导出契约）
  for (const snap of statusSnapshot) {
    const again = loadIndustrialReviewRecord(snap.candidateId, cwd)
    if (!again) throw new Error(`EXPORT_RACE_MISSING:${snap.candidateId}`)
    if (again.revision !== snap.revision) {
      throw new Error(`EXPORT_RACE_REVISION:${snap.candidateId}`)
    }
    if (again.reviewStatus !== snap.reviewStatus) {
      throw new Error(`EXPORT_RACE_STATUS:${snap.candidateId}`)
    }
    if (again.humanDecision !== snap.humanDecision) {
      throw new Error(`EXPORT_RACE_HUMAN:${snap.candidateId}`)
    }
  }

  return {
    fileName,
    contentType: 'application/zip',
    zip,
    manifest,
    candidateIds: records.map((r) => r.candidateId),
    revisions: records.map((r) => r.revision),
    statusSnapshot,
  }
}

/** 供自检：给定旧 hash 与当前 manifest 比较 */
export function isExternalReviewStale(opts: {
  reviewedBundleContentHash: string
  currentBundleContentHash: string
}): boolean {
  return opts.reviewedBundleContentHash !== opts.currentBundleContentHash
}
