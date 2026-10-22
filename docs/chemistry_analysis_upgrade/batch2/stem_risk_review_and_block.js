'use strict'
/**
 * 残缺题干风险：逐题核验 → 分级 → 仅 CONFIRMED_BLOCK 写 trial_access:block
 * 不改题干/选项/答案/difficulty/专项/analysis/关联。
 *
 *   node docs/chemistry_analysis_upgrade/batch2/stem_risk_review_and_block.js --review-only
 *   node docs/chemistry_analysis_upgrade/batch2/stem_risk_review_and_block.js --apply
 *   node docs/chemistry_analysis_upgrade/batch2/stem_risk_review_and_block.js --rollback
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { openDb, loadLinksAndSources } = require('../lib_common')

const OUT = __dirname
const BACKUP_DIR = path.join(OUT, 'stem_risk_block_backup')
const BLOCK_TAG = '[trial_access:block]'
const BLOCK_REASON_TAG = '[stem_risk:confirmed_block_20261020]'
const EXTRA_CHECK_IDS = ['50', '379', '398', '401']

function sha256(s) {
  return crypto.createHash('sha256').update(String(s ?? ''), 'utf8').digest('hex')
}

function alreadyBlocked(gateNote) {
  return /\[trial_access:block\]/i.test(String(gateNote || ''))
}

function appendBlock(gateNote) {
  let note = String(gateNote || '').trim()
  if (/\[trial_access:block\]/i.test(note)) return { note, changed: false }
  note = (note + ' ' + BLOCK_TAG + ' ' + BLOCK_REASON_TAG).replace(/\s+/g, ' ').trim()
  // gate_note varchar(255)
  if (note.length > 255) {
    // 保留原 note 尾部尽量塞入标记
    const tags = BLOCK_TAG + ' ' + BLOCK_REASON_TAG
    const budget = 255 - tags.length - 1
    note = (note.slice(0, Math.max(0, budget)).trim() + ' ' + tags).trim().slice(0, 255)
  }
  return { note, changed: true }
}

function removeOurBlock(gateNote) {
  let note = String(gateNote || '')
  const hadOur = /\[stem_risk:confirmed_block_20261020\]/i.test(note)
  if (!hadOur) return { note, changed: false, skipped: 'no_our_marker' }
  note = note
    .replace(/\s*\[stem_risk:confirmed_block_20261020\]/gi, '')
    .replace(/\s*\[trial_access:block\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return { note, changed: true }
}

/**
 * 人工规则分级（基于题干可独立性 + 是否仅为「错误类型标签」）
 * 不得仅因扫描命中自动 CONFIRMED_BLOCK。
 */
function classifyItem(row, source) {
  const id = String(row.id)
  const stem = String(row.stem || '')
  const phrase = stem
    .replace(/^【AI试运行】/, '')
    .replace(/^下列说法正确[：:]/, '')
    .replace(/[。．]?\s*判断正误[。．]?\s*$/, '')
    .trim()
  const srcName = source?.name || null
  const srcDesc = source ? String(source.description || '') : ''

  const base = {
    id,
    code: row.code,
    stem,
    phrase,
    qtype: row.qtype,
    options_json: row.options_json,
    answer: row.answer,
    difficulty: Number(row.difficulty),
    specialtyCode: row.specialty_code,
    specialtyName: row.specialty_name,
    categoryCode: row.category_code,
    categoryName: row.category_name,
    gate_note: row.gate_note,
    alreadyBlocked: alreadyBlocked(row.gate_note),
    sourceName: srcName,
    sourceDescPreview: srcDesc.slice(0, 180),
    inRisk26: true,
  }

  // —— 硬残缺：无完整命题 / 仅错误类型标签 ——
  const errorTypeOnly = [
    '递变顺序记反',
    '不判断过量',
    '用稀盐酸',
    '收集方法用错',
    '检验方法张冠李戴',
    '两类盐性质混记',
    '写错分解方程式计量数',
    'V用溶剂体积',
    '氧化剂与还原剂、氧化产物与还原产物对调',
    '与Fe2+颜色、沉淀颜色混淆',
    'NO与NO2颜色、转化条件混淆',
  ]
  if (errorTypeOnly.includes(phrase) || phrase.length <= 6) {
    return {
      ...base,
      grade: 'CONFIRMED_BLOCK',
      canUnderstandAlone: false,
      answerUnique: false,
      scienceErrorInStem: false,
      affectsReliableGrading: true,
      rationale:
        '题干仅为易错标签或碎片短语，未构成可独立判断的完整命题；学生无法可靠作答，暂停试运行。',
      suggestPauseAlso: true,
      fixHint: srcDesc
        ? '将来源「易错」扩展为完整错误命题后再恢复准入'
        : '补全题干为完整命题后再恢复',
    }
  }

  // 稍长但仍缺对象/条件的碎片
  const softFragments = [
    '只配平原子个数',
    '不加热就写放氨',
  ]
  if (softFragments.includes(phrase)) {
    return {
      ...base,
      grade: 'CONFIRMED_BLOCK',
      canUnderstandAlone: false,
      answerUnique: false,
      scienceErrorInStem: false,
      affectsReliableGrading: true,
      rationale:
        '缺少明确对象/反应语境（配平什么？何种铵盐加热？），虽可猜题意但不足以可靠训练与判题。',
      suggestPauseAlso: true,
      fixHint: '补全具体反应或操作场景后的错误说法',
    }
  }

  // —— 可独立理解的完整（或足够完整）错误命题：扫描偏严 → FALSE_POSITIVE ——
  const clearPropositions = {
    '用石灰水检验CO': '完整错误命题，可判「错误」',
    '任何温度压强都套22.4': '完整错误命题（标况摩尔体积误用）',
    '认为Cl2分子直接漂白': '完整错误命题',
    '把干燥Cl2直接当成漂白': '完整错误命题',
    '把Fe2+溶液颜色说成黄色': '完整错误命题',
    '铁与稀酸写生成Fe3+': '完整错误命题',
    '直接对Fe2+加KSCN就报阳性': '完整错误命题',
    '用金属硬度、熔点直接代替活动性': '完整错误命题',
    '写成常温即可大量合成': '在合成氨语境下命题可判；措辞略省但可作答',
    '把燃烧产物写成Na2O': '钠在空气中燃烧产物语境可判',
    '把稀硫酸当成强氧化性酸': '完整错误命题',
    '把氧化剂当成氧化产物': '完整错误命题',
    '只看氧元素是否参加': '氧化还原判据易错命题，可独立理解',
  }
  if (clearPropositions[phrase]) {
    return {
      ...base,
      grade: 'FALSE_POSITIVE',
      canUnderstandAlone: true,
      answerUnique: true,
      scienceErrorInStem: false,
      affectsReliableGrading: false,
      rationale: '自动扫描偏严：' + clearPropositions[phrase] + '。不暂停试运行。',
      suggestPauseAlso: false,
      fixHint: '可选美化题干表述，非必须',
    }
  }

  // 默认：有明确可修方向但当前表述别扭
  return {
    ...base,
    grade: 'FIXABLE',
    canUnderstandAlone: phrase.length >= 10,
    answerUnique: phrase.length >= 10,
    scienceErrorInStem: false,
    affectsReliableGrading: phrase.length < 12,
    rationale: '存在表述问题，可从来源补全；本次不修题干。',
    suggestPauseAlso: true,
    fixHint: '按来源易错扩展为完整句',
  }
}

function classifyExtraHold(row, source, dsIssues) {
  const stem = String(row.stem || '')
  const base = {
    id: String(row.id),
    code: row.code,
    stem,
    phrase: null,
    qtype: row.qtype,
    options_json: row.options_json,
    answer: row.answer,
    difficulty: Number(row.difficulty),
    specialtyCode: row.specialty_code,
    specialtyName: row.specialty_name,
    categoryCode: row.category_code,
    categoryName: row.category_name,
    gate_note: row.gate_note,
    alreadyBlocked: alreadyBlocked(row.gate_note),
    sourceName: source?.name || null,
    sourceDescPreview: source ? String(source.description || '').slice(0, 180) : '',
    inRisk26: false,
    holdAnalysisBatch2: true,
    deepseekIssues: dsIssues || [],
  }

  // HOLD 题：题干本身通常完整，问题在解析模板错位 → 不因 analysis HOLD 而 block 题目
  // 除非题干本身不可靠
  const stemOk = stem.length >= 20 && !/下列说法正确：[。．]/.test(stem)
  if (!stemOk) {
    return {
      ...base,
      grade: 'CONFIRMED_BLOCK',
      canUnderstandAlone: false,
      answerUnique: false,
      scienceErrorInStem: false,
      affectsReliableGrading: true,
      rationale: 'HOLD复查：题干本身不可靠',
      suggestPauseAlso: true,
      fixHint: '修题干后再训',
    }
  }

  // 379/398/401 为 not_marked_redox 证据推理题——题干需看实际内容
  return {
    ...base,
    grade: 'NEEDS_VERIFICATION',
    canUnderstandAlone: true,
    answerUnique: true,
    scienceErrorInStem: false,
    affectsReliableGrading: false,
    rationale:
      '不在26道残缺清单内。Batch2 解析 HOLD（模板错位/答非所问），题干本身未见残缺；是否科学可靠需对照反应与题干意图进一步核实，本次不因解析 HOLD 自动 block。',
    suggestPauseAlso: false,
    fixHint: '优先重写 analysis；若核实题干/答案有误再另批处理',
  }
}

async function loadReviewBundle(conn) {
  const risks = JSON.parse(fs.readFileSync(path.join(OUT, 'question_risks.json'), 'utf8'))
  const riskIds = [...new Set(risks.items.map((x) => String(x.id)))]
  const quality = JSON.parse(fs.readFileSync(path.join(OUT, 'quality_results.json'), 'utf8'))
  const holdMap = Object.fromEntries(
    quality.items
      .filter((x) => EXTRA_CHECK_IDS.includes(String(x.id)))
      .map((x) => [
        String(x.id),
        (x.deepseekAssist && x.deepseekAssist.issues) || x.reasons || [],
      ]),
  )

  const allIds = [...new Set([...riskIds, ...EXTRA_CHECK_IDS])]
  const [rows] = await conn.query(
    `SELECT i.id, i.code, i.stem, i.options_json, i.answer, i.analysis, i.difficulty,
            i.qtype, i.answer_type, i.gate_note, i.pool, i.status, i.is_active,
            s.code AS specialty_code, s.name AS specialty_name,
            c.code AS category_code, c.name AS category_name
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.id IN (?)`,
    [allIds],
  )
  const { links, sources } = await loadLinksAndSources(conn, allIds)
  const srcOf = (id) => {
    const ls = links.filter((l) => String(l.item_id) === String(id))
    const ents = ls
      .map((l) => sources[`${l.entity_type}:${l.entity_id}`])
      .filter(Boolean)
    return ents[0] || null
  }

  const reviewed = []
  for (const id of riskIds) {
    const row = rows.find((r) => String(r.id) === id)
    if (!row) {
      reviewed.push({
        id,
        grade: 'NEEDS_VERIFICATION',
        rationale: 'DB missing',
        inRisk26: true,
      })
      continue
    }
    reviewed.push(classifyItem(row, srcOf(id)))
  }

  const extras = []
  for (const id of EXTRA_CHECK_IDS) {
    const in26 = riskIds.includes(id)
    const row = rows.find((r) => String(r.id) === id)
    if (!row) {
      extras.push({ id, inRisk26: in26, grade: 'NEEDS_VERIFICATION', rationale: 'DB missing' })
      continue
    }
    if (in26) {
      extras.push({
        id,
        inRisk26: true,
        note: '已在26道清单内，以清单分级为准，不重复统计',
        grade: reviewed.find((x) => x.id === id)?.grade,
      })
    } else {
      extras.push(classifyExtraHold(row, srcOf(id), holdMap[id]))
    }
  }

  return { riskIds, reviewed, extras, rows, risks }
}

async function crossCheckWhitelist(confirmedBlockIds) {
  const wlPath = path.join(OUT, 'whitelist.json')
  const dryPath = path.join(OUT, 'dryrun.json')
  const wl = JSON.parse(fs.readFileSync(wlPath, 'utf8'))
  const before = wl.count
  const blockSet = new Set(confirmedBlockIds.map(String))
  const overlap = wl.items.filter((x) => blockSet.has(String(x.id)))
  const kept = wl.items.filter((x) => !blockSet.has(String(x.id)))

  if (overlap.length === 0) {
    return {
      overlapped: false,
      overlapIds: [],
      beforeCount: before,
      afterCount: before,
      note: '无交叉，保留原白名单/备份/干跑',
    }
  }

  // 重生白名单 + 备份 + 干跑（只读 SELECT）
  const { conn } = await openDb()
  wl.items = kept
  wl.count = kept.length
  wl.generatedAt = new Date().toISOString()
  wl.noDbWriteYet = true
  wl.stemRiskExcluded = overlap.map((x) => String(x.id))
  wl.note = '已剔除与 CONFIRMED_BLOCK 交叉的题目；仍未执行 analysis UPDATE'
  fs.writeFileSync(wlPath, JSON.stringify(wl, null, 2), 'utf8')

  const BACKUP = path.join(OUT, 'batch2_backup')
  fs.mkdirSync(BACKUP, { recursive: true })
  const backupRows = []
  for (const w of kept) {
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
  fs.writeFileSync(
    path.join(BACKUP, 'backup_manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        readonlyPhase: true,
        noDbWriteYet: true,
        whitelistCount: kept.length,
        stemRiskExcluded: overlap.map((x) => String(x.id)),
        bankStats: { totalItems: Number(tot.n) },
        items: backupRows,
      },
      null,
      2,
    ),
    'utf8',
  )
  fs.writeFileSync(
    path.join(BACKUP, 'original_analyses.json'),
    JSON.stringify(backupRows, null, 2),
    'utf8',
  )

  let wouldUpdate = 0
  let conflictCount = 0
  let skipCount = 0
  const dryItems = []
  for (const w of kept) {
    const [[live]] = await conn.query(
      `SELECT id, code, analysis, gate_note FROM chem_train_items WHERE id=? LIMIT 1`,
      [w.id],
    )
    const analysisMatch = live && String(live.analysis ?? '') === String(w.originalAnalysis ?? '')
    const alreadyNew = live && String(live.analysis ?? '') === String(w.newAnalysis ?? '')
    let decision = 'WOULD_UPDATE'
    let reason = null
    if (!live || live.code !== w.code) {
      decision = 'SKIP'
      reason = 'id_or_code_mismatch'
      conflictCount++
      skipCount++
    } else if (alreadyBlocked(live.gate_note)) {
      decision = 'SKIP'
      reason = 'trial_access_block'
      skipCount++
    } else if (alreadyNew) {
      decision = 'SKIP_IDEMPOTENT'
      skipCount++
    } else if (!analysisMatch) {
      decision = 'SKIP_CONFLICT'
      conflictCount++
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
  fs.writeFileSync(
    dryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        noDbWrite: true,
        stats: {
          whitelistCount: kept.length,
          wouldUpdate,
          skipCount,
          conflictCount,
        },
        whitelistDryRun: dryItems,
        stemRiskExcluded: overlap.map((x) => String(x.id)),
      },
      null,
      2,
    ),
    'utf8',
  )

  const summary = JSON.parse(fs.readFileSync(path.join(OUT, 'summary.json'), 'utf8'))
  summary.whitelistCount = kept.length
  summary.dryRun = { wouldUpdate, skipCount, conflictCount }
  summary.stemRiskExcludedFromWhitelist = overlap.map((x) => String(x.id))
  summary.generatedAt = new Date().toISOString()
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8')

  await conn.end()
  return {
    overlapped: true,
    overlapIds: overlap.map((x) => String(x.id)),
    beforeCount: before,
    afterCount: kept.length,
    dryRun: { wouldUpdate, skipCount, conflictCount },
    note: '已从白名单剔除交叉题并重生备份/干跑',
  }
}

async function verifyAfter(conn, blockedIds) {
  const ids = blockedIds.map(String)
  const checks = {}

  const [[tot]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_items`)
  const [[formal]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[trainable]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
  )
  const [[blockedCnt]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE gate_note LIKE '%[trial_access:block]%'`,
  )
  const [[dailyCand]] = await conn.query(
    `SELECT COUNT(*) n FROM chem_train_items WHERE pool='test' AND status='approved' AND is_active=1
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')
     AND (gate_note IS NULL OR gate_note NOT LIKE '%[daily:exclude]%')`,
  )
  const [[hist]] = await conn.query(`SELECT COUNT(*) n FROM chem_train_session_items`)

  checks.bankTotal = Number(tot.n)
  checks.formal = Number(formal.n)
  checks.trainable = Number(trainable.n)
  checks.blockedTotal = Number(blockedCnt.n)
  checks.dailyCandidateApprox = Number(dailyCand.n)
  checks.sessionItemsUnchangedMetric = Number(hist.n)

  if (ids.length) {
    const [live] = await conn.query(
      `SELECT id, code, gate_note FROM chem_train_items WHERE id IN (?)`,
      [ids],
    )
    checks.blockedLive = live.map((r) => ({
      id: String(r.id),
      blocked: alreadyBlocked(r.gate_note),
      hasOurMarker: /\[stem_risk:confirmed_block_20261020\]/i.test(String(r.gate_note || '')),
    }))
    const [wouldPick] = await conn.query(
      `SELECT id FROM chem_train_items
       WHERE id IN (?) AND pool='test' AND status='approved' AND is_active=1
         AND (gate_note IS NULL OR gate_note NOT LIKE '%[trial_access:block]%')`,
      [ids],
    )
    checks.blockedStillEligibleCount = wouldPick.length
  } else {
    checks.blockedLive = []
    checks.blockedStillEligibleCount = 0
  }

  checks.ok =
    checks.formal === 0 &&
    checks.blockedStillEligibleCount === 0 &&
    (ids.length === 0 ||
      checks.blockedLive.every((x) => x.blocked && x.hasOurMarker))

  return checks
}

async function applyBlocks(conn, toBlock) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const backup = []
  const results = []

  for (const it of toBlock) {
    const [[live]] = await conn.query(
      `SELECT id, code, stem, answer, gate_note, pool, status, is_active
       FROM chem_train_items WHERE id=? LIMIT 1`,
      [it.id],
    )
    if (!live) {
      results.push({ id: it.id, decision: 'SKIP', reason: 'missing' })
      continue
    }
    const snap = {
      id: String(live.id),
      code: live.code,
      stem: live.stem,
      answer: live.answer,
      gate_note: live.gate_note,
      accessBefore: alreadyBlocked(live.gate_note) ? 'blocked' : 'allow',
      pool: live.pool,
      status: live.status,
      is_active: live.is_active,
      checksumGate: sha256(live.gate_note),
    }
    backup.push(snap)

    if (String(live.code) !== String(it.code)) {
      results.push({ id: it.id, decision: 'SKIP_CONFLICT', reason: 'code_mismatch' })
      continue
    }
    if (String(live.stem ?? '') !== String(it.stem ?? '')) {
      results.push({ id: it.id, decision: 'SKIP_CONFLICT', reason: 'stem_changed' })
      continue
    }
    if (String(live.answer ?? '') !== String(it.answer ?? '')) {
      results.push({ id: it.id, decision: 'SKIP_CONFLICT', reason: 'answer_changed' })
      continue
    }
    if (String(live.gate_note ?? '') !== String(it.gate_note ?? '')) {
      results.push({ id: it.id, decision: 'SKIP_CONFLICT', reason: 'gate_note_changed' })
      continue
    }
    if (alreadyBlocked(live.gate_note)) {
      results.push({
        id: it.id,
        decision: 'SKIP_ALREADY_BLOCKED',
        reason: 'preserve_existing_block',
        note: '已有 block，不重复改写（保留原限制）',
      })
      continue
    }

    const { note, changed } = appendBlock(live.gate_note)
    if (!changed) {
      results.push({ id: it.id, decision: 'SKIP', reason: 'no_change' })
      continue
    }

    const [ret] = await conn.query(
      `UPDATE chem_train_items SET gate_note=?
       WHERE id=? AND code=? AND gate_note=? AND stem=? AND answer=?`,
      [note, live.id, live.code, live.gate_note, live.stem, live.answer],
    )
    if (ret.affectedRows === 1) {
      results.push({
        id: it.id,
        decision: 'BLOCKED',
        code: live.code,
        gate_note_before: live.gate_note,
        gate_note_after: note,
      })
    } else {
      results.push({ id: it.id, decision: 'SKIP_CONFLICT', reason: 'affected_0' })
    }
  }

  fs.writeFileSync(
    path.join(BACKUP_DIR, 'backup_before_block.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        marker: BLOCK_REASON_TAG,
        items: backup,
      },
      null,
      2,
    ),
    'utf8',
  )
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'apply_result.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
    'utf8',
  )
  return results
}

async function rollback(conn) {
  const backupPath = path.join(BACKUP_DIR, 'backup_before_block.json')
  if (!fs.existsSync(backupPath)) throw new Error('missing backup')
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  const results = []
  for (const b of backup.items) {
    const [[live]] = await conn.query(
      `SELECT id, code, gate_note FROM chem_train_items WHERE id=? LIMIT 1`,
      [b.id],
    )
    if (!live) {
      results.push({ id: b.id, decision: 'SKIP', reason: 'missing' })
      continue
    }
    if (!/\[stem_risk:confirmed_block_20261020\]/i.test(String(live.gate_note || ''))) {
      results.push({
        id: b.id,
        decision: 'SKIP',
        reason: 'our_marker_absent_do_not_strip_others',
      })
      continue
    }
    // 仅当当前仍含本次标记时，恢复为备份原 gate_note
    // 若备份后有人又加了其他标记且当前 != 我们写出的形态，保守：仅去掉我们的两个 tag
    const expectedAfter = appendBlock(b.gate_note).note
    if (String(live.gate_note) === expectedAfter) {
      const [ret] = await conn.query(
        `UPDATE chem_train_items SET gate_note=? WHERE id=? AND gate_note=?`,
        [b.gate_note, b.id, live.gate_note],
      )
      results.push({
        id: b.id,
        decision: ret.affectedRows === 1 ? 'ROLLED_BACK' : 'SKIP_CONFLICT',
      })
    } else {
      const stripped = removeOurBlock(live.gate_note)
      if (!stripped.changed) {
        results.push({ id: b.id, decision: 'SKIP', reason: stripped.skipped })
        continue
      }
      const [ret] = await conn.query(
        `UPDATE chem_train_items SET gate_note=? WHERE id=? AND gate_note=?`,
        [stripped.note, b.id, live.gate_note],
      )
      results.push({
        id: b.id,
        decision: ret.affectedRows === 1 ? 'ROLLED_BACK_STRIP_TAGS' : 'SKIP_CONFLICT',
        note: 'gate 已相对备份变化，仅剥离本次标记',
      })
    }
  }
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'rollback_result.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
    'utf8',
  )
  return results
}

async function main() {
  const mode = process.argv.includes('--apply')
    ? 'apply'
    : process.argv.includes('--rollback')
      ? 'rollback'
      : 'review-only'

  const { conn } = await openDb()

  if (mode === 'rollback') {
    const results = await rollback(conn)
    console.log(JSON.stringify({ mode, results }, null, 2))
    await conn.end()
    return
  }

  const bundle = await loadReviewBundle(conn)
  const gradeCount = { CONFIRMED_BLOCK: 0, FIXABLE: 0, FALSE_POSITIVE: 0, NEEDS_VERIFICATION: 0 }
  for (const r of bundle.reviewed) {
    gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1
  }

  const confirmed = bundle.reviewed.filter((r) => r.grade === 'CONFIRMED_BLOCK')
  // extras that are CONFIRMED_BLOCK and not in26
  const extraBlock = bundle.extras.filter(
    (e) => e.grade === 'CONFIRMED_BLOCK' && e.inRisk26 === false,
  )
  const toBlock = [...confirmed, ...extraBlock]

  const reviewOut = {
    generatedAt: new Date().toISOString(),
    mode,
    risk26Count: bundle.riskIds.length,
    gradeCount26: gradeCount,
    overlapCheck: {
      id215_in26: bundle.riskIds.includes('215'),
      id250_in26: bundle.riskIds.includes('250'),
      id50_in26: bundle.riskIds.includes('50'),
      id379_in26: bundle.riskIds.includes('379'),
      id398_in26: bundle.riskIds.includes('398'),
      id401_in26: bundle.riskIds.includes('401'),
      note: '215/250 在26内；50/379/398/401 不在26内，单独复查且不重复计入26统计',
    },
    reviewed26: bundle.reviewed,
    extrasReviewed: bundle.extras,
    confirmedBlockIds: toBlock.map((x) => String(x.id)),
    confirmedBlockCount: toBlock.length,
  }
  fs.writeFileSync(
    path.join(OUT, 'stem_risk_review.json'),
    JSON.stringify(reviewOut, null, 2),
    'utf8',
  )

  let applyResults = null
  if (mode === 'apply') {
    applyResults = await applyBlocks(conn, toBlock)
  }

  const blockedOkIds = (applyResults || [])
    .filter((x) => x.decision === 'BLOCKED')
    .map((x) => String(x.id))
  // 交叉检查：用「计划 block」集合（CONFIRMED_BLOCK）与白名单交叉
  const xcheck = await crossCheckWhitelist(toBlock.map((x) => String(x.id)))

  const verify = await verifyAfter(
    conn,
    mode === 'apply' ? blockedOkIds : toBlock.map((x) => String(x.id)),
  )

  const resultSummary = {
    generatedAt: new Date().toISOString(),
    mode,
    gradeCount26: gradeCount,
    confirmedBlockPlanned: toBlock.map((x) => String(x.id)),
    apply: applyResults
      ? {
          blocked: applyResults.filter((x) => x.decision === 'BLOCKED').length,
          skipped: applyResults.filter((x) => x.decision !== 'BLOCKED').length,
          results: applyResults,
        }
      : null,
    whitelistCrossCheck: xcheck,
    verify,
  }
  fs.writeFileSync(
    path.join(OUT, 'stem_risk_apply_summary.json'),
    JSON.stringify(resultSummary, null, 2),
    'utf8',
  )
  console.log(JSON.stringify(resultSummary, null, 2))
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
