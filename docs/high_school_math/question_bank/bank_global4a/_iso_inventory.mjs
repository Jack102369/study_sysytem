/**
 * ISOMORPHIC-FINAL-CLEANUP step1: precise inventory of prior-structure hits + batch families.
 * Read-only over candidates; writes _iso_inventory.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { normStem, normExact, CRUTCH_RE } from './_rebuild_core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const candMod = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = candMod.candidates
const byId = new Map(candidates.map((c) => [c.id, c]))

const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
// prior.stemsNorm is already lightly cleaned; apply full normStem for fair compare
const priorEntries = (prior.stemsNorm || []).map((s, i) => {
  const exact = normExact(s)
  const struct = normStem(s)
  return { idx: i, raw: s, exact, struct }
})
const priorStructMap = new Map() // struct -> [priorEntries]
for (const p of priorEntries) {
  if (!priorStructMap.has(p.struct)) priorStructMap.set(p.struct, [])
  priorStructMap.get(p.struct).push(p)
}
const priorExactSet = new Set(priorEntries.map((p) => p.exact))

function meta(c) {
  return {
    id: c.id,
    chapterNo: c.chapterNo,
    qtype: c.qtype,
    difficulty: c.difficulty,
    kpCode: c.kpCode,
    methodMain: c.methodMain,
    methodAux: c.methodAux,
    stemPreview: String(c.stem || '').slice(0, 160).replace(/\n/g, ' '),
  }
}

// --- prior structure hits ---
const priorHits = []
for (const c of candidates) {
  const st = normStem(c.stem)
  const ex = normExact(c.stem)
  const hits = priorStructMap.get(st) || []
  if (hits.length) {
    priorHits.push({
      candidate: meta(c),
      exactPriorHit: priorExactSet.has(ex),
      struct: st.slice(0, 120),
      priorMatches: hits.slice(0, 3).map((h) => ({
        priorIdx: h.idx,
        priorPreview: String(h.raw).slice(0, 120),
      })),
      mathModelHint: inferModel(c),
      solutionHint: String(c.analysis || '').slice(0, 120).replace(/\n/g, ' '),
    })
  }
}

// --- batch structure families ---
const structMap = new Map()
for (const c of candidates) {
  const st = normStem(c.stem)
  if (!structMap.has(st)) structMap.set(st, [])
  structMap.get(st).push(c.id)
}

const families = []
let famIdx = 0
for (const [st, ids] of structMap) {
  if (ids.length < 2) continue
  famIdx++
  const members = ids.map((id) => {
    const c = byId.get(id)
    return {
      ...meta(c),
      mathModelHint: inferModel(c),
      solutionHint: String(c.analysis || '').slice(0, 100).replace(/\n/g, ' '),
    }
  })
  // same chapter+qtype+difficulty → higher risk of LOW_VALUE
  const chSet = new Set(members.map((m) => m.chapterNo))
  const qtSet = new Set(members.map((m) => m.qtype))
  const dSet = new Set(members.map((m) => m.difficulty))
  const kpSet = new Set(members.map((m) => m.kpCode))
  families.push({
    familyId: `BATCH-FAM-${String(famIdx).padStart(3, '0')}`,
    size: ids.length,
    structPreview: st.slice(0, 100),
    sameChapter: chSet.size === 1,
    sameQtype: qtSet.size === 1,
    sameDifficulty: dSet.size === 1,
    sameKp: kpSet.size === 1,
    chapters: [...chSet],
    qtypes: [...qtSet],
    difficulties: [...dSet],
    memberIds: ids,
    members,
  })
}
families.sort((a, b) => b.size - a.size || a.memberIds[0].localeCompare(b.memberIds[0]))

// overlap analysis
const priorIds = new Set(priorHits.map((h) => h.candidate.id))
const batchIds = new Set(families.flatMap((f) => f.memberIds))
const multiFamily = new Map() // id -> familyIds
for (const f of families) {
  for (const id of f.memberIds) {
    if (!multiFamily.has(id)) multiFamily.set(id, [])
    multiFamily.get(id).push(f.familyId)
  }
}
const inBoth = [...priorIds].filter((id) => batchIds.has(id))
const unionIds = new Set([...priorIds, ...batchIds])

// exact batch dups
const exactMap = new Map()
for (const c of candidates) {
  const ex = normExact(c.stem)
  if (!exactMap.has(ex)) exactMap.set(ex, [])
  exactMap.get(ex).push(c.id)
}
const exactDupFamilies = [...exactMap.values()].filter((ids) => ids.length >= 2)

// crutch
const crutchIds = candidates.filter((c) => CRUTCH_RE.test(c.stem + (c.analysis || ''))).map((c) => c.id)

function inferModel(c) {
  const s = String(c.stem || '')
  if (/证明|prove/i.test(s)) return 'proof'
  if (/分类|讨论|参数/.test(s)) return 'param_case'
  if (/最大|最小|最值/.test(s)) return 'extremum'
  if (/概率|抽样|样本/.test(s)) return 'probability_stat'
  if (/向量|投影|夹角/.test(s)) return 'vector'
  if (/复数|虚数/.test(s)) return 'complex'
  if (/棱柱|圆锥|圆柱|球|平面/.test(s)) return 'solid_geo'
  if (/三角函数|正弦|余弦|正切|弧度/.test(s)) return 'trig'
  if (/指数|对数|幂/.test(s)) return 'exp_log'
  if (/奇函数|偶函数|单调/.test(s)) return 'fn_property'
  if (/不等式|集合|充分|必要/.test(s)) return 'set_logic_ineq'
  return 'general'
}

const report = {
  batch: 'GLOBAL-4A-ISOMORPHIC-FINAL-CLEANUP',
  phase: 'INVENTORY',
  generatedAt: new Date().toISOString(),
  totals: {
    candidates: candidates.length,
    priorStructHitCount: priorHits.length,
    priorExactHitCount: priorHits.filter((h) => h.exactPriorHit).length,
    batchStructFamilyCount: families.length,
    batchStructMemberDistinct: batchIds.size,
    batchExactDupFamilies: exactDupFamilies.length,
    candidatesInBothPriorAndBatch: inBoth.length,
    unionDistinctCandidatesInvolved: unionIds.size,
    crutchLeft: crutchIds.length,
    familySizeHistogram: hist(families.map((f) => f.size)),
  },
  priorHits,
  families,
  overlap: {
    priorOnly: [...priorIds].filter((id) => !batchIds.has(id)).sort(),
    batchOnly: [...batchIds].filter((id) => !priorIds.has(id)).sort(),
    both: inBoth.sort(),
    multiFamilyIds: [...multiFamily.entries()]
      .filter(([, fs]) => fs.length > 1)
      .map(([id, fs]) => ({ id, families: fs })),
  },
  exactDupFamilies,
  crutchIds,
}

function hist(sizes) {
  const h = {}
  for (const s of sizes) h[s] = (h[s] || 0) + 1
  return h
}

const out = path.join(__dirname, '_iso_inventory.json')
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(
  JSON.stringify(
    {
      priorHits: report.totals.priorStructHitCount,
      families: report.totals.batchStructFamilyCount,
      batchMembers: report.totals.batchStructMemberDistinct,
      union: report.totals.unionDistinctCandidatesInvolved,
      both: report.totals.candidatesInBothPriorAndBatch,
      exactDupFam: report.totals.batchExactDupFamilies,
      crutch: report.totals.crutchLeft,
      hist: report.totals.familySizeHistogram,
      out,
    },
    null,
    2,
  ),
)
