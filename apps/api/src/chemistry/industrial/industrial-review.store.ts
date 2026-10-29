import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'fs'
import { join } from 'path'
import type { IndustrialReviewRecord } from './industrial-review.types'

export function resolveIndustrialReviewRoot(cwd = process.cwd()): string {
  const p = join(cwd, 'var', 'industrial-review')
  mkdirSync(p, { recursive: true })
  return p
}

function recordPath(root: string, candidateId: string): string {
  const safe = candidateId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
  if (!safe || safe !== candidateId) {
    throw new Error('INVALID_CANDIDATE_ID')
  }
  return join(root, `${safe}.json`)
}

export function saveIndustrialReviewRecord(
  record: IndustrialReviewRecord,
  cwd = process.cwd(),
): string {
  const root = resolveIndustrialReviewRoot(cwd)
  const path = recordPath(root, record.candidateId)
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
  renameSync(tmp, path)
  return path
}

export function loadIndustrialReviewRecord(
  candidateId: string,
  cwd = process.cwd(),
): IndustrialReviewRecord | null {
  const path = recordPath(resolveIndustrialReviewRoot(cwd), candidateId)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as IndustrialReviewRecord
}

/** 候选记录文件名：cand_*.json；排除 _phase_* 批次摘要等元数据 */
const CANDIDATE_FILE_RE = /^cand_[a-zA-Z0-9_-]{1,64}\.json$/

function isIndustrialReviewCandidateRecord(
  raw: unknown,
  fileName: string,
): raw is IndustrialReviewRecord {
  if (!CANDIDATE_FILE_RE.test(fileName)) return false
  if (!raw || typeof raw !== 'object') return false
  const r = raw as Record<string, unknown>
  const id = r.candidateId
  if (typeof id !== 'string' || !id) return false
  // 文件名须与 candidateId 一致，防目录穿越/错配
  if (`${id}.json` !== fileName) return false
  if (typeof r.caseCode !== 'string' || !r.caseCode) return false
  if (!r.candidate || typeof r.candidate !== 'object') return false
  return true
}

export function listIndustrialReviewRecords(
  cwd = process.cwd(),
): IndustrialReviewRecord[] {
  const root = resolveIndustrialReviewRoot(cwd)
  const files = readdirSync(root).filter((f) => f.endsWith('.json'))
  const out: IndustrialReviewRecord[] = []
  for (const f of files) {
    try {
      const raw = JSON.parse(readFileSync(join(root, f), 'utf8')) as unknown
      if (!isIndustrialReviewCandidateRecord(raw, f)) {
        // 批次摘要（_phase_*.json）等非候选：静默跳过，避免列表崩溃
        continue
      }
      out.push(raw)
    } catch {
      /* skip corrupt */
    }
  }
  return out.sort((a, b) => {
    const au = String(a.updatedAt || '')
    const bu = String(b.updatedAt || '')
    return au < bu ? 1 : -1
  })
}
