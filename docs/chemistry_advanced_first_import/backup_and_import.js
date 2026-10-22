'use strict'
/**
 * 备份统计 + 幂等导入白名单题目到 chem_train_items（pool=test）。
 *   node docs/chemistry_advanced_first_import/backup_and_import.js
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function buildGateNote(item) {
  // 关键标记置前，描述信息置后，防截断丢标记
  const markers = [
    '[ai_trial]',
    '[trial_access:allow]',
    '[qa:PASS]',
    '[daily:exclude]',
    '[human_unreviewed]',
    '[s60]',
  ].join('')
  const desc = ` sample=${item.sampleId} model=${item.sourceModelId}`
  let note = markers + desc
  if (note.length > 255) note = note.slice(0, 255)
  return note
}

async function collectStats(conn) {
  const q = async (sql, params = []) => {
    const [rows] = await conn.query(sql, params)
    return rows
  }
  const one = async (sql, params = []) => {
    const rows = await q(sql, params)
    return rows[0]
  }

  const total = (await one(`SELECT COUNT(1) AS n FROM chem_train_items`)).n
  const active = (
    await one(`SELECT COUNT(1) AS n FROM chem_train_items WHERE is_active=1`)
  ).n
  const trialAllow = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items
       WHERE pool='test' AND status='approved' AND is_active=1
         AND gate_note LIKE '%[trial_access:allow]%'
         AND gate_note NOT LIKE '%[trial_access:block]%'`,
    )
  ).n
  const trialBlock = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items
       WHERE gate_note LIKE '%[trial_access:block]%' OR is_active=0`,
    )
  ).n
  const formalApproved = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n
  const s60 = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items WHERE code LIKE 'train.ai_trial.s60.%'`,
    )
  ).n
  const raise = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items WHERE difficulty=2 AND is_active=1`,
    )
  ).n
  const challenge = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items WHERE difficulty=3 AND is_active=1`,
    )
  ).n

  // 每日可抽池（与服务逻辑对齐：test/formal 各自；此处统计 test 池）
  const dailyEligibleTest = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items
       WHERE pool='test' AND status='approved' AND is_active=1
         AND difficulty IN (1,2)
         AND gate_note NOT LIKE '%[trial_access:block]%'
         AND gate_note NOT LIKE '%[daily:exclude]%'`,
    )
  ).n
  const dailyEligibleFormal = (
    await one(
      `SELECT COUNT(1) AS n FROM chem_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1
         AND difficulty IN (1,2)
         AND ban_default_train=0
         AND gate_note NOT LIKE '%[daily:exclude]%'`,
    )
  ).n

  const bySpec = await q(
    `SELECT s.code, COUNT(*) AS n
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     WHERE i.is_active=1
     GROUP BY s.code ORDER BY s.code`,
  )

  return {
    total: Number(total),
    active: Number(active),
    trialAllow: Number(trialAllow),
    trialBlock: Number(trialBlock),
    formalApproved: Number(formalApproved),
    s60Count: Number(s60),
    raiseActive: Number(raise),
    challengeActive: Number(challenge),
    dailyEligibleTest: Number(dailyEligibleTest),
    dailyEligibleFormal: Number(dailyEligibleFormal),
    bySpecialtyActive: bySpec,
  }
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const whitelist = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'import_whitelist.json'), 'utf8'),
  )
  const items = whitelist.items || []
  if (!items.length) throw new Error('whitelist empty')

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: false,
  })

  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(__dirname, `backup_${ts}`)
  fs.mkdirSync(backupDir, { recursive: true })

  const before = await collectStats(conn)
  fs.writeFileSync(
    path.join(backupDir, 'stats_before.json'),
    JSON.stringify(before, null, 2),
    'utf8',
  )

  // load specialty/category maps
  const [specs] = await conn.query(`SELECT id, code FROM chem_specialties`)
  const [cats] = await conn.query(
    `SELECT id, specialty_id, code FROM chem_categories`,
  )
  const specByCode = Object.fromEntries(specs.map((s) => [s.code, String(s.id)]))
  const catBySpecCode = {}
  for (const c of cats) {
    const sp = specs.find((s) => String(s.id) === String(c.specialty_id))
    if (!sp) continue
    catBySpecCode[`${sp.code}::${c.code}`] = String(c.id)
  }

  // soft-match knowledge points by name (optional links)
  const [kps] = await conn.query(
    `SELECT id, name FROM chem_knowledge_points WHERE status='published' OR status='approved' OR status IS NOT NULL`,
  )

  const imported = []
  const skipped = []
  const failed = []

  for (const item of items) {
    try {
      const specialtyId = specByCode[item.specialtyCode]
      const categoryId = catBySpecCode[`${item.specialtyCode}::${item.categoryCode}`]
      if (!specialtyId || !categoryId) {
        failed.push({
          sampleId: item.sampleId,
          error: `missing_map specialty=${item.specialtyCode} category=${item.categoryCode}`,
        })
        continue
      }

      const [[exist]] = await conn.query(
        `SELECT id, code FROM chem_train_items WHERE code=? LIMIT 1`,
        [item.code],
      )
      if (exist) {
        skipped.push({ sampleId: item.sampleId, id: String(exist.id), code: exist.code })
        continue
      }

      const gateNote = buildGateNote(item)
      const [result] = await conn.query(
        `INSERT INTO chem_train_items
         (code, pool, qtype, answer_type, stem, options_json, answer, answer_aliases_json,
          analysis, difficulty, specialty_id, category_id, status, is_active,
          curriculum_ok, verify_blocked, ban_default_train, gate_note)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          item.code,
          'test',
          'single',
          'text',
          item.stem,
          JSON.stringify(item.options),
          item.answer,
          null,
          item.analysis,
          item.difficulty,
          specialtyId,
          categoryId,
          'approved',
          1,
          1,
          0,
          1,
          gateNote,
        ],
      )
      const itemId = String(result.insertId)

      // optional knowledge links by name contains
      let linkCount = 0
      for (const name of item.knowledgePoints || []) {
        const hit = kps.find(
          (k) => k.name === name || String(k.name).includes(name) || name.includes(String(k.name)),
        )
        if (!hit) continue
        try {
          await conn.query(
            `INSERT IGNORE INTO chem_train_item_links (item_id, entity_type, entity_id)
             VALUES (?,?,?)`,
            [itemId, 'knowledge_point', hit.id],
          )
          linkCount++
        } catch {
          /* ignore */
        }
      }

      imported.push({
        sampleId: item.sampleId,
        id: itemId,
        code: item.code,
        specialtyCode: item.specialtyCode,
        categoryCode: item.categoryCode,
        difficulty: item.difficulty,
        gateNote,
        knowledgeLinks: linkCount,
      })
    } catch (e) {
      failed.push({ sampleId: item.sampleId, error: String(e.message || e) })
    }
  }

  const after = await collectStats(conn)
  fs.writeFileSync(
    path.join(backupDir, 'stats_after.json'),
    JSON.stringify(after, null, 2),
    'utf8',
  )
  fs.writeFileSync(
    path.join(__dirname, 'imported_item_ids.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        backupDir,
        imported,
        skipped,
        failed,
        before,
        after,
      },
      null,
      2,
    ),
    'utf8',
  )
  fs.writeFileSync(
    path.join(backupDir, 'imported_item_ids.json'),
    JSON.stringify({ imported, skipped, failed }, null, 2),
    'utf8',
  )

  // copy whitelist snapshot
  fs.copyFileSync(
    path.join(__dirname, 'import_whitelist.json'),
    path.join(backupDir, 'import_whitelist.json'),
  )

  await conn.end()
  console.log(
    JSON.stringify(
      {
        backupDir,
        whitelist: items.length,
        imported: imported.length,
        skipped: skipped.length,
        failed: failed.length,
        before: {
          total: before.total,
          trialAllow: before.trialAllow,
          dailyEligibleTest: before.dailyEligibleTest,
          formalApproved: before.formalApproved,
        },
        after: {
          total: after.total,
          trialAllow: after.trialAllow,
          dailyEligibleTest: after.dailyEligibleTest,
          formalApproved: after.formalApproved,
          s60Count: after.s60Count,
          challengeActive: after.challengeActive,
        },
      },
      null,
      2,
    ),
  )
  if (failed.length) process.exitCode = 2
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
