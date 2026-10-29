/**
 * Append Ch3-1C ACCEPTED_H3 into _accepted_final.mjs without mutating baseline 38.
 * Then caller should run ../_h3c14_assemble.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const finalPath = path.join(__dirname, '_accepted_final.mjs')
const { acceptedFinal } = await import(pathToFileURL(finalPath).href + '?t=' + Date.now())
const { acceptedCh3_1c } = await import(
  pathToFileURL(path.join(__dirname, '_accepted_ch3_1c.mjs')).href + '?t=' + Date.now()
)

const baselineIds = acceptedFinal.map((x) => `CAND-H3C14-${String(x.n).padStart(3, '0')}`)
if (acceptedFinal.length !== 38) {
  throw new Error(`baseline expected 38, got ${acceptedFinal.length}`)
}
const existingN = new Set(acceptedFinal.map((x) => x.n))
const add = []
for (const it of acceptedCh3_1c) {
  if (existingN.has(it.n)) throw new Error(`collision n=${it.n}`)
  // strip reject-only fields; keep assemble-compatible shape
  const {
    breakthrough,
    contrastH2,
    deep,
    routine,
    rejectReason,
    ...rest
  } = it
  add.push({
    ...rest,
    hardAudit: 'ACCEPTED_H3',
    round1: 'MATH_PASS',
    round2: 'ACCEPTED_H3',
    h3Evidence: it.h3Evidence,
  })
}

const merged = [...acceptedFinal, ...add].sort((a, b) => a.n - b.n)
fs.writeFileSync(
  finalPath,
  '/** Dual-gate ACCEPTED_H3 only (baseline 38 + Ch3-1C append) */\nexport const acceptedFinal = ' +
    JSON.stringify(merged, null, 2) +
    '\n',
)

const rejPath = path.join(__dirname, '_rejected_ledger.json')
const ledger = JSON.parse(fs.readFileSync(rejPath, 'utf8'))
const list = Array.isArray(ledger) ? ledger : ledger.rejected || []
const ch3_1c_rejects = [
  { n: 53, reason: 'REJECTED_NOT_H3: simple_parity_or_monotonicity / textbook period+mono', chapterNo: 3 },
  { n: 54, reason: 'REJECTED_NOT_H3: domain equality H1/H2', chapterNo: 3 },
  { n: 55, reason: 'REJECTED_NOT_H3: ordinary fractional mono', chapterNo: 3 },
  { n: 57, reason: 'REJECTED_NOT_H3: 3-point quadratic fit is routine algebra', chapterNo: 3 },
  { n: 61, reason: 'REJECTED_NOT_H3: compose mono table is textbook restatement', chapterNo: 3 },
  { n: 62, reason: 'REJECTED_NOT_H3: without continuity only uniqueness — H2', chapterNo: 3 },
]
const seen = new Set(list.map((r) => r.n))
for (const r of ch3_1c_rejects) {
  if (!seen.has(r.n)) list.push(r)
}
const outLedger = Array.isArray(ledger)
  ? list
  : { ...ledger, rejected: list, ch3_1c_appended: add.map((x) => x.n), updatedAt: new Date().toISOString() }
fs.writeFileSync(rejPath, JSON.stringify(outLedger, null, 2))

fs.writeFileSync(
  path.join(__dirname, '_ch3_1c_append_meta.json'),
  JSON.stringify(
    {
      baselineN: 38,
      baselineIds,
      appendedN: add.map((x) => x.n),
      appendedIds: add.map((x) => `CAND-H3C14-${String(x.n).padStart(3, '0')}`),
      total: merged.length,
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      baseline: 38,
      appended: add.map((x) => x.n),
      total: merged.length,
    },
    null,
    2,
  ),
)
