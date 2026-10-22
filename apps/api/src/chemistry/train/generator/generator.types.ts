export type GenKbType =
  | 'element'
  | 'substance'
  | 'reaction'
  | 'experiment'
  | 'formula'
  | 'concept'
  | 'knowledge'

export type GenQtype = 'single' | 'judge' | 'blank'

export interface GenCandidate {
  /** 稳定编码：知识+模板角度，用于去重与幂等写入 */
  code: string
  templateId: string
  angleKey: string
  qtype: GenQtype
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
  /** 选项顺序无关指纹 */
  contentFingerprint: string
}

export interface GenSkip {
  sourceCode: string
  sourceType?: GenKbType
  templateId?: string
  reason: string
}

export interface GenKbItem {
  code: string
  type: GenKbType
  name: string
  dbId: string
  specialtyCodes: string[]
  categoryCodes: string[]
  row: Record<string, unknown>
}

export interface GenFilters {
  specialtyCode?: string
  categoryCode?: string
  kbTypes?: GenKbType[]
  qtypes?: GenQtype[]
  difficulties?: number[]
  targetCount?: number
  sourceCodes?: string[]
}

export interface GenPreviewResult {
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
  safety: {
    maxPerConfirm: number
    note: string
  }
}
