import {
  INDUSTRIAL_QUALITY_VERSION,
  type IndustrialQualityOverallStatus,
} from './industrial-quality.constants'
import type {
  IndustrialQualityCheckResult,
  IndustrialQualitySummary,
  MkCheckInput,
} from './industrial-quality.types'

export function mkCheck(input: MkCheckInput): IndustrialQualityCheckResult {
  return {
    checkCode: input.checkCode,
    dimension: input.dimension,
    status: input.status,
    severity: input.severity,
    message: input.message,
    evidence: input.evidence || [],
    checkerVersion: INDUSTRIAL_QUALITY_VERSION,
    checkedAt: new Date().toISOString(),
  }
}

export function summarizeChecks(
  checks: IndustrialQualityCheckResult[],
): IndustrialQualitySummary {
  let pass = 0
  let fail = 0
  let unknown = 0
  let criticalFail = 0
  let errorFail = 0
  let warningCount = 0
  for (const c of checks) {
    if (c.status === 'pass') pass += 1
    else if (c.status === 'fail') {
      fail += 1
      if (c.severity === 'critical') criticalFail += 1
      if (c.severity === 'error') errorFail += 1
    } else unknown += 1
    if (c.severity === 'warning' && c.status !== 'fail') warningCount += 1
  }
  return {
    total: checks.length,
    pass,
    fail,
    unknown,
    criticalFail,
    errorFail,
    warningCount,
  }
}

/**
 * 确定性聚合：critical/error fail → failed；无 fail 有 unknown → incomplete；否则 passed。
 * AI 结果不得覆盖程序 fail。
 */
export function aggregateOverallStatus(
  checks: IndustrialQualityCheckResult[],
): IndustrialQualityOverallStatus {
  const summary = summarizeChecks(checks)
  if (summary.criticalFail > 0 || summary.errorFail > 0 || summary.fail > 0) {
    return 'failed_automatic_checks'
  }
  if (summary.unknown > 0) return 'incomplete_verification'
  return 'passed_automatic_checks'
}

export function collectBlockingIssues(
  checks: IndustrialQualityCheckResult[],
): string[] {
  return checks
    .filter(
      (c) =>
        c.status === 'fail' &&
        (c.severity === 'critical' || c.severity === 'error'),
    )
    .map((c) => `${c.checkCode}: ${c.message}`)
}

export function collectWarnings(checks: IndustrialQualityCheckResult[]): string[] {
  return checks
    .filter((c) => c.severity === 'warning')
    .map((c) => `${c.checkCode}: ${c.message}`)
}

export function collectUnknownIssues(
  checks: IndustrialQualityCheckResult[],
): string[] {
  return checks
    .filter((c) => c.status === 'unknown')
    .map((c) => `${c.checkCode}: ${c.message}`)
}

/**
 * formalPublishEligible：仅当自动检查无 fail、案例可信、非 development_only。
 * 仍要求人工审核；不等于 approved。
 */
export function computeFormalPublishEligible(input: {
  overallStatus: IndustrialQualityOverallStatus
  developmentOnly: boolean
  caseTrusted: boolean
  hasCriticalOrErrorFail: boolean
}): boolean {
  if (input.developmentOnly) return false
  if (!input.caseTrusted) return false
  if (input.hasCriticalOrErrorFail) return false
  if (input.overallStatus === 'failed_automatic_checks') return false
  // incomplete 仍不允许正式发布
  if (input.overallStatus === 'incomplete_verification') return false
  return input.overallStatus === 'passed_automatic_checks'
}
