'use strict'
/**
 * 第二批正式更新白名单 116 道 chem_train_items.analysis（仅 analysis）。
 * 原值校验 + 事务；冲突整批回滚不强制覆盖。
 *
 *   node docs/chemistry_analysis_upgrade/batch2/apply_batch2_update.js
 *   node docs/chemistry_analysis_upgrade/batch2/apply_batch2_update.js --idempotent-check
 *   node docs/chemistry_analysis_upgrade/batch2/apply_batch2_update.js --rollback
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.resolve(__dirname, '../../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

const OUT = __dirname
const PARENT = path.resolve(__dirname, '..')
const EXPECTED = 116
const HOLD_IDS = new Set(['50', '379', '398', '401'])
const BLOCKED_13 = new Set([
  '211',
  '215',
  '220',
  '238',
  '242',
  '246',
  '250',
  '263',
  '265',
  '267',
  '271',
  '275',
  '288',
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

function loadBatch1Ids() {
  const wl1 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8'),
  )
  return new Set(wl1.items.map((x) => String(x.id)))
}

function loadWhitelist() {
  const wl = JSON.parse(fs.readFileSync(path.join(OUT, 'update_whitelist.json'), 'utf8'))
  const dry = JSON.parse(fs.readFileSync(path.join(OUT, 'update_dryrun.json'), 'utf8'))
  return { wl, dry }
}

async function precheck(conn, wl, dry, batch1Ids) {
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
    const id = String(it.id)
    if (it.finalQualityGrade !== 'PASS' || !it.allowUpdate) {
      errors.push(`not PASS/allow: ${id}`)
    }
    if (batch1Ids.has(id)) errors.push(`batch1 overlap: ${id}`)
    if (BLOCKED_13.has(id)) errors.push(`blocked13 in whitelist: ${id}`)
    if (HOLD_IDS.has(id)) errors.push(`hold id in whitelist: ${id}`)
    if (isS60(it.code, '')) errors.push(`s60 in whitelist: ${it.code}`)
    if (!dryIds.has(id)) errors.push(`id ${id} not in dryrun WOULD_UPDATE`)
    if (sha256(it.originalAnalysis) !== it.checksumOriginal) {
      errors.push(`checksumOriginal mismatch: ${id}`)
    }
    if (sha256(it.newAnalysis) !== it.checksumNew) {
      errors.push(`checksumNew mismatch: ${id}`)
    }
  }
  if (dryIds.size !== wl.items.length) {
    errors.push(`dryrun WOULD_UPDATE size ${dryIds.size} != whitelist ${wl.items.length}`)
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
    if (isS60(row.code, row.gate_note)) {
      liveConflicts.push({ id: it.id, reason: 's60' })
      continue
    }
    if (isBlocked(row.gate_note)) {
      liveConflicts.push({ id: it.id, reason: 'now_blocked' })
      continue
    }
    if (row.pool !== 'test' || row.status !== 'approved' || Number(row.is_active) !== 1) {
      liveConflicts.push({ id: it.id, reason: 'not_trainable_status' })
      continue
    }
    const cur = String(row.analysis ?? '')
    const orig = String(it.originalAnalysis ?? '')
    const neu = String(it.newAnalysis ?? '')
    if (sha256(cur) !== it.checksumOriginal && cur !== neu) {
      // live must match original checksum unless already new
      if (cur !== orig) {
        liveConflicts.push({
          id: it.id,
          reason: 'analysis_changed_since_backup',
          detail: { expectSha: it.checksumOriginal, liveSha: sha256(cur) },
        })
      }
    } else if (cur !== orig && cur !== neu) {
      liveConflicts.push({
        id: it.id,
        reason: 'analysis_changed_since_backup',
        detail: { expectSha: sha256(orig), liveSha: sha256(cur) },
      })
    }
  }

  // HOLD / blocked must be untouched (spot: analysis equals whatever they have; we just ensure not in wl)
  return { errors, liveConflicts }
}

async function applyUpdate(conn, wl, batch1Ids) {
  const results = []
  await conn.beginTransaction()
  try {
    for (const it of wl.items) {
      const id = String(it.id)
      const [[before]] = await conn.query(
        `SELECT id, code, analysis, gate_note FROM chem_train_items WHERE id=? LIMIT 1 FOR UPDATE`,
        [it.id],
      )
      if (!before || before.code !== it.code) {
        results.push({ id: it.id, status: 'SKIP', reason: 'id_code_mismatch' })
        continue
      }
      if (
        batch1Ids.has(id) ||
        BLOCKED_13.has(id) ||
        HOLD_IDS.has(id) ||
        isS60(before.code, before.gate_note) ||
        isBlocked(before.gate_note)
      ) {
        results.push({ id: it.id, status: 'SKIP', reason: 'forbidden_class' })
        continue
      }
      const cur = String(before.analysis ?? '')
      const orig = String(it.originalAnalysis ?? '')
      const neu = String(it.newAnalysis ?? '')
      if (cur === neu) {
        results.push({ id: it.id, status: 'SKIP_IDEMPOTENT', reason: 'already_new' })
        continue
      }
      if (cur !== orig) {
        results.push({ id: it.id, status: 'SKIP_CONFLICT', reason: 'original_mismatch' })
        continue
      }
      const [r] = await conn.query(
        `UPDATE chem_train_items
         SET analysis = ?
         WHERE id = ? AND code = ? AND analysis = ?`,
        [neu, it.id, it.code, orig],
      )
      if (r.affectedRows !== 1) {
        results.push({
          id: it.id,
          status: 'SKIP_CONFLICT',
          reason: 'affectedRows_' + r.affectedRows,
        })
        continue
      }
      results.push({ id: it.id, code: it.code, status: 'UPDATED', affectedRows: 1 })
    }
    const conflicts = results.filter(
      (x) =>
        x.status === 'SKIP_CONFLICT' ||
        (x.status === 'SKIP' && x.reason !== 'already_new'),
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
      const [[before]] = await conn.query(
        `SELECT id, code, analysis FROM chem_train_items WHERE id=? LIMIT 1 FOR UPDATE`,
        [it.id],
      )
      if (!before || before.code !== it.code) {
        results.push({ id: it.id, status: 'SKIP', reason: 'id_code_mismatch' })
        continue
      }
      const cur = String(before.analysis ?? '')
      const neu = String(it.newAnalysis ?? '')
      const orig = String(it.originalAnalysis ?? '')
      if (cur === orig) {
        results.push({ id: it.id, status: 'SKIP_IDEMPOTENT', reason: 'already_original' })
        continue
      }
      if (cur !== neu) {
        results.push({ id: it.id, status: 'SKIP_CONFLICT', reason: 'not_batch2_new_value' })
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

async function verifyAfter(conn, wl, batch1Ids) {
  let updatedMatch = 0
  const perItem = []
  for (const it of wl.items) {
    const [[row]] = await conn.query(
      `SELECT analysis FROM chem_train_items WHERE id=? AND code=?`,
      [it.id, it.code],
    )
    const ok = row && String(row.analysis ?? '') === String(it.newAnalysis ?? '')
    if (ok) updatedMatch++
    perItem.push({ id: it.id, code: it.code, analysisMatchesWhitelist: !!ok })
  }

  // batch1 preserved
  const wl1 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8'),
  )
  let batch1Ok = 0
  for (const it of wl1.items) {
    const [[row]] = await conn.query(`SELECT analysis FROM chem_train_items WHERE id=?`, [it.id])
    if (row && String(row.analysis ?? '') === String(it.newAnalysis ?? '')) batch1Ok++
  }

  // HOLD unchanged vs pre-apply snapshot if we have quality original
  const holdCheck = []
  for (const id of HOLD_IDS) {
    const [[row]] = await conn.query(
      `SELECT id, analysis FROM chem_train_items WHERE id=?`,
      [id],
    )
    const inWl = wl.items.some((x) => String(x.id) === id)
    holdCheck.push({
      id,
      notInWhitelist: !inWl,
      present: !!row,
    })
  }

  // blocked still blocked
  const [blk] = await conn.query(
    `SELECT id, gate_note FROM chem_train_items WHERE id IN (?)`,
    [[...BLOCKED_13]],
  )
  const blockedStill = blk.filter((r) => isBlocked(r.gate_note)).length

  // s60 not hit by batch2 new text
  const newShas = new Set(wl.items.map((x) => sha256(x.newAnalysis)))
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
  let otherHitNew = 0
  // exclude batch1 items which legitimately have their own new text - only count if matches batch2 newAnalysis
  for (const r of others) {
    if (batch1Ids.has(String(r.id))) continue
    if (newShas.has(sha256(r.analysis))) otherHitNew++
  }

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[trainable]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[dailyCand]] = await conn.query(
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
    batch1Preserved: batch1Ok,
    batch1Expected: wl1.items.length,
    holdCheck,
    blockedStill,
    blockedExpected: BLOCKED_13.size,
    s60Count: Number(s60c.n),
    s60AccidentallyGotBatch2Text: s60Hit,
    otherNonBatch1MatchingBatch2Text: otherHitNew,
    bank: {
      total: Number(tot.n),
      trainable: Number(trainable.n),
      formal: Number(formal.n),
      dailyCandidateApprox: Number(dailyCand.n),
    },
    historyCounts: { sessions: Number(sess.n), sessionItems: Number(si.n) },
    perItem,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const idempotentOnly = args.includes('--idempotent-check')
  const doRollback = args.includes('--rollback')
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const { wl, dry } = loadWhitelist()
  const batch1Ids = loadBatch1Ids()

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: false,
  })

  const pre = await precheck(conn, wl, dry, batch1Ids)
  if (pre.errors.length) {
    console.error('PRECHECK_FAIL', pre.errors)
    fs.writeFileSync(
      path.join(OUT, 'batch2_apply_result.json'),
      JSON.stringify({ ok: false, stage: 'precheck', pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }
  const realConflicts = pre.liveConflicts.filter(
    (c) => c.reason === 'analysis_changed_since_backup' || c.reason === 'now_blocked',
  )
  if (realConflicts.length && !idempotentOnly && !doRollback) {
    console.error('PRECHECK_CONFLICT', realConflicts)
    fs.writeFileSync(
      path.join(OUT, 'batch2_apply_result.json'),
      JSON.stringify({ ok: false, stage: 'precheck_conflict', realConflicts, pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }

  let applyResult
  if (doRollback) {
    applyResult = await rollback(conn, wl)
  } else {
    applyResult = await applyUpdate(conn, wl, batch1Ids)
  }

  if (!applyResult.ok) {
    console.error('APPLY_ROLLED_BACK', applyResult.conflicts || applyResult)
    fs.writeFileSync(
      path.join(OUT, 'batch2_apply_result.json'),
      JSON.stringify({ ok: false, applyResult, pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }

  const verify = await verifyAfter(conn, wl, batch1Ids)
  const updated = applyResult.results.filter(
    (r) => r.status === 'UPDATED' || r.status === 'ROLLED_BACK',
  )
  const skippedIdem = applyResult.results.filter((r) => r.status === 'SKIP_IDEMPOTENT')

  const out = {
    generatedAt: new Date().toISOString(),
    mode: doRollback ? 'rollback' : idempotentOnly ? 'idempotent_check' : 'apply',
    ok:
      verify.updatedMatch === wl.items.length &&
      verify.s60AccidentallyGotBatch2Text === 0 &&
      verify.otherNonBatch1MatchingBatch2Text === 0 &&
      verify.batch1Preserved === verify.batch1Expected &&
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
  fs.writeFileSync(path.join(OUT, 'batch2_apply_result.json'), JSON.stringify(out, null, 2))
  console.log(
    JSON.stringify(
      {
        ok: out.ok,
        mode: out.mode,
        updated: out.apply.updatedCount,
        idempotentSkip: out.apply.idempotentSkip,
        verifyMatch: verify.updatedMatch,
        batch1Preserved: verify.batch1Preserved,
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
