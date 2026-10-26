/**
 * P0-3 判题 + 脱敏纯逻辑自测（无 DB / 无 FOR UPDATE 集成）。
 * 运行：pnpm --filter api run hs-math:selftest
 */
import { gradeHsMathAnswer } from './hs-math-grade'
import { toStudentSessionItemView } from './session-item-view'
import type { HsMathOptionsJson } from '../types/answer-protocol'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function assertGrade(
  label: string,
  input: Parameters<typeof gradeHsMathAnswer>[0],
  expect: string,
) {
  const g = gradeHsMathAnswer(input)
  assert(g.result === expect, `${label}: got ${g.result} (${g.reason ?? ''})`)
}

const opts: HsMathOptionsJson = {
  options: [
    { id: 'A', text: '甲' },
    { id: 'B', text: '乙' },
    { id: 'C', text: '丙' },
  ],
}

function main() {
  // —— single ——
  assertGrade(
    'single correct',
    {
      qtype: 'single',
      optionsJson: opts,
      standard: { kind: 'single', optionId: 'A' },
      user: { kind: 'single', optionId: 'A' },
    },
    'correct',
  )
  assertGrade(
    'single wrong',
    {
      qtype: 'single',
      optionsJson: opts,
      standard: { kind: 'single', optionId: 'A' },
      user: { kind: 'single', optionId: 'B' },
    },
    'wrong',
  )
  assertGrade(
    'single unanswered',
    {
      qtype: 'single',
      optionsJson: opts,
      standard: { kind: 'single', optionId: 'A' },
      user: null,
    },
    'pending_review',
  )
  assertGrade(
    'single invalid option',
    {
      qtype: 'single',
      optionsJson: opts,
      standard: { kind: 'single', optionId: 'A' },
      user: { kind: 'single', optionId: 'Z' },
    },
    'pending_review',
  )

  // —— multi ——
  assertGrade(
    'multi order-insensitive',
    {
      qtype: 'multi',
      optionsJson: opts,
      standard: { kind: 'multi', optionIds: ['A', 'C'] },
      user: { kind: 'multi', optionIds: ['C', 'A'] },
    },
    'correct',
  )
  assertGrade(
    'multi partial',
    {
      qtype: 'multi',
      optionsJson: opts,
      standard: { kind: 'multi', optionIds: ['A', 'C'] },
      user: { kind: 'multi', optionIds: ['A'] },
    },
    'wrong',
  )
  assertGrade(
    'multi dedupe duplicates then compare',
    {
      qtype: 'multi',
      optionsJson: opts,
      standard: { kind: 'multi', optionIds: ['A', 'C'] },
      user: { kind: 'multi', optionIds: ['A', 'A', 'C'] },
    },
    'correct',
  )
  assertGrade(
    'multi invalid id',
    {
      qtype: 'multi',
      optionsJson: opts,
      standard: { kind: 'multi', optionIds: ['A', 'C'] },
      user: { kind: 'multi', optionIds: ['A', 'X'] },
    },
    'pending_review',
  )
  assertGrade(
    'multi unanswered',
    {
      qtype: 'multi',
      optionsJson: opts,
      standard: { kind: 'multi', optionIds: ['A'] },
      user: { kind: 'multi', optionIds: [] },
    },
    'pending_review',
  )

  // —— judge ——
  assertGrade(
    'judge true',
    {
      qtype: 'judge',
      optionsJson: null,
      standard: { kind: 'judge', value: true },
      user: { kind: 'judge', value: true },
    },
    'correct',
  )
  assertGrade(
    'judge false mismatch',
    {
      qtype: 'judge',
      optionsJson: null,
      standard: { kind: 'judge', value: true },
      user: { kind: 'judge', value: false },
    },
    'wrong',
  )
  assertGrade(
    'judge illegal string type',
    {
      qtype: 'judge',
      optionsJson: null,
      standard: { kind: 'judge', value: true },
      user: { kind: 'judge', value: 'true' as unknown as boolean },
    },
    'pending_review',
  )
  assertGrade(
    'judge unanswered',
    {
      qtype: 'judge',
      optionsJson: null,
      standard: { kind: 'judge', value: false },
      user: null,
    },
    'pending_review',
  )

  // —— numeric ——
  assertGrade(
    'numeric int',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '42' },
      user: { kind: 'numeric', input: '42' },
    },
    'correct',
  )
  assertGrade(
    'numeric decimal',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1.5', toleranceAbs: 0 },
      user: { kind: 'numeric', input: '1.50' },
    },
    'correct',
  )
  assertGrade(
    'numeric negative',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '-3' },
      user: { kind: 'numeric', input: '-3' },
    },
    'correct',
  )
  assertGrade(
    'numeric neg zero',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '0' },
      user: { kind: 'numeric', input: '-0' },
    },
    'correct',
  )
  assertGrade(
    'numeric fraction',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '3/2' },
      user: { kind: 'numeric', input: '1.5' },
    },
    'correct',
  )
  assertGrade(
    'numeric abs tolerance',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1.0', toleranceAbs: 0.05 },
      user: { kind: 'numeric', input: '1.04' },
    },
    'correct',
  )
  assertGrade(
    'numeric abs tolerance fail',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1.0', toleranceAbs: 0.01 },
      user: { kind: 'numeric', input: '1.05' },
    },
    'wrong',
  )
  assertGrade(
    'numeric rel tolerance',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '100', toleranceRel: 0.01 },
      user: { kind: 'numeric', input: '100.5' },
    },
    'correct',
  )
  assertGrade(
    'numeric near zero with abs',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '0', toleranceAbs: 1e-6 },
      user: { kind: 'numeric', input: '0.0000005' },
    },
    'correct',
  )
  assertGrade(
    'numeric boundary exact',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1', toleranceAbs: 0.1 },
      user: { kind: 'numeric', input: '1.1' },
    },
    'correct',
  )
  assertGrade(
    'numeric scientific rejected',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1' },
      user: { kind: 'numeric', input: '1e-3' },
    },
    'pending_review',
  )
  assertGrade(
    'numeric illegal',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1' },
      user: { kind: 'numeric', input: 'abc' },
    },
    'pending_review',
  )
  assertGrade(
    'numeric empty',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1' },
      user: { kind: 'numeric', input: '  ' },
    },
    'pending_review',
  )
  assertGrade(
    'numeric unanswered',
    {
      qtype: 'numeric',
      optionsJson: null,
      standard: { kind: 'numeric', value: '1' },
      user: null,
    },
    'pending_review',
  )

  // —— 脱敏 ——
  const item = {
    id: '1',
    sortOrder: 1,
    itemId: '9',
    itemCode: 't1',
    qtype: 'single' as const,
    stem: '题干',
    optionsJson: opts,
    answerPayloadJson: { kind: 'single' as const, optionId: 'A' },
    analysis: '解析含答案 A',
    userAnswerPayloadJson: { kind: 'single' as const, optionId: 'B' },
    gradeResult: 'wrong' as const,
    gradeReason: 'option_mismatch',
    answeredAt: new Date(),
    contentVersion: 1,
    gradeRuleVersion: 'v1',
    difficulty: 1,
    knowledgePointCodesJson: ['rja.1.1.01'] as string[] | null,
    primaryKnowledgePointCode: 'rja.1.1.01' as string | null,
  }
  const hidden = toStudentSessionItemView(item, false)
  assert(
    !('answerPayloadJson' in hidden),
    'in_progress must hide answerPayloadJson',
  )
  assert(!('analysis' in hidden), 'in_progress must hide analysis')
  assert(!('gradeResult' in hidden), 'in_progress must hide gradeResult')
  assert(!('gradeReason' in hidden), 'in_progress must hide gradeReason')
  assert(
    hidden.userAnswerPayloadJson?.kind === 'single',
    'user answer still visible',
  )

  const shown = toStudentSessionItemView(item, true) as Record<string, unknown>
  assert(
    shown.answerPayloadJson != null &&
      typeof shown.answerPayloadJson === 'object' &&
      (shown.answerPayloadJson as { kind?: string }).kind === 'single',
    'completed reveals standard',
  )
  assert(shown.gradeResult === 'wrong', 'completed reveals grade')

  console.log('hs-math P0-3 selftest PASS')
}

main()
