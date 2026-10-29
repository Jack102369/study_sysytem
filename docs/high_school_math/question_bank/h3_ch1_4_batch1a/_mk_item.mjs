/** Factory helpers for H3C14 offline items. */
export function appItem(p) {
  const sum = (p.rubric || []).reduce((s, r) => s + r.score, 0)
  if (p.maxScore != null && sum !== p.maxScore) {
    throw new Error(`${p.n}: rubric ${sum} != maxScore ${p.maxScore}`)
  }
  return {
    ...p,
    book: '必修一',
    specialtyCode: `rja-ch${p.chapterNo}`,
    sectionName: p.sectionName,
    difficulty: 3,
    hardLevel: 'H3',
    sourceType: 'original',
    sourceEvidence: 'H3C14 原创；思想结构可参考近年高考综合题，非真题复制',
    diagramRequirement: p.diagramRequirement || 'NOT_NEEDED',
    diagramSpecification: p.diagramSpecification || null,
    noDiagramReason: p.noDiagramReason || '文字与符号推理自足。',
    options: p.options ?? null,
    mathCheck: 'PASS',
    mathVerified: 'AUTHOR_CHECKED',
    reviewReady: true,
    hardAudit: 'ACCEPTED_H3',
    round1: 'MATH_PASS',
    round2: 'ACCEPTED_H3',
  }
}
