/**
 * DeepSeek full audit for pending_review KB items.
 * Does NOT write published to DB. Checkpoint/resume supported.
 *
 *   node docs/chemistry_deepseek_audit/audit_runner.js
 *   node docs/chemistry_deepseek_audit/audit_runner.js --resume
 *   node docs/chemistry_deepseek_audit/audit_runner.js --limit=20
 *   node docs/chemistry_deepseek_audit/audit_runner.js --batch-size=4
 */
'use strict'
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const CHECKPOINT = path.join(OUT, '_checkpoint.json')
const RESULTS = path.join(OUT, 'deepseek_audit_results.json')

const ALLOWED = new Set(['PASS_PUBLISH', 'HOLD_RESTRICTED', 'REJECT_FIX'])

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
  const o = { resume: false, limit: 0, batchSize: 4, sleepMs: 400 }
  for (const a of argv.slice(2)) {
    if (a === '--resume') o.resume = true
    else if (a.startsWith('--limit=')) o.limit = Number(a.slice(8)) || 0
    else if (a.startsWith('--batch-size=')) o.batchSize = Math.max(1, Number(a.slice(13)) || 4)
    else if (a.startsWith('--sleep-ms=')) o.sleepMs = Math.max(0, Number(a.slice(11)) || 0)
  }
  return o
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function compactItem(it) {
  const row = it.dbRow || {}
  const base = {
    code: it.code,
    type: it.type,
    name: it.name,
    batch: it.batch,
    verifyNeeded: !!it.verifyNeeded,
    curriculumScope: it.curriculumScope,
    inventoryNote: it.inventoryNote || '',
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

function buildSystemPrompt() {
  return `你是高中化学教研审核专家。任务：对照「高一化学必修（人教版/通行课标）+ 高考化学规范」审核知识条目。

分级标准（只能选其一）：
1) PASS_PUBLISH：内容准确、符合高一/高考表述、无明显科学错误、可正式发布教学使用。
2) HOLD_RESTRICTED：内容大体可用，但存在表述不严谨、范围偏超纲、verifyNeeded、证据不足、需人工再核、不宜直接正式发布。
3) REJECT_FIX：存在明显错误/误导/关键字段缺失严重/不宜教学，必须修改后才能考虑发布。

硬性规则：
- verifyNeeded=true 的条目，最高只能给 HOLD_RESTRICTED，禁止 PASS_PUBLISH。
- 不要编造试题答案或实验数据；不确定时选 HOLD_RESTRICTED。
- 审核依据应简短具体（指出哪处对/错），不要空话。
- 只输出 JSON，不要 Markdown。`
}

function buildUserPrompt(batchItems) {
  return `请逐条审核下列知识条目，返回 JSON：
{
  "results": [
    {
      "code": "条目code",
      "grade": "PASS_PUBLISH|HOLD_RESTRICTED|REJECT_FIX",
      "reasons": ["简短理由1","简短理由2"],
      "issues": ["问题点，无则空数组"],
      "fixHints": ["修改建议，无则空数组"],
      "confidence": 0.0
    }
  ]
}

条目列表：
${JSON.stringify(batchItems, null, 2)}`
}

function requestChat({ baseUrl, apiKey, model, messages, temperature, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', baseUrl.replace(/\/$/, '') + '/')
    const body = JSON.stringify({
      model,
      messages,
      temperature: temperature ?? 0.2,
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
        timeout: timeoutMs || 120000,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 500)}`))
            return
          }
          try {
            resolve(JSON.parse(text))
          } catch (e) {
            reject(new Error(`JSON parse fail: ${text.slice(0, 300)}`))
          }
        })
      },
    )
    req.on('error', reject)
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

function parseResults(content, expectedCodes) {
  let obj
  try {
    obj = JSON.parse(content)
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('no JSON object in content')
    obj = JSON.parse(m[0])
  }
  const list = Array.isArray(obj.results) ? obj.results : Array.isArray(obj) ? obj : null
  if (!list) throw new Error('missing results array')
  const byCode = new Map()
  for (const r of list) {
    if (!r || !r.code) continue
    let grade = String(r.grade || '').trim().toUpperCase()
    if (!ALLOWED.has(grade)) {
      // normalize common variants
      if (grade.includes('PASS')) grade = 'PASS_PUBLISH'
      else if (grade.includes('REJECT')) grade = 'REJECT_FIX'
      else if (grade.includes('HOLD') || grade.includes('RESTRICT')) grade = 'HOLD_RESTRICTED'
      else grade = 'HOLD_RESTRICTED'
    }
    byCode.set(r.code, {
      code: r.code,
      grade,
      reasons: Array.isArray(r.reasons) ? r.reasons.map(String) : [],
      issues: Array.isArray(r.issues) ? r.issues.map(String) : [],
      fixHints: Array.isArray(r.fixHints) ? r.fixHints.map(String) : [],
      confidence: typeof r.confidence === 'number' ? r.confidence : null,
    })
  }
  const missing = expectedCodes.filter((c) => !byCode.has(c))
  return { byCode, missing }
}

function applyHardRules(item, result) {
  const out = { ...result }
  if (item.verifyNeeded && out.grade === 'PASS_PUBLISH') {
    out.grade = 'HOLD_RESTRICTED'
    out.reasons = [
      ...(out.reasons || []),
      '硬规则：verifyNeeded=true，禁止 PASS_PUBLISH，已降级为 HOLD_RESTRICTED',
    ]
    out.hardRuleApplied = 'verifyNeeded_cap'
  }
  return out
}

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT, JSON.stringify(state, null, 2) + '\n')
}

function saveResults(payload) {
  fs.writeFileSync(RESULTS, JSON.stringify(payload, null, 2) + '\n')
}

async function callWithRetry(fn, retries = 3) {
  let last
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      const wait = 1500 * (i + 1)
      console.error(`  retry ${i + 1}/${retries}: ${e.message}`)
      await sleep(wait)
    }
  }
  throw last
}

async function main() {
  const args = parseArgs(process.argv)
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const apiKey = env.DEEPSEEK_API_KEY
  const baseUrl = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = env.DEEPSEEK_MODEL || 'deepseek-chat'
  if (!apiKey) {
    console.error('ERROR: DEEPSEEK_API_KEY missing in apps/api/.env')
    process.exit(1)
  }

  const pendingPath = path.join(OUT, 'pending_review_all.json')
  if (!fs.existsSync(pendingPath)) {
    console.error('ERROR: run export_pending.js first')
    process.exit(1)
  }
  const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'))
  let items = pending.items || []
  if (args.limit > 0) items = items.slice(0, args.limit)

  let doneMap = new Map()
  let failures = []
  if (args.resume && fs.existsSync(CHECKPOINT)) {
    const cp = JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'))
    for (const r of cp.results || []) doneMap.set(r.code, r)
    failures = cp.failures || []
    console.log(`resume: already have ${doneMap.size} results`)
  }

  const todo = items.filter((it) => !doneMap.has(it.code))
  console.log(
    JSON.stringify(
      {
        total: items.length,
        todo: todo.length,
        batchSize: args.batchSize,
        model,
        baseUrl,
      },
      null,
      2,
    ),
  )

  const system = buildSystemPrompt()
  let processed = 0

  for (let i = 0; i < todo.length; i += args.batchSize) {
    const chunk = todo.slice(i, i + args.batchSize)
    const codes = chunk.map((c) => c.code)
    const compact = chunk.map(compactItem)
    console.log(`[${i + 1}-${i + chunk.length}/${todo.length}] ${codes.join(', ')}`)

    try {
      const resp = await callWithRetry(() =>
        requestChat({
          baseUrl,
          apiKey,
          model,
          temperature: 0.2,
          timeoutMs: 180000,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: buildUserPrompt(compact) },
          ],
        }),
      )
      const content = extractContent(resp)
      let { byCode, missing } = parseResults(content, codes)

      // one-shot refill for missing codes
      if (missing.length) {
        console.warn(`  missing in response: ${missing.join(', ')} → refill`)
        const refillItems = chunk.filter((c) => missing.includes(c.code)).map(compactItem)
        const resp2 = await callWithRetry(() =>
          requestChat({
            baseUrl,
            apiKey,
            model,
            temperature: 0.1,
            timeoutMs: 180000,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: buildUserPrompt(refillItems) },
            ],
          }),
        )
        const { byCode: by2, missing: miss2 } = parseResults(extractContent(resp2), missing)
        for (const [k, v] of by2) byCode.set(k, v)
        missing = miss2
      }

      for (const it of chunk) {
        const raw = byCode.get(it.code)
        if (!raw) {
          failures.push({
            code: it.code,
            error: 'no_result_after_refill',
            at: new Date().toISOString(),
          })
          continue
        }
        const graded = applyHardRules(it, raw)
        doneMap.set(it.code, {
          ...graded,
          type: it.type,
          name: it.name,
          batch: it.batch,
          dbId: it.dbId,
          verifyNeeded: !!it.verifyNeeded,
          auditedAt: new Date().toISOString(),
          model,
        })
      }

      if (missing.length) {
        for (const code of missing) {
          failures.push({
            code,
            error: 'still_missing',
            at: new Date().toISOString(),
          })
        }
      }
    } catch (e) {
      console.error(`  batch failed: ${e.message}`)
      for (const it of chunk) {
        failures.push({
          code: it.code,
          error: e.message,
          at: new Date().toISOString(),
        })
      }
    }

    processed += chunk.length
    const results = Array.from(doneMap.values())
    saveCheckpoint({
      updatedAt: new Date().toISOString(),
      done: results.length,
      failures,
      results,
    })
    saveResults({
      auditedAt: new Date().toISOString(),
      model,
      baseUrl,
      sourceTotal: items.length,
      completed: results.length,
      failureCount: failures.length,
      results,
      failures,
      note: '未写库；未改 published；仅审计输出',
    })

    if (args.sleepMs) await sleep(args.sleepMs)
  }

  const results = Array.from(doneMap.values())
  const summary = { PASS_PUBLISH: 0, HOLD_RESTRICTED: 0, REJECT_FIX: 0 }
  for (const r of results) summary[r.grade] = (summary[r.grade] || 0) + 1

  console.log(
    JSON.stringify(
      {
        completed: results.length,
        failures: failures.length,
        summary,
        processedThisRun: processed,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
