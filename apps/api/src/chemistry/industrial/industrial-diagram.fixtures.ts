import {
  CASE_METAL_RECOVERY,
  CASE_SALT_PURIFICATION,
  CASE_SEAWATER_BASIC,
} from './industrial-case.fixtures'
import type { IndustrialCase } from './industrial-case.types'
import { INDUSTRIAL_DIAGRAM_SCHEMA_VERSION } from './industrial-diagram.constants'
import { computeDiagramContentHash } from './industrial-diagram.hash'
import type {
  IndustrialDiagramDefinition,
  IndustrialDiagramEdgeDefinition,
  IndustrialDiagramNodeDefinition,
} from './industrial-diagram.types'

type Draft = Omit<IndustrialDiagramDefinition, 'diagramContentHash'>

function finalize(draft: Draft): IndustrialDiagramDefinition {
  return { ...draft, diagramContentHash: computeDiagramContentHash(draft) }
}

function bindCase(
  industrialCase: IndustrialCase,
  partial: Omit<
    Draft,
    | 'schemaVersion'
    | 'caseCode'
    | 'caseVersion'
    | 'caseContentHash'
    | 'internalReferences'
    | 'reviewMetadata'
  > & {
    reviewNotes?: string
  },
): IndustrialDiagramDefinition {
  return finalize({
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    caseCode: industrialCase.caseCode,
    caseVersion: industrialCase.version,
    caseContentHash: industrialCase.contentHash,
    internalReferences: {
      caseCode: industrialCase.caseCode,
      caseVersion: industrialCase.version,
      caseContentHash: industrialCase.contentHash,
    },
    reviewMetadata: {
      chemicallyReviewed: false,
      structureOnly: true,
      notes: partial.reviewNotes || 'structure protocol fixture; not chemically approved',
    },
    diagramId: partial.diagramId,
    diagramVersion: partial.diagramVersion,
    title: partial.title,
    orientation: partial.orientation,
    nodes: partial.nodes,
    edges: partial.edges,
  })
}

/** 粗盐提纯线性流程 + 未知操作示例（过滤以「操作①」展示） */
export function buildSaltPurificationDiagram(): IndustrialDiagramDefinition {
  const c = CASE_SALT_PURIFICATION
  const nodes: IndustrialDiagramNodeDefinition[] = [
    {
      id: 'n_raw',
      type: 'material',
      displayLabel: '粗盐',
      displayRole: 'raw',
      presentation: { shapeHint: 'rounded_rect', toneHint: 'muted' },
      internal: { materialId: 'm_crude_salt' },
    },
    {
      id: 'n_dissolve',
      type: 'process',
      displayLabel: '溶解',
      displayRole: 'process',
      internal: { stepId: 's1_dissolve', materialId: null },
    },
    {
      id: 'n_brine',
      type: 'intermediate',
      displayLabel: '混合液',
      displayRole: 'intermediate',
      internal: { materialId: 'm_brine' },
    },
    {
      id: 'n_filter',
      type: 'unknown',
      displayLabel: '操作①',
      displayRole: 'unknown_op',
      presentation: { shapeHint: 'diamond', toneHint: 'warning' },
      internal: {
        stepId: 's2_filter',
        unknownKey: 'op_filter',
        answerLabel: '过滤',
      },
    },
    {
      id: 'n_filtrate',
      type: 'intermediate',
      displayLabel: '滤液',
      displayRole: 'intermediate',
      internal: { materialId: 'm_filtrate' },
    },
    {
      id: 'n_residue',
      type: 'waste',
      displayLabel: '滤渣',
      displayRole: 'waste',
      presentation: { toneHint: 'danger' },
      internal: { materialId: 'm_residue' },
    },
    {
      id: 'n_evap',
      type: 'separation',
      displayLabel: '蒸发结晶',
      displayRole: 'separation',
      internal: { stepId: 's3_evaporate' },
    },
    {
      id: 'n_product',
      type: 'product',
      displayLabel: '精盐',
      displayRole: 'product',
      presentation: { toneHint: 'success' },
      internal: { materialId: 'm_refined_nacl' },
    },
  ]
  const edges: IndustrialDiagramEdgeDefinition[] = [
    { id: 'e1', from: 'n_raw', to: 'n_dissolve', type: 'material_flow' },
    { id: 'e2', from: 'n_dissolve', to: 'n_brine', type: 'material_flow' },
    { id: 'e3', from: 'n_brine', to: 'n_filter', type: 'material_flow' },
    { id: 'e4', from: 'n_filter', to: 'n_filtrate', type: 'material_flow' },
    { id: 'e5', from: 'n_filter', to: 'n_residue', type: 'byproduct', displayLabel: '固渣' },
    { id: 'e6', from: 'n_filtrate', to: 'n_evap', type: 'material_flow' },
    { id: 'e7', from: 'n_evap', to: 'n_product', type: 'material_flow' },
  ]
  return bindCase(c, {
    diagramId: 'diag.salt_purification_basic',
    diagramVersion: '0.1.0',
    title: '粗盐提纯流程（协议示例）',
    orientation: 'left_to_right',
    nodes,
    edges,
    reviewNotes: '含未知操作①；仅结构示例',
  })
}

/** 海水晒盐：多分支（产物 + 水蒸气） */
export function buildSeawaterDiagram(): IndustrialDiagramDefinition {
  const c = CASE_SEAWATER_BASIC
  const nodes: IndustrialDiagramNodeDefinition[] = [
    {
      id: 'n_sea',
      type: 'material',
      displayLabel: '海水',
      displayRole: 'raw',
      internal: { materialId: 'm_seawater' },
    },
    {
      id: 'n_evap',
      type: 'process',
      displayLabel: '蒸发浓缩',
      displayRole: 'process',
      internal: { stepId: 's1_evaporate_sea' },
    },
    {
      id: 'n_brine',
      type: 'intermediate',
      displayLabel: '浓缩卤水',
      displayRole: 'intermediate',
      internal: { materialId: 'm_concentrated_brine' },
    },
    {
      id: 'n_vapor',
      type: 'waste',
      displayLabel: '水蒸气',
      displayRole: 'waste',
      internal: { materialId: 'm_water_vapor' },
    },
    {
      id: 'n_cryst',
      type: 'separation',
      displayLabel: '结晶',
      displayRole: 'separation',
      internal: { stepId: 's2_crystallize' },
    },
    {
      id: 'n_salt',
      type: 'product',
      displayLabel: '粗盐',
      displayRole: 'product',
      internal: { materialId: 'm_sea_salt' },
    },
  ]
  const edges: IndustrialDiagramEdgeDefinition[] = [
    { id: 'e1', from: 'n_sea', to: 'n_evap', type: 'material_flow' },
    { id: 'e2', from: 'n_evap', to: 'n_brine', type: 'material_flow' },
    { id: 'e3', from: 'n_evap', to: 'n_vapor', type: 'byproduct', displayLabel: '蒸发水' },
    { id: 'e4', from: 'n_brine', to: 'n_cryst', type: 'material_flow' },
    { id: 'e5', from: 'n_cryst', to: 'n_salt', type: 'material_flow' },
  ]
  return bindCase(c, {
    diagramId: 'diag.seawater_resource_basic',
    diagramVersion: '0.1.0',
    title: '海水资源基础流程（多分支示例）',
    orientation: 'left_to_right',
    nodes,
    edges,
  })
}

/** 金属回收：反应节点 + 试剂输入 */
export function buildMetalRecoveryDiagram(): IndustrialDiagramDefinition {
  const c = CASE_METAL_RECOVERY
  const nodes: IndustrialDiagramNodeDefinition[] = [
    {
      id: 'n_sol',
      type: 'material',
      displayLabel: '含Cu²⁺溶液',
      displayRole: 'raw',
      internal: { materialId: 'm_cu_solution' },
    },
    {
      id: 'n_fe',
      type: 'material',
      displayLabel: '铁屑',
      displayRole: 'reagent',
      presentation: { toneHint: 'primary' },
      internal: { materialId: 'm_fe' },
    },
    {
      id: 'n_rxn',
      type: 'reaction',
      displayLabel: '置换反应',
      displayRole: 'reaction',
      presentation: { shapeHint: 'hexagon' },
      internal: {
        stepId: 's1_displace',
        reactionReference: 'pending.fe_cu_displacement',
      },
    },
    {
      id: 'n_cu',
      type: 'product',
      displayLabel: '铜',
      displayRole: 'product',
      internal: { materialId: 'm_cu' },
    },
    {
      id: 'n_fe2',
      type: 'waste',
      displayLabel: '含Fe²⁺溶液',
      displayRole: 'waste',
      internal: { materialId: 'm_fe2_solution' },
    },
  ]
  const edges: IndustrialDiagramEdgeDefinition[] = [
    { id: 'e1', from: 'n_sol', to: 'n_rxn', type: 'material_flow' },
    { id: 'e2', from: 'n_fe', to: 'n_rxn', type: 'reagent_input', displayLabel: '加入' },
    { id: 'e3', from: 'n_rxn', to: 'n_cu', type: 'material_flow' },
    { id: 'e4', from: 'n_rxn', to: 'n_fe2', type: 'byproduct' },
  ]
  return bindCase(c, {
    diagramId: 'diag.metal_recovery_basic',
    diagramVersion: '0.1.0',
    title: '简化金属回收（反应+试剂）',
    orientation: 'top_to_bottom',
    nodes,
    edges,
  })
}

/**
 * 在粗盐图上叠加「母液回收」recycle 边（教学示意；不新增虚假工艺步骤物料）。
 * 使用已有滤液节点回流到溶解前中间态，表达 recycle 协议能力。
 */
export function buildSaltWithRecycleDiagram(): IndustrialDiagramDefinition {
  const base = buildSaltPurificationDiagram()
  const { diagramContentHash: _drop, ...rest } = base
  void _drop
  return finalize({
    ...rest,
    diagramId: 'diag.salt_purification_recycle',
    title: '粗盐提纯 + 母液回流（recycle 示例）',
    edges: [
      ...base.edges,
      {
        id: 'e_recycle',
        from: 'n_filtrate',
        to: 'n_dissolve',
        type: 'recycle',
        displayLabel: '母液回流（示意）',
      },
    ],
  })
}

export const ALL_DIAGRAM_FIXTURES: IndustrialDiagramDefinition[] = [
  buildSaltPurificationDiagram(),
  buildSeawaterDiagram(),
  buildMetalRecoveryDiagram(),
  buildSaltWithRecycleDiagram(),
]

export function fileNameForDiagram(d: IndustrialDiagramDefinition): string {
  if (d.diagramId.includes('recycle')) return 'salt_purification_basic.recycle.diagram.json'
  if (d.caseCode === 'salt_purification_basic') return 'salt_purification_basic.diagram.json'
  if (d.caseCode === 'seawater_resource_basic') return 'seawater_resource_basic.diagram.json'
  if (d.caseCode === 'metal_recovery_basic') return 'metal_recovery_basic.diagram.json'
  return `${d.diagramId}.diagram.json`
}
