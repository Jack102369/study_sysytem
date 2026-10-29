/**
 * 工业装置科学与安全确定性规则（STEP_13）。
 * unknown ≠ pass；规则有适用范围与局限，不声称覆盖全部工业化学。
 */
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'

export type ApparatusSafetyFinding = {
  ruleId: string
  status: 'pass' | 'fail' | 'unknown'
  severity: 'critical' | 'error' | 'warning' | 'info'
  message: string
  scope: string
  limitation: string
  evidence: string[]
}

export type ApparatusSafetyReport = {
  findings: ApparatusSafetyFinding[]
  blocking: string[]
  unknowns: string[]
  warnings: string[]
}

function hasType(def: IndustrialApparatusDefinition, t: string) {
  return def.components.some((c) => c.componentType === t)
}

function connectionsOf(
  def: IndustrialApparatusDefinition,
  componentId: string,
  portId: string,
) {
  return def.connections.filter(
    (x) =>
      (x.sourceComponentId === componentId && x.sourcePortId === portId) ||
      (x.targetComponentId === componentId && x.targetPortId === portId),
  )
}

export function checkIndustrialApparatusSafety(
  def: IndustrialApparatusDefinition,
): ApparatusSafetyReport {
  const findings: ApparatusSafetyFinding[] = []
  const lim =
    '教学示意规则；不能证明复杂工业工艺在真实工况下完全安全。'

  // 1) 洗气瓶：gas_in 必须有入，gas_out 有出
  for (const c of def.components.filter(
    (x) => x.componentType === 'gas_washing_bottle',
  )) {
    const gin = connectionsOf(def, c.componentId, 'gas_in')
    const gout = connectionsOf(def, c.componentId, 'gas_out')
    const ok = gin.length > 0 && gout.length > 0
    findings.push({
      ruleId: 'WASH_BOTTLE_IO',
      status: ok ? 'pass' : 'fail',
      severity: 'error',
      message: ok
        ? `洗气瓶 ${c.componentId} 进出齐全`
        : `洗气瓶 ${c.componentId} 进出气管连接异常`,
      scope: 'gas_washing_bottle 教学检查',
      limitation: lim,
      evidence: [`in=${gin.length}`, `out=${gout.length}`],
    })
  }

  // 2) 冷凝器冷却水：要求 coolant_in 与 coolant_out 均连接；逆流是否充分 → unknown
  for (const c of def.components.filter((x) => x.componentType === 'condenser')) {
    const cin = connectionsOf(def, c.componentId, 'coolant_in')
    const cout = connectionsOf(def, c.componentId, 'coolant_out')
    const vin = connectionsOf(def, c.componentId, 'vapor_in')
    const lout = connectionsOf(def, c.componentId, 'liquid_out')
    const basic = cin.length > 0 && cout.length > 0 && vin.length > 0 && lout.length > 0
    findings.push({
      ruleId: 'CONDENSER_PORTS',
      status: basic ? 'pass' : 'fail',
      severity: 'error',
      message: basic
        ? `冷凝器 ${c.componentId} 基本端口已连接`
        : `冷凝器 ${c.componentId} 连接不完整`,
      scope: 'condenser',
      limitation: lim,
      evidence: [],
    })
    findings.push({
      ruleId: 'CONDENSER_COUNTERFLOW',
      status: 'unknown',
      severity: 'info',
      message: `冷凝器 ${c.componentId} 是否满足严格逆流换热无法仅凭示意拓扑证明`,
      scope: 'condenser coolant direction',
      limitation: '需要相对空间几何；本规则不自动 pass',
      evidence: [],
    })
  }

  // 3) 有害尾气示意：标签含 Cl2/SO2/HCl/NO2 等且无尾气吸收 → fail；否则若有 gas_generator 无吸收 → unknown
  const harmfulHint = /Cl2|SO2|HCl|NO2|氨|氯|二氧化硫/i
  const labels = [
    def.title,
    ...def.components.map((c) => c.displayLabel),
    ...def.connections.map((c) => c.displayLabel || ''),
  ].join(' ')
  const hasHarmful = harmfulHint.test(labels)
  const hasAbsorber = hasType(def, 'tail_gas_absorber')
  if (hasHarmful && !hasAbsorber && !def.intentionallyInvalid) {
    findings.push({
      ruleId: 'HARMFUL_TAIL_GAS',
      status: 'fail',
      severity: 'critical',
      message: '题图提示有害尾气但缺少尾气吸收装置',
      scope: '有害尾气示意',
      limitation: lim,
      evidence: [labels.slice(0, 80)],
    })
  } else if (hasType(def, 'gas_generator') && !hasAbsorber) {
    findings.push({
      ruleId: 'TAIL_GAS_NEED',
      status: 'unknown',
      severity: 'info',
      message: '存在气体发生装置但无尾气吸收；是否需要取决于气体性质（无法仅凭拓扑判定）',
      scope: '可选尾气处理',
      limitation: lim,
      evidence: [],
    })
  }

  // 4) 倒吸风险：气体收集/吸收直接连发生器且中间无缓冲示意 → warning/unknown
  for (const c of def.components.filter(
    (x) =>
      x.componentType === 'gas_collector' ||
      x.componentType === 'tail_gas_absorber',
  )) {
    const direct = def.connections.some(
      (x) =>
        x.targetComponentId === c.componentId &&
        def.components.find((g) => g.componentId === x.sourceComponentId)
          ?.componentType === 'gas_generator',
    )
    if (direct) {
      findings.push({
        ruleId: 'SIPHON_RISK',
        status: def.intentionallyInvalid ? 'fail' : 'unknown',
        severity: 'warning',
        message: `${c.componentId} 与气体发生器直连，存在倒吸风险示意`,
        scope: '倒吸',
        limitation: '示意拓扑启发式，非流体力学证明',
        evidence: [],
      })
    }
  }

  // 5) 密闭加热：heater + reaction_vessel 且无 pressure_relief / vent 连接 → fail 或 unknown
  if (hasType(def, 'heater') && hasType(def, 'reaction_vessel')) {
    const vessels = def.components.filter((c) => c.componentType === 'reaction_vessel')
    for (const v of vessels) {
      const vented =
        connectionsOf(def, v.componentId, 'vent').length > 0 ||
        hasType(def, 'pressure_relief')
      findings.push({
        ruleId: 'CLOSED_HEATING',
        status: vented ? 'pass' : def.intentionallyInvalid ? 'fail' : 'unknown',
        severity: vented ? 'info' : 'error',
        message: vented
          ? `反应容器 ${v.componentId} 有泄压/排气示意`
          : `加热反应容器 ${v.componentId} 未见泄压路径（密闭加热风险）`,
        scope: '密闭加热',
        limitation: lim,
        evidence: [],
      })
    }
  }

  // 6) 明火/加热与易燃气体标签
  if (hasType(def, 'heater') && /H2|氢气|甲烷|CO\b|一氧化碳/i.test(labels)) {
    findings.push({
      ruleId: 'FLAMMABLE_NEAR_HEAT',
      status: 'unknown',
      severity: 'warning',
      message: '存在加热与易燃气体示意，间距/防爆措施无法从图判定',
      scope: '易燃气体',
      limitation: lim,
      evidence: [],
    })
  }

  const blocking = findings
    .filter((f) => f.status === 'fail' && (f.severity === 'critical' || f.severity === 'error'))
    .map((f) => `${f.ruleId}: ${f.message}`)
  const unknowns = findings
    .filter((f) => f.status === 'unknown')
    .map((f) => `${f.ruleId}: ${f.message}`)
  const warnings = findings
    .filter((f) => f.severity === 'warning')
    .map((f) => `${f.ruleId}: ${f.message}`)

  return { findings, blocking, unknowns, warnings }
}
