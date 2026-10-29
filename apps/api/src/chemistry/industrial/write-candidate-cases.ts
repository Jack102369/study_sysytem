/**
 * 将 fixtures 写出到仓库根 docs/chemistry_industrial_experiment/cases/*.json
 * pnpm --filter api run chem:industrial-write-cases
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'

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
  // fallback: api package → ../..
  return join(cwd, '..', '..')
}

function main() {
  const root = resolveRepoRoot()
  const dir = join(root, 'docs', 'chemistry_industrial_experiment', 'cases')
  mkdirSync(dir, { recursive: true })
  for (const c of ALL_CANDIDATE_CASES) {
    const path = join(dir, `${c.caseCode}.json`)
    writeFileSync(path, `${JSON.stringify(c, null, 2)}\n`, 'utf8')
    // eslint-disable-next-line no-console
    console.log('wrote', path)
  }
}

main()
