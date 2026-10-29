import type {
  ApparatusErrorCode,
  IndustrialApparatusComponentType,
  IndustrialApparatusConnectionFlowType,
  IndustrialApparatusMediaType,
  IndustrialApparatusOrientation,
  IndustrialApparatusPortDirection,
} from './industrial-apparatus.constants'

export type IndustrialApparatusPortDef = {
  portId: string
  direction: IndustrialApparatusPortDirection
  media: IndustrialApparatusMediaType[]
}

/** 服务端组件内部字段 — 禁止进入 Public */
export type IndustrialApparatusComponentInternal = {
  answerKey?: string | null
  expectedOperation?: string | null
  hazardNotes?: string | null
}

export type IndustrialApparatusComponentDefinition = {
  componentId: string
  componentType: IndustrialApparatusComponentType
  displayLabel: string
  ports: IndustrialApparatusPortDef[]
  /** 教学参数标签（可见） */
  paramLabels?: string[]
  internal: IndustrialApparatusComponentInternal
}

export type IndustrialApparatusConnectionDefinition = {
  connectionId: string
  sourceComponentId: string
  sourcePortId: string
  targetComponentId: string
  targetPortId: string
  flowType: IndustrialApparatusConnectionFlowType
  displayLabel?: string
  /** 仅服务端：正确/错误教学意图 */
  internal?: {
    intendedCorrect?: boolean | null
    teachingNote?: string | null
  }
}

export type IndustrialApparatusReviewMetadata = {
  chemicallyReviewed: boolean
  schematicOnly: boolean
  notes?: string
}

/** 服务端完整装置定义 */
export type IndustrialApparatusDefinition = {
  schemaVersion: string
  apparatusId: string
  caseCode: string
  caseVersion: string
  caseContentHash: string
  apparatusVersion: string
  apparatusContentHash: string
  title: string
  orientation: IndustrialApparatusOrientation
  schematicDisclaimer: string
  components: IndustrialApparatusComponentDefinition[]
  connections: IndustrialApparatusConnectionDefinition[]
  reviewMetadata: IndustrialApparatusReviewMetadata
  /** 若为故意错误样例 */
  intentionallyInvalid?: boolean
}

export type IndustrialApparatusPublicComponent = {
  componentId: string
  componentType: IndustrialApparatusComponentType
  displayLabel: string
  ports: IndustrialApparatusPortDef[]
  paramLabels?: string[]
}

export type IndustrialApparatusPublicConnection = {
  connectionId: string
  sourceComponentId: string
  sourcePortId: string
  targetComponentId: string
  targetPortId: string
  flowType: IndustrialApparatusConnectionFlowType
  displayLabel?: string
}

/** 学生可见装置图 — 白名单 */
export type IndustrialApparatusPublic = {
  schemaVersion: string
  apparatusId: string
  apparatusVersion: string
  publicContentHash: string
  orientation: IndustrialApparatusOrientation
  title: string
  schematicDisclaimer: string
  components: IndustrialApparatusPublicComponent[]
  connections: IndustrialApparatusPublicConnection[]
}

export type ApparatusIssue = {
  code: ApparatusErrorCode | string
  path: string
  message: string
  severity: 'error' | 'warning' | 'unknown'
}

export type IndustrialApparatusValidationResult = {
  valid: boolean
  errors: ApparatusIssue[]
  warnings: ApparatusIssue[]
  unknowns: ApparatusIssue[]
}
