/**
 * INDUSTRIAL_EXPERIMENT_FULL_DISABLE 自检（不写 DB；不启 Nest）。
 * pnpm --filter api run chem:industrial-full-disable-selftest
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  assertChemIndustrialExperimentEnabled,
  assertIndustrialSpecialtyAllowed,
  getChemIndustrialExperimentFeatureStatus,
  isChemIndustrialExperimentEnabled,
  CHEM_INDUSTRIAL_EXPERIMENT_ENV_KEY,
} from './industrial-feature.config'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function withEnv(
  value: string | undefined,
  fn: () => void,
): void {
  const prev = process.env.CHEM_INDUSTRIAL_EXPERIMENT_ENABLED
  if (value === undefined) delete process.env.CHEM_INDUSTRIAL_EXPERIMENT_ENABLED
  else process.env.CHEM_INDUSTRIAL_EXPERIMENT_ENABLED = value
  try {
    fn()
  } finally {
    if (prev === undefined) delete process.env.CHEM_INDUSTRIAL_EXPERIMENT_ENABLED
    else process.env.CHEM_INDUSTRIAL_EXPERIMENT_ENABLED = prev
  }
}

function expectNotFound(fn: () => void) {
  let threw = false
  try {
    fn()
  } catch (e) {
    threw = true
    const msg = String((e as Error)?.message || e)
    const name = String((e as Error)?.name || '')
    assert(
      name.includes('NotFound') || msg.includes('NOT_FOUND') || msg.includes('404'),
      `expected NotFound, got ${name}: ${msg}`,
    )
  }
  assert(threw, 'expected throw')
}

function repoRoot(): string {
  // apps/api/src/chemistry/industrial → repo root
  return join(__dirname, '..', '..', '..', '..', '..')
}

function main() {
  // A 默认未配置 → 关闭
  withEnv(undefined, () => {
    assert(!isChemIndustrialExperimentEnabled(), 'A: unset → OFF')
  })
  // B 显式 false / 空 / 非法
  withEnv('false', () => assert(!isChemIndustrialExperimentEnabled(), 'B: false'))
  withEnv('0', () => assert(!isChemIndustrialExperimentEnabled(), 'B: 0'))
  withEnv('no', () => assert(!isChemIndustrialExperimentEnabled(), 'B: no'))
  withEnv('', () => assert(!isChemIndustrialExperimentEnabled(), 'B: empty'))
  withEnv('maybe', () => assert(!isChemIndustrialExperimentEnabled(), 'B: maybe'))

  // C 显式 true|1|yes → 开
  withEnv('true', () => assert(isChemIndustrialExperimentEnabled(), 'C: true'))
  withEnv('1', () => assert(isChemIndustrialExperimentEnabled(), 'C: 1'))
  withEnv('yes', () => assert(isChemIndustrialExperimentEnabled(), 'C: yes'))
  withEnv('TRUE', () => assert(isChemIndustrialExperimentEnabled(), 'C: TRUE'))

  // assert helpers when OFF
  withEnv(undefined, () => {
    expectNotFound(() => assertChemIndustrialExperimentEnabled())
    expectNotFound(() =>
      assertIndustrialSpecialtyAllowed(INDUSTRIAL_SPECIALTY_CODE),
    )
    // experiment 不受影响
    assertIndustrialSpecialtyAllowed('experiment')
    assertIndustrialSpecialtyAllowed('redox')
    const st = getChemIndustrialExperimentFeatureStatus()
    assert(st.enabled === false, 'status.enabled false')
    assert(st.specialtyCode === INDUSTRIAL_SPECIALTY_CODE, 'specialty code')
    assert(st.envKey === CHEM_INDUSTRIAL_EXPERIMENT_ENV_KEY, 'env key')
  })

  withEnv('true', () => {
    assertChemIndustrialExperimentEnabled()
    assertIndustrialSpecialtyAllowed(INDUSTRIAL_SPECIALTY_CODE)
  })

  // 静态：Guard / Controller / 前端入口存在
  const root = repoRoot()
  const guard = join(
    root,
    'apps/api/src/chemistry/industrial/industrial-experiment-enabled.guard.ts',
  )
  assert(existsSync(guard), 'guard file')
  const guardSrc = readFileSync(guard, 'utf8')
  assert(guardSrc.includes('NotFoundException'), 'guard 404')
  assert(guardSrc.includes('isChemIndustrialExperimentEnabled'), 'guard reads flag')

  const ctrl = join(
    root,
    'apps/api/src/chemistry/industrial/industrial-review.controller.ts',
  )
  const ctrlSrc = readFileSync(ctrl, 'utf8')
  assert(
    ctrlSrc.includes('IndustrialExperimentEnabledGuard'),
    'review controller wired',
  )

  const chemCtrl = join(root, 'apps/api/src/chemistry/chemistry.controller.ts')
  assert(
    readFileSync(chemCtrl, 'utf8').includes('features/industrial-experiment'),
    'feature API',
  )

  const mainTs = join(root, 'apps/api/src/main.ts')
  assert(
    readFileSync(mainTs, 'utf8').includes('/uploads/industrial-svg'),
    'static SVG blocked',
  )

  const router = join(root, 'apps/web/src/router/index.ts')
  const routerSrc = readFileSync(router, 'utf8')
  assert(routerSrc.includes('requiresIndustrialExperiment'), 'route meta')
  assert(routerSrc.includes('fetchIndustrialExperimentFeature'), 'beforeEach feature')

  const layout = join(root, 'apps/web/src/layouts/SettingsLayout.vue')
  assert(
    readFileSync(layout, 'utf8').includes('v-if="industrialEnabled"'),
    'menu hide',
  )

  const featApi = join(root, 'apps/web/src/api/chemistry-features.ts')
  const featSrc = readFileSync(featApi, 'utf8')
  assert(featSrc.includes('视为关闭') || featSrc.includes('default OFF'), 'FE fail-closed')

  const envEx = join(root, 'apps/api/.env.example')
  assert(
    readFileSync(envEx, 'utf8').includes('CHEM_INDUSTRIAL_EXPERIMENT_ENABLED'),
    'env.example',
  )

  // U: experiment ≠ industrial（常量）
  assert(INDUSTRIAL_SPECIALTY_CODE === 'industrial_experiment', 'code')
  assert(INDUSTRIAL_SPECIALTY_CODE !== 'experiment', 'not experiment')

  // X/Y: 候选与证据包文件仍在
  const candDir = join(
    root,
    'docs/chemistry_industrial_experiment/formal_candidate_batches',
  )
  assert(existsSync(candDir), 'candidate batches kept')
  const srcDir = join(
    root,
    'docs/chemistry_industrial_experiment/scientific_source_packets',
  )
  assert(existsSync(srcDir), 'source packets kept')

  // 关键服务引用存在（不删代码）
  for (const f of [
    'apps/api/src/chemistry/train/chem-daily-review.service.ts',
    'apps/api/src/chemistry/train/chem-advanced-train.service.ts',
    'apps/api/src/chemistry/train/chem-wrong-question.service.ts',
    'apps/api/src/chemistry/train/chem-analytics.service.ts',
    'apps/api/src/chemistry/train/chem-train.service.ts',
    'apps/api/src/chemistry/chemistry.service.ts',
  ]) {
    const src = readFileSync(join(root, f), 'utf8')
    assert(
      src.includes('isChemIndustrialExperimentEnabled') ||
        src.includes('assertIndustrialSpecialtyAllowed'),
      `isolation in ${f}`,
    )
  }

  console.log('industrial-full-disable.selftest PASS')
}

main()
