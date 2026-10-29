import { mkCheck } from './industrial-quality.rules'
import type {
  IndustrialQualityCandidateBundle,
  IndustrialQualityCheckResult,
} from './industrial-quality.types'

/** 明显非法化学式模式（有限规则，非完整化学引擎） */
const BAD_FORMULA_RE =
  /\bH3O4\b|\bNaCl2\b|\bH2O3\b|\bFe3\b(?![A-Za-z])|\bClNa\b/

/** 常见合法片段（仅用于肯定样例，不证明全体正确） */
const COMMON_OK =
  /\b(H2O|H2SO4|NaCl|FeCl3|Fe|Cu|Cu2\+|HCl|NaOH|CaCO3|CO2|O2|N2)\b/

/**
 * 化学正确性：仅覆盖可确定性识别的错误；其余 unknown。
 * 不得把格式合法当成科学正确。
 */
export function checkChemistryDimension(
  bundle: IndustrialQualityCandidateBundle,
): IndustrialQualityCheckResult[] {
  const out: IndustrialQualityCheckResult[] = []
  const c = bundle.industrialCase
  const text = [
    bundle.candidate.stem,
    bundle.candidate.explanation,
    JSON.stringify(bundle.candidate.answer),
    ...c.materials.map((m) => `${m.name}|${m.formula || ''}`),
    ...c.reactions.map((r) => r.equation || ''),
  ].join('\n')

  if (BAD_FORMULA_RE.test(text)) {
    out.push(
      mkCheck({
        checkCode: 'CHEM_BAD_FORMULA',
        dimension: 'chemistry',
        status: 'fail',
        severity: 'error',
        message: '检测到规则覆盖范围内的明显非法化学式片段',
        evidence: [String(text.match(BAD_FORMULA_RE)?.[0] || '')],
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'CHEM_BAD_FORMULA',
        dimension: 'chemistry',
        status: 'pass',
        severity: 'info',
        message: '未命中有限非法化学式规则（不证明全部化学式正确）',
        evidence: ['rule=BAD_FORMULA_RE'],
      }),
    )
  }

  // 反应 pendingVerification
  const pending = c.reactions.filter((r) => r.pendingVerification)
  if (pending.length) {
    out.push(
      mkCheck({
        checkCode: 'CHEM_REACTION_PENDING',
        dimension: 'chemistry',
        status: 'unknown',
        severity: 'warning',
        message: '存在 pendingVerification 反应，无法认定化学已验证',
        evidence: pending.map((r) => r.reactionReference),
      }),
    )
  } else if (c.reactions.length === 0) {
    out.push(
      mkCheck({
        checkCode: 'CHEM_REACTION_PENDING',
        dimension: 'chemistry',
        status: 'unknown',
        severity: 'info',
        message: '案例无反应条目；非反应类流程记 unknown（需人工确认）',
        evidence: ['reactions=[]'],
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'CHEM_REACTION_PENDING',
        dimension: 'chemistry',
        status: 'unknown',
        severity: 'warning',
        message: '反应未 pending，但无已审核 KB 绑定证明，仍记 unknown',
        evidence: c.reactions.map((r) => r.reactionReference),
      }),
    )
  }

  // 来源 unverified（E2-B2：有效审核可授予来源可信度，不改写 fixture verificationStatus）
  const verified = c.sourceReferences.filter((s) => s.verificationStatus === 'verified')
  const effectiveSourceOk =
    bundle.effectiveCaseReview?.effectiveSourceVerification === 'verified' &&
    bundle.effectiveCaseReview?.grantsEffectivePublishEligibility === true
  if (verified.length === 0 && !effectiveSourceOk) {
    out.push(
      mkCheck({
        checkCode: 'CHEM_SOURCE_VERIFIED',
        dimension: 'chemistry',
        status: bundle.developmentOnly ? 'unknown' : 'fail',
        severity: bundle.developmentOnly ? 'warning' : 'critical',
        message: bundle.developmentOnly
          ? '开发模式：知识来源 unverified，化学正确性未证明'
          : '正式模式：缺少 verified 知识来源（且无有效案例审核覆盖）',
        evidence: c.sourceReferences.map(
          (s) => `${s.sourceTitle}:${s.verificationStatus}`,
        ),
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'CHEM_SOURCE_VERIFIED',
        dimension: 'chemistry',
        status: 'pass',
        severity: 'info',
        message: effectiveSourceOk
          ? '有效案例审核已核验来源（fixture 可仍 unverified；仍需人工化学复核）'
          : '存在 verified 来源（仍需人工化学复核）',
        evidence: effectiveSourceOk
          ? [
              `effectiveSourceVerification=verified`,
              ...c.sourceReferences.map((s) => `${s.sourceTitle}:${s.verificationStatus}`),
            ]
          : verified.map((s) => s.sourceTitle),
      }),
    )
  }

  // 方程式：仅检查是否含等号且两侧非空；不宣称配平正确
  for (const r of c.reactions) {
    const eq = (r.equation || '').trim()
    if (!eq) {
      out.push(
        mkCheck({
          checkCode: 'CHEM_EQUATION_FORMAT',
          dimension: 'chemistry',
          status: 'unknown',
          severity: 'warning',
          message: `反应 ${r.reactionReference} 无方程文本`,
          evidence: [r.reactionReference],
        }),
      )
      continue
    }
    if (!eq.includes('=') && !eq.includes('→') && !eq.includes('->')) {
      out.push(
        mkCheck({
          checkCode: 'CHEM_EQUATION_FORMAT',
          dimension: 'chemistry',
          status: 'fail',
          severity: 'error',
          message: `反应 ${r.reactionReference} 方程格式缺少等号/箭头`,
          evidence: [eq],
        }),
      )
    } else {
      out.push(
        mkCheck({
          checkCode: 'CHEM_EQUATION_FORMAT',
          dimension: 'chemistry',
          status: 'unknown',
          severity: 'info',
          message: '方程格式可解析为两侧文本；配平/科学性未自动证明',
          evidence: [eq.slice(0, 80)],
        }),
      )
    }
  }

  if (COMMON_OK.test(text)) {
    out.push(
      mkCheck({
        checkCode: 'CHEM_COMMON_FRAGMENT',
        dimension: 'chemistry',
        status: 'pass',
        severity: 'info',
        message: '出现常见化学式片段（仅说明未触发非法模式）',
        evidence: ['rule=COMMON_OK'],
      }),
    )
  }

  // 总声明
  out.push(
    mkCheck({
      checkCode: 'CHEM_ENGINE_SCOPE',
      dimension: 'chemistry',
      status: 'unknown',
      severity: 'info',
      message:
        '本系统非完整化学推理引擎；未覆盖知识一律 unknown，不得自动 pass',
      evidence: ['coverage=limited_rules'],
    }),
  )

  return out
}
