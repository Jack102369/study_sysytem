import {
  validateIndustrialDiagramAgainstCase,
  validateIndustrialDiagramDefinition,
  validateIndustrialDiagramPublic,
} from './industrial-diagram.validate'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import { mkCheck } from './industrial-quality.rules'
import type {
  IndustrialQualityCandidateBundle,
  IndustrialQualityCheckResult,
} from './industrial-quality.types'

export function checkDiagramDimension(
  bundle: IndustrialQualityCandidateBundle,
): IndustrialQualityCheckResult[] {
  const out: IndustrialQualityCheckResult[] = []
  const def = bundle.definition
  const pub = bundle.publicDiagram
  const svg = bundle.svg
  const report = bundle.renderReport

  const defVal = validateIndustrialDiagramDefinition(def)
  out.push(
    mkCheck({
      checkCode: 'DIAG_DEFINITION',
      dimension: 'diagram',
      status: defVal.valid ? 'pass' : 'fail',
      severity: defVal.valid ? 'info' : 'error',
      message: defVal.valid
        ? 'Definition 结构校验通过'
        : 'Definition 结构校验失败',
      evidence: defVal.errors.map((e) => `${e.code}:${e.path}:${e.message}`),
    }),
  )

  const against = validateIndustrialDiagramAgainstCase(def, bundle.industrialCase)
  out.push(
    mkCheck({
      checkCode: 'DIAG_CASE_BIND',
      dimension: 'diagram',
      status: against.valid ? 'pass' : 'fail',
      severity: against.valid ? 'info' : 'error',
      message: against.valid
        ? 'Definition 与案例绑定通过'
        : 'Definition 与案例绑定失败',
      evidence: against.errors.map((e) => `${e.code}:${e.message}`),
    }),
  )

  const pubVal = validateIndustrialDiagramPublic(pub)
  out.push(
    mkCheck({
      checkCode: 'DIAG_PUBLIC',
      dimension: 'diagram',
      status: pubVal.valid ? 'pass' : 'fail',
      severity: pubVal.valid ? 'info' : 'critical',
      message: pubVal.valid ? 'Public 校验通过' : 'Public 校验失败',
      evidence: pubVal.errors.map((e) => `${e.code}:${e.message}`),
    }),
  )

  // 投影一致性：重新投影对比关键字段
  const reproj = projectIndustrialDiagramPublic(def)
  const leakKeys = ['answerLabel', 'unknownKey', 'internal', 'reviewMetadata']
  const pubJson = JSON.stringify(pub)
  const leakHits = leakKeys.filter((k) => pubJson.includes(k))
  out.push(
    mkCheck({
      checkCode: 'DIAG_PUBLIC_LEAK',
      dimension: 'diagram',
      status: leakHits.length ? 'fail' : 'pass',
      severity: leakHits.length ? 'critical' : 'info',
      message: leakHits.length
        ? 'Public 疑似含内部字段'
        : 'Public JSON 未检出内部敏感键',
      evidence: leakHits,
    }),
  )
  out.push(
    mkCheck({
      checkCode: 'DIAG_PUBLIC_HASH_MATCH',
      dimension: 'diagram',
      status:
        reproj.publicContentHash === pub.publicContentHash ? 'pass' : 'fail',
      severity:
        reproj.publicContentHash === pub.publicContentHash ? 'info' : 'error',
      message:
        reproj.publicContentHash === pub.publicContentHash
          ? 'Public 哈希与再投影一致'
          : 'Public 哈希与再投影不一致',
      evidence: [pub.publicContentHash, reproj.publicContentHash],
    }),
  )

  // SVG
  const unsafe =
    /<script[\s>]|foreignObject|iframe|\son\w+\s*=|javascript:/i.test(svg)
  out.push(
    mkCheck({
      checkCode: 'DIAG_SVG_SAFE',
      dimension: 'diagram',
      status: unsafe ? 'fail' : 'pass',
      severity: unsafe ? 'critical' : 'info',
      message: unsafe ? 'SVG 含不安全内容' : 'SVG 未检出脚本/事件/foreignObject',
      evidence: unsafe ? ['unsafe_pattern'] : [],
    }),
  )
  out.push(
    mkCheck({
      checkCode: 'DIAG_SVG_INTERNAL_LEAK',
      dimension: 'diagram',
      status:
        /answerLabel|reviewMetadata|unknownKey/.test(svg) ? 'fail' : 'pass',
      severity: /answerLabel|reviewMetadata|unknownKey/.test(svg)
        ? 'critical'
        : 'info',
      message: /answerLabel|reviewMetadata|unknownKey/.test(svg)
        ? 'SVG 含内部字段'
        : 'SVG 未检出内部答案字段',
    }),
  )

  const nodeMismatch =
    report.metrics.drawnNodeCount !== def.nodes.length ||
    report.metrics.drawnEdgeCount !== def.edges.length
  const overlap = report.errors.some((e) => e.includes('OVERLAP'))
  const missing = report.errors.some(
    (e) => e.includes('NOT_DRAWN') || e.includes('COUNT_MISMATCH'),
  )
  out.push(
    mkCheck({
      checkCode: 'DIAG_SVG_RENDER_REPORT',
      dimension: 'diagram',
      status: report.valid && !nodeMismatch ? 'pass' : 'fail',
      severity: missing || overlap ? 'error' : report.valid ? 'info' : 'error',
      message: report.valid
        ? 'SVG 渲染报告 valid'
        : 'SVG 渲染报告 invalid',
      evidence: [
        ...report.errors.slice(0, 8),
        `nodes ${report.metrics.drawnNodeCount}/${def.nodes.length}`,
        `edges ${report.metrics.drawnEdgeCount}/${def.edges.length}`,
      ],
    }),
  )

  // 边方向：报告不直接给 from→to，用 Definition 边存在性 + 渲染数量代理
  out.push(
    mkCheck({
      checkCode: 'DIAG_EDGE_DIRECTION',
      dimension: 'diagram',
      status: missing ? 'fail' : 'pass',
      severity: missing ? 'error' : 'info',
      message: missing
        ? '存在未绘制连线，箭头方向完整性失败'
        : '连线均已绘制（方向遵循 Definition from→to）',
      evidence: [`edgeCount=${def.edges.length}`],
    }),
  )

  // 拥挤警告
  if (report.warnings.some((w) => /OVERLAP|NEAR_OR_OUT|LAYOUT/i.test(w))) {
    out.push(
      mkCheck({
        checkCode: 'DIAG_SVG_CROWDING',
        dimension: 'diagram',
        status: 'unknown',
        severity: 'warning',
        message: '布局存在拥挤或贴边警告，可读性需人工确认',
        evidence: report.warnings.slice(0, 6),
      }),
    )
  }

  return out
}
