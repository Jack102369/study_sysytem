/**
 * 写出流程图协议示例到 docs/chemistry_industrial_experiment/diagrams/
 * pnpm --filter api run chem:industrial-diagram-write
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  ALL_DIAGRAM_FIXTURES,
  fileNameForDiagram,
} from './industrial-diagram.fixtures'

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

function main() {
  const dir = join(
    resolveRepoRoot(),
    'docs',
    'chemistry_industrial_experiment',
    'diagrams',
  )
  mkdirSync(dir, { recursive: true })
  for (const d of ALL_DIAGRAM_FIXTURES) {
    const path = join(dir, fileNameForDiagram(d))
    writeFileSync(path, `${JSON.stringify(d, null, 2)}\n`, 'utf8')
    // eslint-disable-next-line no-console
    console.log('wrote', path)
  }
}

main()
