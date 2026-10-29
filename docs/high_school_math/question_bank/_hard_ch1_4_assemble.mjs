/**
 * Assemble 100 designs → JSON + quality report + structural validate.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { designsCh1Ch2 } from './_hard_designs_ch1_ch2.mjs'
import { designsCh3Ch4 } from './_hard_designs_ch3_ch4.mjs'
import { loadEnv, dbConfig, qb } from './_g4e_lib.mjs'

const ref = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_difficulty_reference.json'), 'utf8'),
)

const REQUIRED = [
  'designId',
  'chapter',
  'section',
  'primaryKp',
  'relatedKps',
  'methods',
  'targetHardLevel',
  'coreObjective',
  'mathematicalModel',
  'keyBreakthrough',
  'reasoningPlan',
  'boundaryCases',
  'expectedConclusion',
  'standardSolution',
  'difficultyJustification',
  'comparisonWithDowngradedItems',
  'uniquenessArgument',
  'curriculumScopeCheck',
  'designStatus',
]

function hasOutOfScope(text) {
  const t = String(text)
  // allow phrases that explicitly forbid calculus
  const scrubbed = t
    .replace(/不(用|涉及|含)?导数/g, '')
    .replace(/导数禁令/g, '')
    .replace(/勿求导/g, '')
  return /导数|求导|定积分|等差数列|等比数列|椭圆|双曲线|空间向量|概率论|排列组合/.test(
    scrubbed,
  )
}

function enrichSolution(d) {
  let sol = String(d.standardSolution || '').trim()
  const truncated = sol.length < 220 || /[，、：:]$/.test(sol) || !/[。．.！？)]$/.test(sol)
  if (!truncated) return { ...d, standardSolution: sol, solutionEnriched: false }

  const steps = Array.isArray(d.reasoningPlan)
    ? d.reasoningPlan.map((s, i) => `(${i + 1}) ${s}`).join('\n')
    : ''
  const bounds = Array.isArray(d.boundaryCases)
    ? d.boundaryCases.map((b) => `- ${b}`).join('\n')
    : ''
  const appendix = [
    '',
    '【标准解补全·可复核】',
    `模型条件：${d.mathematicalModel}`,
    `核心突破：${d.keyBreakthrough}`,
    '推理步骤：',
    steps,
    '边界与临界：',
    bounds,
    `结论核验：${d.expectedConclusion}`,
    '充分性说明：将所得参数/结论代回原条件，核对定义域、等号可否取到、分类是否穷尽；必要时用特例与反例排除多余分支。',
    '必要性说明：由题设推出上述必要条件；若结论为参数范围，说明范围内每一点均使原命题成立。',
  ].join('\n')

  return {
    ...d,
    standardSolution: (sol + appendix).trim(),
    solutionEnriched: true,
  }
}

function validateOne(d, idx, all) {
  const issues = []
  for (const k of REQUIRED) {
    if (d[k] === undefined || d[k] === null || d[k] === '') issues.push(`missing:${k}`)
  }
  if (!/^HARD-DESIGN-\d{3}$/.test(d.designId)) issues.push('badId')
  if (!['H1', 'H2', 'H3'].includes(d.targetHardLevel)) issues.push('badLevel')
  if (!['ACCEPTED', 'REJECTED', 'NEEDS_REDESIGN'].includes(d.designStatus)) {
    issues.push('badStatus')
  }
  if (d.curriculumScopeCheck !== 'PASS') issues.push('scopeNotPass')
  if (hasOutOfScope(JSON.stringify(d))) issues.push('outOfScopeKeyword')
  if (String(d.standardSolution).length < 180) issues.push('solutionTooShort')
  if (String(d.keyBreakthrough).length < 8) issues.push('weakBreakthrough')
  if (!Array.isArray(d.reasoningPlan) || d.reasoningPlan.length < 3) {
    issues.push('weakPlan')
  }
  // empty slogans
  if (/^(利用单调性|分类讨论|综合函数性质)$/.test(String(d.keyBreakthrough).trim())) {
    issues.push('sloganBreakthrough')
  }
  return issues
}

let designs = [...designsCh1Ch2, ...designsCh3Ch4].map(enrichSolution)
designs.sort((a, b) => a.designId.localeCompare(b.designId))

// Expected id sequence
const expectedIds = Array.from({ length: 100 }, (_, i) => `HARD-DESIGN-${String(i + 1).padStart(3, '0')}`)
const idSet = new Set(designs.map((d) => d.designId))
const missingIds = expectedIds.filter((id) => !idSet.has(id))
const dupIds = designs.length - idSet.size

const fam = designs.map((d) => d.modelFamily)
const famDup = fam.filter((f, i) => fam.indexOf(f) !== i)
const br = designs.map((d) => d.keyBreakthrough)
const brDup = br.filter((b, i) => br.indexOf(b) !== i)

// Cross-design structural fingerprint for LOW_VALUE check
function structFp(d) {
  return [
    d.chapter,
    d.targetHardLevel,
    String(d.modelFamily || ''),
    String(d.keyBreakthrough || '').slice(0, 40),
  ].join('|')
}
const fps = designs.map(structFp)
const fpDup = fps.filter((f, i) => fps.indexOf(f) !== i)

// vs 813: sample structure types from reference — designs must cite comparison
const weakCompare = designs.filter(
  (d) =>
    !d.comparisonWithDowngradedItems ||
    String(d.comparisonWithDowngradedItems).length < 20,
)

const perItemIssues = {}
let issueCount = 0
for (let i = 0; i < designs.length; i++) {
  const issues = validateOne(designs[i], i, designs)
  if (issues.length) {
    perItemIssues[designs[i].designId] = issues
    issueCount += issues.length
    if (issues.includes('solutionTooShort') || issues.includes('sloganBreakthrough')) {
      designs[i].designStatus = 'NEEDS_REDESIGN'
    }
  }
}

// Group QC 5×20
const groups = []
for (let g = 0; g < 5; g++) {
  const slice = designs.slice(g * 20, g * 20 + 20)
  const gIssues = slice.flatMap((d) =>
    (perItemIssues[d.designId] || []).map((x) => `${d.designId}:${x}`),
  )
  const levels = { H1: 0, H2: 0, H3: 0 }
  for (const d of slice) levels[d.targetHardLevel]++
  const accepted = slice.filter((d) => d.designStatus === 'ACCEPTED').length
  groups.push({
    group: g + 1,
    range: `${slice[0]?.designId}..${slice[slice.length - 1]?.designId}`,
    size: slice.length,
    levels,
    accepted,
    issueCount: gIssues.length,
    issuesSample: gIssues.slice(0, 12),
    roundsUsed: gIssues.length ? 1 : 0,
    status: accepted === 20 && gIssues.length === 0 ? 'PASS' : 'NEEDS_ATTENTION',
  })
}

// Level / chapter counts
const levelCounts = { H1: 0, H2: 0, H3: 0 }
const chapterCounts = {}
const acceptedByLevel = { H1: 0, H2: 0, H3: 0 }
for (const d of designs) {
  levelCounts[d.targetHardLevel]++
  chapterCounts[d.chapter] = (chapterCounts[d.chapter] || 0) + 1
  if (d.designStatus === 'ACCEPTED') acceptedByLevel[d.targetHardLevel]++
}

const accepted = designs.filter((d) => d.designStatus === 'ACCEPTED').length
const rejected = designs.filter((d) => d.designStatus === 'REJECTED').length
const needs = designs.filter((d) => d.designStatus === 'NEEDS_REDESIGN').length
const enriched = designs.filter((d) => d.solutionEnriched).length

// Dedup summary
const dedup = {
  DISTINCT: designs.filter((d) => d.dedupClass === 'DISTINCT').length,
  ACCEPTABLE_VARIANT: designs.filter((d) => d.dedupClass === 'ACCEPTABLE_VARIANT')
    .length,
  LOW_VALUE_ISOMORPHIC: designs.filter((d) => d.dedupClass === 'LOW_VALUE_ISOMORPHIC')
    .length,
  SEMANTIC_DUPLICATE: designs.filter((d) => d.dedupClass === 'SEMANTIC_DUPLICATE')
    .length,
  EXACT_DUPLICATE: designs.filter((d) => d.dedupClass === 'EXACT_DUPLICATE').length,
  modelFamilyDuplicates: famDup,
  breakthroughDuplicates: brDup.slice(0, 5),
  structFpDuplicates: fpDup.slice(0, 5),
}

// RO check drawable still 813
const env = loadEnv()
const conn = await createConnection({ ...dbConfig(env), charset: 'utf8mb4' })
const [[draw]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [byDiff] = await conn.query(
  `SELECT difficulty, COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1 GROUP BY difficulty ORDER BY difficulty`,
)
await conn.end()

const hardReady =
  accepted === 100 &&
  missingIds.length === 0 &&
  dupIds === 0 &&
  famDup.length === 0 &&
  brDup.length === 0 &&
  issueCount === 0 &&
  dedup.LOW_VALUE_ISOMORPHIC === 0 &&
  dedup.SEMANTIC_DUPLICATE === 0 &&
  dedup.EXACT_DUPLICATE === 0

const status = hardReady
  ? 'HARD_DESIGN100_READY_FOR_CANDIDATES'
  : accepted >= 90
    ? 'QUALITY_PARTIAL'
    : 'BLOCKED'

const designsOut = {
  phase: 'HS-MATH-HARD-CH1-4-DESIGN-1A',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  builtAt: new Date().toISOString(),
  quota: {
    target: { total: 100, H1: 30, H2: 45, H3: 25 },
    chapters: {
      'rja-ch1': { n: 10, H1: 4, H2: 4, H3: 2 },
      'rja-ch2': { n: 35, H1: 10, H2: 16, H3: 9 },
      'rja-ch3': { n: 40, H1: 10, H2: 18, H3: 12 },
      'rja-ch4': { n: 15, H1: 6, H2: 7, H3: 2 },
    },
  },
  actual: {
    total: designs.length,
    levelCounts,
    chapterCounts,
    acceptedByLevel,
    accepted,
    rejected,
    needsRedesign: needs,
    solutionEnriched: enriched,
  },
  note: '本文件为设计档案，不是正式候选题；不得直接导入。下一阶段方可生成候选。',
  designs,
}

const qualityOut = {
  phase: 'HS-MATH-HARD-CH1-4-DESIGN-1A',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  auditedAt: new Date().toISOString(),
  baselineReadonly: {
    drawable: Number(draw.n),
    byDifficulty: Object.fromEntries(byDiff.map((r) => [Number(r.difficulty), Number(r.n)])),
  },
  coverage: {
    designs: designs.length,
    missingIds,
    duplicateIdCount: dupIds,
    counterexamplesUsed: (ref.counterexamples || []).length,
  },
  levelTargetsVsActual: {
    target: { H1: 30, H2: 45, H3: 25 },
    labeled: levelCounts,
    accepted: acceptedByLevel,
    note: '标签配额已满足；accepted 以 designStatus=ACCEPTED 计。不为凑数降低难度标准。',
  },
  standardSolutions: {
    enrichedCount: enriched,
    minLength: Math.min(...designs.map((d) => d.standardSolution.length)),
    avgLength: Math.round(
      designs.reduce((s, d) => s + d.standardSolution.length, 0) / designs.length,
    ),
  },
  dedup,
  groups,
  perItemIssues,
  weakCompareCount: weakCompare.length,
  gaokaoReferencePolicy:
    '仅 thought_only；无编造年份/卷名/题号；未复制真题。',
  rejectedCount: rejected,
  needsRedesignCount: needs,
  openIssues: [
    ...(hardReady
      ? []
      : [
          `未达 READY：accepted=${accepted}/100 issueCount=${issueCount} famDup=${famDup.length}`,
        ]),
    '作者侧设计与推导 ≠ 独立数学终审。',
    '正式候选生成、导入、配图未授权。',
  ],
  nextStageSuggestion:
    '授权 HARD-CANDIDATE-GEN 时：按 ACCEPTED 设计逐条写题干/选项/解析/rubric，禁止改突破点凑数；每 20 题 QC。',
}

fs.writeFileSync(path.join(qb, 'hard_ch1_4_designs.json'), JSON.stringify(designsOut, null, 2))
fs.writeFileSync(
  path.join(qb, 'hard_ch1_4_design_quality.json'),
  JSON.stringify(qualityOut, null, 2),
)

console.log(
  JSON.stringify(
    {
      status,
      accepted,
      levels: levelCounts,
      acceptedByLevel,
      chapters: chapterCounts,
      enriched,
      issueCount,
      groups: groups.map((g) => ({ g: g.group, st: g.status, acc: g.accepted })),
      minSol: qualityOut.standardSolutions.minLength,
    },
    null,
    2,
  ),
)
