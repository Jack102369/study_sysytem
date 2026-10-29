/**
 * Shared helpers for HARD14 candidate batch (offline only).
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const qb = __dirname
export const docs = path.resolve(__dirname, '..')
export const diagDir = path.join(docs, 'diagrams/hard_ch1_4_batch1a')

export function sha256(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj)
  return crypto.createHash('sha256').update(s).digest('hex')
}

export function contentPayload(c) {
  return {
    id: c.id,
    qtype: c.qtype,
    stem: c.stem,
    options: c.options ?? null,
    answer: c.answer,
    analysis: c.analysis,
    difficulty: c.difficulty,
    maxScore: c.maxScore ?? null,
    rubric: c.rubric ?? null,
    kpCode: c.kpCode,
    methodMain: c.methodMain,
  }
}

export function bindSha(c) {
  const contentSha256 = sha256(contentPayload(c))
  return {
    ...c,
    hardProfile: {
      ...(c.hardProfile || {}),
      contentSha256,
    },
  }
}

export function designToCode(designId) {
  const n = String(designId).match(/(\d+)$/)?.[1]
  return `CAND-HARD14-${String(n).padStart(3, '0')}`
}

export const SECTION_NAMES = {
  '1.1': '集合的概念',
  '1.2': '集合间的基本关系',
  '1.3': '集合的基本运算',
  '1.4': '充分条件与必要条件',
  '1.5': '全称量词与存在量词',
  '2.1': '等式性质与不等式性质',
  '2.2': '基本不等式',
  '2.3': '二次函数与一元二次方程、不等式',
  '3.1': '函数的概念与表示',
  '3.2': '函数的基本性质',
  '3.3': '幂函数',
  '3.4': '函数的应用（一）',
  '4.1': '指数',
  '4.2': '指数函数',
  '4.3': '对数',
  '4.4': '对数函数',
  '4.5': '指数函数与对数函数综合',
}

export const CHAPTER_NO = {
  'rja-ch1': 1,
  'rja-ch2': 2,
  'rja-ch3': 3,
  'rja-ch4': 4,
}

/** Suggested qtype by design index (1-100), adjustable per item. Target ~20/15/5/20/40 */
export function defaultQtype(i, hardLevel) {
  // Prefer application for H2/H3 multi-step; mix others for coverage
  const plan = [
    // 001-010 ch1
    'application','numeric','single','multi','application','numeric','single','judge','application','multi',
    // 011-030
    'application','application','numeric','single','application','multi','numeric','application','single','application',
    'application','numeric','multi','application','single','application','numeric','application','judge','multi',
    // 031-050
    'application','application','numeric','single','application','multi','application','numeric','application','single',
    'application','application','multi','application','numeric','application','single','application','judge','multi',
    // 051-070
    'application','numeric','application','single','application','multi','application','numeric','application','single',
    'application','application','multi','application','numeric','application','single','application','judge','multi',
    // 071-090
    'application','application','numeric','single','application','multi','application','numeric','application','single',
    'application','application','multi','application','numeric','application','single','application','judge','multi',
    // 091-100
    'application','numeric','application','single','application','multi','application','numeric','application','single',
  ]
  let q = plan[i - 1] || 'application'
  if (hardLevel === 'H3' && q === 'judge') q = 'application'
  return q
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}
