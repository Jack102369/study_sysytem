/**
 * Aggregate GLOBAL-1K audit part files → global1k_audit_results.json
 * Run after all _g1k_audit_part_*.json exist.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const cards = JSON.parse(fs.readFileSync(path.join(dir, '_g1k_audit_cards.json'), 'utf8'))
const parts = [
  '_g1k_audit_part_app.json',
  '_g1k_audit_part_single1.json',
  '_g1k_audit_part_single2.json',
  '_g1k_audit_part_judge_num.json',
  '_g1k_audit_part_multi.json',
]

const rows = []
const missingParts = []
for (const p of parts) {
  const fp = path.join(dir, p)
  if (!fs.existsSync(fp)) {
    missingParts.push(p)
    continue
  }
  const arr = JSON.parse(fs.readFileSync(fp, 'utf8'))
  if (!Array.isArray(arr)) throw new Error(`${p} not array`)
  rows.push(...arr)
}

const byCode = new Map()
for (const r of rows) {
  if (byCode.has(r.candidateCode)) {
    console.error('duplicate audit row', r.candidateCode)
  }
  byCode.set(r.candidateCode, r)
}

const expected = cards.map((c) => c.candidateCode)
const unaudited = expected.filter((c) => !byCode.has(c))
const extra = [...byCode.keys()].filter((c) => !expected.includes(c))

const results = expected.map((code) => {
  const card = cards.find((c) => c.candidateCode === code)
  const a = byCode.get(code)
  if (!a) {
    return {
      candidateCode: code,
      itemId: card.itemId,
      contentVersion: card.contentVersion,
      result: 'UNAUDITED',
      independentDerivation: '',
      answerCheck: 'unaudited',
      analysisCheck: 'unaudited',
      rubricCheck: card.qtype === 'application' ? 'unaudited' : 'n/a',
      diagramCheck: card.diagrams?.length ? 'unaudited' : 'n/a',
      duplicateCheck: 'unaudited',
      issues: ['NOT_AUDITED_IN_THIS_RUN'],
    }
  }
  return {
    candidateCode: a.candidateCode,
    itemId: String(a.itemId ?? card.itemId),
    contentVersion: Number(a.contentVersion ?? card.contentVersion),
    result: a.result,
    independentDerivation: a.independentDerivation || '',
    answerCheck: a.answerCheck || '',
    analysisCheck: a.analysisCheck || '',
    rubricCheck: a.rubricCheck ?? (card.qtype === 'application' ? '' : 'n/a'),
    diagramCheck: a.diagramCheck ?? (card.diagrams?.length ? '' : 'n/a'),
    duplicateCheck: a.duplicateCheck || 'none_noted',
    issues: Array.isArray(a.issues) ? a.issues : [],
  }
})

const counts = results.reduce((acc, r) => {
  acc[r.result] = (acc[r.result] || 0) + 1
  return acc
}, {})

let dup = null
let diagramRejudge = null
const dupPath = path.join(dir, '_g1k_dup_findings.json')
const diagPath = path.join(dir, '_g1k_diagram_rejudge.json')
if (fs.existsSync(dupPath)) dup = JSON.parse(fs.readFileSync(dupPath, 'utf8'))
if (fs.existsSync(diagPath)) diagramRejudge = JSON.parse(fs.readFileSync(diagPath, 'utf8'))

const out = {
  phase: 'HS-MATH-BANK-GLOBAL-1K',
  generatedAt: new Date().toISOString(),
  independenceNote:
    '审核主体与本仓库此前 GLOBAL-1F/1H/1J/配图链路同一助手族系；独立性未充分建立，本结果为二次复核而非第三方独立审计。',
  expectedCount: 100,
  auditedCount: results.filter((r) => r.result !== 'UNAUDITED').length,
  unauditedCodes: unaudited,
  extraCodes: extra,
  missingParts,
  counts,
  criticalCodes: results.filter((r) => r.result === 'CRITICAL').map((r) => r.candidateCode),
  majorCodes: results.filter((r) => r.result === 'MAJOR').map((r) => r.candidateCode),
  minorCodes: results.filter((r) => r.result === 'MINOR').map((r) => r.candidateCode),
  gateFromExport: JSON.parse(
    fs.readFileSync(path.join(dir, '_g1k_export_snapshot.json'), 'utf8'),
  ).gate,
  duplicateFindings: dup,
  diagramRejudge,
  items: results,
}

const dest = path.join(dir, 'global1k_audit_results.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      dest,
      auditedCount: out.auditedCount,
      counts,
      critical: out.criticalCodes,
      major: out.majorCodes,
      minor: out.minorCodes,
      unaudited,
      missingParts,
    },
    null,
    2,
  ),
)
