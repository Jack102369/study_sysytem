/**
 * Build second-review deliverables from checkpoint.
 *
 *   node docs/chemistry_deepseek_audit/second_review/build_second_report.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const OUT = __dirname
const ROOT_DOCS = path.resolve(__dirname, '../..')
const CHECKPOINT = path.join(OUT, '_checkpoint.json')
const INPUT = path.join(OUT, 'input_239.json')

function main() {
  if (!fs.existsSync(CHECKPOINT)) {
    console.error('missing _checkpoint.json — run second_review_runner.js first')
    process.exit(1)
  }
  const cp = JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'))
  const input = fs.existsSync(INPUT)
    ? JSON.parse(fs.readFileSync(INPUT, 'utf8'))
    : { total: 0, items: [] }

  const expectedCodes = (input.items || []).map((i) => i.code)
  const byCode = new Map((cp.results || []).map((r) => [r.code, r]))

  // ensure every expected code has a result; missing → NEEDS_VERIFICATION
  const results = []
  for (const code of expectedCodes) {
    if (byCode.has(code)) {
      results.push(byCode.get(code))
    } else {
      const it = (input.items || []).find((i) => i.code === code)
      results.push({
        code,
        type: it?.type,
        name: it?.name,
        batch: it?.batch,
        dbId: it?.dbId,
        verifyNeeded: !!it?.verifyNeeded,
        conclusion: 'NEEDS_VERIFICATION',
        knowledgePublishCandidate: 'no',
        autoQuestionEligibility: 'ineligible',
        severity: null,
        problems: [],
        reasons: ['结果缺失：未写入 checkpoint'],
        roundA: { status: 'missing' },
        roundB: { status: 'missing' },
        reviewedAt: new Date().toISOString(),
      })
    }
  }

  // hard rule: verifyNeeded never READY
  for (const r of results) {
    if (r.verifyNeeded && r.conclusion === 'READY_FOR_HUMAN_APPROVAL') {
      r.conclusion = 'NEEDS_VERIFICATION'
      r.knowledgePublishCandidate = 'no'
      r.reasons = [
        ...(r.reasons || []),
        '后处理硬规则：verifyNeeded 禁止 READY',
      ]
    }
  }

  const ready = results.filter((r) => r.conclusion === 'READY_FOR_HUMAN_APPROVAL')
  const fix = results.filter((r) => r.conclusion === 'NEEDS_FIX')
  const verify = results.filter((r) => r.conclusion === 'NEEDS_VERIFICATION')

  if (ready.length + fix.length + verify.length !== results.length) {
    console.error('partition error')
    process.exit(1)
  }

  const pCount = { P0: 0, P1: 0, P2: 0, P3: 0 }
  const allProblems = []
  for (const r of results) {
    for (const p of r.problems || []) {
      if (pCount[p.level] != null) pCount[p.level] += 1
      allProblems.push({
        code: r.code,
        type: r.type,
        name: r.name,
        conclusion: r.conclusion,
        ...p,
      })
    }
  }

  const aq = { eligible: 0, restricted: 0, ineligible: 0 }
  let publishYes = 0
  for (const r of results) {
    aq[r.autoQuestionEligibility] = (aq[r.autoQuestionEligibility] || 0) + 1
    if (r.knowledgePublishCandidate === 'yes') publishYes += 1
  }

  const byType = {}
  const byBatch = {}
  const byTypeConc = {}
  for (const r of results) {
    byType[r.type] = (byType[r.type] || 0) + 1
    byBatch[r.batch || '?'] = (byBatch[r.batch || '?'] || 0) + 1
    if (!byTypeConc[r.type]) {
      byTypeConc[r.type] = {
        READY_FOR_HUMAN_APPROVAL: 0,
        NEEDS_FIX: 0,
        NEEDS_VERIFICATION: 0,
      }
    }
    byTypeConc[r.type][r.conclusion] += 1
  }

  const scienceFails = results.filter(
    (r) =>
      r.roundA?.scienceVerdict === 'FAIL_SCIENCE' ||
      (r.problems || []).some((p) => p.round === 'A' && (p.level === 'P0' || p.level === 'P1')),
  )
  const newScopeIssues = results.filter(
    (r) =>
      r.conclusion === 'NEEDS_VERIFICATION' &&
      (r.roundB?.curriculumScope === 'uncertain' ||
        r.roundB?.rangeVerdict === 'NEED_VERIFY_RANGE' ||
        (r.problems || []).some((p) => p.needsTextbookCheck)),
  )

  const incompleteRounds = results.filter(
    (r) => r.roundA?.status !== 'ok' || r.roundB?.status !== 'ok',
  )

  const recommendBatchPublish = false // always false per task; also gate on P0/FIX
  const suggestDirectPublish =
    recommendBatchPublish &&
    fix.length === 0 &&
    pCount.P0 === 0 &&
    incompleteRounds.length === 0

  const generatedAt = new Date().toISOString()

  const resultsPayload = {
    generatedAt,
    readOnly: true,
    sourceTotal: results.length,
    expected: expectedCodes.length,
    summary: {
      READY_FOR_HUMAN_APPROVAL: ready.length,
      NEEDS_FIX: fix.length,
      NEEDS_VERIFICATION: verify.length,
    },
    problemCounts: pCount,
    publishCandidateYes: publishYes,
    autoQuestion: aq,
    incompleteRounds: incompleteRounds.length,
    note: 'AI二次复核 ≠ 人工审核；READY ≠ published',
    results,
  }
  fs.writeFileSync(
    path.join(OUT, 'second_review_results.json'),
    JSON.stringify(resultsPayload, null, 2) + '\n',
  )

  fs.writeFileSync(
    path.join(OUT, 'ready_for_human_approval.json'),
    JSON.stringify(
      {
        generatedAt,
        count: ready.length,
        note: '可提交管理员人工确认；不是已发布',
        items: ready.map(slim),
      },
      null,
      2,
    ) + '\n',
  )
  fs.writeFileSync(
    path.join(OUT, 'needs_fix.json'),
    JSON.stringify({ generatedAt, count: fix.length, items: fix.map(slim) }, null, 2) + '\n',
  )
  fs.writeFileSync(
    path.join(OUT, 'needs_verification.json'),
    JSON.stringify({ generatedAt, count: verify.length, items: verify.map(slim) }, null, 2) +
      '\n',
  )
  fs.writeFileSync(
    path.join(OUT, 'auto_question_eligibility.json'),
    JSON.stringify(
      {
        generatedAt,
        counts: aq,
        items: results.map((r) => ({
          code: r.code,
          type: r.type,
          conclusion: r.conclusion,
          knowledgePublishCandidate: r.knowledgePublishCandidate,
          autoQuestionEligibility: r.autoQuestionEligibility,
          allowedQuestionTypes: r.roundB?.allowedQuestionTypes || [],
          bannedQuestionTypes: r.roundB?.bannedQuestionTypes || [],
        })),
      },
      null,
      2,
    ) + '\n',
  )

  // execution log already written by runner; refresh summary fields
  const execPath = path.join(OUT, 'review_execution_log.json')
  let exec = fs.existsSync(execPath) ? JSON.parse(fs.readFileSync(execPath, 'utf8')) : {}
  exec = {
    ...exec,
    ...(cp.execLog || {}),
    generatedAt,
    finalCounts: resultsPayload.summary,
    incompleteRounds: incompleteRounds.map((r) => r.code),
  }
  fs.writeFileSync(execPath, JSON.stringify(exec, null, 2) + '\n')

  const humanOrder = [
    ...ready.filter((r) => r.autoQuestionEligibility === 'eligible'),
    ...ready.filter((r) => r.autoQuestionEligibility === 'restricted'),
    ...ready.filter((r) => r.autoQuestionEligibility === 'ineligible'),
    ...verify.slice(0, 30),
    ...fix,
  ]

  const md = []
  md.push('# 化学知识库 DeepSeek 发布前第二轮严格复核报告')
  md.push('')
  md.push(`> 生成时间：${generatedAt}`)
  md.push(`> 复核范围：初审 PASS_PUBLISH 白名单 **${results.length}** 条`)
  md.push(`> 模型：\`${exec.model || 'deepseek-chat'}\``)
  md.push('> **只读复核**：未改数据库 / 未发布 / 未改正文 / 未生成正式训练题')
  md.push('> **声明**：DeepSeek 初审通过 ≠ 人工审核；二次 AI 复核通过 ≠ 人工审核 / ≠ published')
  md.push('')
  md.push('## 1. 复核范围')
  md.push('')
  md.push('- 输入：`publish_whitelist.json`（239）∩ 实时 DB 字段（`input_239.json`）')
  md.push('- 两轮独立提示词：Round A 科学性；Round B 课程范围与出题适配')
  md.push('- **未**将初审 PASS 结论作为模型输入依据')
  md.push('')
  md.push('## 2. 覆盖情况')
  md.push('')
  md.push(`| 项 | 数量 |`)
  md.push(`|----|------|`)
  md.push(`| 预期 | ${expectedCodes.length} |`)
  md.push(`| 实际有结论 | ${results.length} |`)
  md.push(`| Round 不完整 | ${incompleteRounds.length} |`)
  md.push(
    `| READY+FIX+VERIFY | ${ready.length}+${fix.length}+${verify.length}=${ready.length + fix.length + verify.length} |`,
  )
  md.push('')
  md.push('## 3. DeepSeek 调用情况')
  md.push('')
  md.push(`| 指标 | 值 |`)
  md.push(`|------|----|`)
  md.push(`| API 调用次数 | ${exec.apiCalls ?? '—'} |`)
  md.push(`| 成功 | ${exec.apiSuccess ?? '—'} |`)
  md.push(`| 失败 | ${exec.apiFail ?? '—'} |`)
  md.push(`| 重试累计 | ${exec.retries ?? '—'} |`)
  md.push('')
  md.push('详情见 `review_execution_log.json`（已脱敏，不含 API Key）。')
  md.push('')
  md.push('## 4. 两轮独立复核')
  md.push('')
  md.push('- Round A：化学定义、方程式真实性与配平、条件、氧化还原、实验、计算')
  md.push('- Round B：高一必修范围、教材争议、专项关联、自动出题/判题风险')
  md.push('- 合并规则：A 明确科学错误 → NEEDS_FIX；范围争议/失败/缺失 → NEEDS_VERIFICATION；仅两轮均过关 → READY_FOR_HUMAN_APPROVAL')
  md.push('')
  md.push('## 5–7. 结论汇总')
  md.push('')
  md.push('| 结论 | 数量 |')
  md.push('|------|------|')
  md.push(`| READY_FOR_HUMAN_APPROVAL | ${ready.length} |`)
  md.push(`| NEEDS_FIX | ${fix.length} |`)
  md.push(`| NEEDS_VERIFICATION | ${verify.length} |`)
  md.push('')
  md.push('## 8. P0–P3 问题统计（问题条次数）')
  md.push('')
  md.push('| 等级 | 数量 |')
  md.push('|------|------|')
  md.push(`| P0 | ${pCount.P0} |`)
  md.push(`| P1 | ${pCount.P1} |`)
  md.push(`| P2 | ${pCount.P2} |`)
  md.push(`| P3 | ${pCount.P3} |`)
  md.push('')
  md.push('## 9. 新发现科学性错误（样本）')
  md.push('')
  if (!scienceFails.length) {
    md.push('_本轮未将条目判为 FAIL_SCIENCE / 影响发布的 A 轮 P0–P1（或数量为 0）。_')
  } else {
    md.push(`共 **${scienceFails.length}** 条涉及科学性 FAIL 或 A 轮 P0/P1。示例：`)
    md.push('')
    md.push('| 编码 | 结论 | 要点 |')
    md.push('|------|------|------|')
    for (const r of scienceFails.slice(0, 40)) {
      const issue =
        (r.problems || []).find((p) => p.round === 'A')?.issue ||
        (r.reasons || [])[0] ||
        '—'
      md.push(
        `| \`${r.code}\` | ${r.conclusion} | ${String(issue).replace(/\|/g, '/').slice(0, 80)} |`,
      )
    }
  }
  md.push('')
  md.push('## 10. 新发现教材范围争议')
  md.push('')
  md.push(`标记需核实范围/教材口径相关：**${newScopeIssues.length}** 条（详见 needs_verification.json）。`)
  md.push('')
  md.push('## 11. 专项关联问题')
  md.push('')
  const linkIssues = results.filter(
    (r) =>
      r.roundB?.rangeVerdict === 'BAD_LINK' ||
      (r.roundB?.specialtyIssues || []).length > 0,
  )
  md.push(`存在专项关联质疑：**${linkIssues.length}** 条。`)
  md.push('')
  md.push('## 12. 自动出题风险')
  md.push('')
  md.push('| 资格 | 数量 |')
  md.push('|------|------|')
  md.push(`| eligible | ${aq.eligible || 0} |`)
  md.push(`| restricted | ${aq.restricted || 0} |`)
  md.push(`| ineligible | ${aq.ineligible || 0} |`)
  md.push('')
  md.push('## 13. 各批次统计')
  md.push('')
  md.push('| 批次 | 数量 |')
  md.push('|------|------|')
  for (const [b, n] of Object.entries(byBatch).sort()) md.push(`| ${b} | ${n} |`)
  md.push('')
  md.push('## 14. 各类型 × 结论')
  md.push('')
  md.push('| 类型 | READY | FIX | VERIFY |')
  md.push('|------|-------|-----|--------|')
  for (const t of Object.keys(byTypeConc).sort()) {
    const c = byTypeConc[t]
    md.push(
      `| ${t} | ${c.READY_FOR_HUMAN_APPROVAL} | ${c.NEEDS_FIX} | ${c.NEEDS_VERIFICATION} |`,
    )
  }
  md.push('')
  md.push('## 15–18. 发布候选与出题资格')
  md.push('')
  md.push(`- 知识发布候选（knowledgePublishCandidate=yes）：**${publishYes}**`)
  md.push(`- 自动出题 eligible / restricted / ineligible：**${aq.eligible || 0}** / **${aq.restricted || 0}** / **${aq.ineligible || 0}**`)
  md.push('')
  md.push('## 19. 推荐人工审核顺序')
  md.push('')
  md.push('1. READY 且 autoQuestion=eligible')
  md.push('2. READY 且 restricted')
  md.push('3. READY 且 ineligible（仅知识发布、限制出题）')
  md.push('4. NEEDS_VERIFICATION（抽样核实教材/条件）')
  md.push('5. NEEDS_FIX（先改后再审）')
  md.push('')
  md.push('优先抽检编码（前 30）：')
  md.push('')
  md.push(humanOrder.slice(0, 30).map((r) => `\`${r.code}\``).join(', ') || '_无_')
  md.push('')
  md.push('## 20. 是否建议直接批量发布')
  md.push('')
  md.push(
    `**${suggestDirectPublish ? '是' : '否'}** — 二次 AI 复核仅产生人工确认候选；按任务要求不得自动批量发布。当前 FIX=${fix.length}，P0问题数=${pCount.P0}，Round不完整=${incompleteRounds.length}。`,
  )
  md.push('')
  md.push('## 产出文件')
  md.push('')
  md.push('- `chemistry_deepseek_audit/second_review/second_review_results.json`')
  md.push('- `ready_for_human_approval.json` / `needs_fix.json` / `needs_verification.json`')
  md.push('- `auto_question_eligibility.json` / `review_execution_log.json`')
  md.push('- 本报告：`docs/CHEMISTRY_DEEPSEEK_SECOND_REVIEW_REPORT.md`')
  md.push('')

  fs.writeFileSync(
    path.join(ROOT_DOCS, 'CHEMISTRY_DEEPSEEK_SECOND_REVIEW_REPORT.md'),
    md.join('\n'),
    'utf8',
  )

  console.log(
    JSON.stringify(
      {
        total: results.length,
        ready: ready.length,
        fix: fix.length,
        verify: verify.length,
        sum: ready.length + fix.length + verify.length,
        pCount,
        publishYes,
        aq,
        scienceFailItems: scienceFails.length,
        incompleteRounds: incompleteRounds.length,
        suggestDirectPublish,
      },
      null,
      2,
    ),
  )
}

function slim(r) {
  return {
    code: r.code,
    type: r.type,
    name: r.name,
    batch: r.batch,
    dbId: r.dbId,
    conclusion: r.conclusion,
    knowledgePublishCandidate: r.knowledgePublishCandidate,
    autoQuestionEligibility: r.autoQuestionEligibility,
    severity: r.severity,
    reasons: r.reasons,
    problems: r.problems,
    roundA: {
      status: r.roundA?.status,
      scienceVerdict: r.roundA?.scienceVerdict,
      confidence: r.roundA?.confidence,
    },
    roundB: {
      status: r.roundB?.status,
      curriculumScope: r.roundB?.curriculumScope,
      rangeVerdict: r.roundB?.rangeVerdict,
      autoQuestionEligibility: r.roundB?.autoQuestionEligibility,
      confidence: r.roundB?.confidence,
    },
  }
}

main()
