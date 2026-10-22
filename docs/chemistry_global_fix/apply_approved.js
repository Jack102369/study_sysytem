/**
 * Global fix ROUND-1 — APPLY (approved whitelist only)
 *
 * Excludes: add_redox for rxn.C2H4_KMnO4
 *
 *   node docs/chemistry_global_fix/apply_approved.js           # precheck only
 *   node docs/chemistry_global_fix/apply_approved.js --apply   # write DB + sync files
 */
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const APPLY = process.argv.includes('--apply')

const TABLE = {
  element: 'chem_elements',
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
}

const EXCLUDED_KINDS = new Set(['add_redox_specialty'])
const EXCLUDED_CODES = new Set(['rxn.C2H4_KMnO4']) // no new redox this round

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function sameArr(a, b) {
  const x = [...(a || [])].map(String).sort()
  const y = [...(b || [])].map(String).sort()
  return JSON.stringify(x) === JSON.stringify(y)
}

function stop(msg, details) {
  console.error('STOP:', msg)
  if (details) console.error(JSON.stringify(details, null, 2))
  const fail = { stoppedAt: new Date().toISOString(), reason: msg, details }
  fs.writeFileSync(path.join(OUT, 'apply_aborted.json'), JSON.stringify(fail, null, 2) + '\n')
  process.exit(2)
}

async function main() {
  const backup = JSON.parse(
    fs.readFileSync(path.join(OUT, 'backup_before_global_fix.json'), 'utf8'),
  )
  const plan = JSON.parse(fs.readFileSync(path.join(OUT, 'dry_run_plan.json'), 'utf8'))

  const approved = plan.proposed.filter(
    (p) => !EXCLUDED_KINDS.has(p.kind) && !EXCLUDED_CODES.has(p.code),
  )
  if (approved.some((p) => p.kind === 'add_redox_specialty')) {
    stop('safety: add_redox still in approved set')
  }
  if (approved.some((p) => p.code === 'rxn.C2H4_KMnO4')) {
    stop('safety: C2H4_KMnO4 must not be modified this round')
  }
  if (approved.some((p) => p.status === 'published')) {
    stop('safety: approved set touches published')
  }

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

  // —— Precheck 1: 377 codes exist ——
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const invCodes = inv.batches.flatMap((b) => b.items.map((i) => i.code))
  if (invCodes.length !== 377) stop('inventory code count != 377', { n: invCodes.length })
  if (new Set(invCodes).size !== 377) stop('duplicate inventory codes')
  if (backup.entities.length !== 377) stop('backup entities != 377')

  // —— Precheck 2: published count & list ——
  const backupPublished = backup.entities.filter((e) => e.status === 'published')
  if (backupPublished.length !== 19) {
    stop('backup published != 19', { n: backupPublished.length })
  }

  // —— Precheck 3: backup vs live DB for all backup entities ——
  const mismatches = []
  let livePublished = 0
  for (const ent of backup.entities) {
    if (!ent.dbId || !ent.row) {
      mismatches.push({ code: ent.code, err: 'backup missing row' })
      continue
    }
    const table = TABLE[ent.type]
    const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [ent.dbId])
    const live = rows[0]
    if (!live) {
      mismatches.push({ code: ent.code, err: 'row missing in live DB' })
      continue
    }
    if (live.status === 'published') livePublished++
    if (String(live.status) !== String(ent.status)) {
      mismatches.push({
        code: ent.code,
        err: 'status changed',
        backup: ent.status,
        live: live.status,
      })
    }
    if (String(live.review_note || '') !== String(ent.review_note || '')) {
      mismatches.push({
        code: ent.code,
        err: 'review_note changed',
        backup: ent.review_note,
        live: live.review_note,
      })
    }
    // specialty links
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type=? AND es.entity_id=?`,
      [ent.type, ent.dbId],
    )
    const [cats] = await conn.query(
      `SELECT CONCAT(sp.code,'.',c.code) AS code FROM chem_entity_categories ec
       JOIN chem_categories c ON c.id=ec.category_id
       JOIN chem_specialties sp ON sp.id=c.specialty_id
       WHERE ec.entity_type=? AND ec.entity_id=?`,
      [ent.type, ent.dbId],
    )
    const liveSpecs = specs.map((r) => r.code)
    const liveCats = cats.map((r) => r.code)
    if (!sameArr(liveSpecs, ent.specialtyCodes)) {
      mismatches.push({
        code: ent.code,
        err: 'specialty links changed',
        backup: ent.specialtyCodes,
        live: liveSpecs,
      })
    }
    if (!sameArr(liveCats, ent.categoryCodes)) {
      mismatches.push({
        code: ent.code,
        err: 'category links changed',
        backup: ent.categoryCodes,
        live: liveCats,
      })
    }
  }
  if (livePublished !== 19) {
    stop('live published count != 19', { livePublished })
  }
  if (mismatches.length) {
    stop('live DB diverged from dry-run backup', { count: mismatches.length, sample: mismatches.slice(0, 20) })
  }

  // —— Precheck 4: whitelist before-state still matches ——
  for (const p of approved) {
    const ent = backup.entities.find((e) => e.code === p.code)
    if (!ent) stop('approved code missing from backup', { code: p.code })
    if (ent.status === 'published') stop('approved code is published', { code: p.code })
    if (String(ent.dbId) !== String(p.dbId)) {
      stop('dbId mismatch vs plan', { code: p.code, plan: p.dbId, backup: ent.dbId })
    }
    if (p.kind === 'remove_redox_specialty') {
      if (!ent.specialtyCodes.includes('redox')) {
        stop('expected redox link missing before apply', { code: p.code })
      }
      if (!sameArr(ent.specialtyCodes, p.before.specialtyCodes)) {
        stop('before specialty mismatch', { code: p.code })
      }
    }
    if (p.kind === 'append_inv_tag' || p.kind === 'append_train_limit_note' || p.kind === 'append_verify_train_limit') {
      if (String(ent.review_note) !== String(p.before.review_note)) {
        stop('before review_note mismatch', {
          code: p.code,
          backup: ent.review_note,
          plan: p.before.review_note,
        })
      }
    }
  }

  // —— Precheck 5: C2H4_KMnO4 still without redox ——
  const km = backup.entities.find((e) => e.code === 'rxn.C2H4_KMnO4')
  if (km?.specialtyCodes?.includes('redox')) {
    stop('unexpected: C2H4_KMnO4 already has redox')
  }

  // —— Precheck 6: verifyNeeded still 23 ——
  const vn = backup.entities.filter((e) => e.verifyNeeded).length
  if (vn !== 23) stop('verifyNeeded count != 23 in backup', { vn })

  console.log('PRECHECK OK', {
    entities: 377,
    published: 19,
    verifyNeeded: 23,
    approvedOps: approved.length,
    approvedCodes: [...new Set(approved.map((p) => p.code))].length,
    excluded: ['rxn.C2H4_KMnO4 add_redox'],
    apply: APPLY,
  })

  if (!APPLY) {
    fs.writeFileSync(
      path.join(OUT, 'apply_precheck_ok.json'),
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          apply: false,
          approvedOps: approved.length,
          approvedCodes: [...new Set(approved.map((p) => p.code))],
        },
        null,
        2,
      ) + '\n',
    )
    await conn.end()
    console.log('Dry precheck only. Re-run with --apply to write.')
    return
  }

  // —— APPLY ——
  const results = []
  await conn.beginTransaction()
  try {
    for (const p of approved) {
      if (p.kind === 'remove_redox_specialty') {
        for (const op of p.dbOps) {
          if (op.op === 'DELETE' && op.table === 'chem_entity_specialties') {
            const [r] = await conn.query(
              `DELETE FROM chem_entity_specialties
               WHERE entity_type=? AND entity_id=? AND specialty_id=?`,
              [op.where.entity_type, op.where.entity_id, op.where.specialty_id],
            )
            if (r.affectedRows !== 1) {
              throw new Error(`specialty delete affected ${r.affectedRows} for ${p.code}`)
            }
          } else if (op.op === 'DELETE' && op.table === 'chem_entity_categories') {
            const [r] = await conn.query(
              `DELETE FROM chem_entity_categories
               WHERE entity_type=? AND entity_id=? AND category_id=?`,
              [op.where.entity_type, op.where.entity_id, op.where.category_id],
            )
            if (r.affectedRows !== 1) {
              throw new Error(`category delete affected ${r.affectedRows} for ${p.code}`)
            }
          } else {
            throw new Error(`unexpected dbOp for ${p.code}`)
          }
        }
        // verify remaining specialties
        const [specs] = await conn.query(
          `SELECT s.code FROM chem_entity_specialties es
           JOIN chem_specialties s ON s.id=es.specialty_id
           WHERE es.entity_type='reaction' AND es.entity_id=?`,
          [p.dbId],
        )
        const got = specs.map((s) => s.code).sort()
        const expect = [...p.after.specialtyCodes].sort()
        if (JSON.stringify(got) !== JSON.stringify(expect)) {
          throw new Error(`post specialty mismatch ${p.code}: ${got} vs ${expect}`)
        }
        // ensure status/equation unchanged
        const [rx] = await conn.query(
          `SELECT status, canonical_equation, equation, review_note FROM chem_reactions WHERE id=?`,
          [p.dbId],
        )
        if (rx[0].status !== 'pending_review') throw new Error(`status changed ${p.code}`)
        if (rx[0].review_note !== p.before.review_note) {
          throw new Error(`review_note unexpectedly changed ${p.code}`)
        }
        results.push({ code: p.code, kind: p.kind, ok: true })
      } else if (
        p.kind === 'append_inv_tag' ||
        p.kind === 'append_train_limit_note' ||
        p.kind === 'append_verify_train_limit'
      ) {
        const table = TABLE[p.type]
        const [r] = await conn.query(
          `UPDATE ${table} SET review_note=? WHERE id=? AND status='pending_review'`,
          [p.after.review_note, p.dbId],
        )
        if (r.affectedRows !== 1) {
          throw new Error(`review_note update affected ${r.affectedRows} for ${p.code}`)
        }
        // ensure no other columns for questions
        if (p.type === 'question') {
          const [q] = await conn.query(
            `SELECT stem, answer, status FROM chem_questions WHERE id=?`,
            [p.dbId],
          )
          const bak = backup.entities.find((e) => e.code === p.code)
          if (q[0].stem !== bak.row.stem || q[0].answer !== bak.row.answer) {
            throw new Error(`question stem/answer changed ${p.code}`)
          }
          if (q[0].status !== 'pending_review') throw new Error(`q status ${p.code}`)
        }
        results.push({ code: p.code, kind: p.kind, ok: true })
      } else if (p.kind === 'inventory_specialty_align_to_db') {
        // DB unchanged by design
        results.push({ code: p.code, kind: p.kind, ok: true, dbSkipped: true })
      } else {
        throw new Error(`unapproved kind ${p.kind}`)
      }
    }

    // published fingerprint unchanged
    for (const ent of backupPublished) {
      const table = TABLE[ent.type]
      const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [ent.dbId])
      const live = rows[0]
      if (!live || live.status !== 'published') throw new Error(`published lost ${ent.code}`)
      if (String(live.review_note || '') !== String(ent.review_note || '')) {
        throw new Error(`published review_note changed ${ent.code}`)
      }
      if (ent.type === 'question') {
        if (live.stem !== ent.row.stem || live.answer !== ent.row.answer) {
          throw new Error(`published question body changed ${ent.code}`)
        }
      }
      const [specs] = await conn.query(
        `SELECT s.code FROM chem_entity_specialties es
         JOIN chem_specialties s ON s.id=es.specialty_id
         WHERE es.entity_type=? AND es.entity_id=?`,
        [ent.type, ent.dbId],
      )
      if (!sameArr(specs.map((s) => s.code), ent.specialtyCodes)) {
        throw new Error(`published specialty changed ${ent.code}`)
      }
    }

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    await conn.end()
    stop('apply transaction rolled back', { message: e.message })
  }

  // —— Sync inventory ——
  const invPath = path.join(ROOT, 'docs/chemistry_kb_inventory.json')
  const invObj = JSON.parse(fs.readFileSync(invPath, 'utf8'))
  const invByCode = new Map()
  for (const b of invObj.batches) {
    for (const it of b.items) invByCode.set(it.code, it)
  }
  const invChanges = []
  for (const p of approved) {
    const it = invByCode.get(p.code)
    if (!it) throw new Error('inventory missing ' + p.code)
    if (p.kind === 'remove_redox_specialty') {
      const before = {
        specialtyCodes: [...(it.specialtyCodes || [])],
        categoryCodes: [...(it.categoryCodes || [])],
      }
      it.specialtyCodes = (it.specialtyCodes || []).filter((s) => s !== 'redox')
      it.categoryCodes = (it.categoryCodes || []).filter((c) => !c.startsWith('redox.'))
      invChanges.push({ code: p.code, before, after: { specialtyCodes: it.specialtyCodes, categoryCodes: it.categoryCodes } })
    } else if (p.kind === 'inventory_specialty_align_to_db') {
      const before = { specialtyCodes: [...(it.specialtyCodes || [])] }
      it.specialtyCodes = [...p.after.inventorySpecialtyCodes]
      invChanges.push({ code: p.code, before, after: { specialtyCodes: it.specialtyCodes } })
    }
  }
  if (invObj.batches.flatMap((b) => b.items).length !== 377) {
    stop('inventory count broken after sync')
  }
  fs.writeFileSync(invPath, JSON.stringify(invObj, null, 2) + '\n')

  // —— Sync import packs ——
  const packChanges = []

  function syncPackFile(filePath, mutator) {
    const j = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const changed = mutator(j)
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(j, null, 2) + '\n')
      packChanges.push({ file: path.relative(ROOT, filePath), details: changed })
    }
  }

  // B3-B: remove redox from 10 reactions
  syncPackFile(path.join(ROOT, 'docs/chemistry_batch3/import_B3-B.json'), (j) => {
    const codes = approved.filter((p) => p.kind === 'remove_redox_specialty').map((p) => p.code)
    const details = []
    for (const code of codes) {
      if (j.meta.specialtyByCode?.[code]) {
        j.meta.specialtyByCode[code] = j.meta.specialtyByCode[code].filter((s) => s !== 'redox')
      }
      if (j.meta.categoryByCode?.[code]) {
        j.meta.categoryByCode[code] = j.meta.categoryByCode[code].filter(
          (c) => !String(c).startsWith('redox.'),
        )
      }
      const idx = (j.meta.inventoryCodes || []).indexOf(code)
      if (idx >= 0 && j.items[idx]?.data) {
        // trainTypes should not list redox.identify for these
        if (j.items[idx].data.trainTypes) {
          j.items[idx].data.trainTypes = String(j.items[idx].data.trainTypes)
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s && !s.startsWith('redox.'))
            .join(',')
        }
      }
      details.push(code)
    }
    return details
  })

  // B2-D: inventory-align specialties in meta if present
  syncPackFile(path.join(ROOT, 'docs/chemistry_batch2/import_B2-D.json'), (j) => {
    const details = []
    for (const p of approved.filter((x) => x.kind === 'inventory_specialty_align_to_db')) {
      if (j.meta.specialtyByCode?.[p.code]) {
        j.meta.specialtyByCode[p.code] = [...p.after.inventorySpecialtyCodes]
        details.push(p.code)
      }
      // also item-level specialtyCodes if any
      const idx = (j.meta.inventoryCodes || []).indexOf(p.code)
      if (idx >= 0 && j.items[idx]?.data?.specialtyCodes) {
        j.items[idx].data.specialtyCodes = [...p.after.inventorySpecialtyCodes]
      }
    }
    return details.length ? details : null
  })

  // B2-A: sync element reviewNote to after (with [inv:])
  syncPackFile(path.join(ROOT, 'docs/chemistry_batch2/import_B2-A.json'), (j) => {
    const details = []
    for (const p of approved.filter((x) => x.kind === 'append_inv_tag')) {
      const idx = (j.meta.inventoryCodes || []).indexOf(p.code)
      if (idx < 0) continue
      const data = j.items[idx].data
      // Prefer clean [inv:CODE] without duplicating old [el.X] if pack already clean
      const clean = p.after.review_note.replace(`[inv:${p.code}] [el.${p.code.replace(/^el\./, '')}]`, `[inv:${p.code}]`)
      // Actually use after as-is for DB consistency; but if pack already has inv, keep pack structure with train content
      let next = p.after.review_note
      if (data.reviewNote && /^\[inv:/.test(data.reviewNote) && !/\[inv:.*\[el\./.test(data.reviewNote)) {
        // pack already correct form — keep pack text (already has inv), DB has duplicate form from plan
        // For consistency with DB after apply, write DB value into pack
        next = p.after.review_note
      }
      data.reviewNote = next
      details.push(p.code)
    }
    return details.length ? details : null
  })

  // B5-D + B6-F: question trainLimit notes
  for (const rel of [
    'docs/chemistry_batch5/import_B5-D.json',
    'docs/chemistry_batch6/import_B6-F.json',
  ]) {
    syncPackFile(path.join(ROOT, rel), (j) => {
      const details = []
      for (const p of approved.filter((x) => x.kind === 'append_train_limit_note')) {
        const idx = (j.meta.inventoryCodes || []).indexOf(p.code)
        if (idx < 0) continue
        j.items[idx].data.reviewNote = p.after.review_note
        details.push(p.code)
      }
      return details.length ? details : null
    })
  }

  // B3-C: exp.Fe3_SCN
  syncPackFile(path.join(ROOT, 'docs/chemistry_batch3/import_B3-C.json'), (j) => {
    const p = approved.find((x) => x.code === 'exp.Fe3_SCN')
    if (!p) return null
    const idx = (j.meta.inventoryCodes || []).indexOf('exp.Fe3_SCN')
    if (idx < 0) return null
    j.items[idx].data.reviewNote = p.after.review_note
    return ['exp.Fe3_SCN']
  })

  // —— Post-verify from DB ——
  const post = {
    verifiedAt: new Date().toISOString(),
    checks: {},
  }

  // 10 redox gone
  for (const p of approved.filter((x) => x.kind === 'remove_redox_specialty')) {
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type='reaction' AND es.entity_id=?`,
      [p.dbId],
    )
    const codes = specs.map((s) => s.code)
    if (codes.includes('redox')) throw new Error('redox still present ' + p.code)
    const [cats] = await conn.query(
      `SELECT CONCAT(sp.code,'.',c.code) AS code FROM chem_entity_categories ec
       JOIN chem_categories c ON c.id=ec.category_id
       JOIN chem_specialties sp ON sp.id=c.specialty_id
       WHERE ec.entity_type='reaction' AND ec.entity_id=?`,
      [p.dbId],
    )
    if (cats.some((c) => String(c.code).startsWith('redox.'))) {
      throw new Error('redox cat still present ' + p.code)
    }
  }
  post.checks.redoxRemoved = 10

  // C2H4_KMnO4 no redox
  {
    const ent = backup.entities.find((e) => e.code === 'rxn.C2H4_KMnO4')
    const [specs] = await conn.query(
      `SELECT s.code FROM chem_entity_specialties es
       JOIN chem_specialties s ON s.id=es.specialty_id
       WHERE es.entity_type='reaction' AND es.entity_id=?`,
      [ent.dbId],
    )
    if (specs.some((s) => s.code === 'redox')) throw new Error('C2H4_KMnO4 gained redox')
    post.checks.c2h4NoRedox = true
  }

  // inv tags
  for (const p of approved.filter((x) => x.kind === 'append_inv_tag')) {
    const [rows] = await conn.query(`SELECT review_note, status FROM chem_elements WHERE id=?`, [
      p.dbId,
    ])
    if (!rows[0].review_note.includes(`[inv:${p.code}]`)) {
      throw new Error('inv tag missing ' + p.code)
    }
    if (rows[0].status !== 'pending_review') throw new Error('el status ' + p.code)
  }
  post.checks.invTags = 5

  // questions
  for (const p of approved.filter((x) => x.kind === 'append_train_limit_note')) {
    const [rows] = await conn.query(
      `SELECT review_note, status, stem, answer FROM chem_questions WHERE id=?`,
      [p.dbId],
    )
    if (!/trainLimit:/.test(rows[0].review_note)) throw new Error('trainLimit missing ' + p.code)
    if (rows[0].status !== 'pending_review') throw new Error('q status ' + p.code)
    const bak = backup.entities.find((e) => e.code === p.code)
    if (rows[0].stem !== bak.row.stem || rows[0].answer !== bak.row.answer) {
      throw new Error('q body changed ' + p.code)
    }
  }
  post.checks.questionLimits = 17

  // Fe3_SCN
  {
    const p = approved.find((x) => x.code === 'exp.Fe3_SCN')
    const [rows] = await conn.query(`SELECT review_note, status FROM chem_experiments WHERE id=?`, [
      p.dbId,
    ])
    if (!/待核实|excludeDefaultUntilVerified/.test(rows[0].review_note)) {
      throw new Error('Fe3_SCN limit missing')
    }
    if (rows[0].status !== 'pending_review') throw new Error('Fe3 status')
    post.checks.fe3Limit = true
  }

  // inventory verifyNeeded still 23
  const inv2 = JSON.parse(fs.readFileSync(invPath, 'utf8'))
  const vn2 = inv2.batches.flatMap((b) => b.items).filter((i) => i.verifyNeeded).length
  if (vn2 !== 23) throw new Error('verifyNeeded lost: ' + vn2)
  if (inv2.batches.flatMap((b) => b.items).length !== 377) throw new Error('inv size')
  post.checks.verifyNeeded = 23
  post.checks.inventoryTotal = 377

  // published still 19 untouched
  let pub = 0
  for (const ent of backupPublished) {
    const [rows] = await conn.query(`SELECT status FROM ${TABLE[ent.type]} WHERE id=?`, [ent.dbId])
    if (rows[0].status === 'published') pub++
  }
  if (pub !== 19) throw new Error('published count ' + pub)
  post.checks.published = 19

  // inventory specialty for 3 kp
  for (const p of approved.filter((x) => x.kind === 'inventory_specialty_align_to_db')) {
    const it = inv2.batches.flatMap((b) => b.items).find((i) => i.code === p.code)
    if ((it.specialtyCodes || []).includes('ion')) throw new Error('ion still in inv ' + p.code)
    if (!sameArr(it.specialtyCodes, p.after.inventorySpecialtyCodes)) {
      throw new Error('inv specs ' + p.code)
    }
  }
  post.checks.inventoryIonFixed = 3

  await conn.end()

  const summary = {
    appliedAt: new Date().toISOString(),
    dryRunDiff: {
      excluded: [{ code: 'rxn.C2H4_KMnO4', kind: 'add_redox_specialty', reason: '用户明确不批准本轮新增' }],
      dryRunProposedCodes: 37,
      appliedCodes: [...new Set(approved.map((p) => p.code))].length,
    },
    stats: {
      modifiedKnowledgeCodes: [...new Set(approved.map((p) => p.code))].length,
      removeRedox: approved.filter((p) => p.kind === 'remove_redox_specialty').length,
      otherLinkFixes: approved.filter((p) => p.kind === 'inventory_specialty_align_to_db').length,
      invTags: approved.filter((p) => p.kind === 'append_inv_tag').length,
      questionLimits: approved.filter((p) => p.kind === 'append_train_limit_note').length,
      expLimit: approved.filter((p) => p.kind === 'append_verify_train_limit').length,
      dbWriteOps: approved.filter((p) => p.kind !== 'inventory_specialty_align_to_db').length,
    },
    results,
    invChanges,
    packChanges,
    post,
    rollback: {
      backup: 'docs/chemistry_global_fix/backup_before_global_fix.json',
      inventoryBackup: 'docs/chemistry_global_fix/backup_inventory_before.json',
      importPackBackup: 'docs/chemistry_global_fix/backup_import_packs/',
      method:
        '用 backup specialtyLinks/categoryLinks 恢复 DELETE 的关联；用 backup.entities[].review_note 恢复 UPDATE；用 backup_inventory_before.json 与 backup_import_packs 覆盖还原文件。',
    },
  }

  fs.writeFileSync(path.join(OUT, 'apply_result.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify(summary.stats, null, 2))
  console.log('APPLY OK → docs/chemistry_global_fix/apply_result.json')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
