import { HIGH_SCHOOL_1_KNOWN_KNOWLEDGE } from './industrial-quality.constants'
import { mkCheck } from './industrial-quality.rules'
import type { IndustrialQualityCandidateBundle } from './industrial-quality.types'
import type { IndustrialQualityCheckResult } from './industrial-quality.types'
import { validateIndustrialCase } from './industrial-case.validate'

export function checkCurriculumDimension(
  bundle: IndustrialQualityCandidateBundle,
): IndustrialQualityCheckResult[] {
  const out: IndustrialQualityCheckResult[] = []
  const c = bundle.industrialCase
  const q = bundle.candidate

  out.push(
    mkCheck({
      checkCode: 'CURR_GRADE_SCOPE',
      dimension: 'curriculum',
      status: c.gradeScope === 'high_school_1' ? 'pass' : 'fail',
      severity: c.gradeScope === 'high_school_1' ? 'info' : 'error',
      message:
        c.gradeScope === 'high_school_1'
          ? '案例 gradeScope 为 high_school_1'
          : `gradeScope=${c.gradeScope} 非高一`,
      evidence: [`gradeScope=${c.gradeScope}`],
    }),
  )

  const curr = c.curriculumScope.curriculumReviewStatus
  if (curr === 'approved') {
    out.push(
      mkCheck({
        checkCode: 'CURR_REVIEW_STATUS',
        dimension: 'curriculum',
        status: 'pass',
        severity: 'info',
        message: '课程审核已通过',
        evidence: [`curriculumReviewStatus=${curr}`],
      }),
    )
  } else if (curr === 'rejected') {
    out.push(
      mkCheck({
        checkCode: 'CURR_REVIEW_STATUS',
        dimension: 'curriculum',
        status: 'fail',
        severity: 'error',
        message: '课程审核已拒绝',
        evidence: [`curriculumReviewStatus=${curr}`],
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'CURR_REVIEW_STATUS',
        dimension: 'curriculum',
        status: 'unknown',
        severity: 'warning',
        message: '课程审核未完成，不能认定课程适配已通过',
        evidence: [`curriculumReviewStatus=${curr}`],
      }),
    )
  }

  if (![1, 2, 3].includes(q.difficulty)) {
    out.push(
      mkCheck({
        checkCode: 'CURR_DIFFICULTY',
        dimension: 'curriculum',
        status: 'fail',
        severity: 'error',
        message: 'difficulty 非法',
        evidence: [`difficulty=${q.difficulty}`],
      }),
    )
  } else {
    const inRange =
      q.difficulty >= c.difficultyRange.min &&
      q.difficulty <= c.difficultyRange.max
    out.push(
      mkCheck({
        checkCode: 'CURR_DIFFICULTY',
        dimension: 'curriculum',
        status: inRange ? 'pass' : 'unknown',
        severity: inRange ? 'info' : 'warning',
        message: inRange
          ? '难度在案例 difficultyRange 内'
          : '难度超出案例声明范围（未证明超纲，记 unknown）',
        evidence: [
          `q=${q.difficulty}`,
          `range=${c.difficultyRange.min}-${c.difficultyRange.max}`,
        ],
      }),
    )
  }

  const known = new Set<string>(HIGH_SCHOOL_1_KNOWN_KNOWLEDGE as unknown as string[])
  const caseKp = new Set(c.curriculumScope.knowledgePoints || [])
  let covered = 0
  let uncovered: string[] = []
  for (const kp of q.knowledgePoints) {
    if (known.has(kp) || caseKp.has(kp)) covered += 1
    else uncovered.push(kp)
  }
  if (q.knowledgePoints.length === 0) {
    out.push(
      mkCheck({
        checkCode: 'CURR_KNOWLEDGE_POINTS',
        dimension: 'curriculum',
        status: 'fail',
        severity: 'error',
        message: '题目知识点为空',
      }),
    )
  } else if (uncovered.length === 0) {
    out.push(
      mkCheck({
        checkCode: 'CURR_KNOWLEDGE_POINTS',
        dimension: 'curriculum',
        status: 'pass',
        severity: 'info',
        message: '知识点均在有限白名单或案例 curriculumScope 内',
        evidence: q.knowledgePoints,
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'CURR_KNOWLEDGE_POINTS',
        dimension: 'curriculum',
        status: 'unknown',
        severity: 'warning',
        message: '部分知识点超出有限白名单，无法证明课程适配',
        evidence: uncovered,
      }),
    )
  }

  if (bundle.categoryCode && !c.categoryCodes.includes(bundle.categoryCode as never)) {
    out.push(
      mkCheck({
        checkCode: 'CURR_CATEGORY',
        dimension: 'curriculum',
        status: 'fail',
        severity: 'error',
        message: '题目分类不在案例 categoryCodes 中',
        evidence: [bundle.categoryCode, ...c.categoryCodes],
      }),
    )
  } else if (bundle.categoryCode) {
    out.push(
      mkCheck({
        checkCode: 'CURR_CATEGORY',
        dimension: 'curriculum',
        status: 'pass',
        severity: 'info',
        message: '分类与案例一致',
        evidence: [bundle.categoryCode],
      }),
    )
  }

  // 正式可信度：fixture 或 E2-B2 有效审核覆盖层
  const v = validateIndustrialCase(c)
  const eff = bundle.effectiveCaseReview
  const effectiveOk =
    !!eff?.grantsEffectivePublishEligibility && !!eff?.publishEligible
  if (bundle.developmentOnly) {
    out.push(
      mkCheck({
        checkCode: 'CURR_CASE_TRUST_DEV',
        dimension: 'curriculum',
        status: 'unknown',
        severity: 'warning',
        message: 'development_only：案例可信度不构成正式课程通过',
        evidence: [
          `reviewStatus=${c.reviewStatus}`,
          `publishEligible=${v.publishEligible}`,
          `effectiveOk=${effectiveOk}`,
        ],
      }),
    )
  } else if (effectiveOk) {
    out.push(
      mkCheck({
        checkCode: 'CURR_CASE_TRUST',
        dimension: 'curriculum',
        status: 'pass',
        severity: 'info',
        message:
          '有效案例审核已授予正式可信度（fixture 可仍为 draft；仍非化学证明）',
        evidence: [
          `rawReviewStatus可能仍为draft`,
          `effectiveReviewStatus=${eff?.effectiveReviewStatus}`,
          `grantsEffectivePublishEligibility=true`,
        ],
      }),
    )
  } else if (!v.publishEligible || c.reviewStatus === 'draft') {
    out.push(
      mkCheck({
        checkCode: 'CURR_CASE_TRUST',
        dimension: 'curriculum',
        status: 'fail',
        severity: 'critical',
        message: '正式候选要求案例已审核且 publishEligible',
        evidence: [
          `reviewStatus=${c.reviewStatus}`,
          `publishEligible=${v.publishEligible}`,
          `effectiveOk=${effectiveOk}`,
          ...v.errors.slice(0, 5),
        ],
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'CURR_CASE_TRUST',
        dimension: 'curriculum',
        status: 'pass',
        severity: 'info',
        message: '案例满足正式发布结构门槛（仍非化学证明）',
        evidence: [`reviewStatus=${c.reviewStatus}`],
      }),
    )
  }

  void covered
  return out
}
