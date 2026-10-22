'use strict'
/**
 * 正式更新白名单 48 道 chem_train_items.analysis（仅 analysis）。
 * 原值校验 + 事务；冲突跳过不强制覆盖。
 * 幂等：已是新 analysis 则 skip。
 *
 *   node docs/chemistry_analysis_upgrade/apply_first_update.js
 *   node docs/chemistry_analysis_upgrade/apply_first_update.js --idempotent-check
 *   node docs/chemistry_analysis_upgrade/apply_first_update.js --rollback
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

const OUT = __dirname
const FORBIDDEN_IDS = new Set(['215', '250'])

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

function loadWhitelist() {
  const wl = JSON.parse(
    fs.readFileSync(path.join(OUT, 'first_update_whitelist.json'), 'utf8'),
  )
  const dry = JSON.parse(
    fs.readFileSync(path.join(OUT, 'first_update_dryrun.json'), 'utf8'),
  )
  return { wl, dry }
}

async function precheck(conn, wl, dry) {
  const errors = []
  if (wl.count !== 48 || wl.items.length !== 48) {
    errors.push(`whitelist count ${wl.items.length} != 48`)
  }
  if (dry.stats.wouldUpdate !== 48 || dry.stats.conflictCount !== 0) {
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
    if (it.finalQualityGrade !== 'PASS' || !it.allowUpdate) {
      errors.push(`not PASS/allow: ${it.id}`)
    }
    if (FORBIDDEN_IDS.has(String(it.id))) {
      errors.push(`forbidden id in whitelist: ${it.id}`)
    }
    if (isS60(it.code, '')) {
      errors.push(`s60 in whitelist: ${it.code}`)
    }
    if (!dryIds.has(String(it.id))) {
      errors.push(`id ${it.id} not in dryrun WOULD_UPDATE set`)
    }
  }
  if (dryIds.size !== wl.items.length) {
    errors.push(`dryrun WOULD_UPDATE size ${dryIds.size} != whitelist ${wl.items.length}`)
  }

  const liveConflicts = []
  for (const it of wl.items) {
    const [[row]] = await conn.query(
      `SELECT id, code, analysis, gate_note FROM chem_train_items WHERE id=? LIMIT 1`,
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
    if (FORBIDDEN_IDS.has(String(row.id))) {
      liveConflicts.push({ id: it.id, reason: 'forbidden' })
      continue
    }
    const cur = String(row.analysis ?? '')
    const orig = String(it.originalAnalysis ?? '')
    const neu = String(it.newAnalysis ?? '')
    if (cur === neu) {
      // already updated — ok for idempotent
      continue
    }
    if (cur !== orig) {
      liveConflicts.push({
        id: it.id,
        reason: 'analysis_changed_since_backup',
        detail: { expectSha: sha256(orig), liveSha: sha256(cur) },
      })
    }
  }
  return { errors, liveConflicts }
}

async function applyUpdate(conn, wl) {
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
      if (FORBIDDEN_IDS.has(String(it.id)) || isS60(before.code, '')) {
        results.push({ id: it.id, status: 'SKIP', reason: 'forbidden_or_s60' })
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
      results.push({ id: it.id, code: it.code, status: 'UPDATED', affectedRows: r.affectedRows })
    }
    const hardFail = results.some((x) => x.status === 'SKIP_CONFLICT' || x.status === 'SKIP')
    // 冲突不回滚已成功行？用户要求事务一致性——若有冲突应整体回滚更安全
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

async function verifyAfter(conn, wl) {
  const checks = []
  let updatedMatch = 0
  for (const it of wl.items) {
    const [[row]] = await conn.query(
      `SELECT analysis FROM chem_train_items WHERE id=? AND code=?`,
      [it.id, it.code],
    )
    const ok = row && String(row.analysis ?? '') === String(it.newAnalysis ?? '')
    if (ok) updatedMatch++
    checks.push({ id: it.id, code: it.code, analysisMatchesWhitelist: !!ok })
  }

  // 215/250 unchanged vs backup in quality file
  const quality = JSON.parse(
    fs.readFileSync(path.join(OUT, 'first_update_quality_results.json'), 'utf8'),
  )
  for (const id of ['215', '250']) {
    const q = quality.items.find((x) => String(x.id) === id)
    const [[row]] = await conn.query(`SELECT analysis FROM chem_train_items WHERE id=?`, [id])
    const same = q && row && String(row.analysis ?? '') === String(q.originalAnalysis ?? '')
    checks.push({ id, preservedExcluded: !!same })
  }

  const [[s60Changed]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items
     WHERE (code LIKE 'train.ai_trial.s60.%' OR IFNULL(gate_note,'') LIKE '%[s60]%')
       AND analysis LIKE '【正确答案】%'`,
  )
  // s60 have七段式，可能也含【】——改用：白名单 id 外且 s60 的 analysis 不应等于任一白名单 newAnalysis
  const newSet = wl.items.map((x) => x.newAnalysis)
  let s60Hit = 0
  const [s60rows] = await conn.query(
    `SELECT id, analysis FROM chem_train_items
     WHERE code LIKE 'train.ai_trial.s60.%' OR IFNULL(gate_note,'') LIKE '%[s60]%'`,
  )
  for (const r of s60rows) {
    if (newSet.includes(String(r.analysis ?? ''))) s60Hit++
  }

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[trainable]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[s60c]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE code LIKE 'train.ai_trial.s60.%' OR IFNULL(gate_note,'') LIKE '%[s60]%'`,
  )
  const [[sess]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_sessions`)
  const [[si]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_session_items`)

  // 非白名单题：抽样确认未被改成白名单新文（用 checksum 集合）
  const wlIds = wl.items.map((x) => x.id)
  const newShas = new Set(wl.items.map((x) => sha256(x.newAnalysis)))
  const [others] = await conn.query(
    `SELECT id, analysis FROM chem_train_items WHERE id NOT IN (?)`,
    [wlIds],
  )
  let otherHitNew = 0
  for (const r of others) {
    if (newShas.has(sha256(r.analysis))) otherHitNew++
  }

  return {
    updatedMatch,
    expected: wl.items.length,
    s60Count: Number(s60c.n),
    s60AccidentallyGotWhitelistText: s60Hit,
    otherItemsMatchingNewText: otherHitNew,
    bank: {
      total: Number(tot.n),
      trainable: Number(trainable.n),
      formal: Number(formal.n),
    },
    historyCounts: { sessions: Number(sess.n), sessionItems: Number(si.n) },
    excludedPreserved: checks.filter((c) => c.preservedExcluded !== undefined),
    perItem: checks.filter((c) => c.analysisMatchesWhitelist !== undefined),
    unusedS60ChangedHint: Number(s60Changed.n),
  }
}

async function main() {
  const args = process.argv.slice(2)
  const idempotentOnly = args.includes('--idempotent-check')
  const doRollback = args.includes('--rollback')
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const { wl, dry } = loadWhitelist()
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: false,
  })

  const pre = await precheck(conn, wl, dry)
  if (pre.errors.length) {
    console.error('PRECHECK_FAIL', pre.errors)
    fs.writeFileSync(
      path.join(OUT, 'first_update_apply_result.json'),
      JSON.stringify({ ok: false, stage: 'precheck', pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }
  // liveConflicts that are not "already new" block first apply
  const blocking = pre.liveConflicts.filter((c) => c.reason !== 'already_new')
  // reclassify: if analysis already new, not in liveConflicts as changed
  if (blocking.length && !idempotentOnly && !doRollback) {
    // allow already-updated via separate path — filter analysis_changed
    const real = blocking.filter((c) => c.reason === 'analysis_changed_since_backup')
    if (real.length) {
      console.error('PRECHECK_CONFLICT', real)
      fs.writeFileSync(
        path.join(OUT, 'first_update_apply_result.json'),
        JSON.stringify({ ok: false, stage: 'precheck_conflict', real, pre }, null, 2),
      )
      await conn.end()
      process.exit(1)
    }
  }

  let applyResult
  if (doRollback) {
    applyResult = await rollback(conn, wl)
  } else {
    applyResult = await applyUpdate(conn, wl)
  }

  if (!applyResult.ok) {
    console.error('APPLY_ROLLED_BACK', applyResult.conflicts || applyResult)
    fs.writeFileSync(
      path.join(OUT, 'first_update_apply_result.json'),
      JSON.stringify({ ok: false, applyResult, pre }, null, 2),
    )
    await conn.end()
    process.exit(1)
  }

  const verify = await verifyAfter(conn, wl)
  const updated = applyResult.results.filter((r) => r.status === 'UPDATED' || r.status === 'ROLLED_BACK')
  const skippedIdem = applyResult.results.filter((r) => r.status === 'SKIP_IDEMPOTENT')

  const out = {
    generatedAt: new Date().toISOString(),
    mode: doRollback ? 'rollback' : idempotentOnly ? 'idempotent_check' : 'apply',
    ok: verify.updatedMatch === wl.items.length && verify.s60AccidentallyGotWhitelistText === 0,
    precheck: { errors: pre.errors, liveConflicts: pre.liveConflicts },
    apply: {
      updatedCount: updated.length,
      idempotentSkip: skippedIdem.length,
      results: applyResult.results,
    },
    verify,
  }
  fs.writeFileSync(path.join(OUT, 'first_update_apply_result.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify({
    ok: out.ok,
    updated: out.apply.updatedCount,
    idempotentSkip: out.apply.idempotentSkip,
    verifyMatch: verify.updatedMatch,
    bank: verify.bank,
    history: verify.historyCounts,
  }, null, 2))
  await conn.end()
  process.exit(out.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
