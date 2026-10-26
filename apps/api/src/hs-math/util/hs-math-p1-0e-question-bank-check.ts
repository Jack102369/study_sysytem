/**
 * P1-0E：只读校验第一章题库 JSON / 源数据，并写出 docs 下 JSON 文件。
 * 不连接数据库写入；不调用 import API。
 *
 * 运行：pnpm --filter api run hs-math:p1-0e-check
 */
import * as fs from 'fs'
import * as path from 'path'
import { validateAnswerPayload } from './answer-payload.validate'
import {
  isForbiddenTrainItemCode,
  normalizeStemForDedupe,
  validateImportItemStructure,
} from './train-item-import.validate'
import { CHAPTER01_ITEMS, type BankItem } from './hs-math-p1-0e-bank-items'

const ROOT = path.resolve(__dirname, '../../../../../')
const OUT_DIR = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01',
)

const CH1_KP = new Set([
  'rja.1.1.01',
  'rja.1.1.02',
  'rja.1.1.03',
  'rja.1.2.01',
  'rja.1.2.02',
  'rja.1.3.01',
  'rja.1.3.02',
  'rja.1.3.03',
  'rja.1.3.04',
  'rja.1.4.01',
  'rja.1.4.02',
  'rja.1.4.03',
  'rja.1.5.01',
  'rja.1.5.02',
  'rja.1.5.03',
])

const SECTION_FILES: Record<string, string> = {
  '1.1': '01_sets_concept.json',
  '1.2': '02_set_relations.json',
  '1.3': '03_set_operations.json',
  '1.4': '04_sufficient_necessary.json',
  '1.5': '05_quantifiers.json',
}

const EXPECT_SECTION_COUNT: Record<string, number> = {
  '1.1': 16,
  '1.2': 16,
  '1.3': 20,
  '1.4': 16,
  '1.5': 12,
}

let fails = 0
function fail(msg: string) {
  fails++
  console.error('FAIL:', msg)
}
function pass(msg: string) {
  console.log('PASS:', msg)
}

function emitJson() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const [cat, file] of Object.entries(SECTION_FILES)) {
    const items = CHAPTER01_ITEMS.filter((i) => i.categoryCode === cat)
    const body = {
      _meta: {
        chapter: 'rja-ch1',
        section: cat,
        count: items.length,
        note: 'P1-0E 正式题库文件；勿含测试前缀；导入前须人工审核。本阶段未写库。',
      },
      items,
    }
    fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(body, null, 2), 'utf8')
  }
  const all = {
    _meta: {
      chapter: 'rja-ch1',
      title: '集合与常用逻辑用语',
      count: CHAPTER01_ITEMS.length,
      note: '聚合文件；应与五个小节文件 items 并集一致。',
    },
    items: CHAPTER01_ITEMS,
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'chapter_01_all.json'),
    JSON.stringify(all, null, 2),
    'utf8',
  )
}

function main() {
  emitJson()
  pass('已写出 chapter_01 JSON 文件')

  if (CHAPTER01_ITEMS.length !== 80) {
    fail(`总数应为 80，实际 ${CHAPTER01_ITEMS.length}`)
  } else pass('总数 80')

  for (const [cat, n] of Object.entries(EXPECT_SECTION_COUNT)) {
    const c = CHAPTER01_ITEMS.filter((i) => i.categoryCode === cat).length
    if (c !== n) fail(`小节 ${cat} 应为 ${n}，实际 ${c}`)
    else pass(`小节 ${cat} = ${n}`)
  }

  const codes = CHAPTER01_ITEMS.map((i) => i.code)
  if (new Set(codes).size !== codes.length) fail('code 不唯一')
  else pass('code 全局唯一')

  for (let i = 0; i < 80; i++) {
    const expect = `HSMA-RJA-CH01-${String(i + 1).padStart(4, '0')}`
    if (CHAPTER01_ITEMS[i].code !== expect) {
      fail(`第 ${i + 1} 题 code 应为 ${expect}`)
    }
  }
  pass('code 连续 HSMA-RJA-CH01-0001..0080')

  const qtypeCount: Record<string, number> = {}
  const diffCount: Record<number, number> = { 1: 0, 2: 0, 3: 0 }
  const primaryCount: Record<string, number> = {}
  const stemNorm = new Map<string, string>()

  for (let idx = 0; idx < CHAPTER01_ITEMS.length; idx++) {
    const it = CHAPTER01_ITEMS[idx]
    qtypeCount[it.qtype] = (qtypeCount[it.qtype] || 0) + 1
    diffCount[it.difficulty] = (diffCount[it.difficulty] || 0) + 1
    primaryCount[it.primaryKnowledgePointCode] =
      (primaryCount[it.primaryKnowledgePointCode] || 0) + 1

    if (it.specialtyCode !== 'rja-ch1') fail(`${it.code} specialtyCode`)
    if (isForbiddenTrainItemCode(it.code)) fail(`${it.code} 测试前缀`)
    if (!it.analysis || it.analysis.trim().length < 30) {
      fail(`${it.code} 解析过短（需≥30字）`)
    }

    const report = validateImportItemStructure(it, idx)
    if (!report.ok) {
      fail(
        `${it.code} 结构: ${report.errors.map((e) => e.message).join('; ')}`,
      )
    }
    try {
      validateAnswerPayload({
        qtype: it.qtype,
        optionsJson: it.options ?? null,
        answerPayload: it.answerPayload,
      })
    } catch (e: any) {
      fail(`${it.code} 答案协议: ${e?.message}`)
    }

    for (const kp of it.knowledgePointCodes) {
      if (!CH1_KP.has(kp)) fail(`${it.code} 非法 KP ${kp}`)
    }
    if (!it.knowledgePointCodes.includes(it.primaryKnowledgePointCode)) {
      fail(`${it.code} 主 KP 不在列表`)
    }

    // KP 与小节：主 KP 的 section 前缀应匹配 categoryCode
    const sec = it.primaryKnowledgePointCode.split('.').slice(0, 3).join('.')
    // rja.1.1.01 -> section 1.1 from parts [rja,1,1,01]
    const parts = it.primaryKnowledgePointCode.split('.')
    const kpSec = `${parts[1]}.${parts[2]}`
    if (kpSec !== it.categoryCode) {
      fail(`${it.code} 主 KP 小节 ${kpSec} ≠ ${it.categoryCode}`)
    }

    const ns = normalizeStemForDedupe(it.stem)
    if (stemNorm.has(ns)) fail(`${it.code} 题干与 ${stemNorm.get(ns)} 重复`)
    else stemNorm.set(ns, it.code)

    const dollars = (it.stem.replace(/\\\$/g, '').match(/\$/g) || []).length
    if (dollars % 2 === 1) fail(`${it.code} LaTeX $ 奇数`)
  }

  if (qtypeCount.single !== 40) fail(`single 应为 40，得 ${qtypeCount.single}`)
  else pass('single=40')
  if (qtypeCount.multi !== 16) fail(`multi 应为 16，得 ${qtypeCount.multi}`)
  else pass('multi=16')
  if (qtypeCount.judge !== 12) fail(`judge 应为 12，得 ${qtypeCount.judge}`)
  else pass('judge=12')
  if (qtypeCount.numeric !== 12) fail(`numeric 应为 12，得 ${qtypeCount.numeric}`)
  else pass('numeric=12')

  if (diffCount[1] !== 40) fail(`难度1 应为 40，得 ${diffCount[1]}`)
  else pass('难度1=40')
  if (diffCount[2] !== 28) fail(`难度2 应为 28，得 ${diffCount[2]}`)
  else pass(`难度2=${diffCount[2]}`)
  if (diffCount[3] !== 12) fail(`难度3 应为 12，得 ${diffCount[3]}`)
  else pass('难度3=12')

  for (const kp of CH1_KP) {
    const n = primaryCount[kp] || 0
    if (n < 3) fail(`主 KP ${kp} 仅 ${n} 题（需≥3）`)
  }
  pass('15 个 KP 主知识点覆盖均 ≥3')

  // 聚合一致性
  const allPath = path.join(OUT_DIR, 'chapter_01_all.json')
  const allJson = JSON.parse(fs.readFileSync(allPath, 'utf8'))
  const merged: BankItem[] = []
  for (const file of Object.values(SECTION_FILES)) {
    const j = JSON.parse(fs.readFileSync(path.join(OUT_DIR, file), 'utf8'))
    merged.push(...j.items)
  }
  if (JSON.stringify(merged.map((x) => x.code)) !== JSON.stringify(allJson.items.map((x: BankItem) => x.code))) {
    fail('聚合文件与小节文件 code 顺序/内容不一致')
  } else pass('聚合一致性')

  console.log('\n题型', qtypeCount)
  console.log('难度', diffCount)
  console.log('主 KP', primaryCount)

  // review_checklist / review_book 由 hs-math:p1-0fa-verify 生成，避免覆盖详尽复核表

  if (fails > 0) {
    console.error(`\nP1-0E check FAILED (${fails})`)
    process.exit(1)
  }
  console.log('\nhs-math P1-0E question-bank check PASS')
  console.log(
    'NOTE: 权威源=hs-math-p1-0e-bank-items.ts；结构 PASS ≠ 数学已证明。',
  )
  console.log(
    'NOTE: 数学复核/审核册请再跑 pnpm --filter api run hs-math:p1-0fa-verify',
  )
}

main()
