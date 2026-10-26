/**
 * DIAGRAM-1B selftest：SVG 清洗、MIME、指纹兼容、顺序敏感。
 * 运行：npx ts-node -r tsconfig-paths/register src/hs-math/util/hs-math-item-diagram.selftest.ts
 */
import { createHash } from 'crypto'
import { fingerprintTrainItemContent } from './hs-math-item-content-fingerprint'
import {
  sanitizeSvgXml,
  validateItemDiagramBuffer,
} from './hs-math-item-diagram-security'
import {
  buildItemDiagramStorageKey,
  resolveItemDiagramAbsolutePath,
} from './hs-math-item-diagram-storage'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

function baseFp(extra: Record<string, unknown> = {}) {
  return fingerprintTrainItemContent({
    code: 'T.DIAG.1',
    specialtyCode: 'rja-ch1',
    categoryCode: 'c1',
    qtype: 'single',
    difficulty: 1,
    stem: 'stem',
    optionsJson: {
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
      ],
    },
    answerPayloadJson: { kind: 'single', optionId: 'A' },
    analysis: 'a',
    knowledgePointCodes: ['kp1'],
    primaryKnowledgePointCode: 'kp1',
    sourceType: 'original',
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    methodCodes: [],
    primaryMethodCode: '',
    ...extra,
  })
}

function png1x1(): Buffer {
  // minimal valid 1x1 PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
}

let n = 0
function ok(msg: string) {
  n++
  console.log(`PASS ${n}: ${msg}`)
}

// 1 SVG script reject
{
  const r = sanitizeSvgXml(
    `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`,
  )
  assert(!r.ok, 'script should fail')
  ok('reject SVG script')
}

// 2 foreignObject
{
  const r = sanitizeSvgXml(
    `<svg><foreignObject width="1" height="1"><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject></svg>`,
  )
  assert(!r.ok, 'foreignObject')
  ok('reject foreignObject')
}

// 3 external href
{
  const r = sanitizeSvgXml(
    `<svg><use href="https://evil.example/x" /></svg>`,
  )
  assert(!r.ok, 'external')
  ok('reject external href')
}

// 4 event attr
{
  const r = sanitizeSvgXml(
    `<svg><rect width="1" height="1" onclick="alert(1)" /></svg>`,
  )
  assert(!r.ok, 'onclick')
  ok('reject onclick')
}

// 5 clean svg pass
{
  const r = sanitizeSvgXml(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="#ccc"/></svg>`,
  )
  assert(r.ok, 'clean svg')
  ok('accept clean svg')
}

// 6 bad mime
{
  const r = validateItemDiagramBuffer(Buffer.from('not-an-image'), 'image/png')
  assert(!r.ok, 'bad magic')
  ok('reject bad magic')
}

// 7 png ok
{
  const r = validateItemDiagramBuffer(png1x1(), 'image/png')
  assert(r.ok && r.mime === 'image/png', 'png')
  ok('accept png')
}

// 8 too large
{
  const big = Buffer.alloc(3 * 1024 * 1024, 1)
  const r = validateItemDiagramBuffer(big, 'image/png')
  assert(!r.ok && r.code === 'TOO_LARGE', 'size')
  ok('reject oversized')
}

// 9 fingerprint: empty diagrams == omit (compat)
{
  const a = baseFp()
  const b = baseFp({ diagramSha256List: [] })
  assert(a === b, 'empty list compat')
  ok('empty diagramSha256List fingerprint compatible')
}

// 10 fingerprint changes with diagram / order
{
  const sha1 = createHash('sha256').update('a').digest('hex')
  const sha2 = createHash('sha256').update('b').digest('hex')
  const f0 = baseFp()
  const f1 = baseFp({ diagramSha256List: [sha1] })
  const f2 = baseFp({ diagramSha256List: [sha1, sha2] })
  const f3 = baseFp({ diagramSha256List: [sha2, sha1] })
  assert(f0 !== f1, 'add diagram changes fp')
  assert(f1 !== f2, 'count changes fp')
  assert(f2 !== f3, 'order changes fp')
  ok('fingerprint sensitive to diagram set/order')
}

// 11 storage key shape / path escape
{
  const sha = createHash('sha256').update('x').digest('hex')
  const key = buildItemDiagramStorageKey(sha)
  assert(key.includes(sha.slice(0, 2)), 'prefix')
  const abs = resolveItemDiagramAbsolutePath(key, process.cwd())
  assert(abs.includes('item-diagrams'), 'path')
  let threw = false
  try {
    resolveItemDiagramAbsolutePath('hs-math/item-diagrams/../etc/passwd.bin')
  } catch {
    threw = true
  }
  assert(threw, 'traversal')
  ok('storage key + path escape')
}

console.log(`\nAll ${n} DIAGRAM-1B selftests passed.`)
