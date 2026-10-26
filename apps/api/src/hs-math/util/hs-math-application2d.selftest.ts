/**
 * APPLICATION-2D：submit 图片锁定 / 历史快照 / 孤儿分类（无 DB）。
 * 运行：pnpm --filter api run hs-math:application2d-selftest
 */
import {
  applyDraftToSubmittedTransition,
  assertHistoryImagesSafe,
  canDeleteApplicationImage,
  classifyApplicationImageOrphan,
  extractApplicationImageIds,
  isImageIdReferencedInUserAnswer,
  planSubmitImageLocks,
  publicViewHasNoSecrets,
  toSubmittedHistoryImages,
  verifyApplicationImagesForAnswer,
} from './hs-math-application-image-policy'
import {
  gradeHsMathAnswer,
  hasUserAnswerPayload,
} from './hs-math-grade'
import { toStudentSessionItemView } from './session-item-view'
import { parseUserAnswerPayloadForSave } from './user-answer.validate'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
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
  const now = new Date('2026-10-25T06:00:00.000Z')

  // 1 纯图片提交锁定
  const pureImg = { kind: 'application' as const, imageIds: ['10', '20'] }
  const ids1 = extractApplicationImageIds(pureImg)
  assert(ids1.join(',') === '10,20', 'extract pure img')
  const plan1 = planSubmitImageLocks({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: ids1,
    images: [
      { id: '10', userId: 'u1', sessionItemId: 'si1', status: 'draft' },
      { id: '20', userId: 'u1', sessionItemId: 'si1', status: 'draft' },
    ],
  })
  assert(plan1.ok && plan1.lockIds.join(',') === '10,20', 'plan pure')
  const tr1 = applyDraftToSubmittedTransition(
    [
      { id: '10', status: 'draft' },
      { id: '20', status: 'draft' },
    ],
    plan1.ok ? plan1.lockIds : [],
    now,
  )
  assert(tr1.ok && tr1.updates.length === 2, 'transition pure')
  assert(
    tr1.ok &&
      tr1.updates.every(
        (u) => u.status === 'submitted' && u.submittedAt === now,
      ),
    'draft→submitted',
  )

  // 2 文图混合
  const mixed = parseUserAnswerPayloadForSave('application', {
    kind: 'application',
    text: '步骤说明',
    imageIds: [30],
  })
  assert(mixed?.text === '步骤说明' && mixed.imageIds?.[0] === '30', 'mixed parse')
  const plan2 = planSubmitImageLocks({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: extractApplicationImageIds(mixed),
    images: [
      { id: '30', userId: 'u1', sessionItemId: 'si1', status: 'draft' },
    ],
  })
  assert(plan2.ok && plan2.lockIds[0] === '30', 'plan mixed')

  // 3 多图一致性：缺一张则整批失败
  const planPartial = planSubmitImageLocks({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: ['1', '2'],
    images: [
      { id: '1', userId: 'u1', sessionItemId: 'si1', status: 'draft' },
    ],
  })
  assert(!planPartial.ok && planPartial.code === 'IMAGE_NOT_FOUND', 'multi fail')

  // 4 跨用户
  const planCross = planSubmitImageLocks({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: ['9'],
    images: [
      { id: '9', userId: 'u2', sessionItemId: 'si1', status: 'draft' },
    ],
  })
  assert(!planCross.ok && planCross.code === 'IMAGE_CROSS_USER', 'cross user')

  // 5 已 submitted 不可再作为首次锁定目标
  const planSub = planSubmitImageLocks({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: ['5'],
    images: [
      { id: '5', userId: 'u1', sessionItemId: 'si1', status: 'submitted' },
    ],
  })
  assert(!planSub.ok && planSub.code === 'IMAGE_NOT_DRAFT', 'no re-lock submitted')

  // 6 重复 submit 幂等语义：completed 早退不改图；transition 对已 submitted 失败=不应二次调用
  const trIdem = applyDraftToSubmittedTransition(
    [{ id: '10', status: 'submitted' }],
    ['10'],
    now,
  )
  assert(!trIdem.ok, 'idempotent path must not re-apply transition')

  // 7 提交与删除冲突：submitted 不可删；答案引用 draft 不可删
  const delSub = canDeleteApplicationImage({
    sessionStatus: 'in_progress',
    imageStatus: 'submitted',
  })
  assert(!delSub.ok && delSub.code === 'NOT_DRAFT', 'delete vs submit')
  assert(
    isImageIdReferencedInUserAnswer(pureImg, '10'),
    'referenced blocks delete at service layer',
  )

  // 8 提交与保存冲突：save 只允许 draft（verify）
  const saveGate = verifyApplicationImagesForAnswer({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: ['10'],
    images: [
      { id: '10', userId: 'u1', sessionItemId: 'si1', status: 'submitted' },
    ],
  })
  assert(!saveGate.ok && saveGate.code === 'IMAGE_NOT_DRAFT', 'save vs submitted')

  // 9 历史只返回已提交引用图（忽略未引用 draft）
  const hist = toSubmittedHistoryImages(
    { kind: 'application', text: 'x', imageIds: ['10', '20'] },
    [
      {
        id: '10',
        mimeType: 'image/jpeg',
        sortOrder: 1,
        status: 'submitted',
        storageKey: 'SECRET/key',
      },
      {
        id: '20',
        mimeType: 'image/png',
        sortOrder: 2,
        status: 'submitted',
      },
      {
        id: '99',
        mimeType: 'image/jpeg',
        sortOrder: 3,
        status: 'draft',
        storageKey: 'orphan',
      },
    ],
  )
  assert(hist.length === 2, 'history only referenced submitted')
  assert(hist[0].imageId === '10' && hist[1].imageId === '20', 'order by payload')
  assert(
    assertHistoryImagesSafe(hist as unknown as Array<Record<string, unknown>>),
    'no secrets in history images',
  )
  assert(
    hist.every((h) => publicViewHasNoSecrets(h as unknown as Record<string, unknown>)),
    'publicViewHasNoSecrets',
  )
  assert(!('storageKey' in hist[0]), 'no storageKey key')

  // 10 视图：reveal + application 附带 images；非 reveal 无
  const itemBase = {
    id: '100',
    sortOrder: 1,
    itemId: '1',
    itemCode: 'X',
    qtype: 'application' as const,
    stem: 's',
    optionsJson: null,
    userAnswerPayloadJson: {
      kind: 'application',
      text: '旧文字',
      imageIds: ['10'],
    },
    answeredAt: now,
    contentVersion: 1,
    gradeRuleVersion: 'v1',
    difficulty: 'medium' as const,
    answerPayloadJson: std,
    analysis: 'a',
    gradeResult: 'pending_ai' as const,
    gradeReason: 'awaiting_ai',
    knowledgePointCodesJson: ['KP'],
    primaryKnowledgePointCode: 'KP',
  }
  const hidden = toStudentSessionItemView(itemBase, false, [], [], {
    applicationImages: hist.slice(0, 1),
  })
  assert(!('images' in hidden), 'in_progress no history images')
  const shown = toStudentSessionItemView(itemBase, true, [], [], {
    applicationImages: hist.slice(0, 1),
  }) as Record<string, unknown>
  assert(Array.isArray(shown.images) && (shown.images as unknown[]).length === 1, 'reveal images')
  assert(
    (shown.userAnswerPayloadJson as { text?: string }).text === '旧文字',
    'text preserved',
  )

  // 11 pending_ai：纯图 / 混合
  const gImg = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: std,
    user: pureImg,
  })
  assert(gImg.result === 'pending_ai', 'pending pure img')
  const gMix = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: std,
    user: mixed,
  })
  assert(gMix.result === 'pending_ai', 'pending mixed')
  assert(hasUserAnswerPayload(pureImg), 'answered pure img')

  // 12 旧纯文字兼容
  const oldText = { kind: 'application' as const, text: '仅文字' }
  assert(extractApplicationImageIds(oldText).length === 0, 'old text no ids')
  const planText = planSubmitImageLocks({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: [],
    images: [],
  })
  assert(planText.ok && planText.lockIds.length === 0, 'text-only no locks')
  const histText = toSubmittedHistoryImages(oldText, [
    { id: '1', mimeType: 'image/jpeg', sortOrder: 1, status: 'draft' },
  ])
  assert(histText.length === 0, 'text-only history empty')
  const gOld = gradeHsMathAnswer({
    qtype: 'application',
    optionsJson: null,
    standard: std,
    user: oldText,
  })
  assert(gOld.result === 'pending_ai', 'old text pending_ai')

  // 13 旧四题型不受影响
  const gSingle = gradeHsMathAnswer({
    qtype: 'single',
    optionsJson: {
      options: [
        { id: 'A', text: 'a' },
        { id: 'B', text: 'b' },
      ],
    },
    standard: { kind: 'single', optionId: 'A' },
    user: { kind: 'single', optionId: 'A' },
  })
  assert(gSingle.result === 'correct', 'single unchanged')

  // 14 孤儿分类（不删除）
  assert(
    classifyApplicationImageOrphan({
      imageStatus: 'draft',
      referencedInAnswer: false,
      sessionStatus: 'completed',
    }) === 'unreferenced_draft',
    'orphan unreferenced',
  )
  assert(
    classifyApplicationImageOrphan({
      imageStatus: 'draft',
      referencedInAnswer: false,
      sessionStatus: 'cancelled',
    }) === 'cancel_session_draft',
    'orphan cancel',
  )
  assert(
    classifyApplicationImageOrphan({
      imageStatus: 'draft',
      referencedInAnswer: false,
      sessionStatus: 'in_progress',
    }) === 'replace_left_draft',
    'orphan replace',
  )
  assert(
    classifyApplicationImageOrphan({
      imageStatus: 'submitted',
      referencedInAnswer: true,
      sessionStatus: 'completed',
    }) === null,
    'submitted not orphan',
  )

  // 15 锁序：乱序 id → 升序 lockIds
  const planOrder = planSubmitImageLocks({
    jwtUserId: 'u1',
    sessionItemId: 'si1',
    imageIds: ['30', '10', '20'],
    images: [
      { id: '30', userId: 'u1', sessionItemId: 'si1', status: 'draft' },
      { id: '10', userId: 'u1', sessionItemId: 'si1', status: 'draft' },
      { id: '20', userId: 'u1', sessionItemId: 'si1', status: 'draft' },
    ],
  })
  assert(
    planOrder.ok && planOrder.lockIds.join(',') === '10,20,30',
    'lock order asc',
  )

  console.log('hs-math APPLICATION-2D selftest PASS')
}

main()
