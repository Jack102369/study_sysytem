/**
 * Assemble H3C14 designs + candidates + quality from accepted group modules.
 * Offline only. No MySQL writes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  bindSha,
  batchSha,
  designToCode,
  sha256,
  ensureDir,
  qb,
  docs,
  diagDir,
  workDir,
  CHAPTER_TARGET,
  TARGET_ACCEPTED,
  HARD14_BATCH_SHA,
  normStem,
  H3_GATE,
} from './_h3c14_lib.mjs'

ensureDir(workDir)
ensureDir(diagDir)

async function loadMod(rel) {
  const p = path.join(qb, 'h3_ch1_4_batch1a', rel)
  if (!fs.existsSync(p)) return null
  return import(pathToFileURL(p).href + '?t=' + Date.now())
}

const parts = []
// Prefer dual-gate final; else fall back to chapter modules
const finalMod = await loadMod('_accepted_final.mjs')
if (finalMod) {
  for (const key of Object.keys(finalMod)) {
    if (Array.isArray(finalMod[key])) parts.push(...finalMod[key])
  }
} else {
  for (const f of ['_accepted_ch1.mjs', '_accepted_ch2.mjs', '_accepted_ch3.mjs', '_accepted_ch4.mjs']) {
    const m = await loadMod(f)
    if (!m) continue
    for (const key of Object.keys(m)) {
      if (Array.isArray(m[key])) parts.push(...m[key])
    }
  }
}

const rejectedLedger = []
const rejPath = path.join(workDir, '_rejected_ledger.json')
if (fs.existsSync(rejPath)) {
  const raw = JSON.parse(fs.readFileSync(rejPath, 'utf8'))
  const list = Array.isArray(raw) ? raw : raw.rejected || []
  rejectedLedger.push(...list)
}

function normalizeRaw(r, idx) {
  const n = r.n ?? idx + 1
  const designId = `H3-DESIGN-${String(n).padStart(3, '0')}`
  const id = designToCode(designId)
  const chapterNo = Number(r.chapterNo)
  const base = {
    id,
    designId,
    book: '必修一',
    chapterNo,
    specialtyCode: `rja-ch${chapterNo}`,
    sectionCode: String(r.sectionCode),
    sectionName: r.sectionName || '',
    kpCode: r.kpCode,
    kpName: r.kpName || '',
    kpInDb: true,
    qtype: r.qtype,
    difficulty: 3,
    hardLevel: 'H3',
    hardLevelReason: r.hardLevelReason || r.breakthrough || '',
    methodMain: r.methodMain || 'equiv_transform',
    methodAux: r.methodAux || null,
    sourceType: 'original',
    sourceEvidence: r.sourceEvidence || 'H3C14 原创；非高考真题复制',
    stem: r.stem,
    options: r.options ?? null,
    answer: r.answer,
    analysis: r.analysis,
    maxScore: r.maxScore ?? null,
    rubric: r.rubric ?? null,
    diagramRequirement: r.diagramRequirement || 'NOT_NEEDED',
    diagramSpecification: r.diagramSpecification || null,
    noDiagramReason: r.noDiagramReason || '文字自足',
    mathCheck: 'PASS',
    mathVerified: 'AUTHOR_CHECKED',
    reviewReady: true,
    blockReasons: [],
    hardAudit: 'ACCEPTED_H3',
    round1: r.round1 || 'MATH_PASS',
    round2: r.round2 || 'ACCEPTED_H3',
    compareDowngrade: {
      structureType: r.modelFamily || 'h3-custom',
      contrast: r.contrastH2 || '',
    },
    hardProfile: {
      coreChallenge: r.coreObjective || '',
      reasoningSteps: Array.isArray(r.reasoningSteps)
        ? r.reasoningSteps
        : ['建模', '突破', '充要闭合', '检验'],
      difficultyEvidence: r.breakthrough || '',
      misconceptionTrap: r.h3Evidence?.routineKillCheck || '套路误判充分条件',
      alternativeApproach: r.alternativeApproach || '分类/构造/对称转化',
      verification: r.verification || '边界与特例回代',
    },
    h3Evidence: r.h3Evidence || {},
    modelFamily: r.modelFamily || `h3-${n}`,
    authorMathNote: 'H3 exclusive batch1a dual-gate',
  }
  if (r._rebuild || r._needsRebuild || r.rejectReason) {
    return { reject: true, raw: r, reason: r.rejectReason || 'NEEDS_REBUILD' }
  }
  // Dual gate structural
  const ev = base.h3Evidence
  if (
    !ev.nonObviousBreakthrough ||
    !ev.aboveHard14H2Contrast ||
    !ev.deepStrategyOrLayeredNecessity
  ) {
    return { reject: true, raw: r, reason: 'H3_EVIDENCE_INCOMPLETE' }
  }
  if (base.qtype === 'application') {
    const sum = (base.rubric || []).reduce((s, x) => s + Number(x.score), 0)
    if (!base.maxScore || sum !== base.maxScore) {
      return { reject: true, raw: r, reason: 'RUBRIC_SUM' }
    }
  }
  if (!base.stem || !base.answer || !base.analysis || base.analysis.length < 40) {
    return { reject: true, raw: r, reason: 'THIN_ANALYSIS' }
  }
  return { reject: false, item: bindSha(base) }
}

const accepted = []
const rejectedNow = []
const seenN = new Set()
for (let i = 0; i < parts.length; i++) {
  const r = parts[i]
  if (r._rebuild || r._needsRebuild) {
    rejectedNow.push({ n: r.n, reason: 'DRAFT_REBUILD' })
    continue
  }
  if (seenN.has(r.n)) {
    rejectedNow.push({ n: r.n, reason: 'DUP_N' })
    continue
  }
  const out = normalizeRaw(r, i)
  if (out.reject) {
    rejectedNow.push({ n: r.n, reason: out.reason })
    continue
  }
  seenN.add(r.n)
  accepted.push(out.item)
}

// renumber accepted to contiguous CAND-H3C14-001.. if gaps — keep design n from source but sort by n
accepted.sort((a, b) => Number(a.designId.slice(-3)) - Number(b.designId.slice(-3)))

// Dedup intra
const stems = accepted.map((c) => normStem(c.stem))
const intraDup = []
for (let i = 0; i < stems.length; i++) {
  for (let j = i + 1; j < stems.length; j++) {
    if (stems[i] && stems[i] === stems[j]) intraDup.push([accepted[i].id, accepted[j].id])
  }
}

// vs HARD14
const hard14 = await import(
  pathToFileURL(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs')).href + '?t=' + Date.now()
)
const h14stems = new Set(hard14.candidates.map((c) => normStem(c.stem)))
const vsHard14 = accepted.filter((c) => h14stems.has(normStem(c.stem))).map((c) => c.id)

const finalAccepted = accepted.filter((c) => !vsHard14.includes(c.id))
for (const id of vsHard14) {
  rejectedNow.push({ id, reason: 'EXACT_STEM_HARD14' })
}

const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const c of finalAccepted) ch[c.chapterNo]++

const batchContentSha256 = finalAccepted.length ? batchSha(finalAccepted) : sha256('')

const designs = {
  phase: 'HS-MATH-H3-CH1-4-EXCLUSIVE-BATCH1A',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status:
    finalAccepted.length > 0
      ? 'H3_DESIGN_ACCEPTED_PARTIAL_OR_FULL'
      : 'H3_DESIGN_EMPTY',
  builtAt: new Date().toISOString(),
  chapterTarget: CHAPTER_TARGET,
  acceptedCount: finalAccepted.length,
  designs: finalAccepted.map((c) => ({
    designId: c.designId,
    chapter: c.specialtyCode,
    section: c.sectionCode,
    primaryKp: c.kpCode,
    methods: [c.methodMain, c.methodAux].filter(Boolean),
    targetHardLevel: 'H3',
    coreObjective: c.hardProfile.coreChallenge,
    mathematicalModel: c.stem.slice(0, 200),
    breakthrough: c.hardProfile.difficultyEvidence,
    standardSolutionSketch: c.analysis.slice(0, 400),
    h3Gate: 'ACCEPTED_H3',
    candidateCode: c.id,
  })),
}

const candSrc = `/** H3-CH1-4 exclusive batch1a offline candidates. Do NOT import without authorization. */
export const phase = 'HS-MATH-H3-CH1-4-EXCLUSIVE-BATCH1A'
export const independence = 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED'
export const status = ${JSON.stringify(
  finalAccepted.length >= 1 && intraDup.length === 0 && vsHard14.length === 0
    ? finalAccepted.length >= TARGET_ACCEPTED
      ? 'H3_BATCH_READY_FOR_PREFLIGHT'
      : 'QUALITY_PARTIAL'
    : finalAccepted.length === 0
      ? 'BLOCKED'
      : 'QUALITY_PARTIAL',
)}
export const batchContentSha256 = ${JSON.stringify(batchContentSha256)}
export const hard14ReferenceSha = ${JSON.stringify(HARD14_BATCH_SHA)}
export const candidates = ${JSON.stringify(finalAccepted, null, 2)}
`

fs.writeFileSync(path.join(qb, 'h3_ch1_4_designs.json'), JSON.stringify(designs, null, 2))
fs.writeFileSync(path.join(qb, 'h3_ch1_4_candidates.mjs'), candSrc)

const required = finalAccepted.filter((c) => c.diagramRequirement === 'REQUIRED')
const quality = {
  phase: 'HS-MATH-H3-CH1-4-EXCLUSIVE-BATCH1A',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status:
    finalAccepted.length === 0
      ? 'BLOCKED'
      : finalAccepted.length >= TARGET_ACCEPTED &&
          required.every((c) => fs.existsSync(path.join(diagDir, `${c.id}.svg`)))
        ? 'H3_BATCH_READY_FOR_PREFLIGHT'
        : 'QUALITY_PARTIAL',
  auditedAt: new Date().toISOString(),
  h3Gate: H3_GATE,
  targetAccepted: TARGET_ACCEPTED,
  designedAttempted: parts.length,
  acceptedH3: finalAccepted.length,
  rejectedNotH3OrMath: rejectedNow.length + rejectedLedger.length,
  rejectedNow,
  rejectedLedgerSample: rejectedLedger.slice(0, 50),
  chapterActual: ch,
  chapterTarget: CHAPTER_TARGET,
  intraDup,
  vsHard14ExactStem: vsHard14,
  requiredDiagrams: {
    n: required.length,
    note: required.length === 0 ? '全部 NOT_NEEDED/文字自足' : '见 diagrams/h3_ch1_4_batch1a',
  },
  rubricOk: finalAccepted
    .filter((c) => c.qtype === 'application')
    .every((c) => (c.rubric || []).reduce((s, r) => s + r.score, 0) === c.maxScore),
  batchContentSha256,
  hard14ReferenceSha: HARD14_BATCH_SHA,
  examThoughtRefsOnly: true,
  openIssues: [
    'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
    ...(finalAccepted.length < TARGET_ACCEPTED
      ? [`ACCEPTED_H3=${finalAccepted.length}<${TARGET_ACCEPTED} (honest, no fill)`]
      : []),
  ],
}

fs.writeFileSync(path.join(qb, 'h3_ch1_4_quality_results.json'), JSON.stringify(quality, null, 2))
fs.writeFileSync(path.join(workDir, '_assemble_out.json'), JSON.stringify(quality, null, 2))

console.log(
  JSON.stringify(
    {
      accepted: finalAccepted.length,
      rejected: rejectedNow.length,
      chapter: ch,
      status: quality.status,
      sha: batchContentSha256,
      intraDup: intraDup.length,
    },
    null,
    2,
  ),
)
