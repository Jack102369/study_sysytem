/**
 * APPLICATION-2A：应用题图片私有存储（相对 cwd）。
 * 不挂 useStaticAssets；仅业务服务经鉴权后读写。
 */
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  writeFileSync,
  unlinkSync,
  readFileSync,
  realpathSync,
} from 'fs'
import { join, resolve, sep } from 'path'
import { randomUUID } from 'crypto'
import { HS_MATH_APPLICATION_IMAGE_STORAGE_ROOT } from '../hs-math.constants'

export class HsMathApplicationImageStorageError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'HsMathApplicationImageStorageError'
  }
}

function apiCwd(): string {
  return process.cwd()
}

/** 私有根绝对路径：{cwd}/uploads/hs-math/application-answers */
export function resolveApplicationImagePrivateRoot(
  cwd: string = apiCwd(),
): string {
  return resolve(cwd, HS_MATH_APPLICATION_IMAGE_STORAGE_ROOT)
}

/**
 * 生成 storage_key（相对私有根的父级 uploads 之下约定路径）。
 * 格式：hs-math/application-answers/{userId}/{uuid}.bin
 * userId 必须为无符号数字串，禁止客户端传入路径片段。
 */
export function buildApplicationImageStorageKey(
  userId: string,
  uuid: string = randomUUID(),
): string {
  const uid = String(userId).trim()
  if (!/^\d+$/.test(uid)) {
    throw new HsMathApplicationImageStorageError(
      'BAD_USER_ID',
      'userId 必须为数字字符串',
    )
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid,
  )) {
    throw new HsMathApplicationImageStorageError(
      'BAD_UUID',
      'uuid 格式非法',
    )
  }
  return `hs-math/application-answers/${uid}/${uuid}.bin`
}

/**
 * 将 storage_key 解析为绝对路径，并强制落在私有根内（防穿越）。
 */
export function resolveSafeAbsolutePath(
  storageKey: string,
  cwd: string = apiCwd(),
): string {
  const key = String(storageKey || '').replace(/\\/g, '/').trim()
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('\0')) {
    throw new HsMathApplicationImageStorageError(
      'BAD_KEY',
      'storage_key 非法',
    )
  }
  if (!/^hs-math\/application-answers\/\d+\/[0-9a-f-]{36}\.bin$/i.test(key)) {
    throw new HsMathApplicationImageStorageError(
      'BAD_KEY_SHAPE',
      'storage_key 形状不符合约定',
    )
  }

  const privateRoot = resolveApplicationImagePrivateRoot(cwd)
  // key = hs-math/application-answers/{uid}/{uuid}.bin
  // 物理文件在 privateRoot/{uid}/{uuid}.bin
  const parts = key.split('/')
  const uid = parts[2]
  const file = parts[3]
  const abs = resolve(privateRoot, uid, file)
  const rootWithSep = privateRoot.endsWith(sep)
    ? privateRoot
    : privateRoot + sep
  if (abs !== privateRoot && !abs.startsWith(rootWithSep)) {
    throw new HsMathApplicationImageStorageError(
      'PATH_ESCAPE',
      '路径越出私有根目录',
    )
  }
  return abs
}

export function ensureApplicationImagePrivateRoot(
  cwd: string = apiCwd(),
): string {
  const root = resolveApplicationImagePrivateRoot(cwd)
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true })
  }
  return root
}

/**
 * 安全写入：wx 标志禁止覆盖；失败时清理半成品。
 * 返回 { storageKey, absolutePath, sizeBytes }
 */
export function writeApplicationImageFile(input: {
  userId: string
  buffer: Buffer
  cwd?: string
}): { storageKey: string; absolutePath: string; sizeBytes: number } {
  const cwd = input.cwd ?? apiCwd()
  ensureApplicationImagePrivateRoot(cwd)
  const storageKey = buildApplicationImageStorageKey(input.userId)
  const absolutePath = resolveSafeAbsolutePath(storageKey, cwd)
  const dir = resolve(absolutePath, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  let fd: number | null = null
  try {
    // 'wx'：已存在则失败，防覆盖
    fd = openSync(absolutePath, 'wx')
    writeFileSync(fd, input.buffer)
  } catch (e) {
    try {
      if (existsSync(absolutePath)) unlinkSync(absolutePath)
    } catch {
      /* ignore cleanup */
    }
    throw new HsMathApplicationImageStorageError(
      'WRITE_FAILED',
      e instanceof Error ? e.message : '写入失败',
    )
  } finally {
    if (fd != null) {
      try {
        closeSync(fd)
      } catch {
        /* ignore */
      }
    }
  }

  return {
    storageKey,
    absolutePath,
    sizeBytes: input.buffer.length,
  }
}

/**
 * 仅允许读取已校验 storage_key 指向的文件（业务层须先验权）。
 */
export function readApplicationImageFile(
  storageKey: string,
  cwd: string = apiCwd(),
): Buffer {
  const abs = resolveSafeAbsolutePath(storageKey, cwd)
  let real: string
  try {
    real = realpathSync(abs)
  } catch {
    throw new HsMathApplicationImageStorageError(
      'NOT_FOUND',
      '图片文件不存在',
    )
  }
  const root = resolveApplicationImagePrivateRoot(cwd)
  const rootReal = existsSync(root) ? realpathSync(root) : root
  const rootWithSep = rootReal.endsWith(sep) ? rootReal : rootReal + sep
  if (real !== rootReal && !real.startsWith(rootWithSep)) {
    throw new HsMathApplicationImageStorageError(
      'PATH_ESCAPE',
      'realpath 越出私有根',
    )
  }
  return readFileSync(real)
}

/**
 * 删除私有文件（仅 draft 生命周期由业务层调用）。
 * 文件不存在视为成功。
 */
export function deleteApplicationImageFile(
  storageKey: string,
  cwd: string = apiCwd(),
): void {
  const abs = resolveSafeAbsolutePath(storageKey, cwd)
  if (!existsSync(abs)) return
  const real = realpathSync(abs)
  const root = resolveApplicationImagePrivateRoot(cwd)
  const rootReal = existsSync(root) ? realpathSync(root) : root
  const rootWithSep = rootReal.endsWith(sep) ? rootReal : rootReal + sep
  if (real !== rootReal && !real.startsWith(rootWithSep)) {
    throw new HsMathApplicationImageStorageError(
      'PATH_ESCAPE',
      '删除路径越出私有根',
    )
  }
  unlinkSync(real)
}

/** 供测试：两路径是否在同一私有根边界内 */
export function isPathInsidePrivateRoot(
  absolutePath: string,
  cwd: string = apiCwd(),
): boolean {
  const root = resolveApplicationImagePrivateRoot(cwd)
  const abs = resolve(absolutePath)
  const rootWithSep = root.endsWith(sep) ? root : root + sep
  return abs === root || abs.startsWith(rootWithSep)
}

export { join as pathJoinForTest }
