/**
 * GLOBAL-4E: adapt candidates-g4a-500 → import protocol JSON.
 * No DB writes.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '_g4e_adapted_items.json')

const NUMERIC_VALUE_RE =
  /^[+-]?(?:\d+(?:\.\d{1,8})?|\.\d{1,8}|\d+\/[1-9]\d*)$/

const { candidates } = await import(
  pathToFileURL(path.join(__dirname, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)

function adaptCandidate(c) {
  if (c.sourceType === 'past_exam' && c.sourceLicenseStatus !== 'permitted') {
    throw new Error(`${c.id}: past_exam without permitted license`)
  }
  const methodCodes = [...new Set([c.methodMain, c.methodAux].filter(Boolean))]
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
    return {
      ...base,
      options: {
        options: Object.entries(c.options || {}).map(([id, text]) => ({
          id,
          text: String(text),
        })),
      },
      answerPayload: { kind: 'single', optionId: String(c.answer).trim() },
    }
  }
  if (c.qtype === 'multi') {
    return {
      ...base,
      options: {
        options: Object.entries(c.options || {}).map(([id, text]) => ({
          id,
          text: String(text),
        })),
      },
      answerPayload: {
        kind: 'multi',
        optionIds: String(c.answer)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
    }
  }
  if (c.qtype === 'judge') {
    let raw = String(c.answer).trim().toLowerCase()
    if (raw === '真' || raw === '对') raw = 'true'
    if (raw === '假' || raw === '错') raw = 'false'
    if (raw !== 'true' && raw !== 'false') {
      throw new Error(`${c.id}: judge answer must be true/false (got ${c.answer})`)
    }
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'judge', value: raw === 'true' },
    }
  }
  if (c.qtype === 'numeric') {
    const value = String(c.answer).trim()
    if (!NUMERIC_VALUE_RE.test(value)) throw new Error(`${c.id}: numeric illegal: ${value}`)
    return {
      ...base,
      options: null,
      answerPayload: { kind: 'numeric', value, toleranceAbs: 0, toleranceRel: 0 },
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
    if (!Number.isInteger(maxScore) || maxScore <= 0) throw new Error(`${c.id}: bad maxScore`)
    if (sum !== maxScore) throw new Error(`${c.id}: rubric sum != maxScore`)
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
  throw new Error(`${c.id}: unsupported qtype`)
}

const errors = []
const adapted = []
for (const c of candidates) {
  try {
    adapted.push(adaptCandidate(c))
  } catch (e) {
    errors.push({ id: c.id, err: String(e.message || e) })
  }
}

fs.writeFileSync(outPath, JSON.stringify(adapted, null, 2))
const sha = crypto.createHash('sha256').update(JSON.stringify(adapted)).digest('hex')
console.log(
  JSON.stringify(
    {
      n: adapted.length,
      errors: errors.length,
      errorSample: errors.slice(0, 10),
      adaptedSha256: sha,
      out: outPath,
    },
    null,
    2,
  ),
)
if (errors.length || adapted.length !== 500) process.exit(2)
