/**
 * P1-0C 静态自检：关联规则、快照字段、审核回退、路由。
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  assertPrimaryAmongLinks,
  assertSameSpecialty,
} from './train-item-kps.validate'

const ROOT = path.resolve(__dirname, '../../../../../')

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
  console.log('PASS:', msg)
}

function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function expectThrow(fn: () => void, msg: string) {
  try {
    fn()
    console.error('FAIL:', msg, '(未抛错)')
    process.exit(1)
  } catch {
    console.log('PASS:', msg)
  }
}

function main() {
  assert(
    assertPrimaryAmongLinks({
      knowledgePointIds: [],
      primaryKnowledgePointId: null,
    }).primaryId === null,
    '空关联允许无主 KP',
  )
  expectThrow(
    () =>
      assertPrimaryAmongLinks({
        knowledgePointIds: [],
        primaryKnowledgePointId: '1',
      }),
    '空关联不能指定主 KP',
  )
  expectThrow(
    () =>
      assertPrimaryAmongLinks({
        knowledgePointIds: ['1', '2'],
        primaryKnowledgePointId: null,
      }),
    '有关联必须有主 KP',
  )
  expectThrow(
    () =>
      assertPrimaryAmongLinks({
        knowledgePointIds: ['1', '2'],
        primaryKnowledgePointId: '3',
      }),
    '主 KP 必须在列表内',
  )
  expectThrow(
    () =>
      assertPrimaryAmongLinks({
        knowledgePointIds: ['1', '1'],
        primaryKnowledgePointId: '1',
      }),
    '重复关联拒绝',
  )
  const ok = assertPrimaryAmongLinks({
    knowledgePointIds: ['1', '2'],
    primaryKnowledgePointId: '2',
  })
  assert(ok.primaryId === '2' && ok.ids.length === 2, '合法多 KP + 主 KP')

  expectThrow(
    () => assertSameSpecialty('10', '11', 'rja.x'),
    '跨章节关联拒绝',
  )
  assertSameSpecialty('10', '10', 'rja.x')
  console.log('PASS: 同章节允许')

  const svc = read(
    'apps/api/src/hs-math/admin/hs-math-admin-train-items.service.ts',
  )
  assert(svc.includes('replaceKnowledgePoints'), '管理端替换关联方法')
  assert(svc.includes("status = 'draft'"), 'approved 改关联回 draft')
  assert(svc.includes('pessimistic_write'), '关联更新锁题目')

  const train = read('apps/api/src/hs-math/train/hs-math-train.service.ts')
  assert(train.includes('knowledgePointCodesJson'), '创建会话写 KP codes 快照')
  assert(train.includes('primaryKnowledgePointCode'), '创建会话写主 KP 快照')
  assert(train.includes('pessimistic_write'), '抽题事务锁题目')

  const ctrl = read(
    'apps/api/src/hs-math/admin/hs-math-admin-train-items.controller.ts',
  )
  assert(ctrl.includes("Put(':id/knowledge-points')"), 'PUT 关联路由')

  const view = read(
    'apps/web/src/views/settings/hs-math/HsMathTrainItemsAdminView.vue',
  )
  assert(view.includes('replaceAdminHsMathTrainItemKnowledgePoints'), '管理页保存关联')
  const result = read('apps/web/src/views/hs-math/HsMathTrainResultView.vue')
  assert(result.includes('knowledgePoints'), '结果页展示 KP 快照')

  console.log('P1-0C static selftest: ALL PASS')
  console.log('NOTE: 真实 MySQL 并发一致性测试 NOT_RUN')
}

main()
