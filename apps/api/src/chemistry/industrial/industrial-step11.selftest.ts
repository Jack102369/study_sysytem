/**
 * STEP_11：每日/错题/变式/提高挑战/分析整合契约自检（无真实 MySQL / 浏览器）。
 * pnpm --filter api run chem:industrial-step11-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'

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

  // A. 无平行训练系统：复用 chem daily/advanced/wrong/analytics
  const daily = read(root, 'apps/api/src/chemistry/train/chem-daily-review.service.ts')
  assert(daily.includes('ChemTrainEligibilityService'), 'daily eligibility')
  assert(daily.includes('sessionDiagrams'), 'daily session snapshots')
  assert(!existsSync(join(root, 'apps/api/src/chemistry/industrial/industrial-daily.service.ts')), 'no parallel daily')

  const advanced = read(root, 'apps/api/src/chemistry/train/chem-advanced-train.service.ts')
  assert(advanced.includes('difficultyMode'), 'advanced modes')
  assert(advanced.includes('sessionDiagrams'), 'advanced snapshots')

  // B. 错题历史图形：sessionId/sessionItemId → session assets
  const wrongSvc = read(root, 'apps/api/src/chemistry/train/chem-wrong-question.service.ts')
  assert(wrongSvc.includes('mapSnapshotsBySessionItemIds'), 'wrong history snaps')
  assert(wrongSvc.includes('diagramAssets'), 'diagramAssets field')
  assert(wrongSvc.includes('不显示当前题库图') || wrongSvc.includes('禁止用当前题库图'), 'no current diagram spoof')

  const wrongEvt = read(
    root,
    'apps/api/src/chemistry/train/entities/chem-wrong-event.entity.ts',
  )
  assert(wrongEvt.includes('sessionId'), 'event sessionId')
  assert(wrongEvt.includes('sessionItemId'), 'event sessionItemId')

  // C. 错题变式：候选进审核仓，formalImportBlocked
  const varSvc = read(
    root,
    'apps/api/src/chemistry/industrial/industrial-wrong-variation.service.ts',
  )
  assert(varSvc.includes('formalImportBlocked: true'), 'formal blocked')
  assert(varSvc.includes('createIndustrialReviewRecord'), 'review warehouse')
  assert(varSvc.includes('wrong_variation_source'), 'source tag')
  assert(varSvc.includes('DEDUP_WINDOW_MS') || varSvc.includes('findRecentOpenCandidate'), 'dedup')
  assert(
    !varSvc.includes('writeFormalItemWithAsset'),
    'variation must not write formal directly',
  )

  const wrongCtrl = read(
    root,
    'apps/api/src/chemistry/train/chem-wrong-question.controller.ts',
  )
  assert(
    wrongCtrl.includes('industrial-variation-candidate'),
    'student candidate route',
  )
  assert(wrongCtrl.includes('IndustrialWrongVariationService'), 'wired')

  // D. KB bind：仅 published，不放宽 eligibility
  const kb = read(root, 'apps/api/src/chemistry/industrial/industrial-kb-bind.service.ts')
  assert(kb.includes("!== 'published'"), 'published only')
  assert(kb.includes('INDUSTRIAL_SPECIALTY_CODE'), 'industrial only')
  assert(kb.includes('admin_industrial_kb_bind'), 'source note')

  const reviewCtrl = read(
    root,
    'apps/api/src/chemistry/industrial/industrial-review.controller.ts',
  )
  assert(reviewCtrl.includes('kb-bind'), 'kb-bind route')
  assert(reviewCtrl.includes('IndustrialKbBindService'), 'kb bind wired')

  // E. 学习分析 industrialFocus
  const analytics = read(root, 'apps/api/src/chemistry/train/chem-analytics.service.ts')
  assert(analytics.includes('buildIndustrialCategoryFocus'), 'industrial focus')
  assert(
    analytics.includes('INDUSTRIAL_SPECIALTY_CODE') ||
      analytics.includes(INDUSTRIAL_SPECIALTY_CODE),
    'specialty code',
  )
  assert(analytics.includes('sampleLow'), 'sample low')
  assert(analytics.includes('specialtyCodeFilter') || analytics.includes('focusCode'), 'focus filter')

  const analyticsDto = read(root, 'apps/api/src/chemistry/train/dto/analytics.dto.ts')
  assert(analyticsDto.includes('specialtyCode'), 'dto specialty')

  // F. module 注册
  const mod = read(root, 'apps/api/src/chemistry/chemistry.module.ts')
  assert(mod.includes('IndustrialWrongVariationService'), 'module variation')
  assert(mod.includes('IndustrialKbBindService'), 'module kb')

  // G. 前端复用 TrainSessionIndustrialDiagrams；无平行渲染器
  const wrongDetail = read(
    root,
    'apps/web/src/views/chemistry/ChemistryWrongQuestionDetailView.vue',
  )
  assert(
    wrongDetail.includes('TrainSessionIndustrialDiagrams'),
    'reuse session diagrams',
  )
  assert(
    wrongDetail.includes('requestIndustrialWrongVariationCandidate') ||
      wrongDetail.includes('industrial-variation'),
    'candidate UI',
  )

  const wrongList = read(
    root,
    'apps/web/src/views/chemistry/ChemistryWrongQuestionsView.vue',
  )
  assert(wrongList.includes('specialtyCode'), 'list specialty filter')
  assert(wrongList.includes('categoryCode'), 'list category filter')

  const analyticsVue = read(
    root,
    'apps/web/src/views/chemistry/ChemistryAnalyticsView.vue',
  )
  assert(analyticsVue.includes('industrialFocus'), 'analytics industrial UI')
  assert(analyticsVue.includes('industrial_experiment'), 'focus industrial')

  // H. 无新平行错题/训练表
  const init = read(root, 'db/init.sql')
  assert(init.includes('chem_wrong_events'), 'reuse wrong events')
  assert(!init.includes('chem_industrial_wrong'), 'no parallel wrong table')
  assert(!init.includes('chem_industrial_daily'), 'no parallel daily table')

  // I. STEP_10 契约未回退
  assert(init.includes('chem_train_session_item_assets'), 'session assets remain')
  const mainTs = read(root, 'apps/api/src/main.ts')
  assert(mainTs.includes('/uploads/industrial-svg'), 'static block remains')

  console.log('chem:industrial-step11-selftest PASS')
}

main()
