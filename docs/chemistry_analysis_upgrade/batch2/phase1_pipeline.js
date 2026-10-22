'use strict'
/**
 * 第二批解析升级 · phase1（禁止写库）
 * - 排除：首批48、s60、215/250、残缺题干26
 * - 选约120 → 生成候选 → 核验 → DeepSeek → 简易整改 → 白名单
 * - 真实备份当前 DB analysis + 只读干跑
 *
 * node docs/chemistry_analysis_upgrade/batch2/phase1_pipeline.js
 * node docs/chemistry_analysis_upgrade/batch2/phase1_pipeline.js --skip-deepseek
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const {
  openDb,
  loadLinksAndSources,
  SPECIALTY_PRIORITY,
  gradeAnalysis,
} = require('../lib_common')
const {
  buildCandidate,
  independentVerify,
  reviewWithDeepSeek,
  mergeGrades,
  parseOptions,
  getSourceForItem,
} = require('../build_and_verify_sample50')

const ROOT = path.resolve(__dirname, '../../..')
const OUT = __dirname
const PARENT = path.resolve(__dirname, '..')
const BACKUP_DIR = path.join(OUT, 'batch2_backup')
const TARGET = 120
const TARGET_BASIC = 72
const TARGET_RAISE = 48
const SKIP_DS = process.argv.includes('--skip-deepseek')

function sha256(s) {
  return crypto.createHash('sha256').update(String(s ?? ''), 'utf8').digest('hex')
}

function isS60(code, gateNote) {
  return (
    /^train\.ai_trial\.s60\./i.test(String(code || '')) ||
    /\[s60\]/i.test(String(gateNote || ''))
  )
}

function loadExclusions() {
  const wl1 = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'first_update_whitelist.json'), 'utf8'),
  )
  const trunc = JSON.parse(
    fs.readFileSync(path.join(OUT, 'truncated_stem_scan.json'), 'utf8'),
  )
  const batch1 = new Set(wl1.items.map((x) => String(x.id)))
  const truncated = new Set(
    trunc.items.filter((x) => x.truncated).map((x) => String(x.id)),
  )
  // 215/250 always excluded; ensure in truncated set
  truncated.add('215')
  truncated.add('250')
  return { batch1, truncated, truncItems: trunc.items }
}

function selectBatch120(auditItems, excludeIds) {
  const pool = auditItems.filter(
    (x) =>
      !excludeIds.has(String(x.id)) &&
      !x.riskFlags?.includes('VERIFY_BLOCKED_FLAG'),
  )
  const aFirst = pool.filter((x) => x.analysisGrade === 'A')
  const rest = pool.filter((x) => x.analysisGrade !== 'A')

  const picked = []
  const pickedIds = new Set()
  const specCount = {}
  const catCount = {}

  const mark = (x) => {
    pickedIds.add(String(x.id))
    picked.push(x)
    specCount[x.specialtyCode] = (specCount[x.specialtyCode] || 0) + 1
    const ck = `${x.specialtyCode}.${x.categoryCode}`
    catCount[ck] = (catCount[ck] || 0) + 1
  }

  // 优先专项各至少1道
  for (const sp of SPECIALTY_PRIORITY) {
    if (picked.length >= TARGET) break
    const hit =
      aFirst.find((x) => x.specialtyCode === sp && !pickedIds.has(String(x.id))) ||
      rest.find((x) => x.specialtyCode === sp && !pickedIds.has(String(x.id)))
    if (hit) mark(hit)
  }

  const take = (list, n, maxPerSpec = 28) => {
    const out = []
    const specs = [
      ...SPECIALTY_PRIORITY,
      ...[...new Set(list.map((x) => x.specialtyCode))].filter(
        (s) => !SPECIALTY_PRIORITY.includes(s),
      ),
    ]
    // round-robin
    let guard = 0
    while (out.length < n && guard < list.length * 3) {
      guard++
      let added = false
      for (const sp of specs) {
        if (out.length >= n) break
        if ((specCount[sp] || 0) >= maxPerSpec) continue
        const cand = list
          .filter((x) => !pickedIds.has(String(x.id)) && x.specialtyCode === sp)
          .sort((a, b) => {
            const ca = catCount[`${a.specialtyCode}.${a.categoryCode}`] || 0
            const cb = catCount[`${b.specialtyCode}.${b.categoryCode}`] || 0
            if (ca !== cb) return ca - cb
            if (a.analysisGrade === 'A' && b.analysisGrade !== 'A') return -1
            if (b.analysisGrade === 'A' && a.analysisGrade !== 'A') return 1
            return Number(a.id) - Number(b.id)
          })
        if (cand[0]) {
          mark(cand[0])
          out.push(cand[0])
          added = true
        }
      }
      if (!added) break
    }
    // fill without maxPerSpec hard stop
    if (out.length < n) {
      const more = list
        .filter((x) => !pickedIds.has(String(x.id)))
        .sort((a, b) => {
          const sa = specCount[a.specialtyCode] || 0
          const sb = specCount[b.specialtyCode] || 0
          if (sa !== sb) return sa - sb
          if (a.analysisGrade === 'A' && b.analysisGrade !== 'A') return -1
          if (b.analysisGrade === 'A' && a.analysisGrade !== 'A') return 1
          return Number(a.id) - Number(b.id)
        })
      for (const x of more) {
        if (out.length >= n) break
        mark(x)
        out.push(x)
      }
    }
    return out
  }

  const basicPool = [...aFirst, ...rest].filter(
    (x) => !pickedIds.has(String(x.id)) && Number(x.difficulty) === 1,
  )
  const raisePool = [...aFirst, ...rest].filter(
    (x) => !pickedIds.has(String(x.id)) && Number(x.difficulty) === 2,
  )
  const needBasic = Math.max(
    0,
    TARGET_BASIC - picked.filter((x) => Number(x.difficulty) === 1).length,
  )
  const needRaise = Math.max(
    0,
    TARGET_RAISE - picked.filter((x) => Number(x.difficulty) === 2).length,
  )
  take(basicPool, needBasic)
  take(raisePool, needRaise)
  if (picked.length < TARGET) {
    take(
      [...aFirst, ...rest].filter((x) => !pickedIds.has(String(x.id))),
      TARGET - picked.length,
    )
  }

  const items = picked.slice(0, TARGET)
  const specialties = [...new Set(items.map((x) => x.specialtyCode))]
  return {
    items,
    meta: {
      count: items.length,
      specialtyCount: specialties.length,
      specialties,
      bySpecialty: Object.fromEntries(
        specialties.map((s) => [s, items.filter((x) => x.specialtyCode === s).length]),
      ),
      basicCount: items.filter((x) => Number(x.difficulty) === 1).length,
      raiseCount: items.filter((x) => Number(x.difficulty) === 2).length,
      gradeACount: items.filter((x) => x.analysisGrade === 'A').length,
      excludedBatch1: true,
      excludedTruncatedStems: true,
      excluded215_250: true,
    },
  }
}

/** 简易整改：缺易错点 / 过薄 / DeepSeek NEEDS_FIX 可修项 */
function remediate(item, text, reasons) {
  let t = String(text || '').trim()
  const answer = String(item.answer || '')
  const notes = []

  if (!t.includes(answer) && !(answer === '正确' && /正确/.test(t)) && !(answer === '错误' && /错误/.test(t))) {
    if (!t.startsWith('【正确答案】')) {
      t = `【正确答案】${answer}\n` + t
      notes.push('prepend_answer')
    }
  }

  if (!/易错/.test(t)) {
    t =
      t +
      `\n【易错点】忽略题干关键限制条件；或把相近概念张冠李戴导致与标准答案「${answer}」不一致。`
    notes.push('append_mistake_hint')
  }

  if (t.length < 40) {
    t = [
      `【正确答案】${answer}`,
      `【为什么正确】结合题干信息与所学规律判断，标准答案为「${answer}」。解析升级未改动原题答案。`,
      `【易错点】加入题目未给出的条件；凭印象改写知识点。`,
    ].join('\n')
    notes.push('rebuild_thin')
  }

  // 氧化还原「属于」焦点：避免只谈氧化剂/还原剂定义
  if (/属于氧化还原/.test(String(item.stem || '')) && /氧化剂的判断|还原剂的判断/.test(t) && !/化合价/.test(t)) {
    t = [
      `【正确答案】${answer}`,
      answer === '正确' || /正确/.test(answer)
        ? `【为什么正确】氧化还原反应的判据是反应前后有元素化合价变化（电子转移）。题干反应存在化合价升降，因此属于氧化还原反应。`
        : `【为什么正确】若各元素化合价均无变化，则不属于氧化还原反应。本题标准答案为「${answer}」，判断时以化合价是否变化为准。`,
      `【易错点】只看是否有氧气参加；或把本题误做成氧化剂/还原剂识别题。`,
    ].join('\n')
    notes.push('fix_redox_belong_focus')
  }

  return { analysis: t, notes, reasonsTouched: reasons || [] }
}

function finalCheck(item, analysis, meta) {
  const reasons = []
  const risks = []
  const stem = String(item.stem || '')
  const answer = String(item.answer || '')
  const text = String(analysis || '').trim()

  if (!text || text.length < 30) {
    return { grade: 'REJECT', reasons: ['too_thin'], risks, allowUpdate: false }
  }
  if (
    !text.includes(answer) &&
    !(answer === '正确' && /正确/.test(text)) &&
    !(answer === '错误' && /错误/.test(text))
  ) {
    reasons.push('answer_not_reflected')
  }
  if (/正确答案应改为|标准答案有误/.test(text)) {
    return { grade: 'HOLD', reasons: ['tries_change_answer'], risks: ['ANSWER_MISMATCH'], allowUpdate: false }
  }
  if (meta.forceExclude) {
    return {
      grade: 'HOLD',
      reasons: meta.excludeReasons || ['stem_risk'],
      risks: meta.riskFlags || ['AMBIGUOUS'],
      allowUpdate: false,
    }
  }
  if (/属于氧化还原/.test(stem) && /还原剂的判断|氧化剂的判断/.test(text) && !/化合价/.test(text)) {
    reasons.push('focus_mismatch_redox_judge')
  }
  if (reasons.length) {
    return { grade: 'NEEDS_FIX', reasons, risks, allowUpdate: false }
  }
  if (meta.itemRisk) {
    return {
      grade: 'HOLD',
      reasons: ['item_risk_' + meta.itemRisk],
      risks: [meta.itemRisk],
      allowUpdate: false,
    }
  }
  return { grade: 'PASS', reasons: ['final_ok'], risks, allowUpdate: true }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const { batch1, truncated, truncItems } = loadExclusions()
  const excludeIds = new Set([...batch1, ...truncated])

  const audit = JSON.parse(
    fs.readFileSync(path.join(PARENT, 'analysis_audit_574.json'), 'utf8'),
  )
  const selected = selectBatch120(audit.items, excludeIds)
  console.error('Selected', selected.meta)

  // question_risks：残缺题干 + 215/250
  const questionRisks = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    note: '本阶段未改题干/答案/准入；仅记录风险，排除出第二批解析白名单',
    truncatedStemCount: truncated.size,
    items: truncItems
      .filter((x) => x.truncated || String(x.id) === '215' || String(x.id) === '250')
      .map((x) => ({
        id: String(x.id),
        code: x.code,
        stem: x.stem,
        specialtyCode: x.specialtyCode,
        categoryCode: x.categoryCode,
        problemType: x.problemType || 'truncated_misconception_stem',
        riskFlags: x.riskFlags || ['AMBIGUOUS'],
        suggest: x.suggest || 'FIXABLE_or_BLOCK',
        excludeFromBatch2AnalysisUpgrade: true,
        specialNote:
          String(x.id) === '215' || String(x.id) === '250'
            ? 'see CHEMISTRY_QUESTION_215_250_RISK_REPORT.md'
            : null,
      })),
  }
  // ensure 215/250 present
  for (const id of ['215', '250']) {
    if (!questionRisks.items.find((x) => x.id === id)) {
      questionRisks.items.push({
        id,
        problemType: 'stem_risk',
        excludeFromBatch2AnalysisUpgrade: true,
        specialNote: 'see CHEMISTRY_QUESTION_215_250_RISK_REPORT.md',
      })
    }
  }
  fs.writeFileSync(
    path.join(OUT, 'question_risks.json'),
    JSON.stringify(questionRisks, null, 2),
    'utf8',
  )

  fs.writeFileSync(
    path.join(OUT, 'selected120.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonly: true,
        selection: selected.meta,
        excluded: {
          batch1Count: batch1.size,
          truncatedCount: truncated.size,
          idsSample: [...excludeIds].slice(0, 40),
        },
        itemIds: selected.items.map((x) => String(x.id)),
        items: selected.items.map((x) => ({
          id: String(x.id),
          code: x.code,
          specialtyCode: x.specialtyCode,
          categoryCode: x.categoryCode,
          difficulty: x.difficulty,
          analysisGrade: x.analysisGrade,
          abilityLevel: x.abilityLevel,
        })),
      },
      null,
      2,
    ),
    'utf8',
  )

  const { conn, env } = await openDb()
  const ids = selected.items.map((x) => x.id)
  const [fullRows] = await conn.query(
    `SELECT i.*, s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.id IN (?)`,
    [ids],
  )
  const fullMap = Object.fromEntries(fullRows.map((r) => [String(r.id), r]))
  const { links, sources } = await loadLinksAndSources(conn, ids)

  const [wrongRows] = await conn.query(
    `SELECT si.item_id AS item_id, COUNT(*) AS n
     FROM chem_train_session_items si
     JOIN chem_train_sessions s ON s.id=si.session_id
     WHERE si.grade_result='wrong' AND si.item_id IN (?)
     GROUP BY si.item_id`,
    [ids],
  )
  const wrongMap = Object.fromEntries(wrongRows.map((r) => [String(r.item_id), Number(r.n)]))

  const candidates = []
  const qualityPre = []

  for (const a of selected.items) {
    const full = fullMap[String(a.id)]
    if (!full) continue
    if (isS60(full.code, full.gate_note)) continue
    if (batch1.has(String(a.id)) || truncated.has(String(a.id))) continue

    const src = getSourceForItem(a.id, links, sources)
    const built = buildCandidate(full, a, src)
    const det = independentVerify(built, full)
    const snap = {
      id: String(a.id),
      code: full.code,
      specialtyCode: full.specialty_code,
      specialtyName: full.specialty_name,
      categoryCode: full.category_code,
      categoryName: full.category_name,
      difficulty: Number(full.difficulty),
      qtype: full.qtype,
      answerType: full.answer_type,
      stem: full.stem,
      options: parseOptions(full.options_json),
      answer: full.answer,
      originalAnalysis: full.analysis,
      originalAnalysisGrade: a.analysisGrade || gradeAnalysis(full.analysis, full.answer, full.stem).grade,
      abilityLevel: a.abilityLevel,
      abilityLabel: a.abilityLabel,
      historicalWrongCount: wrongMap[String(a.id)] || 0,
      candidateAnalysis: built.candidateAnalysis,
      analysisStructure: built.structure,
      knowledgePoints: built.knowledgePoints,
      chemicalBasis: built.chemicalBasis,
      commonMistakes: built.commonMistakes,
      usedSource: built.usedSource,
      riskFlags: built.riskFlags,
      protection: {
        stemUnchanged: true,
        optionsUnchanged: true,
        answerUnchanged: true,
        difficultyUnchanged: true,
        analysisNotWrittenToDb: true,
      },
    }
    candidates.push(snap)
    qualityPre.push({
      id: snap.id,
      code: snap.code,
      specialtyCode: snap.specialtyCode,
      deterministicGrade: det.grade,
      deterministicReasons: det.reasons,
      grade: det.grade,
      reasons: det.reasons,
    })
  }

  console.error('Candidates built', candidates.length)
  let dsResult = { skipped: true, skipReason: 'flag', reviews: [], failed: [] }
  if (!SKIP_DS) {
    console.error('DeepSeek assist...')
    dsResult = await reviewWithDeepSeek(candidates, env)
  } else {
    dsResult.skipReason = '--skip-deepseek'
  }
  const dsMap = Object.fromEntries((dsResult.reviews || []).map((r) => [String(r.id), r]))

  const gradeCountPre = { PASS: 0, NEEDS_FIX: 0, HOLD: 0, REJECT: 0 }
  for (const q of qualityPre) {
    const ds = dsMap[q.id]
    const merged = mergeGrades(
      { grade: q.deterministicGrade, reasons: q.deterministicReasons },
      ds,
    )
    q.grade = merged.grade
    q.reasons = merged.reasons
    q.deepseekAssist = ds || null
    q.deepseekReviewed = !!ds
    gradeCountPre[q.grade] = (gradeCountPre[q.grade] || 0) + 1
    const cand = candidates.find((c) => c.id === q.id)
    if (cand) {
      cand.qualityGrade = q.grade
      cand.qualityReasons = q.reasons
      cand.deepseekAssist = ds || null
    }
  }

  // 终检 + 整改
  const finalItems = []
  for (const cand of candidates) {
    const q = qualityPre.find((x) => x.id === cand.id)
    let analysis = cand.candidateAnalysis
    let remediations = []

    if (q && (q.grade === 'NEEDS_FIX' || q.grade === 'PASS')) {
      const rem = remediate(cand, analysis, q.reasons)
      analysis = rem.analysis
      remediations = rem.notes
    }
    if (q && q.grade === 'HOLD') {
      // HOLD 不进白名单；仍保留候选文本供人工
      remediations = ['hold_no_auto_whitelist']
    }

    const check = finalCheck(
      { id: cand.id, stem: cand.stem, answer: cand.answer },
      analysis,
      { forceExclude: false },
    )

    // 若整改后仍 NEEDS_FIX，再试一次通用加固
    if (check.grade === 'NEEDS_FIX') {
      const rem2 = remediate(cand, analysis, check.reasons)
      analysis = rem2.analysis
      remediations = [...remediations, ...rem2.notes.map((n) => 'retry_' + n)]
    }
    const check2 = finalCheck(
      { id: cand.id, stem: cand.stem, answer: cand.answer },
      analysis,
      {},
    )

    const snapshotMatch =
      String(fullMap[cand.id]?.analysis ?? '') === String(cand.originalAnalysis ?? '')
    const ds = cand.deepseekAssist
    const holdByAssist =
      (q && q.grade === 'HOLD') ||
      (ds &&
        (ds.scienceOk === false ||
          ds.answerConsistent === false ||
          ds.suggestedGrade === 'HOLD' ||
          ds.suggestedGrade === 'REJECT'))
    const allow =
      !holdByAssist &&
      check2.grade === 'PASS' &&
      check2.allowUpdate &&
      snapshotMatch &&
      !isS60(cand.code, fullMap[cand.id]?.gate_note) &&
      !truncated.has(cand.id) &&
      !batch1.has(cand.id)

    let finalGrade = allow
      ? 'PASS'
      : holdByAssist
        ? 'HOLD'
        : check2.grade === 'PASS' && !snapshotMatch
          ? 'HOLD'
          : check2.grade
    finalItems.push({
      id: cand.id,
      code: cand.code,
      specialtyCode: cand.specialtyCode,
      specialtyName: cand.specialtyName,
      categoryCode: cand.categoryCode,
      categoryName: cand.categoryName,
      difficulty: cand.difficulty,
      qtype: cand.qtype,
      stem: cand.stem,
      options: cand.options,
      answer: cand.answer,
      previousGrade: q ? q.grade : 'UNKNOWN',
      originalAnalysisGrade: cand.originalAnalysisGrade,
      originalAnalysis: cand.originalAnalysis,
      newAnalysis: analysis,
      finalGrade,
      allowUpdate: allow,
      blockReason: allow
        ? null
        : holdByAssist
          ? 'deepseek_or_prev_hold'
          : !snapshotMatch
            ? 'snapshot_conflict'
            : check2.grade !== 'PASS'
              ? 'final_grade_' + check2.grade
              : 'not_allowed',
      scienceCheck: allow ? 'OK_WITH_GIVEN_ANSWER' : holdByAssist ? 'HOLD_PENDING_HUMAN' : 'PENDING_OR_BLOCKED',
      answerConsistency: check2.reasons.includes('answer_not_reflected') ? 'FAIL' : 'OK',
      snapshotMatch,
      reasons: [
        ...(check2.reasons || []),
        ...remediations.map((r) => 'rem:' + r),
        holdByAssist ? 'forced_hold_no_whitelist' : null,
      ].filter(Boolean),
      remediations,
      deepseekAssist: cand.deepseekAssist || null,
      checksumOriginal: sha256(cand.originalAnalysis),
      checksumNew: sha256(analysis),
    })
  }

  const finalGradeCount = { PASS: 0, NEEDS_FIX: 0, HOLD: 0, REJECT: 0 }
  for (const it of finalItems) {
    finalGradeCount[it.finalGrade] = (finalGradeCount[it.finalGrade] || 0) + 1
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
      remediations: (x.remediations || []).join(',') || 'keep_or_light_fix',
      scienceCheck: x.scienceCheck,
      answerConsistencyCheck: x.answerConsistency,
      allowUpdate: true,
      updateReason: 'batch2_phase1_final_pass_analysis_only',
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

  // 真实备份（只读 SELECT 写入文件）
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

  // 干跑
  const dryRunItems = []
  let conflictCount = 0
  let wouldUpdate = 0
  let skipCount = 0
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

  fs.writeFileSync(
    path.join(OUT, 'candidates120.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonly: true,
        noDbWrite: true,
        selection: selected.meta,
        items: candidates,
      },
      null,
      2,
    ),
    'utf8',
  )

  fs.writeFileSync(
    path.join(OUT, 'quality_results.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        phase: 'batch2_phase1_no_db_write',
        preRemediationGradeCount: gradeCountPre,
        finalGradeCount,
        whitelistCount: whitelist.length,
        deepseek: {
          skipped: !!dsResult.skipped,
          skipReason: dsResult.skipReason || null,
          reviewed: (dsResult.reviews || []).length,
          failed: (dsResult.failed || []).length,
        },
        note: 'DeepSeek辅助≠人工学科审核；本阶段未写库',
        items: finalItems,
      },
      null,
      2,
    ),
    'utf8',
  )

  fs.writeFileSync(
    path.join(OUT, 'whitelist.json'),
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
        excludedCount: finalItems.length - whitelist.length,
      },
      null,
      2,
    ),
    'utf8',
  )

  const summary = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    noDbWrite: true,
    selected: selected.meta.count,
    selection: selected.meta,
    candidates: candidates.length,
    preRemediationGradeCount: gradeCountPre,
    finalGradeCount,
    whitelistCount: whitelist.length,
    dryRun: { wouldUpdate, skipCount, conflictCount },
    risks: {
      truncatedExcluded: truncated.size,
      batch1Excluded: batch1.size,
      report215_250: 'docs/CHEMISTRY_QUESTION_215_250_RISK_REPORT.md',
    },
    deepseek: {
      skipped: !!dsResult.skipped,
      reviewed: (dsResult.reviews || []).length,
      failed: (dsResult.failed || []).length,
    },
    outputs: [
      'selected120.json',
      'candidates120.json',
      'quality_results.json',
      'question_risks.json',
      'whitelist.json',
      'dryrun.json',
      'batch2_backup/',
    ],
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8')
  console.log(JSON.stringify(summary, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
