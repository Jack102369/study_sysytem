/**
 * 从 Definition fixture 投影 Public → 渲染 SVG → 写入 docs/.../svg_samples/
 * pnpm --filter api run chem:industrial-svg-write
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ALL_DIAGRAM_FIXTURES } from './industrial-diagram.fixtures'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'

function resolveRepoRoot(): string {
  const cwd = process.cwd()
  const tries = [cwd, join(cwd, '..'), join(cwd, '..', '..')]
  for (const root of tries) {
    if (
      existsSync(join(root, 'docs')) &&
      existsSync(join(root, 'apps', 'api')) &&
      existsSync(join(root, 'pnpm-workspace.yaml'))
    ) {
      return root
    }
  }
  return join(cwd, '..', '..')
}

function sampleName(diagramId: string): string {
  if (diagramId.includes('recycle')) return 'salt_purification_basic_recycle.svg'
  if (diagramId.includes('seawater')) return 'seawater_resource_basic.svg'
  if (diagramId.includes('metal')) return 'metal_recovery_basic.svg'
  if (diagramId.includes('salt_purification')) return 'salt_purification_basic.svg'
  return `${diagramId.replace(/[^a-z0-9_-]+/gi, '_')}.svg`
}

function main() {
  const dir = join(
    resolveRepoRoot(),
    'docs',
    'chemistry_industrial_experiment',
    'svg_samples',
  )
  mkdirSync(dir, { recursive: true })
  for (const def of ALL_DIAGRAM_FIXTURES) {
    const pub = projectIndustrialDiagramPublic(def)
    const result = renderIndustrialDiagramSvg(pub)
    if (!result.renderReport.valid) {
      // eslint-disable-next-line no-console
      console.warn('render warnings/errors', def.diagramId, result.renderReport)
    }
    const name = sampleName(def.diagramId)
    const path = join(dir, name)
    writeFileSync(path, `${result.svg}\n`, 'utf8')
    writeFileSync(
      join(dir, name.replace(/\.svg$/, '.report.json')),
      `${JSON.stringify(result.renderReport, null, 2)}\n`,
      'utf8',
    )
    // eslint-disable-next-line no-console
    console.log('wrote', path, 'valid=', result.renderReport.valid)
  }
}

main()
