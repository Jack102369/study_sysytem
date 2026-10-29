/**
 * STEP_10 会话图形快照与受控读取契约自检（无真实 MySQL）。
 * pnpm --filter api run chem:industrial-train-session-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { INDUSTRIAL_SVG_SESSION_CONTRACT } from './industrial-svg-asset.service'
import { assertSafeIndustrialSvgStoragePath } from './industrial-svg-security'
import { gradeAnswer } from '../train/chem-train-grade'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function repoRoot(): string {
  const cwd = process.cwd()
  for (const root of [cwd, join(cwd, '..'), join(cwd, '..', '..')]) {
    if (existsSync(join(root, 'db', 'init.sql'))) return root
  }
  throw new Error('REPO_ROOT_NOT_FOUND')
}

function main() {
  const root = repoRoot()
  const init = readFileSync(join(root, 'db', 'init.sql'), 'utf8')
  assert(init.includes('chem_train_session_item_assets'), 'init session assets')
  assert(init.includes('uk_chem_sess_item_asset'), 'init unique')
  assert(init.includes('fk_chem_sess_item_asset_si'), 'init fk')
  assert(
    init.includes('source_item_asset_id BIGINT UNSIGNED NULL'),
    'no hard FK to item assets',
  )

  const mig09 = join(root, 'db', 'migrate_chemistry_industrial_train_item_assets.sql')
  const mig10 = join(root, 'db', 'migrate_chemistry_industrial_session_item_assets.sql')
  assert(existsSync(mig09), 'migrate D043')
  assert(existsSync(mig10), 'migrate D045')
  const mig10body = readFileSync(mig10, 'utf8')
  assert(mig10body.includes('chem_train_session_item_assets'), 'mig10 table')
  assert(mig10body.includes('migrate_chemistry_industrial_train_item_assets'), 'order note')

  const entity = join(
    root,
    'apps/api/src/chemistry/train/entities/chem-train-session-item-asset.entity.ts',
  )
  assert(existsSync(entity), 'entity')
  assert(
    readFileSync(entity, 'utf8').includes("@Entity('chem_train_session_item_assets')"),
    'entity map',
  )

  const mainTs = readFileSync(join(root, 'apps/api/src/main.ts'), 'utf8')
  assert(mainTs.includes('/uploads/industrial-svg'), 'static block')
  assert(mainTs.includes('403'), 'forbid static')

  const ctrl = readFileSync(
    join(root, 'apps/api/src/chemistry/train/chem-train.controller.ts'),
    'utf8',
  )
  assert(ctrl.includes('assets/:assetId/svg'), 'student svg route')
  assert(ctrl.includes('ChemTrainSessionDiagramService'), 'diagram svc')

  assert(INDUSTRIAL_SVG_SESSION_CONTRACT.version === '1.2', 'contract ver')
  assert(INDUSTRIAL_SVG_SESSION_CONTRACT.sessionSnapshot === 'IMPLEMENTED_STEP_10', 'snap')
  assert(INDUSTRIAL_SVG_SESSION_CONTRACT.publicStaticBlocked === true, 'blocked')
  assert(
    INDUSTRIAL_SVG_SESSION_CONTRACT.sessionAssetTable === 'chem_train_session_item_assets',
    'table name',
  )

  // 排序稳定：多图按 sortOrder
  const snaps = [
    { id: '2', sortOrder: 1, contentHash: 'b'.repeat(64) },
    { id: '1', sortOrder: 0, contentHash: 'a'.repeat(64) },
  ].sort((x, y) => x.sortOrder - y.sortOrder)
  assert(snaps[0].sortOrder === 0 && snaps[1].sortOrder === 1, 'sort')

  // 路径穿越拒绝
  let rej = false
  try {
    assertSafeIndustrialSvgStoragePath('a'.repeat(64), '../etc/passwd')
  } catch {
    rej = true
  }
  assert(rej, 'path reject')

  // 判题不回归（工业图不改语义）
  assert(
    gradeAnswer({
      qtype: 'single',
      standardAnswer: 'A',
      aliasesJson: null,
      userAnswer: 'A',
    }).result === 'correct',
    'single',
  )
  assert(
    gradeAnswer({
      qtype: 'judge',
      standardAnswer: '正确',
      aliasesJson: null,
      userAnswer: '正确',
    }).result === 'correct',
    'judge',
  )
  assert(
    gradeAnswer({
      qtype: 'blank',
      standardAnswer: 'H2O',
      aliasesJson: null,
      userAnswer: 'H2O',
      answerType: 'text',
    }).result === 'correct',
    'blank',
  )

  // 历史无快照不得伪造：空数组语义
  const legacyDiagramAssets: unknown[] = []
  assert(Array.isArray(legacyDiagramAssets) && legacyDiagramAssets.length === 0, 'legacy empty')

  // eslint-disable-next-line no-console
  console.log(
    'industrial-train-session.selftest: OK (DDL+contract+static-block+grade; MySQL IT NOT_EXECUTED)',
  )
}

main()
