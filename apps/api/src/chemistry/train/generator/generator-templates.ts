import { isAmbiguousReaction } from './generator-fix-skip'
import type {
  GenCandidate,
  GenKbItem,
  GenQtype,
  GenSkip,
} from './generator.types'

const STEM_PREFIX = '【AI试运行】'

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function safeCodePart(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 48)
}

/** 选项顺序无关 + 去空白的内容指纹 */
export function contentFingerprint(c: {
  templateId: string
  sourceCode: string
  qtype: GenQtype
  answer: string
  options: { key: string; text: string }[] | null
  stemCore?: string
}): string {
  const opts = (c.options || [])
    .map((o) => o.text.replace(/\s+/g, ''))
    .sort()
    .join('|')
  const stemNorm = (c.stemCore || '').replace(/\s+/g, '').replace(STEM_PREFIX, '')
  return [
    c.templateId,
    c.sourceCode,
    c.qtype,
    c.answer.replace(/\s+/g, ''),
    opts,
    stemNorm.slice(0, 80),
  ].join('::')
}

function mk(
  partial: Omit<GenCandidate, 'code' | 'angleKey' | 'contentFingerprint' | 'stem'> & {
    stemBody: string
  },
): GenCandidate {
  const angleKey = `${partial.sourceCode}::${partial.templateId}`
  const stem = `${STEM_PREFIX}${partial.stemBody}`
  const code = `train.ai_trial.pa.${safeCodePart(partial.templateId)}.${safeCodePart(partial.sourceCode)}`
  const fp = contentFingerprint({
    templateId: partial.templateId,
    sourceCode: partial.sourceCode,
    qtype: partial.qtype,
    answer: partial.answer,
    options: partial.options,
    stemCore: partial.stemBody,
  })
  return {
    ...partial,
    stem,
    code,
    angleKey,
    contentFingerprint: fp,
  }
}

function pickSpecCat(
  item: GenKbItem,
  preferred: { specialty: string; category: string }[],
): { specialtyCode: string; categoryCode: string } | null {
  const specs = new Set(item.specialtyCodes || [])
  for (const p of preferred) {
    if (specs.size === 0 || specs.has(p.specialty)) {
      return { specialtyCode: p.specialty, categoryCode: p.category }
    }
  }
  // 尝试从已有 categoryCodes 解析 specialty.category
  for (const raw of item.categoryCodes || []) {
    const m = String(raw).match(/^([a-z_]+)\.([a-z0-9_]+)$/i)
    if (m) {
      for (const p of preferred) {
        if (m[1] === p.specialty && m[2] === p.category) {
          return { specialtyCode: m[1], categoryCode: m[2] }
        }
      }
    }
  }
  // 若知识已挂首选专项，用其首个 preferred
  for (const p of preferred) {
    if (specs.has(p.specialty)) {
      return { specialtyCode: p.specialty, categoryCode: p.category }
    }
  }
  const fallback = preferred[0]
  return fallback
    ? { specialtyCode: fallback.specialty, categoryCode: fallback.category }
    : null
}

function hasAsciiFormula(f: string): boolean {
  return !!f && /^[A-Za-z0-9().+\-\[\] ]+$/.test(f) && /[A-Za-z]/.test(f)
}

function looksLikeEquation(s: string): boolean {
  return /[=＝→⟶]/.test(s) || /\+/.test(s) && /[=＝]/.test(s)
}

/** 从知识点描述抽取「易错：」后的短句 */
function extractMisconception(desc: string): string | null {
  const m = desc.match(/易错[：:]\s*([^。；\n]{4,60})/)
  if (!m) return null
  const t = m[1].trim()
  if (t.length < 4 || t.length > 60) return null
  return t
}

/** 取描述首句作为正确判断陈述（需足够短且不含「易错」） */
function extractLeadFact(desc: string): string | null {
  const cleaned = desc.replace(/易错[：:][^。]*。?/g, '').trim()
  const m = cleaned.match(/^([^。]{8,80})。/)
  if (!m) return null
  const t = m[1].trim()
  if (/[？?]/.test(t)) return null
  return t
}

export function buildCandidatesForItem(
  item: GenKbItem,
  ctx: {
    fixSkip: Set<string>
    otherFormulas: string[]
    otherSymbols: { name: string; symbol: string }[]
  },
): { candidates: GenCandidate[]; skips: GenSkip[] } {
  const candidates: GenCandidate[] = []
  const skips: GenSkip[] = []

  if (ctx.fixSkip.has(item.code)) {
    skips.push({
      sourceCode: item.code,
      sourceType: item.type,
      reason: '训练限制/NEEDS_FIX：禁止出题',
    })
    return { candidates, skips }
  }

  switch (item.type) {
    case 'element':
      genElement(item, ctx, candidates, skips)
      break
    case 'substance':
      genSubstance(item, ctx, candidates, skips)
      break
    case 'reaction':
      genReaction(item, ctx, candidates, skips)
      break
    case 'knowledge':
      genKnowledge(item, candidates, skips)
      break
    case 'concept':
      genConcept(item, candidates, skips)
      break
    case 'formula':
      genFormula(item, candidates, skips)
      break
    case 'experiment':
      genExperiment(item, candidates, skips)
      break
    default:
      skips.push({
        sourceCode: item.code,
        sourceType: item.type,
        reason: '阶段A未覆盖该知识类型模板',
      })
  }

  return { candidates, skips }
}

function genElement(
  item: GenKbItem,
  ctx: { otherSymbols: { name: string; symbol: string }[] },
  out: GenCandidate[],
  skips: GenSkip[],
) {
  const row = item.row
  const symbol = str(row.symbol)
  const nameZh = str(row.name_zh) || item.name
  const z = row.atomic_number
  if (!symbol) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'element',
      templateId: 'el_symbol_blank',
      reason: '缺少 symbol 字段',
    })
    return
  }
  const sc = pickSpecCat(item, [
    { specialty: 'memory', category: 'symbol' },
    { specialty: 'periodic', category: 'elem_name' },
  ])
  if (!sc) {
    skips.push({
      sourceCode: item.code,
      reason: '无法解析专项/分类',
    })
    return
  }

  out.push(
    mk({
      templateId: 'el_symbol_blank',
      qtype: 'blank',
      answerType: 'text',
      stemBody: `${nameZh}的元素符号是____。`,
      options: null,
      answer: symbol,
      answerAliases: [symbol.toUpperCase(), symbol.toLowerCase()].filter(
        (x, i, a) => a.indexOf(x) === i && x !== symbol,
      ),
      analysis: `来源 ${item.code}；元素符号 ${symbol}`,
      difficulty: 1,
      specialtyCode: sc.specialtyCode,
      categoryCode: sc.categoryCode,
      sourceCode: item.code,
      sourceType: 'element',
      sourceId: item.dbId,
      sourceName: item.name,
    }),
  )

  if (z != null && Number(z) > 0) {
    out.push(
      mk({
        templateId: 'el_z_blank',
        qtype: 'blank',
        answerType: 'text',
        stemBody: `${nameZh}的原子序数是____。`,
        options: null,
        answer: String(z),
        answerAliases: [],
        analysis: `来源 ${item.code}`,
        difficulty: 1,
        specialtyCode: 'periodic',
        categoryCode: 'elem_name',
        sourceCode: item.code,
        sourceType: 'element',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  }

  const distractors = ctx.otherSymbols
    .filter((e) => e.symbol !== symbol)
    .slice(0, 12)
  if (distractors.length >= 3) {
    const picks = distractors.slice(0, 3)
    out.push(
      mk({
        templateId: 'el_symbol_single',
        qtype: 'single',
        answerType: 'text',
        stemBody: `${nameZh}的元素符号是？`,
        options: [
          { key: 'A', text: symbol },
          { key: 'B', text: picks[0].symbol },
          { key: 'C', text: picks[1].symbol },
          { key: 'D', text: picks[2].symbol },
        ],
        answer: 'A',
        answerAliases: [],
        analysis: `来源 ${item.code}`,
        difficulty: 1,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'element',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  }
}

function genSubstance(
  item: GenKbItem,
  ctx: { otherFormulas: string[] },
  out: GenCandidate[],
  skips: GenSkip[],
) {
  const row = item.row
  const name = str(row.name) || item.name
  const formula = str(row.canonical_formula) || str(row.formula)
  const color = str(row.color)
  const uses = str(row.common_uses)
  const chem = str(row.chemical_props)
  const commonNames = str(row.common_names)

  if (!formula || !hasAsciiFormula(formula)) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'substance',
      templateId: 'sub_formula_blank',
      reason: 'canonical_formula 缺失或非 ASCII 可判定化学式',
    })
  } else if (looksLikeEquation(formula)) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'substance',
      templateId: 'sub_formula_blank',
      reason: '字段像方程式，禁止当作化学式填空',
    })
  } else {
    const sc = pickSpecCat(item, [
      { specialty: 'substance', category: 'formula' },
      { specialty: 'memory', category: 'formula' },
    ])!
    out.push(
      mk({
        templateId: 'sub_formula_blank',
        qtype: 'blank',
        answerType: 'chem_formula',
        stemBody: `${name}的化学式是____。`,
        options: null,
        answer: formula.replace(/\s+/g, ''),
        answerAliases: [],
        analysis: `来源 ${item.code}；化学式填空 answer_type=chem_formula`,
        difficulty: 1,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'substance',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )

    const distractors = ctx.otherFormulas
      .filter((f) => f && f !== formula && hasAsciiFormula(f))
      .slice(0, 8)
    if (distractors.length >= 3) {
      out.push(
        mk({
          templateId: 'sub_formula_single',
          qtype: 'single',
          answerType: 'text',
          stemBody: `${name}的化学式是？`,
          options: [
            { key: 'A', text: formula },
            { key: 'B', text: distractors[0] },
            { key: 'C', text: distractors[1] },
            { key: 'D', text: distractors[2] },
          ],
          answer: 'A',
          answerAliases: [],
          analysis: `来源 ${item.code}`,
          difficulty: 1,
          specialtyCode: sc.specialtyCode,
          categoryCode: sc.categoryCode,
          sourceCode: item.code,
          sourceType: 'substance',
          sourceId: item.dbId,
          sourceName: item.name,
        }),
      )
    }
  }

  if (color && color.length >= 2 && color.length <= 24 && !/[？?]/.test(color)) {
    const sc = pickSpecCat(item, [
      { specialty: 'memory', category: 'color' },
      { specialty: 'substance', category: 'color' },
    ])!
    out.push(
      mk({
        templateId: 'sub_color_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `知识库记载：${name}的颜色为「${color}」。判断该记载正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code} 字段 color`,
        difficulty: 1,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'substance',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'substance',
      templateId: 'sub_color_judge',
      reason: 'color 字段不足，跳过颜色题',
    })
  }

  if (uses && uses.length >= 6 && uses.length <= 80 && !/[？?]/.test(uses)) {
    const sc = pickSpecCat(item, [
      { specialty: 'substance', category: 'usage' },
      { specialty: 'substance', category: 'chem_property' },
    ])!
    // 正确：复述字段；错误干扰用否定常识句（固定安全句，非臆测该物质）
    out.push(
      mk({
        templateId: 'sub_uses_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `根据知识库记载，下列关于「${name}」用途的说法正确：${uses}。判断正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code} 字段 common_uses（复述原文字段，非推断）`,
        difficulty: 1,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'substance',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'substance',
      templateId: 'sub_uses_judge',
      reason: 'common_uses 字段不足或过长，跳过用途题',
    })
  }

  // 性质：仅当 chemical_props 有明确短句时做「记载正误」判断（不臆测）
  if (chem && chem.length >= 10) {
    const first = chem.split(/[；;。]/)[0]?.trim() || ''
    if (first.length >= 8 && first.length <= 70 && !looksLikeEquation(first)) {
      const sc = pickSpecCat(item, [
        { specialty: 'substance', category: 'chem_property' },
      ])!
      out.push(
        mk({
          templateId: 'sub_chem_prop_judge',
          qtype: 'judge',
          answerType: 'text',
          stemBody: `知识库对「${name}」记载：${first}。判断该记载正误。`,
          options: null,
          answer: '正确',
          answerAliases: ['对', 'T', 'true', '√'],
          analysis: `来源 ${item.code} 字段 chemical_props 原文片段`,
          difficulty: 2,
          specialtyCode: sc.specialtyCode,
          categoryCode: sc.categoryCode,
          sourceCode: item.code,
          sourceType: 'substance',
          sourceId: item.dbId,
          sourceName: item.name,
        }),
      )
    } else {
      skips.push({
        sourceCode: item.code,
        sourceType: 'substance',
        templateId: 'sub_chem_prop_judge',
        reason: 'chemical_props 首句过长/含方程式/不足，跳过性质判断',
      })
    }
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'substance',
      templateId: 'sub_chem_prop_judge',
      reason: 'chemical_props 为空',
    })
  }

  // 俗名匹配（字段存在且不同于正式名）
  if (
    commonNames &&
    commonNames !== name &&
    commonNames.length <= 40 &&
    !commonNames.includes('、')
  ) {
    const sc = pickSpecCat(item, [
      { specialty: 'memory', category: 'common_name' },
      { specialty: 'substance', category: 'name' },
    ])!
    out.push(
      mk({
        templateId: 'sub_common_name_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `「${commonNames}」可作为「${name}」的常见名称记载。判断正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code} 字段 common_names`,
        difficulty: 1,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'substance',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  }
}

function genReaction(
  item: GenKbItem,
  _ctx: unknown,
  out: GenCandidate[],
  skips: GenSkip[],
) {
  const row = item.row
  const equation = str(row.equation) || str(row.canonical_equation)
  const conditions = str(row.conditions)
  const oxidant = str(row.oxidant)
  const reductant = str(row.reductant)
  const phenomenon = str(row.phenomenon)
  const ambiguous = isAmbiguousReaction(item.code, item.name, equation)

  if (!equation || equation.length < 4) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'reaction',
      reason: '缺少 equation',
    })
    return
  }

  // 条件判断
  if (conditions && conditions.length >= 2 && conditions.length <= 40) {
    const sc = pickSpecCat(item, [
      { specialty: 'equation', category: 'condition' },
      { specialty: 'equation', category: 'true_false' },
    ])!
    out.push(
      mk({
        templateId: 'rxn_cond_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `反应「${equation.slice(0, 48)}」在知识库中标注的反应条件为「${conditions}」。判断该记载正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code} 字段 conditions`,
        difficulty: 1,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'reaction',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'reaction',
      templateId: 'rxn_cond_judge',
      reason: 'conditions 不明确，禁止用于唯一答案相关题',
    })
  }

  // 方程式识别（单选）：正确方程 vs 明显错误改写 —— 提高题；歧义反应跳过
  if (!ambiguous) {
    const wrong = equation.includes('=')
      ? equation.replace('=', '≠')
      : `${equation} + ?`
    // 更安全：把第一个加号侧反应物换为 H2O（若原方程不含纯水作唯一反应物）
    const fake = equation.replace(/^[^=]+/, 'H2O ').replace(/\s+/g, ' ').trim()
    const opts = [
      { key: 'A', text: equation },
      { key: 'B', text: fake === equation ? wrong : fake },
      { key: 'C', text: 'H2 + O2 = H2O（无关反应）' },
      { key: 'D', text: '无法确定' },
    ]
    // 确保干扰项不同
    if (opts[1].text !== opts[0].text) {
      const sc = pickSpecCat(item, [
        { specialty: 'equation', category: 'true_false' },
        { specialty: 'equation', category: 'balance' },
      ])!
      out.push(
        mk({
          templateId: 'rxn_eq_identify',
          qtype: 'single',
          answerType: 'text',
          stemBody: `下列哪一项是知识库中「${item.name}」的化学方程式？`,
          options: opts,
          answer: 'A',
          answerAliases: [],
          analysis: `来源 ${item.code} 字段 equation`,
          difficulty: 2,
          specialtyCode: sc.specialtyCode,
          categoryCode: sc.categoryCode,
          sourceCode: item.code,
          sourceType: 'reaction',
          sourceId: item.dbId,
          sourceName: item.name,
        }),
      )
    }
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'reaction',
      templateId: 'rxn_eq_identify',
      reason: '歧义/有机/KMnO4 类反应：限制方程式识别题',
    })
  }

  // 氧化还原
  const hasOx =
    oxidant &&
    reductant &&
    oxidant.length <= 40 &&
    reductant.length <= 40

  if (hasOx) {
    const scId = pickSpecCat(item, [
      { specialty: 'redox', category: 'identify' },
      { specialty: 'equation', category: 'redox_analysis' },
    ])!
    out.push(
      mk({
        templateId: 'rxn_is_redox_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `反应「${equation.slice(0, 40)}」属于氧化还原反应（知识库已标注氧化剂/还原剂）。判断正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code}；oxidant=${oxidant} reductant=${reductant}`,
        difficulty: 1,
        specialtyCode: scId.specialtyCode,
        categoryCode: scId.categoryCode,
        sourceCode: item.code,
        sourceType: 'reaction',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )

    const scOx = pickSpecCat(item, [
      { specialty: 'redox', category: 'oxidant' },
      { specialty: 'redox', category: 'identify' },
    ])!
    const oxDistractors = [reductant, 'H2O', 'N2'].filter(
      (x, i, a) => x !== oxidant && a.indexOf(x) === i,
    )
    while (oxDistractors.length < 3) oxDistractors.push(`X${oxDistractors.length}`)
    out.push(
      mk({
        templateId: 'rxn_oxidant_single',
        qtype: 'single',
        answerType: 'text',
        stemBody: `对于反应「${equation.slice(0, 36)}」，氧化剂是？`,
        options: [
          { key: 'A', text: oxidant },
          { key: 'B', text: oxDistractors[0] },
          { key: 'C', text: oxDistractors[1] },
          { key: 'D', text: oxDistractors[2] },
        ],
        answer: 'A',
        answerAliases: [],
        analysis: `来源 ${item.code} 字段 oxidant`,
        difficulty: 2,
        specialtyCode: scOx.specialtyCode,
        categoryCode: scOx.categoryCode,
        sourceCode: item.code,
        sourceType: 'reaction',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )

    const scRe = pickSpecCat(item, [
      { specialty: 'redox', category: 'reductant' },
      { specialty: 'redox', category: 'identify' },
    ])!
    const reDistractors = [oxidant, 'H2O', 'CO2'].filter(
      (x, i, a) => x !== reductant && a.indexOf(x) === i,
    )
    while (reDistractors.length < 3) reDistractors.push(`Y${reDistractors.length}`)
    out.push(
      mk({
        templateId: 'rxn_reductant_single',
        qtype: 'single',
        answerType: 'text',
        stemBody: `对于反应「${equation.slice(0, 36)}」，还原剂是？`,
        options: [
          { key: 'A', text: reductant },
          { key: 'B', text: reDistractors[0] },
          { key: 'C', text: reDistractors[1] },
          { key: 'D', text: reDistractors[2] },
        ],
        answer: 'A',
        answerAliases: [],
        analysis: `来源 ${item.code} 字段 reductant`,
        difficulty: 2,
        specialtyCode: scRe.specialtyCode,
        categoryCode: scRe.categoryCode,
        sourceCode: item.code,
        sourceType: 'reaction',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else if (item.specialtyCodes.includes('redox')) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'reaction',
      templateId: 'rxn_oxidant_single',
      reason: '挂接 redox 但 oxidant/reductant 字段不足',
    })
  } else {
    // 非氧化还原：明确判断「不一定是氧化还原」——仅当未标注氧化剂时
    const sc = pickSpecCat(item, [
      { specialty: 'redox', category: 'identify' },
      { specialty: 'equation', category: 'true_false' },
    ])!
    out.push(
      mk({
        templateId: 'rxn_not_marked_redox',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `仅根据「知识库未标注氧化剂/还原剂」，可断定反应「${equation.slice(0, 36)}」一定不是氧化还原反应。判断正误。`,
        options: null,
        answer: '错误',
        answerAliases: ['错', 'F', 'false', '×'],
        analysis: `来源 ${item.code}：字段缺失≠科学否定；本题考查「证据不足不可妄下结论」`,
        difficulty: 2,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'reaction',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  }

  // 现象判断（有 phenomenon）
  if (phenomenon && phenomenon.length >= 6 && phenomenon.length <= 80) {
    const sc = pickSpecCat(item, [
      { specialty: 'memory', category: 'phenomenon' },
      { specialty: 'equation', category: 'true_false' },
    ])!
    out.push(
      mk({
        templateId: 'rxn_phenomenon_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `知识库记载反应「${item.name}」的现象：${phenomenon}。判断该记载正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code} 字段 phenomenon`,
        difficulty: 1,
        specialtyCode: sc.specialtyCode,
        categoryCode: sc.categoryCode,
        sourceCode: item.code,
        sourceType: 'reaction',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  }

  // 禁止：条件不明时的方程式填空
  skips.push({
    sourceCode: item.code,
    sourceType: 'reaction',
    templateId: 'rxn_write_equation_blank',
    reason: '阶段A不生成方程式填空（避免答案不唯一/判题类型不符）',
  })
}

function genKnowledge(item: GenKbItem, out: GenCandidate[], skips: GenSkip[]) {
  const desc = str(item.row.description)
  if (!desc || desc.length < 12) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'knowledge',
      reason: 'description 过短',
    })
    return
  }

  const lead = extractLeadFact(desc)
  const miss = extractMisconception(desc)
  const sc = pickSpecCat(item, [
    { specialty: item.specialtyCodes[0] || 'comprehensive', category: 'basic' },
    { specialty: 'redox', category: 'e_conserve' },
    { specialty: 'ion', category: 'electrolyte' },
    { specialty: 'structure', category: 'atom_compose' },
    { specialty: 'memory', category: 'rules' },
  ])

  // 映射更合理的分类
  const mapCat = (): { specialtyCode: string; categoryCode: string } => {
    const code = item.code
    if (code.includes('redox') || code.includes('e_'))
      return { specialtyCode: 'redox', categoryCode: 'e_conserve' }
    if (code.includes('ion') || code.includes('electrolyte'))
      return { specialtyCode: 'ion', categoryCode: 'electrolyte' }
    if (code.includes('structure') || code.includes('atom'))
      return { specialtyCode: 'structure', categoryCode: 'atom_compose' }
    if (code.includes('periodic'))
      return { specialtyCode: 'periodic', categoryCode: 'elem_name' }
    if (code.includes('calc'))
      return { specialtyCode: 'calculation', categoryCode: 'amount' }
    if (code.includes('memory'))
      return { specialtyCode: 'memory', categoryCode: 'rules' }
    if (item.specialtyCodes[0]) {
      const pref = {
        redox: 'identify',
        ion: 'electrolyte',
        substance: 'chem_property',
        equation: 'true_false',
        calculation: 'amount',
        structure: 'atom_compose',
        periodic: 'elem_name',
        experiment: 'safety',
        memory: 'rules',
        organic: 'basic',
        inference: 'color',
        comprehensive: 'basic',
      } as Record<string, string>
      const sp = item.specialtyCodes[0]
      return { specialtyCode: sp, categoryCode: pref[sp] || 'basic' }
    }
    return sc || { specialtyCode: 'comprehensive', categoryCode: 'basic' }
  }

  const loc = mapCat()

  if (lead) {
    out.push(
      mk({
        templateId: 'kp_fact_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `${lead}。判断正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code} description 首句事实`,
        difficulty: 1,
        specialtyCode: loc.specialtyCode,
        categoryCode: loc.categoryCode,
        sourceCode: item.code,
        sourceType: 'knowledge',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'knowledge',
      templateId: 'kp_fact_judge',
      reason: '无法抽取可核对的首句事实',
    })
  }

  if (miss) {
    out.push(
      mk({
        templateId: 'kp_misconception_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `下列说法正确：${miss}。判断正误。`,
        options: null,
        answer: '错误',
        answerAliases: ['错', 'F', 'false', '×'],
        analysis: `来源 ${item.code} 「易错」标注，考查易错点辨析`,
        difficulty: 2,
        specialtyCode: loc.specialtyCode,
        categoryCode: loc.categoryCode,
        sourceCode: item.code,
        sourceType: 'knowledge',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'knowledge',
      templateId: 'kp_misconception_judge',
      reason: '无「易错：」可抽取句',
    })
  }

  // 记忆填空：仅白名单安全句式（答案可从 description 直接核对）
  const safeBlanks: { test: RegExp; stem: string; answer: string }[] = [
    {
      test: /电解质[：:是].*导电的化合物/,
      stem: '在水溶液里或熔融状态下能够导电的化合物称为____。',
      answer: '电解质',
    },
    {
      test: /非电解质[：:是].*不能导电的化合物/,
      stem: '在水溶液里和熔融状态下都不能导电的化合物称为____。',
      answer: '非电解质',
    },
    {
      test: /失电子总数\s*=\s*得电子总数|得失电子数必须相等/,
      stem: '氧化还原反应中，失电子总数等于____总数。',
      answer: '得电子',
    },
  ]
  let blankOk = false
  for (const b of safeBlanks) {
    if (!b.test.test(desc)) continue
    out.push(
      mk({
        templateId: 'kp_term_blank',
        qtype: 'blank',
        answerType: 'text',
        stemBody: b.stem,
        options: null,
        answer: b.answer,
        answerAliases: b.answer === '得电子' ? ['得电子数', '得到电子'] : [],
        analysis: `来源 ${item.code} 安全术语填空`,
        difficulty: 1,
        specialtyCode: loc.specialtyCode,
        categoryCode: loc.categoryCode,
        sourceCode: item.code,
        sourceType: 'knowledge',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
    blankOk = true
    break
  }
  if (!blankOk) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'knowledge',
      templateId: 'kp_term_blank',
      reason: '无安全的术语定义填空模式',
    })
  }

  skips.push({
    sourceCode: item.code,
    sourceType: 'knowledge',
    templateId: 'kp_random_cloze',
    reason: '禁止随意挖空 description 生成填空',
  })
}

function genConcept(item: GenKbItem, out: GenCandidate[], skips: GenSkip[]) {
  // 概念：复用 knowledge 逻辑但用 definition 字段
  const def =
    str(item.row.definition) ||
    str(item.row.description) ||
    str(item.row.summary)
  if (!def || def.length < 10) {
    skips.push({
      sourceCode: item.code,
      sourceType: 'concept',
      reason: 'definition/description 不足',
    })
    return
  }
  const lead = extractLeadFact(def) || (def.length <= 70 ? def.replace(/。$/, '') : null)
  const loc = pickSpecCat(item, [
    { specialty: 'ion', category: 'electrolyte' },
    { specialty: 'redox', category: 'identify' },
    { specialty: 'equation', category: 'true_false' },
    { specialty: 'memory', category: 'rules' },
    { specialty: 'comprehensive', category: 'basic' },
  ])!
  if (lead && lead.length >= 8 && lead.length <= 80) {
    out.push(
      mk({
        templateId: 'concept_fact_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `${lead}${lead.endsWith('。') ? '' : '。'}判断正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code}`,
        difficulty: 1,
        specialtyCode: loc.specialtyCode,
        categoryCode: loc.categoryCode,
        sourceCode: item.code,
        sourceType: 'concept',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'concept',
      reason: '无法抽取安全判断句',
    })
  }
}

function genFormula(item: GenKbItem, out: GenCandidate[], skips: GenSkip[]) {
  const expr = str(item.row.expression) || str(item.row.formula) || str(item.row.name)
  const note = str(item.row.note) || str(item.row.description) || str(item.row.usage)
  if (item.code === 'formula.gas_STP' || item.code === 'formula.Vm' || /22\.4/.test(expr + note)) {
    out.push(
      mk({
        templateId: 'fm_stp_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: '气体摩尔体积 22.4 L/mol 适用于任何温度和压强下的气体。判断正误。',
        options: null,
        answer: '错误',
        answerAliases: ['错', 'F', 'false', '×'],
        analysis: `来源 ${item.code}：仅标况适用`,
        difficulty: 2,
        specialtyCode: 'calculation',
        categoryCode: 'molar_volume',
        sourceCode: item.code,
        sourceType: 'formula',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
    return
  }
  if (item.code === 'formula.c_n_V' || /mol\/L|物质的量浓度/.test(expr + note + item.name)) {
    out.push(
      mk({
        templateId: 'fm_c_unit_single',
        qtype: 'single',
        answerType: 'text',
        stemBody: '物质的量浓度 c 的常用单位是？',
        options: [
          { key: 'A', text: 'mol/L' },
          { key: 'B', text: 'g/mol' },
          { key: 'C', text: 'L/mol' },
          { key: 'D', text: 'mol' },
        ],
        answer: 'A',
        answerAliases: [],
        analysis: `来源 ${item.code}`,
        difficulty: 1,
        specialtyCode: 'calculation',
        categoryCode: 'concentration',
        sourceCode: item.code,
        sourceType: 'formula',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
    return
  }
  skips.push({
    sourceCode: item.code,
    sourceType: 'formula',
    reason: '阶段A仅覆盖 STP/Vm/c 等安全公式模板',
  })
}

function genExperiment(item: GenKbItem, out: GenCandidate[], skips: GenSkip[]) {
  out.push(
    mk({
      templateId: 'exp_home_forbidden',
      qtype: 'judge',
      answerType: 'text',
      stemBody: '危险化学实验可以在家自行操作完成。判断正误。',
      options: null,
      answer: '错误',
      answerAliases: ['错', 'F', 'false', '×'],
      analysis: `书面训练原则；关联 ${item.code}`,
      difficulty: 1,
      specialtyCode: 'experiment',
      categoryCode: 'safety',
      sourceCode: item.code,
      sourceType: 'experiment',
      sourceId: item.dbId,
      sourceName: item.name,
    }),
  )
  const obs = str(item.row.phenomenon) || str(item.row.observations)
  if (obs && obs.length >= 6 && obs.length <= 80) {
    out.push(
      mk({
        templateId: 'exp_obs_judge',
        qtype: 'judge',
        answerType: 'text',
        stemBody: `知识库对实验「${item.name}」记载了现象描述。判断正误。`,
        options: null,
        answer: '正确',
        answerAliases: ['对', 'T', 'true', '√'],
        analysis: `来源 ${item.code}`,
        difficulty: 1,
        specialtyCode: 'experiment',
        categoryCode: 'phenomenon_judge',
        sourceCode: item.code,
        sourceType: 'experiment',
        sourceId: item.dbId,
        sourceName: item.name,
      }),
    )
  } else {
    skips.push({
      sourceCode: item.code,
      sourceType: 'experiment',
      templateId: 'exp_obs_judge',
      reason: '现象字段不足',
    })
  }
}

export function qualityCheck(c: GenCandidate): string | null {
  if (!c.stem || c.stem.length < 10) return '题干过短'
  if (!c.answer) return '缺少标准答案'
  if (c.qtype === 'single') {
    if (!c.options || c.options.length < 2) return '单选选项不足'
    const texts = c.options.map((o) => o.text.trim())
    if (new Set(texts).size !== texts.length) return '存在重复选项'
    if (!c.options.some((o) => o.key === c.answer)) return '答案键不在选项中'
    const correctTexts = c.options.filter((o) => o.key === c.answer)
    if (correctTexts.length !== 1) return '正确选项不唯一'
  }
  if (c.qtype === 'blank' && c.answerType === 'chem_formula') {
    if (looksLikeEquation(c.answer)) return '化学式答案疑似方程式'
    if (!hasAsciiFormula(c.answer)) return '化学式答案格式不合法'
  }
  if (c.difficulty !== 1 && c.difficulty !== 2) return '阶段A仅允许难度1/2'
  return null
}
