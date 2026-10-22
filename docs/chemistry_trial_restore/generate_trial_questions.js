/**
 * Deterministic local-rule trial questions from trial-published KB.
 * Inserts into chem_train_items pool=test, code train.ai_trial.*
 *
 *   node docs/chemistry_trial_restore/generate_trial_questions.js --dry-run
 *   node docs/chemistry_trial_restore/generate_trial_questions.js --apply
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const AUDIT = path.join(ROOT, 'docs/chemistry_deepseek_audit')

const KB_TABLES = {
  element: 'chem_elements',
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
}

const FIX_SKIP = new Set([
  'rxn.2Na2O2_2H2O',
  'rxn.2Na2O2_2CO2',
  'rxn.2Al_6HCl',
  'rxn.3Fe_2O2',
  'rxn.Fe_H2SO4',
  'rxn.Cu_2H2SO4',
  'rxn.C_2H2SO4',
  'rxn.N2_3H2',
  'rxn.Cu_4HNO3',
  'rxn.Cu_4HNO3c',
  'exp.CO2_prep_marble',
  'q.eq.Na_water',
])

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function loadSecondFix() {
  const p = path.join(AUDIT, 'second_review/second_review_results.json')
  const cp = path.join(AUDIT, 'second_review/_checkpoint.json')
  const src = fs.existsSync(p) ? p : fs.existsSync(cp) ? cp : null
  if (!src) return FIX_SKIP
  const data = JSON.parse(fs.readFileSync(src, 'utf8'))
  const results = data.results || []
  const set = new Set(FIX_SKIP)
  for (const r of results) {
    if (r.conclusion === 'NEEDS_FIX') set.add(r.code)
  }
  return set
}

function q(code, spec, cat, qtype, stem, answer, opts = {}) {
  return {
    code,
    specialtyCode: spec,
    categoryCode: cat,
    qtype,
    stem: `【AI试运行】${stem}`,
    optionsJson: opts.options || null,
    answer,
    answerAliases: opts.aliases || [],
    analysis: opts.analysis || '',
    difficulty: opts.difficulty || 1,
    sourceCode: opts.sourceCode,
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
  }
}

function buildCandidates(items, fixSkip) {
  const out = []
  let n = 0
  const next = (suffix) => {
    n += 1
    return `train.ai_trial.${String(n).padStart(3, '0')}.${suffix}`
  }

  // Elements — symbol / Z
  for (const it of items.filter((i) => i.type === 'element')) {
    const row = it.dbRow
    if (!row?.symbol || row.atomic_number == null) continue
    if (fixSkip.has(it.code)) continue
    out.push(
      q(
        next('el_sym'),
        'memory',
        'symbol',
        'blank',
        `${row.name_zh || it.name}的元素符号是____。`,
        String(row.symbol),
        {
          aliases: [String(row.symbol).toUpperCase(), String(row.symbol).toLowerCase()].filter(
            (x, i, a) => a.indexOf(x) === i && x !== String(row.symbol),
          ),
          analysis: `来源 ${it.code}`,
          sourceCode: it.code,
          sourceType: 'element',
          sourceId: it.dbId,
        },
      ),
    )
    if (out.length >= 12) break
  }

  // Substance formula blanks
  for (const it of items.filter((i) => i.type === 'substance')) {
    const row = it.dbRow
    if (!row?.formula || !/^[A-Za-z0-9().]+$/.test(row.formula)) continue
    if (fixSkip.has(it.code)) continue
    // skip ambiguous common names
    const name = row.common_name || it.name
    if (!name || name.length > 20) continue
    out.push(
      q(
        next('sub_f'),
        'substance',
        'formula',
        'blank',
        `${name}的化学式是____。`,
        String(row.formula),
        {
          analysis: `来源 ${it.code}`,
          sourceCode: it.code,
          sourceType: 'substance',
          sourceId: it.dbId,
          difficulty: 1,
        },
      ),
    )
    if (out.filter((x) => x.sourceType === 'substance').length >= 10) break
  }

  // Concept judges — curated safe statements
  const conceptSafe = {
    'concept.mass_conserve': {
      stem: '化学反应前后原子种类与数目守恒。判断正误。',
      answer: '正确',
      spec: 'equation',
      cat: 'true_false',
    },
    'concept.charge_conserve': {
      stem: '离子方程式必须满足电荷守恒。判断正误。',
      answer: '正确',
      spec: 'ion',
      cat: 'ionic_balance',
    },
    'concept.electron_conserve': {
      stem: '氧化还原反应中，还原剂失电子总数等于氧化剂得电子总数。判断正误。',
      answer: '正确',
      spec: 'redox',
      cat: 'e_conserve',
    },
    'concept.electrolyte': {
      stem: '电解质是在水溶液里或熔融状态下能够导电的化合物。判断正误。',
      answer: '正确',
      spec: 'ion',
      cat: 'electrolyte',
    },
    'concept.nonelectrolyte': {
      stem: '蔗糖是电解质。判断正误。',
      answer: '错误',
      spec: 'ion',
      cat: 'nonelectrolyte',
    },
  }
  for (const it of items.filter((i) => i.type === 'concept')) {
    const rule = conceptSafe[it.code]
    if (!rule || fixSkip.has(it.code)) continue
    out.push(
      q(next('con_j'), rule.spec, rule.cat, 'judge', rule.stem, rule.answer, {
        aliases:
          rule.answer === '正确'
            ? ['对', 'T', 'true', '√']
            : ['错', 'F', 'false', '×'],
        analysis: `来源 ${it.code}`,
        sourceCode: it.code,
        sourceType: 'concept',
        sourceId: it.dbId,
      }),
    )
  }

  // Reaction — condition presence judge / redox basic (skip FIX)
  for (const it of items.filter((i) => i.type === 'reaction')) {
    if (fixSkip.has(it.code)) continue
    const row = it.dbRow
    if (!row?.equation) continue
    const specs = it.dbSpecialtyCodes || []
    const isRedox = specs.includes('redox')
    const hasOx =
      row.oxidant &&
      row.reductant &&
      String(row.oxidant).trim() &&
      String(row.reductant).trim()

    if (row.conditions && String(row.conditions).trim().length >= 2) {
      out.push(
        q(
          next('rxn_cond'),
          'equation',
          'true_false',
          'judge',
          `反应「${String(row.equation).slice(0, 40)}」在知识库中标注了反应条件。判断正误。`,
          '正确',
          {
            aliases: ['对', 'T', 'true', '√'],
            analysis: `条件：${row.conditions}；来源 ${it.code}`,
            sourceCode: it.code,
            sourceType: 'reaction',
            sourceId: it.dbId,
          },
        ),
      )
    }

    if (isRedox && hasOx) {
      out.push(
        q(
          next('rxn_redox'),
          'redox',
          'identify',
          'single',
          `对于反应「${String(row.equation).slice(0, 36)}」，下列哪一项是氧化剂？`,
          'A',
          {
            options: [
              { key: 'A', text: String(row.oxidant) },
              { key: 'B', text: String(row.reductant) },
              { key: 'C', text: '水' },
              { key: 'D', text: '氮气' },
            ],
            analysis: `氧化剂：${row.oxidant}；来源 ${it.code}`,
            sourceCode: it.code,
            sourceType: 'reaction',
            sourceId: it.dbId,
            difficulty: 2,
          },
        ),
      )
    }

    // non-redox wrongly? skip generating "is redox" for non-redox specialties
    if (!isRedox && specs.includes('equation')) {
      out.push(
        q(
          next('rxn_nr'),
          'redox',
          'identify',
          'judge',
          `反应「${String(row.equation).slice(0, 40)}」一定是氧化还原反应。判断正误。`,
          '错误',
          {
            aliases: ['错', 'F', 'false', '×'],
            analysis: `该条目未关联氧化还原专项；来源 ${it.code}`,
            sourceCode: it.code,
            sourceType: 'reaction',
            sourceId: it.dbId,
          },
        ),
      )
    }

    if (out.filter((x) => x.sourceType === 'reaction').length >= 22) break
  }

  // Experiment — written analysis only
  for (const it of items.filter((i) => i.type === 'experiment')) {
    if (fixSkip.has(it.code)) continue
    const row = it.dbRow
    out.push(
      q(
        next('exp_safe'),
        'experiment',
        'safety',
        'judge',
        '危险化学实验可以在家自行操作完成。判断正误。',
        '错误',
        {
          aliases: ['错', 'F', 'false', '×'],
          analysis: `书面训练原则；关联实验 ${it.code}`,
          sourceCode: it.code,
          sourceType: 'experiment',
          sourceId: it.dbId,
        },
      ),
    )
    if (row?.observations && String(row.observations).trim().length > 4) {
      out.push(
        q(
          next('exp_obs'),
          'experiment',
          'phenomenon_judge',
          'judge',
          `实验「${it.name}」的知识条目中记录了实验现象描述。判断正误。`,
          '正确',
          {
            aliases: ['对', 'T', 'true', '√'],
            analysis: `来源 ${it.code}`,
            sourceCode: it.code,
            sourceType: 'experiment',
            sourceId: it.dbId,
          },
        ),
      )
    }
    if (out.filter((x) => x.sourceType === 'experiment').length >= 8) break
  }

  // Formula — STP / Vm awareness
  for (const it of items.filter((i) => i.type === 'formula')) {
    if (fixSkip.has(it.code)) continue
    if (it.code === 'formula.gas_STP' || it.code === 'formula.Vm') {
      out.push(
        q(
          next('fm_stp'),
          'calculation',
          'molar_volume',
          'judge',
          '气体摩尔体积 22.4 L/mol 适用于任何温度和压强下的气体。判断正误。',
          '错误',
          {
            aliases: ['错', 'F', 'false', '×'],
            analysis: '仅标况；来源 ' + it.code,
            sourceCode: it.code,
            sourceType: 'formula',
            sourceId: it.dbId,
            difficulty: 2,
          },
        ),
      )
    }
    if (it.code === 'formula.c_n_V') {
      out.push(
        q(
          next('fm_c'),
          'calculation',
          'concentration',
          'single',
          '物质的量浓度 c 的常用单位是？',
          'A',
          {
            options: [
              { key: 'A', text: 'mol/L' },
              { key: 'B', text: 'g/mol' },
              { key: 'C', text: 'L/mol' },
              { key: 'D', text: 'mol' },
            ],
            analysis: `来源 ${it.code}`,
            sourceCode: it.code,
            sourceType: 'formula',
            sourceId: it.dbId,
          },
        ),
      )
    }
  }

  // Knowledge — metal activity / Fe test safe
  const kpSafe = {
    'kp.metal.activity': {
      stem: '金属活动性顺序可用于判断金属与酸、盐溶液能否发生置换反应。判断正误。',
      answer: '正确',
      spec: 'substance',
      cat: 'chem_property',
    },
    'kp.Fe.test': {
      stem: 'Fe³⁺可用 KSCN 溶液检验，溶液变血红色。判断正误。',
      answer: '正确',
      spec: 'substance',
      cat: 'test',
    },
    'kp.redox.e_conserve': {
      stem: '氧化还原反应中得失电子数必须相等。判断正误。',
      answer: '正确',
      spec: 'redox',
      cat: 'e_conserve',
    },
  }
  for (const it of items.filter((i) => i.type === 'knowledge')) {
    const rule = kpSafe[it.code]
    if (!rule || fixSkip.has(it.code)) continue
    out.push(
      q(next('kp_j'), rule.spec, rule.cat, 'judge', rule.stem, rule.answer, {
        aliases:
          rule.answer === '正确'
            ? ['对', 'T', 'true', '√']
            : ['错', 'F', 'false', '×'],
        analysis: `来源 ${it.code}`,
        sourceCode: it.code,
        sourceType: 'knowledge',
        sourceId: it.dbId,
      }),
    )
  }

  // Element single-choice distractors
  const els = items.filter((i) => i.type === 'element' && i.dbRow?.symbol)
  for (let i = 0; i < Math.min(8, els.length); i++) {
    const it = els[i]
    if (fixSkip.has(it.code)) continue
    const row = it.dbRow
    const others = els
      .filter((e) => e.code !== it.code)
      .slice(i + 1, i + 4)
    if (others.length < 3) continue
    const opts = [
      { key: 'A', text: row.symbol },
      { key: 'B', text: others[0].dbRow.symbol },
      { key: 'C', text: others[1].dbRow.symbol },
      { key: 'D', text: others[2].dbRow.symbol },
    ]
    out.push(
      q(
        next('el_sc'),
        'memory',
        'symbol',
        'single',
        `${row.name_zh || it.name}的元素符号是？`,
        'A',
        {
          options: opts,
          analysis: `来源 ${it.code}`,
          sourceCode: it.code,
          sourceType: 'element',
          sourceId: it.dbId,
        },
      ),
    )
  }

  // dedupe by stem
  const seen = new Set()
  const unique = []
  for (const item of out) {
    const k = item.stem
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(item)
  }

  // cap 80
  return unique.slice(0, 80)
}

async function main() {
  const apply = process.argv.includes('--apply')
  const fixSkip = loadSecondFix()

  const whitelist = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'publish_whitelist.json'), 'utf8'),
  )
  const pending = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'pending_review_all.json'), 'utf8'),
  )
  const byCode = new Map((pending.items || []).map((i) => [i.code, i]))
  const items = []
  for (const w of whitelist.items || []) {
    const base = byCode.get(w.code)
    if (!base) continue
    items.push({
      ...base,
      dbId: String(w.dbId || base.dbId),
      type: w.type || base.type,
    })
  }

  // refresh db rows for trial-published
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  for (const it of items) {
    const table = KB_TABLES[it.type]
    if (!table) continue
    const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [it.dbId])
    if (rows[0]) it.dbRow = rows[0]
  }

  const [specs] = await conn.query(`SELECT id, code FROM chem_specialties`)
  const [cats] = await conn.query(`SELECT id, code, specialty_id FROM chem_categories`)
  const specByCode = new Map(specs.map((s) => [s.code, String(s.id)]))
  const catByKey = new Map(
    cats.map((c) => {
      const sp = specs.find((s) => String(s.id) === String(c.specialty_id))
      return [`${sp?.code}.${c.code}`, String(c.id)]
    }),
  )
  // also map category code alone under specialty
  const catUnder = new Map()
  for (const c of cats) {
    const sp = specs.find((s) => String(s.id) === String(c.specialty_id))
    if (sp) catUnder.set(`${sp.code}:${c.code}`, String(c.id))
  }

  const candidates = buildCandidates(items, fixSkip)

  // resolve specialty/category ids; drop if missing
  const resolved = []
  const skipped = []
  for (const c of candidates) {
    const sid = specByCode.get(c.specialtyCode)
    const cid = catUnder.get(`${c.specialtyCode}:${c.categoryCode}`)
    if (!sid || !cid) {
      skipped.push({ code: c.code, reason: `missing_spec_cat ${c.specialtyCode}.${c.categoryCode}` })
      continue
    }
    resolved.push({ ...c, specialtyId: sid, categoryId: cid })
  }

  const byQ = { single: 0, judge: 0, blank: 0 }
  const bySpec = {}
  for (const r of resolved) {
    byQ[r.qtype] = (byQ[r.qtype] || 0) + 1
    bySpec[r.specialtyCode] = (bySpec[r.specialtyCode] || 0) + 1
  }

  const report = {
    dryRun: !apply,
    generated: resolved.length,
    skipped,
    byQtype: byQ,
    bySpecialty: bySpec,
    fixSkipCount: fixSkip.size,
    items: resolved,
  }
  fs.writeFileSync(
    path.join(__dirname, 'trial_questions_plan.json'),
    JSON.stringify(report, null, 2) + '\n',
  )

  if (!apply) {
    await conn.end()
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          generated: resolved.length,
          byQtype: byQ,
          bySpecialty: bySpec,
          skipped: skipped.length,
        },
        null,
        2,
      ),
    )
    return
  }

  await conn.beginTransaction()
  try {
    // clear previous ai trial items
    await conn.query(
      `DELETE l FROM chem_train_item_links l
       JOIN chem_train_items i ON i.id=l.item_id
       WHERE i.code LIKE 'train.ai_trial.%'`,
    )
    await conn.query(`DELETE FROM chem_train_items WHERE code LIKE 'train.ai_trial.%'`)

    let inserted = 0
    for (const r of resolved) {
      const [res] = await conn.query(
        `INSERT INTO chem_train_items
         (code, pool, qtype, stem, options_json, answer, answer_aliases_json, analysis,
          difficulty, specialty_id, category_id, status, is_active, curriculum_ok,
          verify_blocked, ban_default_train, gate_note)
         VALUES (?, 'test', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, 1, 0, 0, ?)`,
        [
          r.code,
          r.qtype,
          r.stem,
          r.optionsJson ? JSON.stringify(r.optionsJson) : null,
          r.answer,
          JSON.stringify(r.answerAliases || []),
          r.analysis || '',
          r.difficulty,
          r.specialtyId,
          r.categoryId,
          `ai_trial source=${r.sourceCode}`,
        ],
      )
      const itemId = res.insertId
      if (r.sourceType && r.sourceId) {
        await conn.query(
          `INSERT INTO chem_train_item_links (item_id, entity_type, entity_id) VALUES (?,?,?)`,
          [itemId, r.sourceType, r.sourceId],
        )
      }
      inserted += 1
    }
    await conn.commit()
    console.log(
      JSON.stringify(
        { applied: true, inserted, byQtype: byQ, bySpecialty: bySpec },
        null,
        2,
      ),
    )
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
