/**
 * APPLICATION-2C：作答协议扩展（无 DB）。
 * 运行：pnpm --filter api run hs-math:application2c-selftest
 */
import { BadRequestException } from '@nestjs/common'
import {
  gradeHsMathAnswer,
  hasUserAnswerPayload,
} from './hs-math-grade'
import {
  isImageIdReferencedInUserAnswer,
  verifyApplicationImagesForAnswer,
} from './hs-math-application-image-policy'
import {
  normalizeImageIds,
  parseUserAnswerPayloadForSave,
} from './user-answer.validate'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

function expectThrow(fn: () => void, _hint: string) {
  try {
    fn()
    throw new Error(`expected throw: ${_hint}`)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('expected throw')) throw e
    if (!(e instanceof BadRequestException)) {
      // Conflict etc. also ok for some cases — 本文件以 BadRequest 为主
      if (e instanceof Error && e.message.startsWith('expected throw')) throw e
    }
  }
}

const std = {
  kind: 'application' as const,
  standardAnswer: '标准',
  maxScore: 5,
  rubric: [
    { key: 'a', title: 'A', maxScore: 3, criteria: 'c' },
    { key: 'b', title: 'B', maxScore: 2, criteria: 'c' },
  ],
}

function main() {
  // 1 纯文字
  const t1 = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: '纯文字解答',
  })
  assert(t1?.kind === 'application' && t1.text === '纯文字解答', 'text only')
  assert(!('imageIds' in (t1 || {})), 'no imageIds key')

  // 2 纯图片
  const t2 = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    imageIds: [1, 2],
  })
  assert(
    t2?.kind === 'application' &&
      JSON.stringify(t2.imageIds) === JSON.stringify(['1', '2']),
    'image only',
  )
  assert(t2 && !t2.text, 'no text on image only')

  // 3 混合
  const t3 = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: '步骤',
    imageIds: ['3'],
  })
  assert(t3?.text === '步骤' && t3.imageIds?.[0] === '3', 'mixed')

  // 4 空答案
  expectThrow(
    () =>
      parseUserAnswerPayloadForSave('application', {
        kind: 'application',
        text: '  ',
      }),
    'empty text',
  )
  expectThrow(
    () =>
      parseUserAnswerPayloadForSave('application', {
        kind: 'application',
        imageIds: [],
      }),
    'empty images',
  )
  expectThrow(
    () =>
      parseUserAnswerPayloadForSave('application', {
        kind: 'application',
      }),
    'neither',
  )

  // 5 重复
  expectThrow(
    () => normalizeImageIds([1, 1]),
    'dup',
  )

  // 6 超过 5
  expectThrow(
    () => normalizeImageIds([1, 2, 3, 4, 5, 6]),
    'too many',
  )

  // 7 非整数
  expectThrow(() => normalizeImageIds([1.5]), 'float')
  expectThrow(() => normalizeImageIds(['0']), 'zero')
  expectThrow(() => normalizeImageIds(['abc']), 'str')
  expectThrow(() => normalizeImageIds([-1]), 'neg')

  // 8 跨用户
  const crossUser = verifyApplicationImagesForAnswer({
    jwtUserId: '2',
    sessionItemId: '10',
    imageIds: ['1'],
    images: [
      { id: '1', userId: '9', sessionItemId: '10', status: 'draft' },
    ],
  })
  assert(!crossUser.ok && crossUser.code === 'IMAGE_CROSS_USER', 'cross user')

  // 9 跨题 / 跨会话（同 item 校验）
  const crossItem = verifyApplicationImagesForAnswer({
    jwtUserId: '2',
    sessionItemId: '10',
    imageIds: ['1'],
    images: [
      { id: '1', userId: '2', sessionItemId: '99', status: 'draft' },
    ],
  })
  assert(!crossItem.ok && crossItem.code === 'IMAGE_CROSS_ITEM', 'cross item')

  const missing = verifyApplicationImagesForAnswer({
    jwtUserId: '2',
    sessionItemId: '10',
    imageIds: ['1', '2'],
    images: [
      { id: '1', userId: '2', sessionItemId: '10', status: 'draft' },
    ],
  })
  assert(!missing.ok && missing.code === 'IMAGE_NOT_FOUND', 'missing image')

  const notDraft = verifyApplicationImagesForAnswer({
    jwtUserId: '2',
    sessionItemId: '10',
    imageIds: ['1'],
    images: [
      { id: '1', userId: '2', sessionItemId: '10', status: 'submitted' },
    ],
  })
  assert(!notDraft.ok && notDraft.code === 'IMAGE_NOT_DRAFT', 'not draft')

  const okBind = verifyApplicationImagesForAnswer({
    jwtUserId: '2',
    sessionItemId: '10',
    imageIds: ['1', '2'],
    images: [
      { id: '1', userId: '2', sessionItemId: '10', status: 'draft' },
      { id: '2', userId: '2', sessionItemId: '10', status: 'draft' },
    ],
  })
  assert(okBind.ok, 'bind ok')

  // 10 非 application 拒绝 imageIds
  expectThrow(
    () =>
      parseUserAnswerPayloadForSave('single', {
        kind: 'single',
        optionId: 'A',
        imageIds: [1],
      } as unknown as Record<string, unknown>),
    'single+images',
  )
  // kind 不一致也会先炸；显式测 numeric
  expectThrow(
    () =>
      parseUserAnswerPayloadForSave('numeric', {
        kind: 'numeric',
        input: '1',
        imageIds: [1],
      } as unknown as Record<string, unknown>),
    'numeric+images',
  )

  // 11 已完成会话：由 Service ConflictException；策略层用引用删除保护
  assert(
    isImageIdReferencedInUserAnswer(
      { kind: 'application', imageIds: ['5'] },
      '5',
    ),
    'ref hit',
  )
  assert(
    !isImageIdReferencedInUserAnswer(
      { kind: 'application', text: 'x' },
      '5',
    ),
    'ref miss',
  )

  // 12 pending_ai
  const gText = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: std,
    user: { kind: 'application', text: '答' },
  })
  assert(gText.result === 'pending_ai', 'pending text')
  const gImg = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: std,
    user: { kind: 'application', imageIds: ['1'] },
  })
  assert(gImg.result === 'pending_ai', 'pending images')
  assert(gImg.result !== 'wrong' && gImg.result !== 'correct', 'no fake')

  // 13 旧文字兼容
  assert(
    hasUserAnswerPayload({ kind: 'application', text: '旧答案' }),
    'legacy has',
  )
  const legacy = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: '旧\n行',
  })
  assert(legacy?.kind === 'application' && legacy.text?.includes('\n'), 'legacy parse')

  // 14 旧四题型
  assert(
    parseUserAnswerPayloadForSave('single', {
      kind: 'single',
      optionId: 'A',
    })?.kind === 'single',
    'single ok',
  )
  assert(
    parseUserAnswerPayloadForSave('multi', {
      kind: 'multi',
      optionIds: ['A', 'B'],
    })?.kind === 'multi',
    'multi ok',
  )
  assert(
    parseUserAnswerPayloadForSave('judge', {
      kind: 'judge',
      value: true,
    })?.kind === 'judge',
    'judge ok',
  )
  assert(
    parseUserAnswerPayloadForSave('numeric', {
      kind: 'numeric',
      input: '1/2',
    })?.kind === 'numeric',
    'numeric ok',
  )
  const gSingle = gradeHsMathAnswer({
    qtype: 'single',
    optionsJson: { options: [{ id: 'A', text: 'a' }] },
    standard: { kind: 'single', optionId: 'A' },
    user: { kind: 'single', optionId: 'A' },
  })
  assert(gSingle.result === 'correct', 'single still grades')

  // 未知字段
  expectThrow(
    () =>
      parseUserAnswerPayloadForSave('application', {
        kind: 'application',
        text: 'x',
        foo: 1,
      } as unknown as Record<string, unknown>),
    'unknown field',
  )

  console.log('hs-math APPLICATION-2C selftest PASS')
}

main()
