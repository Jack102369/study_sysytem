/**
 * Post-remediation recheck for Batch6 79 items. Read-only.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const B6 = path.join(ROOT, 'docs/chemistry_batch6')
const OUT = __dirname

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

const TABLE = {
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const b6 = inv.batches.find((b) => b.id === 'batch6')
  const map = JSON.parse(
    fs.readFileSync(path.join(B6, 'import_all_results.json'), 'utf8'),
  ).codeToEntity
  const content = require(path.join(B6, 'batch6_content.js'))

  const BAD_RXN_CATS = new Set([
    'organic.substitution+organic.addition+organic.esterification',
  ])

  const rows = []
  for (const it of b6.items) {
    let id = map[it.code]?.id || it.dbId
    if (it.code === 'q.eq.Na_water') id = it.dbId || '1'
    const table = TABLE[it.type]
    const [dbRows] = await conn.query(
      it.type === 'question'
        ? `SELECT id, status, review_note, stem, answer FROM ${table} WHERE id=?`
        : it.type === 'reaction'
          ? `SELECT id, status, review_note, ox_product, re_product, oxidant, reductant, ionic_equation, conditions FROM ${table} WHERE id=?`
          : `SELECT id, status, review_note FROM ${table} WHERE id=?`,
      [id],
    )
    const db = dbRows[0]
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type=? AND es.entity_id=?`,
      [it.type, id],
    )
    const [cats] = await conn.query(
      `SELECT CONCAT(sp.code,'.',c.code) AS code FROM chem_entity_categories ec
       JOIN chem_categories c ON c.id=ec.category_id
       JOIN chem_specialties sp ON sp.id=c.specialty_id
       WHERE ec.entity_type=? AND ec.entity_id=?`,
      [it.type, id],
    )
    const gotSpec = specs.map((s) => s.code).sort()
    const gotCat = cats.map((c) => c.code).sort()
    const expSpec = (it.specialtyCodes || []).slice().sort()
    const expCat = (it.categoryCodes || []).slice().sort()

    const issues = []
    let verdict = '通过'
    let severity = null

    if (!db) {
      issues.push('DB缺失')
      verdict = '需要修改'
      severity = 'P0'
    } else if (it.code === 'q.eq.Na_water') {
      // published: do not require inv; record residual training limits
      if (db.status !== 'published') issues.push('状态非published')
      issues.push(
        'published保留:题干问生成物、无方程式标准答案;不宜方程式自动判题(训练限制,未改DB正文)',
      )
      verdict = '通过'
      severity = 'P2'
    } else {
      if (db.status !== 'pending_review') {
        issues.push('status非pending_review')
        verdict = '需要修改'
        severity = 'P1'
      }
      if (!String(db.review_note || '').includes(`[inv:${it.code}]`)) {
        issues.push('缺[inv:]')
        verdict = '需要修改'
        severity = 'P1'
      }
    }

    // link match for non-Na
    if (it.code !== 'q.eq.Na_water') {
      if (JSON.stringify(gotSpec) !== JSON.stringify(expSpec)) {
        issues.push('specialty不一致:' + gotSpec.join(',') + ' vs ' + expSpec.join(','))
        if (verdict === '通过') {
          verdict = '需要修改'
          severity = 'P2'
        }
      }
      if (JSON.stringify(gotCat) !== JSON.stringify(expCat)) {
        issues.push('category不一致')
        if (verdict === '通过') {
          verdict = '需要修改'
          severity = 'P2'
        }
      }
      // detect old bad triple hang on reactions
      if (
        it.type === 'reaction' &&
        gotCat.includes('organic.substitution') &&
        gotCat.includes('organic.addition') &&
        gotCat.includes('organic.esterification')
      ) {
        issues.push('仍存在取代+加成+酯化三挂')
        verdict = '需要修改'
        severity = 'P2'
      }
    }

    if (it.code === 'rxn.C2H5OH_O2') {
      if (db.ox_product !== 'CH3CHO' || db.re_product !== 'H2O') {
        issues.push('P0未修复 ox/re')
        verdict = '需要修改'
        severity = 'P0'
      }
      if (content.REACTIONS[it.code].oxProduct !== 'CH3CHO') {
        issues.push('content源ox未同步')
        verdict = '需要修改'
        severity = 'P0'
      }
    }
    if (it.code === 'rxn.C2H5OH_burn') {
      if (db.ox_product !== 'CO2' || db.re_product !== 'H2O') {
        issues.push('P0未修复 ox/re')
        verdict = '需要修改'
        severity = 'P0'
      }
    }
    if (it.code === 'rxn.C2H4_KMnO4') {
      if (String(db.re_product || '').includes('氧化产物') && !String(db.re_product).includes('还原')) {
        issues.push('re_product仍误称氧化产物')
        verdict = '需要修改'
        severity = 'P2'
      }
    }
    if (it.code === 'rxn.CH3COOH_Na2CO3') {
      if (String(db.ionic_equation || '').includes('CO3 2-')) {
        issues.push('离子式仍不规范')
        verdict = '需要修改'
        severity = 'P3'
      }
    }
    if (it.code === 'kp.energy.galvanic') {
      if (gotSpec.includes('experiment')) {
        issues.push('仍挂experiment')
        verdict = '需要修改'
        severity = 'P2'
      }
    }
    if (it.code === 'kp.sustain.atom_economy') {
      if (gotSpec.includes('calculation') || gotCat.some((c) => c.startsWith('calculation.'))) {
        issues.push('仍挂calculation')
        verdict = '需要修改'
        severity = 'P2'
      }
    }

    if (it.verifyNeeded) {
      verdict = '待核实'
      severity = severity || 'P1'
      if (!issues.some((x) => /待核实|核实/.test(x))) {
        issues.push('verifyNeeded保留;默认训练限制')
      }
    }

    rows.push({
      code: it.code,
      type: it.type,
      name: it.name,
      verdict,
      severity,
      issues,
      dbStatus: db?.status || null,
      gotSpec,
      gotCat,
      verifyNeeded: !!it.verifyNeeded,
    })
  }

  const verdictCount = { 通过: 0, 需要修改: 0, 待核实: 0 }
  const sev = { P0: 0, P1: 0, P2: 0, P3: 0, none: 0 }
  for (const r of rows) {
    verdictCount[r.verdict]++
    if (r.severity) sev[r.severity]++
    else sev.none++
  }

  // pack vs DB sample for P0
  const packB = JSON.parse(fs.readFileSync(path.join(B6, 'import_B6-B.json'), 'utf8'))
  const packO2 = packB.items.find(
    (_, i) => packB.meta.inventoryCodes[i] === 'rxn.C2H5OH_O2',
  )
  const packBurn = packB.items.find(
    (_, i) => packB.meta.inventoryCodes[i] === 'rxn.C2H5OH_burn',
  )

  const [priorB5] = await conn.query(
    `SELECT id FROM chem_experiments WHERE review_note LIKE '%[inv:exp.instrument_basic]%' LIMIT 1`,
  )
  const [priorB4] = await conn.query(
    `SELECT id FROM chem_substances WHERE review_note LIKE '%[inv:sub.Cl2]%' LIMIT 1`,
  )
  const [na] = await conn.query(
    `SELECT id, status, stem, answer, review_note FROM chem_questions WHERE id=1`,
  )

  const out = {
    recheckedAt: new Date().toISOString(),
    inventoryTotal: inv.batches.reduce((s, b) => s + b.items.length, 0),
    verdictCount,
    severityByItem: sev,
    sum:
      verdictCount['通过'] + verdictCount['需要修改'] + verdictCount['待核实'],
    p0Remaining: rows.filter((r) => r.severity === 'P0' && r.verdict === '需要修改')
      .length,
    needFixCodes: rows.filter((r) => r.verdict === '需要修改').map((r) => r.code),
    verifyCodes: rows.filter((r) => r.verdict === '待核实').map((r) => r.code),
    reactionRecheck: rows.filter((r) => r.type === 'reaction'),
    questionRecheck: rows.filter((r) => r.type === 'question'),
    packDbP0: {
      packO2: {
        ox: packO2?.data?.oxProduct,
        re: packO2?.data?.reProduct,
      },
      packBurn: {
        ox: packBurn?.data?.oxProduct,
        re: packBurn?.data?.reProduct,
      },
    },
    naWater: {
      handling: 'published_unchanged_training_limit_only',
      status: na[0]?.status,
      stem: na[0]?.stem,
      answer: na[0]?.answer,
      review_note: na[0]?.review_note,
      dbModified: false,
    },
    priorOk: !!(priorB5[0] && priorB4[0]),
    rows,
  }
  fs.writeFileSync(path.join(OUT, 'b6_recheck_result.json'), JSON.stringify(out, null, 2) + '\n')
  console.log(
    JSON.stringify(
      {
        verdictCount: out.verdictCount,
        severityByItem: out.severityByItem,
        sum: out.sum,
        p0Remaining: out.p0Remaining,
        needFix: out.needFixCodes,
        verify: out.verifyCodes,
        packDbP0: out.packDbP0,
        naHandling: out.naWater.handling,
        priorOk: out.priorOk,
        inventoryTotal: out.inventoryTotal,
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
