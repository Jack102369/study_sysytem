/**
 * Batch5 quality remediation: backup → update DB from import packs + specialty links.
 * Usage:
 *   node docs/chemistry_batch5_quality_fix/b5_remediate.js
 *   node docs/chemistry_batch5_quality_fix/b5_remediate.js --apply
 */
'use strict'
const fs = require('fs')
const path = require('path')

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const B5 = path.join(ROOT, 'docs/chemistry_batch5')

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
    fs.readFileSync(path.join(B5, 'import_all_results.json'), 'utf8'),
  ).codeToEntity

  const packs = ['B5-A', 'B5-B', 'B5-C', 'B5-D', 'B5-E'].map((p) =>
    JSON.parse(fs.readFileSync(path.join(B5, `import_${p}.json`), 'utf8')),
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
  if (updates.length !== 42) throw new Error('expected 42, got ' + updates.length)

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

  const backup = {
    backedUpAt: new Date().toISOString(),
    apply: APPLY,
    rows: {},
    links: {},
  }
  for (const u of updates) {
    const table =
      u.type === 'experiment'
        ? 'chem_experiments'
        : u.type === 'formula'
          ? 'chem_formulas'
          : u.type === 'knowledge'
            ? 'chem_knowledge_points'
            : u.type === 'question'
              ? 'chem_questions'
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
      ? 'backup_before_b5_remediate_apply.json'
      : 'backup_before_b5_remediate_dryrun.json',
  )
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8')
  fs.writeFileSync(
    path.join(OUT, 'backup_before_b5_remediate.json'),
    JSON.stringify(backup, null, 2),
    'utf8',
  )

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
          sample: {
            ion: updates.find((x) => x.code === 'formula.ion_conc')
              ?.categoryCodes,
            error: String(
              updates.find((x) => x.code === 'kp.exp.error')?.data
                ?.description || '',
            ).slice(0, 80),
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
    console.error('Refusing: non-pending_review', statusIssues)
    await conn.end()
    process.exit(1)
  }

  const applied = []
  const linkUnresolved = []

  for (const u of updates) {
    const d = u.data
    if (u.type === 'experiment') {
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
    } else if (u.type === 'formula') {
      await conn.query(
        `UPDATE chem_formulas SET
          name=?, expression=?, variables=?, units=?, applicable_conditions=?,
          examples=?, common_mistakes=?, review_note=?, updated_at=NOW()
         WHERE id=? AND status='pending_review'`,
        [
          d.name,
          d.expression,
          d.variables || null,
          d.units || '',
          d.applicableConditions || null,
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
    } else {
      throw new Error('unexpected type ' + u.type)
    }

    const specialtyIds = u.specialtyCodes
      .map((c) => specMap.get(c))
      .filter(Boolean)
    const categoryIds = u.categoryCodes
      .map((c) => catMap.get(c))
      .filter(Boolean)
    const unresolvedSpec = u.specialtyCodes.filter((c) => !specMap.get(c))
    const unresolvedCat = u.categoryCodes.filter((c) => !catMap.get(c))
    if (unresolvedSpec.length || unresolvedCat.length) {
      linkUnresolved.push({
        code: u.code,
        unresolvedSpec,
        unresolvedCat,
      })
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

  // samples
  const samples = {}
  const [err] = await conn.query(
    `SELECT id, LEFT(description,160) AS description, review_note FROM chem_knowledge_points WHERE id=?`,
    [map['kp.exp.error'].id],
  )
  samples.error = err[0]
  const [q] = await conn.query(
    `SELECT id, LEFT(stem,120) AS stem, LEFT(answer,80) AS answer FROM chem_questions WHERE id=?`,
    [map['q.calc.excess'].id],
  )
  samples.excess = q[0]
  const [ion] = await conn.query(
    `SELECT GROUP_CONCAT(CONCAT(s.code,'.',c.code)) AS cats
     FROM chem_entity_categories ec
     JOIN chem_categories c ON c.id=ec.category_id
     JOIN chem_specialties s ON s.id=c.specialty_id
     WHERE ec.entity_type='formula' AND ec.entity_id=?`,
    [map['formula.ion_conc'].id],
  )
  samples.ionCats = ion[0]

  const after = {
    appliedAt: new Date().toISOString(),
    appliedCount: applied.length,
    applied,
    samples,
    linkUnresolved,
  }
  fs.writeFileSync(
    path.join(OUT, 'after_b5_remediate.json'),
    JSON.stringify(after, null, 2),
    'utf8',
  )
  console.log(
    JSON.stringify(
      {
        ok: true,
        applied: applied.length,
        linkUnresolved: linkUnresolved.length,
        samples: {
          errorHasWater: String(samples.error?.description || '').includes(
            '残留',
          ),
          excessStem: String(samples.excess?.stem || '').includes('13.0'),
          ionCats: samples.ionCats?.cats,
        },
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
