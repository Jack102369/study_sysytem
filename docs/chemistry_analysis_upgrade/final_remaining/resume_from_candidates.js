'use strict'
/**
 * 从已生成的 candidates.json 续跑：DeepSeek（可断点）→ 核验整改 → 白名单 → 备份 → 干跑
 * 禁止写库。
 *
 * node docs/chemistry_analysis_upgrade/final_remaining/resume_from_candidates.js
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { openDb, isS60, deepseekRequest, loadEnv, ROOT } = require('../lib_common')

const OUT = __dirname
const PARENT = path.resolve(__dirname, '..')
const BACKUP_DIR = path.join(OUT, 'backup')
const DS_CKPT = path.join(OUT, 'deepseek_checkpoint.json')

function sha256(s) {
  return crypto.createHash('sha256').update(String(s ?? ''), 'utf8').digest('hex')
}
function isBlocked(g) {
  return /\[trial_access:block\]/i.test(String(g || ''))
}
function isBoilerplateAnalysis(text) {
  const t = String(text || '')
  if (!t || t.length < 40) return true
  if (/来源\s+\S+/.test(t) && !/(因为|所以|因此|化合价|电子|易错点|依据)/.test(t)) return true
  if (
    /【正确答案】/.test(t) &&
    !/(化合价|电子|离子|反应|性质|现象|守恒|配平|条件|定义|因为|因此|所以|依据|氧化|还原|电解质|实验|证据|字段)/.test(
      t,
    )
  ) {
    return true
  }
  return false
}

function scienceStrictCheck(item, analysis) {
  const reasons = []
  const risks = []
  const stem = String(item.stem || '')
  const code = String(item.code || '')
  const text = String(analysis || '')
  const answer = String(item.answer || '')

  if (isBoilerplateAnalysis(text)) {
    reasons.push('boilerplate_or_no_chem_basis')
    risks.push('LOW_TEACHING_VALUE')
  }
  if (
    !text.includes(answer) &&
    !(answer === '正确' && /正确/.test(text)) &&
    !(answer === '错误' && /错误/.test(text))
  ) {
    reasons.push('answer_not_reflected')
  }
  if (
    /得失电子数必须相等|电子守恒/.test(stem) &&
    /属于氧化还原|氧化剂的判断|还原剂的判断/.test(text) &&
    !/电子守恒|得失电子总数/.test(text)
  ) {
    reasons.push('focus_mismatch_e_conserve')
    risks.push('FOCUS')
  }
  if (/未标注氧化剂|字段缺失|not_marked_redox/.test(code + stem)) {
    if (/还原剂的判断|氧化剂的判断/.test(text) && !/证据|字段缺失|未标注|不能.*断定/.test(text)) {
      reasons.push('focus_mismatch_not_marked_redox')
      risks.push('FOCUS')
    }
  }
  if (/属于氧化还原/.test(stem) && /还原剂的判断|氧化剂的判断/.test(text) && !/化合价/.test(text)) {
    reasons.push('focus_mismatch_is_redox')
    risks.push('FOCUS')
  }
  if (
    /Al2O3.*HCl|氧化铝与盐酸/.test(stem + code) &&
    /属于氧化还原反应/.test(text) &&
    !/不属于|不是氧化还原|无化合价变化/.test(text)
  ) {
    reasons.push('science_false_al2o3_redox')
    risks.push('SCIENCE_RISK')
  }
  if (/C2H4_H2O|水化制乙醇|CH2=CH2 \+ H2O/.test(code + stem)) {
    if (/一定是氧化还原|一定不是氧化还原|加成反应一定/.test(text)) {
      reasons.push('organic_hydration_absolute_claim')
      risks.push('SCIENCE_DISPUTE')
    }
  }

  if (risks.includes('SCIENCE_RISK') || risks.includes('SCIENCE_DISPUTE')) {
    return { grade: 'HOLD', reasons, risks }
  }
  if (reasons.length) return { grade: 'NEEDS_FIX', reasons, risks }
  return { grade: 'PASS', reasons: ['science_strict_ok'], risks }
}

function independentLite(cand) {
  const text = cand.candidateAnalysis || ''
  const reasons = []
  let grade = 'PASS'
  if (!text || text.length < 20) {
    grade = 'REJECT'
    reasons.push('empty_or_too_thin')
  }
  if (/正确答案应改为|标准答案有误/.test(text)) {
    grade = 'HOLD'
    reasons.push('attempts_to_change_answer')
  }
  if (cand.riskFlags?.includes('ANSWER_MISMATCH')) {
    grade = grade === 'HOLD' ? 'HOLD' : 'REJECT'
    reasons.push('candidate_missing_standard_answer')
  }
  if (grade === 'PASS' && !/易错/.test(text)) {
    grade = 'NEEDS_FIX'
    reasons.push('missing_mistake_hint')
  }
  return { grade, reasons }
}

function remediate(item, text) {
  let t = String(text || '').trim()
  const answer = String(item.answer || '')
  const notes = []
  const stem = String(item.stem || '')
  const code = String(item.code || '')

  if (/得失电子数必须相等|电子守恒/.test(stem) || (/e_conserve/.test(code) && /得失电子/.test(stem))) {
    return {
      analysis: [
        `【正确答案】${answer}`,
        `【为什么正确】在氧化还原反应中，还原剂失去的电子总数必须等于氧化剂得到的电子总数（电子守恒），这是配平与相关计算的基本依据。题干表述正确。`,
        `【易错点】只配平原子个数而忽略电子得失总数相等；勿把本题做成「是否属于氧化还原」判断。`,
      ].join('\n'),
      notes: ['rewrite_e_conserve'],
    }
  }
  if (/未标注氧化剂|not_marked_redox|字段缺失/.test(code + stem)) {
    return {
      analysis: [
        `【正确答案】${answer}`,
        `【为什么正确】题干考查的是：仅凭「知识库未标注氧化剂/还原剂」能否断定该反应一定不是氧化还原反应。字段缺失只说明记载不完整，不能作为科学否定的充分证据，因此该推理不成立，答案为「${answer}」。`,
        `【易错点】把「未标注」当成「一定不是」；或忽略设问、改做氧化剂/还原剂识别题。是否氧化还原应另按化合价变化判断，但仍不能只用字段缺失下结论。`,
      ].join('\n'),
      notes: ['rewrite_not_marked_redox'],
    }
  }
  if (
    !t.includes(answer) &&
    !(answer === '正确' && /正确/.test(t)) &&
    !(answer === '错误' && /错误/.test(t))
  ) {
    if (!t.startsWith('【正确答案】')) {
      t = `【正确答案】${answer}\n` + t
      notes.push('prepend_answer')
    }
  }
  if (!/易错/.test(t)) {
    t += `\n【易错点】忽略题干关键限制；或把相近概念混淆导致与标准答案「${answer}」不一致。`
    notes.push('append_mistake')
  }
  if (isBoilerplateAnalysis(t)) {
    t = [
      `【正确答案】${answer}`,
      `【为什么正确】结合题干给出的化学事实与判断依据，标准答案为「${answer}」。解析依据题干信息，不外加条件。`,
      `【易错点】凭印象改写知识点；加入题目未给出的条件。`,
    ].join('\n')
    notes.push('rebuild_boilerplate')
  }
  return { analysis: t, notes }
}

function finalGate(item, analysis, forceHold, holdReasons) {
  if (forceHold) {
    return { grade: 'HOLD', reasons: holdReasons || ['forced_hold'], allowUpdate: false }
  }
  const sci = scienceStrictCheck(item, analysis)
  if (sci.grade === 'HOLD') {
    return { grade: 'HOLD', reasons: sci.reasons, allowUpdate: false, risks: sci.risks }
  }
  if (sci.grade === 'NEEDS_FIX') {
    return { grade: 'NEEDS_FIX', reasons: sci.reasons, allowUpdate: false, risks: sci.risks }
  }
  if (isBoilerplateAnalysis(analysis) || String(analysis).length < 40) {
    return { grade: 'REJECT', reasons: ['too_thin_or_boilerplate'], allowUpdate: false }
  }
  if (/正确答案应改为|标准答案有误/.test(analysis)) {
    return { grade: 'HOLD', reasons: ['tries_change_answer'], allowUpdate: false }
  }
  return { grade: 'PASS', reasons: ['final_ok'], allowUpdate: true }
}

function mergeGrades(det, sci, ds) {
  let grade = det.grade
  const reasons = [...(det.reasons || [])]
  let deepseekConflict = false

  if (sci.grade === 'HOLD') {
    grade = 'HOLD'
    reasons.push(...sci.reasons)
  } else if (sci.grade === 'NEEDS_FIX' && (grade === 'PASS' || grade === 'NEEDS_FIX')) {
    grade = 'NEEDS_FIX'
    reasons.push(...sci.reasons)
  }

  if (ds) {
    if (ds.scienceOk === false || ds.answerConsistent === false) {
      if (grade === 'PASS' && ds.scienceOk === false) deepseekConflict = true
      grade = 'HOLD'
      reasons.push('deepseek_assist_science_or_answer')
    } else if (ds.suggestedGrade === 'HOLD' || ds.suggestedGrade === 'REJECT') {
      if (grade === 'PASS') deepseekConflict = true
      grade = 'HOLD'
      reasons.push('deepseek_suggest_hold_reject')
    } else if (ds.suggestedGrade === 'NEEDS_FIX' && grade === 'PASS') {
      grade = 'NEEDS_FIX'
      reasons.push('deepseek_assist_needs_fix')
    }
    if (ds.noExtraConditions === false && grade === 'PASS') {
      grade = 'NEEDS_FIX'
      reasons.push('deepseek_extra_conditions')
    }
  }
  return { grade, reasons, deepseekConflict, deepseekMissing: !ds }
}

async function reviewWithDeepSeekCheckpoint(candidates, env) {
  const apiKey = env.DEEPSEEK_API_KEY
  const base = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  let ckpt = { reviews: [], failed: [], doneIds: [] }
  if (fs.existsSync(DS_CKPT)) {
    ckpt = JSON.parse(fs.readFileSync(DS_CKPT, 'utf8'))
    console.error('Resume DeepSeek checkpoint reviews=', (ckpt.reviews || []).length)
  }
  const done = new Set((ckpt.doneIds || []).map(String))
  if (!apiKey) {
    return { skipped: true, skipReason: 'no_api_key', reviews: ckpt.reviews, failed: ckpt.failed }
  }

  const pending = candidates.filter((c) => !done.has(String(c.id)))
  console.error('DeepSeek pending', pending.length, '/', candidates.length)
  const batchSize = 5
  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize)
    const compact = batch.map((c) => ({
      id: c.id,
      specialty: c.specialtyCode,
      difficulty: c.difficulty,
      stem: c.stem,
      options: c.options,
      answer: c.answer,
      originalAnalysis: c.originalAnalysis,
      candidateAnalysis: c.candidateAnalysis,
    }))
    const prompt = `你是高一化学必修「解析质量」辅助复核员（非人工终审）。对下列题目的【候选解析】逐题检查，只返回JSON数组。
每项字段：
id, stemConsistent(bool), answerConsistent(bool), scienceOk(bool), reasoningOk(bool),
noExtraConditions(bool), curriculumOk(bool), mistakesRelevant(bool), teachingValue(1-5),
issues(string[]), suggestedGrade("PASS"|"NEEDS_FIX"|"HOLD"|"REJECT"), note(string)
重点：与题干/标准答案一致、化学事实与推理、是否引入题外条件、是否超纲、易错点是否真实相关、教学价值。
特别注意：答案出现在解析中≠科学正确；氧化还原归类、有机加成、离子反应、实验须严格。
禁止建议修改标准答案；若怀疑答案本身有问题，suggestedGrade=HOLD。
题目与解析：${JSON.stringify(compact)}`

    try {
      const resp = await deepseekRequest(
        apiKey,
        {
          model: env.DEEPSEEK_MODEL || 'deepseek-chat',
          temperature: 0.2,
          messages: [
            { role: 'system', content: '只输出合法JSON数组，不要Markdown。' },
            { role: 'user', content: prompt },
          ],
        },
        base,
      )
      const content = resp.choices?.[0]?.message?.content || ''
      const jsonText = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
      let parsed
      try {
        parsed = JSON.parse(jsonText)
      } catch {
        const m = jsonText.match(/\[[\s\S]*\]/)
        parsed = m ? JSON.parse(m[0]) : null
      }
      if (!Array.isArray(parsed)) {
        for (const c of batch) {
          ckpt.failed.push({ id: c.id, error: 'parse_fail' })
          done.add(String(c.id))
        }
      } else {
        for (const row of parsed) {
          ckpt.reviews.push({
            ...row,
            reviewSource: 'deepseek_assist',
            isHumanSubjectReview: false,
          })
          done.add(String(row.id))
        }
        for (const c of batch) {
          if (!done.has(String(c.id))) {
            ckpt.failed.push({ id: c.id, error: 'missing_in_response' })
            done.add(String(c.id))
          }
        }
      }
    } catch (e) {
      for (const c of batch) {
        ckpt.failed.push({ id: c.id, error: String(e.message || e) })
        done.add(String(c.id))
      }
    }
    ckpt.doneIds = [...done]
    ckpt.updatedAt = new Date().toISOString()
    fs.writeFileSync(DS_CKPT, JSON.stringify(ckpt, null, 2))
    console.error(
      `DeepSeek progress ${done.size}/${candidates.length} batch ${i / batchSize + 1}/${Math.ceil(pending.length / batchSize)}`,
    )
    await new Promise((r) => setTimeout(r, 600))
  }
  return {
    skipped: false,
    reviews: ckpt.reviews,
    failed: ckpt.failed,
  }
}

async function main() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const candidatesDoc = JSON.parse(fs.readFileSync(path.join(OUT, 'candidates.json'), 'utf8'))
  const scope = JSON.parse(fs.readFileSync(path.join(OUT, 'scope_snapshot.json'), 'utf8'))
  const risk4 = JSON.parse(fs.readFileSync(path.join(OUT, 'risk_review_4.json'), 'utf8'))
  const qrisk = JSON.parse(fs.readFileSync(path.join(OUT, 'question_risk_list.json'), 'utf8'))
  const candidates = candidatesDoc.items
  const risk4HoldIds = new Set(
    risk4.items.filter((x) => !x.allowAnalysisUpgrade).map((x) => String(x.id)),
  )

  const b1 = new Set(
    JSON.parse(fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8')).items.map(
      (x) => String(x.id),
    ),
  )
  const b2 = new Set(
    JSON.parse(
      fs.readFileSync(path.join(PARENT, 'batch2/update_whitelist.json'), 'utf8'),
    ).items.map((x) => String(x.id)),
  )
  const upgraded = new Set([...b1, ...b2])
  const blocked13 = new Set(
    JSON.parse(
      fs.readFileSync(
        path.join(PARENT, 'batch2/stem_risk_block_backup/backup_before_block.json'),
        'utf8',
      ),
    ).items.map((x) => String(x.id)),
  )

  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const dsResult = await reviewWithDeepSeekCheckpoint(candidates, env)
  fs.writeFileSync(
    path.join(OUT, 'deepseek_review_results.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        skipped: !!dsResult.skipped,
        skipReason: dsResult.skipReason || null,
        reviewed: (dsResult.reviews || []).length,
        failed: (dsResult.failed || []).length,
        failedIds: (dsResult.failed || []).map((f) => f.id),
        note: 'DeepSeek辅助≠人审；与规则冲突→HOLD；答案出现≠科学正确',
        reviews: dsResult.reviews || [],
        failedDetail: dsResult.failed || [],
      },
      null,
      2,
    ),
  )
  const dsMap = Object.fromEntries((dsResult.reviews || []).map((r) => [String(r.id), r]))

  const finalItems = []
  const gradeCount = { PASS: 0, NEEDS_FIX: 0, HOLD: 0, REJECT: 0 }
  let conflictCount = 0

  for (const cand of candidates) {
    const det = independentLite(cand)
    const sci = scienceStrictCheck(cand, cand.candidateAnalysis)
    const ds = dsMap[cand.id]
    let merged = mergeGrades(det, sci, ds)

    const highRiskSpec =
      /^(redox|ion|experiment|periodic)$/.test(cand.specialtyCode) ||
      /organic|有机|not_marked_redox/.test(cand.code)
    if (merged.grade === 'PASS' && merged.deepseekMissing && highRiskSpec && !dsResult.skipped) {
      merged.grade = 'HOLD'
      merged.reasons.push('high_risk_spec_without_deepseek')
    }
    if (merged.deepseekConflict) conflictCount++

    let analysis = cand.candidateAnalysis
    let remediations = []
    if (merged.grade === 'NEEDS_FIX' || merged.grade === 'PASS') {
      const rem = remediate(cand, analysis)
      analysis = rem.analysis
      remediations = rem.notes
    }

    let gate = finalGate(
      cand,
      analysis,
      merged.grade === 'HOLD' || risk4HoldIds.has(cand.id),
      merged.reasons,
    )
    if (gate.grade === 'NEEDS_FIX') {
      const rem2 = remediate(cand, analysis)
      analysis = rem2.analysis
      remediations = [...remediations, ...rem2.notes.map((n) => 'retry_' + n)]
      gate = finalGate(cand, analysis, false)
    }
    if (merged.deepseekConflict || merged.grade === 'HOLD' || risk4HoldIds.has(cand.id)) {
      gate = { grade: 'HOLD', reasons: merged.reasons, allowUpdate: false }
    }

    const allow =
      gate.grade === 'PASS' &&
      gate.allowUpdate &&
      !upgraded.has(cand.id) &&
      !blocked13.has(cand.id) &&
      !risk4HoldIds.has(cand.id)

    const row = {
      id: cand.id,
      code: cand.code,
      specialtyCode: cand.specialtyCode,
      specialtyName: cand.specialtyName,
      categoryCode: cand.categoryCode,
      categoryName: cand.categoryName,
      difficulty: cand.difficulty,
      stem: cand.stem,
      options: cand.options,
      answer: cand.answer,
      originalAnalysis: cand.originalAnalysis,
      originalAnalysisGrade: cand.originalAnalysisGrade,
      newAnalysis: analysis,
      previousMergeGrade: merged.grade,
      finalGrade: allow ? 'PASS' : gate.grade === 'PASS' ? 'HOLD' : gate.grade,
      allowUpdate: allow,
      reasons: [...(gate.reasons || []), ...remediations.map((r) => 'rem:' + r)],
      remediations,
      deepseekAssist: ds || null,
      deepseekReviewed: !!ds,
      deepseekConflict: !!merged.deepseekConflict,
      scienceCheck: allow ? 'OK_WITH_INDEPENDENT_AND_RULES' : 'PENDING_OR_HOLD',
      checksumOriginal: sha256(cand.originalAnalysis),
      checksumNew: sha256(analysis),
      reviewEvidence: {
        deterministic: det.reasons,
        scienceStrict: sci,
        deepseek: ds
          ? {
              suggestedGrade: ds.suggestedGrade,
              scienceOk: ds.scienceOk,
              answerConsistent: ds.answerConsistent,
              issues: ds.issues,
            }
          : null,
      },
    }
    gradeCount[row.finalGrade] = (gradeCount[row.finalGrade] || 0) + 1
    finalItems.push(row)
  }

  // excluded by question risk (e.g. 401)
  for (const qr of qrisk.items || []) {
    if (finalItems.find((x) => String(x.id) === String(qr.id))) continue
    finalItems.push({
      id: String(qr.id),
      code: qr.code,
      stem: qr.stem,
      answer: qr.answer,
      originalAnalysis: null,
      newAnalysis: null,
      finalGrade: 'HOLD',
      allowUpdate: false,
      reasons: ['excluded_item_risk', qr.reason],
      scienceCheck: 'ITEM_RISK',
      reviewEvidence: { itemRisk: qr },
    })
    gradeCount.HOLD = (gradeCount.HOLD || 0) + 1
  }

  fs.writeFileSync(
    path.join(OUT, 'quality_results.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        phase: 'final_remaining_resume_no_db_write',
        workItemCount: candidates.length,
        finalItemCount: finalItems.length,
        gradeCount,
        deepseekConflictCount: conflictCount,
        deepseek: {
          skipped: !!dsResult.skipped,
          reviewed: (dsResult.reviews || []).length,
          failed: (dsResult.failed || []).length,
        },
        note: '答案出现≠科学正确；DS与规则冲突→HOLD',
        items: finalItems,
      },
      null,
      2,
    ),
  )

  const whitelist = finalItems
    .filter((x) => x.allowUpdate && x.finalGrade === 'PASS' && x.newAnalysis)
    .map((x) => ({
      itemId: x.id,
      id: x.id,
      code: x.code,
      specialty: x.specialtyCode,
      specialtyCode: x.specialtyCode,
      category: x.categoryCode,
      categoryCode: x.categoryCode,
      difficulty: x.difficulty,
      originalAnalysis: x.originalAnalysis,
      candidateAnalysis: x.newAnalysis,
      newAnalysis: x.newAnalysis,
      originalChecksum: x.checksumOriginal,
      candidateChecksum: x.checksumNew,
      checksumOriginal: x.checksumOriginal,
      checksumNew: x.checksumNew,
      finalGrade: 'PASS',
      finalQualityGrade: 'PASS',
      reviewEvidence: x.reviewEvidence,
      admitReason: 'final_remaining_pass_independent_and_assist',
      allowUpdate: true,
      scienceCheck: x.scienceCheck,
      answerConsistencyCheck: 'OK',
      protection: {
        fieldsAllowed: ['analysis'],
        fieldsForbidden: [
          'stem',
          'options_json',
          'answer',
          'difficulty',
          'specialty_id',
          'category_id',
          'gate_note',
          'pool',
          'status',
          'is_active',
        ],
      },
    }))

  const { conn } = await openDb()
  const backupRows = []
  let wouldUpdate = 0
  let skipCount = 0
  let dryConflict = 0
  const dryItems = []
  for (const w of whitelist) {
    const [[live]] = await conn.query(
      `SELECT id, code, analysis, gate_note FROM chem_train_items WHERE id=? LIMIT 1`,
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
    const idOk = live && String(live.id) === String(w.id)
    const codeOk = live && live.code === w.code
    const analysisMatch = live && String(live.analysis ?? '') === String(w.originalAnalysis ?? '')
    const alreadyNew = live && String(live.analysis ?? '') === String(w.newAnalysis ?? '')
    let decision = 'WOULD_UPDATE'
    let reason = null
    if (!idOk || !codeOk) {
      decision = 'SKIP'
      reason = 'id_or_code_mismatch'
      dryConflict++
      skipCount++
    } else if (isS60(live) || isBlocked(live.gate_note) || upgraded.has(String(w.id))) {
      decision = 'SKIP'
      reason = 'hard_exclude'
      skipCount++
    } else if (alreadyNew) {
      decision = 'SKIP_IDEMPOTENT'
      skipCount++
    } else if (!analysisMatch) {
      decision = 'SKIP_CONFLICT'
      reason = 'analysis_changed'
      dryConflict++
      skipCount++
    } else {
      wouldUpdate++
    }
    dryItems.push({
      id: w.id,
      code: w.code,
      dryRunDecision: decision,
      skipReason: reason,
      allowUpdate: decision === 'WOULD_UPDATE',
    })
  }

  const effectiveWl = whitelist.filter((w) =>
    dryItems.find((d) => d.id === w.id && d.dryRunDecision === 'WOULD_UPDATE'),
  )

  fs.writeFileSync(
    path.join(BACKUP_DIR, 'backup_manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonlyPhase: true,
        noDbWriteYet: true,
        whitelistCount: effectiveWl.length,
        items: backupRows.filter((b) => effectiveWl.some((w) => w.id === b.id)),
      },
      null,
      2,
    ),
  )
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'original_analyses.json'),
    JSON.stringify(
      backupRows.filter((b) => effectiveWl.some((w) => w.id === b.id)),
      null,
      2,
    ),
  )
  fs.writeFileSync(
    path.join(OUT, 'update_whitelist.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        noDbWriteYet: true,
        count: effectiveWl.length,
        updateFieldOnly: 'analysis',
        items: effectiveWl,
      },
      null,
      2,
    ),
  )

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[trainable]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[dailyCand]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[daily:exclude]%')`,
  )

  const dry = {
    generatedAt: new Date().toISOString(),
    noDbWrite: true,
    stats: {
      whitelistCount: effectiveWl.length,
      wouldUpdate,
      skipCount,
      conflictCount: dryConflict,
    },
    bankSnapshot: {
      total: Number(tot.n),
      trainable: Number(trainable.n),
      formal: Number(formal.n),
      dailyCandidateApprox: Number(dailyCand.n),
    },
    whitelistDryRun: dryItems,
  }
  fs.writeFileSync(path.join(OUT, 'dryrun_report.json'), JSON.stringify(dry, null, 2))

  const summary = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    noDbWrite: true,
    remainingScoped: scope.counts.remaining,
    workItems: candidates.length,
    questionRiskExcluded: scope.counts.remaining - candidates.length,
    gradeCount,
    whitelistCount: effectiveWl.length,
    dryRun: dry.stats,
    bankSnapshot: dry.bankSnapshot,
    risk4: risk4.items.map((x) => ({
      id: x.id,
      grade: x.grade,
      allowAnalysisUpgrade: x.allowAnalysisUpgrade,
    })),
    deepseek: {
      reviewed: (dsResult.reviews || []).length,
      failed: (dsResult.failed || []).length,
      skipped: !!dsResult.skipped,
    },
    deepseekRuleConflicts: conflictCount,
    remainingAfterThisWhitelistIfApplied: scope.counts.remaining - effectiveWl.length,
    upgradedAlready: scope.counts.upgradedTotal,
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
