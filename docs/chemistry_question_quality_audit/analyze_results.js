'use strict'
const path = require('path')
const OUT = __dirname
const p = require(path.join(OUT, 'per_item_results.json'))
const fix = require(path.join(OUT, 'needs_fix.json'))
const ver = require(path.join(OUT, 'needs_verification.json'))
const dup = require(path.join(OUT, 'duplicate_groups.json'))
const cov = require(path.join(OUT, 'category_coverage.json'))
const sum = require(path.join(OUT, 'audit_summary.json'))

const fields = {}
const problems = {}
for (const x of p.results) {
  for (const i of x.issues) {
    fields[i.field] = (fields[i.field] || 0) + 1
    const k = i.problem.slice(0, 60)
    problems[k] = (problems[k] || 0) + 1
  }
}
const topProblems = Object.entries(problems)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)

const byQ = { single: {}, judge: {}, blank: {} }
for (const x of p.results) {
  byQ[x.qtype] = byQ[x.qtype] || {}
  byQ[x.qtype][x.conclusion] = (byQ[x.qtype][x.conclusion] || 0) + 1
}

const answerIssues = p.results.filter((x) =>
  x.issues.some((i) => i.field === 'answer' || /标准答案|答案/.test(i.problem)),
)
const diffIssues = p.results.filter((x) =>
  x.issues.some((i) => i.field === 'difficulty'),
)
const catIssues = p.results.filter((x) =>
  x.issues.some((i) => i.field === 'category' || i.field === 'specialty'),
)
const redoxIssues = p.results.filter((x) =>
  x.issues.some((i) => i.field === 'redox'),
)
const formulaIssues = p.results.filter((x) =>
  x.issues.some((i) => i.field === 'answer_type' || /化学式/.test(i.problem)),
)

const phaseA = p.results.filter((x) => x.isPhaseA)
const phaseAConc = { PASS: 0, NEEDS_FIX: 0, NEEDS_VERIFICATION: 0 }
for (const x of phaseA) phaseAConc[x.conclusion]++

const activeFix = fix.results.filter((x) => x.isActive)
const activeVer = ver.results.filter((x) => x.isActive)

const out = {
  fields,
  topProblems,
  byQtypeConclusion: byQ,
  answerIssueItems: answerIssues.length,
  answerIssueCodes: answerIssues.slice(0, 15).map((x) => ({
    code: x.code,
    problems: x.issues.filter((i) => i.field === 'answer').map((i) => i.problem),
  })),
  difficultyIssueItems: diffIssues.length,
  categoryIssueItems: catIssues.length,
  redoxIssueItems: redoxIssues.length,
  formulaIssueItems: formulaIssues.length,
  phaseA: { total: phaseA.length, ...phaseAConc },
  activeNeedsFix: activeFix.length,
  activeNeedsVer: activeVer.length,
  duplicateGroups: dup.count,
  categoriesWithActive: cov.categoriesWithActive,
  summary: sum.byConclusion,
}
console.log(JSON.stringify(out, null, 2))
