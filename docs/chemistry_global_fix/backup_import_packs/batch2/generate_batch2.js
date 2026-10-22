/**
 * Generate batch2 import packages from chemistry_kb_inventory.json
 * Run: node docs/chemistry_batch2/generate_batch2.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const inv = JSON.parse(
  fs.readFileSync(path.join(root, 'chemistry_kb_inventory.json'), 'utf8'),
)
const batch2 = inv.batches.find((b) => b.id === 'batch2')
if (!batch2) throw new Error('batch2 not found')

const STATUS = 'pending_review'

/** High-school friendly element reference (approximate Ar where noted) */
const ELEMENTS = {
  He: {
    nameEn: 'Helium',
    atomicNumber: 2,
    atomicMass: '4.003',
    periodNo: 1,
    groupLabel: '0',
    category: '惰性气体',
    commonValences: '0',
    electronConfig: '1s2',
    atomStructure: '质子数2，核外2个电子（第一层满）',
    commonCompounds: '一般不形成稳定化合物（高中范围）',
    keyProperties: '最轻惰性气体之一，化学性质极不活泼',
    commonUses: '填充气球、冷却剂、保护气',
  },
  Li: {
    nameEn: 'Lithium',
    atomicNumber: 3,
    atomicMass: '6.94',
    periodNo: 2,
    groupLabel: 'IA',
    category: '金属',
    commonValences: '+1',
    electronConfig: '1s2 2s1',
    atomStructure: '质子数3，电子层2，最外层1个电子',
    commonCompounds: 'Li2O, LiOH, Li2CO3',
    keyProperties: '最轻金属，还原性强',
    commonUses: '电池、合金',
  },
  Be: {
    nameEn: 'Beryllium',
    atomicNumber: 4,
    atomicMass: '9.012',
    periodNo: 2,
    groupLabel: 'IIA',
    category: '金属',
    commonValences: '+2',
    electronConfig: '1s2 2s2',
    atomStructure: '质子数4，最外层2个电子',
    commonCompounds: 'BeO, BeCl2',
    keyProperties: '两性倾向，毒性（高中了解）',
    commonUses: '合金材料',
    reviewExtra: '待核实:用途细节以公开资料为准',
  },
  B: {
    nameEn: 'Boron',
    atomicNumber: 5,
    atomicMass: '10.81',
    periodNo: 2,
    groupLabel: 'IIIA',
    category: '非金属',
    commonValences: '+3',
    electronConfig: '1s2 2s2 2p1',
    atomStructure: '质子数5，最外层3个电子',
    commonCompounds: 'B2O3, H3BO3',
    keyProperties: '非金属，可形成共价化合物',
    commonUses: '玻璃、半导体相关（了解）',
  },
  C: {
    nameEn: 'Carbon',
    atomicNumber: 6,
    atomicMass: '12.01',
    periodNo: 2,
    groupLabel: 'IVA',
    category: '非金属',
    commonValences: '+2,+4,-4',
    electronConfig: '1s2 2s2 2p2',
    atomStructure: '质子数6，最外层4个电子',
    commonCompounds: 'CO, CO2, CaCO3, 有机物',
    keyProperties: '形成共价键能力强，同素异形体多',
    commonUses: '燃料、材料、有机化学基础',
  },
  N: {
    nameEn: 'Nitrogen',
    atomicNumber: 7,
    atomicMass: '14.01',
    periodNo: 2,
    groupLabel: 'VA',
    category: '非金属',
    commonValences: '-3,+2,+4,+5',
    electronConfig: '1s2 2s2 2p3',
    atomStructure: '质子数7，最外层5个电子',
    commonCompounds: 'N2, NH3, NO, NO2, HNO3',
    keyProperties: '单质N2稳定；化合物氧化态多样',
    commonUses: '制氨、保护气、硝酸工业',
  },
  F: {
    nameEn: 'Fluorine',
    atomicNumber: 9,
    atomicMass: '19.00',
    periodNo: 2,
    groupLabel: 'VIIA',
    category: '非金属',
    commonValences: '-1',
    electronConfig: '1s2 2s2 2p5',
    atomStructure: '质子数9，最外层7个电子',
    commonCompounds: 'HF, NaF, CaF2',
    keyProperties: '非金属性最强，单质氧化性极强',
    commonUses: '含氟材料（高中了解）',
  },
  Ne: {
    nameEn: 'Neon',
    atomicNumber: 10,
    atomicMass: '20.18',
    periodNo: 2,
    groupLabel: '0',
    category: '惰性气体',
    commonValences: '0',
    electronConfig: '1s2 2s2 2p6',
    atomStructure: '质子数10，最外层8电子稳定结构',
    commonCompounds: '一般不形成化合物（高中范围）',
    keyProperties: '惰性气体，化学性质极不活泼',
    commonUses: '霓虹灯',
  },
  Mg: {
    nameEn: 'Magnesium',
    atomicNumber: 12,
    atomicMass: '24.31',
    periodNo: 3,
    groupLabel: 'IIA',
    category: '金属',
    commonValences: '+2',
    electronConfig: '1s2 2s2 2p6 3s2',
    atomStructure: '质子数12，最外层2个电子',
    commonCompounds: 'MgO, Mg(OH)2, MgCl2',
    keyProperties: '活泼金属，可燃烧发出耀眼白光',
    commonUses: '合金、烟火、还原剂',
  },
  Al: {
    nameEn: 'Aluminium',
    atomicNumber: 13,
    atomicMass: '26.98',
    periodNo: 3,
    groupLabel: 'IIIA',
    category: '金属',
    commonValences: '+3',
    electronConfig: '1s2 2s2 2p6 3s2 3p1',
    atomStructure: '质子数13，最外层3个电子',
    commonCompounds: 'Al2O3, Al(OH)3, AlCl3',
    keyProperties: '两性金属；表面易形成致密氧化膜',
    commonUses: '建筑、电线、包装',
  },
  Si: {
    nameEn: 'Silicon',
    atomicNumber: 14,
    atomicMass: '28.09',
    periodNo: 3,
    groupLabel: 'IVA',
    category: '非金属',
    commonValences: '+4,-4',
    electronConfig: '1s2 2s2 2p6 3s2 3p2',
    atomStructure: '质子数14，最外层4个电子',
    commonCompounds: 'SiO2, Na2SiO3',
    keyProperties: '地壳中含量高；半导体原料',
    commonUses: '芯片、玻璃、建筑材料',
  },
  P: {
    nameEn: 'Phosphorus',
    atomicNumber: 15,
    atomicMass: '30.97',
    periodNo: 3,
    groupLabel: 'VA',
    category: '非金属',
    commonValences: '-3,+3,+5',
    electronConfig: '1s2 2s2 2p6 3s2 3p3',
    atomStructure: '质子数15，最外层5个电子',
    commonCompounds: 'P4O10, H3PO4',
    keyProperties: '有白磷、红磷等同素异形体',
    commonUses: '火柴、化肥（了解）',
  },
  S: {
    nameEn: 'Sulfur',
    atomicNumber: 16,
    atomicMass: '32.06',
    periodNo: 3,
    groupLabel: 'VIA',
    category: '非金属',
    commonValences: '-2,+4,+6',
    electronConfig: '1s2 2s2 2p6 3s2 3p4',
    atomStructure: '质子数16，最外层6个电子',
    commonCompounds: 'SO2, SO3, H2SO4, H2S',
    keyProperties: '可燃烧；氧化物与硫酸重要',
    commonUses: '制硫酸、硫化橡胶',
  },
  Ar: {
    nameEn: 'Argon',
    atomicNumber: 18,
    atomicMass: '39.95',
    periodNo: 3,
    groupLabel: '0',
    category: '惰性气体',
    commonValences: '0',
    electronConfig: '1s2 2s2 2p6 3s2 3p6',
    atomStructure: '质子数18，最外层8电子稳定结构',
    commonCompounds: '一般不形成化合物（高中范围）',
    keyProperties: '惰性气体，空气中含量较高',
    commonUses: '电灯泡保护气、焊接保护气',
  },
  K: {
    nameEn: 'Potassium',
    atomicNumber: 19,
    atomicMass: '39.10',
    periodNo: 4,
    groupLabel: 'IA',
    category: '金属',
    commonValences: '+1',
    electronConfig: '1s2 2s2 2p6 3s2 3p6 4s1',
    atomStructure: '质子数19，最外层1个电子',
    commonCompounds: 'KOH, KCl, K2CO3',
    keyProperties: '比钠更活泼，与水反应更剧烈',
    commonUses: '化肥、实验室试剂',
  },
  Ca: {
    nameEn: 'Calcium',
    atomicNumber: 20,
    atomicMass: '40.08',
    periodNo: 4,
    groupLabel: 'IIA',
    category: '金属',
    commonValences: '+2',
    electronConfig: '1s2 2s2 2p6 3s2 3p6 4s2',
    atomStructure: '质子数20，最外层2个电子',
    commonCompounds: 'CaO, Ca(OH)2, CaCO3, CaCl2',
    keyProperties: '活泼金属；石灰、硬水相关',
    commonUses: '建筑、冶金、补钙（了解）',
  },
  Fe: {
    nameEn: 'Iron',
    atomicNumber: 26,
    atomicMass: '55.85',
    periodNo: 4,
    groupLabel: 'VIII',
    category: '金属',
    commonValences: '+2,+3',
    electronConfig: '[Ar] 3d6 4s2（高中可记最外层与常见价态）',
    atomStructure: '过渡金属；常见Fe2+、Fe3+',
    commonCompounds: 'Fe2O3, Fe3O4, FeCl3, FeSO4',
    keyProperties: '可生锈；与酸、盐溶液反应',
    commonUses: '钢铁、建筑、工具',
    reviewExtra: '待核实:高中电子排布写法以课本记号为准',
  },
  Cu: {
    nameEn: 'Copper',
    atomicNumber: 29,
    atomicMass: '63.55',
    periodNo: 4,
    groupLabel: 'IB',
    category: '金属',
    commonValences: '+1,+2',
    electronConfig: '[Ar] 3d10 4s1（高中侧重化合价与性质）',
    atomStructure: '过渡金属；Cu2+溶液常呈蓝色',
    commonCompounds: 'CuO, Cu(OH)2, CuSO4, CuCl2',
    keyProperties: '导电导热好；活动性较弱',
    commonUses: '电线、合金',
  },
  Zn: {
    nameEn: 'Zinc',
    atomicNumber: 30,
    atomicMass: '65.38',
    periodNo: 4,
    groupLabel: 'IIB',
    category: '金属',
    commonValences: '+2',
    electronConfig: '[Ar] 3d10 4s2',
    atomStructure: '常见Zn2+',
    commonCompounds: 'ZnO, ZnCl2, ZnSO4',
    keyProperties: '可与酸反应放氢；常用于镀锌',
    commonUses: '镀锌、电池、合金',
  },
  Ag: {
    nameEn: 'Silver',
    atomicNumber: 47,
    atomicMass: '107.9',
    periodNo: 5,
    groupLabel: 'IB',
    category: '金属',
    commonValences: '+1',
    electronConfig: '高中以化合价与性质为主',
    atomStructure: '常见Ag+',
    commonCompounds: 'AgNO3, AgCl, AgBr',
    keyProperties: '导电好；卤化银见光分解（了解）',
    commonUses: '首饰、感光、电极',
  },
  Ba: {
    nameEn: 'Barium',
    atomicNumber: 56,
    atomicMass: '137.3',
    periodNo: 6,
    groupLabel: 'IIA',
    category: '金属',
    commonValences: '+2',
    electronConfig: '高中以化合价与离子检验为主',
    atomStructure: '常见Ba2+',
    commonCompounds: 'BaCl2, BaSO4, Ba(OH)2',
    keyProperties: 'Ba2+与SO42-生成白色沉淀BaSO4',
    commonUses: '检验SO42-；医疗造影（了解）',
  },
  I: {
    nameEn: 'Iodine',
    atomicNumber: 53,
    atomicMass: '126.9',
    periodNo: 5,
    groupLabel: 'VIIA',
    category: '非金属',
    commonValences: '-1,+5,+7',
    electronConfig: '高中侧重卤族性质递变',
    atomStructure: '卤族；常见I-',
    commonCompounds: 'I2, KI, HI',
    keyProperties: '紫黑色固体；淀粉遇碘变蓝',
    commonUses: '消毒、检验淀粉',
  },
  Mn: {
    nameEn: 'Manganese',
    atomicNumber: 25,
    atomicMass: '54.94',
    periodNo: 4,
    groupLabel: 'VIIB',
    category: '金属',
    commonValences: '+2,+4,+7',
    electronConfig: '高中常见MnO2、KMnO4相关',
    atomStructure: '过渡金属，价态多样',
    commonCompounds: 'MnO2, KMnO4, MnCl2',
    keyProperties: 'MnO2可催化过氧化氢分解、参与制氯气',
    commonUses: '催化剂、电池（了解）',
  },
  Cr: {
    nameEn: 'Chromium',
    atomicNumber: 24,
    atomicMass: '52.00',
    periodNo: 4,
    groupLabel: 'VIB',
    category: '金属',
    commonValences: '+3,+6',
    electronConfig: '高中了解即可',
    atomStructure: '过渡金属',
    commonCompounds: 'Cr2O3, K2Cr2O7（了解）',
    keyProperties: '不锈钢组分（了解）',
    commonUses: '电镀、合金',
    reviewExtra: '待核实:高一要求较低，细节以课标为准',
  },
  Br: {
    nameEn: 'Bromine',
    atomicNumber: 35,
    atomicMass: '79.90',
    periodNo: 4,
    groupLabel: 'VIIA',
    category: '非金属',
    commonValences: '-1,+1,+5',
    electronConfig: '卤族；高中侧重性质递变',
    atomStructure: '常温深红棕色液体',
    commonCompounds: 'Br2, HBr, NaBr',
    keyProperties: '卤族；可置换等（与氯比较）',
    commonUses: '有机反应、工业原料（了解）',
  },
  Hg: {
    nameEn: 'Mercury',
    atomicNumber: 80,
    atomicMass: '200.6',
    periodNo: 6,
    groupLabel: 'IIB',
    category: '金属',
    commonValences: '+1,+2',
    electronConfig: '高中了解液态金属',
    atomStructure: '常温液态金属',
    commonCompounds: 'HgO, HgCl2（毒性，禁止接触实验）',
    keyProperties: '常温液态；有毒',
    commonUses: '历史温度计（已限制）',
    reviewExtra: '待核实:强调毒性与禁用，禁止引导学生接触',
  },
}

const CONCEPTS = {
  'concept.substance_class': {
    definition: '按组成与性质，常把物质分为纯净物与混合物；纯净物再分为单质与化合物；化合物中常见氧化物、酸、碱、盐等。',
    principle: '分类是为了认识物质组成与转化规律，同一物质可按不同标准归类。',
    applicableConditions: '高中必修范围内的常见物质分类讨论。',
    judgeMethods: '先看是否纯净；再看是否由同种元素组成；化合物再看是否含氧、是否电离出H+/OH-等。',
    examples: 'O2是单质；H2O是化合物；空气是混合物；NaOH是碱；HCl是酸；NaCl是盐。',
    commonMistakes: '把合金当成纯净物；把氧化物都当成酸性或碱性而不加区分。',
  },
  'concept.pure_mixture': {
    definition: '纯净物由一种物质组成；混合物由两种或多种物质混合而成，各成分保持原有性质。',
    principle: '纯净物有固定组成（化合物有确定化学式）；混合物组成可变。',
    applicableConditions: '宏观组成判断；不考虑同位素等微观细微差异时的中学定义。',
    judgeMethods: '看能否用一种化学式表示；看各部分性质是否一致。',
    examples: '蒸馏水可视为纯净物；海水、空气、合金是混合物。',
    commonMistakes: '认为纯净物一定是单质；认为混合物一定能用物理方法轻易分开。',
  },
  'concept.elemental_compound': {
    definition: '单质由同种元素组成；化合物由不同种元素组成。',
    principle: '元素是具有相同核电荷数（质子数）的一类原子的总称；单质是元素的游离态形式之一。',
    applicableConditions: '讨论物质组成时。',
    judgeMethods: '看化学式中元素种类数。',
    examples: 'O2、金刚石是单质；CO2、NaCl是化合物。',
    commonMistakes: '把O2与O混淆；把CO当成单质。注意：Co是钴单质相关元素，CO是一氧化碳化合物。',
  },
  'concept.electrolyte': {
    definition: '在水溶液中或熔融状态下能够导电的化合物叫做电解质。',
    principle: '导电是因为存在自由移动的离子；电解质导电不等于单质金属导电。',
    applicableConditions: '讨论酸碱盐等化合物的电离与导电性。',
    judgeMethods: '看是否为化合物，以及水溶液或熔融时能否电离出自由移动离子。',
    examples: 'NaCl、H2SO4、NaOH是电解质；蔗糖、酒精通常是非电解质。',
    commonMistakes: '把能导电的都叫电解质（金属单质能导电但不是电解质）；把电解质溶液导电当成电解质本身一定是离子晶体。',
  },
  'concept.nonelectrolyte': {
    definition: '在水溶液中和熔融状态下都不能导电的化合物叫做非电解质。',
    principle: '非电解质分子不电离（或几乎不电离）出自由移动离子。',
    applicableConditions: '化合物导电性分类。',
    judgeMethods: '化合物且水溶液、熔融都不导电。',
    examples: '蔗糖、酒精、尿素等。',
    commonMistakes: '把单质金属、石墨当成非电解质；把CO2、SO2等本身不电离但与水反应生成电解质的物质简单归类时要说明“本身是非电解质”。',
  },
  'concept.ionization': {
    definition: '电解质在水溶液中或熔融状态下离解成自由移动离子的过程叫做电离。',
    principle: '电离不需要通电；电解才是通电发生化学反应。',
    applicableConditions: '强电解质可认为完全电离；弱电解质部分电离（高中初步）。',
    judgeMethods: '写电离方程式，注意守恒与拆分规则。',
    examples: 'NaCl=Na++Cl-；H2SO4=2H++SO42-。',
    commonMistakes: '把电离写成需要通电；强酸弱酸盐等拆分错误。',
  },
  'concept.ionic_reaction': {
    definition: '有离子参加的反应叫做离子反应；实质常是某些离子浓度减小（生成沉淀、气体或水等）。',
    principle: '用离子方程式表示实际参加反应的离子。',
    applicableConditions: '电解质在溶液中的反应。',
    judgeMethods: '写出完整式→拆成离子→删去未变离子→检查原子与电荷守恒。',
    examples: 'AgNO3与NaCl：Ag++Cl-=AgCl↓。',
    commonMistakes: '弱电解质、沉淀、气体、单质不拆；电荷不守恒。',
  },
  'concept.ion_coexist': {
    definition: '同一溶液中多种离子能否大量共同存在，取决于它们之间是否会发生反应而使某些离子大量减少。',
    principle: '若能生成沉淀、气体、水或发生氧化还原等，则通常不能大量共存。',
    applicableConditions: '无色透明溶液等题设条件下的判断题。',
    judgeMethods: '两两检查是否反应；注意酸碱性、氧化还原。',
    examples: 'H+与OH-不能大量共存；Ba2+与SO42-不能大量共存。',
    commonMistakes: '忽略弱酸酸式酸根与H+/OH-；忽略氧化还原共存。',
  },
  'concept.oxidant_reductant': {
    definition: '氧化剂是得到电子（化合价降低）的物质；还原剂是失去电子（化合价升高）的物质。',
    principle: '氧化与还原同时发生；电子得失守恒。',
    applicableConditions: '有化合价变化的反应。',
    judgeMethods: '标化合价→看升降→升的是还原剂，降的是氧化剂。',
    examples: '2Na+Cl2=2NaCl中，Cl2是氧化剂，Na是还原剂。',
    commonMistakes: '把“有氧参加”才叫氧化；混淆氧化剂与氧化产物。',
  },
  'concept.valence_rules': {
    definition: '化合价表示元素原子形成化合物时的化合能力；常见规则可帮助书写化学式。',
    principle: '化合物中正负化合价代数和为零。',
    applicableConditions: '书写化学式、判断氧化还原时。',
    judgeMethods: '记常见价：O通常-2，H通常+1，碱金属+1等。',
    examples: 'H2O中H为+1、O为-2；Al2O3中Al为+3。',
    commonMistakes: '过氧化物中O为-1；单质中化合价为0。',
  },
  'concept.periodic_law': {
    definition: '元素的性质随着原子序数的递增而呈周期性变化的规律叫做元素周期律。',
    principle: '周期性根源是核外电子排布的周期性。',
    applicableConditions: '同周期、同主族递变比较。',
    judgeMethods: '同周期从左到右金属性减弱、非金属性增强；同主族从上到下金属性增强等。',
    examples: '第三周期Na到Cl的性质递变。',
    commonMistakes: '把相对原子质量当成周期律的自变量（近代以原子序数为准）。',
  },
  'concept.metal_trend': {
    definition: '同周期从左到右金属性减弱；同主族从上到下金属性增强（主族规律）。',
    principle: '与原子半径、失电子能力相关。',
    applicableConditions: '主族元素比较；过渡元素更复杂。',
    judgeMethods: '比与水/酸反应难易，比最高价氧化物对应水化物碱性强弱等。',
    examples: '金属性K>Na>Li；Na>Mg>Al。',
    commonMistakes: '用密度、硬度直接代替金属性强弱。',
  },
  'concept.nonmetal_trend': {
    definition: '同周期从左到右非金属性增强；同主族从上到下非金属性减弱（主族规律）。',
    principle: '与得电子能力相关。',
    applicableConditions: '卤族、氧族等比较。',
    judgeMethods: '比单质氧化性、氢化物稳定性、最高价含氧酸酸性等。',
    examples: '非金属性F>Cl>Br>I。',
    commonMistakes: '把单质颜色、状态直接等同于非金属性强弱。',
  },
  'concept.ionic_bond': {
    definition: '阴、阳离子之间通过静电作用所形成的化学键叫做离子键。',
    principle: '活泼金属与活泼非金属易形成离子键。',
    applicableConditions: '判断离子化合物时。',
    judgeMethods: '看是否由阴、阳离子构成；典型如NaCl。',
    examples: 'NaCl、MgO、CaF2。',
    commonMistakes: '认为含金属就一定是离子化合物（如AlCl3有共价成分，高中以课本结论为准）。',
  },
  'concept.covalent_bond': {
    definition: '原子间通过共用电子对所形成的化学键叫做共价键。',
    principle: '非金属原子间常形成共价键。',
    applicableConditions: '单质分子与共价化合物。',
    judgeMethods: '看是否共用电子对；如H2、Cl2、H2O、CO2。',
    examples: 'H—H，H—O，C=O。',
    commonMistakes: '把离子化合物中的化学式当作分子式乱画电子式。',
  },
  'concept.reaction_rate': {
    definition: '化学反应速率表示反应进行的快慢。',
    principle: '受浓度、温度、压强（气体）、催化剂、接触面积等影响。',
    applicableConditions: '定性了解影响因素（必修层面）。',
    judgeMethods: '升温一般加快；催化剂改变化学反应速率。',
    examples: '块状锌与粉末锌和酸反应快慢不同。',
    commonMistakes: '把催化剂当成改变反应限度的因素。',
  },
  'concept.reaction_extent': {
    definition: '可逆反应进行的程度（限度）与反应速率是不同概念；限度讨论反应能进行到什么程度。',
    principle: '催化剂一般不改变化学平衡时的限度（高中初步）。',
    applicableConditions: '可逆反应初步认识。',
    judgeMethods: '区分“快慢”与“进行程度”。',
    examples: '合成氨反应可逆，存在限度。',
    commonMistakes: '把速率与转化率混为一谈。',
  },
  'concept.mass_conserve': {
    definition: '参加化学反应的各物质的质量总和等于反应后生成的各物质的质量总和。',
    principle: '反应前后原子种类与数目不变。',
    applicableConditions: '一切化学反应（忽略相对论质量等）。',
    judgeMethods: '配平方程式后检查原子个数。',
    examples: '2H2+O2=2H2O。',
    commonMistakes: '把“体积守恒”当成质量守恒。',
  },
  'concept.charge_conserve': {
    definition: '离子反应或氧化还原过程中，体系电荷守恒：反应前后离子电荷总数相等。',
    principle: '配平离子方程式必须满足电荷守恒。',
    applicableConditions: '离子方程式、氧化还原配平。',
    judgeMethods: '检查离子方程式左右电荷代数和。',
    examples: '2H++CO32-=CO2↑+H2O。',
    commonMistakes: '只顾原子守恒不顾电荷守恒。',
  },
  'concept.electron_conserve': {
    definition: '氧化还原反应中，还原剂失电子总数等于氧化剂得电子总数。',
    principle: '电子转移守恒是配平依据之一。',
    applicableConditions: '氧化还原反应。',
    judgeMethods: '计算化合价升降总数使之相等。',
    examples: 'MnO2与浓盐酸制Cl2时电子守恒。',
    commonMistakes: '只配平原子不配平电子得失。',
  },
  'concept.solution_colloid': {
    definition: '分散系按分散质粒子大小大致分为溶液、胶体、浊液；胶体粒子直径约在1–100 nm。',
    principle: '胶体有丁达尔效应等特性（高中了解）。',
    applicableConditions: '分散系分类。',
    judgeMethods: '粒子大小；丁达尔效应鉴别溶液与胶体。',
    examples: 'NaCl溶液；Fe(OH)3胶体；泥水是浊液。',
    commonMistakes: '用能否透过滤纸区分胶体与溶液（两者一般都能透过）。',
  },
  'concept.acid_base_salt': {
    definition: '酸电离时生成的阳离子全部是H+；碱电离时生成的阴离子全部是OH-；盐由金属阳离子（或铵根）与酸根离子构成。',
    principle: '用电离观点定义更准确。',
    applicableConditions: '酸碱盐判断与命名。',
    judgeMethods: '看电离产物；注意酸式盐、碱式盐。',
    examples: 'H2SO4是酸；NaOH是碱；Na2CO3是盐；NaHCO3是酸式盐。',
    commonMistakes: '认为含氧就一定是酸；把Na2O当成盐。',
  },
  'concept.oxide_class': {
    definition: '氧化物是由两种元素组成且其中一种是氧元素的化合物；可分为酸性、碱性、两性、不成盐氧化物等（高中常用分类）。',
    principle: '看氧化物对应水化物的酸碱性及与酸碱反应情况。',
    applicableConditions: '常见氧化物归类。',
    judgeMethods: 'CO2是酸性氧化物；Na2O是碱性氧化物；Al2O3是两性氧化物；CO是不成盐氧化物。',
    examples: '见上。',
    commonMistakes: '把H2O、Na2O2简单当成普通氧化物而不加说明（过氧化物氧气价为-1）。',
  },
}

const FORMULAS = {
  'formula.N_n_NA': {
    expression: 'N = n · NA',
    variables: 'N:粒子数；n:物质的量；NA:阿伏加德罗常数',
    units: 'N无量纲计数；n:mol；NA:mol^-1',
    applicableConditions: '微观粒子数与物质的量换算',
    examples: '2 mol H2O含分子数 2·NA',
    commonMistakes: '把NA当成有单位“个”而忘记 mol^-1',
  },
  'formula.Vm': {
    expression: 'Vm = V / n',
    variables: 'Vm:气体摩尔体积；V:气体体积；n:物质的量',
    units: 'Vm:L/mol；V:L；n:mol',
    applicableConditions: '气体；常用标况 Vm≈22.4 L/mol',
    examples: '标况下 0.5 mol 气体体积约 11.2 L',
    commonMistakes: '非气体或非标况仍用 22.4',
  },
  'formula.c_n_V': {
    expression: 'c = n / V',
    variables: 'c:物质的量浓度；n:溶质物质的量；V:溶液体积',
    units: 'c:mol/L；n:mol；V:L',
    applicableConditions: '溶液浓度定义',
    examples: '1 mol NaOH溶于水配成 1 L 溶液，c=1 mol/L',
    commonMistakes: '把溶剂体积当成溶液体积',
  },
  'formula.dilution': {
    expression: 'c1V1 = c2V2',
    variables: '稀释前后溶质的物质的量不变',
    units: 'c:mol/L；V:L',
    applicableConditions: '只加水稀释，溶质不损失',
    examples: '2 mol/L×0.1 L = 0.5 mol/L×0.4 L',
    commonMistakes: '用于发生反应的混合过程仍直接套用',
  },
  'formula.M_m_n': {
    expression: 'M = m / n',
    variables: 'M:摩尔质量；m:质量；n:物质的量',
    units: 'M:g/mol；m:g；n:mol',
    applicableConditions: '纯净物',
    examples: '水的 M≈18 g/mol',
    commonMistakes: '把相对分子质量数值当成有单位却写错单位',
  },
  'formula.rho_c_M': {
    expression: 'c = 1000ρω/M',
    variables: 'ρ:溶液密度；ω:溶质质量分数（小数）；M:溶质摩尔质量；c:物质的量浓度',
    units:
      '当 ρ 取 g/cm³（或 g/mL，二者数值相同）且 ω 为小数时：c 单位为 mol/L，M 单位为 g/mol。若密度改用 g/L，则公式改为 c = ρω/M（不再乘 1000）。',
    applicableConditions:
      '由溶液密度与溶质质量分数换算物质的量浓度；ω 必须用小数（如 98% 写作 0.98），不能直接代入百分数；ρ 与公式系数必须匹配（g/cm³ 用含 1000 的式，g/L 用不含 1000 的式）。',
    examples:
      '浓硫酸标签：ρ=1.84 g/cm³，ω=0.98，M(H2SO4)=98 g/mol，则 c=1000×1.84×0.98/98≈18.4 mol/L。',
    commonMistakes:
      '把 ω 直接写成 98；ρ 用 g/L 却仍乘 1000；混淆溶剂体积与溶液体积；把相对分子质量数值当摩尔质量却漏写单位 g/mol。',
    reviewExtra: 'P0已修:明确 ρ(g/cm³)+ω(小数)+1000 系数；g/L 时用 c=ρω/M',
  },
  'formula.mass_percent': {
    expression: 'w = m(溶质) / m(溶液)',
    variables: 'w:质量分数',
    units: '无量纲（常以%表示）',
    applicableConditions: '溶液组成表示',
    examples: '10 g 溶质溶于 90 g 水，w=10%',
    commonMistakes: '分母写成溶剂质量',
  },
  'formula.equation_ratio': {
    expression: 'n_A / a = n_B / b',
    variables: '化学方程式 aA+bB→… 中计量数之比等于物质的量之比',
    units: 'n:mol',
    applicableConditions: '按化学方程式计算',
    examples: '2H2+O2→2H2O 中 n(H2):n(O2)=2:1',
    commonMistakes: '用质量比直接代替物质的量比而不换算',
  },
  'formula.electron_transfer': {
    expression: '失电子总数 = 得电子总数',
    variables: '氧化还原配平依据',
    units: '电子数',
    applicableConditions: '氧化还原反应',
    examples: '双线桥法标注转移电子数相等',
    commonMistakes: '只配平元素不配平电子',
  },
  'formula.gas_STP': {
    expression: 'V = n · 22.4 L/mol（标况近似）',
    variables: '标况下气体摩尔体积约 22.4 L/mol',
    units: 'V:L；n:mol',
    applicableConditions: '标准状况、气体',
    examples: '1 mol 任何气体标况下约 22.4 L',
    commonMistakes: '固体液体也乘 22.4',
  },
  'formula.Avogadro': {
    expression: 'NA ≈ 6.02×10^23 mol^-1',
    variables: '阿伏加德罗常数',
    units: 'mol^-1',
    applicableConditions: '微观计数与物质的量联系',
    examples: '1 mol 粒子约含 6.02×10^23 个',
    commonMistakes: '把 NA 当成“永远精确等于”某值而忽略测定含义',
  },
}

const KNOWLEDGE = {
  'kp.redox.ox_product': {
    description:
      '氧化产物是还原剂被氧化后的产物（化合价升高后的产物）。判断：找化合价升高的元素，其对应产物为氧化产物。例：2Na+Cl2=2NaCl中，NaCl对钠而言是氧化产物。易错：把氧化剂当成氧化产物。',
    difficulty: 2,
    importance: 4,
  },
  'kp.redox.re_product': {
    description:
      '还原产物是氧化剂被还原后的产物（化合价降低后的产物）。例：同上反应中NaCl对氯而言是还原产物。易错：名称对调。',
    difficulty: 2,
    importance: 4,
  },
  'kp.redox.e_transfer': {
    description:
      '氧化还原的本质是电子转移（或共用电子对偏移）。可用双线桥/单线桥表示电子转移方向与数目。易错：只看氧元素是否参加。',
    difficulty: 2,
    importance: 5,
  },
  'kp.redox.e_conserve': {
    description:
      '电子守恒：失电子总数=得电子总数，用于配平与计算。易错：只配平原子个数。',
    difficulty: 2,
    importance: 5,
  },
  'kp.ion.electrolyte': {
    description:
      '用电离与化合物定义区分电解质/非电解质；金属导电不是电解质。易混：导电性实验条件（水溶液或熔融）。',
    difficulty: 2,
    importance: 5,
  },
  'kp.ion.ionization_eq': {
    description:
      '电离方程式书写：强电解质完全电离用“=”，弱电解质用“⇌”；注意原子守恒与电荷守恒；多元弱酸分步电离。',
    difficulty: 2,
    importance: 5,
  },
  'kp.ion.coexist': {
    description:
      '离子共存：检查沉淀、气体、水、氧化还原、弱电解质生成。注意题设酸碱性与颜色。',
    difficulty: 3,
    importance: 5,
  },
  'kp.ion.ionic_eq': {
    description:
      '离子方程式：拆分规则（强电解质拆，沉淀气体弱电解质单质不拆），删去旁观离子，检查守恒。',
    difficulty: 3,
    importance: 5,
  },
  'kp.structure.atom': {
    description:
      '原子组成：质子数=核电荷数=原子序数；质量数 A = 质子数 Z + 中子数 N（定义用等号，不是近似）；核外电子数=质子数（原子）。注意：质量数是整数，相对原子质量是加权平均值，二者不可混淆。离子的电子数随所带电荷变化。',
    difficulty: 1,
    importance: 5,
  },
  'kp.structure.isotope': {
    description:
      '核素：具有一定质子数和中子数的原子；同位素：质子数相同中子数不同的同一元素不同核素。化学性质几乎相同。',
    difficulty: 2,
    importance: 4,
  },
  'kp.structure.bond': {
    description:
      '离子键与共价键判断：活泼金属+活泼非金属倾向离子键；非金属之间倾向共价键。结合物质类别综合判断。',
    difficulty: 2,
    importance: 4,
  },
  'kp.structure.electron_formula': {
    description:
      '电子式：用“·”表示原子最外层电子；注意阳离子一般不画电子、阴离子与复杂离子的括号与电荷。',
    difficulty: 3,
    importance: 4,
  },
  'kp.periodic.position': {
    description:
      '周期数=电子层数；主族序数=最外层电子数（主族）。由原子序数推电子排布再定位。',
    difficulty: 2,
    importance: 5,
  },
  'kp.periodic.e_config': {
    description:
      '核外电子排布：先内后外，每层最多2n^2；最外层不超过8，次外层不超过18（高中规则）。',
    difficulty: 2,
    importance: 5,
  },
  'kp.periodic.trend': {
    description:
      '同周期/同主族金属性、非金属性、原子半径、化合价等递变规律及比较方法。',
    difficulty: 2,
    importance: 5,
  },
  'kp.calc.amount': {
    description:
      '物质的量三公式：n=m/M，n=N/NA，气体标况 n=V/22.4。先认准物理量再选择公式。',
    difficulty: 1,
    importance: 5,
  },
  'kp.calc.concentration': {
    description:
      'c=n/V，注意溶液体积单位为L；与质量分数、密度换算要分步。',
    difficulty: 2,
    importance: 5,
  },
  'kp.calc.dilution': {
    description:
      '稀释前后溶质n不变：c1V1=c2V2。混合若反应则不能直接套用。',
    difficulty: 2,
    importance: 4,
  },
  'kp.memory.valence_table': {
    description:
      '常见化合价速记：K Na +1；Ca Mg Ba Zn +2；Al +3；F -1；O通常-2；Cl常见-1等。注意例外（过氧化物、硝酸等）。',
    difficulty: 1,
    importance: 5,
  },
  'kp.memory.ion_table': {
    description:
      '常见离子：NH4+、OH-、NO3-、SO42-、CO32-、Cl-、Ba2+、Fe3+、Cu2+等；注意电荷书写位置。',
    difficulty: 1,
    importance: 5,
  },
  'kp.memory.color_table': {
    description:
      '常见颜色：Cu2+蓝色；Fe3+黄色/棕黄；Fe(OH)3红褐；Cu(OH)2蓝色；MnO4-紫红等（以课本常见为准）。',
    difficulty: 2,
    importance: 3,
  },
}

function note(code, extra) {
  return `[inv:${code}]${extra ? ' ' + extra : ''}`
}

function buildElementItem(invItem) {
  const sym = invItem.code.replace(/^el\./, '')
  const ref = ELEMENTS[sym]
  if (!ref) throw new Error('missing element data for ' + sym)
  return {
    type: 'element',
    inventoryCode: invItem.code,
    specialtyCodes: invItem.specialtyCodes,
    categoryCodes: invItem.categoryCodes,
    data: {
      symbol: sym,
      nameZh: invItem.name,
      nameEn: ref.nameEn,
      atomicNumber: ref.atomicNumber,
      atomicMass: ref.atomicMass,
      periodNo: ref.periodNo,
      groupLabel: ref.groupLabel,
      category: ref.category,
      commonValences: ref.commonValences,
      atomStructure: ref.atomStructure,
      electronConfig: ref.electronConfig,
      commonCompounds: ref.commonCompounds,
      keyProperties: ref.keyProperties,
      commonUses: ref.commonUses,
      status: STATUS,
      reviewNote: note(invItem.code, ref.reviewExtra || ''),
    },
  }
}

function buildConceptItem(invItem) {
  const ref = CONCEPTS[invItem.code]
  if (!ref) throw new Error('missing concept ' + invItem.code)
  return {
    type: 'concept',
    inventoryCode: invItem.code,
    specialtyCodes: invItem.specialtyCodes,
    categoryCodes: invItem.categoryCodes,
    data: {
      name: invItem.name,
      definition: ref.definition,
      principle: ref.principle,
      applicableConditions: ref.applicableConditions,
      judgeMethods: ref.judgeMethods,
      examples: ref.examples,
      commonMistakes: ref.commonMistakes,
      status: STATUS,
      reviewNote: note(invItem.code, ref.reviewExtra || ''),
    },
  }
}

function buildFormulaItem(invItem) {
  const ref = FORMULAS[invItem.code]
  if (!ref) throw new Error('missing formula ' + invItem.code)
  return {
    type: 'formula',
    inventoryCode: invItem.code,
    specialtyCodes: invItem.specialtyCodes,
    categoryCodes: invItem.categoryCodes,
    data: {
      name: invItem.name,
      expression: ref.expression,
      variables: ref.variables,
      units: ref.units,
      applicableConditions: ref.applicableConditions,
      examples: ref.examples,
      commonMistakes: ref.commonMistakes,
      status: STATUS,
      reviewNote: note(invItem.code, ref.reviewExtra || ''),
    },
  }
}

function buildKnowledgeItem(invItem) {
  const ref = KNOWLEDGE[invItem.code]
  if (!ref) throw new Error('missing knowledge ' + invItem.code)
  return {
    type: 'knowledge',
    inventoryCode: invItem.code,
    specialtyCodes: invItem.specialtyCodes,
    categoryCodes: invItem.categoryCodes,
    data: {
      name: invItem.name,
      description: ref.description,
      difficulty: ref.difficulty,
      importance: ref.importance,
      status: STATUS,
      reviewNote: note(invItem.code, invItem.note || ''),
    },
  }
}

function validatePack(name, items, expectedCodes) {
  const lines = []
  const errors = []
  lines.push(`# ${name} 校验报告`)
  lines.push('')
  lines.push(`- 条目数: ${items.length}`)
  lines.push(`- 期望编码数: ${expectedCodes.length}`)
  const codes = items.map((x) => x.inventoryCode)
  const missing = expectedCodes.filter((c) => !codes.includes(c))
  const extra = codes.filter((c) => !expectedCodes.includes(c))
  if (missing.length) errors.push('缺失编码: ' + missing.join(', '))
  if (extra.length) errors.push('多余编码: ' + extra.join(', '))
  if (new Set(codes).size !== codes.length) errors.push('编码重复')
  for (const it of items) {
    if (it.data.status !== STATUS) errors.push(`${it.inventoryCode} status不是pending_review`)
    if (!String(it.data.reviewNote || '').includes(`[inv:${it.inventoryCode}]`)) {
      errors.push(`${it.inventoryCode} reviewNote缺少inv标记`)
    }
    if (it.type === 'element') {
      const s = it.data.symbol
      if (!/^[A-Z][a-z]?$/.test(s)) errors.push(`元素符号格式错误: ${s}`)
      if (s === 'CO') errors.push('错误：CO不是元素符号')
    }
  }
  lines.push('')
  lines.push('## 结果')
  lines.push('')
  if (errors.length === 0) {
    lines.push('通过：格式、编码、status、inv标记检查无误。')
  } else {
    lines.push('失败：')
    for (const e of errors) lines.push(`- ${e}`)
  }
  lines.push('')
  lines.push('## 编码列表')
  lines.push('')
  for (const c of codes) lines.push(`- ${c}`)
  return { ok: errors.length === 0, md: lines.join('\n'), errors }
}

function writePack(tag, built, expectedCodes) {
  const importPath = path.join(__dirname, `import_${tag}.json`)
  const checkPath = path.join(__dirname, `check_${tag}.md`)
  const payload = {
    items: built.map(({ type, data }) => ({ type, data })),
    meta: {
      batch: 'batch2',
      pack: tag,
      inventoryCodes: built.map((x) => x.inventoryCode),
      specialtyByCode: Object.fromEntries(
        built.map((x) => [x.inventoryCode, x.specialtyCodes || []]),
      ),
      categoryByCode: Object.fromEntries(
        built.map((x) => [x.inventoryCode, x.categoryCodes || []]),
      ),
    },
  }
  fs.writeFileSync(importPath, JSON.stringify(payload, null, 2), 'utf8')
  const v = validatePack(tag, built, expectedCodes)
  fs.writeFileSync(checkPath, v.md, 'utf8')
  if (!v.ok) {
    console.error(tag, 'VALIDATION FAIL', v.errors)
    process.exitCode = 1
  } else {
    console.log(tag, 'ok', built.length)
  }
  return { payload, validation: v, built }
}

const items = batch2.items
const seeded = items.filter((i) => i.status === 'seeded')
const pending = items.filter((i) => i.status === 'pending')

const elPending = pending.filter((i) => i.type === 'element')
const conceptPending = pending.filter((i) => i.type === 'concept')
const formulaPending = pending.filter((i) => i.type === 'formula')
const kpPending = pending.filter((i) => i.type === 'knowledge')

const audit = {
  seededCount: seeded.length,
  seededCodes: seeded.map((s) => s.code),
  notes: [
    'H/O/Na/Cl：已有 published 核心字段（符号/序数/质量/周期族/化合价/电子排布/用途）。建议补充：name_en 完整英文、atom_structure 更规范表述、common_compounds 列表；不自动覆盖。',
    'concept.redox：定义较短，建议后续审核时补充“易混：氧化剂vs氧化产物”等，不自动覆盖。',
    'formula.n_m_M：表达式已有，建议补充单位与更多例题字段（若库中为空）。',
    'kp.redox 及子节点：描述偏短，建议审核时加长说明；parent 关系已存在。',
  ],
}
fs.writeFileSync(
  path.join(__dirname, 'seeded_audit.json'),
  JSON.stringify(audit, null, 2),
  'utf8',
)

const A = writePack(
  'B2-A',
  elPending.map(buildElementItem),
  elPending.map((i) => i.code),
)
const B = writePack(
  'B2-B',
  conceptPending.map(buildConceptItem),
  conceptPending.map((i) => i.code),
)
const C = writePack(
  'B2-C',
  formulaPending.map(buildFormulaItem),
  formulaPending.map((i) => i.code),
)
const D = writePack(
  'B2-D',
  kpPending.map(buildKnowledgeItem),
  kpPending.map((i) => i.code),
)

const summary = {
  planned: items.length,
  seeded: seeded.length,
  toImport: A.built.length + B.built.length + C.built.length + D.built.length,
  packs: {
    'B2-A': A.built.length,
    'B2-B': B.built.length,
    'B2-C': C.built.length,
    'B2-D': D.built.length,
  },
  validations: {
    'B2-A': A.validation.ok,
    'B2-B': B.validation.ok,
    'B2-C': C.validation.ok,
    'B2-D': D.validation.ok,
  },
}
fs.writeFileSync(
  path.join(__dirname, 'generate_summary.json'),
  JSON.stringify(summary, null, 2),
  'utf8',
)
console.log(JSON.stringify(summary, null, 2))
