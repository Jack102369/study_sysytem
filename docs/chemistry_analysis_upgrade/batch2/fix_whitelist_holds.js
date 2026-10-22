'use strict'
/**
 * 修正：previousGrade=HOLD 或 DeepSeek 科学/答案不一致 → 不得入白名单。
 * 基于已有 quality_results 重算 whitelist / dryrun / backup（只读 SELECT，不写库）。
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { openDb } = require('../lib_common')

const OUT = __dirname
const BACKUP_DIR = path.join(OUT, 'batch2_backup')

function sha256(s) {
  return crypto.createHash('sha256').update(String(s ?? ''), 'utf8').digest('hex')
}

function isS60(code, gateNote) {
  return (
    /^train\.ai_trial\.s60\./i.test(String(code || '')) ||
    /\[s60\]/i.test(String(gateNote || ''))
  )
}

async function main() {
  const quality = JSON.parse(fs.readFileSync(path.join(OUT, 'quality_results.json'), 'utf8'))
  const trunc = JSON.parse(fs.readFileSync(path.join(OUT, 'truncated_stem_scan.json'), 'utf8'))
  const wl1 = JSON.parse(
    fs.readFileSync(path.join(OUT, '..', 'first_update_whitelist.json'), 'utf8'),
  )
  const batch1 = new Set(wl1.items.map((x) => String(x.id)))
  const truncated = new Set(trunc.items.filter((x) => x.truncated).map((x) => String(x.id)))
  truncated.add('215')
  truncated.add('250')

  const { conn } = await openDb()
  let forcedHold = 0
  for (const it of quality.items) {
    const ds = it.deepseekAssist
    const holdByDs =
      ds &&
      (ds.scienceOk === false ||
        ds.answerConsistent === false ||
        ds.suggestedGrade === 'HOLD' ||
        ds.suggestedGrade === 'REJECT')
    const holdByPrev = it.previousGrade === 'HOLD'
    if (holdByDs || holdByPrev) {
      it.allowUpdate = false
      it.finalGrade = 'HOLD'
      it.blockReason = holdByDs
        ? 'deepseek_assist_science_or_answer_or_hold'
        : 'previous_hold'
      it.scienceCheck = 'HOLD_PENDING_HUMAN'
      forcedHold++
      if (!it.reasons.includes('forced_hold_no_whitelist')) {
        it.reasons.push('forced_hold_no_whitelist')
      }
    } else if (it.allowUpdate && it.finalGrade === 'PASS') {
      // keep
    }
  }

  const finalGradeCount = { PASS: 0, NEEDS_FIX: 0, HOLD: 0, REJECT: 0 }
  for (const it of quality.items) {
    finalGradeCount[it.finalGrade] = (finalGradeCount[it.finalGrade] || 0) + 1
  }

  const whitelist = quality.items
    .filter((x) => x.allowUpdate && x.finalGrade === 'PASS' && x.newAnalysis)
    .filter((x) => !batch1.has(String(x.id)) && !truncated.has(String(x.id)))
    .map((x) => ({
      id: x.id,
      code: x.code,
      specialtyCode: x.specialtyCode,
      difficulty: x.difficulty,
      originalAnalysis: x.originalAnalysis,
      newAnalysis: x.newAnalysis,
      originalAnalysisGrade: x.originalAnalysisGrade,
      finalQualityGrade: 'PASS',
      remediations: (x.remediations || []).join(',') || 'keep_or_light_fix',
      scienceCheck: x.scienceCheck,
      answerConsistencyCheck: x.answerConsistency,
      allowUpdate: true,
      updateReason: 'batch2_phase1_final_pass_analysis_only',
      checksumOriginal: x.checksumOriginal || sha256(x.originalAnalysis),
      checksumNew: x.checksumNew || sha256(x.newAnalysis),
      protection: {
        fieldsAllowed: ['analysis'],
        fieldsForbidden: [
          'stem',
          'options_json',
          'answer',
          'difficulty',
          'qtype',
          'answer_type',
          'specialty_id',
          'category_id',
          'pool',
          'status',
          'is_active',
          'gate_note',
        ],
      },
    }))

  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const backupRows = []
  for (const w of whitelist) {
    const [[live]] = await conn.query(
      `SELECT id, code, analysis FROM chem_train_items WHERE id=? LIMIT 1`,
      [w.id],
    )
    backupRows.push({
      id: w.id,
      code: w.code,
      analysis: live ? live.analysis : null,
      checksum: sha256(live ? live.analysis : ''),
      newAnalysisChecksum: w.checksumNew,
      backedUpAt: new Date().toISOString(),
      matchesWhitelistOriginal:
        live && String(live.analysis ?? '') === String(w.originalAnalysis ?? ''),
    })
  }
  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[trainable]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[s60]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE code LIKE 'train.ai_trial.s60.%' OR IFNULL(gate_note,'') LIKE '%[s60]%'`,
  )

  fs.writeFileSync(
    path.join(BACKUP_DIR, 'backup_manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonlyPhase: true,
        noDbWriteYet: true,
        whitelistCount: whitelist.length,
        bankStats: {
          totalItems: Number(tot.n),
          formalApprovedActive: Number(formal.n),
          testTrainableApprox: Number(trainable.n),
          s60Count: Number(s60.n),
        },
        items: backupRows,
      },
      null,
      2,
    ),
    'utf8',
  )
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'original_analyses.json'),
    JSON.stringify(backupRows, null, 2),
    'utf8',
  )

  let wouldUpdate = 0
  let skipCount = 0
  let conflictCount = 0
  const dryRunItems = []
  for (const w of whitelist) {
    const [[live]] = await conn.query(
      `SELECT id, code, analysis, gate_note FROM chem_train_items WHERE id=? LIMIT 1`,
      [w.id],
    )
    const idOk = live && String(live.id) === String(w.id)
    const codeOk = live && live.code === w.code
    const analysisMatch = live && String(live.analysis ?? '') === String(w.originalAnalysis ?? '')
    const alreadyNew = live && String(live.analysis ?? '') === String(w.newAnalysis ?? '')
    const s60block = isS60(live && live.code, live && live.gate_note)
    let decision = 'WOULD_UPDATE'
    let reason = null
    if (!idOk || !codeOk) {
      decision = 'SKIP'
      reason = 'id_or_code_mismatch'
      conflictCount++
      skipCount++
    } else if (s60block || truncated.has(String(w.id)) || batch1.has(String(w.id))) {
      decision = 'SKIP'
      reason = 'hard_exclude'
      skipCount++
    } else if (alreadyNew) {
      decision = 'SKIP_IDEMPOTENT'
      reason = 'already_new_analysis'
      skipCount++
    } else if (!analysisMatch) {
      decision = 'SKIP_CONFLICT'
      reason = 'current_analysis_differs_from_backup'
      conflictCount++
      skipCount++
    } else {
      wouldUpdate++
    }
    dryRunItems.push({
      id: w.id,
      code: w.code,
      originalAnalysis: w.originalAnalysis,
      newAnalysis: w.newAnalysis,
      finalQualityGrade: 'PASS',
      scienceCheck: w.scienceCheck,
      dbMatchesBackup: analysisMatch,
      allowUpdate: decision === 'WOULD_UPDATE',
      dryRunDecision: decision,
      skipReason: reason,
    })
  }

  quality.finalGradeCount = finalGradeCount
  quality.whitelistCount = whitelist.length
  quality.holdFixAppliedAt = new Date().toISOString()
  quality.forcedHoldCount = forcedHold
  fs.writeFileSync(path.join(OUT, 'quality_results.json'), JSON.stringify(quality, null, 2), 'utf8')

  fs.writeFileSync(
    path.join(OUT, 'whitelist.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        noDbWriteYet: true,
        count: whitelist.length,
        updateFieldOnly: 'analysis',
        holdExcluded: forcedHold,
        items: whitelist,
      },
      null,
      2,
    ),
    'utf8',
  )

  fs.writeFileSync(
    path.join(OUT, 'dryrun.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        noDbWrite: true,
        stats: {
          whitelistCount: whitelist.length,
          wouldUpdate,
          skipCount,
          conflictCount,
        },
        whitelistDryRun: dryRunItems,
        excludedCount: quality.items.length - whitelist.length,
      },
      null,
      2,
    ),
    'utf8',
  )

  const summary = JSON.parse(fs.readFileSync(path.join(OUT, 'summary.json'), 'utf8'))
  summary.finalGradeCount = finalGradeCount
  summary.whitelistCount = whitelist.length
  summary.dryRun = { wouldUpdate, skipCount, conflictCount }
  summary.holdFix = { forcedHold, note: 'HOLD/DeepSeek science-answer risk excluded from whitelist' }
  summary.generatedAt = new Date().toISOString()
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8')

  console.log(
    JSON.stringify(
      {
        forcedHold,
        finalGradeCount,
        whitelistCount: whitelist.length,
        wouldUpdate,
        conflictCount,
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
