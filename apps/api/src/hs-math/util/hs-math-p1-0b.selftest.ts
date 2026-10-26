/**
 * P1-0B 静态自检：模块注册、DTO、父子校验工具、前端路由关键词。
 * 运行：pnpm --filter api run hs-math:p1-0b-selftest
 */
import * as fs from 'fs'
import * as path from 'path'

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

function main() {
  const mod = read('apps/api/src/hs-math/hs-math.module.ts')
  assert(mod.includes('HsMathKnowledgeController'), '模块注册学生 KP Controller')
  assert(mod.includes('HsMathAdminKnowledgeController'), '模块注册管理 KP Controller')
  assert(mod.includes('HsMathKnowledgeService'), '模块注册学生 KP Service')
  assert(mod.includes('HsMathAdminKnowledgeService'), '模块注册管理 KP Service')

  const studentSvc = read(
    'apps/api/src/hs-math/taxonomy/hs-math-knowledge.service.ts',
  )
  assert(studentSvc.includes('is_active = 1'), '学生端过滤 is_active')
  assert(studentSvc.includes('isAncestorChainActive'), '停用父级不可绕过')

  const adminSvc = read(
    'apps/api/src/hs-math/admin/hs-math-admin-knowledge.service.ts',
  )
  assert(adminSvc.includes('assertValidKpParent'), '管理端父子校验')
  assert(adminSvc.includes('ConflictException'), '重复 code 冲突')
  assert(!adminSvc.includes('@Delete'), '无物理删除')
  assert(adminSvc.includes('存在子知识点'), '有子节点禁止乱挪章节')

  const parentUtil = read('apps/api/src/hs-math/util/kp-parent.ts')
  assert(parentUtil.includes('循环依赖'), '环检测')
  assert(parentUtil.includes('不能指向自身'), '自引用检测')

  const router = read('apps/web/src/router/index.ts')
  assert(router.includes('hs-math-knowledge'), '设置页知识点路由')
  assert(router.includes('hs-math/kp/:code'), '学生 KP 详情路由')
  assert(router.includes('categories/:categoryId/knowledge'), '小节 KP 列表路由')

  const settings = read('apps/web/src/layouts/SettingsLayout.vue')
  assert(settings.includes('hs-math-knowledge'), '设置菜单知识点入口')

  const adminView = read(
    'apps/web/src/views/settings/hs-math/HsMathKnowledgeAdminView.vue',
  )
  assert(adminView.includes('renderMathHtml'), '管理端公式预览')
  assert(
    !adminView.includes('>删除<') && !adminView.includes("'删除'"),
    '管理端无删除操作按钮',
  )

  const detail = read(
    'apps/web/src/views/hs-math/HsMathKnowledgeDetailView.vue',
  )
  assert(detail.includes('renderMathHtml'), '学生端公式渲染')
  assert(detail.includes('v-html="summaryHtml"'), '安全转义后的 HTML')

  console.log('P1-0B static selftest: ALL PASS')
}

main()
