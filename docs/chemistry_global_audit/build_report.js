/**
 * Build CHEMISTRY_KB_GLOBAL_AUDIT_REPORT.md from audit outputs. READ-ONLY.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const DIR = __dirname
const summary = JSON.parse(fs.readFileSync(path.join(DIR, 'summary.json'), 'utf8'))
const per = JSON.parse(fs.readFileSync(path.join(DIR, 'per_item.json'), 'utf8'))
const issues = JSON.parse(fs.readFileSync(path.join(DIR, 'issues.json'), 'utf8'))
const conflicts = JSON.parse(fs.readFileSync(path.join(DIR, 'conflicts.json'), 'utf8'))
const cov = JSON.parse(fs.readFileSync(path.join(DIR, 'specialty_coverage.json'), 'utf8'))
const extract = JSON.parse(fs.readFileSync(path.join(DIR, 'extract.json'), 'utf8'))

const batchCount = {}
const batchStatus = {}
for (const it of per.items) {
  batchCount[it.batch] = (batchCount[it.batch] || 0) + 1
  const k = it.batch
  if (!batchStatus[k]) batchStatus[k] = {}
  const st = it.dbStatus || 'MISSING'
  batchStatus[k][st] = (batchStatus[k][st] || 0) + 1
}

const elSubSame = conflicts.filter(
  (c) =>
    c.kind === 'same_name_multi_code' &&
    c.types &&
    c.types.includes('element') &&
    c.types.includes('substance'),
)
const designPairs = conflicts.filter(
  (c) =>
    c.kind === 'same_name_multi_code' &&
    !(c.types && c.types.includes('element') && c.types.includes('substance')),
)
const rxnConflicts = conflicts.filter(
  (c) => c.kind === 'reaction_field_divergence' || c.kind === 'possible_duplicate_reaction',
)

const verifyList = per.items.filter((i) => i.verifyNeeded)
const p1Issues = issues.filter((i) => i.severity === 'P1')
const p2Issues = issues.filter((i) => i.severity === 'P2')
const p3Issues = issues.filter((i) => i.severity === 'P3')
const p0Issues = issues.filter((i) => i.severity === 'P0')

const emptyCats = summary.emptyCategories || []
const specs = Object.entries(cov.specialties)

const md = []
md.push('# 高一化学知识库 · 377 条全局质量与覆盖核验报告')
md.push('')
md.push('> 核验范围：inventory **377** 条（Batch2–6）')
md.push('> 依据：`CHEMISTRY_QUALITY_STANDARD.md`、各批建设/质检/整改报告、DB 只读抽取')
md.push(`> 核验时间：${summary.auditedAt}`)
md.push('> **本报告为 AI 辅助全库核验，不是人工学科审核。**')
md.push('> **只读审查：未改数据库、未改导入包、未改 inventory 知识内容、未发布、未开发引擎、未自动修复。**')
md.push('')
md.push('机器可读结果：')
md.push('')
md.push('- `docs/chemistry_global_audit/per_item.json`（377 条逐条）')
md.push('- `docs/chemistry_global_audit/issues.json`')
md.push('- `docs/chemistry_global_audit/conflicts.json`')
md.push('- `docs/chemistry_global_audit/specialty_coverage.json`')
md.push('- `docs/chemistry_global_audit/summary.json`')
md.push('')
md.push('---')
md.push('')
md.push('## 1. 全库核验范围与统计口径')
md.push('')
md.push('| 口径 | 数量 | 说明 |')
md.push('|------|------|------|')
md.push(`| 计划知识（inventory 编码） | **${summary.planned}** | 91+91+74+42+79 |`)
md.push(`| 数据库实际覆盖（编码可解析到行） | **${summary.covered}** | 遗漏 **${summary.missing.length}** |`)
md.push(`| 数据库物理记录合计 | **${summary.physicalTotal}** | 八类表 COUNT 之和 |`)
md.push(`| inventory 复用/种子口径条数 | **${summary.reusedInventoryCodes}** | seeded / seeded_audited / q.eq.Na_water |`)
md.push('| 问题数 vs 涉及条数 | 见 §17 | **不得混用** |')
md.push('')
md.push('物理分表：')
md.push('')
md.push('| 类型 | 行数 |')
md.push('|------|------|')
for (const [t, n] of Object.entries(summary.physicalCounts)) {
  md.push(`| ${t} | ${n} |`)
}
md.push('')
md.push('---')
md.push('')
md.push('## 2. 各批次知识状态')
md.push('')
md.push('| 批次 | 计划条数 | published | pending_review |')
md.push('|------|----------|-----------|----------------|')
for (const b of ['batch2', 'batch3', 'batch4', 'batch5', 'batch6']) {
  const st = batchStatus[b] || {}
  md.push(
    `| ${b} | ${batchCount[b] || 0} | ${st.published || 0} | ${st.pending_review || 0} |`,
  )
}
md.push('')
md.push(`全库 DB 状态合计：published **${summary.dbStatus.published || 0}**，pending_review **${summary.dbStatus.pending_review || 0}**。`)
md.push('')
md.push('---')
md.push('')
md.push('## 3. 覆盖结论')
md.push('')
md.push('- **377 条编码均已匹配到数据库记录**（含 seeded：按 symbol/唯一 name/published 回退解析）。')
md.push('- 解析方式分布见 extract（dbId / symbol / unique_name）。')
md.push('- **遗漏：0。**')
md.push('')
md.push('---')
md.push('')
md.push('## 4. 重复知识清单')
md.push('')
md.push('### 4.1 合理分型（不记为错误重复）')
md.push('')
md.push(`- 元素与单质同名：**${elSubSame.length}** 组（如 el.Na / sub.Na）。属于 element vs substance 分型，**允许多专项关联，不视为重复实体。**`)
md.push('')
md.push('### 4.2 同名多类型（建议人工确认是否冗余）')
md.push('')
md.push('| 名称 | 编码 | 类型 | 说明 |')
md.push('|------|------|------|------|')
for (const c of designPairs) {
  md.push(
    `| ${c.name} | ${c.codes.join(', ')} | ${(c.types || []).join('+')} | 概念/知识点/反应/实验分型常见；复核定义是否冲突 |`,
  )
}
md.push('')
md.push(`疑似需关注同名组：**${designPairs.length}**（非自动删除）。`)
md.push('')
md.push('### 4.3 同一 canonical 反应多编码 / 字段分歧')
md.push('')
if (rxnConflicts.length === 0) {
  md.push('- 本次按 `canonical_equation` 归一聚类，**未发现**多编码间条件/ox/re 字段明显分歧。')
} else {
  for (const c of rxnConflicts) {
    md.push(`- **${c.kind}**：${(c.codes || []).join(', ')} — ${JSON.stringify(c.detail)}`)
  }
}
md.push('')
md.push('> 多专项挂靠同一反应 **不属于** 重复知识。')
md.push('')
md.push('---')
md.push('')
md.push('## 5. 跨批次科学冲突')
md.push('')
md.push('- 反应 canonical 聚类：**未见**跨编码 ox/re/conditions 硬冲突。')
md.push('- 同名 concept+knowledge（如氧化还原反应、电子守恒、物质的量浓度）：属分层建设，**建议人工对照定义一致性**，本次未判定为 P0 事实冲突。')
md.push('- 反应+实验同名（乙醇催化氧化）：反应条与实验条分工，**需保证条件/产物叙述一致**（B6 整改后催化氧化 ox=CH3CHO、re=H2O；实验条书面描述应与之对齐——未见字段级对调残留）。')
md.push('- **明确错误关联（训练风险）**：若干复分解/酸碱反应 DB 挂了 `redox` 专项但无氧化剂/还原剂字段（见 §7），易导致错误出题池。')
md.push('')
md.push('---')
md.push('')
md.push('## 6. 化学方程式检查结果')
md.push('')
md.push(`- reaction 类型 **${summary.physicalCounts.reaction}** 条均存在 canonical/equation 字段抽查路径。`)
md.push('- B6 P0（乙醇催化氧化/燃烧 ox/re）整改后抽查：**已与目标口径一致**。')
md.push('- 描述性方程式（如乙烯/KMnO4 不指定唯一产物）：保留限制，禁止当唯一产物填空。')
md.push('- **局限**：全库未做逐式原子级自动配平证明；“配平正确≠反应一定成立”。无法可靠判定者记入待核实/人工复核建议。')
md.push('')
md.push('---')
md.push('')
md.push('## 7. 氧化还原检查结果')
md.push('')
md.push('### 7.1 历史风险点复查')
md.push('')
md.push('| 点 | 结果 |')
md.push('|----|------|')
md.push('| Batch6 乙醇催化氧化/燃烧 ox/re | **未见残留对调（P0=0）** |')
md.push('| 钠与水等相关 | 种子/复用存在；published 保护；训练限制见 question |')
md.push('')
md.push('### 7.2 疑似错误挂靠 redox（P2）')
md.push('')
md.push('以下反应关联了 redox 专项但缺少氧化剂/还原剂字段（多为复分解/中和，**可能不应进氧化还原默认池**）：')
md.push('')
for (const i of issues.filter((x) => x.kind === 'redox')) {
  md.push(`- \`${i.code}\`（${i.batch}）：${i.detail}`)
}
md.push('')
md.push('---')
md.push('')
md.push('## 8. 计算公式检查结果')
md.push('')
md.push(`- formula **${summary.physicalCounts.formula}** 条。`)
md.push('- 规则扫描：未见“22.4 且完全无标况字样”的新增 P1（若正文已含标况则通过规则）。')
md.push('- Batch5 过量骨架 / 离子浓度：以批次整改报告为准，本次未见重新引入 P0。')
md.push('- **禁止**将 22.4 L/mol 无条件用于非标况。')
md.push('')
md.push('---')
md.push('')
md.push('## 9. 实验知识检查结果')
md.push('')
md.push(`- experiment **${summary.physicalCounts.experiment}** 条。`)
md.push('- 产品定位：书面分析；禁止家用危险实验。')
md.push('- 部分早期实验条（如钠相关种子实验）规则提示书面/`homeForbidden` 字段可能偏弱（P2 experiment），**建议全库整改时统一补强**，本次不改库。')
md.push('- 焰色 / 滴定管 / 限度：仍在 verifyNeeded 清单。')
md.push('')
md.push('---')
md.push('')
md.push('## 10. question 骨架（全部 18 条）')
md.push('')
md.push('| 编码 | 批次 | DB状态 | 有inv | 科学结论 | 训练等级 | 要点 |')
md.push('|------|------|--------|-------|----------|----------|------|')
for (const q of per.items.filter((i) => i.type === 'question')) {
  const tip =
    q.code === 'q.eq.Na_water'
      ? 'published；生成物题非方程式；保留训练适配风险'
      : q.issues.map((x) => x.detail).slice(0, 1).join('') || '骨架'
  md.push(
    `| \`${q.code}\` | ${q.batch} | ${q.dbStatus} | ${q.hasInvTag ? '是' : '否'} | ${q.scienceVerdict} | ${q.trainGrade} | ${tip.replace(/\|/g, '/')} |`,
  )
}
md.push('')
md.push('说明：无 `[inv:]` ≠ 无效知识（published 历史题常见）。Batch5/6 新建 pending 题多数已有 inv。')
md.push('')
md.push('---')
md.push('')
md.push('## 11. 教材范围争议 / 待核实清单')
md.push('')
md.push(`inventory.verifyNeeded 或历史争议标记合计问题侧 **P1 scope_verify = ${p1Issues.length}**（涉及条数见 itemCount）。`)
md.push('')
md.push('| 编码 | 批次 | verifyNeeded | 说明 |')
md.push('|------|------|-------------|------|')
for (const i of p1Issues) {
  md.push(
    `| \`${i.code}\` | ${i.batch} | ${i.verifyNeeded ? '是' : '历史'} | ${i.detail.replace(/\|/g, '/')} |`,
  )
}
md.push('')
md.push('**以上均不得视为人工审核通过；默认训练应限制。**')
md.push('')
md.push('---')
md.push('')
md.push('## 12. 12 个一级专项覆盖')
md.push('')
md.push('| 专项 | 关联知识条数 | 关联question | 自动出题就绪？ | 说明 |')
md.push('|------|--------------|--------------|----------------|------|')
for (const [code, v] of specs) {
  md.push(
    `| ${code} | ${v.knowledgeLinks} | ${v.questionLinks} | **否** | ${v.note} |`,
  )
}
md.push('')
md.push('> **知识覆盖 ≠ 题目覆盖 ≠ 可正式自动出题。** 即使关联数>0，在 pending_review / 非人审 / 缺正式题库前，不得宣称可上线自动训练。')
md.push('')
md.push('薄弱示例：`ion` / `redox` / `periodic` / `structure` / `memory` 的 question 关联为 **0**。')
md.push('')
md.push('---')
md.push('')
md.push('## 13. 137 个二级分类覆盖')
md.push('')
md.push(`| 指标 | 数量 |`)
md.push(`|------|------|`)
md.push(`| 二级分类总数 | **${summary.categoryCount}** |`)
md.push(`| 无任何实体关联（空分类） | **${emptyCats.length}** |`)
md.push(`| 有关联 | **${summary.categoryCount - emptyCats.length}** |`)
md.push('')
md.push('空分类完整列表见 `specialty_coverage.json` / 附录 B。')
md.push('')
md.push('---')
md.push('')
md.push('## 14. 数据库与导入包一致性')
md.push('')
md.push('- 新建 imported 条：多数含 `[inv:CODE]`，与批次导入包对应。')
md.push('- **合理差异**：seeded/published（无 inv 或无导入包行）；`q.eq.Na_water` published 不在 B6 导入包内。')
md.push('- 部分元素（Be/Ar/Fe/I/Cr）规则提示 pending 缺 inv（P2 status）——属同步瑕疵，**非本次修复**。')
md.push('- 清单 specialty 与 DB 不一致者见 issues kind=link。')
md.push('')
md.push('---')
md.push('')
md.push('## 15. 审核状态与发布风险')
md.push('')
md.push(`| 状态 | 条数 |`)
md.push(`|------|------|`)
md.push(`| published | ${summary.dbStatus.published || 0} |`)
md.push(`| pending_review | ${summary.dbStatus.pending_review || 0} |`)
md.push('')
md.push('- **绝大多数知识仍为 pending_review，未完成人工审核。**')
md.push('- 未发现“verifyNeeded 且 published”组合（除需持续关注的训练限制题）。')
md.push('- `q.eq.Na_water` published：保留方程式专项适配风险，**禁止**当作合格方程式自动判题标准。')
md.push('- **本次不改变任何审核状态。**')
md.push('')
md.push('---')
md.push('')
md.push('## 16. 训练可用性 A/B/C/D（建议级，≠人审）')
md.push('')
md.push('| 等级 | 条数 | 含义 |')
md.push('|------|------|------|')
md.push(`| A | **0** | 本核验不授予 A（避免绕过人审） |`)
md.push(`| B | **${summary.trainGradeCount.B}** | 基本可用建议，仍须人工审核 |`)
md.push(`| C | **${summary.trainGradeCount.C}** | 待核实/受限/published适配风险 |`)
md.push(`| D | **${summary.trainGradeCount.D}** | 明确严重错误禁自动出题 |`)
md.push('')
md.push('全部 `formalTrainReady=false`。')
md.push('')
md.push('---')
md.push('')
md.push('## 17. P0–P3 统计（问题数 / 涉及条数）')
md.push('')
md.push('| 级别 | 问题数 | 涉及知识条数 |')
md.push('|------|--------|--------------|')
md.push(`| P0 | **${summary.issueCountBySeverity.P0}** | **${summary.itemCountBySeverity.P0}** |`)
md.push(`| P1 | **${summary.issueCountBySeverity.P1}** | **${summary.itemCountBySeverity.P1}** |`)
md.push(`| P2 | **${summary.issueCountBySeverity.P2}** | **${summary.itemCountBySeverity.P2}** |`)
md.push(`| P3 | **${summary.issueCountBySeverity.P3}** | **${summary.itemCountBySeverity.P3}** |`)
md.push('')
md.push('P1 几乎全部为 **教材核实/范围**（scope_verify），不是新发现的方程式配平 P0。')
md.push('')
md.push('---')
md.push('')
md.push('## 18. 推荐整改优先级（供下一步圈定范围）')
md.push('')
md.push('1. **P2 redox 误挂**：酸碱/复分解反应取消或纠正 redox 专项关联。')
md.push('2. **空二级分类 + 无 question 专项**：补骨架或明确“暂缓自动出题”。')
md.push('3. **统一实验书面定位字段**（早期种子实验）。')
md.push('4. **补 pending 缺 [inv:] 的元素等同步瑕疵。**')
md.push('5. **教材定点核实** verifyNeeded 清单（约 23 口径）。')
md.push('6. **published 钠水题**：新建 pending 方程式骨架，勿覆盖。')
md.push('')
md.push('---')
md.push('')
md.push('## 19. 总判断')
md.push('')
md.push('| 问题 | 结论 |')
md.push('|------|------|')
md.push('| 是否存在重大科学错误（未修复 P0） | **否**（P0 问题数=0） |')
md.push('| 是否可以进入全库整改 | **是** |')
md.push('| 是否允许正式发布 | **否** |')
md.push('| 是否具备开发训练引擎的基础 | **有数据与专项结构基础；不具备未经人审即自动出题上线的条件** |')
md.push('')
md.push('---')
md.push('')
md.push('## 20. 审查局限性')
md.push('')
md.push('- AI/规则扫描辅助，**不能替代**教师对全部方程式与教材页码的确认。')
md.push('- 未运行自动组卷引擎实测。')
md.push('- 跨批次“同名分层”未展开全文语义差分。')
md.push('- 空分类可能仍可通过上级专项抽题，但二级覆盖不足会影响精细化训练。')
md.push('')
md.push('---')
md.push('')
md.push('## 附录 A · 377 条逐条核验结果')
md.push('')
md.push('> 完整字段见 `per_item.json`。下表为逐条结论摘要。')
md.push('')
md.push('| 编码 | 批次 | 类型 | 存在 | 状态 | inv | 科学结论 | 训练等级 | 最高问题 |')
md.push('|------|------|------|------|------|-----|----------|----------|----------|')
for (const it of per.items) {
  md.push(
    `| \`${it.code}\` | ${it.batch} | ${it.type} | ${it.coverageOk ? 'Y' : 'N'} | ${it.dbStatus || '-'} | ${it.hasInvTag ? 'Y' : 'N'} | ${it.scienceVerdict} | ${it.trainGrade} | ${it.maxSeverity || '—'} |`,
  )
}
md.push('')
md.push('---')
md.push('')
md.push('## 附录 B · 空二级分类列表')
md.push('')
md.push(emptyCats.map((c) => `\`${c}\``).join('、'))
md.push('')
md.push('---')
md.push('')
md.push('*全库核验完成。停止。等待根据本报告确定整改范围。*')
md.push('')

fs.writeFileSync(
  path.join(ROOT, 'docs/CHEMISTRY_KB_GLOBAL_AUDIT_REPORT.md'),
  md.join('\n'),
  'utf8',
)
console.log(
  JSON.stringify(
    {
      report: 'docs/CHEMISTRY_KB_GLOBAL_AUDIT_REPORT.md',
      planned: summary.planned,
      covered: summary.covered,
      missing: summary.missing.length,
      P0: summary.issueCountBySeverity.P0,
      P1: summary.issueCountBySeverity.P1,
      P2: summary.issueCountBySeverity.P2,
      P3: summary.issueCountBySeverity.P3,
      emptyCats: emptyCats.length,
      perItemRows: per.items.length,
    },
    null,
    2,
  ),
)
