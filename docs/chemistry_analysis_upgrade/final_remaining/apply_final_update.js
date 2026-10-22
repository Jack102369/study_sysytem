'use strict'
/**
 * 剩余旧题 377 道 analysis 正式更新（仅 analysis）。
 *   node docs/chemistry_analysis_upgrade/final_remaining/apply_final_update.js
 *   node docs/chemistry_analysis_upgrade/final_remaining/apply_final_update.js --idempotent-check
 *   node docs/chemistry_analysis_upgrade/final_remaining/apply_final_update.js --rollback
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.resolve(__dirname, '../../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

const OUT = __dirname
const PARENT = path.resolve(__dirname, '..')
const EXPECTED = 377
const BLOCKED_13 = new Set([
  '211', '215', '220', '238', '242', '246', '250', '263', '265', '267', '271', '275', '288',
])

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function sha256(s) {
  return crypto.createHash('sha256').update(String(s ?? ''), 'utf8').digest('hex')
}

function isS60(code, gateNote) {
  return (
    /^train\.ai_trial\.s60\./i.test(String(code || '')) ||
    /\[s60\]/i.test(String(gateNote || ''))
  )
}

function isBlocked(gateNote) {
  return /\[trial_access:block\]/i.test(String(gateNote || ''))
}

function loadUpgradedIds() {
  const b1 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8'),
  ).items.map((x) => String(x.id))
  const b2 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'batch2/update_whitelist.json'), 'utf8'),
  ).items.map((x) => String(x.id))
  return new Set([...b1, ...b2])
}

function loadHoldIds() {
  const q = JSON.parse(fs.readFileSync(path.join(OUT, 'quality_results.json'), 'utf8'))
  return new Set(q.items.filter((x) => x.finalGrade === 'HOLD').map((x) => String(x.id)))
}

function loadWhitelist() {
  const wl = JSON.parse(fs.readFileSync(path.join(OUT, 'update_whitelist.json'), 'utf8'))
  const dry = JSON.parse(fs.readFileSync(path.join(OUT, 'dryrun_report.json'), 'utf8'))
  return { wl, dry }
}

async function precheck(conn, wl, dry, upgraded, holdIds) {
  const errors = []
  if (wl.count !== EXPECTED || wl.items.length !== EXPECTED) {
    errors.push(`whitelist count ${wl.items.length} != ${EXPECTED}`)
  }
  if (dry.stats.wouldUpdate !== EXPECTED || dry.stats.conflictCount !== 0) {
    errors.push(
      `dryrun mismatch wouldUpdate=${dry.stats.wouldUpdate} conflict=${dry.stats.conflictCount}`,
    )
  }
  const dryIds = new Set(
    (dry.whitelistDryRun || [])
      .filter((x) => x.dryRunDecision === 'WOULD_UPDATE')
      .map((x) => String(x.id)),
  )

  for (const it of wl.items) {
    const id = String(it.id || it.itemId)
    if ((it.finalQualityGrade || it.finalGrade) !== 'PASS' || !it.allowUpdate) {
      errors.push(`not PASS/allow: ${id}`)
    }
    if (upgraded.has(id)) errors.push(`already upgraded 164: ${id}`)
    if (BLOCKED_13.has(id)) errors.push(`blocked13: ${id}`)
    if (holdIds.has(id)) errors.push(`hold in whitelist: ${id}`)
    if (isS60(it.code, '')) errors.push(`s60: ${it.code}`)
    if (!dryIds.has(id)) errors.push(`not in dryrun WOULD_UPDATE: ${id}`)
    const orig = it.originalAnalysis
    const neu = it.newAnalysis || it.candidateAnalysis
    if (sha256(orig) !== (it.checksumOriginal || it.originalChecksum)) {
      errors.push(`checksumOriginal mismatch: ${id}`)
    }
    if (sha256(neu) !== (it.checksumNew || it.candidateChecksum)) {
      errors.push(`checksumNew mismatch: ${id}`)
    }
  }
  if (dryIds.size !== wl.items.length) {
    errors.push(`dryrun size ${dryIds.size} != wl ${wl.items.length}`)
  }

  const liveConflicts = []
  for (const it of wl.items) {
    const [[row]] = await conn.query(
      `SELECT id, code, analysis, gate_note, pool, status, is_active
       FROM chem_train_items WHERE id=? LIMIT 1`,
      [it.id],
    )
    if (!row) {
      liveConflicts.push({ id: it.id, reason: 'missing' })
      continue
    }
    if (String(row.id) !== String(it.id) || row.code !== it.code) {
      liveConflicts.push({ id: it.id, reason: 'id_code_mismatch' })
      continue
    }
    if (isS60(row.code, row.gate_note) || isBlocked(row.gate_note)) {
      liveConflicts.push({ id: it.id, reason: 's60_or_blocked' })
      continue
    }
    if (row.pool !== 'test' || row.status !== 'approved' || Number(row.is_active) !== 1) {
      liveConflicts.push({ id: it.id, reason: 'not_trainable' })
      continue
    }
    const cur = String(row.analysis ?? '')
    const orig = String(it.originalAnalysis ?? '')
    const neu = String(it.newAnalysis || it.candidateAnalysis || '')
    if (cur !== orig && cur !== neu) {
      liveConflicts.push({
        id: it.id,
        reason: 'analysis_changed_since_backup',
        expectSha: sha256(orig),
        liveSha: sha256(cur),
      })
    }
  }
  return { errors, liveConflicts }
}

async function applyUpdate(conn, wl, upgraded, holdIds) {
  const results = []
  await conn.beginTransaction()
  try {
    for (const it of wl.items) {
      const id = String(it.id)
      const neu = String(it.newAnalysis || it.candidateAnalysis || '')
      const orig = String(it.originalAnalysis ?? '')
      const [[before]] = await conn.query(
        `SELECT id, code, analysis, gate_note FROM chem_train_items WHERE id=? LIMIT 1 FOR UPDATE`,
        [it.id],
      )
      if (!before || before.code !== it.code) {
        results.push({ id, status: 'SKIP', reason: 'id_code_mismatch' })
        continue
      }
      if (
        upgraded.has(id) ||
        holdIds.has(id) ||
        BLOCKED_13.has(id) ||
        isS60(before.code, before.gate_note) ||
        isBlocked(before.gate_note)
      ) {
        results.push({ id, status: 'SKIP', reason: 'forbidden_class' })
        continue
      }
      const cur = String(before.analysis ?? '')
      if (cur === neu) {
        results.push({ id, status: 'SKIP_IDEMPOTENT', reason: 'already_new' })
        continue
      }
      if (cur !== orig) {
        results.push({ id, status: 'SKIP_CONFLICT', reason: 'original_mismatch' })
        continue
      }
      const [r] = await conn.query(
        `UPDATE chem_train_items SET analysis=? WHERE id=? AND code=? AND analysis=?`,
        [neu, it.id, it.code, orig],
      )
      if (r.affectedRows !== 1) {
        results.push({ id, status: 'SKIP_CONFLICT', reason: 'affected_' + r.affectedRows })
        continue
      }
      results.push({ id, code: it.code, status: 'UPDATED', affectedRows: 1 })
    }
    const conflicts = results.filter(
      (x) => x.status === 'SKIP_CONFLICT' || (x.status === 'SKIP' && x.reason !== 'already_new'),
    )
    if (conflicts.length) {
      await conn.rollback()
      return { ok: false, rolledBack: true, results, conflicts }
    }
    await conn.commit()
    return { ok: true, rolledBack: false, results, conflicts: [] }
  } catch (e) {
    await conn.rollback()
    throw e
  }
}

async function rollback(conn, wl) {
  const results = []
  await conn.beginTransaction()
  try {
    for (const it of wl.items) {
      const neu = String(it.newAnalysis || it.candidateAnalysis || '')
      const orig = String(it.originalAnalysis ?? '')
      const [[before]] = await conn.query(
        `SELECT id, code, analysis FROM chem_train_items WHERE id=? LIMIT 1 FOR UPDATE`,
        [it.id],
      )
      if (!before || before.code !== it.code) {
        results.push({ id: it.id, status: 'SKIP', reason: 'id_code_mismatch' })
        continue
      }
      const cur = String(before.analysis ?? '')
      if (cur === orig) {
        results.push({ id: it.id, status: 'SKIP_IDEMPOTENT', reason: 'already_original' })
        continue
      }
      if (cur !== neu) {
        results.push({ id: it.id, status: 'SKIP_CONFLICT', reason: 'not_batch_new_value' })
        continue
      }
      const [r] = await conn.query(
        `UPDATE chem_train_items SET analysis=? WHERE id=? AND code=? AND analysis=?`,
        [orig, it.id, it.code, neu],
      )
      results.push({
        id: it.id,
        status: r.affectedRows === 1 ? 'ROLLED_BACK' : 'SKIP_CONFLICT',
        affectedRows: r.affectedRows,
      })
    }
    const conflicts = results.filter((x) => x.status === 'SKIP_CONFLICT')
    if (conflicts.length) {
      await conn.rollback()
      return { ok: false, rolledBackTxn: true, results }
    }
    await conn.commit()
    return { ok: true, results }
  } catch (e) {
    await conn.rollback()
    throw e
  }
}

async function verifyAfter(conn, wl, upgraded, holdIds) {
  let updatedMatch = 0
  for (const it of wl.items) {
    const neu = String(it.newAnalysis || it.candidateAnalysis || '')
    const [[row]] = await conn.query(
      `SELECT analysis FROM chem_train_items WHERE id=? AND code=?`,
      [it.id, it.code],
    )
    if (row && String(row.analysis ?? '') === neu) updatedMatch++
  }

  // batch1+2 preserved
  const wl1 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8'),
  )
  const wl2 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'batch2/update_whitelist.json'), 'utf8'),
  )
  let b1ok = 0
  let b2ok = 0
  for (const it of wl1.items) {
    const [[row]] = await conn.query(`SELECT analysis FROM chem_train_items WHERE id=?`, [it.id])
    if (row && String(row.analysis ?? '') === String(it.newAnalysis ?? '')) b1ok++
  }
  for (const it of wl2.items) {
    const [[row]] = await conn.query(`SELECT analysis FROM chem_train_items WHERE id=?`, [it.id])
    if (row && String(row.analysis ?? '') === String(it.newAnalysis ?? '')) b2ok++
  }

  // HOLD unchanged vs quality originalAnalysis when present
  let holdUntouched = 0
  for (const id of holdIds) {
    const q = JSON.parse(fs.readFileSync(path.join(OUT, 'quality_results.json'), 'utf8'))
    const item = q.items.find((x) => String(x.id) === id)
    if (!item || item.newAnalysis == null) {
      // excluded without candidate — just ensure not in wl
      if (![...wl.items].some((x) => String(x.id) === id)) holdUntouched++
      continue
    }
    const [[row]] = await conn.query(`SELECT analysis FROM chem_train_items WHERE id=?`, [id])
    if (row && String(row.analysis ?? '') === String(item.originalAnalysis ?? '')) holdUntouched++
  }

  const [blk] = await conn.query(
    `SELECT id, gate_note FROM chem_train_items WHERE id IN (?)`,
    [[...BLOCKED_13]],
  )
  const blockedStill = blk.filter((r) => isBlocked(r.gate_note)).length

  const newShas = new Set(
    wl.items.map((x) => sha256(x.newAnalysis || x.candidateAnalysis)),
  )
  const [s60rows] = await conn.query(
    `SELECT id, analysis FROM chem_train_items
     WHERE code LIKE 'train.ai_trial.s60.%' OR IFNULL(gate_note,'') LIKE '%[s60]%'`,
  )
  let s60Hit = 0
  for (const r of s60rows) {
    if (newShas.has(sha256(r.analysis))) s60Hit++
  }

  const wlIds = wl.items.map((x) => x.id)
  const [others] = await conn.query(
    `SELECT id, analysis FROM chem_train_items WHERE id NOT IN (?)`,
    [wlIds],
  )
  let otherHit = 0
  for (const r of others) {
    if (upgraded.has(String(r.id))) continue
    if (newShas.has(sha256(r.analysis))) otherHit++
  }

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[trainable]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[daily]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[daily:exclude]%')`,
  )
  const [[s60c]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE code LIKE 'train.ai_trial.s60.%' OR IFNULL(gate_note,'') LIKE '%[s60]%'`,
  )
  const [[sess]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_sessions`)
  const [[si]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_session_items`)

  return {
    updatedMatch,
    expected: wl.items.length,
    batch1Preserved: b1ok,
    batch1Expected: wl1.items.length,
    batch2Preserved: b2ok,
    batch2Expected: wl2.items.length,
    holdUntouchedApprox: holdUntouched,
    holdExpected: holdIds.size,
    blockedStill,
    blockedExpected: BLOCKED_13.size,
    s60Count: Number(s60c.n),
    s60HitFinalText: s60Hit,
    otherNonUpgradedHitFinalText: otherHit,
    bank: {
      total: Number(tot.n),
      trainable: Number(trainable.n),
      formal: Number(formal.n),
      dailyCandidateApprox: Number(daily.n),
    },
    historyCounts: { sessions: Number(sess.n), sessionItems: Number(si.n) },
  }
}

async function main() {
  const args = process.argv.slice(2)
  const doRollback = args.includes('--rollback')
  const idempotentOnly = args.includes('--idempotent-check')
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const { wl, dry } = loadWhitelist()
  const upgraded = loadUpgradedIds()
  const holdIds = loadHoldIds()

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const pre = await precheck(conn, wl, dry, upgraded, holdIds)
  if (pre.errors.length) {
    console.error('PRECHECK_FAIL', pre.errors.slice(0, 30))
    fs.writeFileSync(
      path.join(OUT, 'final_apply_result.json'),
      JSON.stringify({ ok: false, stage: 'precheck', pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }
  const real = pre.liveConflicts.filter((c) => c.reason === 'analysis_changed_since_backup')
  if (real.length && !idempotentOnly && !doRollback) {
    console.error('PRECHECK_CONFLICT', real.slice(0, 20))
    fs.writeFileSync(
      path.join(OUT, 'final_apply_result.json'),
      JSON.stringify({ ok: false, stage: 'precheck_conflict', real, pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }

  let applyResult
  if (doRollback) applyResult = await rollback(conn, wl)
  else applyResult = await applyUpdate(conn, wl, upgraded, holdIds)

  if (!applyResult.ok) {
    console.error('APPLY_ROLLED_BACK', applyResult.conflicts || applyResult)
    fs.writeFileSync(
      path.join(OUT, 'final_apply_result.json'),
      JSON.stringify({ ok: false, applyResult, pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }

  const verify = await verifyAfter(conn, wl, upgraded, holdIds)
  const updated = applyResult.results.filter(
    (r) => r.status === 'UPDATED' || r.status === 'ROLLED_BACK',
  )
  const skippedIdem = applyResult.results.filter((r) => r.status === 'SKIP_IDEMPOTENT')

  const out = {
    generatedAt: new Date().toISOString(),
    mode: doRollback ? 'rollback' : idempotentOnly ? 'idempotent_check' : 'apply',
    ok:
      verify.updatedMatch === wl.items.length &&
      verify.s60HitFinalText === 0 &&
      verify.otherNonUpgradedHitFinalText === 0 &&
      verify.batch1Preserved === verify.batch1Expected &&
      verify.batch2Preserved === verify.batch2Expected &&
      verify.blockedStill === verify.blockedExpected &&
      verify.bank.total === 638 &&
      verify.bank.trainable === 621 &&
      verify.bank.formal === 0,
    precheck: { errors: pre.errors, liveConflicts: pre.liveConflicts },
    apply: {
      updatedCount: updated.length,
      idempotentSkip: skippedIdem.length,
      results: applyResult.results,
    },
    verify,
  }
  fs.writeFileSync(path.join(OUT, 'final_apply_result.json'), JSON.stringify(out, null, 2))
  console.log(
    JSON.stringify(
      {
        ok: out.ok,
        mode: out.mode,
        updated: out.apply.updatedCount,
        idempotentSkip: out.apply.idempotentSkip,
        verifyMatch: verify.updatedMatch,
        batch1: verify.batch1Preserved,
        batch2: verify.batch2Preserved,
        blockedStill: verify.blockedStill,
        bank: verify.bank,
        history: verify.historyCounts,
      },
      null,
      2,
    ),
  )
  await conn.end()
  process.exit(out.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
