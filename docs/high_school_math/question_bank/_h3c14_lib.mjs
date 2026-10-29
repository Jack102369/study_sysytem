/**
 * Shared helpers for H3-CH1-4 exclusive batch (offline only).
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const qb = __dirname
export const docs = path.resolve(__dirname, '..')
export const root = path.resolve(__dirname, '../../..')
export const diagDir = path.join(docs, 'diagrams/h3_ch1_4_batch1a')
export const workDir = path.join(qb, 'h3_ch1_4_batch1a')

export const HARD14_BATCH_SHA =
  'd8d22ad0bcbac2dba134d417e6a3db5cd6407f256492155345330ae043025819'
export const TARGET_ACCEPTED = 50
export const CHAPTER_TARGET = { 1: 5, 2: 20, 3: 20, 4: 5 }

export function sha256(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj)
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex')
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

export function batchSha(candidates) {
  return sha256(candidates.map((c) => c.hardProfile.contentSha256).join('|'))
}

export function designToCode(designId) {
  const n = String(designId).match(/(\d+)$/)?.[1]
  return `CAND-H3C14-${String(n).padStart(3, '0')}`
}

export function loadEnv() {
  const env = { ...process.env }
  const p = path.join(root, 'apps/api/.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
}

export function dbConfig(env) {
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'study_system',
  }
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

export function normStem(s) {
  return String(s || '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$]*\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

/** H3 admission checklist — all must be true for ACCEPTED_H3 */
export const H3_GATE = {
  id: 'H3_EXCLUSIVE_GATE_V1',
  mustHave: [
    'nonObviousBreakthrough',
    'aboveHard14H2Contrast',
    'deepStrategyOrLayeredNecessity',
    'reasonableMultiLayerCasesOrStructure',
    'withinCompulsory1Ch1to4',
    'noCalculusNoConic',
  ],
  rejectPatterns: [
    'ordinary_parametric_inequality',
    'routine_quadratic_extrema',
    'simple_discriminant_cases',
    'direct_AMGM',
    'ordinary_hook_function',
    'simple_parity_or_monotonicity',
    'routine_exp_log_simplify',
    'mere_extra_computation',
    'digit_or_skin_swap',
    'low_value_isomorphic_to_HARD14_H2',
  ],
}

export const SECTION_META = {
  '1.1': { name: '集合的概念', kpHint: 'rja.1.1' },
  '1.2': { name: '集合间的基本关系', kpHint: 'rja.1.2' },
  '1.3': { name: '集合的基本运算', kpHint: 'rja.1.3' },
  '1.4': { name: '充分条件与必要条件', kpHint: 'rja.1.4' },
  '1.5': { name: '全称量词与存在量词', kpHint: 'rja.1.5' },
  '2.1': { name: '等式性质与不等式性质', kpHint: 'rja.2.1' },
  '2.2': { name: '基本不等式', kpHint: 'rja.2.2' },
  '2.3': { name: '二次函数与一元二次方程、不等式', kpHint: 'rja.2.3' },
  '3.1': { name: '函数的概念与表示', kpHint: 'rja.3.1' },
  '3.2': { name: '函数的基本性质', kpHint: 'rja.3.2' },
  '3.3': { name: '幂函数', kpHint: 'rja.3.3' },
  '3.4': { name: '函数的应用（一）', kpHint: 'rja.3.4' },
  '4.1': { name: '指数', kpHint: 'rja.4.1' },
  '4.2': { name: '指数函数', kpHint: 'rja.4.2' },
  '4.3': { name: '对数', kpHint: 'rja.4.3' },
  '4.4': { name: '对数函数', kpHint: 'rja.4.4' },
  '4.5': { name: '指数函数与对数函数综合', kpHint: 'rja.4.5' },
}
