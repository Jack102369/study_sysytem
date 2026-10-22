/** Sync B2 import JSON packs with remediations already applied to DB. */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const dir = path.join(ROOT, 'docs/chemistry_batch2')

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
}
function save(name, obj) {
  fs.writeFileSync(path.join(dir, name), JSON.stringify(obj, null, 2) + '\n', 'utf8')
}
function findByInv(pack, code) {
  return pack.items.find((x) => String(x.data.reviewNote || '').includes(`[inv:${code}]`))
}

const A = load('import_B2-A.json')
const B = load('import_B2-B.json')
const C = load('import_B2-C.json')
const D = load('import_B2-D.json')

// A elements
findByInv(A, 'el.He').data.keyProperties = '最轻的稀有气体（惰性气体），化学性质极不活泼'
findByInv(A, 'el.He').data.reviewNote = '[inv:el.He] B2整改:修正“之一”为最轻稀有气体'

findByInv(A, 'el.N').data.commonValences = '-3,+1,+2,+3,+4,+5'
findByInv(A, 'el.N').data.reviewNote = '[inv:el.N] B2整改:补常见化合价+1,+3'

const hg = findByInv(A, 'el.Hg')
hg.data.commonValences = '+1(as Hg2^2+),+2'
hg.data.atomStructure = '常温液态金属；+1价实际以Hg2^2+存在，勿写成Hg+'
hg.data.keyProperties = '常温液态；有毒；禁止接触实验'
hg.data.reviewNote = '[inv:el.Hg] B2整改:明确Hg2^2+；强调毒性禁用'

const iod = findByInv(A, 'el.I')
iod.data.commonValences = '-1(必修);+5,+7(了解)'
iod.data.keyProperties = '紫黑色固体；淀粉遇碘变蓝；必修训练以I2/-1为主'
iod.data.reviewNote = '[inv:el.I] 范围标注:必修侧重-1与I2；+5/+7为了解。待人工确认'

const cr = findByInv(A, 'el.Cr')
cr.data.commonCompounds = '不锈钢相关(了解)；勿将K2Cr2O7作必修默认训练'
cr.data.keyProperties = '不锈钢组分(了解)；高一不展开铬酸盐氧化还原'
cr.data.reviewNote = '[inv:el.Cr] 范围标注:必修仅了解不锈钢；重铬酸盐偏超纲。待人工确认'

findByInv(A, 'el.Be').data.reviewNote = '[inv:el.Be] 待人工核实:用途/毒性；建议仅周期表层面'
findByInv(A, 'el.Ar').data.reviewNote = '[inv:el.Ar] 待人工核实:Ar相对原子质量需与教材表对齐'
findByInv(A, 'el.Fe').data.reviewNote =
  '[inv:el.Fe] 待人工核实:电子排布记号口径；训练优先Fe2+/Fe3+'

// B concepts
const ec = findByInv(B, 'concept.elemental_compound')
ec.data.definition = '单质是由同种元素组成的纯净物；化合物是由不同种元素组成的纯净物。'
ec.data.judgeMethods =
  '先确认是纯净物，再看化学式中元素种类：一种元素→单质；多种元素→化合物。注意O₂与O₃的混合物不是单质。'
ec.data.commonMistakes =
  '漏掉“纯净物”条件；把O₂与O混淆；把CO当成单质。注意：Co是钴，CO是一氧化碳。'
ec.data.reviewNote = '[inv:concept.elemental_compound] B2整改:定义补“纯净物”'

const cc = findByInv(B, 'concept.charge_conserve')
cc.data.definition =
  '电荷守恒：在化学反应或电解质溶液中，正负电荷的代数和守恒（代数和为零或不改变）。'
cc.data.principle = '离子方程式配平必须检查电荷代数和相等，不能只数“离子个数”。'
cc.data.reviewNote = '[inv:concept.charge_conserve] B2整改:改为电荷代数和表述'

// C formulas
const vm = findByInv(C, 'formula.Vm')
vm.data.applicableConditions =
  '定义式 Vm=V/n 适用于气体。Vm 随温度、压强变化。仅当题目指明标准状况（0℃、101kPa）时，才可近似用 Vm≈22.4 L/mol；常温常压不可默认22.4。标况专用也可参见 formula.gas_STP。'
vm.data.commonMistakes = '非气体套用；非标况仍用22.4；把定义式与标况近似值混为一谈'
vm.data.reviewNote = '[inv:formula.Vm] B2整改:区分定义式与标况近似'

const mm = findByInv(C, 'formula.M_m_n')
mm.data.applicableConditions =
  '适用于纯净物：m 为该纯净物质量。M 的数值等于相对原子/分子质量，单位必须写 g/mol。与聚集状态无关；勿与气体体积公式混用。与 formula.n_m_M 互为变形。'
mm.data.reviewNote = '[inv:formula.M_m_n] B2整改:补单位与适用说明'

const er = findByInv(C, 'formula.equation_ratio')
er.data.applicableConditions =
  '按化学方程式计量关系计算：仅当反应物按计量完全反应，或先按不足量（限量反应物）折算后再用。有杂质、转化率、过量时，需先处理实际参与反应的物质的量。'
er.data.commonMistakes = '用质量比直接代替物质的量比；忽略过量/不足；未考虑转化率或纯度'
er.data.reviewNote = '[inv:formula.equation_ratio] B2整改:补过量与不足量条件'

const stp = findByInv(C, 'formula.gas_STP')
stp.data.expression = 'V = n · 22.4 L/mol（标准状况近似）'
stp.data.variables = 'V:气体体积；n:物质的量；标准状况：0℃（273K）、101kPa'
stp.data.units = 'V:L；n:mol；22.4:L/mol（标况近似）'
stp.data.applicableConditions =
  '仅适用于标准状况（0℃、101kPa）下的气体（理想气体近似）。常温常压、非标况气体不可套用22.4。一般气体摩尔体积定义见 formula.Vm。'
stp.data.commonMistakes = '常温常压仍用22.4；非气体套用；未看清题设是否“标准状况”'
stp.data.reviewNote = '[inv:formula.gas_STP] B2整改:写明0℃、101kPa'

// D knowledge
findByInv(D, 'kp.ion.electrolyte').data.description =
  '电解质：在水溶液中或熔融状态下能够导电的化合物。非电解质：在上述条件下都不能导电的化合物。注意：单质（如金属、石墨）既不是电解质也不是非电解质；二氧化碳、二氧化硫等本身是非电解质，其水溶液导电是因与水反应生成了电解质。'
findByInv(D, 'kp.ion.electrolyte').data.reviewNote =
  '[inv:kp.ion.electrolyte] B2整改:补完整定义与单质边界'

findByInv(D, 'kp.ion.ionic_eq').data.description =
  '离子方程式：强电解质（易溶强酸强碱盐）拆成离子，沉淀、气体、弱电解质、单质、氧化物等不拆；删去旁观离子；检查原子守恒与电荷守恒。边界：微溶物是否拆、酸式盐拆分、少量/过量反应产物，以题设与课本规则为准，不可僵化。'
findByInv(D, 'kp.ion.ionic_eq').data.reviewNote =
  '[inv:kp.ion.ionic_eq] B2整改:补微溶/过量/酸式盐边界提示'

findByInv(D, 'kp.structure.electron_formula').data.description =
  '电子式：用“·”表示原子最外层电子。简单阳离子（如Na⁺、Ca²⁺）一般只写离子符号不画电子；阴离子与复杂阳离子（如NH₄⁺）需按规定画出电子式并标注电荷/括号。'
findByInv(D, 'kp.structure.electron_formula').data.reviewNote =
  '[inv:kp.structure.electron_formula] B2整改:区分简单/复杂阳离子'

findByInv(D, 'kp.periodic.trend').data.description =
  '同周期（从左到右，主族）：金属性减弱、非金属性增强，原子半径一般减小，最高正化合价与族序相关。同主族（从上到下）：金属性增强、非金属性减弱，原子半径增大。比较方法：与水/酸反应难易、最高价氧化物对应水化物酸碱性、气态氢化物稳定性、单质氧化性等（限主族教学口径）。'
findByInv(D, 'kp.periodic.trend').data.reviewNote =
  '[inv:kp.periodic.trend] B2整改:补具体递变方向与比较方法'

findByInv(D, 'kp.calc.amount').data.description =
  '物质的量三公式：n=m/M；n=N/NA；仅当气体处于标准状况时可用 n=V/22.4（V单位L）。先判断已知量与条件再选式；非标况气体不可用22.4。'
findByInv(D, 'kp.calc.amount').data.reviewNote =
  '[inv:kp.calc.amount] B2整改:强调非标况不可用22.4'

findByInv(D, 'kp.memory.valence_table').data.description =
  '常见化合价速记：K/Na +1；Ca/Mg/Ba/Zn +2；Al +3；Fe +2/+3；Cu +1/+2；H 多为+1（氢化物中可为−1）；F −1；O 通常−2（过氧化物中为−1）；Cl 常见−1；N 常见−3/+2/+4/+5（及+1/+3等）。注意硝酸等含氮化合物价态需按规则计算。'
findByInv(D, 'kp.memory.valence_table').data.reviewNote =
  '[inv:kp.memory.valence_table] B2整改:补Fe/Cu/H等变价'

findByInv(D, 'kp.memory.ion_table').data.description =
  '常见离子速记：NH₄⁺、OH⁻、NO₃⁻、SO₄²⁻、CO₃²⁻、Cl⁻、S²⁻、Ba²⁺、Ag⁺、Fe²⁺、Fe³⁺、Cu²⁺、Al³⁺等；电荷写在右上角。检验与共存题常考上述离子。'
findByInv(D, 'kp.memory.ion_table').data.reviewNote =
  '[inv:kp.memory.ion_table] B2整改:补Fe²⁺/Ag⁺/S²⁻等'

findByInv(D, 'kp.memory.color_table').data.description =
  '必修常见颜色：Cl₂黄绿；Br₂深红棕；I₂紫黑；Cu²⁺溶液蓝色；Fe²⁺溶液浅绿；Fe³⁺溶液黄/棕黄；Fe(OH)₂白色（易氧化）；Fe(OH)₃红褐；Cu(OH)₂蓝色。MnO₄⁻紫红偏拓展，训练中宜标注了解/非默认必修表。'
findByInv(D, 'kp.memory.color_table').data.reviewNote =
  '[inv:kp.memory.color_table] B2整改:补卤素与Fe²⁺，MnO₄⁻标拓展'

// specialty meta fixes in D
D.meta.specialtyByCode['kp.periodic.position'] = ['periodic', 'structure']
D.meta.specialtyByCode['kp.calc.concentration'] = ['calculation']
D.meta.specialtyByCode['kp.calc.dilution'] = ['calculation']

save('import_B2-A.json', A)
save('import_B2-B.json', B)
save('import_B2-C.json', C)
save('import_B2-D.json', D)
console.log('synced import_B2-A/B/C/D.json')
