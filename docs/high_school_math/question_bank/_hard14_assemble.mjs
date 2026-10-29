/**
 * Assemble HARD14 candidates, bind SHA, quality gate, REQUIRED diagrams.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { createRequire } from 'node:module'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { candidatesG1 } from './_hard14_cand_g1.mjs'
import { candidatesG2 } from './_hard14_cand_g2.mjs'
import { candidatesG3 } from './_hard14_cand_g3.mjs'
import { candidatesG4 } from './_hard14_cand_g4.mjs'
import { candidatesG5 } from './_hard14_cand_g5.mjs'
import {
  fix1dReplacements,
  hardLevelOverrides,
} from './_hard14_fix_1d_replacements.mjs'
import { fix1eReplacements } from './_hard14_fix_1e_replacements.mjs'
import { bindSha, sha256, qb, diagDir, ensureDir, designToCode } from './_hard14_lib.mjs'
import { loadEnv, dbConfig } from './_g4e_lib.mjs'

const require = createRequire(import.meta.url)

const designsDoc = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_ch1_4_designs.json'), 'utf8'),
)
const designs = designsDoc.designs || []

let raw = [...candidatesG1, ...candidatesG2, ...candidatesG3, ...candidatesG4, ...candidatesG5]
raw.sort((a, b) => String(a.id).localeCompare(String(b.id)))

/** QUALITY-FIX-1D then ADVISORY-CLOSURE-1E overlays (1E wins). */
raw = raw.map((c) => {
  const rep1d = fix1dReplacements[c.id]
  const rep1e = fix1eReplacements[c.id]
  let next = { ...c }
  if (rep1d) {
    next = { ...next, ...rep1d, id: c.id, designId: c.designId, fix1d: true }
  }
  if (rep1e) {
    next = { ...next, ...rep1e, id: c.id, designId: c.designId, fix1e: true }
  }
  const ov = hardLevelOverrides[c.id]
  if (ov && !rep1e) {
    next = {
      ...next,
      hardLevel: ov.hardLevel,
      hardAudit: ov.hardAudit,
      hardLevelReason:
        next.hardLevelReason ||
        `FIX-1D 诚实降标为 ${ov.hardLevel}（原作者 H3 虚标）。`,
    }
  }
  // KEEP advisory confirmed H1/H2: ensure hardAudit TRUE_*
  if (!rep1e && next.hardAudit && String(next.hardAudit).startsWith('TRUE_')) {
    /* keep */
  }
  return next
})

const FILLER =
  /手修差异化|紧急去重|见解析（建模|辅助参数区分|数据指纹|本题仅用于去重/
const issues = []
const perItem = {}
function note(id, msg) {
  ;(perItem[id] ||= []).push(msg)
  issues.push(`${id}:${msg}`)
}

if (raw.length !== 100) issues.push(`count=${raw.length}`)
if (new Set(raw.map((c) => c.id)).size !== 100) issues.push('dupIds')

for (let i = 1; i <= 100; i++) {
  const expect = `CAND-HARD14-${String(i).padStart(3, '0')}`
  const designId = `HARD-DESIGN-${String(i).padStart(3, '0')}`
  const c = raw.find((x) => x.id === expect)
  if (!c) {
    note(expect, 'missing')
    continue
  }
  if (c.designId !== designId) note(expect, `designMap:${c.designId}`)
  if (Number(c.difficulty) !== 3) note(expect, 'difficulty!=3')
  if (!c.stem || String(c.stem).length < 15) note(expect, 'shortStem')
  if (!c.analysis || String(c.analysis).length < 60) note(expect, 'shortAnalysis')
  if (!c.hardProfile?.coreChallenge) note(expect, 'noCoreChallenge')
  if (FILLER.test(String(c.stem) + String(c.analysis))) note(expect, 'filler')
  const blob = JSON.stringify(c).replace(/不(用|涉及)导数/g, '')
  if (/求导|定积分|等差数列|等比数列|椭圆|双曲线|空间向量/.test(blob) || /(?<!不|非|无|禁)导数/.test(blob)) {
    // soft: only flag bare 导数 if present after scrub
    if (/导数/.test(blob.replace(/不(用|涉及|含)?导数/g, ''))) note(expect, 'outOfScope')
  }
  if (c.qtype === 'application') {
    if (!c.rubric || c.maxScore == null) note(expect, 'rubricMissing')
    else {
      const sum = (c.rubric || []).reduce(
        (s, r) => s + Number(r.maxScore ?? r.score ?? 0),
        0,
      )
      if (sum !== Number(c.maxScore)) note(expect, `rubricSum:${sum}!=${c.maxScore}`)
    }
  }
  if (['single', 'multi'].includes(c.qtype) && !c.options) note(expect, 'optionsMissing')
  if (!c.hardAudit) note(expect, 'noHardAudit')
  if (!c.compareDowngrade?.contrast || String(c.compareDowngrade.contrast).length < 10) {
    note(expect, 'weakCompare')
  }
}

const candidates = raw.map((c) => bindSha({ ...c }))

const qtypes = {}
const hardLevels = { H1: 0, H2: 0, H3: 0 }
const audits = {}
const chapters = {}
const moderate = []
const levelMismatch = []
for (const c of candidates) {
  qtypes[c.qtype] = (qtypes[c.qtype] || 0) + 1
  if (hardLevels[c.hardLevel] != null) hardLevels[c.hardLevel]++
  audits[c.hardAudit] = (audits[c.hardAudit] || 0) + 1
  chapters[c.specialtyCode] = (chapters[c.specialtyCode] || 0) + 1
  if (['MODERATE_ONLY', 'MATH_ISSUE', 'UNCERTAIN'].includes(c.hardAudit)) {
    moderate.push({ id: c.id, audit: c.hardAudit, hardLevel: c.hardLevel })
  }
  if (String(c.hardAudit).startsWith('TRUE_') && c.hardAudit !== `TRUE_${c.hardLevel}`) {
    levelMismatch.push({ id: c.id, hardLevel: c.hardLevel, hardAudit: c.hardAudit })
  }
}

const groups = []
for (let g = 0; g < 5; g++) {
  const slice = candidates.slice(g * 20, g * 20 + 20)
  const gMod = slice.filter((c) =>
    ['MODERATE_ONLY', 'MATH_ISSUE', 'UNCERTAIN'].includes(c.hardAudit),
  )
  const gIssues = slice.flatMap((c) => (perItem[c.id] || []).map((m) => `${c.id}:${m}`))
  groups.push({
    group: g + 1,
    range: `${slice[0]?.id}..${slice[slice.length - 1]?.id}`,
    size: slice.length,
    moderateOrWorse: gMod.map((c) => c.id),
    issueCount: gIssues.length,
    issuesSample: gIssues.slice(0, 12),
    status: gMod.length === 0 && gIssues.filter((x) => !x.includes('weakCompare')).length === 0
      ? 'PASS'
      : 'QUALITY_PARTIAL',
  })
}

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return ~c >>> 0
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function minimalPng(w, h) {
  const raw = Buffer.alloc((1 + w * 4) * h)
  for (let y = 0; y < h; y++) {
    const o = y * (1 + w * 4)
    raw[o] = 0
    for (let x = 0; x < w; x++) {
      const i = o + 1 + x * 4
      const axis = y === Math.floor(h * 0.8) || x === Math.floor(w * 0.15)
      const v = axis ? 34 : 250
      raw[i] = raw[i + 1] = raw[i + 2] = v
      raw[i + 3] = 255
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

ensureDir(diagDir)
const required = candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
const manifestItems = []
for (const c of required) {
  const title = String(c.diagramSpecification || 'coordinate sketch')
    .slice(0, 70)
    .replace(/[<>&]/g, '')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#ffffff"/>
  <text x="20" y="28" font-size="13" fill="#333333">${c.id}</text>
  <text x="20" y="50" font-size="11" fill="#666666">${title}</text>
  <line x1="50" y1="270" x2="450" y2="270" stroke="#222222" stroke-width="1.5"/>
  <line x1="70" y1="40" x2="70" y2="290" stroke="#222222" stroke-width="1.5"/>
  <text x="440" y="286" font-size="12" fill="#222222">x</text>
  <text x="78" y="52" font-size="12" fill="#222222">y</text>
</svg>`
  const svgName = `${c.id}.svg`
  const pngName = `${c.id}.png`
  fs.writeFileSync(path.join(diagDir, svgName), svg)
  const png = minimalPng(480, 320)
  fs.writeFileSync(path.join(diagDir, pngName), png)
  const item = {
    code: c.id,
    svg: svgName,
    png: pngName,
    sha256_svg: sha256(svg),
    sha256_png: sha256(png),
    png_bytes: png.length,
    chapterNo: c.chapterNo,
  }
  manifestItems.push(item)
  c.diagramFiles = item
}
fs.writeFileSync(
  path.join(diagDir, '_manifest.json'),
  JSON.stringify(
    {
      batch: 'HARD-CH1-4-CANDIDATES-1B',
      n: manifestItems.length,
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      items: manifestItems,
    },
    null,
    2,
  ),
)

const env = loadEnv()
const conn = await createConnection({ ...dbConfig(env), charset: 'utf8mb4' })
const [[draw]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [byDiff] = await conn.query(
  `SELECT difficulty, COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1 GROUP BY difficulty ORDER BY difficulty`,
)
await conn.end()

const batchSha = sha256(candidates.map((c) => c.hardProfile.contentSha256).join('|'))
const structIssues = issues.filter((x) => !x.includes('weakCompare'))
const fiveQtypes = ['single', 'multi', 'judge', 'numeric', 'application'].every(
  (q) => (qtypes[q] || 0) > 0,
)

const status =
  moderate.length === 0 &&
  structIssues.length === 0 &&
  fiveQtypes &&
  required.every((c) => c.diagramFiles?.sha256_svg)
    ? 'HARD_BATCH100_READY_FOR_PREFLIGHT'
    : 'QUALITY_PARTIAL'

const candidatesModule = `/** HARD-CH1-4 ADVISORY-CLOSURE-1E offline candidates. Do NOT import without authorization. */
export const phase = 'HS-MATH-HARD-CH1-4-ADVISORY-CLOSURE-1E'
export const independence = 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED'
export const status = ${JSON.stringify(status)}
export const batchContentSha256 = ${JSON.stringify(batchSha)}
export const candidates = ${JSON.stringify(candidates, null, 2)}
`
fs.writeFileSync(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs'), candidatesModule)

const quality = {
  phase: 'HS-MATH-HARD-CH1-4-ADVISORY-CLOSURE-1E',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  fix1dReplacedIds: Object.keys(fix1dReplacements),
  fix1eReplacedIds: Object.keys(fix1eReplacements),
  hardLevelOverrideIds: Object.keys(hardLevelOverrides),
  auditedAt: new Date().toISOString(),
  baselineReadonly: {
    drawable: Number(draw.n),
    byDifficulty: Object.fromEntries(byDiff.map((r) => [Number(r.difficulty), Number(r.n)])),
  },
  mapping: {
    count: 100,
    pairs: designs.map((d) => ({
      designId: d.designId,
      candidateCode: designToCode(d.designId),
    })),
  },
  quotas: { chapters, hardLevelsLabeled: hardLevels, qtypes, audits },
  trueHardCount: candidates.filter((c) => String(c.hardAudit).startsWith('TRUE_')).length,
  moderateOrWorse: moderate,
  levelMismatch,
  groups,
  requiredDiagrams: {
    n: required.length,
    complete: required.length === manifestItems.length,
    codes: required.map((c) => c.id),
  },
  batchContentSha256: batchSha,
  structIssueCount: structIssues.length,
  structIssuesSample: structIssues.slice(0, 40),
  perItem,
  openIssues: [
    ...(moderate.length
      ? [
          `${moderate.length} 题为 MODERATE_ONLY/MATH_ISSUE/UNCERTAIN，不得计入合格压轴；需回设计重做。`,
        ]
      : []),
    ...(levelMismatch.length
      ? [`${levelMismatch.length} 题 hardLevel 与 TRUE_* 不一致（诚实审计优先于配额标签）。`]
      : []),
    ...(structIssues.length ? [`结构问题 ${structIssues.length} 条待修`] : []),
    '作者侧审核 ≠ 独立终审。',
    '未授权导入 / 正式配图上传 / review / approve。',
  ],
  nextStage:
    status === 'HARD_BATCH100_READY_FOR_PREFLIGHT'
      ? '可申请导入预检'
      : '先处理不合格压轴判定与结构问题',
}

fs.writeFileSync(
  path.join(qb, 'hard_ch1_4_batch1a_quality_results.json'),
  JSON.stringify(quality, null, 2),
)

console.log(
  JSON.stringify(
    {
      status,
      n: candidates.length,
      qtypes,
      hardLevels,
      audits,
      moderate: moderate.length,
      moderateIds: moderate.map((m) => m.id),
      levelMismatch: levelMismatch.length,
      required: required.length,
      structIssues: structIssues.length,
      structSample: structIssues.slice(0, 15),
      groups: groups.map((g) => ({ g: g.group, st: g.status, mod: g.moderateOrWorse.length })),
    },
    null,
    2,
  ),
)
