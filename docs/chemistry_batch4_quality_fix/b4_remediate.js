/**
 * Batch4 quality remediation: backup → update DB from import packs + specialty links.
 * Usage:
 *   node docs/chemistry_batch4_quality_fix/b4_remediate.js
 *   node docs/chemistry_batch4_quality_fix/b4_remediate.js --apply
 */
'use strict'
const fs = require('fs')
const path = require('path')

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const B4 = path.join(ROOT, 'docs/chemistry_batch4')

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
    fs.readFileSync(path.join(B4, 'import_all_results.json'), 'utf8'),
  ).codeToEntity

  const packs = ['B4-A', 'B4-B', 'B4-C', 'B4-D'].map((p) =>
    JSON.parse(fs.readFileSync(path.join(B4, `import_${p}.json`), 'utf8')),
  )

  const updates = []
  for (const pack of packs) {
    const codes = pack.meta.inventoryCodes
    pack.items.forEach((item, i) => {
      const code = codes[i]
      const ent = map[code]
      if (!ent) throw new Error('missing entity map for ' + code)
      updates.push({
        code,
        type: item.type,
        id: ent.id,
        data: item.data,
        specialtyCodes: pack.meta.specialtyByCode?.[code] || [],
        categoryCodes: pack.meta.categoryByCode?.[code] || [],
      })
    })
  }

  if (updates.length !== 74) {
    throw new Error('expected 74 updates, got ' + updates.length)
  }

  // specialty / category maps
  const [specRows] = await conn.query(
    `SELECT id, code FROM chem_specialties WHERE is_active=1`,
  )
  const specMap = new Map(specRows.map((r) => [r.code, String(r.id)]))
  const [catRows] = await conn.query(
    `SELECT c.id, c.code AS cat_code, s.code AS sp_code
     FROM chem_categories c
     JOIN chem_specialties s ON s.id=c.specialty_id
     WHERE c.is_active=1`,
  )
  const catMap = new Map(
    catRows.map((r) => [`${r.sp_code}.${r.cat_code}`, String(r.id)]),
  )

  // backup
  const backup = {
    backedUpAt: new Date().toISOString(),
    apply: APPLY,
    rows: {},
    links: {},
  }
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
    const [specs] = await conn.query(
      `SELECT specialty_id FROM chem_entity_specialties WHERE entity_type=? AND entity_id=?`,
      [u.type, u.id],
    )
    const [cats] = await conn.query(
      `SELECT category_id FROM chem_entity_categories WHERE entity_type=? AND entity_id=?`,
      [u.type, u.id],
    )
    backup.rows[u.code] = { table, id: u.id, before: rows[0] || null }
    backup.links[u.code] = {
      specialtyIds: specs.map((x) => String(x.specialty_id)),
      categoryIds: cats.map((x) => String(x.category_id)),
    }
  }

  const backupFile = path.join(
    OUT,
    APPLY
      ? 'backup_before_b4_remediate_apply.json'
      : 'backup_before_b4_remediate_dryrun.json',
  )
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8')
  fs.writeFileSync(
    path.join(OUT, 'backup_before_b4_remediate.json'),
    JSON.stringify(backup, null, 2),
    'utf8',
  )

  // status sanity: all pending_review
  const statusIssues = []
  for (const u of updates) {
    const st = backup.rows[u.code]?.before?.status
    if (st && st !== 'pending_review') {
      statusIssues.push({ code: u.code, status: st })
    }
  }

  if (!APPLY) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          plannedUpdates: updates.length,
          statusIssues,
          backupFile,
          sampleSpecialty: {
            'rxn.SO3_H2O': updates.find((x) => x.code === 'rxn.SO3_H2O')
              ?.specialtyCodes,
            'rxn.CO2_CaOH2': updates.find((x) => x.code === 'rxn.CO2_CaOH2')
              ?.specialtyCodes,
          },
        },
        null,
        2,
      ),
    )
    await conn.end()
    return
  }

  if (statusIssues.length) {
    console.error('Refusing apply: non-pending_review rows', statusIssues)
    await conn.end()
    process.exit(1)
  }

  const applied = []
  const linkResults = []

  for (const u of updates) {
    const d = u.data
    if (u.type === 'substance') {
      await conn.query(
        `UPDATE chem_substances SET
          name=?, canonical_formula=?, common_names=?, color=?, state_label=?, solubility=?,
          physical_props=?, chemical_props=?, common_uses=?, test_methods=?, storage_methods=?,
          safety_notes=?, review_note=?, updated_at=NOW()
         WHERE id=? AND status='pending_review'`,
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
         WHERE id=? AND status='pending_review'`,
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
         WHERE id=? AND status='pending_review'`,
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
         WHERE id=? AND status='pending_review'`,
        [
          d.name,
          d.description,
          d.difficulty ?? 2,
          d.importance ?? 4,
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
    } else {
      throw new Error('unexpected type ' + u.type)
    }

    // refresh specialty / category links from pack meta
    const specialtyIds = u.specialtyCodes
      .map((c) => specMap.get(c))
      .filter(Boolean)
    const categoryIds = u.categoryCodes
      .map((c) => catMap.get(c))
      .filter(Boolean)

    await conn.query(
      `DELETE FROM chem_entity_specialties WHERE entity_type=? AND entity_id=?`,
      [u.type, u.id],
    )
    for (const sid of specialtyIds) {
      await conn.query(
        `INSERT INTO chem_entity_specialties (entity_type, entity_id, specialty_id) VALUES (?,?,?)`,
        [u.type, u.id, sid],
      )
    }
    await conn.query(
      `DELETE FROM chem_entity_categories WHERE entity_type=? AND entity_id=?`,
      [u.type, u.id],
    )
    for (const cid of categoryIds) {
      await conn.query(
        `INSERT INTO chem_entity_categories (entity_type, entity_id, category_id) VALUES (?,?,?)`,
        [u.type, u.id, cid],
      )
    }

    applied.push(u.code)
    linkResults.push({
      code: u.code,
      specialtyCodes: u.specialtyCodes,
      specialtyIds,
      categoryCodes: u.categoryCodes,
      categoryIds,
      unresolvedSpec: u.specialtyCodes.filter((c) => !specMap.get(c)),
      unresolvedCat: u.categoryCodes.filter((c) => !catMap.get(c)),
    })
  }

  // verify key samples
  const samples = {}
  const [so3] = await conn.query(
    `SELECT r.id, r.conditions, r.train_types, r.review_note,
      (SELECT GROUP_CONCAT(s.code) FROM chem_entity_specialties es
        JOIN chem_specialties s ON s.id=es.specialty_id
        WHERE es.entity_type='reaction' AND es.entity_id=r.id) AS specs
     FROM chem_reactions r WHERE r.id=?`,
    [map['rxn.SO3_H2O'].id],
  )
  samples.SO3_H2O = so3[0]
  const [cl2alk] = await conn.query(
    `SELECT id, conditions, principle, review_note FROM chem_reactions WHERE id=?`,
    [map['rxn.Cl2_2NaOH'].id],
  )
  samples.Cl2_2NaOH = cl2alk[0]
  const [bleach] = await conn.query(
    `SELECT id, physical_props, chemical_props, review_note, status FROM chem_substances WHERE id=?`,
    [map['sub.bleaching_powder'].id],
  )
  samples.bleaching_powder = bleach[0]

  // count check
  const ids = updates.map((u) => u.id)
  const [cnt] = await conn.query(
    `SELECT
      (SELECT COUNT(*) FROM chem_substances WHERE id IN (${updates.filter((u)=>u.type==='substance').map((u)=>u.id).join(',')||'0'})) AS sub_n,
      (SELECT COUNT(*) FROM chem_reactions WHERE id IN (${updates.filter((u)=>u.type==='reaction').map((u)=>u.id).join(',')||'0'})) AS rxn_n,
      (SELECT COUNT(*) FROM chem_experiments WHERE id IN (${updates.filter((u)=>u.type==='experiment').map((u)=>u.id).join(',')||'0'})) AS exp_n,
      (SELECT COUNT(*) FROM chem_knowledge_points WHERE id IN (${updates.filter((u)=>u.type==='knowledge').map((u)=>u.id).join(',')||'0'})) AS kp_n`,
  )

  // confirm 5 no longer have redox specialty
  const five = [
    'rxn.SO3_H2O',
    'rxn.NH3_HCl',
    'rxn.CO2_CaOH2',
    'rxn.SiO2_2NaOH',
    'rxn.CaCO3_2HCl',
  ]
  const fiveCheck = []
  for (const code of five) {
    const id = map[code].id
    const [rows] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type='reaction' AND es.entity_id=?`,
      [id],
    )
    fiveCheck.push({
      code,
      specs: rows.map((r) => r.code),
      hasRedox: rows.some((r) => r.code === 'redox'),
    })
  }

  const after = {
    appliedAt: new Date().toISOString(),
    appliedCount: applied.length,
    applied,
    counts: cnt[0],
    samples,
    fiveCheck,
    linkUnresolved: linkResults.filter(
      (x) => x.unresolvedSpec.length || x.unresolvedCat.length,
    ),
  }
  fs.writeFileSync(
    path.join(OUT, 'after_b4_remediate.json'),
    JSON.stringify(after, null, 2),
    'utf8',
  )
  console.log(
    JSON.stringify(
      {
        ok: true,
        applied: applied.length,
        fiveStillRedox: fiveCheck.filter((x) => x.hasRedox).map((x) => x.code),
        fiveCheck,
        samples: {
          SO3_specs: samples.SO3_H2O?.specs,
          Cl2_conditions: String(samples.Cl2_2NaOH?.conditions || '').slice(0, 80),
        },
        linkUnresolved: after.linkUnresolved.length,
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
