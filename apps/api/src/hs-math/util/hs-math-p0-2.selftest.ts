/**
 * P0-2 纯逻辑自测（无 DB）。
 * 运行：pnpm --filter api exec ts-node --transpile-only src/hs-math/util/hs-math-p0-2.selftest.ts
 */
import { BadRequestException } from '@nestjs/common'
import {
  assertValidNumericValueString,
  validateAnswerPayload,
} from './answer-payload.validate'
import {
  assertStatusTransition,
  isSubstantiveTrainItemChange,
  isTrainCandidate,
} from './train-item-status'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function expectThrow(fn: () => void, msgContains?: string) {
  try {
    fn()
    throw new Error(`expected throw: ${msgContains ?? ''}`)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('expected throw')) throw e
    const text =
      e instanceof BadRequestException
        ? JSON.stringify(e.getResponse())
        : e instanceof Error
          ? e.message
          : String(e)
    if (msgContains && !text.includes(msgContains)) {
      throw new Error(`throw message mismatch: got ${text}`)
    }
  }
}

const options = {
  options: [
    { id: 'A', text: '甲' },
    { id: 'B', text: '乙' },
    { id: 'C', text: '丙' },
  ],
}

function main() {
  // single：合法
  validateAnswerPayload({
    qtype: 'single',
    optionsJson: options,
    answerPayload: { kind: 'single', optionId: 'A' },
  })

  // 6. single 答案必须匹配选项
  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'single',
        optionsJson: options,
        answerPayload: { kind: 'single', optionId: 'Z' },
      }),
    '不在选项',
  )

  // 7. multi 不得重复
  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'multi',
        optionsJson: options,
        answerPayload: { kind: 'multi', optionIds: ['A', 'A'] },
      }),
    '重复',
  )
  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'multi',
        optionsJson: options,
        answerPayload: { kind: 'multi', optionIds: ['A', 'X'] },
      }),
    '不存在',
  )
  validateAnswerPayload({
    qtype: 'multi',
    optionsJson: options,
    answerPayload: { kind: 'multi', optionIds: ['C', 'A'] },
  })

  // 8. judge 必须 boolean
  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'judge',
        optionsJson: null,
        answerPayload: { kind: 'judge', value: 'true' as unknown as boolean },
      }),
    'boolean',
  )
  validateAnswerPayload({
    qtype: 'judge',
    optionsJson: null,
    answerPayload: { kind: 'judge', value: false },
  })

  // 9. numeric 非法容差 / 科学计数法（07：P0 不支持）
  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'numeric',
        optionsJson: null,
        answerPayload: {
          kind: 'numeric',
          value: '1.5',
          toleranceAbs: -0.01,
        },
      }),
    '不能为负数',
  )
  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'numeric',
        optionsJson: null,
        answerPayload: {
          kind: 'numeric',
          value: '1.5',
          toleranceAbs: Number.NaN,
        },
      }),
    '有限数字',
  )
  expectThrow(
    () => assertValidNumericValueString('1e-3'),
    '科学计数法',
  )
  expectThrow(
    () => assertValidNumericValueString('Infinity'),
    '非法',
  )
  validateAnswerPayload({
    qtype: 'numeric',
    optionsJson: null,
    answerPayload: {
      kind: 'numeric',
      value: '-0',
      toleranceAbs: 0,
      toleranceRel: 0.01,
    },
  })
  validateAnswerPayload({
    qtype: 'numeric',
    optionsJson: null,
    answerPayload: { kind: 'numeric', value: '3/2' },
  })

  // 状态机
  assertStatusTransition('draft', 'approved')
  assertStatusTransition('approved', 'disabled')
  assertStatusTransition('disabled', 'draft')
  expectThrow(() => assertStatusTransition('draft', 'disabled'), '不允许')
  expectThrow(() => assertStatusTransition('approved', 'draft'), '不允许')
  expectThrow(() => assertStatusTransition('approved', 'approved'), '已是')

  // 14. disabled 不能作训练候选
  assert(!isTrainCandidate('disabled', false), 'disabled not candidate')
  assert(!isTrainCandidate('draft', true), 'draft not candidate')
  assert(isTrainCandidate('approved', true), 'approved candidate')
  assert(!isTrainCandidate('approved', false), 'inactive not candidate')

  // 13. 实质性变更
  assert(
    isSubstantiveTrainItemChange({ stem: 'x' }),
    'stem substantive',
  )
  assert(
    !isSubstantiveTrainItemChange({}),
    'empty not substantive',
  )

  // kind 与 qtype 不一致
  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'single',
        optionsJson: options,
        answerPayload: { kind: 'judge', value: true },
      }),
    '一致',
  )

  console.log('hs-math P0-2 selftest PASS')
}

main()
