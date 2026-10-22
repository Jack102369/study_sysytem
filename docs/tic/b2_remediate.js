/**
 * Batch2 quality remediation (pending_review only for content fixes).
 * Published rows: write proposal only (unless --apply-published explicitly... we never do that here).
 *
 * Usage: node docs/chemistry_batch2_quality_fix/b2_remediate.js [--apply]
 */
const fs = require('fs')
const path = require('path')

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const envPath = path.join(ROOT, 'apps/api/.env')
const codeMap = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/chemistry_batch2/import_all_results.json'), 'utf8'),
).codeToEntity

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

async function getMysql() {
  try {
    return require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  } catch {
    return require('mysql2/promise')
  }
}

const FIXES = {
  // —— elements (pending_review) ——
  'el.He': {
    table: 'chem_elements',
    id: 5,
    fields: {
      key_properties: '最轻的稀有气体（惰性气体），化学性质极不活泼',
      review_note: '[inv:el.He] B2整改:修正“之一”为最轻稀有气体',
    },
  },
  'el.N': {
    table: 'chem_elements',
    id: 10,
    fields: {
      common_valences: '-3,+1,+2,+3,+4,+5',
      review_note: '[inv:el.N] B2整改:补常见化合价+1,+3',
    },
  },
  'el.Hg': {
    table: 'chem_elements',
    id: 30,
    fields: {
      common_valences: '+1(as Hg2^2+),+2',
      atom_structure: '常温液态金属；+1价实际以Hg2^2+存在，勿写成Hg+',
      key_properties: '常温液态；有毒；禁止接触实验',
      review_note: '[inv:el.Hg] B2整改:明确Hg2^2+；强调毒性禁用',
    },
  },
  'el.I': {
    table: 'chem_elements',
    id: 26,
    fields: {
      common_valences: '-1(必修);+5,+7(了解)',
      key_properties: '紫黑色固体；淀粉遇碘变蓝；必修训练以I2/-1为主',
      review_note: '[inv:el.I] 范围标注:必修侧重-1与I2；+5/+7为了解。待人工确认',
    },
    scopeTag: '疑似超纲已标注了解',
  },
  'el.Cr': {
    table: 'chem_elements',
    id: 28,
    fields: {
      common_compounds: '不锈钢相关(了解)；勿将K2Cr2O7作必修默认训练',
      key_properties: '不锈钢组分(了解)；高一不展开铬酸盐氧化还原',
      review_note: '[inv:el.Cr] 范围标注:必修仅了解不锈钢；重铬酸盐偏超纲。待人工确认',
    },
    scopeTag: '疑似超纲已标注了解',
  },
  'el.Be': {
    table: 'chem_elements',
    id: 7,
    fields: {
      review_note: '[inv:el.Be] 待人工核实:用途/毒性；建议仅周期表层面',
    },
    humanOnly: true,
  },
  'el.Ar': {
    table: 'chem_elements',
    id: 18,
    fields: {
      review_note: '[inv:el.Ar] 待人工核实:Ar相对原子质量需与教材表对齐',
    },
    humanOnly: true,
  },
  'el.Fe': {
    table: 'chem_elements',
    id: 21,
    fields: {
      review_note: '[inv:el.Fe] 待人工核实:电子排布记号口径；训练优先Fe2+/Fe3+',
    },
    humanOnly: true,
  },

  // —— concepts ——
  'concept.elemental_compound': {
    table: 'chem_concepts',
    id: 4,
    fields: {
      definition:
        '单质是由同种元素组成的纯净物；化合物是由不同种元素组成的纯净物。',
      judge_methods:
        '先确认是纯净物，再看化学式中元素种类：一种元素→单质；多种元素→化合物。注意O₂与O₃的混合物不是单质。',
      common_mistakes:
        '漏掉“纯净物”条件；把O₂与O混淆；把CO当成单质。注意：Co是钴，CO是一氧化碳。',
      review_note: '[inv:concept.elemental_compound] B2整改:定义补“纯净物”',
    },
  },
  'concept.charge_conserve': {
    table: 'chem_concepts',
    id: 20,
    fields: {
      definition: '电荷守恒：在化学反应或电解质溶液中，正负电荷的代数和守恒（代数和为零或不改变）。',
      principle: '离子方程式配平必须检查电荷代数和相等，不能只数“离子个数”。',
      review_note: '[inv:concept.charge_conserve] B2整改:改为电荷代数和表述',
    },
  },

  // —— formulas ——
  'formula.Vm': {
    table: 'chem_formulas',
    id: 3,
    fields: {
      applicable_conditions:
        '定义式 Vm=V/n 适用于气体。Vm 随温度、压强变化。仅当题目指明标准状况（0℃、101kPa）时，才可近似用 Vm≈22.4 L/mol；常温常压不可默认22.4。标况专用也可参见 formula.gas_STP。',
      common_mistakes: '非气体套用；非标况仍用22.4；把定义式与标况近似值混为一谈',
      review_note: '[inv:formula.Vm] B2整改:区分定义式与标况近似',
    },
  },
  'formula.M_m_n': {
    table: 'chem_formulas',
    id: 6,
    fields: {
      applicable_conditions:
        '适用于纯净物：m 为该纯净物质量。M 的数值等于相对原子/分子质量，单位必须写 g/mol。与聚集状态无关；勿与气体体积公式混用。与 formula.n_m_M 互为变形。',
      review_note: '[inv:formula.M_m_n] B2整改:补单位与适用说明',
    },
  },
  'formula.equation_ratio': {
    table: 'chem_formulas',
    id: 9,
    fields: {
      applicable_conditions:
        '按化学方程式计量关系计算：仅当反应物按计量完全反应，或先按不足量（限量反应物）折算后再用。有杂质、转化率、过量时，需先处理实际参与反应的物质的量。',
      common_mistakes: '用质量比直接代替物质的量比；忽略过量/不足；未考虑转化率或纯度',
      review_note: '[inv:formula.equation_ratio] B2整改:补过量与不足量条件',
    },
  },
  'formula.gas_STP': {
    table: 'chem_formulas',
    id: 11,
    fields: {
      expression: 'V = n · 22.4 L/mol（标准状况近似）',
      variables: 'V:气体体积；n:物质的量；标准状况：0℃（273K）、101kPa',
      units: 'V:L；n:mol；22.4:L/mol（标况近似）',
      applicable_conditions:
        '仅适用于标准状况（0℃、101kPa）下的气体（理想气体近似）。常温常压、非标况气体不可套用22.4。一般气体摩尔体积定义见 formula.Vm。',
      common_mistakes: '常温常压仍用22.4；非气体套用；未看清题设是否“标准状况”',
      review_note: '[inv:formula.gas_STP] B2整改:写明0℃、101kPa',
    },
  },

  // —— knowledge ——
  'kp.ion.electrolyte': {
    table: 'chem_knowledge_points',
    id: 10,
    fields: {
      description:
        '电解质：在水溶液中或熔融状态下能够导电的化合物。非电解质：在上述条件下都不能导电的化合物。注意：单质（如金属、石墨）既不是电解质也不是非电解质；二氧化碳、二氧化硫等本身是非电解质，其水溶液导电是因与水反应生成了电解质。',
      review_note: '[inv:kp.ion.electrolyte] B2整改:补完整定义与单质边界',
    },
  },
  'kp.ion.ionic_eq': {
    table: 'chem_knowledge_points',
    id: 13,
    fields: {
      description:
        '离子方程式：强电解质（易溶强酸强碱盐）拆成离子，沉淀、气体、弱电解质、单质、氧化物等不拆；删去旁观离子；检查原子守恒与电荷守恒。边界：微溶物是否拆、酸式盐拆分、少量/过量反应产物，以题设与课本规则为准，不可僵化。',
      review_note: '[inv:kp.ion.ionic_eq] B2整改:补微溶/过量/酸式盐边界提示',
    },
  },
  'kp.structure.electron_formula': {
    table: 'chem_knowledge_points',
    id: 17,
    fields: {
      description:
        '电子式：用“·”表示原子最外层电子。简单阳离子（如Na⁺、Ca²⁺）一般只写离子符号不画电子；阴离子与复杂阳离子（如NH₄⁺）需按规定画出电子式并标注电荷/括号。',
      review_note: '[inv:kp.structure.electron_formula] B2整改:区分简单/复杂阳离子',
    },
  },
  'kp.periodic.trend': {
    table: 'chem_knowledge_points',
    id: 20,
    fields: {
      description:
        '同周期（从左到右，主族）：金属性减弱、非金属性增强，原子半径一般减小，最高正化合价与族序相关。同主族（从上到下）：金属性增强、非金属性减弱，原子半径增大。比较方法：与水/酸反应难易、最高价氧化物对应水化物酸碱性、气态氢化物稳定性、单质氧化性等（限主族教学口径）。',
      review_note: '[inv:kp.periodic.trend] B2整改:补具体递变方向与比较方法',
    },
  },
  'kp.calc.amount': {
    table: 'chem_knowledge_points',
    id: 21,
    fields: {
      description:
        '物质的量三公式：n=m/M；n=N/NA；仅当气体处于标准状况时可用 n=V/22.4（V单位L）。先判断已知量与条件再选式；非标况气体不可用22.4。',
      review_note: '[inv:kp.calc.amount] B2整改:强调非标况不可用22.4',
    },
  },
  'kp.memory.valence_table': {
    table: 'chem_knowledge_points',
    id: 24,
    fields: {
      description:
        '常见化合价速记：K/Na +1；Ca/Mg/Ba/Zn +2；Al +3；Fe +2/+3；Cu +1/+2；H 多为+1（氢化物中可为−1）；F −1；O 通常−2（过氧化物中为−1）；Cl 常见−1；N 常见−3/+2/+4/+5（及+1/+3等）。注意硝酸等含氮化合物价态需按规则计算。',
      review_note: '[inv:kp.memory.valence_table] B2整改:补Fe/Cu/H等变价',
    },
  },
  'kp.memory.ion_table': {
    table: 'chem_knowledge_points',
    id: 25,
    fields: {
      description:
        '常见离子速记：NH₄⁺、OH⁻、NO₃⁻、SO₄²⁻、CO₃²⁻、Cl⁻、S²⁻、Ba²⁺、Ag⁺、Fe²⁺、Fe³⁺、Cu²⁺、Al³⁺等；电荷写在右上角。检验与共存题常考上述离子。',
      review_note: '[inv:kp.memory.ion_table] B2整改:补Fe²⁺/Ag⁺/S²⁻等',
    },
  },
  'kp.memory.color_table': {
    table: 'chem_knowledge_points',
    id: 26,
    fields: {
      description:
        '必修常见颜色：Cl₂黄绿；Br₂深红棕；I₂紫黑；Cu²⁺溶液蓝色；Fe²⁺溶液浅绿；Fe³⁺溶液黄/棕黄；Fe(OH)₂白色（易氧化）；Fe(OH)₃红褐；Cu(OH)₂蓝色。MnO₄⁻紫红偏拓展，训练中宜标注了解/非默认必修表。',
      review_note: '[inv:kp.memory.color_table] B2整改:补卤素与Fe²⁺，MnO₄⁻标拓展',
    },
  },
}

// published proposals (do NOT apply in this script)
const PUBLISHED_PROPOSALS = {
  'el.O': {
    idHint: 'symbol=O published',
    problem: 'common_valences 仅 −2，缺过氧化物 −1',
    proposed: { common_valences: '-2,-1（过氧化物中）' },
    reason: '必修钠章涉及Na2O2，氧在过氧化物中为−1',
  },
  'el.Cl': {
    idHint: 'symbol=Cl published',
    problem: 'key_properties 写成黄绿色气体，实为Cl2性质',
    proposed: {
      key_properties: '卤族典型元素；单质Cl2为黄绿色有毒气体（元素与单质宜分条描述）',
    },
    reason: '避免元素条目与Cl2混淆',
  },
  'kp.redox': {
    idHint: 'name=氧化还原反应 parent null published',
    problem: 'description过短',
    proposed: {
      description:
        '高一核心：有化合价升降（电子转移）的反应为氧化还原反应。升失还原剂，降得氧化剂；注意氧化剂≠氧化产物、还原剂≠还原产物。',
    },
    reason: '训练解释不足',
  },
  'el.Na': {
    idHint: 'symbol=Na published',
    problem: 'common_compounds含Na（单质）',
    proposed: { common_compounds: 'NaOH,NaCl,Na2O,Na2O2,Na2CO3' },
    reason: '表述严谨性P3',
  },
}

const SPECIALTY_FIXES = [
  // knowledge id -> specialty codes to set (replace)
  { code: 'kp.periodic.position', id: 18, specialtyCodes: ['periodic', 'structure'] },
  { code: 'kp.calc.concentration', id: 22, specialtyCodes: ['calculation'] },
  { code: 'kp.calc.dilution', id: 23, specialtyCodes: ['calculation'] },
]

async function main() {
  const env = loadEnv(envPath)
  const mysql = await getMysql()
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  // P0 status check
  const [[kp14]] = await conn.query(
    `SELECT id, description, review_note FROM chem_knowledge_points WHERE id=14`,
  )
  const [[fm7]] = await conn.query(
    `SELECT id, expression, units, review_note FROM chem_formulas WHERE id=7`,
  )
  const [[rx1]] = await conn.query(
    `SELECT id, oxidant, reductant, ox_product, re_product FROM chem_reactions WHERE id=1`,
  )
  const p0Status = {
    kp_structure_atom: {
      fixed: kp14 && !String(kp14.description).includes('质量数≈') && String(kp14.description).includes('A ='),
      snippet: kp14 && String(kp14.description).slice(0, 80),
    },
    formula_rho_c_M: {
      fixed: fm7 && String(fm7.expression).includes('ρω') && String(fm7.units).includes('g/cm'),
      expression: fm7 && fm7.expression,
    },
    rxn_Na_water: {
      fixed: rx1 && rx1.ox_product === 'NaOH' && rx1.re_product === 'H2',
      ox: rx1 && rx1.ox_product,
      re: rx1 && rx1.re_product,
    },
  }

  // backup all targets
  const backup = { backedUpAt: new Date().toISOString(), apply: APPLY, p0Status, rows: {} }
  for (const [code, fix] of Object.entries(FIXES)) {
    const [rows] = await conn.query(`SELECT * FROM ${fix.table} WHERE id=?`, [fix.id])
    backup.rows[code] = rows[0] || null
  }
  // published current
  const [pubO] = await conn.query(`SELECT * FROM chem_elements WHERE symbol='O'`)
  const [pubCl] = await conn.query(`SELECT * FROM chem_elements WHERE symbol='Cl'`)
  const [pubNa] = await conn.query(`SELECT * FROM chem_elements WHERE symbol='Na'`)
  const [pubKp] = await conn.query(
    `SELECT * FROM chem_knowledge_points WHERE name='氧化还原反应' AND parent_id IS NULL`,
  )
  backup.published = { O: pubO[0], Cl: pubCl[0], Na: pubNa[0], kp_redox: pubKp[0] }

  const backupFile = path.join(OUT, APPLY ? 'backup_before_b2_remediate_apply.json' : 'backup_before_b2_remediate_dryrun.json')
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8')
  fs.writeFileSync(path.join(OUT, 'published_change_proposals.json'), JSON.stringify(PUBLISHED_PROPOSALS, null, 2), 'utf8')

  const results = { applied: [], skippedHuman: [], skippedAlreadyOk: [], errors: [] }

  if (!APPLY) {
    console.log(JSON.stringify({ mode: 'dry-run', backupFile, p0Status, fixCount: Object.keys(FIXES).length, publishedProposals: Object.keys(PUBLISHED_PROPOSALS) }, null, 2))
    await conn.end()
    return
  }

  await conn.beginTransaction()
  try {
    for (const [code, fix] of Object.entries(FIXES)) {
      if (fix.humanOnly) {
        // still update review_note only
        const sets = Object.keys(fix.fields).map((k) => `${k}=?`).join(', ')
        const vals = [...Object.values(fix.fields), fix.id]
        await conn.query(`UPDATE ${fix.table} SET ${sets} WHERE id=?`, vals)
        results.skippedHuman.push(code)
        continue
      }
      const sets = Object.keys(fix.fields).map((k) => `${k}=?`).join(', ')
      const vals = [...Object.values(fix.fields), fix.id]
      await conn.query(`UPDATE ${fix.table} SET ${sets} WHERE id=?`, vals)
      results.applied.push(code)
    }

    // specialty fixes
    const [specs] = await conn.query(`SELECT id, code FROM chem_specialties`)
    const specByCode = Object.fromEntries(specs.map((s) => [s.code, s.id]))
    for (const sf of SPECIALTY_FIXES) {
      const ids = sf.specialtyCodes.map((c) => specByCode[c]).filter(Boolean)
      await conn.query(
        `DELETE FROM chem_entity_specialties WHERE entity_type='knowledge' AND entity_id=?`,
        [String(sf.id)],
      )
      for (const sid of ids) {
        await conn.query(
          `INSERT INTO chem_entity_specialties (entity_type, entity_id, specialty_id) VALUES ('knowledge', ?, ?)`,
          [String(sf.id), sid],
        )
      }
      results.applied.push(`link:${sf.code}`)
    }

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  }

  // verify samples
  const verify = {}
  for (const code of ['el.He', 'el.N', 'el.Hg', 'concept.elemental_compound', 'formula.gas_STP', 'kp.periodic.trend', 'kp.structure.atom', 'formula.rho_c_M']) {
    const fix = FIXES[code]
    if (!fix && code === 'kp.structure.atom') {
      const [r] = await conn.query(`SELECT description FROM chem_knowledge_points WHERE id=14`)
      verify[code] = { ok: !String(r[0].description).includes('质量数≈') }
      continue
    }
    if (!fix && code === 'formula.rho_c_M') {
      const [r] = await conn.query(`SELECT expression, units FROM chem_formulas WHERE id=7`)
      verify[code] = { ok: String(r[0].expression).includes('ρω') }
      continue
    }
    if (!fix) continue
    const [r] = await conn.query(`SELECT * FROM ${fix.table} WHERE id=?`, [fix.id])
    verify[code] = r[0]
  }

  // specialty verify
  const [linkRows] = await conn.query(
    `SELECT es.entity_id, s.code FROM chem_entity_specialties es
     JOIN chem_specialties s ON s.id=es.specialty_id
     WHERE es.entity_type='knowledge' AND es.entity_id IN ('18','22','23')`,
  )
  verify.specialtyLinks = linkRows

  const afterFile = path.join(OUT, 'after_b2_remediate.json')
  fs.writeFileSync(afterFile, JSON.stringify({ results, verify, p0Status }, null, 2), 'utf8')
  console.log(JSON.stringify({ mode: 'applied', backupFile, afterFile, results, p0Status }, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e))
  process.exit(1)
})
