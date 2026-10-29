/**
 * 最小 ZIP（DEFLATE）写入器：仅用 Node zlib，无第三方依赖。
 * 仅用于管理员审核包导出；不做通用归档工具。
 */
import { createHash } from 'crypto'
import { deflateRawSync } from 'zlib'

export type ZipEntryInput = {
  path: string
  data: Buffer | string
}

const MAX_ENTRY_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_UNCOMPRESSED = 20 * 1024 * 1024
const MAX_ZIP_BYTES = 25 * 1024 * 1024
const MAX_ENTRIES = 200

function u16(n: number) {
  const b = Buffer.alloc(2)
  b.writeUInt16LE(n, 0)
  return b
}
function u32(n: number) {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(n >>> 0, 0)
  return b
}

function assertSafeZipPath(p: string) {
  if (!p || typeof p !== 'string') throw new Error('ZIP_PATH_EMPTY')
  if (p.includes('\\') || p.includes('\0')) throw new Error('ZIP_PATH_INVALID')
  if (p.startsWith('/') || p.includes('..')) throw new Error('ZIP_PATH_TRAVERSAL')
  if (p.length > 180) throw new Error('ZIP_PATH_TOO_LONG')
}

/** CRC32（ZIP 所需） */
function crc32(buf: Buffer): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
    }
  }
  return ~c >>> 0
}

export function buildMinimalZip(entries: ZipEntryInput[]): Buffer {
  if (entries.length === 0) throw new Error('ZIP_EMPTY')
  if (entries.length > MAX_ENTRIES) throw new Error('ZIP_TOO_MANY_ENTRIES')

  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  let totalUncompressed = 0
  const seen = new Set<string>()

  for (const e of entries) {
    assertSafeZipPath(e.path)
    if (seen.has(e.path)) throw new Error(`ZIP_DUP_PATH:${e.path}`)
    seen.add(e.path)
    const name = Buffer.from(e.path, 'utf8')
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data, 'utf8')
    if (data.length > MAX_ENTRY_BYTES) throw new Error(`ZIP_ENTRY_TOO_LARGE:${e.path}`)
    totalUncompressed += data.length
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
      throw new Error('ZIP_TOTAL_UNCOMPRESSED_TOO_LARGE')
    }

    const compressed = deflateRawSync(data)
    const crc = crc32(data)
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(8), // deflate
      u16(0),
      u16(0),
      u32(crc),
      u32(compressed.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      compressed,
    ])
    const central = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(8),
      u16(0),
      u16(0),
      u32(crc),
      u32(compressed.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ])
    locals.push(local)
    centrals.push(central)
    offset += local.length
  }

  const centralDir = Buffer.concat(centrals)
  const end = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ])
  const zip = Buffer.concat([...locals, centralDir, end])
  if (zip.length > MAX_ZIP_BYTES) throw new Error('ZIP_TOO_LARGE')
  return zip
}

export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}
