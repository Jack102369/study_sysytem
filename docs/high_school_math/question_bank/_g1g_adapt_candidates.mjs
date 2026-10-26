/**
 * GLOBAL-1G：本批专用候选 → 正式导入协议适配器（无 DB 凭据）。
 * 不改变数学含义；仅做字段形状转换。
 */
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { candidates } from './candidates-g1b-100.mjs'

const NUMERIC_VALUE_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/

export function adaptCandidate(c) {
  const methodCodes = [c.methodMain, c.methodAux].filter(Boolean)
  const base = {
    code: String(c.id).trim(),
    specialtyCode: String(c.specialtyCode).trim(),
    categoryCode: String(c.sectionCode).trim(),
    qtype: c.qtype,
    difficulty: Number(c.difficulty),
    stem: String(c.stem),
    analysis: String(c.analysis || '').trim(),
    knowledgePointCodes: [String(c.kpCode).trim()],
    primaryKnowledgePointCode: String(c.kpCode).trim(),
    methodCodes,
    primaryMethodCode: String(c.methodMain).trim(),
    sourceType: c.sourceType || 'original',
    sourceReference: c.sourceEvidence || null,
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
  }

  if (c.qtype === 'single') {
    const options = {
      options: Object.entries(c.options || {}).map(([id, text]) => ({
        id,
        text: String(text),
      })),
    }
    return {
      ...base,
      options,
      answerPayload: { kind: 'single', optionId: String(c.answer).trim() },
    }
  }

  if (c.qtype === 'multi') {
    const options = {
      options: Object.entries(c.options || {}).map(([id, text]) => ({
        id,
        text: String(text),
      })),
    }
    const optionIds = String(c.answer)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      ...base,
      options,
      answerPayload: { kind: 'multi', optionIds },
    }
  }

  if (c.qtype === 'judge') {
    const raw = String(c.answer).trim().toLowerCase()
    if (raw !== 'true' && raw !== 'false') {
      throw new Error(`${c.id}: judge answer must be true/false`)
    }
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'judge', value: raw === 'true' },
    }
  }

  if (c.qtype === 'numeric') {
    const value = String(c.answer).trim()
    if (!NUMERIC_VALUE_RE.test(value)) {
      throw new Error(`${c.id}: numeric value illegal: ${value}`)
    }
    return {
      ...base,
      options: null,
      answerPayload: {
        kind: 'numeric',
        value,
        toleranceAbs: 0,
        toleranceRel: 0,
      },
    }
  }

  if (c.qtype === 'application') {
    const rubric = (c.rubric || []).map((r) => ({
      key: String(r.key).trim(),
      title: String(r.title).trim(),
      maxScore: Number(r.score),
      criteria: String(r.criterion ?? '').trim(),
    }))
    const maxScore = Number(c.maxScore)
    const sum = rubric.reduce((s, x) => s + x.maxScore, 0)
    if (!Number.isInteger(maxScore) || maxScore <= 0) {
      throw new Error(`${c.id}: bad maxScore`)
    }
    if (sum !== maxScore) {
      throw new Error(`${c.id}: rubric sum ${sum} != maxScore ${maxScore}`)
    }
    for (const r of rubric) {
      if (
        !r.key ||
        !r.title ||
        !r.criteria ||
        !Number.isInteger(r.maxScore) ||
        r.maxScore <= 0
      ) {
        throw new Error(`${c.id}: bad rubric item ${r.key}`)
      }
    }
    return {
      ...base,
      options: null,
      answerPayload: {
        kind: 'application',
        standardAnswer: String(c.answer),
        maxScore,
        rubric,
      },
    }
  }

  throw new Error(`${c.id}: unsupported qtype ${c.qtype}`)
}

export function adaptAllCandidates(list = candidates) {
  if (!Array.isArray(list) || list.length !== 100) {
    throw new Error(`expected 100 candidates, got ${list?.length}`)
  }
  const items = list.map(adaptCandidate)
  const codes = items.map((i) => i.code)
  if (new Set(codes).size !== 100) throw new Error('adapted codes not unique')
  return items
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isDirectRun) {
  try {
    const items = adaptAllCandidates()
    const dist = items.reduce(
      (a, i) => {
        a.qtype[i.qtype] = (a.qtype[i.qtype] || 0) + 1
        a.diff[i.difficulty] = (a.diff[i.difficulty] || 0) + 1
        return a
      },
      { qtype: {}, diff: {} },
    )
    console.log(
      JSON.stringify(
        { ok: true, n: items.length, dist, sampleCode: items[0].code },
        null,
        2,
      ),
    )
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
