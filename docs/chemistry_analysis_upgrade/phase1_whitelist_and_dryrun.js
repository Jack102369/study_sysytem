'use strict'
/**
 * 第一阶段（无写库）：
 * - 终复核 PASS / 整改 NEEDS_FIX / 重写 HOLD49&248 / 排除215&250
 * - 建立 first_update_quality_results / whitelist
 * - 备份白名单题当前 DB analysis
 * - 只读干跑报告
 *
 * node docs/chemistry_analysis_upgrade/phase1_whitelist_and_dryrun.js
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const ROOT = path.resolve(__dirname, '../..')
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
const rewrites = require('./rewrites_by_id')

const OUT = __dirname
const BACKUP_DIR = path.join(OUT, 'first_update_backup')

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

/** 终检：解析是否可 PASS */
function finalCheck(item, analysis, meta) {
  const reasons = []
  const risks = []
  const stem = String(item.stem || '')
  const answer = String(item.answer || '')
  const text = String(analysis || '').trim()

  if (!text || text.length < 30) {
    return { grade: 'REJECT', reasons: ['too_thin'], risks, allowUpdate: false }
  }
  if (!text.includes(answer) && !(answer === '正确' && /正确/.test(text)) && !(answer === '错误' && /错误/.test(text))) {
    reasons.push('answer_not_reflected')
  }
  if (/正确答案应改为|标准答案有误/.test(text)) {
    return { grade: 'HOLD', reasons: ['tries_change_answer'], risks: ['ANSWER_MISMATCH'], allowUpdate: false }
  }
  // 题干过空：无法建立可靠化学判断
  if (meta.forceExclude) {
    return {
      grade: 'HOLD',
      reasons: meta.excludeReasons || ['stem_risk'],
      risks: meta.riskFlags || ['AMBIGUOUS'],
      allowUpdate: false,
    }
  }
  // 焦点错位粗检
  if (/属于氧化还原/.test(stem) && /还原剂的判断|氧化剂的判断/.test(text) && !/化合价/.test(text)) {
    reasons.push('focus_mismatch_redox_judge')
  }
  if (/电解质是在水溶液/.test(stem) && /拆写|离子方程式/.test(text)) {
    reasons.push('focus_mismatch_electrolyte')
  }
  if (/蔗糖是电解质/.test(stem) && /拆写|离子方程式/.test(text)) {
    reasons.push('focus_mismatch_sucrose')
  }
  if (/22\.4.*任何温度|任何温度和压强/.test(stem) && /过量|求 n →/.test(text)) {
    reasons.push('focus_mismatch_stp')
  }
  if (/Fe2\+|Fe²\+|KSCN/.test(stem) && !/Fe3\+|Fe³\+|血红|SCN/.test(text)) {
    reasons.push('fe_scn_incomplete')
  }

  // Fe2+/KSCN 科学硬检
  if (String(item.id) === '248') {
    if (/Fe2\+.*KSCN.*血红|Fe²\+.*直接.*血红/.test(text) && !/不会|不能|看不到|不出现/.test(text)) {
      risks.push('SCIENCE_RISK')
      reasons.push('fe2_kscn_false_positive_claimed')
    }
    if (!/Fe3\+|Fe³\+/.test(text)) {
      reasons.push('missing_fe3_contrast')
    }
  }

  if (reasons.includes('answer_not_reflected') || reasons.includes('focus_mismatch_redox_judge') || reasons.includes('focus_mismatch_electrolyte') || reasons.includes('focus_mismatch_sucrose') || reasons.includes('focus_mismatch_stp') || reasons.includes('fe_scn_incomplete') || reasons.includes('fe2_kscn_false_positive_claimed') || reasons.includes('missing_fe3_contrast')) {
    return { grade: 'NEEDS_FIX', reasons, risks, allowUpdate: false }
  }

  // 原题风险
  if (meta.itemRisk) {
    return {
      grade: 'HOLD',
      reasons: ['item_risk_' + meta.itemRisk],
      risks: [meta.itemRisk],
      allowUpdate: false,
    }
  }

  return { grade: 'PASS', reasons: reasons.length ? reasons : ['final_ok'], risks, allowUpdate: true }
}

function polishPassIfNeeded(item, cand) {
  // 对事实判断题：若候选已含题干要点且含正确答案，可微调易错点
  const stem = String(item.stem || '')
  let text = String(cand || '')
  // 309 must not use cand
  if (String(item.id) === '309') return null
  // 强化两性铝题易错点
  if (String(item.id) === '204' && /Al、Al2O3/.test(stem)) {
    text = [
      '【正确答案】正确',
      '【为什么正确】Al、Al2O3、Al(OH)3 都能与强酸、强碱反应，表现出两性相关性质。例如 Al 与 NaOH 溶液反应生成偏铝酸盐并放出 H2；Al(OH)3 既能溶于强酸也能溶于强碱。题干判断正确。',
      '【易错点】误以为只有 Al(OH)3 两性而忽略 Al、Al2O3；或否认 Al 能与强碱反应。',
    ].join('\n')
    return { analysis: text, note: 'polish_pass_amphoterism' }
  }
  if (String(item.id) === '234') {
    text = [
      '【正确答案】正确',
      '【为什么正确】书面评价实验方案通常按：目的是否明确→原理是否可行→试剂与仪器是否匹配→步骤顺序是否合理（如先检查气密性）→现象能否支持结论→安全与尾气/废液处理是否妥当。比较方案时还要看干扰、可操作性与试剂用量是否合适。题干概括正确。',
      '【易错点】只看试剂名称，不检查步骤顺序与安全；或把「能得到现象」当成方案一定正确。',
    ].join('\n')
    return { analysis: text, note: 'polish_pass_exp_design' }
  }
  return { analysis: text, note: 'keep_candidate_after_review' }
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const candidates = JSON.parse(
    fs.readFileSync(path.join(OUT, 'sample50_candidates.json'), 'utf8'),
  )
  const qualityOld = JSON.parse(
    fs.readFileSync(path.join(OUT, 'sample50_quality_results.json'), 'utf8'),
  )
  const oldMap = Object.fromEntries(qualityOld.items.map((x) => [String(x.id), x]))

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const ids = candidates.items.map((x) => x.id)
  const [dbRows] = await conn.query(
    `SELECT id, code, stem, options_json, answer, analysis, difficulty, qtype, answer_type,
            specialty_id, category_id, pool, status, is_active, gate_note
     FROM chem_train_items WHERE id IN (?)`,
    [ids],
  )
  const dbMap = Object.fromEntries(dbRows.map((r) => [String(r.id), r]))

  // 题库统计快照
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
  const [byDiff] = await conn.query(
    `SELECT difficulty, COUNT(*) n FROM chem_train_items WHERE pool='test' AND is_active=1 GROUP BY difficulty`,
  )

  const FORCE_EXCLUDE = {
    '215': {
      reason: 'stem_incomplete_ambiguous',
      detail: '题干「V用溶剂体积」残缺，无法构成可可靠判断的化学命题；禁止仅靠解析掩盖',
      risk: 'AMBIGUOUS',
    },
    '250': {
      reason: 'stem_too_vague',
      detail: '题干仅「递变顺序记反」，未给出具体卤素/递变内容，条件不足；排除更新',
      risk: 'AMBIGUOUS',
    },
  }

  const finalItems = []
  const riskExtra = []

  for (const cand of candidates.items) {
    const id = String(cand.id)
    const db = dbMap[id]
    const oldQ = oldMap[id]
    if (!db) {
      finalItems.push({
        id,
        code: cand.code,
        finalGrade: 'HOLD',
        allowUpdate: false,
        reasons: ['missing_in_db'],
      })
      continue
    }

    if (isS60(db.code, db.gate_note)) {
      finalItems.push({
        id,
        code: db.code,
        finalGrade: 'HOLD',
        allowUpdate: false,
        reasons: ['s60_hard_exclude'],
        originalAnalysis: db.analysis,
      })
      continue
    }

    // 快照一致性：候选文件中的原 analysis 应与当前 DB 一致（否则标记冲突，但仍可评估文本）
    const snapshotMatch = String(db.analysis ?? '') === String(cand.originalAnalysis ?? '')

    let newAnalysis = null
    let sourceNote = ''
    let previousGrade = oldQ ? oldQ.grade : 'UNKNOWN'

    if (FORCE_EXCLUDE[id]) {
      const ex = FORCE_EXCLUDE[id]
      riskExtra.push({ id, code: db.code, risks: [ex.risk], note: ex.detail })
      finalItems.push({
        id,
        code: db.code,
        specialtyCode: cand.specialtyCode,
        previousGrade,
        finalGrade: 'HOLD',
        allowUpdate: false,
        excludeReason: ex.reason,
        excludeDetail: ex.detail,
        originalAnalysis: db.analysis,
        newAnalysis: null,
        originalAnalysisGrade: cand.originalAnalysisGrade,
        scienceCheck: 'ITEM_RISK_NOT_ANALYSIS_ONLY',
        answerConsistency: 'N/A_EXCLUDED',
        snapshotMatch,
        stem: db.stem,
        answer: db.answer,
        difficulty: db.difficulty,
        reasons: [ex.reason],
        riskFlags: [ex.risk],
        rewriteAction: 'excluded',
      })
      continue
    }

    if (rewrites[id]) {
      newAnalysis = rewrites[id].analysis
      sourceNote = rewrites[id].note
    } else {
      const polished = polishPassIfNeeded(cand, cand.candidateAnalysis)
      newAnalysis = polished ? polished.analysis : cand.candidateAnalysis
      sourceNote = polished ? polished.note : 'keep_candidate'
    }

    const check = finalCheck(
      { id, stem: db.stem, answer: db.answer },
      newAnalysis,
      { forceExclude: false },
    )

    // 额外：原题科学性——本批题干可读且答案为既定标准答案时记 OK；不做改答案
    let scienceCheck = 'OK_WITH_GIVEN_ANSWER'
    if (check.risks.includes('SCIENCE_RISK')) scienceCheck = 'FAIL_SCIENCE'
    if (check.grade === 'HOLD' && check.reasons.some((r) => String(r).startsWith('item_risk'))) {
      scienceCheck = 'ITEM_RISK'
    }

    let answerConsistency = 'OK'
    if (check.reasons.includes('answer_not_reflected')) answerConsistency = 'FAIL'
    if (check.grade === 'PASS') answerConsistency = 'OK'

    const allow =
      check.grade === 'PASS' &&
      check.allowUpdate &&
      !isS60(db.code, db.gate_note) &&
      snapshotMatch

    const row = {
      id,
      code: db.code,
      specialtyCode: cand.specialtyCode,
      specialtyName: cand.specialtyName,
      categoryCode: cand.categoryCode,
      categoryName: cand.categoryName,
      difficulty: Number(db.difficulty),
      qtype: db.qtype,
      stem: db.stem,
      options: cand.options,
      answer: db.answer,
      previousGrade,
      originalAnalysisGrade: cand.originalAnalysisGrade,
      originalAnalysis: db.analysis,
      newAnalysis,
      finalGrade: allow ? 'PASS' : check.grade === 'PASS' && !snapshotMatch ? 'HOLD' : check.grade,
      allowUpdate: allow,
      blockReason: allow
        ? null
        : !snapshotMatch
          ? 'snapshot_conflict_original_analysis_changed'
          : check.grade !== 'PASS'
            ? 'final_grade_' + check.grade
            : 'not_allowed',
      scienceCheck,
      answerConsistency,
      snapshotMatch,
      reasons: [
        ...(check.reasons || []),
        sourceNote ? 'source:' + sourceNote : null,
        !snapshotMatch ? 'db_analysis_differs_from_candidate_snapshot' : null,
      ].filter(Boolean),
      riskFlags: check.risks || [],
      rewriteAction: rewrites[id] ? rewrites[id].action : sourceNote,
      checksumOriginal: sha256(db.analysis),
      checksumNew: sha256(newAnalysis),
    }

    // 若科学检查失败则强制不可更新
    if (scienceCheck === 'FAIL_SCIENCE') {
      row.allowUpdate = false
      row.finalGrade = 'HOLD'
      row.blockReason = 'science_fail'
    }

    finalItems.push(row)
  }

  const gradeCount = { PASS: 0, NEEDS_FIX: 0, HOLD: 0, REJECT: 0 }
  for (const it of finalItems) {
    gradeCount[it.finalGrade] = (gradeCount[it.finalGrade] || 0) + 1
  }

  const whitelist = finalItems
    .filter((x) => x.allowUpdate && x.finalGrade === 'PASS' && x.newAnalysis)
    .map((x) => ({
      id: x.id,
      code: x.code,
      specialtyCode: x.specialtyCode,
      difficulty: x.difficulty,
      originalAnalysis: x.originalAnalysis,
      newAnalysis: x.newAnalysis,
      originalAnalysisGrade: x.originalAnalysisGrade,
      finalQualityGrade: 'PASS',
      remediations: x.rewriteAction,
      scienceCheck: x.scienceCheck,
      answerConsistencyCheck: x.answerConsistency,
      allowUpdate: true,
      updateReason: 'phase1_final_pass_analysis_only',
      checksumOriginal: x.checksumOriginal,
      checksumNew: x.checksumNew,
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
    const db = dbMap[w.id]
    backupRows.push({
      id: w.id,
      code: w.code,
      analysis: db.analysis,
      checksum: sha256(db.analysis),
      newAnalysisChecksum: w.checksumNew,
      backedUpAt: new Date().toISOString(),
    })
  }
  const backupMeta = {
    generatedAt: new Date().toISOString(),
    readonlyPhase: true,
    noDbWriteYet: true,
    whitelistCount: whitelist.length,
    bankStats: {
      totalItems: Number(tot.n),
      formalApprovedActive: Number(formal.n),
      testTrainableApprox: Number(trainable.n),
      s60Count: Number(s60.n),
      testByDifficulty: byDiff,
    },
    items: backupRows,
  }
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'backup_manifest.json'),
    JSON.stringify(backupMeta, null, 2),
    'utf8',
  )
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'original_analyses.json'),
    JSON.stringify(backupRows, null, 2),
    'utf8',
  )

  // 干跑：再读库核对（只读）
  const dryRunItems = []
  let conflictCount = 0
  let wouldUpdate = 0
  let skipCount = 0
  for (const w of whitelist) {
    const [[live]] = await conn.query(
      `SELECT id, code, analysis FROM chem_train_items WHERE id=? LIMIT 1`,
      [w.id],
    )
    const idOk = live && String(live.id) === w.id
    const codeOk = live && live.code === w.code
    const analysisMatch = live && String(live.analysis ?? '') === String(w.originalAnalysis ?? '')
    const alreadyNew = live && String(live.analysis ?? '') === String(w.newAnalysis ?? '')
    const s60block = isS60(live && live.code, '')
    let decision = 'WOULD_UPDATE'
    let reason = null
    if (!idOk || !codeOk) {
      decision = 'SKIP'
      reason = 'id_or_code_mismatch'
      conflictCount++
      skipCount++
    } else if (s60block) {
      decision = 'SKIP'
      reason = 's60_exclude'
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

  // 非白名单也输出干跑说明行
  const excludedDry = finalItems
    .filter((x) => !x.allowUpdate)
    .map((x) => ({
      id: x.id,
      code: x.code,
      originalAnalysis: x.originalAnalysis,
      newAnalysis: x.newAnalysis,
      finalQualityGrade: x.finalGrade,
      scienceCheck: x.scienceCheck || 'N/A',
      dbMatchesBackup: x.snapshotMatch,
      allowUpdate: false,
      dryRunDecision: 'EXCLUDED',
      skipReason: x.blockReason || x.excludeReason || x.reasons?.[0],
    }))

  const qualityOut = {
    generatedAt: new Date().toISOString(),
    phase: 'first_update_prep_no_db_write',
    previousSample50Grades: qualityOld.gradeCount,
    finalGradeCount: gradeCount,
    whitelistCount: whitelist.length,
    excludedCount: finalItems.length - whitelist.length,
    forceExcluded: FORCE_EXCLUDE,
    items: finalItems,
  }
  fs.writeFileSync(
    path.join(OUT, 'first_update_quality_results.json'),
    JSON.stringify(qualityOut, null, 2),
    'utf8',
  )
  fs.writeFileSync(
    path.join(OUT, 'first_update_whitelist.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        noDbWriteYet: true,
        count: whitelist.length,
        updateFieldOnly: 'analysis',
        items: whitelist,
      },
      null,
      2,
    ),
    'utf8',
  )

  const dryRun = {
    generatedAt: new Date().toISOString(),
    mode: 'DRY_RUN_READONLY',
    willNotExecuteUpdate: true,
    stats: {
      candidate50: finalItems.length,
      finalPass: gradeCount.PASS,
      finalNeedsFix: gradeCount.NEEDS_FIX || 0,
      finalHold: gradeCount.HOLD || 0,
      finalReject: gradeCount.REJECT || 0,
      whitelistCount: whitelist.length,
      excludedCount: finalItems.length - whitelist.length,
      wouldUpdate,
      skipCount,
      conflictCount,
      bankTotal: Number(tot.n),
      trainable: Number(trainable.n),
      formal: Number(formal.n),
      s60: Number(s60.n),
    },
    forceExcluded: FORCE_EXCLUDE,
    riskExtra,
    whitelistDryRun: dryRunItems,
    excluded: excludedDry,
  }
  fs.writeFileSync(path.join(OUT, 'first_update_dryrun.json'), JSON.stringify(dryRun, null, 2), 'utf8')
  fs.writeFileSync(
    path.join(OUT, 'first_update_verify.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: '写库后核验文件占位；本阶段未写库',
        pendingDbUpdate: true,
        whitelistCount: whitelist.length,
      },
      null,
      2,
    ),
    'utf8',
  )

  // 人类可读干跑报告
  const md = []
  md.push('# 首批50道解析更新 · 第一阶段干跑报告（未写库）')
  md.push('')
  md.push(`> 生成时间：${dryRun.generatedAt}`)
  md.push('> **本阶段未执行任何数据库 UPDATE。**')
  md.push('')
  md.push('## 一、最终质量统计')
  md.push('')
  md.push('| 项 | 数量 |')
  md.push('|----|------|')
  md.push(`| 候选总数 | ${dryRun.stats.candidate50} |`)
  md.push(`| 最终 PASS | **${dryRun.stats.finalPass}** |`)
  md.push(`| 最终 NEEDS_FIX | ${dryRun.stats.finalNeedsFix} |`)
  md.push(`| 最终 HOLD | ${dryRun.stats.finalHold} |`)
  md.push(`| 最终 REJECT | ${dryRun.stats.finalReject} |`)
  md.push(`| 更新白名单 | **${dryRun.stats.whitelistCount}** |`)
  md.push(`| 排除 | ${dryRun.stats.excludedCount} |`)
  md.push(`| 干跑预计 UPDATE | **${dryRun.stats.wouldUpdate}** |`)
  md.push(`| 干跑跳过 | ${dryRun.stats.skipCount} |`)
  md.push(`| 数据冲突 | ${dryRun.stats.conflictCount} |`)
  md.push(`| 题库总数 / 可训练 / formal / s60 | ${dryRun.stats.bankTotal} / ${dryRun.stats.trainable} / ${dryRun.stats.formal} / ${dryRun.stats.s60} |`)
  md.push('')
  md.push('## 二、强制排除（原题风险）')
  md.push('')
  for (const [id, ex] of Object.entries(FORCE_EXCLUDE)) {
    md.push(`- **ID ${id}**：${ex.detail}`)
  }
  md.push('')
  md.push('## 三、白名单逐题干跑（允许更新）')
  md.push('')
  for (const it of dryRunItems) {
    md.push(`### ID ${it.id} · \`${it.code}\``)
    md.push('')
    md.push(`- 最终质量等级：${it.finalQualityGrade}`)
    md.push(`- 原题科学性检查：${it.scienceCheck}`)
    md.push(`- 数据库当前值与备份一致：${it.dbMatchesBackup}`)
    md.push(`- 是否允许更新：${it.allowUpdate}`)
    md.push(`- 干跑决策：${it.dryRunDecision}${it.skipReason ? '（' + it.skipReason + '）' : ''}`)
    md.push(`- 原 analysis：`)
    md.push('')
    md.push('```')
    md.push(String(it.originalAnalysis ?? ''))
    md.push('```')
    md.push('')
    md.push(`- 新 analysis：`)
    md.push('')
    md.push('```')
    md.push(String(it.newAnalysis ?? ''))
    md.push('```')
    md.push('')
  }
  md.push('## 四、排除题目一览')
  md.push('')
  md.push('| ID | code | 最终等级 | 原因 |')
  md.push('|----|------|----------|------|')
  for (const it of excludedDry) {
    md.push(
      `| ${it.id} | ${it.code} | ${it.finalQualityGrade} | ${String(it.skipReason || '').replace(/\|/g, '/')} |`,
    )
  }
  md.push('')
  md.push('## 五、下一步')
  md.push('')
  md.push('等待你明确确认后，才执行白名单 `analysis` 字段的数据库 UPDATE。')
  md.push('')

  fs.writeFileSync(path.join(OUT, 'FIRST_UPDATE_DRYRUN_REPORT.md'), md.join('\n'), 'utf8')

  console.log(JSON.stringify(dryRun.stats, null, 2))
  console.log('Wrote whitelist', whitelist.length, 'dryrun report FIRST_UPDATE_DRYRUN_REPORT.md')
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
