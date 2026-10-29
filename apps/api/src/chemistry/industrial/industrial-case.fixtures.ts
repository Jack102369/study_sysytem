import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'
import { computeIndustrialCaseContentHash } from './industrial-case.hash'
import type { IndustrialCase } from './industrial-case.types'

type Draft = Omit<IndustrialCase, 'contentHash'>

function finalize(draft: Draft): IndustrialCase {
  const contentHash = computeIndustrialCaseContentHash(draft)
  return { ...draft, contentHash }
}

const stamp = '2026-10-29T00:00:00.000Z'

/** 粗盐提纯 — 教材简化；主要针对不溶性杂质 */
export const CASE_SALT_PURIFICATION = finalize({
  caseCode: 'salt_purification_basic',
  title: '粗盐提纯（基础固液分离）',
  description:
    '教学简化流程：溶解→过滤→蒸发结晶，用于理解不溶性杂质的固液分离与结晶。若含可溶性杂质盐，本流程不能完成对应除杂。',
  caseType: 'textbook_simplification',
  gradeScope: 'high_school_1',
  curriculumScope: {
    grade: '高一',
    knowledgePoints: ['溶解', '过滤', '蒸发', '结晶', '固液分离'],
    curriculumNotes: '高一实验基础操作范围；未引入复杂可溶性杂质除杂反应。',
    curriculumReviewStatus: 'pending',
  },
  specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
  categoryCodes: [
    'industrial_separation_purification',
    'industrial_production_cases',
    'flow_diagram_read',
  ],
  sourceReferences: [
    {
      sourceType: 'textbook_knowledge',
      sourceTitle: '高中化学必修实验：粗盐提纯（教学通用知识点）',
      sourceIdentifier: null,
      sourceDescription: '通用教学知识点概括；未绑定具体教材版本页码（禁止虚构页码）。',
      verificationStatus: 'unverified',
    },
  ],
  materials: [
    {
      materialId: 'm_crude_salt',
      name: '粗盐',
      formula: null,
      materialType: 'raw_material',
      physicalState: 'mixture',
      impurities: ['不溶性泥沙等（教学前提）'],
      knowledgeReference: '粗盐为混合物，不编造单一化学式',
    },
    {
      materialId: 'm_water',
      name: '水',
      formula: 'H2O',
      materialType: 'reagent',
      physicalState: 'liquid',
    },
    {
      materialId: 'm_brine',
      name: '粗盐溶液（含不溶杂质悬浮）',
      formula: null,
      materialType: 'intermediate',
      physicalState: 'mixture',
    },
    {
      materialId: 'm_filtrate',
      name: '滤液（可溶性盐溶液）',
      formula: null,
      materialType: 'intermediate',
      physicalState: 'aqueous',
    },
    {
      materialId: 'm_residue',
      name: '滤渣（不溶性杂质）',
      formula: null,
      materialType: 'waste',
      physicalState: 'solid',
    },
    {
      materialId: 'm_refined_nacl',
      name: '提纯后的盐晶体（教学目标产物）',
      formula: 'NaCl',
      materialType: 'target_product',
      physicalState: 'solid',
      knowledgeReference: '教学简化：假定主要成分为NaCl；未处理可溶性杂质盐',
    },
  ],
  processSteps: [
    {
      stepId: 's1_dissolve',
      stepName: '溶解',
      operationType: 'dissolve',
      inputs: ['m_crude_salt', 'm_water'],
      outputs: ['m_brine'],
      purpose: '使可溶成分进入溶液，不溶杂质悬浮或沉降',
      principle: '相似相溶；NaCl可溶于水，泥沙等不溶',
    },
    {
      stepId: 's2_filter',
      stepName: '过滤',
      operationType: 'filter',
      inputs: ['m_brine'],
      outputs: ['m_filtrate', 'm_residue'],
      purpose: '固液分离除去不溶性杂质',
      principle: '过滤分离不溶固体与溶液',
      safetyNotes: '书面训练；实验室操作须教师指导',
    },
    {
      stepId: 's3_evaporate',
      stepName: '蒸发结晶',
      operationType: 'evaporate',
      inputs: ['m_filtrate'],
      outputs: ['m_refined_nacl'],
      purpose: '得到固体盐晶体',
      principle: '蒸发溶剂使溶质析出（教学简化表述）',
    },
  ],
  reactions: [],
  knowledgeLinks: [
    { label: '过滤', note: '固液分离' },
    { label: '蒸发', note: '溶液浓缩与结晶教学描述' },
  ],
  learningObjectives: [
    '识别粗盐提纯的核心步骤顺序',
    '理解过滤针对不溶性杂质的前提',
    '区分本流程无法处理可溶性杂质盐',
  ],
  difficultyRange: { min: 1, max: 2 },
  safetyNotes: '书面化学训练。禁止在家进行加热蒸发等危险操作。',
  reviewStatus: 'draft',
  version: '0.1.0',
  reviewedContentHash: null,
  createdAt: stamp,
  updatedAt: stamp,
  openIssues: [
    '来源 verificationStatus=unverified；未绑定已发布 KB 实体',
    '未覆盖可溶性杂质（如 Ca2+/Mg2+/SO42-）的化学除杂',
  ],
})

/** 海水资源利用基础 — 教材简化；待完善 */
export const CASE_SEAWATER_BASIC = finalize({
  caseCode: 'seawater_resource_basic',
  title: '海水资源利用基础流程（教学简化）',
  description:
    '高一适用的海水→蒸发制盐教学简化链路。明确为教材简化，非完整真实海水化工生产全流程。',
  caseType: 'textbook_simplification',
  gradeScope: 'high_school_1',
  curriculumScope: {
    grade: '高一',
    knowledgePoints: ['溶液', '蒸发', '结晶', '混合物分离'],
    curriculumNotes: '仅保留蒸发结晶制盐基础；复杂提溴/提镁等未纳入。',
    curriculumReviewStatus: 'pending',
  },
  specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
  categoryCodes: [
    'industrial_production_cases',
    'industrial_resource_recycling',
    'flow_diagram_read',
  ],
  sourceReferences: [
    {
      sourceType: 'textbook_knowledge',
      sourceTitle: '海水晒盐/蒸发制盐教学描述（通用）',
      sourceIdentifier: null,
      sourceDescription: '待人工核对具体教材表述；当前不可作为正式 verified 来源。',
      verificationStatus: 'unverified',
    },
  ],
  materials: [
    {
      materialId: 'm_seawater',
      name: '海水',
      formula: null,
      materialType: 'raw_material',
      physicalState: 'mixture',
      impurities: ['多种可溶盐与悬浮物（教学未细分）'],
    },
    {
      materialId: 'm_concentrated_brine',
      name: '浓缩卤水',
      formula: null,
      materialType: 'intermediate',
      physicalState: 'aqueous',
    },
    {
      materialId: 'm_sea_salt',
      name: '粗盐（晒盐产物）',
      formula: null,
      materialType: 'target_product',
      physicalState: 'mixture',
      knowledgeReference: '教学目标产物为粗盐混合物，不伪称纯净工业级产品',
    },
    {
      materialId: 'm_water_vapor',
      name: '水蒸气（蒸发离开体系）',
      formula: 'H2O',
      materialType: 'byproduct',
      physicalState: 'gas',
    },
  ],
  processSteps: [
    {
      stepId: 's1_evaporate_sea',
      stepName: '蒸发浓缩',
      operationType: 'evaporate',
      inputs: ['m_seawater'],
      outputs: ['m_concentrated_brine', 'm_water_vapor'],
      purpose: '减少溶剂使盐接近饱和',
      conditions: '教学表述：日晒或加热（书面题）',
    },
    {
      stepId: 's2_crystallize',
      stepName: '结晶析出粗盐',
      operationType: 'crystallize',
      inputs: ['m_concentrated_brine'],
      outputs: ['m_sea_salt'],
      purpose: '得到粗盐晶体',
      principle: '过饱和溶液中溶质析出（简化）',
    },
  ],
  reactions: [],
  knowledgeLinks: [{ label: '蒸发结晶', note: '混合物分离基础' }],
  learningObjectives: [
    '识别海水晒盐教学流程的主要节点',
    '理解教材简化与真实完整海水化工的区别',
  ],
  difficultyRange: { min: 1, max: 2 },
  safetyNotes: '书面训练；不提供工业现场操作指导。',
  reviewStatus: 'draft',
  version: '0.1.0',
  reviewedContentHash: null,
  createdAt: stamp,
  updatedAt: stamp,
  openIssues: [
    '知识依据 unverified；缺少已发布 chem_experiments/reaction 引用',
    '未展开海水提溴/制碱等后续流程（避免超纲与伪完整工业）',
  ],
})

/** 简化金属回收 — 教学模拟；置换反应待核对 */
export const CASE_METAL_RECOVERY = finalize({
  caseCode: 'metal_recovery_basic',
  title: '简化金属回收（铁置换铜）教学模拟',
  description:
    '教学模拟：含 Cu2+ 的酸性/中性水溶液中，用铁屑置换得铜。明确溶液前提；不声称完整工业湿法冶金流程。',
  caseType: 'teaching_simulation',
  gradeScope: 'high_school_1',
  curriculumScope: {
    grade: '高一',
    knowledgePoints: ['金属活动性顺序', '置换反应', '氧化还原初步'],
    curriculumNotes: '依赖金属活动性：Fe 可置换 Cu2+；具体溶液组成须人工审核。',
    curriculumReviewStatus: 'pending',
  },
  specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
  categoryCodes: [
    'industrial_reaction_principle',
    'industrial_production_cases',
    'industrial_resource_recycling',
  ],
  sourceReferences: [
    {
      sourceType: 'textbook_knowledge',
      sourceTitle: '金属活动性与置换反应（教学通用）',
      sourceIdentifier: null,
      sourceDescription: '方程式与条件待与已审核 chem_reactions 对齐后可升 verified。',
      verificationStatus: 'unverified',
    },
  ],
  materials: [
    {
      materialId: 'm_cu_solution',
      name: '含Cu2+的水溶液（教学前提）',
      formula: null,
      materialType: 'raw_material',
      physicalState: 'aqueous',
      knowledgeReference: '须明确阴离子与浓度范围后才能作为正式依据',
    },
    {
      materialId: 'm_fe',
      name: '铁屑',
      formula: 'Fe',
      materialType: 'reagent',
      physicalState: 'solid',
    },
    {
      materialId: 'm_cu',
      name: '铜',
      formula: 'Cu',
      materialType: 'target_product',
      physicalState: 'solid',
    },
    {
      materialId: 'm_fe2_solution',
      name: '含Fe2+的溶液（置换后）',
      formula: null,
      materialType: 'byproduct',
      physicalState: 'aqueous',
    },
  ],
  processSteps: [
    {
      stepId: 's1_displace',
      stepName: '铁置换铜',
      operationType: 'displace',
      inputs: ['m_cu_solution', 'm_fe'],
      outputs: ['m_cu', 'm_fe2_solution'],
      reagents: ['m_fe'],
      purpose: '回收铜单质（教学）',
      principle: '金属活动性：Fe > Cu，可发生置换（前提：溶液中存在可被置换的Cu2+）',
      conditions: '教学前提：适宜温度与溶液条件待审',
      knowledgeReferences: ['金属活动性顺序'],
      safetyNotes: '书面题；真实溶液处理须实验室规范，禁止危险操作指导',
    },
  ],
  reactions: [
    {
      reactionReference: 'pending.fe_cu_displacement',
      equation: 'Fe + Cu2+ → Fe2+ + Cu',
      reactants: ['m_fe', 'm_cu_solution'],
      products: ['m_cu', 'm_fe2_solution'],
      conditions: '教学简化离子表示；完整盐类形式待审',
      knowledgeReference: null,
      kbReactionId: null,
      pendingVerification: true,
    },
  ],
  knowledgeLinks: [
    { label: '置换反应', note: '待关联已发布 chem_reactions' },
  ],
  learningObjectives: [
    '根据金属活动性判断置换能否发生',
    '区分教学模拟与真实工业湿法回收流程',
  ],
  difficultyRange: { min: 1, max: 3 },
  safetyNotes: '书面化学知识训练，不提供工业现场危险操作指导。',
  reviewStatus: 'draft',
  version: '0.1.0',
  reviewedContentHash: null,
  createdAt: stamp,
  updatedAt: stamp,
  openIssues: [
    '反应 pendingVerification=true；无 kbReactionId',
    '来源 unverified；不得自动 published',
  ],
})

/**
 * 气体洗涤/干燥教学示意案例（装置分析向）。
 * draft + unverified；不得冒充已审核正式案例。
 */
export const CASE_GAS_WASH_TEACHING = finalize({
  caseCode: 'gas_wash_teaching_basic',
  title: '气体洗涤与干燥（教学装置示意）',
  description:
    '高一教学示意：气体发生→洗涤/干燥→收集的气路顺序。明确为 schematic，非工程施工图；具体气体种类与洗涤剂选择须人工审核。',
  caseType: 'teaching_simulation',
  gradeScope: 'high_school_1',
  curriculumScope: {
    grade: '高一',
    knowledgePoints: ['气体洗涤', '干燥', '收集', '气路'],
    curriculumNotes: '装置示意与导管方向教学；不覆盖全部有害气体尾气方案。',
    curriculumReviewStatus: 'pending',
  },
  specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
  categoryCodes: [
    'industrial_apparatus_analysis',
    'flow_diagram_read',
    'industrial_production_cases',
  ],
  sourceReferences: [
    {
      sourceType: 'textbook_knowledge',
      sourceTitle: '气体的洗涤与干燥（教学通用知识点）',
      sourceIdentifier: null,
      sourceDescription:
        '通用教学知识点概括；可与本地 chem_knowledge_points「气体的洗涤与干燥」对照，但当前 verificationStatus=unverified。',
      verificationStatus: 'unverified',
    },
  ],
  materials: [
    {
      materialId: 'm_crude_gas',
      name: '待处理气体（教学前提）',
      formula: null,
      materialType: 'raw_material',
      physicalState: 'gas',
      knowledgeReference: '具体气体未指定；安全与洗涤剂须人工确认',
    },
    {
      materialId: 'm_wash_liquid',
      name: '洗涤液（示意）',
      formula: null,
      materialType: 'reagent',
      physicalState: 'liquid',
    },
    {
      materialId: 'm_clean_gas',
      name: '洗涤后气体（示意）',
      formula: null,
      materialType: 'intermediate',
      physicalState: 'gas',
    },
  ],
  processSteps: [
    {
      stepId: 's1_generate',
      stepName: '气体发生（示意）',
      operationType: 'other',
      inputs: [],
      outputs: ['m_crude_gas'],
      purpose: '产生待洗涤气体（教学占位）',
      principle: '示意步骤；真实发生装置依气体而定',
    },
    {
      stepId: 's2_wash',
      stepName: '洗涤/干燥',
      operationType: 'gas_absorb',
      inputs: ['m_crude_gas', 'm_wash_liquid'],
      outputs: ['m_clean_gas'],
      purpose: '除去杂质气体或水分（示意）',
      principle: '洗气瓶气路：长进短出等教学要点须人工核对',
      safetyNotes: '倒吸、有害尾气处理等不得自动视为已通过',
    },
    {
      stepId: 's3_collect',
      stepName: '收集',
      operationType: 'other',
      inputs: ['m_clean_gas'],
      outputs: ['m_clean_gas'],
      purpose: '收集气体（示意）',
      principle: '收集方法依密度/水溶性而定，本案例未指定具体气体',
    },
  ],
  reactions: [],
  knowledgeLinks: [
    { label: '气体洗涤', note: '待关联已发布知识点' },
    { label: '干燥', note: '示意' },
  ],
  learningObjectives: [
    '识别气体发生→洗涤→收集的示意顺序',
    '理解装置图为教学 schematic，非施工图',
  ],
  difficultyRange: { min: 1, max: 2 },
  safetyNotes: '书面训练；真实气路与尾气处理须教师指导，禁止危险操作指导。',
  reviewStatus: 'draft',
  version: '0.1.0',
  reviewedContentHash: null,
  createdAt: stamp,
  updatedAt: stamp,
  openIssues: [
    '来源 unverified；具体气体与洗涤剂未指定',
    '尾气吸收必要性无法仅凭拓扑自动判定',
  ],
})

export const ALL_CANDIDATE_CASES: IndustrialCase[] = [
  CASE_SALT_PURIFICATION,
  CASE_SEAWATER_BASIC,
  CASE_METAL_RECOVERY,
  CASE_GAS_WASH_TEACHING,
]
