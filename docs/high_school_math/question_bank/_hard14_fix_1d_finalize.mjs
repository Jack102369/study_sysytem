import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  candidates,
  batchContentSha256,
  status as candStatus,
} from './hard_ch1_4_batch1a_candidates.mjs'
import {
  fix1dReplacements,
  hardLevelOverrides,
} from './_hard14_fix_1d_replacements.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pass1 = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_pf_math_review_001_050.json'), 'utf8'),
)
const pass2 = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_pf_math_review_051_100.json'), 'utf8'),
)
const items1 = pass1.reviews || pass1
const items2 = pass2.reviews || pass2
const adv = new Set([
  ...items1.filter((r) => r.hardRejudge === 'MODERATE_ONLY').map((r) => r.id),
  ...items2.filter((r) => r.hardRejudge === 'MODERATE_ONLY').map((r) => r.id),
])
const fixed = new Set(Object.keys(fix1dReplacements))
const residualAdv = [...adv].filter((id) => !fixed.has(id)).sort()

const hl = { H1: 0, H2: 0, H3: 0 }
const qt = {}
for (const c of candidates) {
  hl[c.hardLevel] = (hl[c.hardLevel] || 0) + 1
  qt[c.qtype] = (qt[c.qtype] || 0) + 1
}

const mathIssuesOld = [
  'CAND-HARD14-039',
  'CAND-HARD14-073',
  'CAND-HARD14-074',
]
const moderateOld = [
  'CAND-HARD14-026',
  'CAND-HARD14-031',
  'CAND-HARD14-041',
  'CAND-HARD14-065',
  'CAND-HARD14-081',
  'CAND-HARD14-082',
  'CAND-HARD14-085',
]
const numericOld = [
  'CAND-HARD14-026',
  'CAND-HARD14-033',
  'CAND-HARD14-065',
  'CAND-HARD14-073',
  'CAND-HARD14-085',
]

const itemLedger = []
for (const id of new Set([
  ...mathIssuesOld,
  ...moderateOld,
  ...numericOld,
  ...Object.keys(hardLevelOverrides),
  ...residualAdv,
])) {
  const c = candidates.find((x) => x.id === id)
  const types = []
  if (mathIssuesOld.includes(id)) types.push('MATH_ISSUE')
  if (moderateOld.includes(id)) types.push('MODERATE_ONLY')
  if (numericOld.includes(id)) types.push('NUMERIC_PROTOCOL_ERROR')
  if (hardLevelOverrides[id]) types.push('FALSE_H3')
  if (residualAdv.includes(id)) types.push('ADVISORY_MODERATE_RESIDUAL')
  itemLedger.push({
    candidateCode: id,
    newContentSha256: c?.hardProfile?.contentSha256 ?? null,
    problemTypes: types,
    action: fixed.has(id)
      ? 'REBUILT_FULL'
      : hardLevelOverrides[id]
        ? 'H_RELABEL_ONLY'
        : 'ADVISORY_UNCERTAIN_KEEP',
    status: fixed.has(id) || hardLevelOverrides[id] ? 'FIXED' : 'UNCERTAIN',
    hardLevelNow: c?.hardLevel,
    hardAuditNow: c?.hardAudit,
  })
}

const finalStatus =
  residualAdv.length > 0
    ? 'HARD_IMPORT_PREFLIGHT_PARTIAL'
    : 'HARD_IMPORT_PREFLIGHT_PASS'

const ro = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '_hard14_import_preflight_ro_out.json'),
    'utf8',
  ),
)

const openIssues = [
  'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  'TRUE_H3=0 by design honesty',
  'Formal import still unauthorized',
]
if (residualAdv.length) {
  openIssues.push(
    residualAdv.length +
      ' advisory-MODERATE residuals remain UNCERTAIN (block full PASS)',
  )
}

const out = {
  phase: 'HS-MATH-HARD-CH1-4-QUALITY-FIX-1D',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status: finalStatus,
  auditedAt: new Date().toISOString(),
  batchContentSha256,
  candidateAssembleStatus: candStatus,
  rebuiltIds: [...fixed],
  rebuiltCount: fixed.size,
  hRelabelIds: Object.keys(hardLevelOverrides),
  hardDistribution: hl,
  qtypeDistribution: qt,
  mathIssueFixes: {
    '039': 'REBUILT: m(a) classification; answer a≤0 only; H2',
    '073': 'REBUILT: antiperiod model; answer -1; numeric OK',
    '074': 'REBUILT: multi A,B; corrected f(x+4)=f(x)',
  },
  moderateRebuilds: moderateOld,
  numericProtocol: {
    beforeBad: numericOld,
    afterBad: ro.adaptDryRun?.numericProtocolBad || [],
  },
  importDryRun: {
    adaptOk: ro.gateHints?.adaptOk,
    adaptedN: ro.adaptDryRun?.adaptedN,
    dbOk: ro.gateHints?.dbBaselineOk,
    structuralOk: ro.gateHints?.structuralConsistencyOk,
  },
  advisoryResidual: {
    n: residualAdv.length,
    ids: residualAdv,
    note: 'Dual-pass MODERATE flags not fully rebuilt within rounds; UNCERTAIN for PASS gate.',
  },
  itemLedger,
  openIssues,
}

fs.writeFileSync(
  path.join(__dirname, 'hard_ch1_4_quality_fix_results.json'),
  JSON.stringify(out, null, 2),
)

const preflight = {
  phase: 'HS-MATH-HARD-CH1-4-IMPORT-PREFLIGHT-AFTER-1D',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status: finalStatus,
  auditedAt: out.auditedAt,
  afterFix1d: true,
  baseline: ro.dbBaseline,
  snapshot: ro.snapshot,
  consistency: ro.consistency,
  hardDistribution: hl,
  qtypeDistribution: qt,
  mathRecheckNote:
    'P0/P1 rebuilt; residual advisory list not fully cleared → PARTIAL',
  importDryRun: out.importDryRun,
  blockers: residualAdv.length
    ? [
        {
          code: 'ADVISORY_UNCERTAIN',
          n: residualAdv.length,
          idsSample: residualAdv.slice(0, 25),
        },
      ]
    : [],
  openIssues,
  batchContentSha256,
}

fs.writeFileSync(
  path.join(__dirname, 'hard_ch1_4_import_preflight_results.json'),
  JSON.stringify(preflight, null, 2),
)

console.log(
  JSON.stringify(
    {
      finalStatus,
      rebuilt: fixed.size,
      residualAdv: residualAdv.length,
      hl,
      adaptOk: ro.gateHints?.adaptOk,
      batchContentSha256,
    },
    null,
    2,
  ),
)
