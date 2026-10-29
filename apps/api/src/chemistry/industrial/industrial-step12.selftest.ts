/**
 * STEP_12：综合验收静态/契约自检（无真实 MySQL / 浏览器 / 在线 AI）。
 * pnpm --filter api run chem:industrial-step12-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'
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

function read(root: string, rel: string) {
  return readFileSync(join(root, rel), 'utf8')
}

function main() {
  const root = repoRoot()
  const init = read(root, 'db/init.sql')

  // --- D043 / D045 DDL ---
  assert(init.includes('CREATE TABLE IF NOT EXISTS chem_train_item_assets'), 'init D043')
  assert(init.includes('CREATE TABLE IF NOT EXISTS chem_train_session_item_assets'), 'init D045')
  assert(init.includes('uk_chem_train_item_asset'), 'D043 unique')
  assert(init.includes('uk_chem_sess_item_asset'), 'D045 unique')
  assert(init.includes('fk_chem_train_item_asset_item'), 'D043 fk')
  assert(init.includes('fk_chem_sess_item_asset_si'), 'D045 fk')
  assert(init.includes('ON DELETE CASCADE'), 'cascade present')
  assert(init.includes('source_item_asset_id BIGINT UNSIGNED NULL'), 'no hard FK to item assets')

  const mig09 = read(root, 'db/migrate_chemistry_industrial_train_item_assets.sql')
  const mig10 = read(root, 'db/migrate_chemistry_industrial_session_item_assets.sql')
  assert(mig09.includes('chem_train_item_assets'), 'mig09 table')
  assert(mig10.includes('chem_train_session_item_assets'), 'mig10 table')
  assert(
    mig10.includes('migrate_chemistry_industrial_train_item_assets'),
    'mig10 order note after D043',
  )

  // Entity 映射
  const itemEnt = read(
    root,
    'apps/api/src/chemistry/train/entities/chem-train-item-asset.entity.ts',
  )
  const sessEnt = read(
    root,
    'apps/api/src/chemistry/train/entities/chem-train-session-item-asset.entity.ts',
  )
  assert(itemEnt.includes("@Entity('chem_train_item_assets')"), 'item entity')
  assert(sessEnt.includes("@Entity('chem_train_session_item_assets')"), 'sess entity')

  // 种子：第 13 专项 + 12 分类
  const seed = read(root, 'apps/api/src/chemistry/chemistry.seed.ts')
  assert(seed.includes(INDUSTRIAL_SPECIALTY_CODE) || seed.includes("'industrial_experiment'"), 'seed specialty')
  assert(ALL_CANDIDATE_CASES.length >= 1, 'cases exist')
  assert(
    INDUSTRIAL_SVG_SESSION_CONTRACT.publicStaticBlocked === true,
    'static blocked contract',
  )
  assert(
    INDUSTRIAL_SVG_SESSION_CONTRACT.sessionSnapshot === 'IMPLEMENTED_STEP_10',
    'snapshot implemented',
  )

  // main.ts 403
  const mainTs = read(root, 'apps/api/src/main.ts')
  assert(mainTs.includes("'/uploads/industrial-svg'"), 'static path')
  assert(mainTs.includes('403'), '403')
  assert(mainTs.includes('useStaticAssets'), 'other uploads remain')

  // 路径穿越
  let rej = false
  try {
    assertSafeIndustrialSvgStoragePath('a'.repeat(64), '../etc/passwd')
  } catch {
    rej = true
  }
  assert(rej, 'path traversal reject')

  // 判题不回归
  assert(
    gradeAnswer({
      qtype: 'single',
      standardAnswer: 'A',
      aliasesJson: null,
      userAnswer: 'A',
    }).result === 'correct',
    'grade single',
  )
  assert(
    gradeAnswer({
      qtype: 'judge',
      standardAnswer: '正确',
      aliasesJson: null,
      userAnswer: '正确',
    }).result === 'correct',
    'grade judge',
  )
  assert(
    gradeAnswer({
      qtype: 'blank',
      standardAnswer: 'H2O',
      aliasesJson: null,
      userAnswer: 'H2O',
      answerType: 'text',
    }).result === 'correct',
    'grade blank',
  )

  // 正式闸门 / formalAllowed
  const formal = read(
    root,
    'apps/api/src/chemistry/industrial/industrial-formal-import.service.ts',
  )
  assert(
    formal.includes('formalAllowed') || formal.includes('FORMAL_ALLOWED'),
    'formal note',
  )
  const admin = read(
    root,
    'apps/api/src/chemistry/train/generator/train-items-admin.service.ts',
  )
  assert(
    admin.includes('formalAllowed') &&
      (admin.includes('false') || admin.includes('= false')),
    'admin formalAllowed false',
  )

  // STEP_11 变式阻断
  const varSvc = read(
    root,
    'apps/api/src/chemistry/industrial/industrial-wrong-variation.service.ts',
  )
  assert(varSvc.includes('formalImportBlocked: true'), 'variation blocked')

  // KB bind
  const kb = read(root, 'apps/api/src/chemistry/industrial/industrial-kb-bind.service.ts')
  assert(kb.includes("!== 'published'"), 'kb published only')

  // SVG 前端不用 v-html
  const ifd = read(
    root,
    'apps/web/src/components/chemistry/IndustrialFlowDiagram.vue',
  )
  assert(ifd.includes('<img'), 'blob img')
  assert(!/v-html\s*=/.test(ifd), 'no v-html binding in industrial diagram')
  assert(ifd.includes('避免 v-html') || ifd.includes('blob'), 'blob strategy documented')

  // 无平行系统
  assert(
    !existsSync(join(root, 'apps/api/src/chemistry/industrial/industrial-daily.service.ts')),
    'no parallel daily',
  )
  assert(!init.includes('chem_industrial_wrong'), 'no parallel wrong table')

  // synchronize false
  const appMod = read(root, 'apps/api/src/app.module.ts')
  assert(
    appMod.includes('synchronize: false') || appMod.includes('synchronize:false'),
    'no synchronize',
  )

  // 文档产物占位（STEP_12 应写出）
  // 本自检不强制 docs 存在于首次运行前；由 STEP_12 文档任务保证

  console.log(
    'chem:industrial-step12-selftest PASS (static/contract; MySQL/E2E/live-AI NOT_EXECUTED)',
  )
}

main()
