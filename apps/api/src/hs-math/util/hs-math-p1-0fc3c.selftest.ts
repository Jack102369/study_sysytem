/**
 * P1-0F-C3C 纯逻辑/源码自检（不连 MySQL、不对 80 道正式题写审核）。
 * 真实 MySQL 审核写入 / 浏览器 E2E：NOT_RUN（见文档）。
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  assertReviewDecisionInput,
  evaluateLatestReviewForPublish,
  summarizeCurrentReview,
} from './hs-math-review-gate'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const root = path.resolve(__dirname, '../../../../../')
const apiRoot = path.join(root, 'apps/api/src/hs-math')
const webRoot = path.join(root, 'apps/web/src')

function read(p: string) {
  return fs.readFileSync(p, 'utf8')
}

function main() {
  // --- 纯逻辑：版本失效 / STALE ---
  {
    const s = summarizeCurrentReview({
      contentVersion: 2,
      contentFingerprint: 'fp2',
      reviewsForItem: [
        {
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'old',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
    })
    assert(s.currentReviewStatus === 'stale', '旧版本 passed → STALE')
    assert(s.reviewIsStale, 'reviewIsStale')
  }

  {
    const s = summarizeCurrentReview({
      contentVersion: 1,
      contentFingerprint: 'fp-new',
      reviewsForItem: [
        {
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp-old',
          reviewComment: 'x',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
    })
    assert(s.currentReviewStatus === 'stale', '指纹不一致 → STALE')
  }

  {
    const s = summarizeCurrentReview({
      contentVersion: 1,
      contentFingerprint: 'fp1',
      reviewsForItem: [
        {
          reviewStatus: 'rejected',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'fix',
          reviewerUserId: '1',
          reviewedAt: new Date('2026-01-02'),
        },
        {
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'old pass',
          reviewerUserId: '1',
          reviewedAt: new Date('2026-01-01'),
        },
      ],
    })
    assert(s.currentReviewStatus === 'rejected', '最新审核覆盖旧结论')
  }

  {
    const r = evaluateLatestReviewForPublish({
      item: {
        status: 'draft',
        pool: 'formal',
        isActive: true,
        contentVersion: 1,
        contentFingerprint: 'fp1',
      },
      reviewsForItem: [
        {
          reviewStatus: 'rejected',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'no',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: false,
    })
    assert(!r.ok && r.code === 'LATEST_NOT_PASSED', 'rejected 阻止发布')
  }

  {
    const r = evaluateLatestReviewForPublish({
      item: {
        status: 'draft',
        pool: 'formal',
        isActive: true,
        contentVersion: 1,
        contentFingerprint: 'fp1',
      },
      reviewsForItem: [
        {
          reviewStatus: 'deferred',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'wait',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: false,
    })
    assert(!r.ok, 'deferred 阻止发布')
  }

  {
    const r = evaluateLatestReviewForPublish({
      item: {
        status: 'draft',
        pool: 'formal',
        isActive: true,
        contentVersion: 1,
        contentFingerprint: 'fp1',
      },
      reviewsForItem: [],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'NO_REVIEW', '无审核不能发布')
  }

  try {
    assertReviewDecisionInput({
      decision: 'passed',
      comment: 'ok',
      reviewerIdFromClient: 'hack',
    })
    assert(false, '应拒绝伪造 reviewerId')
  } catch (e: any) {
    assert(/reviewerId/.test(e.message), '禁止客户端 reviewerId')
  }

  try {
    assertReviewDecisionInput({ decision: 'passed', comment: '   ' })
    assert(false, '空意见应拒绝')
  } catch (e: any) {
    assert(/意见/.test(e.message), '空意见拒绝')
  }

  // --- 源码断言 ---
  const ctrl = read(
    path.join(apiRoot, 'admin/hs-math-admin-train-items.controller.ts'),
  )
  assert(ctrl.includes("Get('review-queue')"), 'review-queue 路由')
  assert(ctrl.includes("Get(':id/review-panel')"), 'review-panel 路由')
  assert(ctrl.includes('review-queue'), 'queue 在 :id 前')
  assert(
    ctrl.indexOf("Get('review-queue')") < ctrl.indexOf("Get(':id')"),
    'review-queue 注册早于 :id',
  )
  assert(ctrl.includes('JwtAuthGuard') && ctrl.includes('AdminGuard'), 'JWT+ADMIN')
  assert(ctrl.includes('publishWithHumanReviewGate') === false, 'controller 不直调门禁名也可')
  assert(ctrl.includes('patchStatus'), '旧 status 入口仍在')

  const svc = read(
    path.join(apiRoot, 'admin/hs-math-admin-train-items.service.ts'),
  )
  assert(svc.includes('publishWithHumanReviewGate'), '统一发布门禁')
  assert(
    /to === 'approved'[\s\S]*publishWithHumanReviewGate/.test(svc),
    'status→approved 走门禁',
  )

  const revSvc = read(
    path.join(apiRoot, 'admin/hs-math-admin-train-item-reviews.service.ts'),
  )
  assert(revSvc.includes('listReviewQueue'), '队列方法')
  assert(revSvc.includes('getReviewPanel'), '面板方法')
  assert(
    revSvc.includes('collectSourcePublishBlockReasons'),
    '面板复用正式来源发布门禁（H2）',
  )
  assert(revSvc.includes('expectedContentVersion'), '版本乐观锁')
  assert(revSvc.includes('expectedContentFingerprint'), '指纹乐观锁')
  assert(revSvc.includes('ConflictException'), '409 冲突')
  assert(revSvc.includes("pool = :pool"), '队列仅 formal')
  assert(revSvc.includes("pool === 'test'"), '拒绝 test 池审核')
  assert(revSvc.includes('pessimistic_write'), 'FOR UPDATE')
  assert(revSvc.includes("reviewedAt: 'DESC'"), '时间倒序')
  assert(/id:\s*'DESC'/.test(revSvc), 'id DESC 打破平局')
  assert(!/status\s*=\s*'approved'/.test(revSvc), '审核服务不写 approved')
  assert(revSvc.includes('itemStatusUnchanged'), '返回 status 未变')
  assert(!/\.take\(\s*2000\s*\)/.test(revSvc), '队列无固定 2000 截断调用')
  assert(revSvc.includes('paginateStableList'), 'C3C.2 稳定分页')
  assert(revSvc.includes('enrichQueueRowsBatched'), '分批 enrich')
  assert(revSvc.includes('HS_MATH_P1_0FC3C1_IT_'), '队列排除 IT 前缀')

  const dto = read(path.join(apiRoot, 'dto/admin-train-item-review.dto.ts'))
  assert(dto.includes('expectedContentVersion'), 'DTO 必填版本')
  assert(dto.includes('expectedContentFingerprint'), 'DTO 必填指纹')

  const feApi = read(path.join(webRoot, 'api/hs-math-admin.ts'))
  assert(feApi.includes('fetchReviewQueue'), 'FE queue API')
  assert(feApi.includes('fetchReviewPanel'), 'FE panel API')
  assert(feApi.includes('submitTrainItemReview'), 'FE submit API')
  assert(feApi.includes('publishReviewedTrainItem'), 'FE publish API')
  assert(feApi.includes('confirmPublish'), 'publish 带 confirmPublish')

  const view = read(
    path.join(
      webRoot,
      'views/settings/hs-math/HsMathTrainItemsReviewView.vue',
    ),
  )
  assert(view.includes('MathStem'), 'KaTeX MathStem')
  assert(view.includes('MathOptionList'), 'MathOptionList')
  assert(view.includes('renderMathHtml') === false, '不直接裸用 render 绕过组件亦可')
  assert(view.includes('expectedContentVersion'), '提交带版本')
  assert(view.includes('expectedContentFingerprint'), '提交带指纹')
  assert(view.includes('409'), '409 提示')
  assert(view.includes('人工审核已通过'), 'passed 文案非已发布')
  assert(view.includes('正式批准发布'), '发布分区')
  assert(view.includes('DEV_MATH_REVIEW_NOTE'), '开发备注标识')
  assert(!view.includes('v-html="panel'), '不直接 v-html 题干')

  const flags = read(
    path.join(webRoot, 'utils/hs-math-review-issue-flags.ts'),
  )
  assert(flags.includes('0004') && flags.includes('0008'), '静态备注 codes')
  assert(flags.includes('非数据库人工审核'), '不冒充人工审核')

  const router = read(path.join(webRoot, 'router/index.ts'))
  assert(router.includes('hs-math-train-review'), '路由')
  const layout = read(path.join(webRoot, 'layouts/SettingsLayout.vue'))
  assert(layout.includes('hs-math-train-review'), '菜单')
  assert(layout.includes('数学训练题库'), '保留题库菜单')

  const pkg = read(path.join(root, 'apps/api/package.json'))
  assert(pkg.includes('hs-math:p1-0fc3c-selftest'), 'package script')

  console.log('hs-math P1-0F-C3C unit selftest PASS')
  console.log(
    'NOTE: real MySQL review write / browser E2E = NOT_RUN (by stage policy)',
  )
}

main()
