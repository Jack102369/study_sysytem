/**
 * Batch6 quality remediation (pending_review whitelist only).
 * Does NOT update published q.eq.Na_water.
 *
 *   node docs/chemistry_batch6_quality_fix/b6_remediate.js
 *   node docs/chemistry_batch6_quality_fix/b6_remediate.js --apply
 */
'use strict'
const fs = require('fs')
const path = require('path')

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const B6 = path.join(ROOT, 'docs/chemistry_batch6')

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
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
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

  const packs = ['B6-A', 'B6-B', 'B6-C', 'B6-D', 'B6-E', 'B6-F'].map((p) =>
    JSON.parse(fs.readFileSync(path.join(B6, `import_${p}.json`), 'utf8')),
  )

  // Prefer inventory specialty/category (already patched) over pack meta
  const invByCode = Object.fromEntries(b6.items.map((i) => [i.code, i]))

  const updates = []
  for (const pack of packs) {
    const codes = pack.meta.inventoryCodes
    pack.items.forEach((item, i) => {
      const code = codes[i]
      if (code === 'q.eq.Na_water') return
      const ent = map[code]
      if (!ent) throw new Error('missing entity map for ' + code)
      const invIt = invByCode[code]
      updates.push({
        code,
        type: item.type,
        id: ent.id,
        data: item.data,
        specialtyCodes: invIt.specialtyCodes || pack.meta.specialtyByCode?.[code] || [],
        categoryCodes: invIt.categoryCodes || pack.meta.categoryByCode?.[code] || [],
      })
    })
  }
  if (updates.length !== 78) throw new Error('expected 78 pending updates, got ' + updates.length)

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

  const preBackup = {
    backedUpAt: new Date().toISOString(),
    apply: APPLY,
    planned: updates.length,
    skippedPublished: ['q.eq.Na_water'],
  }
  fs.writeFileSync(
    path.join(OUT, APPLY ? 'remediate_apply_meta.json' : 'remediate_dryrun_meta.json'),
    JSON.stringify(preBackup, null, 2) + '\n',
  )

  const statusIssues = []
  for (const u of updates) {
    const table =
      u.type === 'substance'
        ? 'chem_substances'
        : u.type === 'reaction'
          ? 'chem_reactions'
          : u.type === 'experiment'
            ? 'chem_experiments'
            : u.type === 'concept'
              ? 'chem_concepts'
              : u.type === 'knowledge'
                ? 'chem_knowledge_points'
                : 'chem_questions'
    const [rows] = await conn.query(`SELECT id, status FROM ${table} WHERE id=?`, [
      u.id,
    ])
    const st = rows[0]?.status
    if (st !== 'pending_review') statusIssues.push({ code: u.code, status: st })
  }

  if (!APPLY) {
    // sample P0 fields from pack data
    const o2 = updates.find((x) => x.code === 'rxn.C2H5OH_O2')
    const burn = updates.find((x) => x.code === 'rxn.C2H5OH_burn')
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          plannedUpdates: updates.length,
          statusIssues,
          sampleP0: {
            O2: {
              ox: o2?.data?.oxProduct,
              re: o2?.data?.reProduct,
              cats: o2?.categoryCodes,
            },
            burn: {
              ox: burn?.data?.oxProduct,
              re: burn?.data?.reProduct,
              cats: burn?.categoryCodes,
            },
          },
          unresolvedPreview: updates
            .map((u) => ({
              code: u.code,
              unresolvedCat: u.categoryCodes.filter((c) => !catMap.get(c)),
              unresolvedSpec: u.specialtyCodes.filter((c) => !specMap.get(c)),
            }))
            .filter((x) => x.unresolvedCat.length || x.unresolvedSpec.length),
        },
        null,
        2,
      ),
    )
    await conn.end()
    return
  }

  if (statusIssues.length) {
    console.error('Refusing: non-pending_review', statusIssues)
    await conn.end()
    process.exit(1)
  }

  const applied = []
  const linkUnresolved = []

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
      // tags
      await conn.query(`DELETE FROM chem_substance_tags WHERE substance_id=?`, [u.id])
      for (const tag of d.tags || []) {
        await conn.query(
          `INSERT INTO chem_substance_tags (substance_id, tag) VALUES (?,?)`,
          [u.id, tag],
        )
      }
    } else if (u.type === 'reaction') {
      await conn.query(
        `UPDATE chem_reactions SET
          name=?, canonical_equation=?, equation=?, ionic_equation=?, conditions=?,
          phenomenon=?, principle=?, oxidant=?, reductant=?, ox_product=?, re_product=?,
          electron_transfer=?, difficulty=?, importance=?, train_types=?, review_note=?, updated_at=NOW()
         WHERE id=? AND status='pending_review'`,
        [
          d.name,
          d.canonicalEquation,
          d.equation,
          d.ionicEquation || null,
          d.conditions || null,
          d.phenomenon || null,
          d.principle || null,
          d.oxidant || null,
          d.reductant || null,
          d.oxProduct || null,
          d.reProduct || null,
          d.electronTransfer || null,
          d.difficulty ?? 2,
          d.importance ?? 4,
          d.trainTypes || null,
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
      await conn.query(`DELETE FROM chem_reaction_species WHERE reaction_id=?`, [u.id])
      for (const sp of d.species || []) {
        await conn.query(
          `INSERT INTO chem_reaction_species
            (reaction_id, role, formula, coefficient, state_symbol, is_gas, is_precipitate, sort_order)
           VALUES (?,?,?,?,?,?,?,?)`,
          [
            u.id,
            sp.role,
            sp.formula,
            sp.coefficient ?? 1,
            sp.stateSymbol || null,
            sp.isGas ? 1 : 0,
            sp.isPrecipitate ? 1 : 0,
            sp.sortOrder ?? 0,
          ],
        )
      }
      await conn.query(`DELETE FROM chem_reaction_tags WHERE reaction_id=?`, [u.id])
      for (const tag of d.tags || []) {
        await conn.query(
          `INSERT INTO chem_reaction_tags (reaction_id, tag) VALUES (?,?)`,
          [u.id, tag],
        )
      }
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
    } else if (u.type === 'concept') {
      await conn.query(
        `UPDATE chem_concepts SET
          name=?, definition=?, principle=?, applicable_conditions=?, judge_methods=?,
          examples=?, common_mistakes=?, review_note=?, updated_at=NOW()
         WHERE id=? AND status='pending_review'`,
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
    } else if (u.type === 'question') {
      await conn.query(
        `UPDATE chem_questions SET
          qtype=?, stem=?, options_json=?, answer=?, analysis=?, scoring=?,
          difficulty=?, review_note=?, updated_at=NOW()
         WHERE id=? AND status='pending_review'`,
        [
          d.qtype,
          d.stem,
          d.optionsJson != null ? JSON.stringify(d.optionsJson) : null,
          d.answer,
          d.analysis || null,
          d.scoring || null,
          d.difficulty ?? 2,
          clipNote(d.reviewNote || ''),
          u.id,
        ],
      )
    } else {
      throw new Error('unexpected type ' + u.type)
    }

    const specialtyIds = u.specialtyCodes.map((c) => specMap.get(c)).filter(Boolean)
    const categoryIds = u.categoryCodes.map((c) => catMap.get(c)).filter(Boolean)
    const unresolvedSpec = u.specialtyCodes.filter((c) => !specMap.get(c))
    const unresolvedCat = u.categoryCodes.filter((c) => !catMap.get(c))
    if (unresolvedSpec.length || unresolvedCat.length) {
      linkUnresolved.push({ code: u.code, unresolvedSpec, unresolvedCat })
    }

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
  }

  // verify P0 + link samples
  const samples = {}
  for (const code of ['rxn.C2H5OH_O2', 'rxn.C2H5OH_burn', 'rxn.C2H4_KMnO4', 'kp.energy.galvanic']) {
    const u = updates.find((x) => x.code === code)
    if (!u) continue
    if (u.type === 'reaction') {
      const [r] = await conn.query(
        `SELECT ox_product, re_product, oxidant, reductant, conditions, LEFT(principle,120) principle FROM chem_reactions WHERE id=?`,
        [u.id],
      )
      samples[code] = r[0]
    } else {
      const [r] = await conn.query(
        `SELECT LEFT(description,100) d, review_note FROM chem_knowledge_points WHERE id=?`,
        [u.id],
      )
      samples[code] = r[0]
    }
    const [cats] = await conn.query(
      `SELECT GROUP_CONCAT(CONCAT(s.code,'.',c.code) ORDER BY s.code,c.code) AS cats
       FROM chem_entity_categories ec
       JOIN chem_categories c ON c.id=ec.category_id
       JOIN chem_specialties s ON s.id=c.specialty_id
       WHERE ec.entity_type=? AND ec.entity_id=?`,
      [u.type, u.id],
    )
    const [specs] = await conn.query(
      `SELECT GROUP_CONCAT(s.code ORDER BY s.code) AS specs
       FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type=? AND es.entity_id=?`,
      [u.type, u.id],
    )
    samples[code + '_links'] = { cats: cats[0]?.cats, specs: specs[0]?.specs }
  }

  // prior batches untouched
  const [b5] = await conn.query(
    `SELECT id, status FROM chem_experiments WHERE review_note LIKE '%[inv:exp.instrument_basic]%' LIMIT 1`,
  )
  const [b4] = await conn.query(
    `SELECT id, status FROM chem_substances WHERE review_note LIKE '%[inv:sub.Cl2]%' LIMIT 1`,
  )
  const [na] = await conn.query(
    `SELECT id, status, LEFT(stem,40) stem, answer, review_note FROM chem_questions WHERE id=1`,
  )

  const result = {
    appliedAt: new Date().toISOString(),
    appliedCount: applied.length,
    linkUnresolved,
    samples,
    priorOk: !!(b5[0] && b4[0]),
    naWaterUnchanged: na[0],
  }
  fs.writeFileSync(
    path.join(OUT, 'after_b6_remediate.json'),
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(
    JSON.stringify(
      {
        appliedCount: result.appliedCount,
        linkUnresolved: result.linkUnresolved,
        samples: {
          O2: samples['rxn.C2H5OH_O2'],
          burn: samples['rxn.C2H5OH_burn'],
          O2_links: samples['rxn.C2H5OH_O2_links'],
          galvanic_links: samples['kp.energy.galvanic_links'],
        },
        priorOk: result.priorOk,
        naStatus: na[0]?.status,
        naStem: na[0]?.stem,
      },
      null,
      2,
    ),
  )
  await conn.end()
  if (linkUnresolved.length) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
