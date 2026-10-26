/**
 * P1-0F-C2：1.1 人工审核记录生成 + 校验（不写库、不批准）。
 *
 * pnpm --filter api run hs-math:p1-0fc2-human-review
 * pnpm --filter api run hs-math:p1-0fc2-human-review -- --check-only
 */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { createConnection, type RowDataPacket } from 'mysql2/promise'
import {
  canonicalizeImportItem,
  fingerprintCanonicalItem,
} from './import-preview-token'
import { validateAnswerPayload } from './answer-payload.validate'

const EXPECTED_SHA =
  '89b6484e6cb69f40437a6b28f603abae3c9eb19c0b08157d27947f72f7ec95c9'
const EXPECTED_CODES = Array.from({ length: 16 }, (_, i) => {
  const n = String(i + 1).padStart(4, '0')
  return `HSMA-RJA-CH01-${n}`
})
const HIGHLIGHT = new Set([
  'HSMA-RJA-CH01-0004',
  'HSMA-RJA-CH01-0008',
  'HSMA-RJA-CH01-0009',
])

const ROOT = path.resolve(__dirname, '../../../../../')
const BANK = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/chapter_01_all.json',
)
const REVIEW_MD = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/review_section_1_1.md',
)
const OUT_JSON = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/human_review_section_1_1.json',
)
const OUT_SUMMARY = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/human_review_summary_1_1.md',
)
const DOC22 = path.join(ROOT, 'docs/high_school_math/22_p1_0fc2_human_review.md')

const VALID_STATUS = new Set([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NEEDS_CORRECTION',
  'STALE_REVIEW',
])

type ReviewItem = {
  code: string
  status: string
  reviewer: string | null
  reviewedAt: string | null
  reviewedContentVersion: number
  contentFingerprint: string
  comment: string
  highlight?: boolean
  agentNote?: string
}

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  const p = path.join(__dirname, '../../../.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
}

const AGENT_NOTES: Record<string, string> = {
  'HSMA-RJA-CH01-0004':
    '选项 A 内嵌“默认实数”约定略冗；数学结论正确。人工须明确是否接受呈现方式。',
  'HSMA-RJA-CH01-0008':
    'single 选项形态接近判断题；−5∈奇数集结论正确。人工须确认题型呈现是否合适。',
  'HSMA-RJA-CH01-0009':
    '“无实根→空集仍是集合”易误判；解析已说明。人工须确认解析对学生是否足够。',
}

function assertNoSecrets(obj: unknown, pathHint = '') {
  const s = JSON.stringify(obj)
  const bad = [
    /JWT_SECRET/i,
    /"password"\s*:/i,
    /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.]+/,
    /mysql:\/\/[^:]+:[^@]+@/,
  ]
  for (const re of bad) {
    if (re.test(s)) {
      throw new Error(`审核文件疑似含密钥字段 ${pathHint} (${re})`)
    }
  }
}

function validateReviewFile(
  doc: any,
  liveFp: Map<string, { fp: string; cv: number }>,
): { ok: boolean; errors: string[]; counts: Record<string, number> } {
  const errors: string[] = []
  const counts: Record<string, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    NEEDS_CORRECTION: 0,
    STALE_REVIEW: 0,
  }
  if (doc.section !== '1.1') errors.push('section 应为 1.1')
  if (doc.sourceSha256 !== EXPECTED_SHA) {
    errors.push(`sourceSha256 与授权版本不一致`)
  }
  if (!Array.isArray(doc.items) || doc.items.length !== 16) {
    errors.push(`items 须恰好 16，实际 ${doc.items?.length}`)
  }
  const seen = new Set<string>()
  for (const it of doc.items || []) {
    if (!EXPECTED_CODES.includes(it.code)) errors.push(`非法 code ${it.code}`)
    if (seen.has(it.code)) errors.push(`重复 code ${it.code}`)
    seen.add(it.code)
    if (!VALID_STATUS.has(it.status)) {
      errors.push(`${it.code} 非法 status ${it.status}`)
    } else {
      counts[it.status] = (counts[it.status] || 0) + 1
    }
    const live = liveFp.get(it.code)
    if (!live) {
      errors.push(`${it.code} 无实时指纹`)
      continue
    }
    if (it.contentFingerprint !== live.fp) {
      // 记录漂移：校验要求标 STALE 或报错
      if (it.status === 'APPROVED' || it.status === 'REJECTED') {
        errors.push(
          `${it.code} 内容指纹与当前库/源不一致，旧审核结果不可用（应标 STALE_REVIEW）`,
        )
      }
    }
    if (Number(it.reviewedContentVersion) !== live.cv && it.status === 'APPROVED') {
      errors.push(`${it.code} content_version 与 DB 不一致`)
    }
    if (it.status === 'PENDING') {
      if (it.reviewer != null && String(it.reviewer).trim() !== '') {
        errors.push(`${it.code} PENDING 不得伪造审核人`)
      }
      if (it.reviewedAt != null && String(it.reviewedAt).trim() !== '') {
        errors.push(`${it.code} PENDING 不得伪造审核时间`)
      }
    }
    if (it.status === 'APPROVED') {
      if (!it.reviewer || !String(it.reviewer).trim()) {
        errors.push(`${it.code} APPROVED 缺少审核人`)
      }
      if (!it.reviewedAt || !String(it.reviewedAt).trim()) {
        errors.push(`${it.code} APPROVED 缺少审核时间`)
      }
      if (!it.comment || !String(it.comment).trim()) {
        errors.push(`${it.code} APPROVED 缺少审核意见`)
      }
      if (HIGHLIGHT.has(it.code)) {
        const c = String(it.comment || '')
        if (c.length < 8) {
          errors.push(`${it.code} 为重点题，审核意见须针对复核备注`)
        }
      }
      if (it.contentFingerprint !== live.fp) {
        errors.push(`${it.code} APPROVED 指纹漂移`)
      }
    }
    if (
      (it.status === 'REJECTED' || it.status === 'NEEDS_CORRECTION') &&
      (!it.comment || !String(it.comment).trim())
    ) {
      errors.push(`${it.code} ${it.status} 须有意见`)
    }
  }
  for (const c of EXPECTED_CODES) {
    if (!seen.has(c)) errors.push(`缺少 ${c}`)
  }
  assertNoSecrets(doc)
  return { ok: errors.length === 0, errors, counts }
}

async function loadLiveFingerprints() {
  const env = loadEnv()
  if ((env.DB_NAME || 'study_system') !== 'study_system') {
    throw new Error('DB_NAME must be study_system')
  }
  const buf = fs.readFileSync(BANK)
  const sha = crypto.createHash('sha256').update(buf).digest('hex')
  if (sha !== EXPECTED_SHA) {
    throw new Error(`JSON SHA 漂移：${sha}`)
  }
  const bank = JSON.parse(buf.toString('utf8')) as { items: any[] }
  const bank11 = bank.items.filter((it) => it.categoryCode === '1.1')

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
  })

  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT t.id, t.code, t.qtype, t.difficulty, t.stem, t.options_json,
              t.answer_payload_json, t.analysis, t.status, t.pool, t.content_version,
              s.code AS specialty_code, c.code AS category_code
       FROM hs_math_train_items t
       JOIN hs_math_specialties s ON s.id = t.specialty_id
       JOIN hs_math_categories c ON c.id = t.category_id
       WHERE s.code = 'rja-ch1' AND c.code = '1.1'
       ORDER BY t.code`,
    )
    const [links] = await conn.query<RowDataPacket[]>(
      `SELECT t.code AS item_code, k.code AS kp_code, l.is_primary
       FROM hs_math_train_item_kps l
       JOIN hs_math_train_items t ON t.id = l.item_id
       JOIN hs_math_knowledge_points k ON k.id = l.knowledge_point_id
       JOIN hs_math_categories tc ON tc.id = t.category_id
       JOIN hs_math_specialties s ON s.id = t.specialty_id
       WHERE s.code = 'rja-ch1' AND tc.code = '1.1'`,
    )
    const linksBy = new Map<string, RowDataPacket[]>()
    for (const l of links) {
      const c = String(l.item_code)
      if (!linksBy.has(c)) linksBy.set(c, [])
      linksBy.get(c)!.push(l)
    }

    const live = new Map<string, { fp: string; cv: number; dbStatus: string }>()
    const bankBy = new Map(bank11.map((it) => [String(it.code), it]))

    if (rows.length !== 16) {
      throw new Error(`DB 1.1 题数=${rows.length}，期望 16`)
    }

    for (const row of rows) {
      const code = String(row.code)
      if (String(row.category_code) !== '1.1') {
        throw new Error(`${code} 小节归属异常`)
      }
      if (String(row.status) !== 'draft') {
        throw new Error(`${code} 期望 draft，实际 ${row.status}`)
      }
      const src = bankBy.get(code)
      if (!src) throw new Error(`${code} 不在 bank 1.1`)
      const itemLinks = linksBy.get(code) || []
      const kpCodes = itemLinks.map((l) => String(l.kp_code)).sort()
      const primary = itemLinks.find((l) => Number(l.is_primary) === 1)
      const primaryCode = primary ? String(primary.kp_code) : ''

      const dbNorm = validateAnswerPayload({
        qtype: row.qtype as any,
        optionsJson: row.options_json,
        answerPayload: row.answer_payload_json,
      })
      const importNorm = validateAnswerPayload({
        qtype: src.qtype,
        optionsJson: src.options ?? null,
        answerPayload: src.answerPayload,
      })
      const dbCanon = {
        code,
        specialtyCode: String(row.specialty_code),
        categoryCode: String(row.category_code),
        qtype: row.qtype,
        difficulty: Number(row.difficulty),
        stem: String(row.stem || '').trim(),
        options: dbNorm.optionsJson ?? null,
        answerPayload: dbNorm.answerPayload,
        analysis: String(row.analysis || '').trim(),
        knowledgePointCodes: kpCodes,
        primaryKnowledgePointCode: primaryCode,
        pool: 'formal',
      }
      const importCanon = canonicalizeImportItem({
        ...src,
        options: importNorm.optionsJson,
        answerPayload: importNorm.answerPayload,
        difficulty: Number(src.difficulty),
      })!
      importCanon.difficulty = Number(importCanon.difficulty)
      const dbFp = fingerprintCanonicalItem(dbCanon)
      const bankFp = fingerprintCanonicalItem(importCanon)
      if (dbFp !== bankFp) {
        throw new Error(`${code} DB↔JSON 指纹不一致，中止生成审核记录`)
      }
      live.set(code, {
        fp: dbFp,
        cv: Number(row.content_version),
        dbStatus: String(row.status),
      })
    }
    return { sha, live }
  } finally {
    await conn.end()
  }
}

function writeSummary(doc: any, counts: Record<string, number>, liveOk: boolean) {
  const highlights = (doc.items as ReviewItem[]).filter((i) =>
    HIGHLIGHT.has(i.code),
  )
  const lines = [
    '# 1.1 人工审核汇总（P1-0F-C2）',
    '',
    `> 生成时间：${new Date().toISOString()}`,
    '> **人工审核 APPROVED ≠ 数据库 approved。** 本文件不触发任何批准。',
    '',
    '## 统计',
    '',
    '| 状态 | 数量 |',
    '|------|------|',
    `| PENDING | **${counts.PENDING || 0}** |`,
    `| APPROVED | **${counts.APPROVED || 0}** |`,
    `| REJECTED | **${counts.REJECTED || 0}** |`,
    `| NEEDS_CORRECTION | **${counts.NEEDS_CORRECTION || 0}** |`,
    `| STALE_REVIEW | **${counts.STALE_REVIEW || 0}** |`,
    '',
    '## 版本',
    '',
    `| 项 | 值 |`,
    `|----|-----|`,
    `| sourceSha256 | \`${doc.sourceSha256}\` |`,
    `| reviewBundleVersion | \`${doc.reviewBundleVersion}\` |`,
    `| DB↔源一致 | ${liveOk ? 'YES' : 'NO'} |`,
    '',
    '## 具名审核人',
    '',
    counts.APPROVED || counts.REJECTED || counts.NEEDS_CORRECTION
      ? '见下方已审核条目。'
      : '_尚未提供具名审核人。当前全部 PENDING。_',
    '',
    '## 重点题 0004 / 0008 / 0009',
    '',
  ]
  for (const h of highlights) {
    lines.push(`### ${h.code}`)
    lines.push('')
    lines.push(`- 人工状态：\`${h.status}\``)
    lines.push(`- 代理备注：${h.agentNote || ''}`)
    lines.push(`- 人工意见：${h.comment || '_（待填写；未填则不得 APPROVED）_'}`)
    lines.push(`- 审核人：${h.reviewer || '_无_'}`)
    lines.push(`- 审核时间：${h.reviewedAt || '_无_'}`)
    lines.push('')
  }
  lines.push('## 全部条目')
  lines.push('')
  lines.push('| code | status | reviewer | reviewedAt | cv |')
  lines.push('|------|--------|----------|------------|----|')
  for (const it of doc.items as ReviewItem[]) {
    lines.push(
      `| ${it.code} | ${it.status} | ${it.reviewer || '-'} | ${it.reviewedAt || '-'} | ${it.reviewedContentVersion} |`,
    )
  }
  lines.push('')
  lines.push('## 下一阶段')
  lines.push('')
  if ((counts.APPROVED || 0) === 0) {
    lines.push('**WAITING_FOR_HUMAN_REVIEW** — 请用户逐题或按明确清单提交审核结论。')
  } else {
    lines.push(
      '存在人工 APPROVED 记录后，仍须**另行授权**才可进入数据库批准预检；JSON APPROVED 不会自动 PATCH status。',
    )
  }
  fs.writeFileSync(OUT_SUMMARY, `${lines.join('\n')}\n`, 'utf8')
}

function enhanceReviewMd() {
  if (!fs.existsSync(REVIEW_MD)) return
  let md = fs.readFileSync(REVIEW_MD, 'utf8')
  const marker = '<!-- P1-0F-C2-HIGHLIGHT -->'
  const block = `${marker}
## 重点题人工复核入口（P1-0F-C2）

下列三题代理已通过数学结论，但仍须**具名人工**针对备注给出意见；未写意见不得标人工 APPROVED。

| code | 必须回应的备注 |
|------|----------------|
| HSMA-RJA-CH01-0004 | 选项 A 内嵌“默认实数”约定是否接受 |
| HSMA-RJA-CH01-0008 | single 呈现是否像判断题；是否接受当前形态 |
| HSMA-RJA-CH01-0009 | “空集仍是集合”解析是否对学生足够 |

正式审核记录文件：\`human_review_section_1_1.json\`（与数据库批准分离）。

---

`
  if (md.includes(marker)) {
    md = md.replace(
      new RegExp(`${marker}[\\s\\S]*?---\\n\\n`),
      block,
    )
  } else {
    // insert after 汇总头 first ---
    const idx = md.indexOf('\n---\n')
    if (idx >= 0) {
      md = md.slice(0, idx + 5) + '\n' + block + md.slice(idx + 5)
    } else {
      md = block + md
    }
  }
  fs.writeFileSync(REVIEW_MD, md, 'utf8')
}

function writeDoc22(counts: Record<string, number>) {
  const doc = `# P1-0F-C2：1.1 具名人工审核流程与记录

> **人工审核通过 ≠ 数据库批准。** 二者必须分开授权。

## 1. 审核流程

1. 打开 \`review_section_1_1.md\`，逐题阅读题干/选项/答案/解析/KP。  
2. 对 **0004 / 0008 / 0009** 必须针对复核备注写意见。  
3. 由真实审核人给出结论：\`APPROVED\` / \`REJECTED\` / \`NEEDS_CORRECTION\` / \`PENDING\`。  
4. 用户向 Cursor **明确**提供：审核人、code 列表、结论、意见。  
5. Cursor 仅在满足规则时更新 \`human_review_section_1_1.json\`。  
6. **绝不**因 JSON 变为 APPROVED 而自动调用 \`PATCH .../status\`。

## 2. 版本绑定

每条记录绑定：

- \`sourceSha256\`（整包 JSON）
- \`contentFingerprint\`（单题规范化内容）
- \`reviewedContentVersion\`（数据库 content_version）

内容变更后旧 \`APPROVED\` 失效，应标 \`STALE_REVIEW\`，不得进入批准清单。

## 3. 更新规则（防伪造）

允许更新当且仅当用户明确给出：

1. 审核人姓名/标识  
2. 题目 code  
3. 审核结论  
4. 审核意见（重点题须针对备注）  
5. 版本仍一致  

禁止：

- “看起来没问题”→ 批量 16 题 APPROVED  
- 虚构审核时间/审核人  
- 修改题干答案或数据库 status  

## 4. 当前结果（本阶段初始化）

| 状态 | 数量 |
|------|------|
| PENDING | ${counts.PENDING || 0} |
| APPROVED | ${counts.APPROVED || 0} |
| REJECTED | ${counts.REJECTED || 0} |
| NEEDS_CORRECTION | ${counts.NEEDS_CORRECTION || 0} |
| STALE_REVIEW | ${counts.STALE_REVIEW || 0} |

## 5. 数据库批准前置（后续阶段）

须同时满足：

1. 人工 JSON \`APPROVED\`  
2. 审核人/时间/意见真实  
3. 指纹与 content_version 一致  
4. 后端批准门禁通过  
5. **用户另行明确授权**该 code 的数据库批准  

未通过审核：保持 draft。

## 6. 校验命令

\`\`\`bash
pnpm --filter api run hs-math:p1-0fc2-human-review
\`\`\`

## 7. 下一阶段

**WAITING_FOR_HUMAN_REVIEW**
`
  fs.writeFileSync(DOC22, `${doc}\n`, 'utf8')
}

async function main() {
  const checkOnly = process.argv.includes('--check-only')
  const { sha, live } = await loadLiveFingerprints()
  const liveFp = new Map(
    [...live.entries()].map(([k, v]) => [k, { fp: v.fp, cv: v.cv }]),
  )

  let doc: any
  if (checkOnly && fs.existsSync(OUT_JSON)) {
    doc = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'))
  } else {
    const items: ReviewItem[] = EXPECTED_CODES.map((code) => {
      const L = live.get(code)!
      return {
        code,
        status: 'PENDING',
        reviewer: null,
        reviewedAt: null,
        reviewedContentVersion: L.cv,
        contentFingerprint: L.fp,
        comment: '',
        highlight: HIGHLIGHT.has(code),
        agentNote: AGENT_NOTES[code] || undefined,
      }
    })
    const reviewBundleVersion = crypto
      .createHash('sha256')
      .update(
        JSON.stringify(
          items.map((i) => ({
            code: i.code,
            fp: i.contentFingerprint,
            cv: i.reviewedContentVersion,
          })),
        ),
        'utf8',
      )
      .digest('hex')

    doc = {
      phase: 'P1-0F-C2',
      section: '1.1',
      title: '集合的概念',
      sourceSha256: sha,
      reviewBundleVersion,
      generatedAt: new Date().toISOString(),
      notice:
        'status=APPROVED 仅表示人工审核通过，不等于数据库 hs_math_train_items.status=approved。禁止自动批准。',
      items,
    }
    fs.writeFileSync(OUT_JSON, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
    enhanceReviewMd()
  }

  const result = validateReviewFile(doc, liveFp)
  writeSummary(doc, result.counts, true)
  writeDoc22(result.counts)

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        counts: result.counts,
        errors: result.errors,
        path: OUT_JSON,
        sha,
      },
      null,
      2,
    ),
  )
  if (!result.ok) {
    console.error(result.errors.join('\n'))
    process.exitCode = 1
  }
  if ((result.counts.APPROVED || 0) !== 0 && !checkOnly) {
    // 初始化阶段强制 APPROVED=0；若已有真实审核则 check-only 可保留
    console.warn('NOTE: 非 check-only 生成时 APPROVED 应为 0')
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
