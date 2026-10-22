import http, { type ApiSuccess } from './http'

export type GenKbType =
  | 'element'
  | 'substance'
  | 'reaction'
  | 'experiment'
  | 'formula'
  | 'concept'
  | 'knowledge'

export type GenCandidate = {
  code: string
  templateId: string
  angleKey: string
  qtype: 'single' | 'judge' | 'blank'
  answerType: 'text' | 'chem_formula'
  stem: string
  options: { key: string; text: string }[] | null
  answer: string
  answerAliases: string[]
  analysis: string
  difficulty: 1 | 2
  specialtyCode: string
  categoryCode: string
  sourceCode: string
  sourceType: GenKbType
  sourceId: string
  sourceName: string
}

export type GenSkip = {
  sourceCode: string
  sourceType?: GenKbType
  templateId?: string
  reason: string
}

export type GenPreviewResult = {
  previewId: string
  expiresAt: string
  candidates: GenCandidate[]
  skipped: GenSkip[]
  stats: {
    candidateCount: number
    skipCount: number
    byKbType: Record<string, number>
    bySpecialty: Record<string, number>
    byQtype: Record<string, number>
    byDifficulty: Record<string, number>
    byTemplate: Record<string, number>
  }
  safety: { maxPerConfirm: number; note: string }
}

export type GenMeta = {
  maxPerConfirm: number
  pool: string
  note: string
  specialties: { code: string; name: string; id: string }[]
  categories: {
    id: string
    code: string
    name: string
    specialtyId: string
  }[]
  kbTypes: string[]
  qtypes: string[]
  difficulties: { value: number; label: string }[]
  counts: {
    trainItemsTotal: number
    testActive: number
    fillerActive: number
  }
}

export async function getTrainGeneratorMeta() {
  const { data } = await http.get<ApiSuccess<GenMeta>>(
    '/chemistry/admin/train-generator/meta',
  )
  return data.data
}

export async function getTrainGeneratorUtilization() {
  const { data } = await http.get<
    ApiSuccess<{
      whitelistTotal: number
      byType: Record<string, { total: number; used: number }>
    }>
  >('/chemistry/admin/train-generator/utilization')
  return data.data
}

export async function previewTrainGenerator(body: {
  specialtyCode?: string
  categoryCode?: string
  kbTypes?: GenKbType[]
  qtypes?: ('single' | 'judge' | 'blank')[]
  difficulties?: number[]
  targetCount?: number
  sourceCodes?: string[]
}) {
  const { data } = await http.post<ApiSuccess<GenPreviewResult>>(
    '/chemistry/admin/train-generator/preview',
    body,
    { timeout: 120000 },
  )
  return data.data
}

export async function confirmTrainGenerator(body: {
  previewId: string
  confirmCount?: number
  deactivateFiller?: boolean
}) {
  const { data } = await http.post<
    ApiSuccess<{
      inserted: number
      skippedExisting: number
      skippedResolve: number
      fillerDeactivated: number
      confirmCountRequested: number
      candidateHad: number
      insertedCodesSample: string[]
      note: string
    }>
  >('/chemistry/admin/train-generator/confirm', body, { timeout: 120000 })
  return data.data
}
