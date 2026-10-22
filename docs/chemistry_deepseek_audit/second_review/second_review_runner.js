/**
 * Second-round DeepSeek review for 239 whitelist items.
 * Round A = science; Round B = curriculum + auto-question fitness.
 * Does NOT feed first-audit PASS verdict to the model.
 * READ-ONLY DB. Checkpoint/resume supported.
 *
 *   node .../second_review_runner.js
 *   node .../second_review_runner.js --resume
 *   node .../second_review_runner.js --limit=3 --batch-size=1
 *   node .../second_review_runner.js --round=A|B|both
 */
'use strict'
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const ROOT = path.resolve(__dirname, '../../..')
const OUT = __dirname
const INPUT = path.join(OUT, 'input_239.json')
const CHECKPOINT = path.join(OUT, '_checkpoint.json')
const EXEC_LOG = path.join(OUT, 'review_execution_log.json')

const FINAL = new Set(['READY_FOR_HUMAN_APPROVAL', 'NEEDS_FIX', 'NEEDS_VERIFICATION'])
const AQ = new Set(['eligible', 'restricted', 'ineligible'])
const PLEVEL = new Set(['P0', 'P1', 'P2', 'P3'])

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function parseArgs(argv) {
  const o = { resume: false, limit: 0, batchSize: 2, sleepMs: 350, round: 'both' }
  for (const a of argv.slice(2)) {
    if (a === '--resume') o.resume = true
    else if (a.startsWith('--limit=')) o.limit = Number(a.slice(8)) || 0
    else if (a.startsWith('--batch-size=')) o.batchSize = Math.max(1, Number(a.slice(13)) || 2)
    else if (a.startsWith('--sleep-ms=')) o.sleepMs = Math.max(0, Number(a.slice(11)) || 0)
    else if (a.startsWith('--round=')) o.round = a.slice(8)
  }
  return o
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function redactSecrets(s) {
  return String(s || '')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer ***')
    .replace(/sk-[A-Za-z0-9]+/g, 'sk-***')
}

/** Payload for model: DB content only, no first-audit PASS reasons */
function compactItem(it) {
  const row = it.dbRow || {}
  const base = {
    code: it.code,
    type: it.type,
    name: it.name,
    batch: it.batch,
    verifyNeeded: !!it.verifyNeeded,
    curriculumScopeHint: it.curriculumScope || null,
    inventoryNote: it.inventoryNote || '',
    dbStatus: it.dbStatus,
    dbReviewNote: it.dbReviewNote || '',
    specialties: it.dbSpecialtyCodes || [],
    categories: it.dbCategoryCodes || [],
  }
  switch (it.type) {
    case 'element':
      return {
        ...base,
        symbol: row.symbol,
        atomicNumber: row.atomic_number,
        nameZh: row.name_zh,
        nameEn: row.ename || row.name_en,
        period: row.period,
        groupNum: row.group_num,
        category: row.category,
        description: row.description,
      }
    case 'substance':
      return {
        ...base,
        formula: row.formula,
        commonName: row.common_name,
        state: row.state,
        color: row.color,
        odor: row.odor,
        hazards: row.hazards,
        uses: row.uses,
        description: row.description,
      }
    case 'reaction':
      return {
        ...base,
        equation: row.equation,
        reactionType: row.reaction_type,
        conditions: row.conditions,
        phenomena: row.phenomena,
        notes: row.notes,
        description: row.description,
        oxidant: row.oxidant,
        reductant: row.reductant,
        oxProduct: row.ox_product,
        reProduct: row.re_product,
        species: (it.species || []).map((s) => ({
          role: s.role,
          formula: s.formula,
          coefficient: s.coefficient,
          state: s.state_symbol,
        })),
      }
    case 'experiment':
      return {
        ...base,
        purpose: row.purpose,
        principle: row.principle,
        apparatus: row.apparatus,
        reagents: row.reagents,
        procedure: row.procedure,
        observations: row.observations,
        conclusions: row.conclusions,
        safetyNotes: row.safety_notes,
        description: row.description,
      }
    case 'formula':
      return {
        ...base,
        expression: row.expression,
        meaning: row.meaning,
        variables: row.variables,
        unit: row.unit,
        description: row.description,
      }
    case 'concept':
      return {
        ...base,
        definition: row.definition,
        explanation: row.explanation,
        examples: row.examples,
        description: row.description,
      }
    case 'knowledge':
      return {
        ...base,
        title: row.title || row.name,
        content: row.content,
        keyPoints: row.key_points,
        description: row.description,
      }
    case 'question':
      return {
        ...base,
        stem: row.stem,
        options: row.options,
        answer: row.answer,
        explanation: row.explanation,
        difficulty: row.difficulty,
        questionType: row.question_type,
        trainLimits: row.train_limits,
      }
    default:
      return { ...base, row }
  }
}

function systemPromptA() {
  return `你是高中化学科学性审查专家。只根据条目的数据库字段内容做科学性复核。
禁止假设该条目已经通过任何先前审核；不得因为“看起来像教材”就放过明确错误。

审查重点：
1) 定义/符号/化学式/化合价是否准确
2) 方程式是否真实成立、是否配平；配平≠一定能发生
3) 反应物/生成物/条件是否完整；禁止把特定条件产物写成无条件唯一产物
4) 离子方程式规范；氧化还原（氧化剂/还原剂/氧化产物/还原产物/电子转移）是否准确，有无对调
5) 酸碱/复分解是否被错误描述为氧化还原
6) 实验现象是否合理；现象≠唯一结论证明
7) 计算公式、单位、适用条件（尤其 22.4 L/mol 与标况）

severity等级：P0 明确事实错误；P1 重要条件/关键限定缺失或错误；P2 覆盖/关联类重要问题；P3 表述规范。

对每条输出 scienceVerdict：
- PASS_SCIENCE：未见明确科学性错误
- FAIL_SCIENCE：存在明确科学错误（对应最终应 NEEDS_FIX）
- UNCERTAIN_SCIENCE：依据不足或表述边界不清（倾向需要核实）

只输出 JSON，不要 Markdown。`
}

function systemPromptB() {
  return `你是高一化学课程范围与专项训练适配审查专家。只根据条目数据库字段判断课程范围与自动出题风险。
禁止假设该条目已通过先前审核。科学正确 ≠ 属于高一必修核心 ≠ 适合所有题型自动出题。

审查重点：
1) 是否高一必修核心/了解/拓展/选择性必修/超范围/无法确认
2) 是否存在教材口径争议或版本差异风险
3) 专项 specialties / categories 是否合理（禁止关键词机械挂靠；非氧化还原勿挂 redox）
4) 自动出题：条件是否完整、标准答案是否唯一、多产物/多答案、实验干扰、判题歧义
5) 推荐允许/禁止的题型；实验仅书面分析，禁止要求学生做危险实验

输出：
- curriculumScope: core|familiar|extension|elective|out_of_scope|uncertain
- knowledgePublishCandidate: yes|no （是否可提交人工发布审核；有明确科学问题应 no，但本轮若仅范围/出题问题可以 yes）
- autoQuestionEligibility: eligible|restricted|ineligible
- allowedQuestionTypes / bannedQuestionTypes
- rangeVerdict: OK_RANGE | NEED_VERIFY_RANGE | BAD_LINK

无法核实权威教材页码时写 uncertain，并说明依据不足；禁止虚构课标条款或页码。

只输出 JSON，不要 Markdown。`
}

function userPromptA(batchItems) {
  return `对下列知识条目做科学性复核。返回：
{
  "results": [
    {
      "code": "...",
      "scienceVerdict": "PASS_SCIENCE|FAIL_SCIENCE|UNCERTAIN_SCIENCE",
      "problems": [
        {
          "level": "P0|P1|P2|P3",
          "field": "字段名",
          "original": "原文摘要",
          "issue": "具体问题",
          "fixHint": "修改建议",
          "needsTextbookCheck": false,
          "affectsPublish": true,
          "affectsAutoQuestion": true
        }
      ],
      "scienceNotes": ["简短要点"],
      "confidence": 0.0
    }
  ]
}

条目：
${JSON.stringify(batchItems, null, 2)}`
}

function userPromptB(batchItems) {
  return `对下列知识条目做课程范围与自动出题适配复核。返回：
{
  "results": [
    {
      "code": "...",
      "curriculumScope": "core|familiar|extension|elective|out_of_scope|uncertain",
      "rangeVerdict": "OK_RANGE|NEED_VERIFY_RANGE|BAD_LINK",
      "knowledgePublishCandidate": "yes|no",
      "autoQuestionEligibility": "eligible|restricted|ineligible",
      "allowedQuestionTypes": ["single_choice","true_false","fill","equation","calc","experiment_analysis"],
      "bannedQuestionTypes": [],
      "specialtyIssues": ["专项关联问题，无则空"],
      "problems": [
        {
          "level": "P0|P1|P2|P3",
          "field": "字段名",
          "original": "原文摘要",
          "issue": "具体问题",
          "fixHint": "修改建议",
          "needsTextbookCheck": true,
          "affectsPublish": false,
          "affectsAutoQuestion": true
        }
      ],
      "rangeNotes": ["简短要点"],
      "confidence": 0.0
    }
  ]
}

条目：
${JSON.stringify(batchItems, null, 2)}`
}

function requestChat({ baseUrl, apiKey, model, messages, temperature, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', baseUrl.replace(/\/$/, '') + '/')
    const body = JSON.stringify({
      model,
      messages,
      temperature: temperature ?? 0.15,
      response_format: { type: 'json_object' },
    })
    const isHttps = url.protocol === 'https:'
    const lib = isHttps ? https : http
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: timeoutMs || 180000,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${redactSecrets(text).slice(0, 400)}`))
            return
          }
          try {
            resolve(JSON.parse(text))
          } catch {
            reject(new Error(`resp JSON parse fail: ${redactSecrets(text).slice(0, 200)}`))
          }
        })
      },
    )
    req.on('error', (e) => reject(new Error(redactSecrets(e.message))))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('request timeout'))
    })
    req.write(body)
    req.end()
  })
}

function extractContent(resp) {
  const c = resp?.choices?.[0]?.message?.content
  if (typeof c !== 'string') throw new Error('empty content')
  return c
}

function parseJsonObject(content) {
  try {
    return JSON.parse(content)
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('no JSON object')
    return JSON.parse(m[0])
  }
}

function normalizeProblems(list) {
  if (!Array.isArray(list)) return []
  return list.map((p) => ({
    level: PLEVEL.has(String(p.level || '').toUpperCase())
      ? String(p.level).toUpperCase()
      : 'P2',
    field: String(p.field || ''),
    original: String(p.original || ''),
    issue: String(p.issue || ''),
    fixHint: String(p.fixHint || ''),
    needsTextbookCheck: !!p.needsTextbookCheck,
    affectsPublish: p.affectsPublish !== false,
    affectsAutoQuestion: p.affectsAutoQuestion !== false,
  }))
}

function parseRoundResults(content, expectedCodes, round) {
  const obj = parseJsonObject(content)
  const list = Array.isArray(obj.results) ? obj.results : Array.isArray(obj) ? obj : null
  if (!list) throw new Error('missing results array')
  const byCode = new Map()
  for (const r of list) {
    if (!r || !r.code) continue
    if (round === 'A') {
      let v = String(r.scienceVerdict || '').toUpperCase()
      if (v.includes('FAIL')) v = 'FAIL_SCIENCE'
      else if (v.includes('UNCERTAIN') || v.includes('UNSURE')) v = 'UNCERTAIN_SCIENCE'
      else if (v.includes('PASS')) v = 'PASS_SCIENCE'
      else v = 'UNCERTAIN_SCIENCE'
      byCode.set(r.code, {
        code: r.code,
        scienceVerdict: v,
        problems: normalizeProblems(r.problems),
        scienceNotes: Array.isArray(r.scienceNotes) ? r.scienceNotes.map(String) : [],
        confidence: typeof r.confidence === 'number' ? r.confidence : null,
      })
    } else {
      let scope = String(r.curriculumScope || 'uncertain').toLowerCase()
      const scopes = new Set([
        'core',
        'familiar',
        'extension',
        'elective',
        'out_of_scope',
        'uncertain',
      ])
      if (!scopes.has(scope)) scope = 'uncertain'
      let rv = String(r.rangeVerdict || '').toUpperCase()
      if (rv.includes('BAD')) rv = 'BAD_LINK'
      else if (rv.includes('VERIFY') || rv.includes('NEED')) rv = 'NEED_VERIFY_RANGE'
      else rv = 'OK_RANGE'
      let pub = String(r.knowledgePublishCandidate || '').toLowerCase()
      pub = pub === 'yes' || pub === 'no' ? pub : 'no'
      let aq = String(r.autoQuestionEligibility || '').toLowerCase()
      if (!AQ.has(aq)) aq = 'restricted'
      byCode.set(r.code, {
        code: r.code,
        curriculumScope: scope,
        rangeVerdict: rv,
        knowledgePublishCandidate: pub,
        autoQuestionEligibility: aq,
        allowedQuestionTypes: Array.isArray(r.allowedQuestionTypes)
          ? r.allowedQuestionTypes.map(String)
          : [],
        bannedQuestionTypes: Array.isArray(r.bannedQuestionTypes)
          ? r.bannedQuestionTypes.map(String)
          : [],
        specialtyIssues: Array.isArray(r.specialtyIssues) ? r.specialtyIssues.map(String) : [],
        problems: normalizeProblems(r.problems),
        rangeNotes: Array.isArray(r.rangeNotes) ? r.rangeNotes.map(String) : [],
        confidence: typeof r.confidence === 'number' ? r.confidence : null,
      })
    }
  }
  const missing = expectedCodes.filter((c) => !byCode.has(c))
  return { byCode, missing }
}

async function callWithRetry(fn, retries, execLog, meta) {
  let last
  for (let i = 0; i < retries; i++) {
    execLog.apiCalls += 1
    try {
      const r = await fn()
      execLog.apiSuccess += 1
      if (i > 0) execLog.retries += i
      return r
    } catch (e) {
      last = e
      execLog.apiFail += 1
      execLog.events.push({
        at: new Date().toISOString(),
        type: 'api_error',
        attempt: i + 1,
        ...meta,
        error: redactSecrets(e.message),
      })
      await sleep(1200 * (i + 1))
    }
  }
  if (retries > 1) execLog.retries += retries - 1
  throw last
}

function mergeFinal(item, roundA, roundB, failInfo) {
  const problems = []
  if (roundA?.problems) problems.push(...roundA.problems.map((p) => ({ ...p, round: 'A' })))
  if (roundB?.problems) problems.push(...roundB.problems.map((p) => ({ ...p, round: 'B' })))

  let conclusion = null
  let knowledgePublishCandidate = 'no'
  let autoQuestionEligibility = 'ineligible'
  const reasons = []

  if (failInfo) {
    conclusion = 'NEEDS_VERIFICATION'
    reasons.push(`审核执行失败：${failInfo}`)
    knowledgePublishCandidate = 'no'
    autoQuestionEligibility = 'ineligible'
  } else if (item.verifyNeeded) {
    conclusion = 'NEEDS_VERIFICATION'
    reasons.push('硬规则：verifyNeeded=true，禁止进入 READY_FOR_HUMAN_APPROVAL')
    knowledgePublishCandidate = 'no'
    autoQuestionEligibility =
      roundB?.autoQuestionEligibility && AQ.has(roundB.autoQuestionEligibility)
        ? roundB.autoQuestionEligibility
        : 'ineligible'
  } else if (!roundA || !roundB) {
    conclusion = 'NEEDS_VERIFICATION'
    reasons.push('缺少 Round A 或 Round B 完整结果')
    knowledgePublishCandidate = 'no'
    autoQuestionEligibility = 'ineligible'
  } else {
    const hasP0P1Science =
      roundA.scienceVerdict === 'FAIL_SCIENCE' ||
      (roundA.problems || []).some((p) => p.level === 'P0' || (p.level === 'P1' && p.affectsPublish))
    const hasExplicitFix =
      hasP0P1Science ||
      (roundB.problems || []).some(
        (p) => (p.level === 'P0' || p.level === 'P1') && p.affectsPublish,
      ) ||
      roundB.rangeVerdict === 'BAD_LINK' &&
        (roundB.problems || []).some((p) => p.level === 'P0' || p.level === 'P1')

    if (roundA.scienceVerdict === 'FAIL_SCIENCE' || hasP0P1Science) {
      conclusion = 'NEEDS_FIX'
      reasons.push('Round A 发现明确科学性/条件问题')
      knowledgePublishCandidate = 'no'
      autoQuestionEligibility = 'ineligible'
    } else if (
      roundA.scienceVerdict === 'UNCERTAIN_SCIENCE' ||
      roundB.rangeVerdict === 'NEED_VERIFY_RANGE' ||
      roundB.curriculumScope === 'uncertain' ||
      roundB.curriculumScope === 'elective' ||
      roundB.curriculumScope === 'out_of_scope' ||
      (roundB.problems || []).some((p) => p.needsTextbookCheck) ||
      (problems || []).some((p) => p.needsTextbookCheck)
    ) {
      // elective/out_of_scope without science fail → verification before publish
      conclusion = 'NEEDS_VERIFICATION'
      reasons.push('存在课程范围争议、依据不足或需教材核实')
      knowledgePublishCandidate = 'no'
      autoQuestionEligibility =
        roundB.autoQuestionEligibility === 'eligible'
          ? 'restricted'
          : AQ.has(roundB.autoQuestionEligibility)
            ? roundB.autoQuestionEligibility
            : 'restricted'
    } else if (hasExplicitFix) {
      conclusion = 'NEEDS_FIX'
      reasons.push('Round B 发现影响发布的明确错误（如严重错误专项关联）')
      knowledgePublishCandidate = 'no'
      autoQuestionEligibility = 'ineligible'
    } else if (
      roundA.scienceVerdict === 'PASS_SCIENCE' &&
      (roundB.rangeVerdict === 'OK_RANGE' || roundB.rangeVerdict === 'BAD_LINK') &&
      (roundB.curriculumScope === 'core' ||
        roundB.curriculumScope === 'familiar' ||
        roundB.curriculumScope === 'extension')
    ) {
      // BAD_LINK alone without P0/P1 → can be READY but restrict AQ and note specialty
      conclusion = 'READY_FOR_HUMAN_APPROVAL'
      reasons.push('两轮未见明确科学性错误，范围相对明确，可提交人工确认（≠已发布/≠人工通过）')
      knowledgePublishCandidate =
        roundB.knowledgePublishCandidate === 'yes' ? 'yes' : 'yes' // science pass + range ok → candidate
      if (roundB.rangeVerdict === 'BAD_LINK') {
        reasons.push('存在专项关联问题：发布候选保留，但自动出题降级')
        autoQuestionEligibility =
          roundB.autoQuestionEligibility === 'ineligible' ? 'ineligible' : 'restricted'
      } else {
        autoQuestionEligibility = AQ.has(roundB.autoQuestionEligibility)
          ? roundB.autoQuestionEligibility
          : 'restricted'
      }
      // if science pass but model said no publish due only to AQ concerns, still allow candidate
      if (roundB.knowledgePublishCandidate === 'no' && roundA.scienceVerdict === 'PASS_SCIENCE') {
        // keep yes if only AQ issues; if B said no for range, already handled above
        const onlyAq =
          !(roundB.problems || []).some((p) => p.affectsPublish && (p.level === 'P0' || p.level === 'P1'))
        if (!onlyAq) {
          knowledgePublishCandidate = 'no'
          conclusion = 'NEEDS_VERIFICATION'
          reasons.push('Round B 认为不宜发布且存在影响发布的问题')
        }
      }
    } else {
      conclusion = 'NEEDS_VERIFICATION'
      reasons.push('结论边界不清，保守归入需核实')
      knowledgePublishCandidate = 'no'
      autoQuestionEligibility = AQ.has(roundB.autoQuestionEligibility)
        ? roundB.autoQuestionEligibility
        : 'restricted'
    }
  }

  if (!FINAL.has(conclusion)) conclusion = 'NEEDS_VERIFICATION'

  const maxP = problems.reduce((m, p) => {
    const order = { P0: 0, P1: 1, P2: 2, P3: 3 }
    if (order[p.level] < order[m]) return p.level
    return m
  }, 'P3')
  const severity = problems.length ? maxP : null

  return {
    code: item.code,
    type: item.type,
    name: item.name,
    batch: item.batch,
    dbId: item.dbId,
    verifyNeeded: !!item.verifyNeeded,
    conclusion,
    knowledgePublishCandidate,
    autoQuestionEligibility,
    severity,
    problems,
    reasons,
    roundA: roundA
      ? {
          status: 'ok',
          ...roundA,
        }
      : { status: failInfo && failInfo.includes('Round A') ? 'failed' : 'missing' },
    roundB: roundB
      ? {
          status: 'ok',
          ...roundB,
        }
      : { status: failInfo && failInfo.includes('Round B') ? 'failed' : 'missing' },
    reviewedAt: new Date().toISOString(),
  }
}

function saveJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n')
}

async function reviewBatch({
  chunk,
  round,
  env,
  execLog,
  args,
}) {
  const codes = chunk.map((c) => c.code)
  const compact = chunk.map(compactItem)
  const system = round === 'A' ? systemPromptA() : systemPromptB()
  const user = round === 'A' ? userPromptA(compact) : userPromptB(compact)

  const resp = await callWithRetry(
    () =>
      requestChat({
        baseUrl: env.baseUrl,
        apiKey: env.apiKey,
        model: env.model,
        temperature: 0.15,
        timeoutMs: 180000,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    3,
    execLog,
    { round, codes },
  )
  let { byCode, missing } = parseRoundResults(extractContent(resp), codes, round)

  if (missing.length) {
    execLog.events.push({
      at: new Date().toISOString(),
      type: 'missing_codes',
      round,
      codes: missing,
    })
    const refill = chunk.filter((c) => missing.includes(c.code)).map(compactItem)
    const resp2 = await callWithRetry(
      () =>
        requestChat({
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          model: env.model,
          temperature: 0.1,
          timeoutMs: 180000,
          messages: [
            { role: 'system', content: system },
            {
              role: 'user',
              content: round === 'A' ? userPromptA(refill) : userPromptB(refill),
            },
          ],
        }),
      3,
      execLog,
      { round, codes: missing, refill: true },
    )
    const parsed2 = parseRoundResults(extractContent(resp2), missing, round)
    for (const [k, v] of parsed2.byCode) byCode.set(k, v)
    missing = parsed2.missing
  }

  return { byCode, missing }
}

async function main() {
  const args = parseArgs(process.argv)
  const rawEnv = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const env = {
    apiKey: rawEnv.DEEPSEEK_API_KEY,
    baseUrl: rawEnv.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: rawEnv.DEEPSEEK_MODEL || 'deepseek-chat',
  }
  if (!env.apiKey) {
    console.error('ERROR: DEEPSEEK_API_KEY missing')
    process.exit(1)
  }
  if (!fs.existsSync(INPUT)) {
    console.error('ERROR: run export_whitelist.js first')
    process.exit(1)
  }

  const input = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
  let items = input.items || []
  if (args.limit > 0) items = items.slice(0, args.limit)

  /** @type {Map<string, any>} */
  const roundAMap = new Map()
  /** @type {Map<string, any>} */
  const roundBMap = new Map()
  /** @type {Map<string, string>} */
  const failMap = new Map()
  /** @type {Map<string, any>} */
  const finalMap = new Map()

  let execLog = {
    startedAt: new Date().toISOString(),
    model: env.model,
    baseUrl: env.baseUrl,
    apiCalls: 0,
    apiSuccess: 0,
    apiFail: 0,
    retries: 0,
    events: [],
    note: 'API key redacted; READ-ONLY review',
  }

  if (args.resume && fs.existsSync(CHECKPOINT)) {
    const cp = JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'))
    for (const [code, v] of Object.entries(cp.roundA || {})) roundAMap.set(code, v)
    for (const [code, v] of Object.entries(cp.roundB || {})) roundBMap.set(code, v)
    for (const [code, v] of Object.entries(cp.failures || {})) failMap.set(code, v)
    for (const r of cp.results || []) finalMap.set(r.code, r)
    if (cp.execLog) {
      execLog = {
        ...execLog,
        ...cp.execLog,
        events: [...(cp.execLog.events || []), ...execLog.events],
        resumedAt: new Date().toISOString(),
      }
    }
    console.log(
      `resume: A=${roundAMap.size} B=${roundBMap.size} final=${finalMap.size}`,
    )
  }

  const needA = items.filter((it) => !roundAMap.has(it.code) && args.round !== 'B')
  const needB = items.filter((it) => !roundBMap.has(it.code) && args.round !== 'A')

  console.log(
    JSON.stringify(
      {
        total: items.length,
        needA: needA.length,
        needB: needB.length,
        batchSize: args.batchSize,
        model: env.model,
      },
      null,
      2,
    ),
  )

  async function runRound(todo, round) {
    for (let i = 0; i < todo.length; i += args.batchSize) {
      const chunk = todo.slice(i, i + args.batchSize)
      const codes = chunk.map((c) => c.code)
      console.log(`[Round ${round}] ${i + 1}-${i + chunk.length}/${todo.length} ${codes.join(', ')}`)
      try {
        const { byCode, missing } = await reviewBatch({
          chunk,
          round,
          env,
          execLog,
          args,
        })
        for (const it of chunk) {
          const r = byCode.get(it.code)
          if (!r) {
            const msg = `Round ${round} missing after refill`
            failMap.set(it.code, (failMap.get(it.code) || '') + `; ${msg}`)
            continue
          }
          if (round === 'A') roundAMap.set(it.code, r)
          else roundBMap.set(it.code, r)
        }
        for (const code of missing) {
          failMap.set(code, (failMap.get(code) || '') + `; Round ${round} still missing`)
        }
      } catch (e) {
        const msg = redactSecrets(e.message)
        console.error(`  Round ${round} batch failed: ${msg}`)
        for (const it of chunk) {
          failMap.set(it.code, (failMap.get(it.code) || '') + `; Round ${round} failed: ${msg}`)
        }
      }

      // rematerialize finals for completed pairs
      for (const it of chunk) {
        const a = roundAMap.get(it.code)
        const b = roundBMap.get(it.code)
        if (a && b) {
          failMap.delete(it.code)
          finalMap.set(it.code, mergeFinal(it, a, b, null))
        } else if (failMap.has(it.code) && args.round === 'both') {
          // only finalize failure if both rounds attempted and still incomplete after both loops
        }
      }

      saveCheckpoint()
      if (args.sleepMs) await sleep(args.sleepMs)
    }
  }

  function saveCheckpoint() {
    const results = items
      .map((it) => {
        if (finalMap.has(it.code)) return finalMap.get(it.code)
        const a = roundAMap.get(it.code)
        const b = roundBMap.get(it.code)
        if (a && b) {
          const m = mergeFinal(it, a, b, null)
          finalMap.set(it.code, m)
          return m
        }
        return null
      })
      .filter(Boolean)

    const cp = {
      updatedAt: new Date().toISOString(),
      roundA: Object.fromEntries(roundAMap),
      roundB: Object.fromEntries(roundBMap),
      failures: Object.fromEntries(failMap),
      results,
      execLog,
    }
    saveJson(CHECKPOINT, cp)
    saveJson(EXEC_LOG, { ...execLog, updatedAt: new Date().toISOString(), doneFinal: results.length })
  }

  if (args.round === 'A' || args.round === 'both') await runRound(needA, 'A')
  if (args.round === 'B' || args.round === 'both') await runRound(needB, 'B')

  // finalize all
  for (const it of items) {
    const a = roundAMap.get(it.code)
    const b = roundBMap.get(it.code)
    if (a && b) {
      finalMap.set(it.code, mergeFinal(it, a, b, null))
    } else {
      const fail =
        failMap.get(it.code) ||
        (!a && !b
          ? 'Round A and Round B missing'
          : !a
            ? 'Round A missing'
            : 'Round B missing')
      finalMap.set(it.code, mergeFinal(it, a || null, b || null, fail))
    }
  }

  execLog.finishedAt = new Date().toISOString()
  saveCheckpoint()

  const results = items.map((it) => finalMap.get(it.code))
  const summary = { READY_FOR_HUMAN_APPROVAL: 0, NEEDS_FIX: 0, NEEDS_VERIFICATION: 0 }
  for (const r of results) summary[r.conclusion] = (summary[r.conclusion] || 0) + 1

  console.log(
    JSON.stringify(
      {
        completed: results.length,
        summary,
        apiCalls: execLog.apiCalls,
        apiSuccess: execLog.apiSuccess,
        apiFail: execLog.apiFail,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(redactSecrets(e.stack || e.message))
  process.exit(1)
})
