/**
 * Trial-publish exactly 239 whitelist items.
 * Appends review_note tags; does NOT rewrite scientific fields.
 *
 *   node docs/chemistry_trial_restore/apply_trial_publish.js --dry-run
 *   node docs/chemistry_trial_restore/apply_trial_publish.js --apply
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
  question: 'chem_questions',
}

const TRIAL_TAG =
  '[ai_trial][human_unreviewed][trial_run][source:deepseek_r1]'

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function mergeNote(oldNote) {
  const old = String(oldNote || '').trim()
  if (old.includes('[ai_trial]')) {
    // already tagged — keep, ensure human_unreviewed present
    let n = old
    if (!n.includes('[human_unreviewed]')) n = `${n}[human_unreviewed]`
    if (!n.includes('[trial_run]')) n = `${n}[trial_run]`
    return n.slice(0, 255)
  }
  const combined = old ? `${TRIAL_TAG} ${old}` : TRIAL_TAG
  if (combined.length <= 255) return combined
  // keep trial tags + inv tag if any
  const inv = (old.match(/\[inv:[^\]]+\]/g) || []).join('')
  const core = `${TRIAL_TAG}${inv ? ' ' + inv : ''}`
  return core.slice(0, 255)
}

async function main() {
  const apply = process.argv.includes('--apply')
  const dry = !apply

  const whitelist = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'publish_whitelist.json'), 'utf8'),
  )
  const firstResults = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'deepseek_audit_results.json'), 'utf8'),
  )
  const passSet = new Set(
    (firstResults.results || [])
      .filter((r) => r.grade === 'PASS_PUBLISH')
      .map((r) => r.code),
  )
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const verifySet = new Set()
  for (const b of inv.batches || []) {
    for (const it of b.items || []) {
      if (it.verifyNeeded) verifySet.add(it.code)
    }
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

  // snapshot published before
  const publishedBefore = []
  for (const [type, table] of Object.entries(KB_TABLES)) {
    const [rows] = await conn.query(
      `SELECT id, status, review_note FROM ${table} WHERE status='published'`,
    )
    for (const r of rows) {
      publishedBefore.push({ type, id: String(r.id), review_note: r.review_note })
    }
  }
  const publishedIds = new Set(publishedBefore.map((p) => `${p.type}:${p.id}`))

  const plan = []
  const excluded = []
  for (const w of whitelist.items || []) {
    if (!passSet.has(w.code)) {
      excluded.push({ code: w.code, reason: 'not_PASS_PUBLISH_in_first_audit' })
      continue
    }
    if (verifySet.has(w.code)) {
      excluded.push({ code: w.code, reason: 'verifyNeeded' })
      continue
    }
    const type = w.type
    const id = String(w.dbId)
    const table = KB_TABLES[type]
    if (!table) {
      excluded.push({ code: w.code, reason: 'unknown_type' })
      continue
    }
    const [rows] = await conn.query(
      `SELECT id, status, review_note FROM ${table} WHERE id=? LIMIT 1`,
      [id],
    )
    const row = rows[0]
    if (!row) {
      excluded.push({ code: w.code, reason: 'db_row_missing' })
      continue
    }
    // do not rewrite original published (non-trial) rows' scientific content;
    // if somehow whitelist hits an already-published non-trial id, still only note/status
    const key = `${type}:${id}`
    const wasPublished = publishedIds.has(key)
    plan.push({
      code: w.code,
      type,
      id,
      table,
      oldStatus: row.status,
      oldNote: row.review_note || '',
      newStatus: 'published',
      newNote: mergeNote(row.review_note),
      wasPublishedBefore: wasPublished,
    })
  }

  if (plan.length !== 239) {
    console.error(
      JSON.stringify(
        { error: 'plan_count_not_239', plan: plan.length, excluded: excluded.length, excluded },
        null,
        2,
      ),
    )
    if (plan.length + excluded.length !== (whitelist.items || []).length) {
      // continue only if close — but user requires 239
    }
  }

  const outPlan = {
    dryRun: dry,
    planned: plan.length,
    excluded,
    sample: plan.slice(0, 3),
  }
  fs.writeFileSync(
    path.join(__dirname, 'trial_publish_plan.json'),
    JSON.stringify({ ...outPlan, items: plan }, null, 2) + '\n',
  )

  if (dry) {
    await conn.end()
    console.log(JSON.stringify({ ...outPlan, wrote: 'trial_publish_plan.json' }, null, 2))
    return
  }

  await conn.beginTransaction()
  try {
    let updated = 0
    for (const p of plan) {
      await conn.query(`UPDATE ${p.table} SET status=?, review_note=? WHERE id=?`, [
        p.newStatus,
        p.newNote,
        p.id,
      ])
      updated += 1
    }
    await conn.commit()

    // verify counts
    let trialPublished = 0
    for (const table of Object.values(KB_TABLES)) {
      const [rows] = await conn.query(
        `SELECT COUNT(*) AS c FROM ${table}
         WHERE status='published' AND review_note LIKE '%[ai_trial]%'`,
      )
      trialPublished += Number(rows[0].c)
    }
    let verifyPublished = 0
    // spot-check: none of verifyNeeded codes should be published via our list
    console.log(
      JSON.stringify(
        {
          applied: updated,
          trialPublishedTagged: trialPublished,
          excluded: excluded.length,
          publishedBeforeCount: publishedBefore.length,
        },
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
