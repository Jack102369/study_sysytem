/** 二审 NEEDS_FIX + 硬编码训练限制；不得用于出题 */
export const HARD_FIX_SKIP = new Set<string>([
  'rxn.2Na2O2_2H2O',
  'rxn.2Na2O2_2CO2',
  'rxn.2Al_6HCl',
  'rxn.3Fe_2O2',
  'rxn.Fe_H2SO4',
  'rxn.Cu_2H2SO4',
  'rxn.C_2H2SO4',
  'rxn.N2_3H2',
  'rxn.Cu_4HNO3',
  'rxn.Cu_4HNO3c',
  'exp.CO2_prep_marble',
  'q.eq.Na_water',
])

/** 易歧义反应：禁止唯一答案填空/写方程式；仅允许字段充分的判断/识别 */
const AMBIGUOUS_RXN_RE =
  /KMnO4|K₂MnO₄|高锰酸|重铬酸|有机|C\d+H|苯|醇|醛|羧酸|酯化|加成|取代/i

export function isAmbiguousReaction(code: string, name: string, equation: string): boolean {
  return AMBIGUOUS_RXN_RE.test(`${code} ${name} ${equation}`)
}

export function loadSecondReviewFixCodes(results: { code?: string; conclusion?: string }[]): Set<string> {
  const set = new Set(HARD_FIX_SKIP)
  for (const r of results || []) {
    if (r.conclusion === 'NEEDS_FIX' && r.code) set.add(r.code)
  }
  return set
}
