/**
 * DIAGRAM-1B：题干插图私有存储（内容寻址；禁止公开静态直链）。
 */
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  realpathSync,
} from 'fs'
import { join, resolve, sep } from 'path'
import { HS_MATH_ITEM_DIAGRAM_STORAGE_ROOT } from '../hs-math.constants'

export class HsMathItemDiagramStorageError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'HsMathItemDiagramStorageError'
  }
}

function apiCwd(): string {
  return process.cwd()
}

export function resolveItemDiagramPrivateRoot(cwd: string = apiCwd()): string {
  return resolve(cwd, HS_MATH_ITEM_DIAGRAM_STORAGE_ROOT)
}

/** hs-math/item-diagrams/{aa}/{sha256}.bin */
export function buildItemDiagramStorageKey(sha256: string): string {
  const h = String(sha256 || '')
    .trim()
    .toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(h)) {
    throw new HsMathItemDiagramStorageError('BAD_SHA', 'content_sha256 非法')
  }
  return `hs-math/item-diagrams/${h.slice(0, 2)}/${h}.bin`
}

export function resolveItemDiagramAbsolutePath(
  storageKey: string,
  cwd: string = apiCwd(),
): string {
  const key = String(storageKey || '')
    .replace(/\\/g, '/')
    .trim()
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('\0')) {
    throw new HsMathItemDiagramStorageError('BAD_KEY', 'storage_key 非法')
  }
  if (!/^hs-math\/item-diagrams\/[0-9a-f]{2}\/[0-9a-f]{64}\.bin$/i.test(key)) {
    throw new HsMathItemDiagramStorageError(
      'BAD_KEY_SHAPE',
      'storage_key 形状不符合约定',
    )
  }
  const privateRoot = resolveItemDiagramPrivateRoot(cwd)
  const parts = key.split('/')
  const aa = parts[2]
  const file = parts[3]
  const abs = resolve(privateRoot, aa, file)
  const rootWithSep = privateRoot.endsWith(sep)
    ? privateRoot
    : privateRoot + sep
  if (abs !== privateRoot && !abs.startsWith(rootWithSep)) {
    throw new HsMathItemDiagramStorageError('PATH_ESCAPE', '路径越界')
  }
  return abs
}

/** 写入：若同 sha 已存在则跳过覆盖（幂等）。 */
export function writeItemDiagramFile(
  sha256: string,
  buf: Buffer,
  cwd: string = apiCwd(),
): { storageKey: string; absolutePath: string; created: boolean } {
  const storageKey = buildItemDiagramStorageKey(sha256)
  const abs = resolveItemDiagramAbsolutePath(storageKey, cwd)
  const dir = join(resolveItemDiagramPrivateRoot(cwd), sha256.slice(0, 2).toLowerCase())
  mkdirSync(dir, { recursive: true })
  if (existsSync(abs)) {
    return { storageKey, absolutePath: abs, created: false }
  }
  const fd = openSync(abs, 'wx')
  try {
    writeFileSync(fd, buf)
  } finally {
    closeSync(fd)
  }
  return { storageKey, absolutePath: abs, created: true }
}

export function readItemDiagramFile(
  storageKey: string,
  cwd: string = apiCwd(),
): Buffer {
  const abs = resolveItemDiagramAbsolutePath(storageKey, cwd)
  const real = realpathSync(abs)
  const root = realpathSync(resolveItemDiagramPrivateRoot(cwd))
  const rootWithSep = root.endsWith(sep) ? root : root + sep
  if (real !== root && !real.startsWith(rootWithSep)) {
    throw new HsMathItemDiagramStorageError('PATH_ESCAPE', 'realpath 越界')
  }
  return readFileSync(real)
}

/** 仅当确认无任何 DB 引用时调用；实现层默认不物理删除。 */
export function deleteItemDiagramFileIfExists(
  storageKey: string,
  cwd: string = apiCwd(),
): void {
  try {
    const abs = resolveItemDiagramAbsolutePath(storageKey, cwd)
    if (existsSync(abs)) unlinkSync(abs)
  } catch (e) {
    if (e instanceof HsMathItemDiagramStorageError) throw e
    throw e
  }
}
