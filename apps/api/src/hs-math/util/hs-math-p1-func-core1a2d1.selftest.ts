/**
 * P1-FUNC-CORE-1A-2D.1 不写库自测：methods / content-meta 幂等比较 + 接线。
 */
import * as fs from 'fs'
import * as path from 'path'
import { fingerprintTrainItemContent } from './hs-math-item-content-fingerprint'
import { buildFingerprintMetaBlock } from './hs-math-item-meta-fingerprint'
import {
  assertValidSourceFields,
  normalizeSourceFields,
} from './hs-math-source.validate'
import {
  methodLinkPlanFromRows,
  methodLinkPlansEqual,
  sourceFieldsEqual,
  sourceInputEqualsPersisted,
} from './train-item-meta-equality'
import { assertPrimaryAmongMethodLinks } from './train-item-methods.validate'

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

function baseFp(extra: Record<string, unknown> = {}) {
  return {
    code: 'CORE1A2D1.T1',
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
  // 1) 空方法关联重复
  {
    const a = { methodIds: [], primaryMethodId: null }
    const b = { methodIds: [], primaryMethodId: null }
    assert(methodLinkPlansEqual(a, b), '空方法相等')
  }

  // 2) 一个主方法重复
  {
    const a = { methodIds: ['10'], primaryMethodId: '10' }
    const b = { methodIds: ['10'], primaryMethodId: '10' }
    assert(methodLinkPlansEqual(a, b), '单主方法相等')
  }

  // 3) 主辅方法重复
  {
    const a = { methodIds: ['1', '2'], primaryMethodId: '1' }
    const b = { methodIds: ['1', '2'], primaryMethodId: '1' }
    assert(methodLinkPlansEqual(a, b), '主辅相等')
  }

  // 4) 方法顺序变化 → 不等（顺序敏感）
  {
    const a = { methodIds: ['1', '2'], primaryMethodId: '1' }
    const b = { methodIds: ['2', '1'], primaryMethodId: '1' }
    assert(!methodLinkPlansEqual(a, b), '顺序变化不等')
  }

  // 5) 主方法变化
  {
    const a = { methodIds: ['1', '2'], primaryMethodId: '1' }
    const b = { methodIds: ['1', '2'], primaryMethodId: '2' }
    assert(!methodLinkPlansEqual(a, b), '主方法变化不等')
  }

  // 6) 删除方法关联
  {
    const a = { methodIds: ['1'], primaryMethodId: '1' }
    const b = { methodIds: [], primaryMethodId: null }
    assert(!methodLinkPlansEqual(a, b), '删除关联不等')
  }

  // 7) 禁用方法拒绝（纯函数规则仍拒绝重复 id；禁用在服务层，接线检查）
  expectThrow(
    () =>
      assertPrimaryAmongMethodLinks({
        methodIds: ['1', '1'],
        primaryMethodId: '1',
      }),
    '重复 methodIds',
  )

  // 8) 默认来源重复
  {
    const a = normalizeSourceFields({})
    const b = normalizeSourceFields({
      sourceType: 'original',
      sourceVerificationStatus: 'unverified',
      sourceLicenseStatus: 'unknown',
    })
    assert(sourceFieldsEqual(a, b), '默认来源相等')
  }

  // 9) NULL / undefined 规范化
  {
    const a = normalizeSourceFields({
      sourceYear: null,
      sourceExamName: null,
      sourceQuestionNo: undefined,
    })
    const b = normalizeSourceFields({})
    assert(sourceFieldsEqual(a, b), 'null/undefined 与缺省等价')
  }

  // 10) 显式清空可选字段：空串 → null，与已是 null 相等
  {
    const persisted = normalizeSourceFields({
      sourceType: 'original',
      sourceExamName: null,
    })
    const afterClear = assertValidSourceFields(
      {
        sourceType: 'original',
        sourceExamName: '   ',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
      },
      'persist',
    )
    assert(
      sourceFieldsEqual(persisted, afterClear),
      '空白 examName 清空后与 null 相等',
    )
  }

  // 11) source_type 变化
  {
    const a = normalizeSourceFields({})
    const b = assertValidSourceFields(
      {
        sourceType: 'adapted',
        sourceYear: 2024,
        sourceExamName: 'IT卷',
        sourceQuestionNo: '1',
        sourceReference: 'IT',
        sourceAdaptationNote: 'note',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'unknown',
      },
      'persist',
    )
    assert(!sourceFieldsEqual(a, b), 'sourceType 变化不等')
  }

  // 12) 只有来源变化（方法不变）
  {
    assert(
      methodLinkPlansEqual(
        { methodIds: ['1'], primaryMethodId: '1' },
        { methodIds: ['1'], primaryMethodId: '1' },
      ),
      '方法不变',
    )
    assert(
      !sourceFieldsEqual(
        normalizeSourceFields({}),
        normalizeSourceFields({ sourceLicenseStatus: 'permitted' }),
      ),
      '仅来源变',
    )
  }

  // 13) 只有方法变化
  {
    assert(
      !methodLinkPlansEqual(
        { methodIds: ['1'], primaryMethodId: '1' },
        { methodIds: ['1', '2'], primaryMethodId: '1' },
      ),
      '仅方法变',
    )
  }

  // 14) 来源与方法同时变化 → 两边都不等（服务层仍只 +1）
  {
    assert(
      !sourceFieldsEqual(
        normalizeSourceFields({}),
        normalizeSourceFields({ sourceLicenseStatus: 'restricted' }),
      ),
      '双变-来源',
    )
    assert(
      !methodLinkPlansEqual(
        { methodIds: [], primaryMethodId: null },
        { methodIds: ['9'], primaryMethodId: '9' },
      ),
      '双变-方法',
    )
  }

  // 15) 完全相同 content-meta 语义
  {
    const src = assertValidSourceFields(
      {
        sourceType: 'past_exam',
        sourceYear: 2022,
        sourceExamName: 'IT模拟',
        sourceQuestionNo: '8',
        sourceReference: 'IT',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'permitted',
      },
      'persist',
    )
    assert(
      sourceInputEqualsPersisted(
        {
          sourceType: 'past_exam',
          sourceYear: 2022,
          sourceExamName: 'IT模拟',
          sourceQuestionNo: '8',
          sourceReference: 'IT',
          sourceVerificationStatus: 'verified',
          sourceLicenseStatus: 'permitted',
        },
        src,
      ),
      '相同 content-meta 来源',
    )
    assert(
      methodLinkPlansEqual(
        { methodIds: ['3', '4'], primaryMethodId: '3' },
        { methodIds: ['3', '4'], primaryMethodId: '3' },
      ),
      '相同 content-meta 方法',
    )
  }

  // 16/17) 真正变化 / 无变化（比较函数层面）
  assert(
    !methodLinkPlansEqual(
      { methodIds: ['1'], primaryMethodId: '1' },
      { methodIds: ['2'], primaryMethodId: '2' },
    ),
    '真正变化',
  )
  assert(
    methodLinkPlansEqual(
      { methodIds: ['1'], primaryMethodId: '1' },
      { methodIds: ['1'], primaryMethodId: '1' },
    ),
    '无变化',
  )

  // 18) 从 DB 行构建计划（is_primary 0/1）
  {
    const plan = methodLinkPlanFromRows([
      { methodId: 5, isPrimary: 1 },
      { methodId: '6', isPrimary: 0 },
    ])
    assert(plan.methodIds[0] === '5' && plan.methodIds[1] === '6', 'rows ids')
    assert(plan.primaryMethodId === '5', 'rows primary')
  }

  // 19) expectedVersion：服务内 assertExpectedContentVersion 接线（源码）
  // 20) V1/V2 指纹兼容
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
      source: { sourceType: 'original' },
      methodLinks: [{ code: 'defn', isPrimary: true }],
    })
    assert(meta && meta.metaSchema === 'v2', 'V2 meta')
  }

  // 21) 审核 STALE 规则：version 不变则指纹不变时不 STALE（指纹层）
  {
    const a = fingerprintTrainItemContent(
      baseFp({ methodCodes: ['defn'], primaryMethodCode: 'defn' }),
    )
    const b = fingerprintTrainItemContent(
      baseFp({ methodCodes: ['defn'], primaryMethodCode: 'defn' }),
    )
    assert(a === b, '同内容指纹不变 → 不因幂等误 STALE')
  }

  // 22) 旧题导入兼容：默认来源规范化
  assert(
    normalizeSourceFields({}).sourceType === 'original',
    '旧题默认 original',
  )

  // 23) 旧四题型指纹仍可算
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
    assert(typeof fp === 'string' && fp.length === 64, `qtype ${qtype} fp`)
  }

  // 24) 并发逻辑：锁后比较（源码必须含锁后 load + equal）
  const root = path.join(__dirname, '..')
  const svc = fs.readFileSync(
    path.join(root, 'admin/hs-math-admin-train-items.service.ts'),
    'utf8',
  )
  assert(svc.includes('methodLinkPlansEqual'), 'methods 相等比较')
  assert(svc.includes('sourceFieldsEqual'), 'source 相等比较')
  assert(svc.includes('loadItemMethodLinkPlan'), '锁后读关联')
  assert(svc.includes('pessimistic_write'), '行锁保留')
  assert(svc.includes('assertExpectedContentVersion'), 'expectedVersion 保留')
  // 无变化分支：bump 仅在 changed 时
  assert(
    svc.includes('if (methodsChanged)') &&
      svc.includes('if (sourceChanged || methodsChanged)'),
    '仅变化时 bump',
  )
  // 不得在比较前无条件 bump（粗检：replaceMethods 内 bump 在 methodsChanged 块）
  const replaceIdx = svc.indexOf('async replaceMethods')
  const contentIdx = svc.indexOf('async putContentMeta')
  const replaceBlock = svc.slice(replaceIdx, contentIdx)
  assert(
    replaceBlock.includes('if (methodsChanged)') &&
      replaceBlock.indexOf('bumpContentVersionOnMetaEdit') >
        replaceBlock.indexOf('if (methodsChanged)'),
    'replaceMethods bump 受 methodsChanged 守卫',
  )

  console.log('hs-math-p1-func-core1a2d1.selftest: PASS')
}

main()
