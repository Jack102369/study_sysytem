/**
 * HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1A — offline per-item audit (author-side).
 * Read-only input from _hard_audit_d3_export.json. No DB writes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { qb, docs } from './_g4e_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const exportPath = path.join(qb, 'bank_global4a', '_hard_audit_d3_export.json')
const raw = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
const items = raw.items
const auditedAt = new Date().toISOString()

function textOf(it) {
  const opt =
    typeof it.optionsJson === 'string'
      ? it.optionsJson
      : JSON.stringify(it.optionsJson || '')
  const ans =
    typeof it.answerPayloadJson === 'string'
      ? it.answerPayloadJson
      : JSON.stringify(it.answerPayloadJson || '')
  return {
    stem: String(it.stem || ''),
    analysis: String(it.analysis || ''),
    opt,
    ans,
    all: `${it.stem || ''}\n${it.analysis || ''}\n${opt}\n${ans}`,
  }
}

function has(re, s) {
  return re.test(s)
}

/**
 * Feature extraction — reasons always cite concrete stem snippets.
 * Scoring: higher = harder. True d3 needs breakthrough / deep synthesis.
 */
function auditOne(it) {
  const t = textOf(it)
  const stem = t.stem
  const stemLen = stem.replace(/\s+/g, '').length
  const snippet = stem.replace(/\s+/g, ' ').trim().slice(0, 80)

  const signals = []
  let score = 0

  // —— clear d1 patterns ——
  const d1Hits = []
  if (stemLen <= 18 && !has(/证明|讨论|分类|最值|参数|充分必要/, stem)) {
    d1Hits.push(`题干极短（规范化长度${stemLen}），多为单点计算/取值`)
    score -= 3
  }
  if (has(/^\|[^|]+=\s*$|^sin\([^)]+\)=\s*$|^cos\([^)]+\)=\s*$|^tan\([^)]+\)=\s*$/m, stem) ||
      has(/\|[0-9\-]+[+\-][0-9]*i\|/, stem) ||
      has(/sin\([^)]+\)\s*=\s*$/, stem)) {
    d1Hits.push(`直接求模/特殊角三角函数值（如「${snippet}」）`)
    score -= 4
  }
  if (has(/幂集|2\^|2\^\{|2\^m/, stem) && has(/\|A\|=|集合A|设A/, stem) && !has(/证明|参数|讨论/, stem)) {
    d1Hits.push(`幂集计数/属于关系，属集合基本概念直接应用`)
    score -= 3
  }
  if (has(/求\s*t\s*=|求\s*\$t|求数量|代入/, stem) && has(/2\^\{|a\^\{|e\^\{|n\(t\)/, stem) && !has(/证明|讨论|最值|参数范围/, stem)) {
    d1Hits.push(`指数/对数模型直接代入求值（如「${snippet}」）`)
    score -= 3
  }
  if (has(/正确的是|正确的有|下列.*正确/, stem) && stemLen < 40 && it.qtype !== 'application') {
    d1Hits.push(`选项型概念辨析且题干过短，倾向基础判断`)
    score -= 2
  }
  if (has(/定义域|值域|奇函数|偶函数|单调|增函数|减函数/, stem) && stemLen < 45 && !has(/证明|参数|充分|必要|抽象|复合/, stem)) {
    d1Hits.push(`函数基本性质直接判定，缺少深层综合`)
    score -= 2
  }

  // —— d2 patterns (raise but not 压轴) ——
  const d2Hits = []
  if (has(/只会|都不会|两项都会|韦恩|\\|A\\cup B\\||并集|交集/, stem) && has(/人|名/, stem)) {
    d2Hits.push(`两集合韦恩图人数计算（常规提高套路）`)
    score += 1
  }
  if (has(/\\|U\\|=|1,\\ldots|1,\\\\ldots|补集|\\complement/, stem) && has(/偶数|倍数|并/, stem)) {
    d2Hits.push(`有限全集上容斥/补集计数，多步但套路明确`)
    score += 1
  }
  if (has(/中点|中位线|DE\\parallel|平行且|向量表示/, stem) && has(/证明|求证/, stem)) {
    d2Hits.push(`向量中位线/中点定理证明，属教材常规提高`)
    score += 1
  }
  if (has(/判别式|根的分布|区间根|韦达|配方/, stem) && !has(/参数讨论|分类讨论.*参数|突然|构造/, stem)) {
    d2Hits.push(`二次方程根的分布/韦达常规分析`)
    score += 1
  }
  if (has(/抽象函数|f\(1\).*f\(2\)|f\(a\).*f\(b\)/, stem) && has(/增函数|减函数|奇|偶/, stem) && stemLen < 120) {
    d2Hits.push(`抽象函数+单调性符号推断，有思维量但突破点有限（如「${snippet}」）`)
    score += 2
  }
  if (has(/\(1\).*[\s\S]*\(2\)/, stem) && !has(/\(3\)/, stem) && stemLen < 100) {
    d2Hits.push(`两小问应用/计算结构，常见提高题模板`)
    score += 1
  }
  if (it.qtype === 'application' && stemLen < 90 && !has(/证明|讨论|最值|参数/, stem)) {
    d2Hits.push(`短应用题两问，多为建模代入`)
    score += 0
  }

  // —— potential d3 signals ——
  const d3Hits = []
  if (has(/分类讨论|参数.*讨论|就.*讨论|对.*分类/, stem) && has(/参数|a|m|λ|k/, stem)) {
    d3Hits.push(`显式参数分类讨论需求`)
    score += 3
  }
  if (has(/最值|最大值|最小值|极值/, stem) && has(/约束|条件|且|范围|不等式/, stem) && stemLen > 60) {
    d3Hits.push(`约束下最值，可能需要策略选择`)
    score += 2
  }
  if (has(/证明|求证/, stem) && has(/充分|必要|充要|任意|存在|对一切/, stem)) {
    d3Hits.push(`充分必要/量词证明，要求严谨推理`)
    score += 3
  }
  if (has(/复合函数|f\(g|g\(f|反函数.*复合|换元后/, stem) && has(/单调|定义域|值域|奇偶/, stem)) {
    d3Hits.push(`复合/反函数性质综合`)
    score += 2
  }
  if (has(/立体|三棱锥|正方体|空间.*垂直|线面|面面/, stem) && has(/证明|求.*角|求.*距离|体积/, stem) && stemLen > 70) {
    d3Hits.push(`立体几何多对象位置关系/度量综合`)
    score += 3
  }
  if (has(/向量.*数量积|投影|夹角|基底|线性表示/, stem) && has(/证明|最值|参数/, stem) && stemLen > 70) {
    d3Hits.push(`向量深层综合（非中位线模板）`)
    score += 2
  }
  if (has(/三角恒等|辅助角|升幂|降幂|积化和差|和差化积/, stem) && has(/值域|最值|证明|参数/, stem)) {
    d3Hits.push(`三角恒等变换服务于值域/证明`)
    score += 2
  }
  if (has(/对数.*换底|指对混合|指数.*对数.*方程/, stem) && has(/讨论|参数|最值|证明/, stem)) {
    d3Hits.push(`指对混合非常规方程/讨论`)
    score += 2
  }
  if (has(/\(1\).*[\s\S]*\(2\).*[\s\S]*\(3\)/, stem) && stemLen > 120) {
    d3Hits.push(`三小问长综合结构`)
    score += 2
  }
  // breakthrough-ish: inequality + absolute + parameter
  if (has(/绝对值|分段|\\\\left\\\\|/, stem) && has(/参数|讨论|最值/, stem)) {
    d3Hits.push(`绝对值/分段与参数耦合`)
    score += 3
  }

  // Soft length: long alone is NOT d3
  if (stemLen > 160) score += 1
  if (stemLen < 25) score -= 1

  // Batch prior: G4A short stems heavily over-tagged
  if (it.batch === 'G4A' && stemLen < 40) {
    signals.push('第四批短题干虚标风险：不得因 hardProfile 保留 d3')
    score -= 1
  }

  let recommended
  let confidence
  let uncertain = false
  let uncertainKind = ''
  // Strict 压轴 bar: need clear multi-signal breakthrough + sufficient stem depth.
  // Borderline (weak d3 signals only) → UNCERTAIN for human, not fake keep-d3.
  if (score <= -2) {
    recommended = 1
    confidence = d1Hits.length >= 2 || stemLen <= 20 ? 'HIGH' : 'MEDIUM'
  } else if (score <= 2) {
    recommended = 2
    confidence = d3Hits.length === 0 ? 'HIGH' : 'MEDIUM'
  } else if (score >= 5 && d3Hits.length >= 2 && stemLen > 80) {
    recommended = 3
    confidence = 'MEDIUM'
  } else {
    // score 3–4 or thin d3 signals: do not inflate to 压轴
    recommended = 'UNCERTAIN'
    confidence = 'LOW'
    uncertain = true
    uncertainKind = 'borderline_not_clear_d3'
  }

  // Force UNCERTAIN when stem is empty/broken multi with no content
  if (!stem.trim() || (stem.trim().length < 8 && it.qtype === 'multi' && !has(/[A-D]|选项|正确/, t.opt + stem))) {
    uncertain = true
    uncertainKind = 'insufficient_stem'
    recommended = 'UNCERTAIN'
    confidence = 'LOW'
  }
  // Extremely short selection with no math in stem → still judge as d1 if options exist
  if (!uncertain && stem.trim().length < 12 && it.qtype === 'single' && !has(/[0-9a-zA-Zα-ω=\\]/, stem)) {
    // e.g. "设实数x，正确的是" — need options; treat as d1 concept
    recommended = 1
    confidence = 'MEDIUM'
    d1Hits.push(`题干几乎无数学对象，依赖选项概念辨析（「${snippet}」）`)
  }

  const keepD3 = recommended === 3
  const downgradeTo = recommended === 1 || recommended === 2 ? recommended : null

  // Build keyReasoning from content
  let keyReasoning
  if (uncertain && uncertainKind === 'insufficient_stem') {
    keyReasoning = `题干信息不足或结构异常（code=${it.code}），无法完成可靠难度判定。`
  } else if (uncertain) {
    keyReasoning = `题面出现部分提高/压轴信号（${d3Hits.slice(0, 2).join('；') || '弱信号'}），但综合深度未达到明确压轴标准（「${snippet}」）。建议人工复核，禁止为保比例抬升为 d3。score=${score}`
  } else if (recommended === 1) {
    keyReasoning = `解题主路径：识别对象后直接套用定义/公式得到结果。题面要点：「${snippet}」。不需要非显然突破点或深层综合。`
  } else if (recommended === 2) {
    keyReasoning = `解题主路径：在标准套路下完成 2–3 步推导或简单分类。题面要点：「${snippet}」。有训练价值，但核心步骤对高一属可预期提高题，缺乏压轴级策略选择。`
  } else {
    keyReasoning = `解题主路径：需先定位非显然切入点，再组织多对象/参数综合推理。题面要点：「${snippet}」。难点不仅在计算量，而在建模/分类策略或证明结构。`
  }

  const complexityAssessment =
    recommended === 3
      ? `综合深度：检测到潜在压轴信号（${d3Hits.slice(0, 3).join('；') || '结构综合'}）；题干长度=${stemLen}。`
      : recommended === 2
        ? `综合深度：停留在常规提高层（${[...d2Hits, ...d1Hits].slice(0, 2).join('；') || '多步套路'}）；不足以构成压轴。`
        : recommended === 1
          ? `综合深度：低——直接技能点（${d1Hits.slice(0, 2).join('；') || '单步'}）。`
          : `综合深度：无法评估。`

  const difficultyReason = (() => {
    if (uncertain) return '信息不足，标记 UNCERTAIN，禁止强行定级。'
    if (recommended === 3) {
      return `建议保持 d3：${d3Hits.join('；') || '具备较深推理结构'}。分数校准 score=${score}。`
    }
    if (recommended === 2) {
      const why =
        d2Hits.length || d1Hits.length
          ? [...d2Hits, ...d1Hits].slice(0, 3).join('；')
          : '多步但套路化，无非显然突破点'
      return `建议降为 d2：${why}。原标 d3 偏虚；score=${score}。`
    }
    return `建议降为 d1：${d1Hits.slice(0, 3).join('；') || '单步公式/概念'}。原标 d3 明显虚高；score=${score}。`
  })()

  return {
    itemId: it.itemId,
    code: it.code,
    batch: it.batch,
    qtype: it.qtype,
    specialtyCode: it.specialtyCode,
    specialtyName: it.specialtyName,
    sectionCode: it.sectionCode,
    sectionName: it.sectionName,
    currentDifficulty: 3,
    recommendedDifficulty: recommended,
    downgradeSuggested: recommended === 1 || recommended === 2,
    downgradeTo,
    difficultyReason,
    keyReasoning,
    complexityAssessment,
    confidence,
    contentVersion: it.contentVersion,
    fingerprint: it.fingerprint,
    contentSha256: it.contentSha256,
    stemLengthNorm: stemLen,
    stemSnippet: snippet,
    knowledgePoints: (it.knowledgePoints || []).map((k) => k.code),
    methods: (it.methods || []).map((m) => m.code),
    diagramCount: (it.diagrams || []).length,
    auditSignals: {
      score,
      d1Hits,
      d2Hits,
      d3Hits,
      notes: signals,
    },
    versionBinding: {
      contentVersion: it.contentVersion,
      fingerprint: it.fingerprint,
      auditedAt,
      invalidIfVersionChanges: true,
    },
  }
}

const audits = items.map(auditOne)

function countBy(arr, keyFn) {
  const m = {}
  for (const x of arr) {
    const k = keyFn(x)
    m[k] = (m[k] || 0) + 1
  }
  return m
}

const keep = audits.filter((a) => a.recommendedDifficulty === 3)
const toD2 = audits.filter((a) => a.recommendedDifficulty === 2)
const toD1 = audits.filter((a) => a.recommendedDifficulty === 1)
const uncertain = audits.filter((a) => a.recommendedDifficulty === 'UNCERTAIN')

const byChapter = {}
for (const a of audits) {
  const c = a.specialtyCode
  if (!byChapter[c]) {
    byChapter[c] = {
      specialtyCode: c,
      specialtyName: a.specialtyName,
      currentD3: 0,
      keepD3: 0,
      toD2: 0,
      toD1: 0,
      uncertain: 0,
    }
  }
  byChapter[c].currentD3 += 1
  if (a.recommendedDifficulty === 3) byChapter[c].keepD3 += 1
  else if (a.recommendedDifficulty === 2) byChapter[c].toD2 += 1
  else if (a.recommendedDifficulty === 1) byChapter[c].toD1 += 1
  else byChapter[c].uncertain += 1
}

const byQtype = {}
for (const a of audits) {
  const q = a.qtype
  if (!byQtype[q]) byQtype[q] = { qtype: q, currentD3: 0, keepD3: 0, toD2: 0, toD1: 0, uncertain: 0 }
  byQtype[q].currentD3 += 1
  if (a.recommendedDifficulty === 3) byQtype[q].keepD3 += 1
  else if (a.recommendedDifficulty === 2) byQtype[q].toD2 += 1
  else if (a.recommendedDifficulty === 1) byQtype[q].toD1 += 1
  else byQtype[q].uncertain += 1
}

const g4a = audits.filter((a) => a.batch === 'G4A')
const g4aKeep = g4a.filter((a) => a.recommendedDifficulty === 3).length
const g4aD2 = g4a.filter((a) => a.recommendedDifficulty === 2).length
const g4aD1 = g4a.filter((a) => a.recommendedDifficulty === 1).length
const g4aU = g4a.filter((a) => a.recommendedDifficulty === 'UNCERTAIN').length

// Suggested full-bank difficulty after applying only d3 remaps (d1/d2 unchanged)
const baseD1 = raw.byDifficulty.find((x) => x.difficulty === 1)?.n || 0
const baseD2 = raw.byDifficulty.find((x) => x.difficulty === 2)?.n || 0
const baseD3 = raw.byDifficulty.find((x) => x.difficulty === 3)?.n || 0
const suggestedD1 = baseD1 + toD1.length
const suggestedD2 = baseD2 + toD2.length
const suggestedD3 = keep.length
const suggestedUncertainAsD3Hold = uncertain.length // leave as-is until human

const results = {
  phase: 'HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1A',
  status: uncertain.length ? 'DIFFICULTY_AUDIT_PARTIAL' : 'DIFFICULTY_AUDIT_PASS',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  auditedAt,
  baseline: {
    drawableExpected: raw.drawableExpected,
    drawableActual: raw.drawableActual,
    drawableMatch: raw.drawableMatch,
    byDifficulty: raw.byDifficulty,
    byQtype: raw.byQtype,
    bySpecialty: raw.bySpecialty,
    d3Audited: audits.length,
    g4aD3: g4a.length,
  },
  summary: {
    keepD3: keep.length,
    recommendD2: toD2.length,
    recommendD1: toD1.length,
    uncertain: uncertain.length,
    g4a: { total: g4a.length, keepD3: g4aKeep, toD2: g4aD2, toD1: g4aD1, uncertain: g4aU },
  },
  suggestedDrawableDifficultyIfApplied: {
    note: '仅把审计的原 d3 按建议重标；UNCERTAIN 暂按仍为 d3 计（待人工）；未改库',
    d1: suggestedD1,
    d2: suggestedD2,
    d3: suggestedD3 + suggestedUncertainAsD3Hold,
    d3StrictKeepOnly: suggestedD3,
  },
  target3120Impact: {
    longTermD3Target: 780,
    currentKeepD3: keep.length,
    gapTo780: Math.max(0, 780 - keep.length),
    note: '不要求本阶段补足；后续专项生成真正压轴',
  },
  byChapter: Object.values(byChapter),
  byQtype: Object.values(byQtype),
  keepD3Items: keep.map((a) => ({
    itemId: a.itemId,
    code: a.code,
    qtype: a.qtype,
    specialtyCode: a.specialtyCode,
    difficultyReason: a.difficultyReason,
    keyReasoning: a.keyReasoning,
    confidence: a.confidence,
    contentVersion: a.contentVersion,
    fingerprint: a.fingerprint,
  })),
  items: audits,
}

const downgrade = {
  phase: 'HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1A',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  auditedAt,
  note: '建议降级清单；未改库。正式调整前须核对 contentVersion+fingerprint 仍匹配。',
  counts: { toD2: toD2.length, toD1: toD1.length, uncertain: uncertain.length },
  candidates: [...toD2, ...toD1].map((a) => ({
    itemId: a.itemId,
    code: a.code,
    batch: a.batch,
    qtype: a.qtype,
    specialtyCode: a.specialtyCode,
    specialtyName: a.specialtyName,
    currentDifficulty: 3,
    recommendedDifficulty: a.recommendedDifficulty,
    difficultyReason: a.difficultyReason,
    keyReasoning: a.keyReasoning,
    complexityAssessment: a.complexityAssessment,
    confidence: a.confidence,
    contentVersion: a.contentVersion,
    fingerprint: a.fingerprint,
    contentSha256: a.contentSha256,
    needsHumanReview: a.confidence !== 'HIGH',
    versionBinding: a.versionBinding,
  })),
  uncertain: uncertain.map((a) => ({
    itemId: a.itemId,
    code: a.code,
    reason: a.difficultyReason,
    contentVersion: a.contentVersion,
    fingerprint: a.fingerprint,
  })),
}

const outResults = path.join(qb, 'hard_difficulty_audit_results.json')
const outDown = path.join(qb, 'hard_difficulty_downgrade_candidates.json')
fs.writeFileSync(outResults, JSON.stringify(results, null, 2))
fs.writeFileSync(outDown, JSON.stringify(downgrade, null, 2))

console.log(
  JSON.stringify(
    {
      status: results.status,
      d3Audited: audits.length,
      keepD3: keep.length,
      toD2: toD2.length,
      toD1: toD1.length,
      uncertain: uncertain.length,
      g4a: results.summary.g4a,
      suggested: results.suggestedDrawableDifficultyIfApplied,
      outResults,
      outDown,
    },
    null,
    2,
  ),
)
