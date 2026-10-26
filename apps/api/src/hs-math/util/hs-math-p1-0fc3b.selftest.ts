/**
 * P1-0F-C3B 纯逻辑自检（不连 MySQL、不执行迁移）。
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  fingerprintTrainItemContent,
  isMysqlNoSuchTableError,
} from './hs-math-item-content-fingerprint'
import {
  assertReviewDecisionInput,
  evaluateLatestReviewForPublish,
} from './hs-math-review-gate'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const root = path.resolve(__dirname, '../../../../../')

function main() {
  // 1) 无审核不能批准
  {
    const r = evaluateLatestReviewForPublish({
      item: {
        status: 'draft',
        pool: 'formal',
        isActive: true,
        contentVersion: 1,
        contentFingerprint: 'aaa',
      },
      reviewsForItem: [],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'NO_REVIEW', '无审核记录不能批准')
  }

  // 2) passed + 版本/指纹一致
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
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'ok math',
          reviewerUserId: '9',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(r.ok, 'passed 且一致应允许')
  }

  // 3) 指纹不一致
  {
    const r = evaluateLatestReviewForPublish({
      item: {
        status: 'draft',
        pool: 'formal',
        isActive: true,
        contentVersion: 1,
        contentFingerprint: 'fp-new',
      },
      reviewsForItem: [
        {
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp-old',
          reviewComment: 'ok',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'FINGERPRINT_MISMATCH', '指纹不一致拒绝')
  }

  // 4) 版本不一致（同列表无当前版本）
  {
    const r = evaluateLatestReviewForPublish({
      item: {
        status: 'draft',
        pool: 'formal',
        isActive: true,
        contentVersion: 2,
        contentFingerprint: 'fp1',
      },
      reviewsForItem: [
        {
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'ok',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'NO_REVIEW', '版本不一致视为无当前审核')
  }

  // 5) rejected
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
          reviewComment: 'wrong',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'LATEST_NOT_PASSED', 'rejected 拒绝')
  }

  // 6) deferred
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
          reviewComment: 'later',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'LATEST_NOT_PASSED', 'deferred 拒绝')
  }

  // 7) 最新为 rejected（即使更早有 passed）
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
          reviewComment: 'reconsider',
          reviewerUserId: '2',
          reviewedAt: new Date('2026-10-24T12:00:00Z'),
        },
        {
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'earlier ok',
          reviewerUserId: '1',
          reviewedAt: new Date('2026-10-24T10:00:00Z'),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'LATEST_NOT_PASSED', '最新 rejected 拒绝')
  }

  // 8) 空意见
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
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: '   ',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: true,
    })
    assert(!r.ok && r.code === 'EMPTY_COMMENT', '空审核意见拒绝')
  }

  // 9) 客户端伪造 reviewerId
  {
    let threw = false
    try {
      assertReviewDecisionInput({
        decision: 'passed',
        comment: 'ok',
        reviewerIdFromClient: 'hack',
      })
    } catch {
      threw = true
    }
    assert(threw, '禁止客户端指定 reviewerId')
  }

  // 10) confirmPublish 缺失
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
          reviewStatus: 'passed',
          contentVersion: 1,
          contentFingerprint: 'fp1',
          reviewComment: 'ok',
          reviewerUserId: '1',
          reviewedAt: new Date(),
        },
      ],
      requireConfirmPublish: true,
      confirmPublish: false,
    })
    assert(!r.ok && r.code === 'CONFIRM_REQUIRED', '缺确认拒绝')
  }

  // 11) 指纹键序无关
  {
    const a = fingerprintTrainItemContent({
      code: 'X',
      specialtyCode: 'rja-ch1',
      categoryCode: '1.1',
      qtype: 'judge',
      difficulty: 1,
      stem: 't',
      optionsJson: null,
      answerPayloadJson: { kind: 'judge', value: true },
      analysis: 'a',
      knowledgePointCodes: ['rja.1.1.01', 'rja.1.1.02'],
      primaryKnowledgePointCode: 'rja.1.1.01',
    })
    const b = fingerprintTrainItemContent({
      code: 'X',
      specialtyCode: 'rja-ch1',
      categoryCode: '1.1',
      qtype: 'judge',
      difficulty: 1,
      stem: 't',
      optionsJson: null,
      answerPayloadJson: { value: true, kind: 'judge' },
      analysis: 'a',
      knowledgePointCodes: ['rja.1.1.02', 'rja.1.1.01'],
      primaryKnowledgePointCode: 'rja.1.1.01',
    })
    assert(a === b, '指纹键序/KP 顺序无关')
  }

  // 12) 缺表错误识别 → fail-closed 信号
  assert(
    isMysqlNoSuchTableError({ code: 'ER_NO_SUCH_TABLE', errno: 1146 }),
    '识别缺表',
  )

  // 13) 源码：旧 status→approved 走统一门禁
  const svc = fs.readFileSync(
    path.join(__dirname, '../admin/hs-math-admin-train-items.service.ts'),
    'utf8',
  )
  assert(svc.includes('publishWithHumanReviewGate'), 'status 批准走统一门禁')
  assert(svc.includes('evaluateLatestReviewForPublish'), '调用审核评估')
  assert(svc.includes('isMysqlNoSuchTableError'), '缺表 fail-closed')
  assert(svc.includes('confirmPublish'), '要求确认')

  const ctrl = fs.readFileSync(
    path.join(__dirname, '../admin/hs-math-admin-train-items.controller.ts'),
    'utf8',
  )
  assert(ctrl.includes("':id/reviews'"), '审核路由存在')
  assert(ctrl.includes('AdminGuard'), 'AdminGuard')

  const importSvc = fs.readFileSync(
    path.join(
      __dirname,
      '../admin/hs-math-admin-train-items-import.service.ts',
    ),
    'utf8',
  )
  assert(
    importSvc.includes("status: 'draft'") || importSvc.includes("'draft'"),
    'import 写 draft',
  )
  assert(!/status:\s*'approved'/.test(importSvc), 'import 不写 approved')

  const migrate = fs.readFileSync(
    path.join(root, 'db/migrate_hs_math_p1_0fc3b.sql'),
    'utf8',
  )
  assert(migrate.includes('hs_math_train_item_reviews'), '迁移含审核表')
  assert(!/INSERT\s+INTO\s+hs_math_train_item_reviews/i.test(migrate), '迁移无假审核')
  assert(!/UPDATE\s+hs_math_train_items/i.test(migrate), '迁移不改题目')

  const init = fs.readFileSync(path.join(root, 'db/init.sql'), 'utf8')
  assert(init.includes('hs_math_train_item_reviews'), 'init.sql 含审核表')

  const feApi = fs.readFileSync(
    path.join(root, 'apps/web/src/api/hs-math-admin.ts'),
    'utf8',
  )
  assert(feApi.includes('confirmPublish'), '前端传递 confirmPublish')

  console.log('hs-math P1-0F-C3B unit selftest PASS')
}

main()
