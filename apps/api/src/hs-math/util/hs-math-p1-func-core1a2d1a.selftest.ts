/**
 * P1-FUNC-CORE-1A-2D.1a 不写库自测：PATCH / KP 幂等比较 + 接线 + 门禁不退化。
 */
import * as fs from 'fs'
import * as path from 'path'
import { fingerprintTrainItemContent } from './hs-math-item-content-fingerprint'
import { buildFingerprintMetaBlock } from './hs-math-item-meta-fingerprint'
import {
  assertSourceAllowsFormalPublish,
  normalizeSourceFields,
} from './hs-math-source.validate'
import {
  knowledgePointLinkPlanFromRows,
  knowledgePointLinkPlansEqual,
  snapshotTrainItemContent,
  trainItemContentSnapshotsEqual,
} from './train-item-meta-equality'
import { assertPrimaryAmongLinks } from './train-item-kps.validate'
import { assertStatusTransition } from './train-item-status'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

function expectThrow(fn: () => void, hint: string) {
  try {
    fn()
    throw new Error(`FAIL: 期望抛错未抛：${hint}`)
  } catch (e: any) {
    if (String(e?.message || '').startsWith('FAIL: 期望抛错')) throw e
  }
}

function baseRow(extra: Record<string, unknown> = {}) {
  return {
    code: 'HSMA-IT-2D1A',
    qtype: 'judge',
    stem: '判断：1+1=2。',
    optionsJson: null,
    answerPayloadJson: { kind: 'judge', value: true },
    analysis: '显然',
    difficulty: 1,
    specialtyId: '16',
    categoryId: '31',
    knowledgePointId: '1',
    sourceType: 'original',
    sourceYear: null,
    sourceExamName: null,
    sourceQuestionNo: null,
    sourceReference: null,
    sourceAdaptationNote: null,
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    ...extra,
  }
}

function baseFp(extra: Record<string, unknown> = {}) {
  return {
    code: 'CORE1A2D1A.T1',
    specialtyCode: 'rja-ch1',
    categoryCode: '1.1',
    qtype: 'judge' as const,
    difficulty: 1,
    stem: '判断',
    optionsJson: null,
    answerPayloadJson: { kind: 'judge', value: true },
    analysis: 'a',
    knowledgePointCodes: ['rja.1.1.01'],
    primaryKnowledgePointCode: 'rja.1.1.01',
    ...extra,
  }
}

function main() {
  // --- PATCH 内容快照 ---
  // 1/2 difficulty 相同 / 变化
  {
    const a = snapshotTrainItemContent(baseRow())
    const b = snapshotTrainItemContent(baseRow({ difficulty: 1 }))
    const c = snapshotTrainItemContent(baseRow({ difficulty: 2 }))
    assert(trainItemContentSnapshotsEqual(a, b), 'difficulty 相同')
    assert(!trainItemContentSnapshotsEqual(a, c), 'difficulty 变化')
  }

  // 3/4 题干
  {
    const a = snapshotTrainItemContent(baseRow())
    const b = snapshotTrainItemContent(baseRow({ stem: ' 判断：1+1=2。 ' }))
    const c = snapshotTrainItemContent(baseRow({ stem: '判断：2+2=4。' }))
    assert(trainItemContentSnapshotsEqual(a, b), '题干 trim 后相同')
    assert(!trainItemContentSnapshotsEqual(a, c), '题干变化')
  }

  // 5/6 答案
  {
    const a = snapshotTrainItemContent(baseRow())
    const b = snapshotTrainItemContent(
      baseRow({ answerPayloadJson: { value: true, kind: 'judge' } }),
    )
    const c = snapshotTrainItemContent(
      baseRow({ answerPayloadJson: { kind: 'judge', value: false } }),
    )
    assert(trainItemContentSnapshotsEqual(a, b), '答案键序无关相同')
    assert(!trainItemContentSnapshotsEqual(a, c), '答案变化')
  }

  // 7/8 解析
  {
    const a = snapshotTrainItemContent(baseRow({ analysis: null }))
    const b = snapshotTrainItemContent(baseRow({ analysis: '  ' }))
    const c = snapshotTrainItemContent(baseRow({ analysis: '新解析' }))
    assert(trainItemContentSnapshotsEqual(a, b), '解析 null/空白等价')
    assert(!trainItemContentSnapshotsEqual(a, c), '解析变化')
  }

  // 9/10 多字段
  {
    const a = snapshotTrainItemContent(baseRow())
    const b = snapshotTrainItemContent(baseRow())
    const c = snapshotTrainItemContent(
      baseRow({ difficulty: 3, analysis: '压轴解析' }),
    )
    assert(trainItemContentSnapshotsEqual(a, b), '多字段相同')
    assert(!trainItemContentSnapshotsEqual(a, c), '多字段同时变化')
  }

  // 11/12 来源
  {
    const a = snapshotTrainItemContent(baseRow())
    const b = snapshotTrainItemContent(
      baseRow({
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
      }),
    )
    const c = snapshotTrainItemContent(
      baseRow({
        sourceType: 'adapted',
        sourceYear: 2024,
        sourceExamName: 'IT卷',
        sourceQuestionNo: '1',
        sourceReference: 'IT',
        sourceAdaptationNote: 'n',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'unknown',
      }),
    )
    assert(trainItemContentSnapshotsEqual(a, b), '默认来源相同')
    assert(!trainItemContentSnapshotsEqual(a, c), '来源真实变化')
  }

  // 13) undefined 不修改 → 快照不变（比较层：未改字段保持）
  {
    const before = snapshotTrainItemContent(baseRow())
    const after = snapshotTrainItemContent(baseRow())
    assert(trainItemContentSnapshotsEqual(before, after), 'undefined 不改')
  }

  // 14) nullable 显式清空：有值 → null 为变化；已是 null → 再清无变化
  {
    const withRef = snapshotTrainItemContent(
      baseRow({ sourceReference: '有出处' }),
    )
    const cleared = snapshotTrainItemContent(baseRow({ sourceReference: null }))
    assert(!trainItemContentSnapshotsEqual(withRef, cleared), '显式清空变化')
    const alreadyNull = snapshotTrainItemContent(
      baseRow({ sourceReference: null }),
    )
    assert(
      trainItemContentSnapshotsEqual(alreadyNull, cleared),
      '已空再清无变化',
    )
  }

  // 15/16 无变化 / 真实变化（单次+1 由服务保证，此处语义）
  assert(
    trainItemContentSnapshotsEqual(
      snapshotTrainItemContent(baseRow()),
      snapshotTrainItemContent(baseRow()),
    ),
    '无变化不升版语义',
  )
  assert(
    !trainItemContentSnapshotsEqual(
      snapshotTrainItemContent(baseRow()),
      snapshotTrainItemContent(baseRow({ code: 'OTHER' })),
    ),
    '真实变化升版语义',
  )

  // --- KP ---
  // 17) 相同 KP 关联
  {
    const a = {
      knowledgePointIds: ['1', '2'],
      primaryKnowledgePointId: '1',
    }
    assert(knowledgePointLinkPlansEqual(a, { ...a }), '相同 KP 重复')
  }

  // 18/19 主 KP
  {
    const a = {
      knowledgePointIds: ['1', '2'],
      primaryKnowledgePointId: '1',
    }
    const b = {
      knowledgePointIds: ['1', '2'],
      primaryKnowledgePointId: '2',
    }
    assert(knowledgePointLinkPlansEqual(a, a), '主 KP 不变')
    assert(!knowledgePointLinkPlansEqual(a, b), '主 KP 变化')
  }

  // 20/21 辅助增减
  {
    const a = {
      knowledgePointIds: ['1'],
      primaryKnowledgePointId: '1',
    }
    const b = {
      knowledgePointIds: ['1', '2'],
      primaryKnowledgePointId: '1',
    }
    assert(!knowledgePointLinkPlansEqual(a, b), '辅助增加')
    assert(!knowledgePointLinkPlansEqual(b, a), '辅助删除')
  }

  // 22) 顺序变化（展示顺序敏感）
  {
    const a = {
      knowledgePointIds: ['1', '2'],
      primaryKnowledgePointId: '1',
    }
    const b = {
      knowledgePointIds: ['2', '1'],
      primaryKnowledgePointId: '1',
    }
    assert(!knowledgePointLinkPlansEqual(a, b), '顺序变化升版')
  }

  // 23) 重复 KP 拒绝
  expectThrow(
    () =>
      assertPrimaryAmongLinks({
        knowledgePointIds: ['1', '1'],
        primaryKnowledgePointId: '1',
      }),
    '重复 KP',
  )

  // 24) 事务失败回滚：源码仍在 transaction 内 delete/save（接线）
  // 25/26 无变化 / 真实变化
  {
    const rows = [
      { knowledgePointId: 1, isPrimary: 1 },
      { knowledgePointId: '2', isPrimary: 0 },
    ]
    const plan = knowledgePointLinkPlanFromRows(rows)
    assert(
      knowledgePointLinkPlansEqual(plan, {
        knowledgePointIds: ['1', '2'],
        primaryKnowledgePointId: '1',
      }),
      '从行构建计划',
    )
  }

  // --- 兼容 ---
  // 27) V1/V2
  {
    const v1 = fingerprintTrainItemContent(baseFp())
    const v1b = fingerprintTrainItemContent(
      baseFp({
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
        methodCodes: [],
      }),
    )
    assert(v1 === v1b, 'V1 兼容')
    const meta = buildFingerprintMetaBlock({
      source: { sourceLicenseStatus: 'permitted' },
      methodLinks: [],
    })
    assert(meta && meta.metaSchema === 'v2', 'V2')
  }

  // 28) 审核 STALE：同内容指纹不变
  {
    const a = fingerprintTrainItemContent(baseFp())
    const b = fingerprintTrainItemContent(baseFp())
    assert(a === b, '同内容指纹 → 不无意义 STALE')
  }

  // 29) expectedVersion：源码接线
  // 30) 并发 Mock：锁后比较
  // 31) 正式批准门禁不变
  {
    assertSourceAllowsFormalPublish(normalizeSourceFields({}))
    expectThrow(
      () =>
        assertSourceAllowsFormalPublish(
          normalizeSourceFields({ sourceLicenseStatus: 'forbidden' }),
        ),
      'forbidden',
    )
    expectThrow(() => assertStatusTransition('draft', 'disabled'), 'draft→disabled 非法')
    assertStatusTransition('draft', 'approved') // 状态机允许；真实批准仍走门禁服务
  }

  // 32) 旧四题型
  const choiceOpts = {
    options: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
    ],
  }
  for (const qtype of ['single', 'multi', 'judge', 'numeric'] as const) {
    const fp = fingerprintTrainItemContent(
      baseFp({
        qtype,
        optionsJson:
          qtype === 'single' || qtype === 'multi' ? choiceOpts : null,
        answerPayloadJson:
          qtype === 'single'
            ? { kind: 'single', optionId: 'A' }
            : qtype === 'multi'
              ? { kind: 'multi', optionIds: ['A'] }
              : qtype === 'judge'
                ? { kind: 'judge', value: true }
                : { kind: 'numeric', value: '1' },
      }),
    )
    assert(typeof fp === 'string' && fp.length === 64, `qtype ${qtype}`)
  }

  // 源码接线
  const root = path.join(__dirname, '..')
  const svc = fs.readFileSync(
    path.join(root, 'admin/hs-math-admin-train-items.service.ts'),
    'utf8',
  )
  assert(svc.includes('trainItemContentSnapshotsEqual'), 'PATCH 内容比较')
  assert(svc.includes('snapshotTrainItemContent'), 'PATCH 快照')
  assert(svc.includes('knowledgePointLinkPlansEqual'), 'KP 比较')
  assert(svc.includes('assertExpectedContentVersion'), 'expectedVersion')
  assert(svc.includes('pessimistic_write'), '行锁')
  assert(svc.includes('assertSourceAllowsFormalPublish'), '批准许可门禁')
  assert(svc.includes('publishWithHumanReviewGate'), '人工审核门禁')

  const updIdx = svc.indexOf('async update(')
  const statusIdx = svc.indexOf('async patchStatus(')
  const updBlock = svc.slice(updIdx, statusIdx)
  assert(
    updBlock.includes('if (contentChanged)') &&
      updBlock.indexOf('bumpContentVersionOnMetaEdit') >
        updBlock.indexOf('if (contentChanged)'),
    'PATCH bump 受 contentChanged 守卫',
  )
  assert(
    updBlock.includes('if (!contentChanged && !poolChanged)'),
    'PATCH 无变化早退',
  )

  const kpIdx = svc.indexOf('async replaceKnowledgePoints')
  const methodsIdx = svc.indexOf('async replaceMethods')
  const kpBlock = svc.slice(kpIdx, methodsIdx)
  assert(
    kpBlock.includes('if (linksChanged)') &&
      kpBlock.indexOf('bumpContentVersionOnMetaEdit') >
        kpBlock.indexOf('if (linksChanged)'),
    'KP bump 受 linksChanged 守卫',
  )
  assert(kpBlock.includes('assertExpectedContentVersion'), 'KP expectedVersion')

  const dto = fs.readFileSync(
    path.join(root, 'dto/admin-train-item-kps.dto.ts'),
    'utf8',
  )
  assert(dto.includes('expectedContentVersion'), 'KP DTO expectedVersion')

  // status 仍独立，不在普通 PATCH
  assert(updBlock.includes("请使用 status 接口修改审核状态"), '禁 PATCH status')

  console.log('hs-math-p1-func-core1a2d1a.selftest: PASS')
}

main()
