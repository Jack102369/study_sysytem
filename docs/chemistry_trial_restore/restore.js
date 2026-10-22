/**
 * Restore KB status/notes + remove AI trial train items from a snapshot.
 * Does NOT overwrite knowledge scientific body by default (status/review_note only).
 *
 *   node docs/chemistry_trial_restore/restore.js
 *   node docs/chemistry_trial_restore/restore.js --snapshot=snapshot_xxx
 *   node docs/chemistry_trial_restore/restore.js --full-train  (also wipe sessions created after backup)
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname

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

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function resolveSnapshot(arg) {
  if (arg) return path.join(OUT, arg)
  const latest = fs.readFileSync(path.join(OUT, 'LATEST_SNAPSHOT.txt'), 'utf8').trim()
  return path.join(OUT, latest)
}

async function main() {
  const args = process.argv.slice(2)
  let snapName = null
  let fullTrain = false
  for (const a of args) {
    if (a.startsWith('--snapshot=')) snapName = a.slice(11)
    if (a === '--full-train') fullTrain = true
  }
  const dir = resolveSnapshot(snapName)
  if (!fs.existsSync(path.join(dir, 'kb_status_index.json'))) {
    console.error('snapshot missing kb_status_index.json:', dir)
    process.exit(1)
  }

  const statusIndex = JSON.parse(
    fs.readFileSync(path.join(dir, 'kb_status_index.json'), 'utf8'),
  )
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

  await conn.beginTransaction()
  try {
    let restored = 0
    for (const it of statusIndex.items) {
      const table = KB_TABLES[it.type]
      if (!table) continue
      await conn.query(
        `UPDATE ${table} SET status=?, review_note=? WHERE id=?`,
        [it.status, it.review_note || '', it.id],
      )
      restored += 1
    }

    // remove AI trial train items (code prefix train.ai_trial.)
    const [delLinks] = await conn.query(
      `DELETE l FROM chem_train_item_links l
       JOIN chem_train_items i ON i.id=l.item_id
       WHERE i.code LIKE 'train.ai_trial.%'`,
    )
    const [delItems] = await conn.query(
      `DELETE FROM chem_train_items WHERE code LIKE 'train.ai_trial.%'`,
    )

    let sessionNote = 'skipped'
    if (fullTrain) {
      const trainSnap = JSON.parse(fs.readFileSync(path.join(dir, 'train.json'), 'utf8'))
      const keepSessionIds = new Set(
        (trainSnap.chem_train_sessions || []).map((s) => String(s.id)),
      )
      const [sess] = await conn.query(`SELECT id FROM chem_train_sessions`)
      const drop = sess.filter((s) => !keepSessionIds.has(String(s.id))).map((s) => s.id)
      if (drop.length) {
        await conn.query(
          `DELETE FROM chem_train_session_items WHERE session_id IN (?)`,
          [drop],
        )
        await conn.query(`DELETE FROM chem_train_sessions WHERE id IN (?)`, [drop])
      }
      sessionNote = `removed ${drop.length} post-backup sessions`
    }

    await conn.commit()
    console.log(
      JSON.stringify(
        {
          snapshot: path.basename(dir),
          statusRowsRestored: restored,
          deletedTrialItemLinks: delLinks.affectedRows,
          deletedTrialItems: delItems.affectedRows,
          sessions: sessionNote,
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
