/**
 * Post-trial verification (read-mostly; optional session smoke for admin logic).
 *   node docs/chemistry_trial_restore/verify_trial.js
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

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
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

  const whitelist = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'publish_whitelist.json'), 'utf8'),
  )
  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const verifyCodes = []
  for (const b of inv.batches || []) {
    for (const it of b.items || []) {
      if (it.verifyNeeded) verifyCodes.push(it.code)
    }
  }

  const latest = fs
    .readFileSync(path.join(__dirname, 'LATEST_SNAPSHOT.txt'), 'utf8')
    .trim()
  const pubSnap = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, latest, 'published_19_snapshot.json'),
      'utf8',
    ),
  )

  let trialPub = 0
  let studentVisiblePub = 0
  const trialIds = new Set()
  for (const [type, table] of Object.entries(KB_TABLES)) {
    const [rows] = await conn.query(
      `SELECT id, status, review_note FROM ${table} WHERE status='published'`,
    )
    for (const r of rows) {
      const note = String(r.review_note || '')
      if (note.includes('[ai_trial]')) {
        trialPub += 1
        trialIds.add(`${type}:${r.id}`)
      } else {
        studentVisiblePub += 1
      }
    }
  }

  // whitelist all tagged?
  let whitelistOk = 0
  let whitelistMiss = []
  for (const w of whitelist.items || []) {
    const table = KB_TABLES[w.type]
    const [rows] = await conn.query(
      `SELECT status, review_note FROM ${table} WHERE id=?`,
      [w.dbId],
    )
    const r = rows[0]
    if (
      r &&
      r.status === 'published' &&
      String(r.review_note).includes('[ai_trial]')
    ) {
      whitelistOk += 1
    } else {
      whitelistMiss.push(w.code)
    }
  }

  // verifyNeeded not trial-published
  const pending = JSON.parse(
    fs.readFileSync(path.join(AUDIT, 'pending_review_all.json'), 'utf8'),
  )
  const pendingByCode = new Map((pending.items || []).map((i) => [i.code, i]))
  let verifyLeaked = []
  for (const code of verifyCodes) {
    const it = pendingByCode.get(code)
    if (!it) continue
    const table = KB_TABLES[it.type]
    if (!table) continue
    const [rows] = await conn.query(
      `SELECT status, review_note FROM ${table} WHERE id=?`,
      [it.dbId],
    )
    const r = rows[0]
    if (r && r.status === 'published' && String(r.review_note).includes('[ai_trial]')) {
      verifyLeaked.push(code)
    }
  }

  // original 19 body unchanged: compare status snapshot review notes without requiring equal if we didn't touch them
  let orig19Intact = 0
  let orig19Changed = []
  for (const p of pubSnap.items || []) {
    const table = KB_TABLES[p.type]
    const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [p.id])
    const now = rows[0]
    const before = p.row
    if (!now || !before) {
      orig19Changed.push(`${p.type}:${p.id}:missing`)
      continue
    }
    // scientific fields: compare JSON minus status/review_note/updated_at
    const strip = (o) => {
      const x = { ...o }
      delete x.status
      delete x.review_note
      delete x.updated_at
      delete x.updatedAt
      return JSON.stringify(x)
    }
    if (strip(now) === strip(before) && !String(now.review_note || '').includes('[ai_trial]')) {
      orig19Intact += 1
    } else if (String(now.review_note || '').includes('[ai_trial]')) {
      orig19Changed.push(`${p.type}:${p.id}:got_ai_trial_tag`)
    } else if (strip(now) !== strip(before)) {
      orig19Changed.push(`${p.type}:${p.id}:body_diff`)
    } else {
      orig19Intact += 1
    }
  }

  const [trialItems] = await conn.query(
    `SELECT id, code, qtype, pool, status, stem, answer, specialty_id, category_id
     FROM chem_train_items WHERE code LIKE 'train.ai_trial.%'`,
  )
  const [oldTest] = await conn.query(
    `SELECT COUNT(*) AS c FROM chem_train_items WHERE code LIKE 'train.test.%'`,
  )
  const [formalApproved] = await conn.query(
    `SELECT COUNT(*) AS c FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )

  const byQ = { single: 0, judge: 0, blank: 0 }
  for (const t of trialItems) byQ[t.qtype] = (byQ[t.qtype] || 0) + 1

  const [specRows] = await conn.query(
    `SELECT DISTINCT s.code FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     WHERE i.code LIKE 'train.ai_trial.%'`,
  )
  const [catRows] = await conn.query(
    `SELECT DISTINCT CONCAT(s.code,'.',c.code) AS code FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.code LIKE 'train.ai_trial.%'`,
  )

  // student isolation: formal availability should not include trial items
  const studentSeesTrialItems = trialItems.some((t) => t.pool === 'formal')

  // answer leak check: session create API returns answers? — static check of service not here;
  // ensure stems don't contain answer key pattern for blanks awkwardly
  const answerInStem = trialItems.filter(
    (t) => t.qtype === 'blank' && t.stem.includes(t.answer) && t.answer.length > 1,
  ).length

  // DB session smoke: pick a specialty with trial items, create ephemeral? skip write — use count only
  const adminFlowReady =
    trialItems.length >= 30 &&
    trialItems.every((t) => t.pool === 'test' && t.status === 'approved') &&
    !studentSeesTrialItems &&
    Number(formalApproved[0].c) === 0

  await conn.end()

  const result = {
    verifiedAt: new Date().toISOString(),
    backupLatest: latest,
    whitelistCount: (whitelist.items || []).length,
    whitelistTrialPublished: whitelistOk,
    whitelistMiss,
    trialPublishedTagged: trialPub,
    studentVisiblePublished: studentVisiblePub,
    verifyNeededCount: verifyCodes.length,
    verifyNeededLeakedToTrial: verifyLeaked,
    originalPublishedSnapshot: pubSnap.count,
    original19BodyIntact: orig19Intact,
    original19Issues: orig19Changed,
    trialQuestions: trialItems.length,
    byQtype: byQ,
    specialtiesCovered: specRows.map((r) => r.code),
    categoriesCovered: catRows.map((r) => r.code),
    oldTestSeeds: Number(oldTest[0].c),
    formalApproved: Number(formalApproved[0].c),
    studentSeesTrialItems,
    blankAnswerAppearsInStem: answerInStem,
    checks: {
      backupReadable: fs.existsSync(path.join(__dirname, latest, 'manifest.json')),
      publish239: whitelistOk === 239 && trialPub === 239,
      verifyUntouched: verifyLeaked.length === 0,
      orig19Ok: orig19Changed.length === 0 && orig19Intact === pubSnap.count,
      studentIsolationKb: studentVisiblePub === pubSnap.count,
      studentIsolationTrain: !studentSeesTrialItems && Number(formalApproved[0].c) === 0,
      adminFlowReady,
    },
  }

  fs.writeFileSync(
    path.join(__dirname, 'verify_result.json'),
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(JSON.stringify(result, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
