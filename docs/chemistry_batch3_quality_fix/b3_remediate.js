/**
 * Batch3 quality remediation: backup → update DB from regenerated import packs + seeded fixes.
 * Usage:
 *   node docs/chemistry_batch3_quality_fix/b3_remediate.js
 *   node docs/chemistry_batch3_quality_fix/b3_remediate.js --apply
 */
const fs = require('fs')
const path = require('path')

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const B3 = path.join(ROOT, 'docs/chemistry_batch3')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function clipNote(s, max = 255) {
  const t = String(s || '')
  return t.length <= max ? t : t.slice(0, max - 1) + '…'
}

const SEEDED_KP_NA = {
  description:
    '钠的化学性质须分条件记忆，不可混为一谈：①与氧气：常温主要生成Na2O（表面变暗），点燃燃烧生成淡黄色Na2O2；②与水：2Na+2H2O=2NaOH+H2，现象浮、熔、游、响，溶液显碱性；③与酸：与H+反应更剧烈生成盐和H2（了解对比，禁止学生自行实验）；④与盐溶液：可置换活动性较弱金属离子（题设）。保存于煤油/石蜡油。易错：燃烧产物写成Na2O；忽视条件对产物的影响。',
  review_note: clipNote(
    '[kp.Na.property] B3整改:分条件写与O2/水/酸/盐;非人工审核',
  ),
}

const SEEDED_SUB = {
  Na: {
    chemical_props:
      '强还原性。与O2：常温主要生成Na2O，点燃生成Na2O2；与水、酸剧烈反应放H2；可置换较弱金属离子（题设）。',
    common_uses: '散热介质、还原剂等（了解）',
    review_note: clipNote('[sub.Na] B3轻改:分条件性质;用途标了解'),
  },
  NaOH: {
    chemical_props:
      '强碱。与酸中和；吸收CO2（用量不同可得Na2CO3或NaHCO3）；潮解。',
    physical_props: '白色固体，易潮解，易溶于水放热',
    review_note: clipNote('[sub.NaOH] B3轻改:补潮解与吸收CO2'),
  },
  H2O: {
    safety_notes: '常温液体水一般安全；高温蒸汽烫伤风险；按实验室规范使用',
    review_note: clipNote('[sub.H2O] B3轻改:safety表述'),
  },
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  let mysql
  try {
    mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  } catch {
    mysql = require('mysql2/promise')
  }
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const map = JSON.parse(
    fs.readFileSync(path.join(B3, 'import_all_results.json'), 'utf8'),
  ).codeToEntity

  const packs = ['B3-A', 'B3-B', 'B3-C', 'B3-D'].map((p) =>
    JSON.parse(fs.readFileSync(path.join(B3, `import_${p}.json`), 'utf8')),
  )

  const updates = []
  for (const pack of packs) {
    const codes = pack.meta.inventoryCodes
    pack.items.forEach((item, i) => {
      const code = codes[i]
      const ent = map[code]
      if (!ent) throw new Error('missing entity map for ' + code)
      updates.push({ code, type: item.type, id: ent.id, data: item.data })
    })
  }

  // backup
  const backup = { backedUpAt: new Date().toISOString(), apply: APPLY, rows: {} }
  for (const u of updates) {
    const table =
      u.type === 'substance'
        ? 'chem_substances'
        : u.type === 'reaction'
          ? 'chem_reactions'
          : u.type === 'experiment'
            ? 'chem_experiments'
            : u.type === 'knowledge'
              ? 'chem_knowledge_points'
              : 'chem_concepts'
    const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [u.id])
    backup.rows[u.code] = { table, id: u.id, before: rows[0] || null }
  }
  // seeded
  const [kpRows] = await conn.query(
    `SELECT * FROM chem_knowledge_points WHERE name='钠的化学性质' AND parent_id IS NULL LIMIT 1`,
  )
  const [subRows] = await conn.query(
    `SELECT * FROM chem_substances WHERE name IN ('钠','氢氧化钠','水')`,
  )
  backup.seeded = { kp_Na_property: kpRows[0] || null, substances: subRows }

  const backupFile = path.join(
    OUT,
    APPLY ? 'backup_before_b3_remediate_apply.json' : 'backup_before_b3_remediate_dryrun.json',
  )
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8')
  fs.writeFileSync(
    path.join(OUT, 'backup_before_b3_remediate.json'),
    JSON.stringify(backup, null, 2),
    'utf8',
  )

  if (!APPLY) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          plannedUpdates: updates.length,
          seededKp: !!kpRows[0],
          seededSubs: subRows.length,
          backupFile,
        },
        null,
        2,
      ),
    )
    await conn.end()
    return
  }

  const applied = []

  for (const u of updates) {
    const d = u.data
    if (u.type === 'substance') {
      await conn.query(
        `UPDATE chem_substances SET
          name=?, canonical_formula=?, common_names=?, color=?, state_label=?, solubility=?,
          physical_props=?, chemical_props=?, common_uses=?, test_methods=?, storage_methods=?,
          safety_notes=?, review_note=?, updated_at=NOW()
         WHERE id=?`,
        [
          d.name,
          d.canonicalFormula,
          d.commonNames || null,
          d.color || null,
          d.stateLabel || null,
          d.solubility || null,
          d.physicalProps || null,
          d.chemicalProps || null,
          d.commonUses || null,
          d.testMethods || null,
          d.storageMethods || null,
          d.safetyNotes || null,
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
    } else if (u.type === 'reaction') {
      await conn.query(
        `UPDATE chem_reactions SET
          name=?, canonical_equation=?, equation=?, ionic_equation=?, conditions=?,
          phenomenon=?, principle=?, oxidant=?, reductant=?, ox_product=?, re_product=?,
          electron_transfer=?, train_types=?, review_note=?, updated_at=NOW()
         WHERE id=?`,
        [
          d.name,
          d.canonicalEquation,
          d.equation,
          d.ionicEquation || null,
          d.conditions || '',
          d.phenomenon || null,
          d.principle || null,
          d.oxidant || null,
          d.reductant || null,
          d.oxProduct || null,
          d.reProduct || null,
          d.electronTransfer || null,
          d.trainTypes || '',
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
    } else if (u.type === 'experiment') {
      await conn.query(
        `UPDATE chem_experiments SET
          name=?, category=?, purpose=?, principle=?, instruments=?, reagents=?, steps=?,
          phenomenon=?, conclusion=?, precautions=?, safety_notes=?, is_hazardous=?,
          home_forbidden_note=?, review_note=?, updated_at=NOW()
         WHERE id=?`,
        [
          d.name,
          d.category || 'other',
          d.purpose || null,
          d.principle || null,
          d.instruments || null,
          d.reagents || null,
          d.steps || null,
          d.phenomenon || null,
          d.conclusion || null,
          d.precautions || null,
          d.safetyNotes || null,
          d.isHazardous ? 1 : 0,
          d.homeForbiddenNote || null,
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
    } else if (u.type === 'knowledge') {
      await conn.query(
        `UPDATE chem_knowledge_points SET name=?, description=?, difficulty=?, importance=?, review_note=?, updated_at=NOW()
         WHERE id=?`,
        [
          d.name,
          d.description,
          d.difficulty ?? 2,
          d.importance ?? 4,
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
    } else if (u.type === 'concept') {
      await conn.query(
        `UPDATE chem_concepts SET
          name=?, definition=?, principle=?, applicable_conditions=?, judge_methods=?,
          examples=?, common_mistakes=?, review_note=?, updated_at=NOW()
         WHERE id=?`,
        [
          d.name,
          d.definition || null,
          d.principle || null,
          d.applicableConditions || null,
          d.judgeMethods || null,
          d.examples || null,
          d.commonMistakes || null,
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
    }
    applied.push(u.code)
  }

  // seeded published updates (authorized by Batch3 fix task)
  if (kpRows[0]) {
    await conn.query(
      `UPDATE chem_knowledge_points SET description=?, review_note=?, updated_at=NOW() WHERE id=?`,
      [SEEDED_KP_NA.description, SEEDED_KP_NA.review_note, kpRows[0].id],
    )
    applied.push('kp.Na.property')
  }
  for (const row of subRows) {
    const patch = SEEDED_SUB[row.canonical_formula === 'Na' ? 'Na' : row.name === '氢氧化钠' ? 'NaOH' : row.name === '水' ? 'H2O' : null]
    // map by name
  }
  const byName = Object.fromEntries(subRows.map((r) => [r.name, r]))
  if (byName['钠']) {
    const p = SEEDED_SUB.Na
    await conn.query(
      `UPDATE chem_substances SET chemical_props=?, common_uses=?, review_note=?, updated_at=NOW() WHERE id=?`,
      [p.chemical_props, p.common_uses, p.review_note, byName['钠'].id],
    )
    applied.push('sub.Na')
  }
  if (byName['氢氧化钠']) {
    const p = SEEDED_SUB.NaOH
    await conn.query(
      `UPDATE chem_substances SET chemical_props=?, physical_props=?, review_note=?, updated_at=NOW() WHERE id=?`,
      [p.chemical_props, p.physical_props, p.review_note, byName['氢氧化钠'].id],
    )
    applied.push('sub.NaOH')
  }
  if (byName['水']) {
    const p = SEEDED_SUB.H2O
    await conn.query(
      `UPDATE chem_substances SET safety_notes=?, review_note=?, updated_at=NOW() WHERE id=?`,
      [p.safety_notes, p.review_note, byName['水'].id],
    )
    applied.push('sub.H2O')
  }

  // verify samples
  const [alloy] = await conn.query(
    `SELECT id, principle, review_note FROM chem_concepts WHERE review_note LIKE '%[inv:concept.alloy]%' OR name='合金' LIMIT 1`,
  )
  const [feoh] = await conn.query(
    `SELECT id, ox_product, re_product, train_types, conditions FROM chem_reactions WHERE canonical_equation='4Fe(OH)2+O2+2H2O=4Fe(OH)3'`,
  )
  const [al] = await conn.query(
    `SELECT id, conditions, phenomenon FROM chem_reactions WHERE canonical_equation='4Al+3O2=2Al2O3'`,
  )

  const after = {
    appliedAt: new Date().toISOString(),
    appliedCount: applied.length,
    applied,
    samples: { alloy: alloy[0], feoh2: feoh[0], alO2: al[0], kpNa: null },
  }
  if (kpRows[0]) {
    const [k2] = await conn.query(
      `SELECT id, LEFT(description,120) AS description, review_note FROM chem_knowledge_points WHERE id=?`,
      [kpRows[0].id],
    )
    after.samples.kpNa = k2[0]
  }

  fs.writeFileSync(
    path.join(OUT, 'after_b3_remediate.json'),
    JSON.stringify(after, null, 2),
    'utf8',
  )
  console.log(JSON.stringify({ ok: true, applied: applied.length, samples: after.samples }, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
