/**
 * APPLICATION-4A：结果/历史 API 映射相关 stub（无网络、无 DB 写）。
 * 运行：pnpm --filter api run hs-math:application4a-selftest
 */
import { toStudentSessionItemView } from './session-item-view'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

let passed = 0
function ok(name: string) {
  passed += 1
  console.log('OK', name)
}

const baseItem = {
  id: '347',
  sortOrder: 1,
  itemId: '151',
  itemCode: 'HSMA-RJA-CH03-APP-0001',
  qtype: 'application' as const,
  stem: 'stem',
  optionsJson: null,
  answerPayloadJson: {
    kind: 'application',
    standardAnswer: 'x=40',
    maxScore: 10,
    rubric: [],
  },
  analysis: null,
  userAnswerPayloadJson: {
    kind: 'application',
    gradingProvider: 'deepseek',
    imageIds: ['52'],
  },
  answeredAt: new Date(),
  contentVersion: 1,
  gradeRuleVersion: '1',
  difficulty: 2,
  primaryKnowledgePointCode: null,
  knowledgePointCodesJson: null,
  gradeResult: 'graded' as const,
  gradeReason: 'ai_graded',
  aiGradeJson: {
    status: 'graded',
    totalScore: 7,
    maxScore: 10,
    rubricScores: [
      { rubricKey: 'model', score: 3, maxScore: 3, feedback: 'ok' },
      { rubricKey: 'domain', score: 2, maxScore: 2, feedback: 'ok' },
      { rubricKey: 'solve', score: 1, maxScore: 3, feedback: 'x=50 wrong' },
      { rubricKey: 'conclusion', score: 1, maxScore: 2, feedback: 'x=50' },
    ],
    recognizedWork: 'y=-30(x-50)^2; x=50',
    personalizedExplanation: '配方错误',
    gradingProvider: 'deepseek',
    pipeline: 'qwen_then_deepseek',
    scoringModel: 'deepseek-chat',
    visionModel: 'qwen3.8-27b-orca-q8',
    recognitionWarnings: [
      {
        pageIndex: 1,
        location: '第一行',
        category: 'auxiliary_text',
        severity: 'minor',
        description: '页眉',
        affectsScoring: false,
      },
    ],
  },
  aiModel: 'deepseek-chat',
  aiGradedAt: new Date('2026-10-26T02:41:03.000Z'),
}

{
  const v = toStudentSessionItemView(baseItem as never, true, [], [], {
    applicationImages: [
      { imageId: '52', mimeType: 'image/png', sortOrder: 0 },
    ],
  })
  const json = JSON.stringify(v)
  assert(!json.includes('storage_key'), '1 no storage_key')
  assert(
    (v as { aiGrade?: { totalScore?: number } }).aiGrade?.totalScore === 7,
    '1 score',
  )
  ok('1 graded reveal no storage_key')
}

{
  const item = {
    ...baseItem,
    gradeResult: 'review_required' as const,
    gradeReason: 'critical_recognition_warning',
    aiGradedAt: null,
    aiGradeJson: {
      status: 'review_required',
      reason: 'critical_recognition_warning',
      recognizedWork: 'partial',
      recognitionWarnings: ['无法辨认'],
      scoringCallCount: 0,
    },
  }
  const v = toStudentSessionItemView(item as never, true)
  const ag = (v as { aiGrade?: { totalScore?: number; status?: string } })
    .aiGrade
  assert(ag?.status === 'review_required', '2 status')
  assert(ag?.totalScore == null, '2 no fake score')
  assert(!JSON.stringify(v).includes('storage_key'), '2 no key')
  ok('2 review_required diagnostic no fake 0')
}

{
  const v = toStudentSessionItemView(baseItem as never, false)
  assert(!(v as { aiGrade?: unknown }).aiGrade, '3 hide')
  ok('3 no reveal hides aiGrade')
}

console.log(`\nAPPLICATION-4A api selftest PASS ${passed}`)
