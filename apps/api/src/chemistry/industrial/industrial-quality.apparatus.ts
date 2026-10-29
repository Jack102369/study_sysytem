import { INDUSTRIAL_QUALITY_VERSION } from './industrial-quality.constants'
import type { IndustrialQualityCheckResult } from './industrial-quality.types'
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'
import { validateIndustrialApparatusDefinition } from './industrial-apparatus.validate'
import { checkIndustrialApparatusSafety } from './industrial-apparatus-safety'
import { projectIndustrialApparatusPublic } from './industrial-apparatus.project'
import { scanApparatusPublicForLeakRisk } from './industrial-apparatus.project'

/**
 * 装置图质检维度（扩展 STEP_08，不破坏流程图检查）。
 */
export function checkApparatusQualityDimension(input: {
  apparatus: IndustrialApparatusDefinition
  stem?: string
  explanation?: string
}): IndustrialQualityCheckResult[] {
  const now = new Date().toISOString()
  const out: IndustrialQualityCheckResult[] = []
  const v = validateIndustrialApparatusDefinition(input.apparatus)
  out.push({
    checkCode: 'APPARATUS_SCHEMA',
    dimension: 'diagram',
    status: v.valid ? 'pass' : 'fail',
    severity: v.valid ? 'info' : 'error',
    message: v.valid ? '装置 JSON 结构校验通过' : `装置结构失败: ${v.errors[0]?.message}`,
    evidence: v.errors.map((e) => e.code),
    checkerVersion: INDUSTRIAL_QUALITY_VERSION,
    checkedAt: now,
  })

  const safety = checkIndustrialApparatusSafety(input.apparatus)
  for (const f of safety.findings) {
    out.push({
      checkCode: `APPARATUS_${f.ruleId}`,
      dimension: 'chemistry',
      status: f.status === 'pass' ? 'pass' : f.status === 'fail' ? 'fail' : 'unknown',
      severity:
        f.severity === 'critical'
          ? 'critical'
          : f.severity === 'error'
            ? 'error'
            : f.severity === 'warning'
              ? 'warning'
              : 'info',
      message: f.message,
      evidence: f.evidence,
      checkerVersion: INDUSTRIAL_QUALITY_VERSION,
      checkedAt: now,
    })
  }

  const pub = projectIndustrialApparatusPublic(input.apparatus)
  const leaks = scanApparatusPublicForLeakRisk(pub)
  out.push({
    checkCode: 'APPARATUS_PUBLIC_LEAK',
    dimension: 'teaching',
    status: leaks.length ? 'fail' : 'pass',
    severity: leaks.length ? 'critical' : 'info',
    message: leaks.length ? 'Public 泄漏敏感字段' : 'Public 白名单无泄漏',
    evidence: leaks,
    checkerVersion: INDUSTRIAL_QUALITY_VERSION,
    checkedAt: now,
  })

  if (input.stem) {
    const typesInStem =
      /洗气|冷凝|蒸馏|过滤|尾气|发生器|反应/.test(input.stem)
    if (typesInStem && input.apparatus.components.length === 0) {
      out.push({
        checkCode: 'APPARATUS_STEM_CONSISTENCY',
        dimension: 'consistency',
        status: 'fail',
        severity: 'error',
        message: '题干提及装置但装置图无组件',
        evidence: [],
        checkerVersion: INDUSTRIAL_QUALITY_VERSION,
        checkedAt: now,
      })
    } else {
      out.push({
        checkCode: 'APPARATUS_STEM_CONSISTENCY',
        dimension: 'consistency',
        status: 'unknown',
        severity: 'info',
        message: '题干与装置组件名的充分一致性无法完全自动证明',
        evidence: [],
        checkerVersion: INDUSTRIAL_QUALITY_VERSION,
        checkedAt: now,
      })
    }
  }

  if (input.apparatus.intentionallyInvalid) {
    out.push({
      checkCode: 'APPARATUS_MARKED_INVALID',
      dimension: 'teaching',
      status: 'fail',
      severity: 'error',
      message: '标记为故意错误样例，禁止正式发布',
      evidence: ['intentionallyInvalid=true'],
      checkerVersion: INDUSTRIAL_QUALITY_VERSION,
      checkedAt: now,
    })
  }

  return out
}
