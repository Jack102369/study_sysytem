/**
 * ISOMORPHIC-FINAL-CLEANUP apply (up to 3 rounds):
 * classify → keep best → replace LOW_VALUE/SEMANTIC/EXACT → rewrite groups+merge
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { normStem, normExact, CRUTCH_RE } from './_rebuild_core.mjs'
import { buildDistinct, classifyFamily } from './_iso_distinct_pool.mjs'
import { buildEmergency } from './_iso_emergency.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const MAX_ROUNDS = 3

const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const priorEntries = (prior.stemsNorm || []).map((s, i) => ({
  idx: i,
  raw: s,
  exact: normExact(s),
  struct: normStem(s),
}))
const priorStructMap = new Map()
for (const p of priorEntries) {
  if (!priorStructMap.has(p.struct)) priorStructMap.set(p.struct, [])
  priorStructMap.get(p.struct).push(p)
}
const priorExactSet = new Set(priorEntries.map((p) => p.exact))

function loadCandidates() {
  return import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()).then(
    (m) => m.candidates.map((c) => ({ ...c })),
  )
}

function slotFrom(c) {
  return {
    id: c.id,
    book: c.book,
    chapterNo: c.chapterNo,
    specialtyCode: c.specialtyCode,
    qtype: c.qtype,
    difficulty: c.difficulty,
    kpHint: { code: c.kpCode, name: c.kpName },
  }
}

function rebuildUsed(candidates) {
  // Chapter-scoped struct keys for batch; raw prior structs kept for prior collision checks.
  const usedStruct = new Set()
  const usedExact = new Set(priorExactSet)
  for (const p of priorEntries) {
    usedStruct.add(`prior|${p.struct}`)
  }
  for (const c of candidates) {
    usedStruct.add(`${c.chapterNo}|${normStem(c.stem)}`)
    usedExact.add(normExact(c.stem))
  }
  return { usedStruct, usedExact }
}

function inventory(candidates) {
  const byId = new Map(candidates.map((c) => [c.id, c]))
  // Chapter-scoped structure families: same digit-stripped stem across chapters
  // is handled by nonsense/chapterMismatch replacement, not as one mega-family.
  const structMap = new Map()
  for (const c of candidates) {
    const st = `${c.chapterNo}|${normStem(c.stem)}`
    if (!structMap.has(st)) structMap.set(st, [])
    structMap.get(st).push(c.id)
  }
  const families = []
  let i = 0
  for (const [st, ids] of structMap) {
    if (ids.length < 2) continue
    i++
    const members = ids.map((id) => {
      const c = byId.get(id)
      return {
        id,
        chapterNo: c.chapterNo,
        qtype: c.qtype,
        difficulty: c.difficulty,
        kpCode: c.kpCode,
        stemPreview: String(c.stem).slice(0, 100).replace(/\n/g, ' '),
      }
    })
    families.push({
      familyId: `BATCH-FAM-${String(i).padStart(3, '0')}`,
      size: ids.length,
      structPreview: st.slice(0, 100),
      memberIds: ids,
      members,
    })
  }
  const priorHits = []
  for (const c of candidates) {
    const st = normStem(c.stem)
    const hits = priorStructMap.get(st) || []
    if (hits.length) {
      priorHits.push({
        id: c.id,
        chapterNo: c.chapterNo,
        qtype: c.qtype,
        difficulty: c.difficulty,
        kpCode: c.kpCode,
        exact: priorExactSet.has(normExact(c.stem)),
        priorPreview: hits[0].raw.slice(0, 100),
        stemPreview: String(c.stem).slice(0, 100).replace(/\n/g, ' '),
      })
    }
  }
  return { families, priorHits, structMap }
}

function isNonsenseTemplate(stem) {
  return (
    /已知参数\s*\$?p/.test(stem) ||
    /则\s*\$?p\+\$?q\+/.test(stem) ||
    /多选；章\s*\d/.test(stem) ||
    /章\s*\d\s*专项/.test(stem) ||
    /研究需要/.test(stem) ||
    /正整数参数\s*\$?k/.test(stem) ||
    /整数\s*\$?\d+\s*与\s*\$?\d+\s*的差等于/.test(stem) ||
    /n\^\{2\}-\(n-1\)\^\{2\}/.test(stem)
  )
}

function chapterMismatch(c) {
  const st = String(c.stem)
  // vector templates on non-ch6
  if (c.chapterNo !== 6 && /\\vec|向量|\\vec u|\\vec v|\\vec p|\\vec q/.test(st) && /\|.*\+\s*.*\|/.test(st))
    return true
  // AM-GM x+k/x forced onto non-ch2 as only content with "章 X" wrapper
  if (/（章\s*\d）/.test(st) && c.chapterNo !== 2) return true
  if (isNonsenseTemplate(st)) return true
  return false
}

function classifyPriorHit(h, c) {
  if (h.exact) return { verdict: 'EXACT_DUPLICATE', reason: '与既有题干规范化后完全一致' }
  // i^n vs i^2 — same skill of powers of i cycling
  if (/mathrm\{i\}\^|i\^/.test(c.stem) && /i\^/.test(h.priorPreview)) {
    return {
      verdict: 'SEMANTIC_DUPLICATE',
      reason: '同为虚数单位幂次求值，仅指数不同，关键仍是四周期',
    }
  }
  if (/正方体体积/.test(c.stem) && /正方体体积/.test(h.priorPreview)) {
    return { verdict: 'SEMANTIC_DUPLICATE', reason: '同为正方体体积 V=a³，仅棱长数字不同' }
  }
  if (/\|.*\\mathrm\{i\}\|=|\\vec a=\(/.test(c.stem) && (/\|.*=/.test(h.priorPreview) || /a=\(/.test(h.priorPreview))) {
    return { verdict: 'SEMANTIC_DUPLICATE', reason: '同为模长公式代入，仅分量数字不同' }
  }
  if (/f\(x\)\+f\(-x\)=0/.test(c.stem) && /f\(x\)\+f\(-x\)=0/.test(h.priorPreview)) {
    return {
      verdict: 'SEMANTIC_DUPLICATE',
      reason: '同为“由奇性+正向解析式求负向值”，仅参数不同',
    }
  }
  if (/独立事件/.test(c.stem) && /独立事件/.test(h.priorPreview)) {
    if (/A\\cup B|A\\\\cup B|并/.test(c.stem) && /p\(ab\)|交/.test(h.priorPreview)) {
      return {
        verdict: 'ACCEPTABLE_VARIANT',
        reason: '既有题求独立事件交概率；本题求并事件概率，需 P(A)+P(B)-P(A)P(B)，考查目标不同',
      }
    }
    return { verdict: 'SEMANTIC_DUPLICATE', reason: '独立事件概率仅数字替换' }
  }
  return { verdict: 'SEMANTIC_DUPLICATE', reason: '数字抹平后与既有题结构范型相同且无新考查点' }
}

function pickKeep(family, byId) {
  const cls = classifyFamily(family.members, family.structPreview)
  const ids = family.memberIds
  // Never keep nonsense templates
  const viable = ids.filter((id) => !chapterMismatch(byId.get(id)))
  if (!viable.length) return { keepId: null, verdict: 'LOW_VALUE_ISOMORPHIC', reason: '族内均为跨章模板/无教学价值克隆' }
  // prefer d3 with matching chapter content
  const d3 = viable.filter((id) => byId.get(id).difficulty === 3)
  if (d3.length) return { keepId: d3[0], verdict: cls.verdict || 'LOW_VALUE_ISOMORPHIC', reason: cls.reason || '同构族保留最高难度可用题' }
  return { keepId: viable[0], verdict: cls.verdict || 'SEMANTIC_DUPLICATE', reason: cls.reason || '同构族保留首个可用题' }
}

function tryReplace(c, usedStruct, usedExact, salt0 = 0) {
  const st0 = `${c.chapterNo}|${normStem(c.stem)}`
  const ex0 = normExact(c.stem)
  usedStruct.delete(st0)
  usedExact.delete(ex0)
  // Adapter sets: buildDistinct expects raw normStem keys; map chapter-scoped.
  const rawStruct = new Set(
    [...usedStruct]
      .filter((k) => k.startsWith(`${c.chapterNo}|`) || k.startsWith('prior|'))
      .map((k) => k.replace(/^(?:\d+\||prior\|)/, '')),
  )
  function commit(r) {
    if (!r || CRUTCH_RE.test(r.item.stem)) return null
    const stRaw = normStem(r.item.stem)
    const st = `${c.chapterNo}|${stRaw}`
    const ex = normExact(r.item.stem)
    if (usedStruct.has(st) || usedExact.has(ex)) return null
    if (usedStruct.has(`prior|${stRaw}`)) return null
    r.item.id = c.id
    r.item.chapterNo = c.chapterNo
    r.item.specialtyCode = c.specialtyCode
    r.item.kpCode = c.kpCode
    r.item.kpName = c.kpName
    r.item.qtype = c.qtype
    r.item.difficulty = c.difficulty
    r.item.book = c.book
    usedStruct.add(st)
    usedExact.add(ex)
    rawStruct.add(stRaw)
    return r
  }
  for (let s = 0; s < 8; s++) {
    const r = commit(buildDistinct(slotFrom(c), salt0 + s * 13, rawStruct, usedExact))
    if (r) return r
  }
  for (let s = 0; s < 16; s++) {
    const r = commit(buildEmergency(slotFrom(c), salt0 + s * 19 + parseInt(c.id.slice(-3), 10), rawStruct, usedExact))
    if (r) return r
  }
  usedStruct.add(st0)
  usedExact.add(ex0)
  return null
}

function writeOutputs(candidates, evidences, stats) {
  candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
  for (let g = 1; g <= 5; g++) {
    const part = candidates.filter((c) => {
      const n = parseInt(c.id.slice(-3), 10)
      return n >= (g - 1) * 100 + 1 && n <= g * 100
    })
    fs.writeFileSync(
      path.join(__dirname, `g4a_group0${g}.mjs`),
      `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`,
    )
  }
  fs.writeFileSync(
    path.join(root, 'candidates-g4a-500.mjs'),
    `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`,
  )
  fs.writeFileSync(path.join(__dirname, '_iso_apply_stats.json'), JSON.stringify(stats, null, 2))
  // merge evidences into quality rebuild results lightly
  const evPath = path.join(root, 'global4a_quality_rebuild_results.json')
  let evData = { evidences: [] }
  if (fs.existsSync(evPath)) {
    try {
      evData = JSON.parse(fs.readFileSync(evPath, 'utf8'))
    } catch {
      evData = { evidences: [] }
    }
  }
  const evMap = new Map((evData.evidences || []).map((e) => [e.id, e]))
  for (const e of evidences) evMap.set(e.id, e)
  evData.evidences = [...evMap.values()]
  evData.isoCleanupUpdatedAt = new Date().toISOString()
  fs.writeFileSync(evPath, JSON.stringify(evData, null, 2))
}

const candidates = await loadCandidates()
const byId = new Map(candidates.map((c) => [c.id, c]))
const evidences = []
const stats = {
  batch: 'GLOBAL-4A-ISOMORPHIC-FINAL-CLEANUP',
  rounds: [],
  replacedIds: [],
  failedReplace: [],
  priorVerdicts: [],
  familyVerdicts: [],
  acceptableKept: [],
}

// Initial classification snapshot
const inv0 = inventory(candidates)
for (const h of inv0.priorHits) {
  const c = byId.get(h.id)
  const v = classifyPriorHit(h, c)
  stats.priorVerdicts.push({ ...h, ...v })
}
for (const f of inv0.families) {
  const pk = pickKeep(f, byId)
  stats.familyVerdicts.push({
    familyId: f.familyId,
    size: f.size,
    structPreview: f.structPreview,
    memberIds: f.memberIds,
    keepId: pk.keepId,
    verdict: pk.verdict,
    reason: pk.reason,
  })
}

let round = 0
while (round < MAX_ROUNDS) {
  round++
  const inv = inventory(candidates)
  const replaceIds = new Set()
  const keepIds = new Set()
  const roundFam = []

  for (const f of inv.families) {
    const pk = pickKeep(f, byId)
    roundFam.push({ familyId: f.familyId, size: f.size, keepId: pk.keepId, verdict: pk.verdict })
    if (pk.verdict === 'ACCEPTABLE_VARIANT' || pk.verdict === 'DISTINCT') {
      // keep all if somehow acceptable — but classifyFamily won't return ACCEPTABLE; treat as keep one
      if (pk.keepId) keepIds.add(pk.keepId)
      for (const id of f.memberIds) if (id !== pk.keepId) replaceIds.add(id)
      continue
    }
    if (pk.keepId) keepIds.add(pk.keepId)
    else {
      // replace entire family
      for (const id of f.memberIds) replaceIds.add(id)
      continue
    }
    for (const id of f.memberIds) {
      if (id !== pk.keepId) replaceIds.add(id)
    }
  }

  // prior hits: replace unless ACCEPTABLE/DISTINCT
  for (const h of inv.priorHits) {
    const c = byId.get(h.id)
    const v = classifyPriorHit(h, c)
    if (v.verdict === 'ACCEPTABLE_VARIANT' || v.verdict === 'DISTINCT') {
      stats.acceptableKept.push({ id: h.id, ...v })
      continue
    }
    replaceIds.add(h.id)
  }

  // also force-replace remaining nonsense even if singleton
  for (const c of candidates) {
    if (chapterMismatch(c)) replaceIds.add(c.id)
  }

  if (!replaceIds.size) {
    stats.rounds.push({ round, replaced: 0, familiesLeft: inv.families.length, priorHitsLeft: inv.priorHits.length, stop: 'clean' })
    break
  }

  const { usedStruct, usedExact } = rebuildUsed(candidates)
  // free slots being replaced
  for (const id of replaceIds) {
    const c = byId.get(id)
    usedStruct.delete(`${c.chapterNo}|${normStem(c.stem)}`)
    usedExact.delete(normExact(c.stem))
  }

  let replaced = 0
  let failed = 0
  const sortedIds = [...replaceIds].sort()
  console.log(`round ${round}: replacing ${sortedIds.length} ...`)
  for (let i = 0; i < sortedIds.length; i++) {
    const id = sortedIds[i]
    const c = byId.get(id)
    const r = tryReplace(c, usedStruct, usedExact, round * 17 + parseInt(id.slice(-3), 10))
    if (!r) {
      failed++
      stats.failedReplace.push(id)
      if (failed <= 5) console.log('  fail', id)
      continue
    }
    Object.assign(c, r.item)
    r.evidence.dedupVerdict = `iso-cleanup round${round} replaced`
    r.evidence.rebuildAction = 'iso-replace'
    evidences.push(r.evidence)
    stats.replacedIds.push(id)
    replaced++
    if ((i + 1) % 50 === 0) console.log(`  progress ${i + 1}/${sortedIds.length}`)
  }

  stats.rounds.push({
    round,
    replaceRequested: replaceIds.size,
    replaced,
    failed,
    familiesBefore: inv.families.length,
    priorHitsBefore: inv.priorHits.length,
  })

  if (failed && replaced === 0) break
}

const invF = inventory(candidates)
stats.final = {
  families: invF.families.length,
  familySizes: invF.families.map((f) => f.size),
  priorHits: invF.priorHits.length,
  priorHitIds: invF.priorHits.map((h) => h.id),
  replacedUnique: [...new Set(stats.replacedIds)].length,
  crutch: candidates.filter((c) => CRUTCH_RE.test(c.stem)).map((c) => c.id),
}

writeOutputs(candidates, evidences, stats)
console.log(
  JSON.stringify(
    {
      rounds: stats.rounds,
      replacedUnique: stats.final.replacedUnique,
      familiesLeft: stats.final.families,
      priorHitsLeft: stats.final.priorHits,
      failed: stats.failedReplace.length,
      acceptable: stats.acceptableKept.length,
    },
    null,
    2,
  ),
)
