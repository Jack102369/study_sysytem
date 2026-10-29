import type {
  IndustrialDiagramPublic,
  IndustrialDiagramPublicNode,
} from './industrial-diagram.types'
import type { SvgLayoutEdge, SvgLayoutNode, SvgLayoutResult } from './industrial-svg-types'

const PAD = 32
const MIN_W = 88
const MAX_W = 168
const MIN_H = 36
const LINE_H = 16
const PAD_X = 12
const PAD_Y = 10
const CHAR_W = 9
const LAYER_GAP = 88
const NODE_GAP = 28
const RECYCLE_OFFSET_BASE = 36

function wrapLabel(label: string, maxChars: number): string[] {
  const t = label.trim()
  if (!t) return ['']
  if (t.length <= maxChars) return [t]
  const lines: string[] = []
  let rest = t
  while (rest.length > maxChars && lines.length < 4) {
    let cut = maxChars
    const space = rest.lastIndexOf(' ', maxChars)
    if (space > maxChars * 0.4) cut = space
    lines.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest && lines.length < 4) lines.push(rest.slice(0, maxChars))
  else if (rest) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, maxChars - 1)}…`
  return lines.length ? lines : ['']
}

function measureNode(n: IndustrialDiagramPublicNode): { width: number; height: number; lines: string[] } {
  const maxChars = Math.floor((MAX_W - PAD_X * 2) / CHAR_W)
  const lines = wrapLabel(n.displayLabel, Math.max(6, maxChars))
  const longest = Math.max(...lines.map((l) => l.length), 1)
  const width = Math.min(MAX_W, Math.max(MIN_W, longest * CHAR_W + PAD_X * 2))
  const height = Math.max(MIN_H, lines.length * LINE_H + PAD_Y * 2)
  return { width, height, lines }
}

/**
 * 确定性分层布局：recycle 边不参与拓扑层；其余边用于分层。
 */
export function layoutIndustrialDiagram(
  diagram: IndustrialDiagramPublic,
): SvgLayoutResult {
  const warnings: string[] = []
  const ltr = diagram.orientation === 'left_to_right'
  const nodes = diagram.nodes
  const edges = diagram.edges

  const measured = new Map(
    nodes.map((n) => [n.id, measureNode(n)] as const),
  )

  const nonRecycle = edges.filter((e) => e.type !== 'recycle')
  const recycle = edges.filter((e) => e.type === 'recycle')

  const out = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  for (const n of nodes) {
    out.set(n.id, [])
    indeg.set(n.id, 0)
  }
  for (const e of nonRecycle) {
    if (!out.has(e.from) || !out.has(e.to)) continue
    out.get(e.from)!.push(e.to)
    indeg.set(e.to, (indeg.get(e.to) || 0) + 1)
  }

  // 稳定：节点按 id 排序入队
  const queue = nodes
    .map((n) => n.id)
    .filter((id) => (indeg.get(id) || 0) === 0)
    .sort()
  const layerOf = new Map<string, number>()
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    const layer = layerOf.get(id) ?? 0
    layerOf.set(id, layer)
    const nexts = (out.get(id) || []).slice().sort()
    for (const to of nexts) {
      const cand = layer + 1
      layerOf.set(to, Math.max(layerOf.get(to) ?? 0, cand))
      indeg.set(to, (indeg.get(to) || 0) - 1)
      if ((indeg.get(to) || 0) === 0) {
        queue.push(to)
        queue.sort()
      }
    }
  }

  if (order.length < nodes.length) {
    warnings.push('LAYOUT_CYCLE: non-recycle edges contain a cycle; remaining nodes appended')
    for (const n of nodes) {
      if (!layerOf.has(n.id)) {
        layerOf.set(n.id, Math.max(0, ...Array.from(layerOf.values()), 0) + 1)
        order.push(n.id)
      }
    }
  }

  const layers = new Map<number, string[]>()
  for (const id of order) {
    const L = layerOf.get(id) ?? 0
    if (!layers.has(L)) layers.set(L, [])
    layers.get(L)!.push(id)
  }
  for (const [, ids] of layers) ids.sort()

  const maxLayer = Math.max(0, ...Array.from(layers.keys()))
  const layoutNodes: SvgLayoutNode[] = []
  const pos = new Map<string, SvgLayoutNode>()

  for (let L = 0; L <= maxLayer; L++) {
    const ids = layers.get(L) || []
    const sizes = ids.map((id) => measured.get(id)!)
    const crossSpan = ids.reduce((s, id, i) => {
      const sz = sizes[i]
      return s + (ltr ? sz.height : sz.width) + (i ? NODE_GAP : 0)
    }, 0)

    let cross = PAD
    ids.forEach((id, i) => {
      const m = measured.get(id)!
      const main = PAD + L * (LAYER_GAP + (ltr ? MAX_W : MIN_H + 20))
      let x: number
      let y: number
      if (ltr) {
        x = main
        y = cross
        cross += m.height + NODE_GAP
      } else {
        x = cross
        y = main
        cross += m.width + NODE_GAP
      }
      // 居中对齐本层
      if (ltr) {
        const totalH = ids.reduce((s, nid) => s + measured.get(nid)!.height, 0) + NODE_GAP * Math.max(0, ids.length - 1)
        void totalH
        void crossSpan
      }
      const node: SvgLayoutNode = {
        id,
        x,
        y,
        width: m.width,
        height: m.height,
        cx: x + m.width / 2,
        cy: y + m.height / 2,
        layer: L,
        indexInLayer: i,
        lines: m.lines,
      }
      layoutNodes.push(node)
      pos.set(id, node)
    })
  }

  // 垂直居中各层（LTR）或水平居中（TTB）
  const layerGroups = new Map<number, SvgLayoutNode[]>()
  for (const n of layoutNodes) {
    if (!layerGroups.has(n.layer)) layerGroups.set(n.layer, [])
    layerGroups.get(n.layer)!.push(n)
  }
  let maxCross = 0
  for (const [, group] of layerGroups) {
    if (ltr) {
      const h = group.reduce((s, n) => Math.max(s, n.y + n.height), 0)
      maxCross = Math.max(maxCross, h)
    } else {
      const w = group.reduce((s, n) => Math.max(s, n.x + n.width), 0)
      maxCross = Math.max(maxCross, w)
    }
  }
  for (const [, group] of layerGroups) {
    if (ltr) {
      const minY = Math.min(...group.map((n) => n.y))
      const maxY = Math.max(...group.map((n) => n.y + n.height))
      const span = maxY - minY
      const shift = (maxCross - span) / 2 - minY + PAD
      for (const n of group) {
        n.y += shift
        n.cy = n.y + n.height / 2
      }
    } else {
      const minX = Math.min(...group.map((n) => n.x))
      const maxX = Math.max(...group.map((n) => n.x + n.width))
      const span = maxX - minX
      const shift = (maxCross - span) / 2 - minX + PAD
      for (const n of group) {
        n.x += shift
        n.cx = n.x + n.width / 2
      }
    }
  }

  // 轻微重叠检测
  for (let i = 0; i < layoutNodes.length; i++) {
    for (let j = i + 1; j < layoutNodes.length; j++) {
      const a = layoutNodes[i]
      const b = layoutNodes[j]
      if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      ) {
        warnings.push(`NODE_OVERLAP: ${a.id} overlaps ${b.id}`)
        // 确定性推开
        if (ltr) b.y = a.y + a.height + NODE_GAP
        else b.x = a.x + a.width + NODE_GAP
        b.cy = b.y + b.height / 2
        b.cx = b.x + b.width / 2
      }
    }
  }

  function port(
    from: SvgLayoutNode,
    to: SvgLayoutNode,
    kind: 'out' | 'in',
    edgeType: string,
  ): { x: number; y: number } {
    if (edgeType === 'reagent_input') {
      if (kind === 'out') return { x: from.cx, y: from.y + from.height }
      return { x: to.x, y: to.cy }
    }
    if (ltr) {
      if (kind === 'out') return { x: from.x + from.width, y: from.cy }
      return { x: to.x, y: to.cy }
    }
    if (kind === 'out') return { x: from.cx, y: from.y + from.height }
    return { x: to.cx, y: to.y }
  }

  const layoutEdges: SvgLayoutEdge[] = []
  let recycleIndex = 0

  for (const e of nonRecycle) {
    const a = pos.get(e.from)
    const b = pos.get(e.to)
    if (!a || !b) {
      warnings.push(`MISSING_NODE_FOR_EDGE: ${e.id}`)
      continue
    }
    const p0 = port(a, b, 'out', e.type)
    const p1 = port(a, b, 'in', e.type)
    let points: { x: number; y: number }[]
    if (e.type === 'reagent_input') {
      const midY = Math.max(a.y + a.height + 16, b.cy)
      points = [
        { x: a.cx, y: a.y + a.height },
        { x: a.cx, y: midY },
        { x: b.x - 8, y: midY },
        { x: b.x - 8, y: b.cy },
        { x: b.x, y: b.cy },
      ]
    } else if (e.type === 'condition') {
      const midX = (p0.x + p1.x) / 2
      points = [p0, { x: midX, y: p0.y }, { x: midX, y: p1.y }, p1]
    } else if (e.type === 'byproduct') {
      const bump = 24 + (a.indexInLayer % 3) * 8
      if (ltr) {
        points = [
          p0,
          { x: p0.x + 20, y: p0.y },
          { x: p0.x + 20, y: Math.max(p0.y, p1.y) + bump },
          { x: p1.x - 20, y: Math.max(p0.y, p1.y) + bump },
          { x: p1.x - 20, y: p1.y },
          p1,
        ]
      } else {
        points = [
          p0,
          { x: p0.x, y: p0.y + 16 },
          { x: Math.max(p0.x, p1.x) + bump, y: p0.y + 16 },
          { x: Math.max(p0.x, p1.x) + bump, y: p1.y - 16 },
          { x: p1.x, y: p1.y - 16 },
          p1,
        ]
      }
    } else {
      // material_flow 正交折线
      if (ltr) {
        const midX = (p0.x + p1.x) / 2
        points = [p0, { x: midX, y: p0.y }, { x: midX, y: p1.y }, p1]
      } else {
        const midY = (p0.y + p1.y) / 2
        points = [p0, { x: p0.x, y: midY }, { x: p1.x, y: midY }, p1]
      }
    }
    const mid = points[Math.floor(points.length / 2)]
    layoutEdges.push({
      id: e.id,
      type: e.type,
      points,
      label: e.displayLabel,
      labelX: mid.x,
      labelY: mid.y - 6,
    })
  }

  for (const e of recycle) {
    const a = pos.get(e.from)
    const b = pos.get(e.to)
    if (!a || !b) {
      warnings.push(`MISSING_NODE_FOR_EDGE: ${e.id}`)
      continue
    }
    const offset = RECYCLE_OFFSET_BASE + recycleIndex * 18
    recycleIndex += 1
    let points: { x: number; y: number }[]
    if (ltr) {
      const top = Math.min(a.y, b.y) - offset
      points = [
        { x: a.cx, y: a.y },
        { x: a.cx, y: top },
        { x: b.cx, y: top },
        { x: b.cx, y: b.y },
      ]
    } else {
      const left = Math.min(a.x, b.x) - offset
      points = [
        { x: a.x, y: a.cy },
        { x: left, y: a.cy },
        { x: left, y: b.cy },
        { x: b.x, y: b.cy },
      ]
    }
    const mid = points[1]
    layoutEdges.push({
      id: e.id,
      type: e.type,
      points,
      label: e.displayLabel,
      labelX: (points[1].x + points[2].x) / 2,
      labelY: (points[1].y + points[2].y) / 2 - 6,
    })
    void mid
  }

  let maxX = PAD
  let maxY = PAD
  for (const n of layoutNodes) {
    maxX = Math.max(maxX, n.x + n.width)
    maxY = Math.max(maxY, n.y + n.height)
  }
  for (const e of layoutEdges) {
    for (const p of e.points) {
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
  }

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: Math.ceil(maxX + PAD),
    height: Math.ceil(maxY + PAD),
    warnings,
  }
}
