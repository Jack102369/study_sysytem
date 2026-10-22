/**
 * 无依赖测试运行器：node -r ts-node/register 或编译后运行。
 * 推荐：npx ts-node --transpile-only apps/api/src/chemistry/train/chem-formula.util.selftest.ts
 */
import {
  formatChemFormulaDisplay,
  formatChemTextDisplay,
  gradeChemFormula,
  isValidChemFormula,
  normalizeFormulaForCompare,
} from './chem-formula.util'
import { gradeAnswer } from './chem-train-grade'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function main() {
  // 等价
  assert(normalizeFormulaForCompare('H₂O') === 'H2O', 'H₂O→H2O')
  assert(gradeChemFormula({ standardAnswer: 'H2O', userAnswer: 'H2O' }).result === 'correct', 'H2O')
  assert(gradeChemFormula({ standardAnswer: 'H2O', userAnswer: 'H₂O' }).result === 'correct', 'H₂O')
  assert(gradeChemFormula({ standardAnswer: 'CO2', userAnswer: 'CO₂' }).result === 'correct', 'CO₂')
  assert(
    gradeChemFormula({ standardAnswer: 'H2SO4', userAnswer: 'H₂SO₄' }).result === 'correct',
    'H₂SO₄',
  )
  assert(
    gradeChemFormula({ standardAnswer: 'Ca(OH)2', userAnswer: 'Ca(OH)₂' }).result === 'correct',
    'Ca(OH)₂',
  )

  // 大小写错误 → wrong
  for (const bad of ['h2o', 'H2o', 'h2O']) {
    const g = gradeChemFormula({ standardAnswer: 'H2O', userAnswer: bad })
    assert(g.result === 'wrong', `${bad} should wrong got ${g.result}`)
  }

  // 显示
  assert(formatChemFormulaDisplay('H2O') === 'H₂O', 'display H2O')
  assert(formatChemFormulaDisplay('H2SO4') === 'H₂SO₄', 'display H2SO4')
  assert(formatChemFormulaDisplay('Ca(OH)2') === 'Ca(OH)₂', 'display Ca(OH)2')
  assert(formatChemFormulaDisplay('SO4^2-') === 'SO₄²⁻', 'display SO4^2-')
  assert(formatChemFormulaDisplay('Fe2+') === 'Fe²⁺', 'display Fe2+')
  assert(
    formatChemTextDisplay('2H2 + O2 → 2H2O') === '2H₂ + O₂ → 2H₂O',
    'coeff not subscript',
  )

  assert(isValidChemFormula('Ca(OH)2'), 'valid Ca(OH)2')
  assert(!isValidChemFormula('h2o'), 'invalid h2o')

  // gradeAnswer 分流
  assert(
    gradeAnswer({
      qtype: 'blank',
      standardAnswer: 'H2O',
      aliasesJson: [],
      userAnswer: 'h2o',
      answerType: 'chem_formula',
    }).result === 'wrong',
    'blank chem_formula h2o wrong',
  )
  assert(
    gradeAnswer({
      qtype: 'blank',
      standardAnswer: 'H2O',
      aliasesJson: [],
      userAnswer: 'h2o',
      answerType: 'text',
    }).result === 'pending_review',
    'blank text h2o still pending',
  )
  assert(
    gradeAnswer({
      qtype: 'blank',
      standardAnswer: '北京',
      aliasesJson: [],
      userAnswer: '上海',
      answerType: 'text',
    }).result === 'pending_review',
    'text blank unchanged',
  )

  console.log(JSON.stringify({ ok: true, cases: 'all_passed' }, null, 2))
}

main()
