/**
 * Round2 H3 authenticity filter — honest REJECTED_NOT_H3, no H2 fill.
 * Prefers strengthened Ch1/Ch4 pack from _accepted_ch1_ch4.mjs when present.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Round2 KEEP: Ch1/Ch4 packs + full Ch2 wave from strengthened pack + selected Ch3 */
const KEEP = new Set([
  1, 2, 3, 4, 5, // Ch1
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, // Ch2 full wave
  27, 28, 35, 36, 39, 41, 42, 44, // Ch3 (Ch3 draft agent timed out; keep prior ACCEPTED)
  46, 47, 48, 49, 50, // Ch4
])

const REJECT_REASONS = {
  26: 'REJECTED_NOT_H3: forced even too short',
  29: 'REJECTED_NOT_H3: domain singleton H1',
  30: 'REJECTED_NOT_H3: ordinary hook function',
  31: 'REJECTED_NOT_H3: odd/even decomposition H1',
  32: 'REJECTED_NOT_H3: zero count H2',
  33: 'REJECTED_NOT_H3: inverse compose H2',
  34: 'REJECTED_NOT_H3: finite-set mapping not H3 analysis',
  37: 'REJECTED_NOT_H3: abs min on interval H2',
  38: 'REJECTED_NOT_H3: odd endpoint H2',
  40: 'REJECTED_NOT_H3: g even from f(-x) H2',
  43: 'REJECTED_NOT_H3: power compare on (0,1) H2',
  45: 'REJECTED_NOT_H3: application max thin / not H3 ceiling',
}

function stripAppWrapperFields(it) {
  // appItem adds fields; keep raw-compatible shape for assemble
  const {
    book,
    specialtyCode,
    difficulty,
    hardLevel,
    sourceType,
    sourceEvidence,
    mathCheck,
    mathVerified,
    reviewReady,
    hardAudit,
    round1,
    round2,
    ...rest
  } = it
  return {
    ...rest,
    hardAudit: 'ACCEPTED_H3',
    round1: 'MATH_PASS',
    round2: 'ACCEPTED_H3',
  }
}

const byN = new Map()

async function loadArr(file, keys) {
  const p = path.join(__dirname, file)
  if (!fs.existsSync(p)) return
  const m = await import(pathToFileURL(p).href + '?t=' + Date.now())
  for (const k of keys) {
    if (!Array.isArray(m[k])) continue
    for (const it of m[k]) {
      if (it == null || it.n == null) continue
      byN.set(it.n, it) // later loads override
    }
  }
}

// Base chapter modules, then strengthened Ch1/Ch4 overrides
await loadArr('_accepted_ch1.mjs', ['acceptedCh1'])
await loadArr('_accepted_ch2.mjs', ['acceptedCh2'])
await loadArr('_accepted_ch3.mjs', ['acceptedCh3'])
await loadArr('_accepted_ch4.mjs', ['acceptedCh4'])
await loadArr('_accepted_ch1_ch4.mjs', ['acceptedCh1', 'acceptedCh4'])

const kept = []
const rejected = []
for (const [n, it] of [...byN.entries()].sort((a, b) => a[0] - b[0])) {
  if (it._rebuild || it._needsRebuild) {
    rejected.push({ n, reason: 'DRAFT_REBUILD', chapterNo: it.chapterNo })
    continue
  }
  if (KEEP.has(n)) {
    const ev = it.h3Evidence || {}
    if (
      !ev.nonObviousBreakthrough ||
      !ev.aboveHard14H2Contrast ||
      !ev.deepStrategyOrLayeredNecessity
    ) {
      rejected.push({ n, reason: 'H3_EVIDENCE_INCOMPLETE', chapterNo: it.chapterNo })
      continue
    }
    if (!it.analysis || String(it.analysis).length < 40) {
      rejected.push({ n, reason: 'THIN_ANALYSIS', chapterNo: it.chapterNo })
      continue
    }
    kept.push(stripAppWrapperFields(it))
  } else {
    rejected.push({
      n,
      reason: REJECT_REASONS[n] || 'REJECTED_NOT_H3: below H3 gate',
      chapterNo: it.chapterNo,
      modelFamily: it.modelFamily,
    })
  }
}

const ch = { 1: 0, 2: 0, 3: 0, 4: 0 }
for (const k of kept) ch[k.chapterNo]++

fs.writeFileSync(
  path.join(__dirname, '_accepted_final.mjs'),
  '/** Dual-gate ACCEPTED_H3 only (incl. strengthened Ch1/Ch4) */\nexport const acceptedFinal = ' +
    JSON.stringify(kept, null, 2) +
    '\n',
)
fs.writeFileSync(
  path.join(__dirname, '_rejected_ledger.json'),
  JSON.stringify(
    {
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      keptN: kept.length,
      rejectedN: rejected.length,
      chapterKept: ch,
      sourceNote: 'Ch1/Ch4 prefer _accepted_ch1_ch4.mjs when present',
      rejected,
      note: '不足H3不得降为H2填本批；仅ACCEPTED_H3计入合格',
    },
    null,
    2,
  ),
)
console.log(JSON.stringify({ kept: kept.length, rejected: rejected.length, chapterKept: ch }, null, 2))
