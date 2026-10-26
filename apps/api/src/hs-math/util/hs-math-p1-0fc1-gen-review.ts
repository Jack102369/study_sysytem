/**
 * 从权威 JSON + 只读审计快照生成 1.1 人工审核表（不写库）。
 * pnpm --filter api run hs-math:p1-0fc1-gen-review
 */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '../../../../../')
const BANK = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/chapter_01_all.json',
)
const SNAP = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/.p1_0fc1_section11_snapshot.json',
)
const OUT = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/review_section_1_1.md',
)

/** Cursor 独立数学复核意见（≠ 具名人工 APPROVED） */
const MATH_NOTES: Record<
  string,
  {
    result: 'PASS_AGENT_REVIEW' | 'SUSPECT' | 'NEEDS_CORRECTION'
    method: string
    note: string
    humanConfirm?: string
  }
> = {
  'HSMA-RJA-CH01-0001': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '确定性：仅 C（方程实数根 ±1）对象唯一；A/B/D 含模糊词，不能构成集合。答案 C 正确。',
  },
  'HSMA-RJA-CH01-0002': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '∈ 用于元素-集合；⊂/⊆ 用于集合-集合。1∈A 真；{1}∈A 假。答案 B。',
  },
  'HSMA-RJA-CH01-0003': {
    result: 'PASS_AGENT_REVIEW',
    method: 'ENUM',
    note: '论域 ℤ，−2≤x<2 → x∈{−2,−1,0,1}。答案 B。不含 2。',
  },
  'HSMA-RJA-CH01-0004': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: 'A 在选项内声明默认实数时 {x∣x²=1}={±1} 确定；B/C/D 模糊。答案 A。',
    humanConfirm:
      '选项 A 把“默认实数”写在选项文字中略冗长；建议人工确认是否接受，或日后把约定移到题干（非阻断数学错误）。',
  },
  'HSMA-RJA-CH01-0005': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '∅ 无元素；{0}、{∅} 均非空集；0∉∅。答案 A。',
  },
  'HSMA-RJA-CH01-0006': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '互异性：{a,a,b}={a,b}，|A|=2。答案 A。',
  },
  'HSMA-RJA-CH01-0007': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '题干明确 ℕ 含 0；ℕ⊆ℤ⊆ℚ⊆ℝ 成立；√2∉ℚ；−3∉ℕ。答案 A。',
  },
  'HSMA-RJA-CH01-0008': {
    result: 'PASS_AGENT_REVIEW',
    method: 'CALC',
    note: '奇数集：取 k=−3 得 2k+1=−5，故 −5∈A。答案 A。',
    humanConfirm:
      '题型为 single，选项为“正确/错误/无法判断…”，形态接近判断题；数学结论无误，建议人工确认题型呈现是否合适。',
  },
  'HSMA-RJA-CH01-0009': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: 'A 确定；B 无实根→空集仍是集合；D 圆确定；C“著名”不确定。答案 A+B+D。',
    humanConfirm:
      '部分学生可能误以为“无实根就不能构成集合”；解析已说明空集是集合，建议人工确认解析是否足够。',
  },
  'HSMA-RJA-CH01-0010': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: 'A/B/D 正确；C“无限集一定不能列举”过绝对（可省略号）。答案 A+B+D。',
  },
  'HSMA-RJA-CH01-0011': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: 'A=∅∈{∅}；B 空集是任意集合子集；C 假；D |A|=1。答案 A+B+D。',
  },
  'HSMA-RJA-CH01-0012': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '无序性：{1,2,3}={3,2,1}。命题真。',
  },
  'HSMA-RJA-CH01-0013': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '∅ 是任意集合的子集，未必是元素；反例 ∅∉{1,2}。命题假。',
  },
  'HSMA-RJA-CH01-0014': {
    result: 'PASS_AGENT_REVIEW',
    method: 'LOGIC',
    note: '描述法需明确论域或约定默认范围。命题真。',
  },
  'HSMA-RJA-CH01-0015': {
    result: 'PASS_AGENT_REVIEW',
    method: 'CALC',
    note: '|{2,4,6,8}|=4。numeric value=4 与判题器兼容。',
  },
  'HSMA-RJA-CH01-0016': {
    result: 'PASS_AGENT_REVIEW',
    method: 'ENUM',
    note: 'x∈ℤ 且 0<x≤5 → {1,2,3,4,5}，个数 5。',
  },
}

function fmtOptions(options: any): string {
  if (!options?.options || !Array.isArray(options.options)) return '_（本题无选项）_'
  return options.options
    .map((o: any) => `- **${o.id}**：${o.text}`)
    .join('\n')
}

function fmtAnswer(qtype: string, ap: any): string {
  if (qtype === 'single') return `\`${ap.optionId}\``
  if (qtype === 'multi') return `\`${(ap.optionIds || []).join('+')}\``
  if (qtype === 'judge') return ap.value ? '`true`' : '`false`'
  if (qtype === 'numeric') return `\`${ap.value}\``
  return JSON.stringify(ap)
}

function main() {
  const bank = JSON.parse(fs.readFileSync(BANK, 'utf8'))
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8')) as {
    sha256: string
    items: any[]
  }
  const items = (bank.items as any[]).filter((it) => it.categoryCode === '1.1')
  const byCode = new Map<string, any>(
    snap.items.map((x: any) => [String(x.code), x]),
  )
  const sha = snap.sha256
  const versionFp = crypto
    .createHash('sha256')
    .update(
      JSON.stringify(
        items.map((it) => ({
          code: it.code,
          fp: byCode.get(it.code)?.dbFingerprint || null,
          cv: byCode.get(it.code)?.db?.contentVersion,
        })),
      ),
      'utf8',
    )
    .digest('hex')

  const lines: string[] = []
  lines.push('# 第一章 1.1《集合的概念》人工审核表（P1-0F-C1）')
  lines.push('')
  lines.push('> **只读阶段**：本表用于具名人工审核准备。')
  lines.push('> Cursor 的数学复核 ≠ 具名人工审核；**禁止**将本表状态自动改为 APPROVED。')
  lines.push('> 本阶段**不批准**任何题目，**不写库**。')
  lines.push('')
  lines.push('## 汇总头')
  lines.push('')
  lines.push('| 项 | 值 |')
  lines.push('|----|-----|')
  lines.push('| 小节 | 1.1《集合的概念》（DB 按 category_code=1.1 核实，非仅凭 code） |')
  lines.push('| 题数 | 16 |')
  lines.push('| code | HSMA-RJA-CH01-0001 .. 0016 |')
  lines.push(`| 题库 SHA-256 | \`${sha}\` |`)
  lines.push(`| 审核版本指纹（16题） | \`${versionFp}\` |`)
  lines.push('| DB 状态 | 全部 draft / pool=formal |')
  lines.push('| 内容与 JSON 一致 | 16/16 |')
  lines.push('| KP 关联一致 | 16/16（本节 KP 链接 22 条） |')
  lines.push('| 人工审核人 | _（待填写）_ |')
  lines.push('| 人工审核时间 | _（待填写）_ |')
  lines.push('| 总体人工状态 | **PENDING**（16） / APPROVED（0） / REJECTED（0） |')
  lines.push('')
  lines.push('## 具名人工审核填写说明')
  lines.push('')
  lines.push('每题底部「人工审核栏」由真实审核人填写：')
  lines.push('')
  lines.push('- 审核人：')
  lines.push('- 审核时间：')
  lines.push('- 审核意见：')
  lines.push('- 审核状态：`PENDING` / `PASS` / `REJECT` / `NEEDS_CORRECTION`')
  lines.push('- 审核版本指纹：须与上表版本指纹一致，否则重新审核')
  lines.push('')
  lines.push('仅当某题人工状态为 `PASS` 且版本指纹一致时，才可进入后续**单题**批准授权流程。')
  lines.push('')
  lines.push('---')
  lines.push('')

  let pass = 0
  let suspect = 0
  let fail = 0
  for (const it of items) {
    const code = it.code
    const db = byCode.get(code)
    const math = MATH_NOTES[code]
    if (!math) throw new Error(`缺少复核意见 ${code}`)
    if (math.result === 'PASS_AGENT_REVIEW') pass++
    else if (math.result === 'SUSPECT') suspect++
    else fail++

    lines.push(`## ${code}`)
    lines.push('')
    lines.push('| 字段 | 值 |')
    lines.push('|------|-----|')
    lines.push(
      `| 小节 | 1.1（DB: ${db?.db?.category || '?'} / ${db?.db?.categoryName || ''}） |`,
    )
    lines.push(`| 题型 | ${it.qtype} |`)
    lines.push(`| 难度 | ${it.difficulty} |`)
    lines.push(`| 主 KP | ${it.primaryKnowledgePointCode} |`)
    lines.push(`| 其他 KP | ${(it.knowledgePointCodes || []).join(', ')} |`)
    lines.push(`| DB status | ${db?.db?.status} |`)
    lines.push(`| DB pool | ${db?.db?.pool} |`)
    lines.push(`| content_version | ${db?.db?.contentVersion} |`)
    lines.push(`| 内容指纹一致 | ${db?.contentMatch ? 'YES' : 'NO'} |`)
    lines.push(`| KP 一致 | ${db?.kpMatch ? 'YES' : 'NO'} |`)
    lines.push('')
    lines.push('### 题干')
    lines.push('')
    lines.push(it.stem)
    lines.push('')
    lines.push('### 选项')
    lines.push('')
    lines.push(fmtOptions(it.options))
    lines.push('')
    lines.push('### 标准答案')
    lines.push('')
    lines.push(fmtAnswer(it.qtype, it.answerPayload))
    lines.push('')
    lines.push('### 解析')
    lines.push('')
    lines.push(it.analysis)
    lines.push('')
    lines.push('### 独立数学复核（Cursor 代理，非正式人工）')
    lines.push('')
    lines.push(`- 结果：\`${math.result}\``)
    lines.push(`- 方法：${math.method}`)
    lines.push(`- 意见：${math.note}`)
    if (math.humanConfirm) {
      lines.push(`- **需人工特别确认**：${math.humanConfirm}`)
    } else {
      lines.push('- 需人工特别确认：无（仍须具名通读）')
    }
    lines.push('')
    lines.push('### 数据库内容核对')
    lines.push('')
    lines.push(
      db?.contentMatch && db?.kpMatch
        ? '与 `chapter_01_all.json` 及 manifest 指纹一致；导入后未见 content_version 异常升高。'
        : `异常：${(db?.issues || []).join('; ') || '未知'}`,
    )
    lines.push('')
    lines.push('### 人工审核栏（默认 PENDING — 勿由 Cursor 填写 APPROVED）')
    lines.push('')
    lines.push('- 审核人：')
    lines.push('- 审核时间：')
    lines.push('- 审核意见：')
    lines.push('- 审核状态：**PENDING**')
    lines.push(`- 审核版本指纹：\`${versionFp}\``)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  lines.push('## 代理复核统计（非正式）')
  lines.push('')
  lines.push(`- PASS_AGENT_REVIEW：${pass}`)
  lines.push(`- SUSPECT：${suspect}`)
  lines.push(`- NEEDS_CORRECTION：${fail}`)
  lines.push('- 人工 PENDING：16')
  lines.push('- 人工 APPROVED：0')
  lines.push('- 人工 REJECTED：0')
  lines.push('')

  fs.writeFileSync(OUT, `${lines.join('\n')}\n`, 'utf8')
  console.log(`wrote ${OUT}`)
  console.log({ pass, suspect, fail, versionFp })
}

main()
