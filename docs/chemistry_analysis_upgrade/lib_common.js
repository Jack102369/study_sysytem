'use strict'
/**
 * 旧题解析升级 · 公共工具（只读）。禁止写库。
 */
const fs = require('fs')
const path = require('path')
const https = require('https')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

const OUT_DIR = __dirname
const SPECIALTY_PRIORITY = [
  'equation',
  'redox',
  'ion',
  'calculation',
  'experiment',
  'substance',
  'memory',
  'inference',
]

const CHEM_EXPLAIN_RE =
  /化合价|氧化|还原|电子|得失|因为|所以|由于|因此|依据|说明|判断|配平|守恒|离子|物质的量|摩尔|现象|条件|易错|混淆|错误在于|反应物|生成物|电极|通电|加热|催化剂|标况|n\s*=|m\s*=|价态|得失电子/

const SOURCE_FIELD_RE =
  /^来源\s+\S+(\s*(字段|；|;|：|:|\s+oxidant|\s+reductant|\s+「易错」|\s+description|\s+首句|\s+安全|\s+书面|\s+仅标况|\s+：))?/i

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function assertReadonly() {
  // 本目录脚本约定：不得执行写库 SQL。调用方自行保证。
}

function isS60(row) {
  const code = String(row.code || '')
  const note = String(row.gate_note || '')
  return /^train\.ai_trial\.s60\./i.test(code) || /\[s60\]/i.test(note)
}

function isOldEligible(row) {
  return (
    row.pool === 'test' &&
    row.status === 'approved' &&
    Number(row.is_active) === 1 &&
    !/\[trial_access:block\]/i.test(String(row.gate_note || '')) &&
    !isS60(row)
  )
}

/**
 * 解析质量分级：不以字数为主。
 * A = 无实际化学解释（来源码/字段名/纯重复答案）
 * B = 有一点解释但不完整
 * C = 科学依据明确、能说明为何正确（短也可）
 * D = 知识点+依据+方法/易错，且与能力匹配
 */
function gradeAnalysis(analysis, answer, stem) {
  const raw = String(analysis || '').trim()
  const ans = String(answer || '').trim()
  const risks = []
  const reasons = []

  if (!raw) {
    return { grade: 'A', reasons: ['empty'], risks, length: 0 }
  }

  const echoOnly =
    raw === ans ||
    raw === `答案：${ans}` ||
    raw === `标准答案：${ans}` ||
    new RegExp(`^(正确答案?|答案)[：:]\\s*${escapeReg(ans)}\\s*$`).test(raw)

  if (echoOnly) {
    return { grade: 'A', reasons: ['answer_echo_only'], risks, length: raw.length }
  }

  const hasChem = CHEM_EXPLAIN_RE.test(raw)
  const sourceLead = SOURCE_FIELD_RE.test(raw) || /^来源\s+\S+/.test(raw)
  const fieldDump =
    /字段\s+\w+|oxidant\s*=|reductant\s*=|description\s+首句|「易错」标注/.test(raw)

  // A：来源式且几乎无化学解释
  if (sourceLead && !hasChem) {
    return {
      grade: 'A',
      reasons: ['source_field_only'],
      risks,
      length: raw.length,
    }
  }
  if (sourceLead && fieldDump && !/(化合价|电子|因此|因为|所以|易错点)/.test(raw)) {
    // 偶有「来源…；oxidant=…」仍算无教学解析
    if (!/(解释|说明|判断依据|价态)/.test(raw)) {
      return {
        grade: 'A',
        reasons: ['source_plus_field_dump'],
        risks,
        length: raw.length,
      }
    }
  }

  // 有化学词但仍以「来源」为主且极短说明 → B
  const methodish = /步骤|突破口|方法|易错点|关键条件|考查/.test(raw)
  const whyish = /(因为|所以|因此|由于|依据|说明)/.test(raw)

  if (hasChem && whyish && methodish) {
    return { grade: 'D', reasons: ['full_teaching_structure'], risks, length: raw.length }
  }
  if (hasChem && whyish) {
    return { grade: 'C', reasons: ['clear_chemical_basis'], risks, length: raw.length }
  }
  if (hasChem) {
    return { grade: 'B', reasons: ['weak_partial_explain'], risks, length: raw.length }
  }
  if (sourceLead) {
    return { grade: 'A', reasons: ['source_without_chem'], risks, length: raw.length }
  }

  // 非来源、无明确化学依据
  if (raw.length < 40) {
    return { grade: 'B', reasons: ['short_unclear'], risks, length: raw.length }
  }
  return { grade: 'B', reasons: ['no_clear_chem_basis'], risks, length: raw.length }
}

function escapeReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 能力等级标注（不改库 difficulty）
 */
function inferAbility(item) {
  const stem = String(item.stem || '')
  const code = String(item.code || '')
  const diff = Number(item.difficulty)
  let level = 1
  let tags = []

  if (/kp_fact_judge|memory|符号|化学式填空|common_names|color/.test(code + stem)) {
    level = 1
    tags.push('memory_or_fact')
  }
  if (/oxidant|reductant|is_redox|字段|正误判断/.test(code + stem) && !/过量|配平|推断/.test(stem)) {
    level = Math.max(level, 2)
    tags.push('single_step_id')
  }
  if (/过量|不足|限制|条件|少量|过量|现象推断|先后/.test(stem)) {
    level = Math.max(level, 3)
    tags.push('condition_analysis')
  }
  if (/分步|两步|先.*再|守恒.*再|计算.*再|电子守恒/.test(stem) || /comprehensive|multi/.test(code)) {
    level = Math.max(level, 4)
    tags.push('multi_step')
  }
  if (/综合|推断.*唯一|多信息/.test(stem) || item.specialty_code === 'comprehensive') {
    level = Math.max(level, 4)
    tags.push('综合倾向')
  }
  if (item.specialty_code === 'inference' && stem.length > 80) {
    level = Math.max(level, 4)
  }
  if (item.specialty_code === 'calculation' && /n\s*=|物质的量|摩尔|过量/.test(stem)) {
    level = Math.max(level, diff >= 2 ? 3 : 2)
  }

  // 模板 d2 但实为单步识别
  const inflated =
    diff === 2 &&
    level <= 2 &&
    /oxidant_single|reductant_single|kp_misconception|rxn_oxidant|rxn_reductant/.test(code)

  return {
    abilityLevel: level,
    abilityLabel: ['', '基础记忆', '单步知识识别', '简单条件分析', '多步骤推理', '综合分析'][
      level
    ],
    abilityTags: tags,
    difficultyInflated: !!inflated,
  }
}

async function openDb() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  return { conn, env }
}

async function loadOldEligible(conn) {
  const [rows] = await conn.query(
    `SELECT i.id, i.code, i.pool, i.status, i.is_active, i.difficulty, i.qtype, i.answer_type,
            i.stem, i.options_json, i.answer, i.answer_aliases_json, i.analysis, i.gate_note,
            i.specialty_id, i.category_id, i.curriculum_ok, i.verify_blocked, i.ban_default_train,
            s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id = i.specialty_id
     JOIN chem_categories c ON c.id = i.category_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1`,
  )
  return rows.filter(isOldEligible)
}

async function loadLinksAndSources(conn, itemIds) {
  if (!itemIds.length) return { links: [], sources: {} }
  const [links] = await conn.query(
    `SELECT item_id, entity_type, entity_id FROM chem_train_item_links
     WHERE item_id IN (?)`,
    [itemIds],
  )
  const byType = {}
  for (const l of links) {
    const t = l.entity_type
    if (!byType[t]) byType[t] = []
    byType[t].push(String(l.entity_id))
  }
  const tableMap = {
    element: 'chem_elements',
    substance: 'chem_substances',
    reaction: 'chem_reactions',
    experiment: 'chem_experiments',
    formula: 'chem_formulas',
    concept: 'chem_concepts',
    knowledge: 'chem_knowledge_points',
    question: 'chem_questions',
  }
  const sources = {}
  for (const [etype, ids] of Object.entries(byType)) {
    const table = tableMap[etype]
    if (!table || !ids.length) continue
    const uniq = [...new Set(ids)]
    const [ents] = await conn.query(`SELECT * FROM ${table} WHERE id IN (?)`, [uniq])
    for (const e of ents) {
      sources[`${etype}:${e.id}`] = { entityType: etype, ...e }
    }
  }
  return { links, sources }
}

function deepseekRequest(apiKey, body, baseUrl) {
  const url = new URL('/chat/completions', baseUrl || 'https://api.deepseek.com')
  const payload = JSON.stringify(body)
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 90000,
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            const j = JSON.parse(data)
            if (res.statusCode >= 400) reject(new Error(j.error?.message || data.slice(0, 200)))
            else resolve(j)
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })
    req.write(payload)
    req.end()
  })
}

module.exports = {
  ROOT,
  OUT_DIR,
  SPECIALTY_PRIORITY,
  loadEnv,
  assertReadonly,
  isS60,
  isOldEligible,
  gradeAnalysis,
  inferAbility,
  openDb,
  loadOldEligible,
  loadLinksAndSources,
  deepseekRequest,
  CHEM_EXPLAIN_RE,
  SOURCE_FIELD_RE,
}
