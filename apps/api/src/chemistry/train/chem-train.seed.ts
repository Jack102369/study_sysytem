import type { TrainQtype } from './train.constants'

export type ChemTrainTestSeed = {
  code: string
  specialtyCode: string
  categoryCode: string
  qtype: TrainQtype
  /** 默认 text；化学式/元素符号填空用 chem_formula */
  answerType?: 'text' | 'chem_formula'
  stem: string
  optionsJson?: unknown
  answer: string
  answerAliases?: string[]
  analysis?: string
  difficulty: 1 | 2 | 3
}

/** 仅测试池；不计入正式统计；需管理员或授权方可使用 */
export const CHEM_TRAIN_TEST_SEEDS: ChemTrainTestSeed[] = [
  {
    code: 'train.test.eq.tf.01',
    specialtyCode: 'equation',
    categoryCode: 'true_false',
    qtype: 'judge',
    stem: '【测试题】化学反应前后原子种类与数目守恒。判断正误。',
    answer: '正确',
    answerAliases: ['对', 'T', 'true', '√'],
    analysis: '质量守恒定律：原子守恒。',
    difficulty: 1,
  },
  {
    code: 'train.test.eq.tf.02',
    specialtyCode: 'equation',
    categoryCode: 'true_false',
    qtype: 'judge',
    stem: '【测试题】所有化学反应都是氧化还原反应。判断正误。',
    answer: '错误',
    answerAliases: ['错', 'F', 'false', '×'],
    analysis: '中和、复分解等可无化合价变化。',
    difficulty: 1,
  },
  {
    code: 'train.test.eq.single.01',
    specialtyCode: 'equation',
    categoryCode: 'true_false',
    qtype: 'single',
    stem: '【测试题】下列属于化学变化的是？',
    optionsJson: [
      { key: 'A', text: '冰融化成水' },
      { key: 'B', text: '镁条燃烧' },
      { key: 'C', text: '食盐溶于水' },
      { key: 'D', text: '液态氧变成气态氧' },
    ],
    answer: 'B',
    analysis: '燃烧有新物质生成。',
    difficulty: 1,
  },
  {
    code: 'train.test.mem.blank.01',
    specialtyCode: 'memory',
    categoryCode: 'symbol',
    qtype: 'blank',
    answerType: 'chem_formula',
    stem: '【测试题】氧元素的元素符号是____。（填符号）',
    answer: 'O',
    answerAliases: [],
    analysis: '氧元素符号为 O。',
    difficulty: 1,
  },
  {
    code: 'train.test.sub.single.01',
    specialtyCode: 'substance',
    categoryCode: 'formula',
    qtype: 'single',
    stem: '【测试题】水的化学式是？',
    optionsJson: [
      { key: 'A', text: 'H2O' },
      { key: 'B', text: 'HO' },
      { key: 'C', text: 'H2O2' },
      { key: 'D', text: 'OH' },
    ],
    answer: 'A',
    analysis: '水分子由两个氢原子与一个氧原子构成。',
    difficulty: 1,
  },
  {
    code: 'train.test.exp.judge.01',
    specialtyCode: 'experiment',
    categoryCode: 'safety',
    qtype: 'judge',
    stem: '【测试题】危险化学实验可以在家自行操作。判断正误。',
    answer: '错误',
    answerAliases: ['错', 'F', 'false', '×'],
    analysis: '危险实验须在实验室由教师指导。',
    difficulty: 1,
  },
  {
    code: 'train.test.eq.blank.01',
    specialtyCode: 'equation',
    categoryCode: 'true_false',
    qtype: 'blank',
    answerType: 'chem_formula',
    stem: '【测试题】氯化钠的化学式是____。',
    answer: 'NaCl',
    answerAliases: ['NaCl(s)'],
    analysis: '氯化钠化学式 NaCl。',
    difficulty: 1,
  },
  {
    code: 'train.test.eq.single.02',
    specialtyCode: 'equation',
    categoryCode: 'true_false',
    qtype: 'single',
    stem: '【测试题】配平化学方程式时必须遵守的是？',
    optionsJson: [
      { key: 'A', text: '只保证质量相等即可随意改化学式' },
      { key: 'B', text: '原子种类与数目守恒' },
      { key: 'C', text: '可以改变生成物种类' },
      { key: 'D', text: '不需要考虑原子守恒' },
    ],
    answer: 'B',
    analysis: '配平依据原子守恒。',
    difficulty: 1,
  },
  {
    code: 'train.test.mem.blank.02',
    specialtyCode: 'memory',
    categoryCode: 'symbol',
    qtype: 'blank',
    stem: '【测试题】氢元素的元素符号是____。',
    answer: 'H',
    answerAliases: [],
    analysis: '氢元素符号为 H。',
    difficulty: 1,
  },
]
