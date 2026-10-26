/**
 * P1-0F-C1：第一章 1.1 只读核查 + 审核材料生成（绝不写库 / 不批准）。
 *
 * 运行：pnpm --filter api run hs-math:p1-0fc1-review
 */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { createConnection, type RowDataPacket } from 'mysql2/promise'
import { CHAPTER01_ITEMS, type BankItem } from './hs-math-p1-0e-bank-items'
import {
  canonicalizeImportItem,
  fingerprintCanonicalItem,
} from './import-preview-token'
import { validateAnswerPayload } from './answer-payload.validate'

const EXPECTED_SHA =
  '89b6484e6cb69f40437a6b28f603abae3c9eb19c0b08157d27947f72f7ec95c9'
const SECTION = '1.1'
const ROOT = path.resolve(__dirname, '../../../../../')
const BANK_JSON = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/chapter_01_all.json',
)
const MANIFEST = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/import_manifest.json',
)
const OUT_SECTION = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/review_section_1_1.md',
)
const OUT_DOC = path.join(
  ROOT,
  'docs/high_school_math/21_p1_0fc1_section11_review.md',
)

type MathVerdict =
  | 'PASS_INDEPENDENT'
  | 'PASS_WITH_NOTE'
  | 'NEEDS_CORRECTION'
  | 'NEEDS_HUMAN_CONFIRM'

type ReviewEntry = {
  code: string
  verdict: MathVerdict
  method: string
  opinion: string
  specialConfirm: string
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

function ansText(it: BankItem): string {
  const p = it.answerPayload as any
  if (p.kind === 'single') return `选项 ${p.optionId}`
  if (p.kind === 'multi') return `选项 ${(p.optionIds || []).join('、')}`
  if (p.kind === 'judge') return p.value ? '正确（真）' : '错误（假）'
  if (p.kind === 'numeric') return String(p.value)
  return '?'
}

function optionsMd(it: BankItem): string {
  if (!it.options?.options?.length) return '_（本题无选项）_'
  return it.options.options.map((o) => `- **${o.id}.** ${o.text}`).join('\n')
}

/**
 * 独立数学复核意见（Cursor 逻辑分析，≠ 具名人工审核）。
 * 不得因此将 human 标为 APPROVED。
 */
function mathReview(it: BankItem): ReviewEntry {
  const n = Number(it.code.slice(-4))
  const base = {
    code: it.code,
  }

  switch (n) {
    case 1:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          '集合三要素之确定性：仅 C 的对象（方程实根 ±1）唯一确定；A/B/D 含模糊词，不能构成集合。答案 C 正确。',
        specialConfirm: '无',
      }
    case 2:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          '元素与集合用 ∈；1∈A。A 误用 ⊂；C/D 把子集写成属于。答案 B 正确。',
        specialConfirm: '无',
      }
    case 3: {
      const got: number[] = []
      for (let x = -5; x <= 5; x++) if (x >= -2 && x < 2) got.push(x)
      const ok =
        JSON.stringify(got) === JSON.stringify([-2, -1, 0, 1]) &&
        (it.answerPayload as any).optionId === 'B'
      return {
        ...base,
        verdict: ok ? 'PASS_INDEPENDENT' : 'NEEDS_CORRECTION',
        method: 'VERIFIED_BY_ENUM（整数试域）',
        opinion: ok
          ? `论域 ℤ 上枚举 −2≤x<2 得 {−2,−1,0,1}，与选项 B 及标准答案一致。`
          : '枚举结果与标准答案冲突',
        specialConfirm: '无',
      }
    }
    case 4:
      return {
        ...base,
        verdict: 'PASS_WITH_NOTE',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          'A 在选项内声明默认实数后 x²=1 确定；B/C/D 含模糊用语不可作描述条件。答案 A 正确。',
        specialConfirm:
          '建议人工确认：选项内嵌“未指明数集时默认实数”的写法是否符合校本表述习惯（数学结论仍成立）。',
      }
    case 5:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          '∅ 不含元素；{0}、{∅} 均非空集；0∉∅。答案 A 正确。',
        specialConfirm: '无',
      }
    case 6:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          '互异性：{a,a,b}={a,b}，|A|=2。B/C/D 均违反互异性。答案 A 正确。',
        specialConfirm: '无',
      }
    case 7:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          '题干明确约定 ℕ 含 0，故 ℕ⊆ℤ⊆ℚ⊆ℝ。√2∉ℚ；−3∉ℕ。答案 A 正确。',
        specialConfirm: '人工抽查：约定“ℕ 含 0”已在题干声明，与教材两种记法之一一致。',
      }
    case 8: {
      const k = -3
      const ok = 2 * k + 1 === -5 && (it.answerPayload as any).optionId === 'A'
      return {
        ...base,
        verdict: ok ? 'PASS_INDEPENDENT' : 'NEEDS_CORRECTION',
        method: 'VERIFIED_BY_CALC',
        opinion: ok
          ? '取 k=−3 得 2k+1=−5，故 −5∈A（负奇数属于奇数集）。答案 A 正确。'
          : '计算与答案冲突',
        specialConfirm: '无',
      }
    }
    case 9:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          'A：正整数 1..9 确定；B：ℝ 上 x²+1=0 无解→∅ 仍是集合；D：圆确定；C：“著名”不确定。答案 A+B+D 正确。',
        specialConfirm: '无',
      }
    case 10:
      return {
        ...base,
        verdict: 'PASS_WITH_NOTE',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          'A/B/D 符合教材基本表示法。C 过绝对：无限集可用省略号列举（如正偶数）。答案 A+B+D 正确。',
        specialConfirm:
          '建议人工确认：本校对“列举法是否允许省略号表示无限集”的教学口径是否与 C 为错一致。',
      }
    case 11:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          'A={∅}：∅∈A，|A|=1；∅⊆任何集合故 ∅⊆A；A≠∅。答案 A+B+D 正确。',
        specialConfirm: '无',
      }
    case 12:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion: '无序性：{1,2,3}={3,2,1}。命题为真。',
        specialConfirm: '无',
      }
    case 13:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion:
          '∅ 是任何集合的子集，但不必是元素；反例 ∅∉{1,2}。命题为假。',
        specialConfirm: '无',
      }
    case 14:
      return {
        ...base,
        verdict: 'PASS_INDEPENDENT',
        method: 'VERIFIED_BY_LOGIC',
        opinion: '描述法须明确论域或约定默认范围，否则集合可能不明确。命题为真。',
        specialConfirm: '无',
      }
    case 15: {
      const expect = String(new Set([2, 4, 6, 8]).size)
      const ok = expect === String((it.answerPayload as any).value)
      return {
        ...base,
        verdict: ok ? 'PASS_INDEPENDENT' : 'NEEDS_CORRECTION',
        method: 'VERIFIED_BY_CALC',
        opinion: ok
          ? `独立计数 |{2,4,6,8}|=4，与标准答案一致。`
          : '计数冲突',
        specialConfirm: '无',
      }
    }
    case 16: {
      const xs: number[] = []
      for (let x = -2; x <= 8; x++) if (x > 0 && x <= 5) xs.push(x)
      const ok =
        xs.length === 5 && String((it.answerPayload as any).value) === '5'
      return {
        ...base,
        verdict: ok ? 'PASS_INDEPENDENT' : 'NEEDS_CORRECTION',
        method: 'VERIFIED_BY_ENUM',
        opinion: ok
          ? `ℤ 上 0<x≤5 枚举得 {1,2,3,4,5}，个数 5。与标准答案一致。`
          : '枚举冲突',
        specialConfirm: '无',
      }
    }
    default:
      return {
        ...base,
        verdict: 'NEEDS_HUMAN_CONFIRM',
        method: 'N/A',
        opinion: '非 1.1 预期编号',
        specialConfirm: '检查归属',
      }
  }
}

async function main() {
  const env = loadEnv()
  if ((env.DB_NAME || 'study_system') !== 'study_system') {
    throw new Error('DB_NAME 必须为 study_system')
  }

  const raw = fs.readFileSync(BANK_JSON)
  const sha = crypto.createHash('sha256').update(raw).digest('hex')
  if (sha !== EXPECTED_SHA) {
    throw new Error(
      `JSON SHA 漂移 actual=${sha} expected=${EXPECTED_SHA} — 停止审核准备`,
    )
  }
  console.log(`[SHA] MATCH ${sha}`)

  const sourceItems = CHAPTER01_ITEMS.filter((it) => it.categoryCode === SECTION)
  if (sourceItems.length !== 16) {
    throw new Error(`源文件 1.1 题数=${sourceItems.length}，期望 16`)
  }
  console.log(
    `[SOURCE] 1.1 codes ${sourceItems[0].code}..${sourceItems[15].code}`,
  )

  const bankJson = JSON.parse(raw.toString('utf8')) as { items: BankItem[] }
  const json11 = bankJson.items.filter((it) => it.categoryCode === SECTION)
  if (json11.length !== 16) {
    throw new Error(`聚合 JSON 中 1.1 题数=${json11.length}`)
  }

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
  })

  // 按小节归属查询（不以 code 推断）
  const [dbRows] = await conn.query<RowDataPacket[]>(
    `SELECT t.id, t.code, t.pool, t.qtype, t.difficulty, t.stem, t.options_json,
            t.answer_payload_json, t.analysis, t.status, t.is_active,
            t.content_version, t.grade_rule_version,
            s.code AS specialty_code, s.name AS specialty_name, s.is_active AS sp_active,
            c.code AS category_code, c.name AS category_name, c.is_active AS cat_active
     FROM hs_math_train_items t
     JOIN hs_math_specialties s ON s.id = t.specialty_id
     JOIN hs_math_categories c ON c.id = t.category_id
     WHERE s.code = 'rja-ch1' AND c.code = ?
     ORDER BY t.code`,
    [SECTION],
  )

  const [allCh01] = await conn.query<RowDataPacket[]>(
    `SELECT t.code, c.code AS category_code
     FROM hs_math_train_items t
     JOIN hs_math_categories c ON c.id = t.category_id
     JOIN hs_math_specialties s ON s.id = t.specialty_id
     WHERE s.code='rja-ch1' AND t.code LIKE 'HSMA-RJA-CH01-%'
     ORDER BY t.code`,
  )

  const codes0001_0016 = Array.from({ length: 16 }, (_, i) => {
    const n = String(i + 1).padStart(4, '0')
    return `HSMA-RJA-CH01-${n}`
  })
  const wrongSection = allCh01.filter(
    (r) =>
      codes0001_0016.includes(String(r.code)) &&
      String(r.category_code) !== SECTION,
  )
  const dbCodes = dbRows.map((r) => String(r.code)).sort()
  const srcCodes = sourceItems.map((i) => i.code).sort()

  let sectionOk =
    dbRows.length === 16 &&
    wrongSection.length === 0 &&
    JSON.stringify(dbCodes) === JSON.stringify(srcCodes) &&
    dbRows.every(
      (r) =>
        String(r.specialty_code) === 'rja-ch1' &&
        String(r.category_code) === SECTION &&
        String(r.status) === 'draft' &&
        String(r.pool) === 'formal',
    )

  console.log(`[DB] section 1.1 rows=${dbRows.length} sectionOk=${sectionOk}`)
  if (wrongSection.length) {
    console.error('[DB] code 范围与小节不一致', wrongSection)
  }

  const [links] = await conn.query<RowDataPacket[]>(
    `SELECT l.item_id, l.is_primary, k.code AS kp_code, t.code AS item_code
     FROM hs_math_train_item_kps l
     JOIN hs_math_knowledge_points k ON k.id = l.knowledge_point_id
     JOIN hs_math_train_items t ON t.id = l.item_id
     WHERE t.id IN (${dbRows.map(() => '?').join(',') || 'NULL'})
     ORDER BY t.code, l.is_primary DESC, k.code`,
    dbRows.map((r) => r.id),
  )
  const linksByCode = new Map<string, RowDataPacket[]>()
  for (const l of links) {
    const c = String(l.item_code)
    if (!linksByCode.has(c)) linksByCode.set(c, [])
    linksByCode.get(c)!.push(l)
  }

  const manifest = fs.existsSync(MANIFEST)
    ? (JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as {
        items: Array<{ code: string; contentFingerprint: string }>
      })
    : { items: [] }
  const mfp = new Map(manifest.items.map((x) => [x.code, x.contentFingerprint]))

  let matchCount = 0
  const mismatches: string[] = []
  const contentVersions: Array<{ code: string; v: number }> = []

  for (const src of sourceItems) {
    const row = dbRows.find((r) => String(r.code) === src.code)
    if (!row) {
      mismatches.push(`${src.code}: DB_MISSING`)
      continue
    }
    contentVersions.push({
      code: src.code,
      v: Number(row.content_version),
    })
    if (Number(row.content_version) !== 1) {
      mismatches.push(
        `${src.code}: content_version=${row.content_version}（导入后疑似被改）`,
      )
    }

    let dbNorm: { optionsJson: unknown; answerPayload: unknown }
    let importNorm: { optionsJson: unknown; answerPayload: unknown }
    try {
      dbNorm = validateAnswerPayload({
        qtype: row.qtype as any,
        optionsJson: row.options_json,
        answerPayload: row.answer_payload_json,
      })
      importNorm = validateAnswerPayload({
        qtype: src.qtype,
        optionsJson: src.options ?? null,
        answerPayload: src.answerPayload,
      })
    } catch (e: any) {
      mismatches.push(`${src.code}: PROTOCOL ${e?.message || e}`)
      continue
    }

    const itemLinks = linksByCode.get(src.code) || []
    const kpCodes = itemLinks
      .map((l) => String(l.kp_code))
      .filter(Boolean)
      .sort()
    const primaries = itemLinks.filter((l) => Number(l.is_primary) === 1)
    const primaryCode = primaries[0] ? String(primaries[0].kp_code) : ''
    if (primaries.length !== 1) {
      mismatches.push(`${src.code}: primary_count=${primaries.length}`)
    }
    const expectKp = [...src.knowledgePointCodes].map(String).sort()
    if (JSON.stringify(kpCodes) !== JSON.stringify(expectKp)) {
      mismatches.push(
        `${src.code}: KP_MISMATCH db=[${kpCodes}] src=[${expectKp}]`,
      )
    }
    if (primaryCode !== src.primaryKnowledgePointCode) {
      mismatches.push(
        `${src.code}: PRIMARY_MISMATCH db=${primaryCode} src=${src.primaryKnowledgePointCode}`,
      )
    }

    const dbCanon = {
      code: String(row.code),
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
    const importFp = fingerprintCanonicalItem(importCanon)
    if (dbFp !== importFp) {
      mismatches.push(`${src.code}: CONTENT_FP db≠source`)
      continue
    }
    const mf = mfp.get(src.code)
    if (mf) {
      const srcCanon = canonicalizeImportItem(src)!
      const srcFp = fingerprintCanonicalItem(srcCanon)
      if (mf !== srcFp && mf !== importFp) {
        mismatches.push(`${src.code}: MANIFEST_FP_DRIFT`)
        continue
      }
    }
    matchCount++
  }

  const reviews = sourceItems.map((it) => mathReview(it))
  const passN = reviews.filter(
    (r) => r.verdict === 'PASS_INDEPENDENT' || r.verdict === 'PASS_WITH_NOTE',
  ).length
  const noteN = reviews.filter((r) => r.verdict === 'PASS_WITH_NOTE').length
  const corrN = reviews.filter((r) => r.verdict === 'NEEDS_CORRECTION').length
  const confirmN = reviews.filter(
    (r) => r.verdict === 'NEEDS_HUMAN_CONFIRM',
  ).length

  if (!sectionOk || mismatches.length || corrN > 0) {
    console.warn('[GATE] 存在归属/指纹/数学问题，标记 NOT_READY 或受限')
  }

  const generatedAt = new Date().toISOString()
  const reviewMap = new Map(reviews.map((r) => [r.code, r]))

  // —— review_section_1_1.md ——
  const parts: string[] = []
  parts.push(`# 第一章 1.1《集合的概念》人工审核表（P1-0F-C1）`)
  parts.push('')
  parts.push(`> 生成时间：${generatedAt}`)
  parts.push(`> 题库 SHA-256：\`${sha}\``)
  parts.push(`> 数据库：study_system（本阶段只读）`)
  parts.push('')
  parts.push(`## 具名人工审核栏（须由真人填写）`)
  parts.push('')
  parts.push(`| 字段 | 填写 |`)
  parts.push(`|------|------|`)
  parts.push(`| 审核人 | _（待填，Cursor 不得代填）_ |`)
  parts.push(`| 审核时间 | _（待填）_ |`)
  parts.push(`| 审核意见 | _（待填：通过 / 退回修改 / 存疑）_ |`)
  parts.push(`| 审核状态 | **PENDING**（禁止 Cursor 改为 APPROVED） |`)
  parts.push(`| 审核版本指纹（文件 SHA-256） | \`${sha}\` |`)
  parts.push('')
  parts.push(
    `说明：下方「独立数学复核意见」为 Cursor 逻辑分析，**不等于**具名人工审核通过。`,
  )
  parts.push('')
  parts.push(`## 汇总`)
  parts.push('')
  parts.push(`| 项 | 值 |`)
  parts.push(`|----|-----|`)
  parts.push(`| 题数 | ${sourceItems.length} |`)
  parts.push(
    `| code | ${sourceItems[0].code} .. ${sourceItems[sourceItems.length - 1].code} |`,
  )
  parts.push(`| DB 小节归属一致 | ${sectionOk ? '是' : '否'} |`)
  parts.push(`| 内容指纹一致 | ${matchCount}/16 |`)
  parts.push(`| 数学复核通过（含备注） | ${passN} |`)
  parts.push(`| 其中需人工特别确认口径 | ${noteN} |`)
  parts.push(`| NEEDS_CORRECTION | ${corrN} |`)
  parts.push(`| 人工状态 | 全部 PENDING |`)
  parts.push('')

  for (const it of sourceItems) {
    const row = dbRows.find((r) => String(r.code) === it.code)
    const rev = reviewMap.get(it.code)!
    const itemLinks = linksByCode.get(it.code) || []
    const dbMatch = !mismatches.some((m) => m.startsWith(it.code + ':'))
    parts.push(`---`)
    parts.push('')
    parts.push(`### ${it.code}`)
    parts.push('')
    parts.push(`| 项 | 值 |`)
    parts.push(`|----|-----|`)
    parts.push(`| 教材小节 | 1.1 集合的概念 |`)
    parts.push(`| 题型 | ${it.qtype} |`)
    parts.push(`| 难度 | ${it.difficulty} |`)
    parts.push(`| 主 KP | ${it.primaryKnowledgePointCode} |`)
    parts.push(`| 全部 KP | ${it.knowledgePointCodes.join(', ')} |`)
    parts.push(`| DB status | ${row?.status ?? 'MISSING'} |`)
    parts.push(`| DB pool | ${row?.pool ?? 'MISSING'} |`)
    parts.push(`| DB content_version | ${row?.content_version ?? 'MISSING'} |`)
    parts.push(
      `| DB 小节 | ${row?.category_code ?? '?'} / ${row?.category_name ?? ''} |`,
    )
    parts.push(`| 数据库内容核对 | ${dbMatch ? '一致' : '不一致（见问题清单）'} |`)
    parts.push(`| 独立数学复核 | **${rev.verdict}**（${rev.method}） |`)
    parts.push(`| 人工审核状态 | **PENDING** |`)
    parts.push('')
    parts.push(`#### 题干`)
    parts.push('')
    parts.push(it.stem)
    parts.push('')
    parts.push(`#### 选项`)
    parts.push('')
    parts.push(optionsMd(it))
    parts.push('')
    parts.push(`#### 标准答案`)
    parts.push('')
    parts.push(ansText(it))
    parts.push('')
    parts.push(`#### 解析`)
    parts.push('')
    parts.push(it.analysis)
    parts.push('')
    parts.push(`#### 独立数学复核意见`)
    parts.push('')
    parts.push(rev.opinion)
    parts.push('')
    parts.push(`#### 需要人工特别确认的问题`)
    parts.push('')
    parts.push(rev.specialConfirm)
    parts.push('')
    parts.push(`#### 人工审核记录（真人填写）`)
    parts.push('')
    parts.push(`- 审核人：`)
    parts.push(`- 审核时间：`)
    parts.push(`- 审核意见：`)
    parts.push(`- 本题审核状态：PENDING`)
    parts.push('')
  }

  if (mismatches.length) {
    parts.push(`## 版本不一致明细`)
    parts.push('')
    for (const m of mismatches) parts.push(`- ${m}`)
    parts.push('')
  }

  fs.writeFileSync(OUT_SECTION, parts.join('\n'), 'utf8')
  console.log(`[OUT] ${OUT_SECTION}`)

  // —— 批准门禁 / 训练池源码审计（只读）——
  const gateSrc = fs.readFileSync(
    path.join(
      __dirname,
      '../admin/hs-math-admin-train-items.service.ts',
    ),
    'utf8',
  )
  const ctrlSrc = fs.readFileSync(
    path.join(
      __dirname,
      '../admin/hs-math-admin-train-items.controller.ts',
    ),
    'utf8',
  )
  const trainSrc = fs.readFileSync(
    path.join(__dirname, '../train/hs-math-train.service.ts'),
    'utf8',
  )
  const statusSrc = fs.readFileSync(
    path.join(__dirname, './train-item-status.ts'),
    'utf8',
  )

  const gateChecks = [
    {
      name: 'AdminGuard on controller',
      ok: ctrlSrc.includes('AdminGuard') && ctrlSrc.includes('JwtAuthGuard'),
    },
    {
      name: 'assertApproveQualityGate',
      ok: gateSrc.includes('assertApproveQualityGate'),
    },
    {
      name: 'analysis required',
      ok: gateSrc.includes('analysis') && gateSrc.includes('不能为空'),
    },
    {
      name: 'KP + single primary',
      ok:
        gateSrc.includes('至少关联一个知识点') &&
        gateSrc.includes('有且仅有一个主知识点'),
    },
    {
      name: 'specialty/category active',
      ok:
        gateSrc.includes('所属章节不存在或未启用') &&
        gateSrc.includes('所属小节不存在或未启用'),
    },
    {
      name: 'validateAnswerPayload',
      ok: gateSrc.includes('validateAnswerPayload'),
    },
    {
      name: 'block test prefix',
      ok: gateSrc.includes('isBlockedFromApprove'),
    },
    {
      name: 'block test pool',
      ok: gateSrc.includes("pool === 'test'"),
    },
    {
      name: 'approved content edit → draft',
      ok:
        statusSrc.includes('isSubstantiveTrainItemChange') &&
        gateSrc.includes("status === 'approved'"),
    },
    {
      name: 'train picks approved+active+formal',
      ok:
        trainSrc.includes("status: 'approved'") &&
        trainSrc.includes('isActive: true') &&
        trainSrc.includes('pool: poolMode'),
    },
    {
      name: 'isTrainCandidate draft false',
      ok: statusSrc.includes("status === 'approved' && !!isActive"),
    },
    {
      name: 'session snapshot lock',
      ok:
        trainSrc.includes('pessimistic_write') &&
        trainSrc.includes('knowledgePointCodesJson'),
    },
  ]
  const gatePass = gateChecks.every((c) => c.ok)

  const ready =
    sectionOk &&
    matchCount === 16 &&
    mismatches.length === 0 &&
    corrN === 0 &&
    gatePass

  const doc = `# P1-0F-C1：1.1《集合的概念》审核准备

> 生成时间：${generatedAt}
> **本阶段只读**：无 INSERT/UPDATE/DELETE；无批准。

## 1. 16 道题数据库状态

| 项 | 值 |
|----|-----|
| 查询方式 | specialty=\`rja-ch1\` AND category=\`1.1\`（非仅凭 code） |
| 题数 | ${dbRows.length} |
| code | ${dbCodes[0] || '-'} .. ${dbCodes[dbCodes.length - 1] || '-'} |
| 全部 draft | ${dbRows.every((r) => r.status === 'draft') ? '是' : '否'} |
| 全部 formal | ${dbRows.every((r) => r.pool === 'formal') ? '是' : '否'} |
| code0001–0016 错小节 | ${wrongSection.length} |
| 归属检查 | **${sectionOk ? 'PASS' : 'FAIL'}** |

### content_version

${contentVersions.map((x) => `- ${x.code}: ${x.v}`).join('\n')}

## 2. 文件版本核对

| 项 | 值 |
|----|-----|
| JSON SHA-256 | \`${sha}\` |
| 与授权版本一致 | **是** |
| 源 TS 1.1 题数 | ${sourceItems.length} |
| 指纹一致 | **${matchCount}/16** |
| 不一致 | ${mismatches.length} |

${
  mismatches.length
    ? mismatches.map((m) => `- ${m}`).join('\n')
    : '无不一致。'
}

## 3. 数学复核结论（Cursor 独立分析 ≠ 人工 APPROVED）

| 项 | 数量 |
|----|------|
| PASS_INDEPENDENT | ${reviews.filter((r) => r.verdict === 'PASS_INDEPENDENT').length} |
| PASS_WITH_NOTE | ${noteN} |
| NEEDS_CORRECTION | ${corrN} |
| NEEDS_HUMAN_CONFIRM | ${confirmN} |

### 需人工特别确认口径

${reviews
  .filter((r) => r.specialConfirm && r.specialConfirm !== '无')
  .map((r) => `- **${r.code}**：${r.specialConfirm}`)
  .join('\n') || '_无额外口径问题_'}

### 明确错误

${corrN === 0 ? '无。' : reviews.filter((r) => r.verdict === 'NEEDS_CORRECTION').map((r) => `- ${r.code}: ${r.opinion}`).join('\n')}

## 4. 人工审核状态

| 项 | 值 |
|----|-----|
| PENDING | **16** |
| APPROVED | **0**（Cursor 禁止填写） |
| REJECTED | **0** |
| 审核人 | _未填写_ |
| 审核表 | \`review_section_1_1.md\` |

## 5. 后端批准门禁检查（源码审计）

| 检查项 | 结果 |
|--------|------|
${gateChecks.map((c) => `| ${c.name} | ${c.ok ? 'PASS' : 'FAIL'} |`).join('\n')}

汇总：**${gatePass ? 'PASS' : 'FAIL'}**

## 6. 正式训练池条件（源码）

- 抽题：\`status='approved'\` AND \`isActive=true\` AND \`pool=formal\`（及 specialty/category/difficulty）
- draft / disabled / P0 测试前缀题不会被上述条件抽中
- 会话创建时对题目行加锁并写入知识点快照（\`knowledgePointsSnapshot\`）
- **本阶段未创建训练会话**

汇总：**${gateChecks.filter((c) => c.name.startsWith('train') || c.name.startsWith('isTrain') || c.name.startsWith('session')).every((c) => c.ok) ? 'PASS' : 'FAIL'}**

## 7. 下一步人工操作要求

1. 打开 \`review_section_1_1.md\`，由**具名审核人**逐题阅读并填写每题审核记录。
2. 特别确认 0004、0007、0010 的教学口径备注。
3. 全部通过且版本指纹仍为 \`${sha}\` 后，再另行授权**单题批准**（下一阶段）。
4. 任一题未通过：保持 draft，不得为凑数批准。

## 8. 后续单题批准流程（设计，本阶段不执行）

1. 具名人工审核通过该 code。
2. 审核版本指纹 = 当前文件 SHA 且 DB 内容指纹未变。
3. DB \`status=draft\`。
4. \`PATCH /hs-math/admin/train-items/:id/status\` → \`approved\`（Admin + 门禁）。
5. 仅批准授权列表中的 code。
6. 批准后核对：该题 approved；其余 1.1/全章未授权题仍 draft；P0 仍 disabled；正式可抽题数仅增加已批题。

## 9. 是否允许进入单题批准准备

**${ready ? 'READY_FOR_HUMAN_REVIEW' : 'NOT_READY'}**

READY_FOR_HUMAN_REVIEW ≠ 允许批准；须具名审核 + 用户另授批准权。

## 10. 数据库变化

**无写入**（仅 SELECT）。

## 11. 其他模块

未修改 chemistry / 错题本 / 小学数学 / JWT / 判题协议。
`

  fs.writeFileSync(OUT_DOC, doc, 'utf8')
  console.log(`[OUT] ${OUT_DOC}`)

  console.log('\n========== 【P1-0F-C1 实施结果】 ==========')
  console.log(`总体状态：${ready ? 'PASS' : corrN || mismatches.length || !sectionOk ? 'BLOCKED' : 'PARTIAL'}`)
  console.log(`第一节数量：${dbRows.length}`)
  console.log(`版本一致：${matchCount}/16`)
  console.log(`数学：pass=${passN} note=${noteN} correction=${corrN}`)
  console.log(`人工：PENDING=16 APPROVED=0`)
  console.log(`批准门禁：${gatePass ? 'PASS' : 'FAIL'}`)
  console.log(`准入：${ready ? 'READY_FOR_HUMAN_REVIEW' : 'NOT_READY'}`)
  console.log('DB：只读无写入')
  console.log('==========================================\n')

  await conn.end()
  if (!ready && (corrN > 0 || mismatches.length > 0 || !sectionOk)) {
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error('[P1-0F-C1 FAILED]', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
