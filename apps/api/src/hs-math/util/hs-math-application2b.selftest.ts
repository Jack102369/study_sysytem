/**
 * APPLICATION-2B：图片 API 策略 / 安全 / 视图（无 DB、无真实上传）。
 * 运行：pnpm --filter api run hs-math:application2b-selftest
 */
import {
  HS_MATH_APPLICATION_IMAGE_MAX_BYTES,
  HS_MATH_APPLICATION_IMAGE_MAX_COUNT,
} from '../hs-math.constants'
import { validateApplicationImageBuffer } from './hs-math-application-image-security'
import {
  assertImageOwnershipMatches,
  canDeleteApplicationImage,
  canUploadApplicationImage,
  nextImageSortOrder,
  publicViewHasNoSecrets,
  toSessionImagePublicView,
} from './hs-math-application-image-policy'
import {
  deleteApplicationImageFile,
  writeApplicationImageFile,
} from './hs-math-application-image-storage'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9])

function main() {
  // —— 1/2 属主：未匹配 → false（控制器层映射为 404，不泄露）——
  assert(
    assertImageOwnershipMatches({
      jwtUserId: '2',
      sessionUserId: '2',
      sessionId: '10',
      sessionItemSessionId: '10',
      sessionItemId: '20',
    }),
    'owner ok',
  )
  assert(
    !assertImageOwnershipMatches({
      jwtUserId: '2',
      sessionUserId: '3',
      sessionId: '10',
      sessionItemSessionId: '10',
      sessionItemId: '20',
    }),
    'cross user reject',
  )
  assert(
    !assertImageOwnershipMatches({
      jwtUserId: '2',
      sessionUserId: '2',
      sessionId: '10',
      sessionItemSessionId: '99',
      sessionItemId: '20',
    }),
    'item not in session',
  )
  assert(
    !assertImageOwnershipMatches({
      jwtUserId: '2',
      sessionUserId: '2',
      sessionId: '10',
      sessionItemSessionId: '10',
      sessionItemId: '20',
      imageUserId: '9',
      imageSessionItemId: '20',
    }),
    'image other user',
  )
  assert(
    !assertImageOwnershipMatches({
      jwtUserId: '2',
      sessionUserId: '2',
      sessionId: '10',
      sessionItemSessionId: '10',
      sessionItemId: '20',
      imageUserId: '2',
      imageSessionItemId: '21',
    }),
    'image other item',
  )
  // ADMIN 身份不在策略层特殊放行（无 role 参数）
  assert(
    !assertImageOwnershipMatches({
      jwtUserId: '1',
      sessionUserId: '2',
      sessionId: '10',
      sessionItemSessionId: '10',
      sessionItemId: '20',
    }),
    'admin id still needs ownership',
  )

  // —— 3 非 application ——
  const notApp = canUploadApplicationImage({
    sessionStatus: 'in_progress',
    qtype: 'single',
    currentImageCount: 0,
  })
  assert(!notApp.ok && notApp.code === 'NOT_APPLICATION', 'not application')

  // —— 4 已提交会话 ——
  const closed = canUploadApplicationImage({
    sessionStatus: 'completed',
    qtype: 'application',
    currentImageCount: 0,
  })
  assert(!closed.ok && closed.code === 'SESSION_NOT_OPEN', 'session closed')

  // —— 5/6/7 MIME / 魔数 / 大小 ——
  assert(
    !validateApplicationImageBuffer(JPEG, 'image/png').ok,
    'mime mismatch',
  )
  assert(
    !validateApplicationImageBuffer(Buffer.from([1, 2, 3]), 'image/jpeg').ok,
    'bad magic',
  )
  assert(
    !validateApplicationImageBuffer(
      Buffer.alloc(HS_MATH_APPLICATION_IMAGE_MAX_BYTES + 1, 0xff),
    ).ok,
    'too large',
  )
  assert(validateApplicationImageBuffer(JPEG, 'image/jpeg').ok, 'jpeg ok')

  // —— 8 超过 5 张 ——
  const tooMany = canUploadApplicationImage({
    sessionStatus: 'in_progress',
    qtype: 'application',
    currentImageCount: HS_MATH_APPLICATION_IMAGE_MAX_COUNT,
  })
  assert(!tooMany.ok && tooMany.code === 'TOO_MANY', 'too many')
  assert(
    canUploadApplicationImage({
      sessionStatus: 'in_progress',
      qtype: 'application',
      currentImageCount: HS_MATH_APPLICATION_IMAGE_MAX_COUNT - 1,
    }).ok,
    'four ok',
  )

  // —— 9/10 draft 删 / submitted 禁删 ——
  assert(
    canDeleteApplicationImage({
      sessionStatus: 'in_progress',
      imageStatus: 'draft',
    }).ok,
    'draft delete',
  )
  const noSub = canDeleteApplicationImage({
    sessionStatus: 'in_progress',
    imageStatus: 'submitted',
  })
  assert(!noSub.ok && noSub.code === 'NOT_DRAFT', 'submitted no delete')
  const locked = canDeleteApplicationImage({
    sessionStatus: 'completed',
    imageStatus: 'draft',
  })
  assert(!locked.ok && locked.code === 'SESSION_LOCKED', 'session locked')

  // —— 11/12 公开视图无密钥 ——
  const view = toSessionImagePublicView({
    id: '99',
    mimeType: 'image/jpeg',
    sizeBytes: 4,
    sortOrder: 1,
    status: 'draft',
    createdAt: new Date().toISOString(),
    storageKey: 'hs-math/application-answers/2/secret.bin',
  })
  assert(view.imageId === '99', 'imageId')
  assert(publicViewHasNoSecrets(view as unknown as Record<string, unknown>), 'no secrets')
  assert(!('storageKey' in view), 'no storageKey field')

  // —— 13 并发边界：sort_order 与 count 策略 ——
  assert(nextImageSortOrder([]) === 1, 'first sort')
  assert(nextImageSortOrder([1, 2, 5]) === 6, 'next sort')
  // 行锁在 Service 事务内；此处验证满员策略与 sort 稳定
  assert(
    !canUploadApplicationImage({
      sessionStatus: 'in_progress',
      qtype: 'application',
      currentImageCount: 5,
    }).ok,
    'concurrent gate at 5',
  )

  // —— 14 写入失败清理：DB 失败路径由 Service try/catch；此处验盘失败不留半成品 ——
  const cwd = mkdtempSync(join(tmpdir(), 'hs-math-app2b-'))
  try {
    const w = writeApplicationImageFile({
      userId: '2',
      buffer: JPEG,
      cwd,
    })
    assert(existsSync(w.absolutePath), 'written')
    deleteApplicationImageFile(w.storageKey, cwd)
    assert(!existsSync(w.absolutePath), 'cleaned')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }

  console.log('hs-math APPLICATION-2B selftest PASS')
}

main()
