/**
 * Assemble 1E: frozen PASS8 + new ACCEPTED only. Offline. No MySQL writes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { bindSha, batchSha, sha256, CHAPTER_TARGET, HARD14_BATCH_SHA, H3_GATE, normStem } from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const docs = path.resolve(qb, '..')

const frozen = JSON.parse(fs.readFileSync(path.join(__dirname, '_1e_frozen_pass8.json'), 'utf8')).items
const { accepted1e } = await import(pathToFileURL(path.join(__dirname, '_1e_accepted_pool.mjs')).href + '?t=' + Date.now())

function toCandidate(raw, designIdNum) {
  const n = raw.n ?? designIdNum
  const designId = `H3-DESIGN-${String(n).padStart(3, '0')}`
  const id = `CAND-H3C14-${String(n).padStart(3, '0')}`
  const base = {
    id,
    designId,
    book: '必修一',
    chapterNo: raw.chapterNo,
    specialtyCode: `rja-ch${raw.chapterNo}`,
    sectionCode: String(raw.sectionCode),
    sectionName: raw.sectionName || '',
    kpCode: raw.kpCode,
    kpName: raw.kpName || '',
    kpInDb: true,
    qtype: raw.qtype || 'application',
    difficulty: 3,
    hardLevel: 'H3',
    hardLevelReason: raw.hardLevelReason || raw.breakthrough || '',
    methodMain: raw.methodMain || 'equiv_transform',
    methodAux: raw.methodAux || null,
    sourceType: 'original',
    sourceEvidence: 'H3C14-1E 原创；非真题复制',
    stem: raw.stem,
    options: null,
    answer: raw.answer,
    analysis: raw.analysis,
    maxScore: raw.maxScore,
    rubric: raw.rubric,
    diagramRequirement: raw.diagramRequirement || 'NOT_NEEDED',
    diagramSpecification: null,
    noDiagramReason: raw.noDiagramReason || '文字与符号推理自足。',
    mathCheck: 'PASS',
    mathVerified: 'AUTHOR_CHECKED',
    reviewReady: true,
    blockReasons: [],
    hardAudit: 'ACCEPTED_H3',
    round1: 'MATH_PASS',
    round2: 'ACCEPTED_H3',
    compareDowngrade: {
      structureType: raw.modelFamily || 'h3-custom',
      contrast: raw.contrastH2 || raw.h3Evidence?.aboveHard14H2Contrast || '',
    },
    hardProfile: {
      coreChallenge: raw.coreObjective || '',
      reasoningSteps: ['建模', '突破', '充要闭合', '检验'],
      difficultyEvidence: raw.breakthrough || raw.hardLevelReason || '',
      misconceptionTrap: raw.h3Evidence?.routineKillCheck || '套路误判',
      alternativeApproach: '分类/构造/对称转化',
      verification: '边界与特例回代',
    },
    h3Evidence: raw.h3Evidence,
    modelFamily: raw.modelFamily,
    authorMathNote: 'H3 redesign 1E dual-gate',
  }
  const sum = (base.rubric || []).reduce((s, r) => s + r.score, 0)
  if (base.maxScore != null && sum !== base.maxScore) {
    throw new Error(`${id}: rubric ${sum}!=${base.maxScore}`)
  }
  if (!base.h3Evidence?.nonObviousBreakthrough) throw new Error(`${id}: missing h3Evidence`)
  return bindSha(base)
}

// Rebuild frozen with stable fields from snapshot (already have contentSha)
const passItems = frozen.map((f) => {
  const { contentSha256, ...rest } = f
  const item = {
    ...rest,
    book: '必修一',
    specialtyCode: `rja-ch${f.chapterNo}`,
    kpInDb: true,
    difficulty: 3,
    hardLevel: 'H3',
    sourceType: 'original',
    sourceEvidence: 'H3C14 原创；1E 冻结 PASS',
    options: null,
    mathCheck: 'PASS',
    mathVerified: 'AUTHOR_CHECKED',
    reviewReady: true,
    blockReasons: [],
    hardAudit: 'ACCEPTED_H3',
    round1: 'MATH_PASS',
    round2: 'ACCEPTED_H3',
    compareDowngrade: {
      structureType: f.modelFamily,
      contrast: f.h3Evidence?.aboveHard14H2Contrast || '',
    },
    authorMathNote: 'FROZEN_PASS_FROM_1D',
  }
  // re-bind to verify sha stable
  const bound = bindSha(item)
  if (bound.hardProfile.contentSha256 !== f.contentSha256) {
    throw new Error(`FROZEN_SHA_CHANGED ${f.id}: ${bound.hardProfile.contentSha256} vs ${f.contentSha256}`)
  }
  return bound
})

const newItems = accepted1e.map((r) => toCandidate(r))
const all = [...passItems, ...newItems].sort(
  (a, b) => Number(a.designId.slice(-3)) - Number(b.designId.slice(-3)),
)

// intra dedup
const stems = all.map((c) => normStem(c.stem))
const intraDup = []
for (let i = 0; i < stems.length; i++) {
  for (let j = i + 1; j < stems.length; j++) {
    if (stems[i] && stems[i] === stems[j]) intraDup.push([all[i].id, all[j].id])
  }
}

const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const c of all) ch[c.chapterNo]++
const batchContentSha256 = batchSha(all)
const targetAdd = 34
const added = newItems.length
const status =
  added >= targetAdd && intraDup.length === 0
    ? 'H3_REDESIGN_READY_FOR_PREFLIGHT'
    : added > 0
      ? 'QUALITY_PARTIAL'
      : 'H3_REDESIGN_BLOCKED'

const designs = {
  phase: 'HS-MATH-H3-REDESIGN-1E',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status: 'H3_DESIGN_ACCEPTED_PARTIAL_OR_FULL',
  builtAt: new Date().toISOString(),
  chapterTarget: CHAPTER_TARGET,
  frozenPass8: passItems.map((c) => c.id),
  newAccepted: newItems.map((c) => c.id),
  acceptedCount: all.length,
  designs: all.map((c) => ({
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
    frozenFrom1D: c.authorMathNote === 'FROZEN_PASS_FROM_1D',
  })),
}

const candSrc = `/** H3 redesign 1E offline candidates. Do NOT import without authorization.
 * Frozen PASS8 from 1D + new 1E ACCEPTED_H3 only. Honest underfill.
 */
export const phase = 'HS-MATH-H3-REDESIGN-1E'
export const independence = 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED'
export const status = ${JSON.stringify(status)}
export const batchContentSha256 = ${JSON.stringify(batchContentSha256)}
export const hard14ReferenceSha = ${JSON.stringify(HARD14_BATCH_SHA)}
export const frozenPass8Ids = ${JSON.stringify(passItems.map((c) => c.id))}
export const candidates = ${JSON.stringify(all, null, 2)}
`

fs.writeFileSync(path.join(qb, 'h3_ch1_4_designs.json'), JSON.stringify(designs, null, 2))
fs.writeFileSync(path.join(qb, 'h3_ch1_4_candidates.mjs'), candSrc)

const quality = {
  phase: 'HS-MATH-H3-REDESIGN-1E',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  auditedAt: new Date().toISOString(),
  h3Gate: H3_GATE,
  targetNew: targetAdd,
  frozenPass8: 8,
  designedAttempted: accepted1e.length + 12,
  acceptedNew: added,
  acceptedTotal: all.length,
  rejectedNotH3OrUnstable: 'see _1e_rejected_ledger.json',
  chapterActual: ch,
  chapterTarget: CHAPTER_TARGET,
  passByChapterNew: {
    2: newItems.filter((c) => c.chapterNo === 2).length,
    3: newItems.filter((c) => c.chapterNo === 3).length,
  },
  intraDup,
  batchContentSha256,
  hard14ReferenceSha: HARD14_BATCH_SHA,
  openIssues: [
    'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
    `NEW_ACCEPTED=${added}<${targetAdd} (honest underfill, no H1/H2 fill)`,
    'Requires future STRICT-PREFLIGHT before any import',
  ],
}
fs.writeFileSync(path.join(qb, 'h3_ch1_4_quality_results.json'), JSON.stringify(quality, null, 2))
fs.writeFileSync(path.join(__dirname, '_1e_assemble_out.json'), JSON.stringify(quality, null, 2))

console.log(
  JSON.stringify(
    {
      status,
      frozen: 8,
      added,
      total: all.length,
      chapter: ch,
      newIds: newItems.map((c) => c.id),
      sha: batchContentSha256,
      frozenShaOk: true,
      intraDup: intraDup.length,
    },
    null,
    2,
  ),
)
