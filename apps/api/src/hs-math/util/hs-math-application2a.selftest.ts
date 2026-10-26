/**
 * APPLICATION-2A：图片安全 / 私有路径（无 DB、无真实学生上传）。
 * 运行：pnpm --filter api run hs-math:application2a-selftest
 */
import {
  mkdtempSync,
  rmSync,
  existsSync,
  openSync,
  closeSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  HS_MATH_APPLICATION_IMAGE_MAX_BYTES,
  HS_MATH_APPLICATION_IMAGE_MAX_COUNT,
  HS_MATH_SESSION_IMAGE_STATUSES,
} from '../hs-math.constants'
import {
  assertImageCountWithinLimit,
  detectImageMimeFromMagic,
  isAllowedSessionImageStatus,
  validateApplicationImageBuffer,
} from './hs-math-application-image-security'
import {
  buildApplicationImageStorageKey,
  deleteApplicationImageFile,
  ensureApplicationImagePrivateRoot,
  HsMathApplicationImageStorageError,
  isPathInsidePrivateRoot,
  readApplicationImageFile,
  resolveApplicationImagePrivateRoot,
  resolveSafeAbsolutePath,
  writeApplicationImageFile,
} from './hs-math-application-image-storage'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

function expectThrow(fn: () => void, codeOrMsg: string) {
  try {
    fn()
    throw new Error(`expected throw: ${codeOrMsg}`)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('expected throw')) throw e
    if (e instanceof HsMathApplicationImageStorageError) {
      if (
        e.code !== codeOrMsg &&
        !e.code.startsWith(codeOrMsg) &&
        !e.message.includes(codeOrMsg)
      ) {
        throw new Error(`expected code/msg ${codeOrMsg}, got ${e.code}: ${e.message}`)
      }
      return
    }
    if (e instanceof Error && e.message.includes(codeOrMsg)) return
    throw e
  }
}

/** minimal JPEG (SOI + EOI) */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
/** PNG signature + pad */
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
])
/** WebP RIFF header */
const WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])

function main() {
  // —— status enum ——
  assert(
    HS_MATH_SESSION_IMAGE_STATUSES.includes('draft') &&
      HS_MATH_SESSION_IMAGE_STATUSES.includes('submitted'),
    'status enum',
  )
  assert(isAllowedSessionImageStatus('draft'), 'draft ok')
  assert(isAllowedSessionImageStatus('submitted'), 'submitted ok')
  assert(!isAllowedSessionImageStatus('approved'), 'no approved status')

  // —— magic ——
  assert(detectImageMimeFromMagic(JPEG) === 'image/jpeg', 'jpeg magic')
  assert(detectImageMimeFromMagic(PNG) === 'image/png', 'png magic')
  assert(detectImageMimeFromMagic(WEBP) === 'image/webp', 'webp magic')
  assert(detectImageMimeFromMagic(Buffer.from([1, 2, 3])) === null, 'bad magic')

  // —— validate buffer ——
  const okJ = validateApplicationImageBuffer(JPEG, 'image/jpeg')
  assert(okJ.ok && okJ.mime === 'image/jpeg', 'valid jpeg')
  const empty = validateApplicationImageBuffer(Buffer.alloc(0))
  assert(!empty.ok && empty.code === 'EMPTY', 'empty')
  const tooBig = validateApplicationImageBuffer(
    Buffer.alloc(HS_MATH_APPLICATION_IMAGE_MAX_BYTES + 1, 0xff),
  )
  assert(!tooBig.ok && tooBig.code === 'TOO_LARGE', 'too large')
  const mismatch = validateApplicationImageBuffer(JPEG, 'image/png')
  assert(!mismatch.ok && mismatch.code === 'MIME_MISMATCH', 'mime mismatch')
  const badDecl = validateApplicationImageBuffer(JPEG, 'image/svg+xml')
  assert(!badDecl.ok && badDecl.code === 'BAD_DECLARED_MIME', 'bad declared')
  const jpgAlias = validateApplicationImageBuffer(JPEG, 'image/jpg')
  assert(jpgAlias.ok, 'image/jpg alias')

  // —— count ——
  assertImageCountWithinLimit(0)
  assertImageCountWithinLimit(HS_MATH_APPLICATION_IMAGE_MAX_COUNT - 1)
  expectThrow(
    () => assertImageCountWithinLimit(HS_MATH_APPLICATION_IMAGE_MAX_COUNT),
    '最多',
  )

  // —— storage_key ——
  const key = buildApplicationImageStorageKey('2')
  assert(
    /^hs-math\/application-answers\/2\/[0-9a-f-]{36}\.bin$/i.test(key),
    `key shape ${key}`,
  )
  const k1 = buildApplicationImageStorageKey('2')
  const k2 = buildApplicationImageStorageKey('2')
  assert(k1 !== k2, 'uuid uniqueness')
  expectThrow(() => buildApplicationImageStorageKey('../2'), 'BAD_USER_ID')
  expectThrow(() => buildApplicationImageStorageKey('2/../3'), 'BAD_USER_ID')
  expectThrow(
    () => buildApplicationImageStorageKey('2', 'not-a-uuid'),
    'BAD_UUID',
  )

  // —— path traversal ——
  expectThrow(
    () => resolveSafeAbsolutePath('hs-math/application-answers/2/../../../etc/passwd.bin'),
    'BAD',
  )
  expectThrow(
    () => resolveSafeAbsolutePath('../hs-math/application-answers/2/a.bin'),
    'BAD',
  )
  expectThrow(
    () => resolveSafeAbsolutePath('/etc/passwd'),
    'BAD',
  )

  const cwd = mkdtempSync(join(tmpdir(), 'hs-math-app2a-'))
  try {
    const root = ensureApplicationImagePrivateRoot(cwd)
    assert(existsSync(root), 'root created')
    assert(
      resolveApplicationImagePrivateRoot(cwd).endsWith(
        join('uploads', 'hs-math', 'application-answers'),
      ) ||
        resolveApplicationImagePrivateRoot(cwd).includes(
          'application-answers',
        ),
      'root path',
    )

    const written = writeApplicationImageFile({
      userId: '2',
      buffer: JPEG,
      cwd,
    })
    assert(written.sizeBytes === JPEG.length, 'write size')
    assert(isPathInsidePrivateRoot(written.absolutePath, cwd), 'inside root')
    const read = readApplicationImageFile(written.storageKey, cwd)
    assert(Buffer.compare(read, JPEG) === 0, 'roundtrip')

    // 合法占位 key 可解析且落在私有根内
    const placeholder = resolveSafeAbsolutePath(
      'hs-math/application-answers/2/00000000-0000-4000-8000-000000000001.bin',
      cwd,
    )
    assert(isPathInsidePrivateRoot(placeholder, cwd), 'placeholder inside')

    // 路径穿越拒绝
    expectThrow(
      () =>
        resolveSafeAbsolutePath(
          'hs-math/application-answers/2/../../../../tmp/x.bin',
          cwd,
        ),
      'BAD',
    )

    // wx 防覆盖：同绝对路径二次 open wx 失败
    let wxFailed = false
    try {
      const fd2 = openSync(written.absolutePath, 'wx')
      closeSync(fd2)
    } catch {
      wxFailed = true
    }
    assert(wxFailed, 'wx refuse overwrite')

    deleteApplicationImageFile(written.storageKey, cwd)
    assert(!existsSync(written.absolutePath), 'deleted')
    deleteApplicationImageFile(written.storageKey, cwd)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }

  console.log('hs-math APPLICATION-2A selftest PASS')
}

main()
