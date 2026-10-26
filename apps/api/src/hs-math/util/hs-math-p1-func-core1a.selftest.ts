/**
 * P1-FUNC-CORE-1A-1 单元自测（无 DB 写）。
 * 覆盖：来源校验、许可门禁、指纹 V1/V2 兼容、方法关联规则、实质变更。
 */
import * as fs from 'fs'
import * as path from 'path'
import { fingerprintTrainItemContent } from './hs-math-item-content-fingerprint'
import { buildFingerprintMetaBlock } from './hs-math-item-meta-fingerprint'
import {
  assertSourceAllowsFormalPublish,
  assertValidSourceFields,
  collectSourcePublishBlockReasons,
  isDefaultSourceMeta,
  normalizeSourceFields,
} from './hs-math-source.validate'
import { canonicalizeImportItem } from './import-preview-token'
import { assertPrimaryAmongMethodLinks } from './train-item-methods.validate'
import { isSubstantiveTrainItemChange } from './train-item-status'

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

function baseFpInput(extra: Record<string, unknown> = {}) {
  return {
    code: 'CORE1A.T1',
    specialtyCode: 'rja-ch3',
    categoryCode: '3.1',
    qtype: 'judge' as const,
    difficulty: 1,
    stem: '判断题干',
    optionsJson: null,
    answerPayloadJson: { kind: 'judge', value: true },
    analysis: '解析',
    knowledgePointCodes: ['rja.3.1.01'],
    primaryKnowledgePointCode: 'rja.3.1.01',
    ...extra,
  }
}

function main() {
  // 1) 默认来源规范化
  {
    const s = normalizeSourceFields({})
    assert(s.sourceType === 'original', '默认 original')
    assert(s.sourceVerificationStatus === 'unverified', '默认 unverified')
    assert(s.sourceLicenseStatus === 'unknown', '默认 unknown')
    assert(isDefaultSourceMeta(s), '默认元数据判定')
  }

  // 2) adapted 缺字段 → 400
  expectThrow(
    () =>
      assertValidSourceFields(
        { sourceType: 'adapted', sourceVerificationStatus: 'verified' },
        'persist',
      ),
    'adapted 缺 provenance',
  )

  // 3) past_exam 缺年份 → 400
  expectThrow(
    () =>
      assertValidSourceFields(
        {
          sourceType: 'past_exam',
          sourceVerificationStatus: 'verified',
          sourceExamName: '高考',
          sourceQuestionNo: '1',
          sourceReference: '某卷',
        },
        'persist',
      ),
    'past_exam 缺 year',
  )

  // 4) adapted + unknown license 批准 → 拒绝
  {
    const s = assertValidSourceFields(
      {
        sourceType: 'adapted',
        sourceYear: 2024,
        sourceExamName: '模拟卷',
        sourceQuestionNo: '3',
        sourceReference: '校内',
        sourceAdaptationNote: '改数字',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'unknown',
      },
      'persist',
    )
    expectThrow(() => assertSourceAllowsFormalPublish(s), 'adapted+unknown')
  }

  // 5) forbidden 一律拒绝
  expectThrow(
    () =>
      assertSourceAllowsFormalPublish(
        normalizeSourceFields({
          sourceType: 'original',
          sourceLicenseStatus: 'forbidden',
        }),
      ),
    'forbidden',
  )

  // 6) original+unverified+unknown 允许批准
  {
    const s = normalizeSourceFields({})
    assertSourceAllowsFormalPublish(s)
  }

  // 6b) collectSourcePublishBlockReasons：只读复用同一门禁（H2 / review-panel）
  {
    const restrictedMsg =
      'source_license_status=restricted，禁止正式批准到公开学生池'
    const rRestricted = collectSourcePublishBlockReasons({
      sourceType: 'original',
      sourceLicenseStatus: 'restricted',
    })
    assert(
      rRestricted.length === 1 && rRestricted[0] === restrictedMsg,
      'restricted → 明确阻止原因',
    )

    const rVerifiedRestricted = collectSourcePublishBlockReasons({
      sourceType: 'adapted',
      sourceYear: 2024,
      sourceExamName: 'IT-mock',
      sourceQuestionNo: 'IT-1',
      sourceReference: 'IT-only',
      sourceAdaptationNote: 'IT-only',
      sourceVerificationStatus: 'verified',
      sourceLicenseStatus: 'restricted',
    })
    assert(
      rVerifiedRestricted.some((x) => /restricted/.test(x)),
      'verified+restricted 仍不可发布',
    )

    const rUnknownOriginal = collectSourcePublishBlockReasons({
      sourceType: 'original',
      sourceVerificationStatus: 'unverified',
      sourceLicenseStatus: 'unknown',
    })
    assert(rUnknownOriginal.length === 0, 'original+unknown 维持可过许可门禁')

    const rAdaptedUnknown = collectSourcePublishBlockReasons({
      sourceType: 'adapted',
      sourceYear: 2024,
      sourceExamName: 'IT-mock',
      sourceQuestionNo: 'IT-1',
      sourceReference: 'IT-only',
      sourceAdaptationNote: 'IT-only',
      sourceVerificationStatus: 'verified',
      sourceLicenseStatus: 'unknown',
    })
    assert(
      rAdaptedUnknown.some((x) => /permitted/.test(x)),
      'verified+unknown adapted 仍须 permitted',
    )

    const rPermittedAdapted = collectSourcePublishBlockReasons({
      sourceType: 'adapted',
      sourceYear: 2024,
      sourceExamName: 'IT-mock',
      sourceQuestionNo: 'IT-1',
      sourceReference: 'IT-only',
      sourceAdaptationNote: 'IT-only',
      sourceVerificationStatus: 'verified',
      sourceLicenseStatus: 'permitted',
    })
    assert(
      rPermittedAdapted.length === 0,
      'verified+permitted 来源门禁通过（其他门禁另计）',
    )
  }

  // 7) 默认来源+无方法 → 指纹无 meta（V1 兼容）
  {
    const meta = buildFingerprintMetaBlock({ source: {}, methodLinks: [] })
    assert(meta === null, '默认不附 V2 meta')
    const a = fingerprintTrainItemContent(baseFpInput())
    const b = fingerprintTrainItemContent(
      baseFpInput({
        sourceType: 'original',
        sourceVerificationStatus: 'unverified',
        sourceLicenseStatus: 'unknown',
        methodCodes: [],
        primaryMethodCode: '',
      }),
    )
    assert(a === b, '默认 source/methods 与省略等价')
  }

  // 8) 非默认来源 → 指纹变化
  {
    const a = fingerprintTrainItemContent(baseFpInput())
    const b = fingerprintTrainItemContent(
      baseFpInput({
        sourceType: 'past_exam',
        sourceYear: 2023,
        sourceExamName: '全国甲卷',
        sourceQuestionNo: '8',
        sourceReference: '教育部',
        sourceVerificationStatus: 'verified',
        sourceLicenseStatus: 'permitted',
      }),
    )
    assert(a !== b, 'past_exam 改变指纹')
  }

  // 9) 方法关联改变指纹
  {
    const a = fingerprintTrainItemContent(baseFpInput())
    const b = fingerprintTrainItemContent(
      baseFpInput({
        methodCodes: ['defn', 'classification'],
        primaryMethodCode: 'defn',
      }),
    )
    assert(a !== b, 'methods 改变指纹')
  }

  // 10) 方法主关联规则
  {
    const r = assertPrimaryAmongMethodLinks({
      methodIds: ['1', '2'],
      primaryMethodId: '1',
    })
    assert(r.primaryId === '1', 'primary ok')
    expectThrow(
      () =>
        assertPrimaryAmongMethodLinks({
          methodIds: ['1'],
          primaryMethodId: '9',
        }),
      'primary 不在列表',
    )
    expectThrow(
      () =>
        assertPrimaryAmongMethodLinks({
          methodIds: ['1', '1'],
          primaryMethodId: '1',
        }),
      '重复 id',
    )
  }

  // 11) source 变更是实质变更
  assert(
    isSubstantiveTrainItemChange({ sourceType: 'adapted' }),
    'sourceType substantive',
  )
  assert(
    isSubstantiveTrainItemChange({ sourceLicenseStatus: 'permitted' }),
    'license substantive',
  )

  // 12) 导入 canonicalize 缺省不带 meta
  {
    const c = canonicalizeImportItem({
      code: 'X',
      specialtyCode: 'rja-ch3',
      categoryCode: '3.1',
      qtype: 'judge',
      difficulty: 1,
      stem: 't',
      options: null,
      answerPayload: { kind: 'judge', value: true },
      analysis: 'a',
      knowledgePointCodes: ['rja.3.1.01'],
      primaryKnowledgePointCode: 'rja.3.1.01',
    })
    assert(c && !('metaSchema' in c), '导入缺省无 metaSchema')
  }

  // 13) 源码接线检查
  const root = path.join(__dirname, '..')
  const svc = fs.readFileSync(
    path.join(root, 'admin/hs-math-admin-train-items.service.ts'),
    'utf8',
  )
  assert(svc.includes('putContentMeta'), 'content-meta 服务')
  assert(svc.includes('replaceMethods'), 'replaceMethods')
  assert(svc.includes('assertSourceAllowsFormalPublish'), '批准许可门禁')
  const revSvc = fs.readFileSync(
    path.join(__dirname, '../admin/hs-math-admin-train-item-reviews.service.ts'),
    'utf8',
  )
  assert(
    revSvc.includes('collectSourcePublishBlockReasons'),
    'review-panel 复用来源发布门禁',
  )
  assert(svc.includes('pessimistic_write'), '行锁')
  assert(svc.includes('methodLinkPlansEqual'), '2D.1 methods 幂等比较')
  assert(svc.includes('sourceFieldsEqual'), '2D.1 source 幂等比较')

  const ctrl = fs.readFileSync(
    path.join(root, 'admin/hs-math-admin-train-items.controller.ts'),
    'utf8',
  )
  assert(ctrl.includes("':id/methods'"), 'methods 路由')
  assert(ctrl.includes("':id/content-meta'"), 'content-meta 路由')

  const mod = fs.readFileSync(path.join(root, 'hs-math.module.ts'), 'utf8')
  assert(mod.includes('HsMathAdminMethodsController'), 'methods 注册')
  assert(mod.includes('HsMathMethod'), 'HsMathMethod entity')
  assert(mod.includes('HsMathTrainItemMethod'), 'item-method entity')

  console.log('hs-math-p1-func-core1a.selftest: PASS')
}

main()
