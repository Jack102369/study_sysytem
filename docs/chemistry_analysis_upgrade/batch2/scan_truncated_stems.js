'use strict'
/**
 * 只读：扫描「易错提示直接当题干」及同类残缺题干。
 * node docs/chemistry_analysis_upgrade/batch2/scan_truncated_stems.js
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function classifyStem(stem, analysis) {
  const s = String(stem || '')
  const a = String(analysis || '')
  const m = s.match(/下列说法正确[：:]\s*([^。]{1,40})。?\s*判断正误/)
  if (!m) return null
  const phrase = m[1].trim()
  const risks = []
  let problemType = 'misconception_phrase_as_stem'
  // 残缺：过短、无主语、像标签而非完整命题
  const truncated =
    phrase.length <= 12 ||
    /记反|混淆|用错|错误$|判断错误|混用/.test(phrase) ||
    !/[是为的在与和]/.test(phrase) ||
    /^(V用|递变|氧化剂|还原剂|化合价)/.test(phrase)

  if (truncated) {
    risks.push('AMBIGUOUS')
    problemType = 'truncated_misconception_stem'
  }
  if (/来源.*易错/.test(a)) risks.push('TEMPLATE_KP_MISCONCEPTION')

  return { phrase, truncated, problemType, risks }
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [rows] = await conn.query(
    `SELECT i.id, i.code, i.stem, i.answer, i.analysis, i.difficulty, i.qtype,
            i.is_active, i.status, i.pool, i.gate_note,
            s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.pool='test'
       AND i.code NOT LIKE 'train.ai_trial.s60.%'
       AND IFNULL(i.gate_note,'') NOT LIKE '%[s60]%'
       AND i.stem LIKE '%下列说法正确：%'`,
  )

  const [links] = await conn.query(
    `SELECT item_id, entity_type, entity_id FROM chem_train_item_links
     WHERE item_id IN (?)`,
    [rows.map((r) => r.id)],
  )
  const linkMap = {}
  for (const l of links) {
    const k = String(l.item_id)
    if (!linkMap[k]) linkMap[k] = []
    linkMap[k].push(l)
  }

  const items = []
  for (const r of rows) {
    const cls = classifyStem(r.stem, r.analysis)
    if (!cls) continue
    if (!cls.truncated && !/kp_misconception/.test(r.code)) continue
    // 收录所有 misconception 模板题 + 判定为残缺的
    if (!/kp_misconception/.test(r.code) && !cls.truncated) continue

    let sourceName = null
    let sourceDesc = null
    const ls = linkMap[String(r.id)] || []
    if (ls[0] && ls[0].entity_type === 'knowledge') {
      const [k] = await conn.query(
        `SELECT name, description FROM chem_knowledge_points WHERE id=?`,
        [ls[0].entity_id],
      )
      if (k[0]) {
        sourceName = k[0].name
        sourceDesc = String(k[0].description || '').slice(0, 280)
      }
    }

    const uniqueAnswerOk = r.answer === '错误' || r.answer === '正确'
    items.push({
      id: String(r.id),
      code: r.code,
      stem: r.stem,
      answer: r.answer,
      specialtyCode: r.specialty_code,
      specialtyName: r.specialty_name,
      categoryCode: r.category_code,
      categoryName: r.category_name,
      difficulty: r.difficulty,
      isActive: !!r.is_active,
      blocked: /\[trial_access:block\]/.test(String(r.gate_note || '')),
      extractedPhrase: cls.phrase,
      problemType: cls.problemType,
      truncated: cls.truncated,
      riskFlags: cls.risks,
      sourceName,
      sourceDescPreview: sourceDesc,
      scienceRisk: cls.truncated ? 'stem_incomplete_may_mislead' : 'low_if_phrase_complete',
      answerUniqueness: uniqueAnswerOk
        ? cls.truncated
          ? 'answer_exists_but_stem_ambiguous'
          : 'ok_with_clear_stem'
        : 'check_answer',
      suggest: cls.truncated
        ? 'FIXABLE_or_BLOCK: expand stem from source 易错 full sentence; do not analysis-only'
        : 'review_stem_clarity',
    })
  }

  const truncated = items.filter((x) => x.truncated)
  const out = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    pattern: '下列说法正确：{易错短句}。判断正误。 from kp_misconception_judge template',
    totalMisconceptionPattern: items.length,
    truncatedCount: truncated.length,
    items,
  }
  fs.writeFileSync(path.join(__dirname, 'truncated_stem_scan.json'), JSON.stringify(out, null, 2))
  // also merge path for question_risks later
  console.log(
    JSON.stringify(
      {
        total: items.length,
        truncated: truncated.length,
        ids: truncated.map((x) => x.id),
      },
      null,
      2,
    ),
  )
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
