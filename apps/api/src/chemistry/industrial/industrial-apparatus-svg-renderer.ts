import { escapeSvgText, sanitizeSvgCoord } from './industrial-svg-escape'
import { validateIndustrialApparatusPublic } from './industrial-apparatus.validate'
import { layoutIndustrialApparatus } from './industrial-apparatus-svg-layout'
import type { IndustrialApparatusPublic } from './industrial-apparatus.types'
import type { IndustrialSvgRenderResult } from './industrial-svg-types'

export const INDUSTRIAL_APPARATUS_SVG_RENDERER_VERSION = '1.0.0' as const

const FLOW_COLOR: Record<string, string> = {
  gas: '#0369a1',
  liquid: '#0f766e',
  solid: '#78716c',
  coolant: '#2563eb',
  heat: '#c2410c',
  waste_gas: '#7c3aed',
}

function glyph(
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  const X = sanitizeSvgCoord
  const parts: string[] = []
  // 外框
  parts.push(
    `<rect x="${X(x)}" y="${X(y)}" width="${X(w)}" height="${X(h)}" rx="4" fill="#f8fafc" stroke="#1e293b" stroke-width="1.6"/>`,
  )
  if (type === 'gas_washing_bottle') {
    // 瓶身 + 长短导管示意
    parts.push(
      `<ellipse cx="${X(x + w / 2)}" cy="${X(y + h * 0.72)}" rx="${X(w * 0.28)}" ry="${X(h * 0.18)}" fill="#e0f2fe" stroke="#0369a1"/>`,
    )
    parts.push(
      `<line x1="${X(x + w * 0.35)}" y1="${X(y + 8)}" x2="${X(x + w * 0.35)}" y2="${X(y + h * 0.75)}" stroke="#0369a1" stroke-width="2"/>`,
    )
    parts.push(
      `<line x1="${X(x + w * 0.65)}" y1="${X(y + 8)}" x2="${X(x + w * 0.65)}" y2="${X(y + h * 0.45)}" stroke="#0369a1" stroke-width="2"/>`,
    )
  } else if (type === 'condenser') {
    parts.push(
      `<rect x="${X(x + 18)}" y="${X(y + 10)}" width="${X(w - 36)}" height="${X(h - 20)}" rx="8" fill="#eff6ff" stroke="#2563eb"/>`,
    )
    parts.push(
      `<line x1="${X(x + w / 2)}" y1="${X(y)}" x2="${X(x + w / 2)}" y2="${X(y + h)}" stroke="#0369a1" stroke-width="1.5" stroke-dasharray="3 2"/>`,
    )
  } else if (type === 'distillation_unit' || type === 'reaction_vessel') {
    parts.push(
      `<path d="M ${X(x + 20)} ${X(y + 12)} L ${X(x + w - 20)} ${X(y + 12)} L ${X(x + w - 14)} ${X(y + h - 10)} L ${X(x + 14)} ${X(y + h - 10)} Z" fill="#fff7ed" stroke="#9a3412"/>`,
    )
  } else if (type === 'heater') {
    parts.push(
      `<path d="M ${X(x + 16)} ${X(y + h - 14)} Q ${X(x + w / 2)} ${X(y + 10)} ${X(x + w - 16)} ${X(y + h - 14)}" fill="none" stroke="#c2410c" stroke-width="2"/>`,
    )
  } else if (type === 'gas_generator') {
    parts.push(
      `<ellipse cx="${X(x + w / 2)}" cy="${X(y + h * 0.55)}" rx="${X(w * 0.3)}" ry="${X(h * 0.28)}" fill="#ecfdf5" stroke="#166534"/>`,
    )
  } else if (type === 'filter' || type === 'solid_liquid_separator') {
    parts.push(
      `<polygon points="${X(x + 16)},${X(y + 14)} ${X(x + w - 16)},${X(y + 14)} ${X(x + w / 2)},${X(y + h - 12)}" fill="#f0fdf4" stroke="#166534"/>`,
    )
  } else if (type === 'tail_gas_absorber' || type === 'gas_collector') {
    parts.push(
      `<rect x="${X(x + 28)}" y="${X(y + 12)}" width="${X(w - 56)}" height="${X(h - 24)}" rx="2" fill="#faf5ff" stroke="#7c3aed"/>`,
    )
  } else if (type === 'valve') {
    parts.push(
      `<polygon points="${X(x + w / 2)},${X(y + 10)} ${X(x + w - 14)},${X(y + h / 2)} ${X(x + w / 2)},${X(y + h - 10)} ${X(x + 14)},${X(y + h / 2)}" fill="#fff" stroke="#334155"/>`,
    )
  } else if (type === 'temperature_sensor' || type === 'pressure_sensor') {
    parts.push(
      `<circle cx="${X(x + w / 2)}" cy="${X(y + h / 2)}" r="12" fill="#fff" stroke="#57534e"/>`,
    )
  }
  return parts.join('')
}

function markers(): string {
  return `<defs>
  <marker id="app-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a"/>
  </marker>
</defs>`
}

/**
 * 仅接受校验后的 Public；程序图元模板；禁止任意 SVG 注入。
 */
export function renderIndustrialApparatusSvg(
  pub: IndustrialApparatusPublic,
): IndustrialSvgRenderResult {
  const v = validateIndustrialApparatusPublic(pub)
  if (!v.valid) {
    const empty =
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">` +
      `<text x="12" y="40" font-size="12" fill="#b91c1c">装置图校验失败</text></svg>`
    return {
      svg: empty,
      width: 320,
      height: 80,
      viewBox: '0 0 320 80',
      publicContentHash: pub.publicContentHash,
      renderReport: {
        valid: false,
        errors: v.errors.map((e) => e.message),
        warnings: v.warnings.map((w) => w.message),
        metrics: {
          diagramId: pub.apparatusId,
          diagramVersion: pub.apparatusVersion,
          publicContentHash: pub.publicContentHash,
          rendererVersion: INDUSTRIAL_APPARATUS_SVG_RENDERER_VERSION,
          nodeCount: pub.components.length,
          edgeCount: pub.connections.length,
          drawnNodeCount: 0,
          drawnEdgeCount: 0,
          canvasWidth: 320,
          canvasHeight: 80,
        },
      },
    }
  }

  const layout = layoutIndustrialApparatus(pub)
  const body: string[] = [markers()]
  body.push(
    `<text x="12" y="18" font-size="11" fill="#64748b" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">${escapeSvgText(pub.schematicDisclaimer.slice(0, 60))}</text>`,
  )
  body.push(
    `<text x="12" y="36" font-size="14" font-weight="600" fill="#0f172a" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">${escapeSvgText(pub.title)}</text>`,
  )

  for (const e of layout.connections) {
    const color = FLOW_COLOR[e.flowType] || '#0f172a'
    const d =
      e.points.length === 0
        ? ''
        : `M ${e.points.map((p) => `${sanitizeSvgCoord(p.x)} ${sanitizeSvgCoord(p.y)}`).join(' L ')}`
    body.push(
      `<path data-connection-id="${escapeSvgText(e.connectionId)}" d="${d}" fill="none" stroke="${color}" stroke-width="1.8" marker-end="url(#app-arrow)"/>`,
    )
    if (e.label && e.labelX != null && e.labelY != null) {
      body.push(
        `<text x="${sanitizeSvgCoord(e.labelX)}" y="${sanitizeSvgCoord(e.labelY)}" text-anchor="middle" font-size="10" fill="${color}" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">${escapeSvgText(e.label)}</text>`,
      )
    }
  }

  for (const c of layout.components) {
    body.push(
      `<g id="comp-${escapeSvgText(c.componentId)}" data-component-type="${escapeSvgText(c.componentType)}">`,
    )
    body.push(glyph(c.componentType, c.x, c.y, c.width, c.height))
    const lineH = 13
    const startY = c.y + c.height + 14
    c.lines.forEach((line, i) => {
      body.push(
        `<text x="${sanitizeSvgCoord(c.cx)}" y="${sanitizeSvgCoord(startY + i * lineH)}" text-anchor="middle" font-size="11" fill="#0f172a" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">${escapeSvgText(line)}</text>`,
      )
    })
    body.push(`</g>`)
  }

  const height = layout.height + 28
  const width = layout.width
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-apparatus-id="${escapeSvgText(pub.apparatusId)}" data-renderer="${INDUSTRIAL_APPARATUS_SVG_RENDERER_VERSION}">` +
    body.join('') +
    `</svg>`

  const errors: string[] = []
  if (/<script/i.test(svg) || /foreignObject/i.test(svg) || /xlink:href\s*=\s*["']https?:/i.test(svg)) {
    errors.push('SVG_SECURITY: forbidden construct')
  }

  return {
    svg,
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    publicContentHash: pub.publicContentHash,
    renderReport: {
      valid: errors.length === 0,
      errors,
      warnings: [...layout.warnings, ...v.warnings.map((w) => w.message)],
      metrics: {
        diagramId: pub.apparatusId,
        diagramVersion: pub.apparatusVersion,
        publicContentHash: pub.publicContentHash,
        rendererVersion: INDUSTRIAL_APPARATUS_SVG_RENDERER_VERSION,
        nodeCount: pub.components.length,
        edgeCount: pub.connections.length,
        drawnNodeCount: layout.components.length,
        drawnEdgeCount: layout.connections.length,
        canvasWidth: width,
        canvasHeight: height,
      },
    },
  }
}
