import { FORBIDDEN_PROCESS_PATTERNS } from './industrial-quality.constants'
import { mkCheck } from './industrial-quality.rules'
import type {
  IndustrialQualityCandidateBundle,
  IndustrialQualityCheckResult,
} from './industrial-quality.types'

export function checkProcessDimension(
  bundle: IndustrialQualityCandidateBundle,
): IndustrialQualityCheckResult[] {
  const out: IndustrialQualityCheckResult[] = []
  const c = bundle.industrialCase
  const def = bundle.definition
  const text = [
    bundle.candidate.stem,
    bundle.candidate.explanation,
    c.description,
    c.title,
    c.caseType,
  ].join('\n')

  for (const p of FORBIDDEN_PROCESS_PATTERNS) {
    if (p.re.test(text)) {
      out.push(
        mkCheck({
          checkCode: p.code,
          dimension: 'process',
          status: 'fail',
          severity: 'error',
          message: p.message,
          evidence: [String(text.match(p.re)?.[0] || '')],
        }),
      )
    } else {
      out.push(
        mkCheck({
          checkCode: p.code,
          dimension: 'process',
          status: 'pass',
          severity: 'info',
          message: `未命中禁止工艺模式：${p.code}`,
          evidence: ['pattern_clear'],
        }),
      )
    }
  }

  // 教学简化不得宣称为完整真实工业
  if (
    (c.caseType === 'textbook_simplification' ||
      c.caseType === 'teaching_simulation') &&
    /完整真实工业|实际工厂完整工艺|真实生产线完整/.test(text)
  ) {
    out.push(
      mkCheck({
        checkCode: 'PROCESS_OVERCLAIM_REAL_PLANT',
        dimension: 'process',
        status: 'fail',
        severity: 'error',
        message: '教学简化/模拟案例不得宣称为完整真实工业生产',
        evidence: [c.caseType],
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'PROCESS_OVERCLAIM_REAL_PLANT',
        dimension: 'process',
        status: 'pass',
        severity: 'info',
        message: '未发现过度宣称真实完整工业生产',
        evidence: [c.caseType],
      }),
    )
  }

  // 节点 material/step 引用存在性（Definition 层也会查，这里补工艺视角）
  const materialIds = new Set(c.materials.map((m) => m.materialId))
  const stepIds = new Set(c.processSteps.map((s) => s.stepId))
  let badMat = 0
  let badStep = 0
  for (const n of def.nodes) {
    const mid = n.internal?.materialId
    if (mid && !materialIds.has(mid)) badMat += 1
    const sid = n.internal?.stepId
    if (sid && !stepIds.has(sid)) badStep += 1
  }
  out.push(
    mkCheck({
      checkCode: 'PROCESS_MATERIAL_REFS',
      dimension: 'process',
      status: badMat ? 'fail' : 'pass',
      severity: badMat ? 'error' : 'info',
      message: badMat
        ? `存在 ${badMat} 个未知物料引用`
        : '流程图物料引用均在案例中',
      evidence: [`badMat=${badMat}`],
    }),
  )
  out.push(
    mkCheck({
      checkCode: 'PROCESS_STEP_REFS',
      dimension: 'process',
      status: badStep ? 'fail' : 'pass',
      severity: badStep ? 'error' : 'info',
      message: badStep
        ? `存在 ${badStep} 个未知工艺步骤引用`
        : '流程图步骤引用均在案例中',
      evidence: [`badStep=${badStep}`],
    }),
  )

  // 产品节点应有入边
  const products = def.nodes.filter((n) => n.type === 'product')
  const incoming = new Set(def.edges.map((e) => e.to))
  const orphanProducts = products.filter((p) => !incoming.has(p.id))
  out.push(
    mkCheck({
      checkCode: 'PROCESS_PRODUCT_SOURCE',
      dimension: 'process',
      status: orphanProducts.length ? 'fail' : 'pass',
      severity: orphanProducts.length ? 'error' : 'info',
      message: orphanProducts.length
        ? '产品节点缺少入边，产物无合理来源'
        : '产品节点均有入边',
      evidence: orphanProducts.map((p) => p.id),
    }),
  )

  // recycle 边两端存在
  const nodeIds = new Set(def.nodes.map((n) => n.id))
  const badRecycle = def.edges.filter(
    (e) => e.type === 'recycle' && (!nodeIds.has(e.from) || !nodeIds.has(e.to)),
  )
  out.push(
    mkCheck({
      checkCode: 'PROCESS_RECYCLE_ENDS',
      dimension: 'process',
      status: badRecycle.length ? 'fail' : 'pass',
      severity: badRecycle.length ? 'error' : 'info',
      message: badRecycle.length
        ? 'recycle 边端点缺失'
        : 'recycle 边端点完整（或无 recycle）',
      evidence: badRecycle.map((e) => e.id),
    }),
  )

  // 复杂工艺合理性超出规则 → unknown
  out.push(
    mkCheck({
      checkCode: 'PROCESS_DEEP_REASONING',
      dimension: 'process',
      status: 'unknown',
      severity: 'info',
      message: '深层工艺合理性（收率/能耗/工业放大）未自动验证',
      evidence: ['requires_human_or_kb'],
    }),
  )

  return out
}
