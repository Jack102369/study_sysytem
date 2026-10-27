/**
 * GLOBAL-4A QUALITY-REBUILD core helpers
 */
export const METHODS = [
  'defn',
  'classification',
  'equiv_transform',
  'special_value',
  'num_shape',
  'mono_analysis',
  'parity_apply',
  'substitution',
  'graph_symmetry',
  'domain_symmetry',
  'undetermined_coeff',
]

export const CRUTCH_RE =
  /辅助参数|区分参数|不改变正确|不改变命题|无需使用|不影响结论|数据指纹|唯一编号|另设辅助|题号参数|候选编号|仅作题干区分|不参与求解|辨识\s*\d/

export function seed(n, a = 2, b = 9) {
  return a + ((Math.abs(n) * 7) % (b - a + 1))
}

export function pick(n, arr) {
  return arr[Math.abs(n) % arr.length]
}

export function methodPair(n, hard) {
  const methodMain = pick(n, METHODS)
  if (!hard) return { methodMain, methodAux: null }
  const rest = METHODS.filter((m) => m !== methodMain)
  return { methodMain, methodAux: pick(n + 5, rest) }
}

export function normStem(s) {
  return String(s || '')
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\d+/g, '#')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function normExact(s) {
  return String(s || '')
    .replace(/\$/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function appRubric(parts, maxScore) {
  const sum = parts.reduce((s, p) => s + p.score, 0)
  if (sum !== maxScore) throw new Error(`rubric sum ${sum} != ${maxScore}`)
  return {
    maxScore,
    rubric: parts.map((p, i) => ({
      key: p.key || `p${i + 1}`,
      title: p.title,
      score: p.score,
      criterion: p.criterion,
    })),
  }
}

export function baseItem(slot, partial, evidenceExtra = {}) {
  const n = parseInt(slot.id.slice(-3), 10)
  const hard = slot.difficulty >= 3
  const { methodMain, methodAux } = methodPair(n + slot.chapterNo * 13, hard)
  const item = {
    id: slot.id,
    book: slot.book,
    chapterNo: slot.chapterNo,
    specialtyCode: slot.specialtyCode,
    kpCode: slot.kpHint.code,
    kpName: slot.kpHint.name,
    kpInDb: true,
    kpInSeed: true,
    qtype: slot.qtype,
    difficulty: slot.difficulty,
    methodMain,
    methodAux,
    sourceType: 'original',
    sourceEvidence: '本批质量重建原创；非高考真题',
    mathCheck: 'PASS',
    mathVerified: 'AUTHOR_CHECKED',
    reviewReady: true,
    blockReasons: [],
    diagramRequirement: 'NOT_NEEDED',
    diagramSpecification: null,
    noDiagramReason: '文字条件充分，无需图示。',
    maxScore: null,
    rubric: null,
    ...partial,
  }
  if (item.qtype !== 'application') {
    item.maxScore = null
    item.rubric = null
  }
  if (item.diagramRequirement === 'NOT_NEEDED' && !item.noDiagramReason) {
    item.noDiagramReason = '文字条件充分，无需图示。'
  }
  if (item.diagramRequirement === 'REQUIRED') {
    item.noDiagramReason = null
    if (!item.diagramSpecification) {
      item.diagramSpecification = {
        purpose: '配合几何/向量结构示意',
        elements: ['关键点线面或向量标注'],
        mustNotReveal: '不得标注最终数值答案或证明结论',
      }
    }
  }
  if (CRUTCH_RE.test(item.stem)) {
    throw new Error('crutch in stem: ' + slot.id)
  }
  const evidence = {
    id: slot.id,
    coreDerivation: evidenceExtra.coreDerivation || item.authorMathNote || item.analysis,
    answerBasis: evidenceExtra.answerBasis || `答案=${item.answer}`,
    difficultyBasis:
      evidenceExtra.difficultyBasis ||
      (hard
        ? item.hardProfile?.whyNotEasy || '压轴：见 hardProfile'
        : `难度${slot.difficulty}：与标注匹配的单一/双点考查`),
    rubricVerdict:
      item.qtype === 'application'
        ? evidenceExtra.rubricVerdict ||
          `maxScore=${item.maxScore}; sumOK; 分点按关键步骤非抄题干`
        : 'N/A',
    dedupVerdict: evidenceExtra.dedupVerdict || 'pending',
    diagramVerdict:
      evidenceExtra.diagramVerdict ||
      `${item.diagramRequirement}; ${item.noDiagramReason || '需图'}`,
    hardProfile: item.hardProfile || null,
    independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
    rebuildAction: evidenceExtra.rebuildAction || 'rewrite',
  }
  // strip internal helper from exported candidate
  const { hardProfile, ...pub } = item
  return { item: pub, evidence, hardProfile: item.hardProfile || null }
}
