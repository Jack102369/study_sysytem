/**
 * Build whitelist + markdown report from deepseek_audit_results.json
 *
 *   node docs/chemistry_deepseek_audit/build_report.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const OUT = __dirname

function main() {
  const resultsPath = path.join(OUT, 'deepseek_audit_results.json')
  const pendingPath = path.join(OUT, 'pending_review_all.json')
  if (!fs.existsSync(resultsPath)) {
    console.error('missing deepseek_audit_results.json')
    process.exit(1)
  }
  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
  const pending = fs.existsSync(pendingPath)
    ? JSON.parse(fs.readFileSync(pendingPath, 'utf8'))
    : { total: 0, items: [] }

  const results = data.results || []
  const failures = data.failures || []
  const byGrade = { PASS_PUBLISH: [], HOLD_RESTRICTED: [], REJECT_FIX: [] }
  const byTypeGrade = {}
  for (const r of results) {
    if (!byGrade[r.grade]) byGrade[r.grade] = []
    byGrade[r.grade].push(r)
    const t = r.type || 'unknown'
    if (!byTypeGrade[t]) byTypeGrade[t] = { PASS_PUBLISH: 0, HOLD_RESTRICTED: 0, REJECT_FIX: 0 }
    byTypeGrade[t][r.grade] = (byTypeGrade[t][r.grade] || 0) + 1
  }

  const whitelist = {
    generatedAt: new Date().toISOString(),
    note: '仅白名单建议；数据库 status 尚未改为 published；需人工确认后再执行发布。',
    model: data.model,
    passCount: byGrade.PASS_PUBLISH.length,
    items: byGrade.PASS_PUBLISH.map((r) => ({
      code: r.code,
      type: r.type,
      name: r.name,
      dbId: r.dbId,
      batch: r.batch,
      confidence: r.confidence,
      reasons: r.reasons,
    })),
  }
  fs.writeFileSync(
    path.join(OUT, 'publish_whitelist.json'),
    JSON.stringify(whitelist, null, 2) + '\n',
  )

  const unaudited = (pending.items || [])
    .map((i) => i.code)
    .filter((c) => !results.some((r) => r.code === c))

  const md = []
  md.push('# 化学知识库 DeepSeek 全量审核报告')
  md.push('')
  md.push(`> 生成时间：${whitelist.generatedAt}`)
  md.push(`> 模型：\`${data.model || '—'}\``)
  md.push(`> 待审导出总数：${pending.total ?? '—'}`)
  md.push(`> 已完成审核：**${results.length}**`)
  md.push(`> API/解析失败条目：**${failures.length}**`)
  md.push(`> 未覆盖条目：**${unaudited.length}**`)
  md.push('')
  md.push('## 重要说明')
  md.push('')
  md.push('- 本报告为审核建议，**尚未**将数据库 `status` 改为 `published`。')
  md.push('- `verifyNeeded=true` 条目硬规则封顶为 `HOLD_RESTRICTED`。')
  md.push('- 发布前请人工抽检 `publish_whitelist.json`。')
  md.push('')
  md.push('## 分级汇总')
  md.push('')
  md.push('| 分级 | 数量 |')
  md.push('|------|------|')
  md.push(`| PASS_PUBLISH（建议可发布） | ${byGrade.PASS_PUBLISH.length} |`)
  md.push(`| HOLD_RESTRICTED（暂缓/受限） | ${byGrade.HOLD_RESTRICTED.length} |`)
  md.push(`| REJECT_FIX（需修改） | ${byGrade.REJECT_FIX.length} |`)
  md.push('')
  md.push('## 分类型 × 分级')
  md.push('')
  md.push('| 类型 | PASS | HOLD | REJECT |')
  md.push('|------|------|------|--------|')
  for (const t of Object.keys(byTypeGrade).sort()) {
    const g = byTypeGrade[t]
    md.push(`| ${t} | ${g.PASS_PUBLISH || 0} | ${g.HOLD_RESTRICTED || 0} | ${g.REJECT_FIX || 0} |`)
  }
  md.push('')

  function section(title, list, max = 80) {
    md.push(`## ${title}（${list.length}）`)
    md.push('')
    if (!list.length) {
      md.push('_无_')
      md.push('')
      return
    }
    md.push('| 编码 | 类型 | 名称 | 置信度 | 主要理由 |')
    md.push('|------|------|------|--------|----------|')
    for (const r of list.slice(0, max)) {
      const reason = (r.reasons || [])[0] || (r.issues || [])[0] || '—'
      md.push(
        `| \`${r.code}\` | ${r.type} | ${String(r.name || '').replace(/\|/g, '/')} | ${r.confidence ?? '—'} | ${String(reason).replace(/\|/g, '/').slice(0, 80)} |`,
      )
    }
    if (list.length > max) md.push(`| … | … | 其余 ${list.length - max} 条见 JSON | … | … |`)
    md.push('')
  }

  section('PASS_PUBLISH 白名单预览', byGrade.PASS_PUBLISH, 100)
  section('HOLD_RESTRICTED', byGrade.HOLD_RESTRICTED, 60)
  section('REJECT_FIX', byGrade.REJECT_FIX, 80)

  if (failures.length) {
    md.push('## 失败/未返回条目')
    md.push('')
    md.push('| 编码 | 错误 |')
    md.push('|------|------|')
    for (const f of failures.slice(0, 100)) {
      md.push(`| \`${f.code}\` | ${String(f.error || '').slice(0, 120)} |`)
    }
    md.push('')
  }

  if (unaudited.length) {
    md.push('## 未覆盖编码')
    md.push('')
    md.push(unaudited.map((c) => `\`${c}\``).join(', '))
    md.push('')
  }

  md.push('## 产出文件')
  md.push('')
  md.push('- `pending_review_all.json` / `PENDING_REVIEW_ALL.md`')
  md.push('- `deepseek_audit_results.json`')
  md.push('- `publish_whitelist.json`')
  md.push('- `CHEMISTRY_DEEPSEEK_AUDIT_REPORT.md`（本文件）')
  md.push('')

  fs.writeFileSync(path.join(OUT, 'CHEMISTRY_DEEPSEEK_AUDIT_REPORT.md'), md.join('\n'), 'utf8')
  console.log(
    JSON.stringify(
      {
        pass: byGrade.PASS_PUBLISH.length,
        hold: byGrade.HOLD_RESTRICTED.length,
        reject: byGrade.REJECT_FIX.length,
        failures: failures.length,
        unaudited: unaudited.length,
      },
      null,
      2,
    ),
  )
}

main()
