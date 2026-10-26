/**
 * APPLICATION-1：应用题协议 / rubric / pending_ai / 旧题型回归（无 DB）。
 * 运行：pnpm --filter api run hs-math:application1-selftest
 */
import { HS_MATH_QTYPES } from '../hs-math.constants'
import { validateAnswerPayload } from './answer-payload.validate'
import { validateApplicationAnswerFields } from './application-rubric.validate'
import { accuracyRatio } from './accuracy'
import {
  gradeHsMathAnswer,
  hasUserAnswerPayload,
} from './hs-math-grade'
import { parseUserAnswerPayloadForSave } from './user-answer.validate'
import { fingerprintTrainItemContent } from './hs-math-item-content-fingerprint'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

function expectThrow(fn: () => void, msg: string) {
  try {
    fn()
    throw new Error(`expected throw: ${msg}`)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('expected throw')) throw e
  }
}

const goodRubric = [
  { key: 'model', title: '建模', maxScore: 3, criteria: '建模正确' },
  { key: 'calc', title: '计算', maxScore: 2, criteria: '计算正确' },
]

function main() {
  assert(HS_MATH_QTYPES.includes('application'), 'qtype whitelist')

  // —— rubric ——
  const ok = validateApplicationAnswerFields({
    standardAnswer: '参考解答',
    maxScore: 5,
    rubric: goodRubric,
  })
  assert(ok.ok, 'valid rubric')

  assert(
    !validateApplicationAnswerFields({
      standardAnswer: '',
      maxScore: 5,
      rubric: goodRubric,
    }).ok,
    'empty standard',
  )
  assert(
    !validateApplicationAnswerFields({
      standardAnswer: 'x',
      maxScore: 5,
      rubric: [
        { key: 'a', title: 'A', maxScore: 2, criteria: 'c' },
        { key: 'a', title: 'B', maxScore: 3, criteria: 'c' },
      ],
    }).ok,
    'dup key',
  )
  assert(
    !validateApplicationAnswerFields({
      standardAnswer: 'x',
      maxScore: 5,
      rubric: [
        { key: 'a', title: 'A', maxScore: 2, criteria: 'c' },
        { key: 'b', title: 'B', maxScore: 2, criteria: 'c' },
      ],
    }).ok,
    'score mismatch',
  )
  assert(
    !validateApplicationAnswerFields({
      standardAnswer: 'x',
      maxScore: 5.5,
      rubric: goodRubric,
    }).ok,
    'reject float maxScore',
  )

  // —— answer payload ——
  const validated = validateAnswerPayload({
    qtype: 'application',
    optionsJson: null,
    answerPayload: {
      kind: 'application',
      standardAnswer: '  标准  ',
      maxScore: 5,
      rubric: goodRubric,
    },
  })
  assert(validated.answerPayload.kind === 'application', 'kind')
  if (validated.answerPayload.kind === 'application') {
    assert(validated.answerPayload.standardAnswer === '标准', 'trim standard')
  }

  expectThrow(
    () =>
      validateAnswerPayload({
        qtype: 'application',
        optionsJson: { options: [{ id: 'A', text: 'x' }] },
        answerPayload: {
          kind: 'application',
          standardAnswer: 's',
          maxScore: 5,
          rubric: goodRubric,
        },
      }),
    'no options for application',
  )

  // —— user answer ——
  const ua = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: '步骤一\n步骤二',
  })
  assert(ua?.kind === 'application' && ua.text.includes('\n'), 'keep newline')
  expectThrow(
    () =>
      parseUserAnswerPayloadForSave('application', {
        kind: 'application',
        text: '   ',
      }),
    'empty text',
  )
  assert(
    hasUserAnswerPayload({ kind: 'application', text: 'ok' }),
    'has answer',
  )
  assert(
    !hasUserAnswerPayload({ kind: 'application', text: '  ' }),
    'blank not answered',
  )

  // —— grade pending_ai ——
  const std = {
    kind: 'application' as const,
    standardAnswer: '标准',
    maxScore: 5,
    rubric: goodRubric,
  }
  const g1 = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: std,
    user: { kind: 'application', text: '学生解答' },
  })
  assert(g1.result === 'pending_ai', 'pending_ai on submit path')
  assert(g1.result !== 'wrong' && g1.result !== 'correct', 'not fake score')

  const g2 = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: std,
    user: null,
  })
  assert(g2.result === 'pending_ai', 'unanswered still pending_ai not wrong')

  // —— accuracy excludes pending ——
  assert(accuracyRatio(2, 1) === 0.6667, 'old accuracy')
  // pending 不进分母：模拟 session correct=2 wrong=1 pending=1 → ratio 仍 2/3
  assert(accuracyRatio(2, 1) !== null, 'pending not in denom helper')

  // —— old qtypes still correct ——
  const opts = {
    options: [
      { id: 'A', text: 'a' },
      { id: 'B', text: 'b' },
    ],
  }
  assert(
    gradeHsMathAnswer({
      qtype: 'single',
      optionsJson: opts,
      standard: { kind: 'single', optionId: 'A' },
      user: { kind: 'single', optionId: 'A' },
    }).result === 'correct',
    'single ok',
  )
  assert(
    gradeHsMathAnswer({
      qtype: 'judge',
      optionsJson: null,
      standard: { kind: 'judge', value: true },
      user: { kind: 'judge', value: false },
    }).result === 'wrong',
    'judge wrong',
  )

  // —— fingerprint includes rubric change ——
  const base = {
    code: 'HSMA-APP-TEST-0001',
    specialtyCode: 'rja-ch3',
    categoryCode: '3.2',
    qtype: 'application',
    difficulty: 1,
    stem: '应用题干',
    optionsJson: null,
    answerPayloadJson: {
      kind: 'application',
      standardAnswer: '标准',
      maxScore: 5,
      rubric: goodRubric,
    },
    analysis: '解析不能为空',
    knowledgePointCodes: ['rja.3.2.09'],
    primaryKnowledgePointCode: 'rja.3.2.09',
  }
  const fp1 = fingerprintTrainItemContent(base)
  const fp2 = fingerprintTrainItemContent({
    ...base,
    answerPayloadJson: {
      kind: 'application',
      standardAnswer: '标准',
      maxScore: 5,
      rubric: [
        { key: 'model', title: '建模', maxScore: 4, criteria: '建模正确' },
        { key: 'calc', title: '计算', maxScore: 1, criteria: '计算正确' },
      ],
    },
  })
  assert(fp1 !== fp2, 'rubric change alters fingerprint (STALE)')

  console.log('hs-math APPLICATION-1 selftest PASS')
}

main()
