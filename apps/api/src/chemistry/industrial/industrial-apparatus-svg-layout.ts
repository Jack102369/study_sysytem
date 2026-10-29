import type { IndustrialApparatusPublic } from './industrial-apparatus.types'

export type ApparatusLayoutComponent = {
  componentId: string
  componentType: string
  displayLabel: string
  x: number
  y: number
  width: number
  height: number
  cx: number
  cy: number
  lines: string[]
  portPoints: Record<string, { x: number; y: number }>
}

export type ApparatusLayoutConnection = {
  connectionId: string
  flowType: string
  points: { x: number; y: number }[]
  label?: string
  labelX?: number
  labelY?: number
}

export type ApparatusLayoutResult = {
  components: ApparatusLayoutComponent[]
  connections: ApparatusLayoutConnection[]
  width: number
  height: number
  warnings: string[]
}

function wrapLabel(label: string, max = 10): string[] {
  const s = String(label || '').trim() || '?'
  if (s.length <= max) return [s]
  const lines: string[] = []
  for (let i = 0; i < s.length; i += max) {
    lines.push(s.slice(i, i + max))
    if (lines.length >= 3) break
  }
  return lines
}

function portPoint(
  c: ApparatusLayoutComponent,
  portId: string,
  orientation: string,
): { x: number; y: number } {
  const L = orientation === 'top_to_bottom'
  const map: Record<string, { x: number; y: number }> = {
    gas_out: { x: c.x + c.width, y: c.cy },
    gas_in: { x: c.x, y: c.cy },
    vapor_out: { x: c.x + c.width / 2, y: c.y },
    vapor_in: { x: c.x + c.width / 2, y: c.y },
    liquid_out: { x: c.x + c.width / 2, y: c.y + c.height },
    liquid_in: { x: c.x, y: c.cy },
    coolant_in: { x: c.x + c.width * 0.8, y: c.y + c.height },
    coolant_out: { x: c.x + c.width * 0.2, y: c.y },
    feed_in: { x: c.x, y: c.cy },
    product_out: { x: c.x + c.width, y: c.cy },
    residue_out: { x: c.x + c.width / 2, y: c.y + c.height },
    reagent_in: { x: c.x + c.width / 2, y: c.y },
    slurry_in: { x: c.x, y: c.cy },
    filtrate_out: { x: c.x + c.width, y: c.cy },
    cake_out: { x: c.x + c.width / 2, y: c.y + c.height },
    vent: { x: c.x + c.width * 0.7, y: c.y },
    vent_out: { x: c.x + c.width, y: c.cy },
    vessel_in: { x: c.x, y: c.cy },
    heat_out: { x: c.cx, y: c.y },
    heat_in: { x: c.cx, y: c.y + c.height },
    process_in: { x: c.x, y: c.cy },
    process_out: { x: c.x + c.width, y: c.cy },
    solid_out: { x: c.x + c.width / 2, y: c.y + c.height },
    sense: { x: c.cx, y: c.y + c.height },
    a: { x: c.x, y: c.cy },
    b: { x: c.x + c.width, y: c.cy },
  }
  if (map[portId]) return map[portId]
  // fallback by orientation
  if (L) return { x: c.cx, y: c.y + c.height }
  return { x: c.x + c.width, y: c.cy }
}

/**
 * 确定性层序布局：按连接拓扑近似分层，保证可重复。
 */
export function layoutIndustrialApparatus(
  pub: IndustrialApparatusPublic,
): ApparatusLayoutResult {
  const warnings: string[] = []
  const LtoR = pub.orientation !== 'top_to_bottom'
  const order = pub.components.map((c) => c.componentId)
  // 简单：按首次出现的源→目标推拓扑序
  const indeg = new Map(order.map((id) => [id, 0]))
  for (const e of pub.connections) {
    indeg.set(e.targetComponentId, (indeg.get(e.targetComponentId) || 0) + 1)
  }
  const sorted = [...order].sort(
    (a, b) => (indeg.get(a) || 0) - (indeg.get(b) || 0) || a.localeCompare(b),
  )

  const gapX = 150
  const gapY = 130
  const boxW = 112
  const boxH = 72
  const margin = 48

  const components: ApparatusLayoutComponent[] = sorted.map((id, i) => {
    const c = pub.components.find((x) => x.componentId === id)!
    const col = LtoR ? i : 0
    const row = LtoR ? 0 : i
    // 多行：每 5 个换行
    const col2 = LtoR ? i % 5 : Math.floor(i / 5)
    const row2 = LtoR ? Math.floor(i / 5) : i % 5
    const x = margin + col2 * gapX
    const y = margin + 24 + row2 * gapY
    const lines = wrapLabel(c.displayLabel)
    const layout: ApparatusLayoutComponent = {
      componentId: c.componentId,
      componentType: c.componentType,
      displayLabel: c.displayLabel,
      x,
      y,
      width: boxW,
      height: boxH,
      cx: x + boxW / 2,
      cy: y + boxH / 2,
      lines,
      portPoints: {},
    }
    for (const p of c.ports) {
      layout.portPoints[p.portId] = portPoint(layout, p.portId, pub.orientation)
    }
    void col
    void row
    return layout
  })

  const byId = new Map(components.map((c) => [c.componentId, c]))
  const connections: ApparatusLayoutConnection[] = []
  for (const e of pub.connections) {
    const s = byId.get(e.sourceComponentId)
    const t = byId.get(e.targetComponentId)
    if (!s || !t) {
      warnings.push(`missing endpoint for ${e.connectionId}`)
      continue
    }
    const p0 =
      s.portPoints[e.sourcePortId] || { x: s.x + s.width, y: s.cy }
    const p1 =
      t.portPoints[e.targetPortId] || { x: t.x, y: t.cy }
    const midX = (p0.x + p1.x) / 2
    const midY = (p0.y + p1.y) / 2
    const points =
      Math.abs(p0.y - p1.y) < 8
        ? [p0, p1]
        : [p0, { x: midX, y: p0.y }, { x: midX, y: p1.y }, p1]
    // 粗略重叠警告
    if (Math.abs(p0.x - p1.x) < 4 && Math.abs(p0.y - p1.y) < 4) {
      warnings.push(`degenerate edge ${e.connectionId}`)
    }
    connections.push({
      connectionId: e.connectionId,
      flowType: e.flowType,
      points,
      label: e.displayLabel,
      labelX: midX,
      labelY: midY - 6,
    })
  }

  const maxX = Math.max(...components.map((c) => c.x + c.width), 320) + margin
  const maxY = Math.max(...components.map((c) => c.y + c.height), 200) + margin
  if (components.length > 12) {
    warnings.push('复杂装置图：画布放大以保证可读性')
  }

  return {
    components,
    connections,
    width: Math.ceil(maxX),
    height: Math.ceil(maxY),
    warnings,
  }
}
