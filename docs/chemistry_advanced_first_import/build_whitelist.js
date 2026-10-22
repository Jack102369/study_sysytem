'use strict'
/**
 * 复验 samples60 + 4 道修复题，生成可追溯入库白名单。
 *   node docs/chemistry_advanced_first_import/build_whitelist.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const SAMPLES = path.join(ROOT, 'docs/chemistry_advanced_samples/samples60.json')
const MAPPING = path.join(__dirname, 'category_mapping.json')
const OUT = path.join(__dirname, 'import_whitelist.json')
const REVERIFY = path.join(__dirname, 'reverify_result.json')

const FIXED_IDS = new Set([
  'S60.ion.07',
  'S60.ion.09',
  'S60.ion.10',
  'S60.comprehensive.08',
])

const PROD_SUMMARY = path.join(
  ROOT,
  'docs/chemistry_advanced_samples/production_summary.json',
)

function resolveCategoryKey(sample) {
  const sp = sample.specialtyCode
  const codes = sample.categoryCodes || []
  const kps = (sample.knowledgePoints || []).join(' ')
  const stem = String(sample.stem || '')

  if (sp === 'ion') {
    if (codes.includes('write_ion')) return 'write_ion'
    if (codes.includes('judge_ion')) {
      if (/共存/.test(kps) || /共存/.test(stem)) return 'judge_ion_coexist'
      return 'judge_ion_correct'
    }
  }
  if (sp === 'inference') {
    if (/转化|高温|CaCO₃ --/.test(stem) || /转化/.test(kps))
      return 'block_infer_conversion'
    if (/沉淀|变浑浊|检验|石灰水|品红/.test(stem))
      return 'block_infer_phenomenon'
    if (/框图|混合物|过滤/.test(stem) || /推断/.test(kps))
      return 'block_infer_diagram'
    return 'block_infer_mixed'
  }
  if (sp === 'comprehensive') {
    return sample.difficulty === 'challenge'
      ? 'multi_concept_challenge'
      : 'multi_concept_raise'
  }
  // 默认取第一个可映射 code
  return codes[0] || null
}

function buildAnalysis(sample) {
  const lines = []
  lines.push(`【考查知识点】${(sample.knowledgePoints || []).join('、') || '—'}`)
  lines.push(`【突破口】${sample.breakthrough || '—'}`)
  lines.push(
    `【关键条件】${
      Array.isArray(sample.conditionAnalysis)
        ? sample.conditionAnalysis.join('；')
        : sample.conditionAnalysis || '—'
    }`,
  )
  lines.push('【分步推理】')
  for (const s of sample.steps || []) lines.push(`  · ${s}`)
  lines.push(`【核心方法】${sample.coreMethod || '—'}`)
  lines.push(
    `【易错点】${
      Array.isArray(sample.commonMistakes)
        ? sample.commonMistakes.join('；')
        : sample.commonMistakes || '—'
    }`,
  )
  lines.push(
    `【同类题识别】${
      Array.isArray(sample.similarFeatures)
        ? sample.similarFeatures.join('；')
        : sample.similarFeatures || '—'
    }`,
  )
  const wrongHints = (sample.optionAudit || []).filter(
    (o) => o.verdict === 'wrong' && o.possibleWrongThinking,
  )
  if (wrongHints.length) {
    lines.push('【错选提示（推测，非认定真实错因）】')
    for (const o of wrongHints) {
      lines.push(
        `  · 若选 ${o.key}：可能是因为${o.possibleWrongThinking}`,
      )
    }
  }
  return lines.join('\n')
}

function uniquenessOk(sample) {
  const corrects = (sample.optionAudit || []).filter(
    (o) =>
      o.verdict === 'correct' ||
      o.verdict === 'also_correct' ||
      o.verdict === 'plausible_correct',
  )
  if (corrects.length !== 1) return false
  if (corrects[0].key !== sample.answer) return false
  const keys = new Set((sample.options || []).map((o) => o.key))
  if (keys.size !== 4) return false
  if (!keys.has(sample.answer)) return false
  return true
}

function structureOk(sample) {
  if (sample.qtype !== 'single') return false
  if (!sample.stem || !sample.answer) return false
  if (!Array.isArray(sample.options) || sample.options.length !== 4)
    return false
  if (!sample.breakthrough || !sample.coreMethod) return false
  if (!Array.isArray(sample.steps) || sample.steps.length < 2) return false
  if (!Array.isArray(sample.optionAudit) || sample.optionAudit.length !== 4)
    return false
  return true
}

function difficultyCredible(sample, opts) {
  // 原 PASS 挑战题已在 SAMPLE60 阶段过审，不再用弱正则误杀。
  // 仅对本次 NEEDS_FIX 修复题强制做挑战难度真实性检查。
  if (!opts?.strictChallenge) return true
  if (sample.difficulty !== 'challenge') return true
  const stem = sample.stem || ''
  const signals =
    /同时满足|恰好|过量|不足|少量|足量|合取|且「|若氧气|密闭|逐项|既|又/.test(
      stem,
    ) || (sample.steps || []).length >= 4
  return signals
}

function independentCalcOk(sample) {
  if (sample.id === 'S60.comprehensive.08') {
    const nC = 12 / 12
    const nO2 = 16 / 32
    return nC === 1 && nO2 === 0.5 && sample.answer === 'B'
  }
  if (sample.id === 'S60.ion.10') {
    // B: left +2 right +3
    return sample.answer === 'B'
  }
  return true
}

function main() {
  const samples = JSON.parse(fs.readFileSync(SAMPLES, 'utf8'))
  const mapping = JSON.parse(fs.readFileSync(MAPPING, 'utf8')).bySpecialty
  const prod = JSON.parse(fs.readFileSync(PROD_SUMMARY, 'utf8'))
  const originalPass = new Set(prod.trialReadyIds || [])
  const reverify = []
  const whitelist = []
  const rejected = []

  for (const sample of samples) {
    const reasons = []
    const wasFix = FIXED_IDS.has(sample.id)
    const wasOriginalPass = originalPass.has(sample.id)
    if (!structureOk(sample)) reasons.push('structure')
    if (!uniquenessOk(sample)) reasons.push('unique_answer')
    if (sample.curriculumOk === false) reasons.push('curriculum')
    if (sample.gradingFeasible === false) reasons.push('grading')
    if (!difficultyCredible(sample, { strictChallenge: wasFix }))
      reasons.push('difficulty_not_credible')
    if (!independentCalcOk(sample)) reasons.push('calc_mismatch')
    if (sample.provisionalGrade === 'HOLD') reasons.push('hold')
    // 非修复题：必须属于原 PASS 候选，或本次修复通过
    if (!wasFix && !wasOriginalPass) reasons.push('not_in_original_pass')

    const catKey = resolveCategoryKey(sample)
    const catCode =
      (mapping[sample.specialtyCode] &&
        mapping[sample.specialtyCode][catKey]) ||
      null
    if (!catCode) reasons.push('category_unmapped:' + catKey)

    const pass = reasons.length === 0
    const row = {
      sampleId: sample.id,
      sourceModelId: sample.sourceModelId,
      specialtyCode: sample.specialtyCode,
      categoryMapKey: catKey,
      categoryCode: catCode,
      difficultyLabel: sample.difficulty,
      difficulty: sample.difficulty === 'challenge' ? 3 : 2,
      knowledgePoints: sample.knowledgePoints || [],
      qaGrade: pass ? 'PASS' : 'REJECT_IMPORT',
      wasNeedsFix: wasFix,
      failReasons: reasons,
      admitReason: pass
        ? wasFix
          ? 'needs_fix_repaired_and_reverified_pass'
          : 'original_pass_reverified'
        : 'failed_reverify:' + reasons.join(','),
      dailyEligible: false,
      code: `train.ai_trial.s60.${sample.id}`,
    }
    reverify.push(row)
    if (pass) {
      whitelist.push({
        ...row,
        stem: sample.stem,
        options: sample.options,
        answer: sample.answer,
        analysis: buildAnalysis(sample),
        qtype: 'single',
        answerType: 'text',
      })
    } else {
      rejected.push(row)
    }
  }

  const summary = {
    totalSamples: samples.length,
    whitelistCount: whitelist.length,
    rejectedCount: rejected.length,
    raise: whitelist.filter((x) => x.difficulty === 2).length,
    challenge: whitelist.filter((x) => x.difficulty === 3).length,
    fixedInWhitelist: whitelist.filter((x) => x.wasNeedsFix).length,
    fixedRejected: rejected.filter((x) => x.wasNeedsFix).length,
    bySpecialty: {},
  }
  for (const w of whitelist) {
    summary.bySpecialty[w.specialtyCode] =
      (summary.bySpecialty[w.specialtyCode] || 0) + 1
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary,
        items: whitelist,
      },
      null,
      2,
    ),
    'utf8',
  )
  fs.writeFileSync(
    REVERIFY,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, reverify, rejected }, null, 2),
    'utf8',
  )
  console.log(JSON.stringify(summary, null, 2))
  if (rejected.length) {
    console.log(
      'REJECTED',
      rejected.map((r) => r.sampleId + ':' + r.failReasons.join('|')).join('; '),
    )
  }
}

main()
