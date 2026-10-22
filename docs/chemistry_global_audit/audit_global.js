/**
 * Per-item global audit for 377 codes. READ-ONLY. Produces per_item.json + issues.json.
 * node docs/chemistry_global_audit/audit_global.js
 */
'use strict'
const fs = require('fs')
const path = require('path')

const OUT = __dirname
const extract = JSON.parse(fs.readFileSync(path.join(OUT, 'extract.json'), 'utf8'))

/** Known historical verify / risk codes from batch reports */
const HIST_VERIFY = new Set([
  'sub.Be',
  'sub.Ar',
  'el.Fe',
  'el.I',
  'el.Cr',
  'sub.P',
  'sub.P4O10',
  'sub.bleaching_powder',
  'exp.ops_burette',
  'exp.flame_test',
  'kp.extent.le_chatelier_basic',
  'concept.heat_of_reaction',
  'kp.organic.cracking',
  'kp.organic.pyrolysis',
  'kp.sustain.atom_economy',
  'kp.organic.biomolecule',
])

function textOf(it) {
  const d = it.dbRow || {}
  const parts = [
    d.name,
    d.canonical_formula,
    d.chemical_props,
    d.physical_props,
    d.canonical_equation,
    d.equation,
    d.ionic_equation,
    d.conditions,
    d.phenomenon,
    d.principle,
    d.oxidant,
    d.reductant,
    d.ox_product,
    d.re_product,
    d.electron_transfer,
    d.definition,
    d.description,
    d.expression,
    d.variables,
    d.units,
    d.applicable_conditions,
    d.purpose,
    d.conclusion,
    d.stem,
    d.answer,
    d.analysis,
    it.inventoryNote,
    it.dbReviewNote,
  ]
  return parts.filter(Boolean).join('\n')
}

function addIssue(issues, item, sev, kind, detail, fix) {
  issues.push({
    code: item.code,
    batch: item.batch,
    type: item.type,
    name: item.name,
    severity: sev,
    kind,
    detail,
    fix: fix || '',
    verifyNeeded: !!item.verifyNeeded,
    affectsDefaultTraining: sev === 'P0' || sev === 'P1' || !!item.verifyNeeded,
    blocksPublish: sev === 'P0' || sev === 'P1' || !!item.verifyNeeded,
  })
}

function gradeItem(it, issuesForItem) {
  // training grade A/B/C/D — suggestion only, not human approval
  const hasP0 = issuesForItem.some((x) => x.severity === 'P0')
  const hasP1 = issuesForItem.some((x) => x.severity === 'P1')
  if (hasP0) return 'D'
  if (it.verifyNeeded || HIST_VERIFY.has(it.code) || hasP1) return 'C'
  if (it.dbStatus === 'published' && it.code === 'q.eq.Na_water') return 'C'
  if (it.dbStatus === 'pending_review' || it.inventoryStatus === 'imported') return 'B'
  if (it.dbStatus === 'published' || it.inventoryStatus === 'seeded_audited') return 'B'
  return 'B'
}

function scienceVerdict(it, issuesForItem) {
  if (!it.dbExists) return '缺失'
  if (issuesForItem.some((x) => x.severity === 'P0')) return '需改(P0)'
  if (it.verifyNeeded || issuesForItem.some((x) => x.kind === 'scope_verify'))
    return '待核实'
  if (issuesForItem.some((x) => x.severity === 'P1')) return '需改(P1)'
  if (issuesForItem.some((x) => x.severity === 'P2' && x.kind === 'science'))
    return '需改(P2)'
  // cannot reliably prove all science → "未见明确错误" not "已人工确认"
  return '未见明确错误'
}

function checkReactionScience(it, issues) {
  const d = it.dbRow || {}
  const eq = String(d.canonical_equation || d.equation || '')
  if (!eq) {
    addIssue(issues, it, 'P1', 'science', '反应缺少方程式', '补全 canonical/equation')
    return
  }
  // crude atom balance check for simple = equations without organic complexity
  if (/[⇌→]/.test(eq) || /条件依赖|氧化产物/.test(eq)) {
    // skip strict balance for descriptive
  } else if (eq.includes('=') && !/[a-z\u4e00-\u9fff]/.test(eq.replace(/[A-Z][a-z]?/g, ''))) {
    // very light heuristic: left/right atom counts for common pattern — skip if chinese
  }

  const linkedRedox = (it.dbSpecialtyCodes || []).includes('redox')
  const hasOxFields = !!(d.oxidant || d.reductant || d.ox_product || d.re_product)
  const tags = it.tags || []
  const taggedNonRedox = tags.includes('non-redox')
  const taggedRedox = tags.includes('redox')

  if (linkedRedox && taggedNonRedox) {
    addIssue(
      issues,
      it,
      'P2',
      'link',
      '专项含redox但标签non-redox，可能误挂或口径冲突',
      '核对是否真属氧化还原；必要时去掉redox专项',
    )
  }
  if (linkedRedox && !hasOxFields && !/条件依赖|不指定/.test(String(d.ox_product || ''))) {
    // many organic redox have fields; if linked redox without any ox fields → P2
    if (!d.oxidant && !d.reductant) {
      addIssue(
        issues,
        it,
        'P2',
        'redox',
        '已关联redox专项但缺少氧化剂/还原剂字段',
        '补全或取消redox关联',
      )
    }
  }
  // swapped ox/re detection for known fixed patterns
  if (it.code === 'rxn.C2H5OH_O2') {
    if (d.ox_product !== 'CH3CHO' || d.re_product !== 'H2O') {
      addIssue(issues, it, 'P0', 'redox', '乙醇催化氧化 ox/re 与整改目标不符', '按B6整改口径修复')
    }
  }
  if (it.code === 'rxn.C2H5OH_burn') {
    if (d.ox_product !== 'CO2' || d.re_product !== 'H2O') {
      addIssue(issues, it, 'P0', 'redox', '乙醇燃烧 ox/re 与整改目标不符', '按B6整改口径修复')
    }
  }
  if (taggedRedox && d.ox_product && d.re_product && d.ox_product === d.re_product) {
    if (!/HCl|NaCl/.test(String(d.ox_product))) {
      // same product sometimes OK (HCl); flag ambiguous duplicates like both 氧化产物
      if (/氧化产物/.test(String(d.ox_product)) && /氧化产物/.test(String(d.re_product))) {
        addIssue(issues, it, 'P2', 'redox', 'ox/re 均笼统写氧化产物', '区分或注明不指定')
      }
    }
  }
}

function checkFormulaScience(it, issues) {
  const d = it.dbRow || {}
  const expr = String(d.expression || '')
  const cond = String(d.applicable_conditions || '') + String(d.units || '')
  const text = textOf(it)
  if (/22\.4/.test(expr + text) && !/标况|标准状况|STP|0\s*℃|273/.test(text + cond)) {
    addIssue(
      issues,
      it,
      'P1',
      'formula',
      '出现22.4但未见明确标况限制',
      '补充仅标况适用；禁无条件套用',
    )
  }
  if (!expr && it.type === 'formula') {
    addIssue(issues, it, 'P1', 'formula', '公式表达式缺失', '补全 expression')
  }
  if (it.type === 'formula' && !d.units && !/无量纲|定义/.test(text)) {
    addIssue(issues, it, 'P3', 'formula', '单位字段可能不完整', '核对 units')
  }
}

function checkExperiment(it, issues) {
  const d = it.dbRow || {}
  const text = textOf(it)
  const paper =
    /书面/.test(String(d.purpose || '') + String(d.home_forbidden_note || '')) ||
    /禁止家用|书面题目训练/.test(String(d.home_forbidden_note || d.safety_notes || ''))
  if (!paper && it.dbSpecialtyCodes.includes('experiment')) {
    addIssue(
      issues,
      it,
      'P2',
      'experiment',
      '实验条未见明确书面训练/禁家用定位',
      '补全 homeForbiddenNote 与书面 purpose',
    )
  }
  if (/请在家|自行实验|动手完成实验/.test(text) && !/禁止|不要|勿/.test(text)) {
    addIssue(issues, it, 'P0', 'experiment', '疑似鼓励线下危险实验', '改为书面分析并禁止家用')
  }
}

function checkQuestion(it, issues) {
  const d = it.dbRow || {}
  if (!d.stem || !d.answer) {
    addIssue(issues, it, 'P1', 'question', '题干或答案缺失', '补全骨架字段')
  }
  if (it.code === 'q.eq.Na_water') {
    addIssue(
      issues,
      it,
      'P2',
      'question',
      'published复用题：题干问生成物非方程式；无[inv:]；不宜作方程式自动判题标准（训练适配风险）',
      '勿覆盖published；新建pending方程式骨架或人工升级采分点',
    )
  } else if (it.dbStatus === 'pending_review' && !it.hasInvTag) {
    addIssue(
      issues,
      it,
      'P2',
      'question',
      'pending_review 题目缺少 [inv:CODE] reviewNote',
      '回填 reviewNote（全库整改时处理）',
    )
  } else if (
    it.dbStatus === 'published' &&
    !it.hasInvTag &&
    it.code !== 'q.eq.Na_water'
  ) {
    // seeded published: no inv is historical, not invalid
    addIssue(
      issues,
      it,
      'P3',
      'question',
      'published历史题无[inv:]标记（字段可存在；不等于无效知识）',
      '全库整改时可补inv，勿覆盖题干答案',
    )
  }
  // skeleton auto-grade risk
  if (/骨架|非正式/.test(String(it.dbReviewNote || '') + String(d.stem || '')) || /（骨架）/.test(String(d.stem || ''))) {
    // informational P3
    addIssue(
      issues,
      it,
      'P3',
      'question',
      '题目骨架非正式卷库，自动判题需额外约束',
      '启用前固化采分点与条件',
    )
  }
}

function checkLinks(it, issues) {
  const expS = new Set(it.specialtyCodes || [])
  const gotS = new Set(it.dbSpecialtyCodes || [])
  // inventory vs DB — only flag if both non-empty and clearly diverge for imported
  if (it.dbExists && it.inventoryStatus === 'imported' && expS.size) {
    for (const s of expS) {
      if (!gotS.has(s)) {
        addIssue(
          issues,
          it,
          'P2',
          'link',
          `清单专项 ${s} 未在DB关联`,
          '同步 chem_entity_specialties',
        )
      }
    }
  }
  // organic reaction classic bad triple
  const cats = it.dbCategoryCodes || []
  if (
    it.type === 'reaction' &&
    cats.includes('organic.substitution') &&
    cats.includes('organic.addition') &&
    cats.includes('organic.esterification')
  ) {
    addIssue(
      issues,
      it,
      'P2',
      'link',
      '有机反应仍挂取代+加成+酯化三类',
      '按反应类型收窄 category',
    )
  }
}

function checkScope(it, issues) {
  if (it.verifyNeeded || HIST_VERIFY.has(it.code)) {
    addIssue(
      issues,
      it,
      'P1',
      'scope_verify',
      it.verifyNeeded
        ? 'inventory.verifyNeeded=true，待教材核实，不得视为人工已审'
        : '历史报告待核实/范围争议条目，需再确认教材口径',
      '教材定点核实前限制默认训练',
    )
  }
  const text = textOf(it) + (it.curriculumScope || '')
  if (/选择性必修|超纲/.test(text) && !/了解|限制|排除|勿默认|exclude/i.test(text + (it.dbReviewNote || ''))) {
    addIssue(
      issues,
      it,
      'P2',
      'scope',
      '提及选择性必修/超纲但限制标记可能不足',
      '明确默认训练排除',
    )
  }
}

function checkCoverageMeta(it, issues) {
  if (!it.dbExists) {
    addIssue(issues, it, 'P0', 'coverage', '数据库无对应记录', '核对 dbId/导入映射并补导入')
    return
  }
  if (it.dbStatus === 'published' && it.verifyNeeded) {
    addIssue(
      issues,
      it,
      'P1',
      'status',
      '待教材核实却已 published',
      '限制训练；勿扩大发布',
    )
  }
  // pending_review without inv for non-question types that were imported
  if (
    it.inventoryStatus === 'imported' &&
    it.dbStatus === 'pending_review' &&
    !it.hasInvTag &&
    it.type !== 'question'
  ) {
    addIssue(
      issues,
      it,
      'P2',
      'status',
      'imported/pending_review 缺少 [inv:CODE]',
      '回填 reviewNote',
    )
  }
}

/** Cross-batch: group by normalized equation */
function buildConflictIndex(items) {
  const byEq = new Map()
  for (const it of items) {
    if (it.type !== 'reaction' || !it.dbRow) continue
    const key = String(it.dbRow.canonical_equation || '')
      .replace(/\s+/g, '')
      .replace(/⇌/g, '=')
    if (!key || key.length < 4) continue
    if (!byEq.has(key)) byEq.set(key, [])
    byEq.get(key).push(it)
  }
  const conflicts = []
  for (const [key, list] of byEq) {
    if (list.length < 2) continue
    // different conditions or ox/re
    const conds = new Set(list.map((x) => String(x.dbRow.conditions || '').trim()))
    const ox = new Set(list.map((x) => String(x.dbRow.ox_product || '').trim()))
    const re = new Set(list.map((x) => String(x.dbRow.re_product || '').trim()))
    if (conds.size > 1 || ox.size > 1 || re.size > 1) {
      conflicts.push({
        kind: 'reaction_field_divergence',
        canonical: key,
        codes: list.map((x) => x.code),
        batches: [...new Set(list.map((x) => x.batch))],
        detail: {
          conditions: [...conds],
          ox_product: [...ox],
          re_product: [...re],
        },
      })
    } else {
      // duplicate encodings same fact
      conflicts.push({
        kind: 'possible_duplicate_reaction',
        canonical: key,
        codes: list.map((x) => x.code),
        batches: [...new Set(list.map((x) => x.batch))],
        detail: '同一 canonical 多编码；多专项挂靠本身允许，需人工确认是否冗余实体',
      })
    }
  }

  // substance chemical_props vs reaction mentions — sample Na water / Cl2
  const nameIndex = new Map()
  for (const it of items) {
    const n = (it.name || '').trim()
    if (!n) continue
    if (!nameIndex.has(n)) nameIndex.set(n, [])
    nameIndex.get(n).push(it)
  }
  for (const [name, list] of nameIndex) {
    if (list.length < 2) continue
    const types = new Set(list.map((x) => x.type))
    if (types.size >= 2 || list.length >= 2) {
      conflicts.push({
        kind: 'same_name_multi_code',
        name,
        codes: list.map((x) => x.code),
        batches: [...new Set(list.map((x) => x.batch))],
        types: [...types],
        detail: '同名多编码，检查是否重复建设或合理分型',
      })
    }
  }

  return conflicts
}

function main() {
  const items = extract.items
  const allIssues = []
  const perItem = []

  for (const it of items) {
    const before = allIssues.length
    checkCoverageMeta(it, allIssues)
    checkLinks(it, allIssues)
    checkScope(it, allIssues)
    if (it.type === 'reaction') checkReactionScience(it, allIssues)
    if (it.type === 'formula' || /formula\.|kp\.calc/.test(it.code))
      checkFormulaScience(it, allIssues)
    if (it.type === 'experiment') checkExperiment(it, allIssues)
    if (it.type === 'question') checkQuestion(it, allIssues)

    // text-level science heuristics for eq/redox in non-reaction types
    const text = textOf(it)
    if (it.type !== 'reaction' && /22\.4/.test(text) && !/标况|标准状况|STP/.test(text)) {
      addIssue(
        allIssues,
        it,
        'P2',
        'formula',
        '正文含22.4且未见标况限制',
        '补充标况条件',
      )
    }

    const myIssues = allIssues.slice(before)
    const trainGrade = gradeItem(it, myIssues)
    const science = scienceVerdict(it, myIssues)
    const maxSev = myIssues.reduce((m, x) => {
      const order = { P0: 0, P1: 1, P2: 2, P3: 3 }
      if (m == null) return x.severity
      return order[x.severity] < order[m] ? x.severity : m
    }, null)

    perItem.push({
      code: it.code,
      batch: it.batch,
      type: it.type,
      name: it.name,
      dbId: it.dbId,
      dbExists: it.dbExists,
      dbStatus: it.dbStatus,
      inventoryStatus: it.inventoryStatus,
      hasInvTag: it.hasInvTag,
      verifyNeeded: it.verifyNeeded,
      specialtyCodes: it.specialtyCodes,
      dbSpecialtyCodes: it.dbSpecialtyCodes,
      categoryCodes: it.categoryCodes,
      dbCategoryCodes: it.dbCategoryCodes,
      scienceVerdict: science,
      trainGrade,
      maxSeverity: maxSev,
      issueCount: myIssues.length,
      issues: myIssues.map((x) => ({
        severity: x.severity,
        kind: x.kind,
        detail: x.detail,
      })),
      // coverage conclusion required
      coverageOk: it.dbExists,
      statusOk:
        !!it.dbStatus &&
        !(it.verifyNeeded && it.dbStatus === 'published'),
      formalTrainReady: false, // never true without human review
      note:
        trainGrade === 'A'
          ? '建议级A仍须人工审核，不得直接发布'
          : trainGrade === 'C'
            ? '受限/待核实，勿默认正式训练'
            : trainGrade === 'D'
              ? '禁止自动出题直至修复'
              : '内容基本可用建议，仍须人工审核',
    })
  }

  // Force: no item gets trainGrade A without human review per user rules
  for (const p of perItem) {
    if (p.trainGrade === 'A') p.trainGrade = 'B'
    p.formalTrainReady = false
  }

  const conflicts = buildConflictIndex(items)

  // specialty / category coverage
  const specCover = {}
  for (const code of extract.specialties) {
    const linked = items.filter((i) => (i.dbSpecialtyCodes || []).includes(code))
    const withQ = linked.filter((i) => i.type === 'question')
    specCover[code] = {
      knowledgeLinks: linked.length,
      questionLinks: withQ.length,
      autoQuizReady: false, // knowledge ≠ quiz capacity
      note:
        linked.length === 0
          ? '无关联知识'
          : withQ.length === 0
            ? '有知识无question骨架，不足以认定可自动出题'
            : '有知识且有question关联，仍非正式题库',
    }
  }
  const catCover = {}
  for (const c of extract.categories) {
    const linked = items.filter((i) => (i.dbCategoryCodes || []).includes(c.code))
    catCover[c.code] = {
      specialty: c.specialty,
      knowledgeLinks: linked.length,
      empty: linked.length === 0,
    }
  }

  // status stats from DB
  const dbStatus = {}
  for (const it of items) {
    const s = it.dbStatus || 'MISSING'
    dbStatus[s] = (dbStatus[s] || 0) + 1
  }

  // issue aggregates
  const issueBySev = { P0: 0, P1: 0, P2: 0, P3: 0 }
  const codesBySev = { P0: new Set(), P1: new Set(), P2: new Set(), P3: new Set() }
  for (const iss of allIssues) {
    issueBySev[iss.severity]++
    codesBySev[iss.severity].add(iss.code)
  }

  const gradeCount = { A: 0, B: 0, C: 0, D: 0 }
  for (const p of perItem) gradeCount[p.trainGrade]++

  const reused = items.filter(
    (i) =>
      i.inventoryStatus === 'seeded' ||
      i.inventoryStatus === 'seeded_audited' ||
      (i.code === 'q.eq.Na_water'),
  )

  const summary = {
    auditedAt: new Date().toISOString(),
    readOnly: true,
    planned: 377,
    covered: perItem.filter((p) => p.coverageOk).length,
    missing: perItem.filter((p) => !p.coverageOk).map((p) => p.code),
    physicalTotal: extract.physicalTotal,
    physicalCounts: extract.physicalCounts,
    reusedInventoryCodes: reused.length,
    dbStatus,
    verifyNeededCount: items.filter((i) => i.verifyNeeded).length,
    issueCountBySeverity: issueBySev,
    itemCountBySeverity: {
      P0: codesBySev.P0.size,
      P1: codesBySev.P1.size,
      P2: codesBySev.P2.size,
      P3: codesBySev.P3.size,
    },
    trainGradeCount: gradeCount,
    specialtyCount: extract.specialties.length,
    categoryCount: extract.categories.length,
    emptyCategories: Object.entries(catCover)
      .filter(([, v]) => v.empty)
      .map(([k]) => k),
    conflictCount: conflicts.length,
    questionCount: items.filter((i) => i.type === 'question').length,
  }

  fs.writeFileSync(path.join(OUT, 'per_item.json'), JSON.stringify({ summary, items: perItem }, null, 2) + '\n')
  fs.writeFileSync(path.join(OUT, 'issues.json'), JSON.stringify(allIssues, null, 2) + '\n')
  fs.writeFileSync(path.join(OUT, 'conflicts.json'), JSON.stringify(conflicts, null, 2) + '\n')
  fs.writeFileSync(
    path.join(OUT, 'specialty_coverage.json'),
    JSON.stringify({ specialties: specCover, categories: catCover }, null, 2) + '\n',
  )
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')

  console.log(JSON.stringify(summary, null, 2))
}

main()
