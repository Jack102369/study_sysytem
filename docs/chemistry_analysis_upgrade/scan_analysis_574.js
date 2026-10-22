'use strict'
/**
 * 只读：扫描原有574道可训练题的解析质量与能力等级。
 * 禁止写库。用法：node docs/chemistry_analysis_upgrade/scan_analysis_574.js
 */
const fs = require('fs')
const path = require('path')
const {
  OUT_DIR,
  openDb,
  loadOldEligible,
  gradeAnalysis,
  inferAbility,
} = require('./lib_common')

async function main() {
  const { conn } = await openDb()
  const rows = await loadOldEligible(conn)

  // 抽检校准：随机抽 A/B 边界样本供人工规则复核（写入 meta，不改题）
  const items = []
  const gradeCount = { A: 0, B: 0, C: 0, D: 0 }
  const bySpecGrade = {}
  const byDiffGrade = {}
  const abilityCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const inflated = []
  const riskList = []

  for (const r of rows) {
    const g = gradeAnalysis(r.analysis, r.answer, r.stem)
    const ab = inferAbility({
      stem: r.stem,
      code: r.code,
      difficulty: r.difficulty,
      specialty_code: r.specialty_code,
    })
    gradeCount[g.grade]++
    abilityCount[ab.abilityLevel] = (abilityCount[ab.abilityLevel] || 0) + 1
    if (!bySpecGrade[r.specialty_code]) {
      bySpecGrade[r.specialty_code] = { A: 0, B: 0, C: 0, D: 0, total: 0 }
    }
    bySpecGrade[r.specialty_code][g.grade]++
    bySpecGrade[r.specialty_code].total++
    const dk = String(r.difficulty)
    if (!byDiffGrade[dk]) byDiffGrade[dk] = { A: 0, B: 0, C: 0, D: 0, total: 0 }
    byDiffGrade[dk][g.grade]++
    byDiffGrade[dk].total++

    const risks = [...g.risks]
    if (Number(r.verify_blocked) === 1) risks.push('VERIFY_BLOCKED_FLAG')
    if (/verifyNeeded|待核实/i.test(String(r.gate_note || ''))) risks.push('SCIENCE_RISK')

    if (ab.difficultyInflated) {
      inflated.push(String(r.id))
    }

    const rec = {
      id: String(r.id),
      code: r.code,
      specialtyCode: r.specialty_code,
      specialtyName: r.specialty_name,
      categoryCode: r.category_code,
      categoryName: r.category_name,
      difficulty: Number(r.difficulty),
      qtype: r.qtype,
      answerType: r.answer_type,
      analysisGrade: g.grade,
      analysisGradeReasons: g.reasons,
      analysisLength: g.length,
      abilityLevel: ab.abilityLevel,
      abilityLabel: ab.abilityLabel,
      abilityTags: ab.abilityTags,
      difficultyInflated: ab.difficultyInflated,
      riskFlags: risks,
      originalAnalysis: r.analysis,
      stemPreview: String(r.stem || '').slice(0, 120),
      answer: r.answer,
    }
    items.push(rec)

    if (risks.length) {
      riskList.push({
        id: rec.id,
        code: rec.code,
        specialtyCode: rec.specialtyCode,
        risks,
        note: 'scan_stage_flag_only',
      })
    }
  }

  // 边界抽检：A 中偏长、B 中偏短、含「来源」但有化学词
  const boundarySamples = {
    A_longish: items
      .filter((x) => x.analysisGrade === 'A' && x.analysisLength > 60)
      .slice(0, 8)
      .map((x) => ({
        id: x.id,
        code: x.code,
        grade: x.analysisGrade,
        reasons: x.analysisGradeReasons,
        analysis: x.originalAnalysis,
      })),
    B_short_with_chem: items
      .filter((x) => x.analysisGrade === 'B' && x.analysisLength < 80)
      .slice(0, 8)
      .map((x) => ({
        id: x.id,
        code: x.code,
        grade: x.analysisGrade,
        reasons: x.analysisGradeReasons,
        analysis: x.originalAnalysis,
      })),
    source_but_maybe_C: items
      .filter(
        (x) =>
          /^来源/.test(String(x.originalAnalysis || '')) &&
          x.analysisGrade !== 'A',
      )
      .slice(0, 8)
      .map((x) => ({
        id: x.id,
        code: x.code,
        grade: x.analysisGrade,
        analysis: x.originalAnalysis,
      })),
  }

  const out = {
    generatedAt: new Date().toISOString(),
    readonly: true,
    noDbWrite: true,
    scope: {
      rule: "pool=test approved active NOT trial_access:block NOT s60",
      count: items.length,
      expectedApprox: 574,
    },
    summary: {
      gradeCount,
      bySpecialtyGrade: bySpecGrade,
      byDifficultyGrade: byDiffGrade,
      abilityCount,
      difficultyInflatedCount: inflated.length,
      riskFlaggedCount: riskList.length,
    },
    boundaryCalibrationSamples: boundarySamples,
    calibrationNote:
      '分级不以字数为主：短而有明确化学依据可为C；来源字段式无化学解释为A。本抽检供规则校准记录。',
    items,
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'analysis_audit_574.json'),
    JSON.stringify(out, null, 2),
    'utf8',
  )
  fs.writeFileSync(
    path.join(OUT_DIR, 'question_risk_list.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: '扫描阶段风险标记；题目本身问题在样本核验阶段追加',
        count: riskList.length,
        items: riskList,
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(
    JSON.stringify(
      {
        count: items.length,
        gradeCount,
        abilityCount,
        inflated: inflated.length,
        risk: riskList.length,
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
