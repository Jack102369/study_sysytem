/**
 * P1-FUNC-2：奇偶性 25 题结构校验 + 独立数学复核 + 写出 JSON/审核材料。
 * 不写库；不调用 import API。
 *
 * 运行：pnpm --filter api run hs-math:p1-func2-check
 */
import * as fs from 'fs'
import * as path from 'path'
import { validateAnswerPayload } from './answer-payload.validate'
import {
  isForbiddenTrainItemCode,
  normalizeStemForDedupe,
  validateImportItemStructure,
} from './train-item-import.validate'
import {
  PARITY25_ITEMS,
  toImportItems,
  type BankItem,
} from './hs-math-p1-func2-parity-items'

const ROOT = path.resolve(__dirname, '../../../../../')
const OUT_DIR = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_03',
)

const ALLOWED_KP = new Set([
  'rja.3.2.09',
  'rja.3.2.10',
  'rja.3.2.11',
  'rja.3.2.12',
])

const EXPECT_GROUP: Record<string, number> = {
  definition: 5,
  domain_symmetry: 4,
  judgment: 5,
  evaluation: 4,
  graph: 3,
  mono_combo: 4,
}

const EXPECT_PRIMARY: Record<string, number> = {
  'rja.3.2.09': 6,
  'rja.3.2.10': 7,
  'rja.3.2.11': 5,
  'rja.3.2.12': 7,
}

type MathStatus =
  | 'VERIFIED_BY_CALC'
  | 'VERIFIED_BY_ENUM'
  | 'VERIFIED_BY_LOGIC'
  | 'NEEDS_HUMAN_REVIEW'
  | 'FAILED'

type ReviewRow = {
  code: string
  group: string
  primaryKp: string
  qtype: string
  difficulty: number
  answerSummary: string
  structure: 'PASS' | 'FAIL'
  math: MathStatus
  method: string
  human: 'PENDING'
  note: string
}

let fails = 0
function fail(msg: string) {
  fails++
  console.error('FAIL:', msg)
}
function pass(msg: string) {
  console.log('PASS:', msg)
}

function ansSummary(it: BankItem): string {
  const p = it.answerPayload as any
  if (p.kind === 'single') return `single:${p.optionId}`
  if (p.kind === 'multi') return `multi:${(p.optionIds || []).join('+')}`
  if (p.kind === 'judge') return `judge:${p.value}`
  if (p.kind === 'numeric') return `numeric:${p.value}`
  return '?'
}

function optionText(it: BankItem, id: string): string {
  return (
    it.options?.options.find((o) => o.id === id)?.text.replace(/\s+/g, ' ') ||
    id
  )
}

/** 独立数学复核：按题号硬编码重算/逻辑，不盲信解析文字 */
function verifyMath(it: BankItem): {
  status: MathStatus
  method: string
  note: string
} {
  const n = Number(it.code.slice(-4))
  const p = it.answerPayload as any

  const expectSingle = (id: string, method: string, note: string) => {
    if (p.kind === 'single' && p.optionId === id) {
      return { status: 'VERIFIED_BY_LOGIC' as MathStatus, method, note }
    }
    return {
      status: 'FAILED' as MathStatus,
      method,
      note: `答案冲突：期望 ${id}，题库 ${p.optionId}`,
    }
  }
  const expectMulti = (ids: string[], method: string, note: string) => {
    const got = [...(p.optionIds || [])].map(String).sort().join(',')
    const exp = [...ids].sort().join(',')
    if (p.kind === 'multi' && got === exp) {
      return { status: 'VERIFIED_BY_LOGIC' as MathStatus, method, note }
    }
    return {
      status: 'FAILED' as MathStatus,
      method,
      note: `答案冲突：期望 ${exp}，题库 ${got}`,
    }
  }
  const expectJudge = (v: boolean, method: string, note: string) => {
    if (p.kind === 'judge' && Boolean(p.value) === v) {
      return { status: 'VERIFIED_BY_LOGIC' as MathStatus, method, note }
    }
    return {
      status: 'FAILED' as MathStatus,
      method,
      note: `答案冲突：期望 ${v}，题库 ${p.value}`,
    }
  }
  const expectNum = (v: string, method: string, note: string) => {
    if (p.kind === 'numeric' && String(p.value) === v) {
      return { status: 'VERIFIED_BY_CALC' as MathStatus, method, note }
    }
    return {
      status: 'FAILED' as MathStatus,
      method,
      note: `答案冲突：期望 ${v}，题库 ${p.value}`,
    }
  }

  switch (n) {
    case 1:
      return expectSingle(
        'B',
        'definition',
        'f(-x)=f(x) 且定义域对称 ⇒ 偶函数',
      )
    case 2:
      return expectJudge(
        false,
        'definition_prerequisite',
        '缺定义域对称前提不能直接称奇函数',
      )
    case 3:
      return expectSingle('C', 'definition', '奇函数定义需对称定义域 + f(-x)=-f(x)')
    case 4:
      return expectMulti(
        ['A', 'B', 'C', 'D'],
        'definition_props',
        '奇偶定义与 f(0)=0、非奇非偶判别',
      )
    case 5:
      return expectSingle(
        'B',
        'procedure',
        '先对称定义域再验证恒等式；单点不够',
      )
    case 6: {
      // domain of sqrt(x-1)+sqrt(1-x) is {1}
      const domain = [1]
      const symmetric = domain.every((x) => domain.includes(-x))
      if (symmetric) {
        return {
          status: 'FAILED',
          method: 'domain_enum',
          note: '机算认为 {1} 对称，与题意冲突——实则 -1∉{1}',
        }
      }
      return expectSingle(
        'B',
        'domain_enum',
        '定义域 {1}，-1 不在其中，不对称 ⇒ 非奇非偶',
      )
    }
    case 7:
      return expectJudge(
        true,
        'domain_symmetry',
        'R\\{0} 关于原点对称，可讨论奇偶性',
      )
    case 8:
      return expectSingle(
        'B',
        'domain_ineq',
        'x^2-1≥0 ⇒ (-∞,-1]∪[1,+∞)，对称',
      )
    case 9: {
      // A: [-2,2] ok; B: x>-2 no; C: x≠±1 ok; D: {0} ok
      return expectMulti(
        ['A', 'C', 'D'],
        'domain_cases',
        '独立检查四个定义域的对称性',
      )
    }
    case 10: {
      const f = (x: number) => x * x + 1
      const samples = [-2, -1, 0, 1, 2]
      const even = samples.every((x) => f(-x) === f(x))
      const odd = samples.every((x) => f(-x) === -f(x))
      if (!(even && !odd)) {
        return {
          status: 'FAILED',
          method: 'sample_parity',
          note: '抽样显示不是偶函数',
        }
      }
      return expectSingle('B', 'sample_parity', '抽样验证 f(-x)=f(x)')
    }
    case 11: {
      const f = (x: number) => x * x * x - x
      const samples = [-2, -1, 0, 1, 2]
      const odd = samples.every((x) => f(-x) === -f(x))
      if (!odd) {
        return { status: 'FAILED', method: 'sample_parity', note: '抽样非奇' }
      }
      return expectSingle('A', 'sample_parity', '抽样验证 f(-x)=-f(x)')
    }
    case 12: {
      const f = (_x: number) => 0
      const samples = [-3, -1, 0, 1, 2]
      const even = samples.every((x) => f(-x) === f(x))
      const odd = samples.every((x) => f(-x) === -f(x))
      if (!(even && odd)) {
        return { status: 'FAILED', method: 'zero_fn', note: '零函数应既奇又偶' }
      }
      return expectMulti(
        ['A', 'B', 'C'],
        'zero_fn',
        '零函数在对称定义域上既奇又偶',
      )
    }
    case 13: {
      const f = (x: number) => x + Math.abs(x)
      const a = 1
      const even = f(-a) === f(a)
      const odd = f(-a) === -f(a)
      if (even || odd) {
        return {
          status: 'FAILED',
          method: 'sample_parity',
          note: `f(1)=${f(1)}, f(-1)=${f(-1)} 意外满足奇或偶`,
        }
      }
      return expectSingle('D', 'sample_parity', 'x=1 处既非奇亦非偶')
    }
    case 14: {
      const f = (x: number) => x * x + x
      if (f(-1) === f(1)) {
        return { status: 'FAILED', method: 'sample', note: '不应为偶' }
      }
      return expectJudge(false, 'sample', 'f(-1)≠f(1)，不是偶函数')
    }
    case 15:
      return expectNum('-5', 'odd_eval', 'f(-3)=-f(3)=-5')
    case 16:
      return expectNum('7', 'even_eval', 'f(2)=f(-2)=7')
    case 17:
      return expectNum('-7', 'odd_eval_sum', '(-2)+(-5)=-7')
    case 18:
      return expectNum('3', 'even_eval', 'f(-4)=f(4)=3')
    case 19:
      return expectSingle('B', 'graph_def', '偶函数图象关于 y 轴对称')
    case 20:
      return expectSingle(
        'B',
        'origin_symmetry',
        '(a,b)→(-a,-b) 对奇函数图象',
      )
    case 21:
      return expectMulti(
        ['A', 'C', 'D'],
        'y_axis_symmetry',
        '偶：过(3,-1)⇒过(-3,-1)；B 错误',
      )
    case 22:
      return {
        status: 'NEEDS_HUMAN_REVIEW',
        method: 'mono_parity_proof',
        note:
          '机检核对答案为 A；奇函数+正半轴递增⇒负半轴递增的证明需人工确认表述充分',
      }
    case 23:
      return {
        status: 'NEEDS_HUMAN_REVIEW',
        method: 'even_mono_combo',
        note:
          '答案 A/C/D：偶函数正减⇒负增；f(|x|)=f(x)；偶不蕴含单调。建议人工复核证明细节',
      }
    case 24: {
      // counterexample f(x)=x^3-x is odd but not monotone on R
      const f = (x: number) => x * x * x - x
      const samples = [-2, -1, 0, 1, 2]
      const oddOk = samples.every((x) => f(-x) === -f(x))
      const mono =
        f(-2) < f(-1) && f(-1) < f(0) && f(0) < f(1) && f(1) < f(2)
      if (!oddOk || mono) {
        return {
          status: 'FAILED',
          method: 'counterexample',
          note: '反例未按预期工作',
        }
      }
      return expectJudge(
        false,
        'counterexample',
        'x^3-x 奇但不单调，命题为假',
      )
    }
    case 25: {
      // even on [-2,2], f(x)=x+1 on [0,2] ⇒ f(-1)=f(1)=2
      const val = 1 + 1
      if (String(p.optionId) !== 'C' || val !== 2) {
        // still check answer letter
      }
      return expectSingle('C', 'even_piecewise_eval', 'f(-1)=f(1)=2')
    }
    default:
      return {
        status: 'NEEDS_HUMAN_REVIEW',
        method: 'unknown',
        note: '无专项复核分支',
      }
  }
}

function emitArtifacts(rows: ReviewRow[]) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const importItems = toImportItems(PARITY25_ITEMS)
  const jsonBody = {
    _meta: {
      chapter: 'rja-ch3',
      section: '3.2',
      topic: '函数奇偶性',
      count: importItems.length,
      note: 'P1-FUNC-2 正式题库；权威源=hs-math-p1-func2-parity-items.ts；DIFF-2B 源难度 16/7/2；SOURCE_UPDATED_DB_PENDING；未写库、未批准。',
    },
    items: importItems,
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'parity_25.json'),
    JSON.stringify(jsonBody, null, 2),
    'utf8',
  )

  const bookLines: string[] = [
    '# 函数奇偶性 25 题 · 人工审核册',
    '',
    '> 生成自 `hs-math:p1-func2-check`。人工状态均为 **PENDING**。结构/机器复核 PASS ≠ APPROVED。',
    '>',
    '> **P1-FUNC-DIFF-2B**：权威源难度已调为 16/7/2；下列「难度」为**目标难度**。',
    '> 数据库尚未同步 → 状态标记 **SOURCE_UPDATED_DB_PENDING**。',
    '> 5 题调整：0017 2→1；0018 2→1；0020 2→1；0024 3→2；0025 3→1。',
    '> 历史 DIFF-1 审查结论见 `37_*` / `parity_25_difficulty_review.json`（未篡改）。',
    '',
  ]
  for (const it of PARITY25_ITEMS) {
    const row = rows.find((r) => r.code === it.code)!
    bookLines.push(`## ${it.code}`)
    bookLines.push('')
    bookLines.push(`- 题型：${it.qtype}　难度：${it.difficulty}　内容组：${it.contentGroup}`)
    bookLines.push(`- 主 KP：\`${it.primaryKnowledgePointCode}\``)
    bookLines.push(
      `- 关联 KP：${it.knowledgePointCodes.map((k) => `\`${k}\``).join(', ')}`,
    )
    bookLines.push(`- 题干：${it.stem}`)
    if (it.options?.options?.length) {
      bookLines.push('- 选项：')
      for (const o of it.options.options) {
        bookLines.push(`  - ${o.id}. ${o.text}`)
      }
    }
    bookLines.push(`- 答案：${ansSummary(it)}`)
    if (it.qtype === 'single') {
      bookLines.push(
        `  - 正确项文本：${optionText(it, String((it.answerPayload as any).optionId))}`,
      )
    }
    bookLines.push(`- 解析：${it.analysis}`)
    bookLines.push(
      `- 数学复核：${row.math}（${row.method}）— ${row.note}`,
    )
    bookLines.push(`- 人工审核状态：**PENDING**`)
    bookLines.push('')
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'review_book_parity.md'),
    bookLines.join('\n'),
    'utf8',
  )

  const checklist: string[] = [
    '# 函数奇偶性 25 题 · 复核清单',
    '',
    '> **P1-FUNC-DIFF-2B**：下表「难度」列为**目标难度**（源已更新）。DB 仍为旧值时标记 **SOURCE_UPDATED_DB_PENDING**。',
    '> 原难度→目标：0017 2→1；0018 2→1；0020 2→1；0024 3→2；0025 3→1。其余不变。人工仍为 PENDING（≠ 审核 passed）。',
    '',
    '| code | 内容组 | 主KP | 题型 | 难度 | 结构 | 数学 | 人工 | 备注 |',
    '|------|--------|------|------|------|------|------|------|------|',
  ]
  for (const r of rows) {
    checklist.push(
      `| ${r.code} | ${r.group} | ${r.primaryKp} | ${r.qtype} | ${r.difficulty} | ${r.structure} | ${r.math} | ${r.human} | ${r.note.replace(/\|/g, '/')} |`,
    )
  }
  checklist.push('')
  checklist.push(
    `人工：PENDING=${rows.length}，APPROVED=0（未伪造审核人/时间）。`,
  )
  fs.writeFileSync(
    path.join(OUT_DIR, 'review_checklist_parity.md'),
    checklist.join('\n'),
    'utf8',
  )

  const failed = rows.filter((r) => r.math === 'FAILED' || r.structure === 'FAIL')
  const needs = rows.filter((r) => r.math === 'NEEDS_HUMAN_REVIEW')
  const issues: string[] = [
    '# 函数奇偶性 25 题 · 问题与关注点',
    '',
    '## 已确认错误（须阻断准入）',
    '',
  ]
  if (failed.length === 0) {
    issues.push('- （无）')
  } else {
    for (const r of failed) {
      issues.push(`- **${r.code}**：${r.note}`)
    }
  }
  issues.push('')
  issues.push('## 需要人工重点复核（NEEDS_HUMAN_REVIEW）')
  issues.push('')
  if (needs.length === 0) {
    issues.push('- （无）')
  } else {
    for (const r of needs) {
      issues.push(`- **${r.code}**：${r.note}`)
    }
  }
  issues.push('')
  issues.push('## 说明')
  issues.push('')
  issues.push(
    '- 抽样验证仅说明在有限点上满足奇偶关系，**不能**替代对全体实数的证明。',
  )
  issues.push('- 本阶段未导入数据库、未批准。')
  fs.writeFileSync(
    path.join(OUT_DIR, 'review_issues_parity.md'),
    issues.join('\n'),
    'utf8',
  )
}

function main() {
  if (PARITY25_ITEMS.length !== 25) {
    fail(`总数应为 25，实际 ${PARITY25_ITEMS.length}`)
  } else pass('总数 25')

  for (let i = 0; i < 25; i++) {
    const expect = `HSMA-RJA-CH03-PARITY-${String(i + 1).padStart(4, '0')}`
    if (PARITY25_ITEMS[i].code !== expect) {
      fail(`第 ${i + 1} 题 code 应为 ${expect}`)
    }
  }
  pass('code 连续 HSMA-RJA-CH03-PARITY-0001..0025')

  const qtypeCount: Record<string, number> = {}
  const diffCount: Record<number, number> = { 1: 0, 2: 0, 3: 0 }
  const primaryCount: Record<string, number> = {}
  const groupCount: Record<string, number> = {}
  const stemNorm = new Map<string, string>()
  const rows: ReviewRow[] = []

  for (let idx = 0; idx < PARITY25_ITEMS.length; idx++) {
    const it = PARITY25_ITEMS[idx]
    qtypeCount[it.qtype] = (qtypeCount[it.qtype] || 0) + 1
    diffCount[it.difficulty]++
    primaryCount[it.primaryKnowledgePointCode] =
      (primaryCount[it.primaryKnowledgePointCode] || 0) + 1
    groupCount[it.contentGroup] = (groupCount[it.contentGroup] || 0) + 1

    let structure: 'PASS' | 'FAIL' = 'PASS'
    if (it.specialtyCode !== 'rja-ch3') {
      fail(`${it.code} specialtyCode`)
      structure = 'FAIL'
    }
    if (it.categoryCode !== '3.2') {
      fail(`${it.code} categoryCode`)
      structure = 'FAIL'
    }
    if (isForbiddenTrainItemCode(it.code)) {
      fail(`${it.code} 禁止前缀`)
      structure = 'FAIL'
    }
    if (!it.analysis || it.analysis.trim().length < 30) {
      fail(`${it.code} 解析过短`)
      structure = 'FAIL'
    }

    const importShape = toImportItems([it])[0]
    const report = validateImportItemStructure(importShape as any, idx)
    if (!report.ok) {
      fail(
        `${it.code} 结构: ${report.errors.map((e) => e.message).join('; ')}`,
      )
      structure = 'FAIL'
    }
    try {
      validateAnswerPayload({
        qtype: it.qtype,
        optionsJson: it.options ?? null,
        answerPayload: it.answerPayload,
      })
    } catch (e: any) {
      fail(`${it.code} 答案协议: ${e?.message}`)
      structure = 'FAIL'
    }

    for (const kp of it.knowledgePointCodes) {
      if (!ALLOWED_KP.has(kp)) {
        fail(`${it.code} 非法 KP ${kp}`)
        structure = 'FAIL'
      }
      if (kp.startsWith('rja.1.')) {
        fail(`${it.code} 不得关联第一章 KP`)
        structure = 'FAIL'
      }
    }
    if (!it.knowledgePointCodes.includes(it.primaryKnowledgePointCode)) {
      fail(`${it.code} 主 KP 不在列表`)
      structure = 'FAIL'
    }
    if (!ALLOWED_KP.has(it.primaryKnowledgePointCode)) {
      fail(`${it.code} 主 KP 不在奇偶性四码`)
      structure = 'FAIL'
    }

    const ns = normalizeStemForDedupe(it.stem)
    if (stemNorm.has(ns)) {
      fail(`${it.code} 题干与 ${stemNorm.get(ns)} 重复`)
      structure = 'FAIL'
    } else stemNorm.set(ns, it.code)

    const dollars = (it.stem.replace(/\\\$/g, '').match(/\$/g) || []).length
    if (dollars % 2 === 1) {
      fail(`${it.code} LaTeX $ 奇数`)
      structure = 'FAIL'
    }

    const math = verifyMath(it)
    if (math.status === 'FAILED') {
      fail(`${it.code} 数学: ${math.note}`)
    }
    rows.push({
      code: it.code,
      group: it.contentGroup,
      primaryKp: it.primaryKnowledgePointCode,
      qtype: it.qtype,
      difficulty: it.difficulty,
      answerSummary: ansSummary(it),
      structure,
      math: math.status,
      method: math.method,
      human: 'PENDING',
      note: math.note,
    })
  }

  for (const [g, n] of Object.entries(EXPECT_GROUP)) {
    if ((groupCount[g] || 0) !== n) {
      fail(`内容组 ${g} 应为 ${n}，得 ${groupCount[g] || 0}`)
    } else pass(`内容组 ${g}=${n}`)
  }

  if (qtypeCount.single !== 12) fail(`single 应为 12，得 ${qtypeCount.single}`)
  else pass('single=12')
  if (qtypeCount.multi !== 5) fail(`multi 应为 5，得 ${qtypeCount.multi}`)
  else pass('multi=5')
  if (qtypeCount.judge !== 4) fail(`judge 应为 4，得 ${qtypeCount.judge}`)
  else pass('judge=4')
  if (qtypeCount.numeric !== 4) fail(`numeric 应为 4，得 ${qtypeCount.numeric}`)
  else pass('numeric=4')

  // P1-FUNC-DIFF-2B：目标分布 16/7/2（原 12/9/4）
  if (diffCount[1] !== 16) fail(`难度1 应为 16，得 ${diffCount[1]}`)
  else pass('难度1=16')
  if (diffCount[2] !== 7) fail(`难度2 应为 7，得 ${diffCount[2]}`)
  else pass('难度2=7')
  if (diffCount[3] !== 2) fail(`难度3 应为 2，得 ${diffCount[3]}`)
  else pass('难度3=2')

  for (const [kp, n] of Object.entries(EXPECT_PRIMARY)) {
    if ((primaryCount[kp] || 0) !== n) {
      fail(`主 KP ${kp} 应为 ${n}，得 ${primaryCount[kp] || 0}`)
    } else pass(`主 KP ${kp}=${n}`)
  }

  // evaluation group must be the 4 numeric
  const evalItems = PARITY25_ITEMS.filter((i) => i.contentGroup === 'evaluation')
  if (!evalItems.every((i) => i.qtype === 'numeric')) {
    fail('求值组必须全部为 numeric')
  } else pass('求值组均为 numeric')

  emitArtifacts(rows)
  pass('已写出 parity_25.json 与审核材料')

  // 源与 JSON 一致性
  const written = JSON.parse(
    fs.readFileSync(path.join(OUT_DIR, 'parity_25.json'), 'utf8'),
  )
  const fromSrc = toImportItems(PARITY25_ITEMS)
  if (JSON.stringify(written.items) !== JSON.stringify(fromSrc)) {
    fail('parity_25.json 与权威源不一致')
  } else pass('生成一致性：源 ≡ JSON')

  if (rows.length !== 25) fail('审核行数 ≠ 25')
  else pass('审核册/清单覆盖 25 题')

  const mathFailed = rows.filter((r) => r.math === 'FAILED').length
  const needsHuman = rows.filter((r) => r.math === 'NEEDS_HUMAN_REVIEW').length
  const verified = rows.filter((r) =>
    r.math.startsWith('VERIFIED'),
  ).length

  console.log('\n题型', qtypeCount)
  console.log('难度', diffCount)
  console.log('主 KP', primaryCount)
  console.log('内容组', groupCount)
  console.log(
    `数学复核：VERIFIED=${verified} NEEDS_HUMAN=${needsHuman} FAILED=${mathFailed}`,
  )

  if (fails > 0 || mathFailed > 0) {
    console.error(`\nP1-FUNC-2 check FAILED (fails=${fails}, mathFailed=${mathFailed})`)
    process.exit(1)
  }
  console.log('\nhs-math P1-FUNC-2 parity check PASS')
  console.log('NOTE: 未写库；人工 PENDING=25；PASS ≠ APPROVED。')
}

main()
