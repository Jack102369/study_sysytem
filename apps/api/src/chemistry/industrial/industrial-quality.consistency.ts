import { mkCheck } from './industrial-quality.rules'
import type {
  IndustrialQualityCandidateBundle,
  IndustrialQualityCheckResult,
} from './industrial-quality.types'

export function checkConsistencyDimension(
  bundle: IndustrialQualityCandidateBundle,
): IndustrialQualityCheckResult[] {
  const out: IndustrialQualityCheckResult[] = []
  const q = bundle.candidate
  const def = bundle.definition
  const ids = new Set(def.nodes.map((n) => n.id))
  const labels = def.nodes.map((n) => n.displayLabel)

  for (const id of q.referencedNodeIds || []) {
    out.push(
      mkCheck({
        checkCode: 'CONS_NODE_ID',
        dimension: 'consistency',
        status: ids.has(id) ? 'pass' : 'fail',
        severity: ids.has(id) ? 'info' : 'error',
        message: ids.has(id)
          ? `引用节点存在：${id}`
          : `题干引用节点不存在：${id}`,
        evidence: [id],
      }),
    )
  }

  for (const lab of q.referencedLabels || []) {
    const hit = labels.some((l) => l.includes(lab) || lab.includes(l))
    out.push(
      mkCheck({
        checkCode: 'CONS_LABEL',
        dimension: 'consistency',
        status: hit ? 'pass' : 'fail',
        severity: hit ? 'info' : 'error',
        message: hit ? `引用标签存在：${lab}` : `题干引用标签缺失：${lab}`,
        evidence: [lab, ...labels.slice(0, 8)],
      }),
    )
  }

  const ops = q.stem.match(/操作[①②③④⑤⑥⑦⑧⑨⑩]/g) || []
  for (const op of ops) {
    const hit = labels.some((l) => l.includes(op))
    out.push(
      mkCheck({
        checkCode: 'CONS_OP_IN_STEM',
        dimension: 'consistency',
        status: hit ? 'pass' : 'fail',
        severity: hit ? 'info' : 'error',
        message: hit
          ? `题干 ${op} 在图中有对应标签`
          : `题干提及 ${op} 但流程图无对应节点`,
        evidence: [op],
      }),
    )
  }

  // 未知节点必须有服务端答案关联
  for (const n of def.nodes.filter((x) => x.type === 'unknown')) {
    const hasAns =
      Boolean(n.internal?.answerLabel?.trim()) ||
      Boolean(n.internal?.unknownKey?.trim())
    out.push(
      mkCheck({
        checkCode: 'CONS_UNKNOWN_ANSWER_LINK',
        dimension: 'consistency',
        status: hasAns ? 'pass' : 'fail',
        severity: hasAns ? 'info' : 'error',
        message: hasAns
          ? `未知节点 ${n.id} 有内部答案关联`
          : `未知节点 ${n.id} 缺少 answerLabel/unknownKey`,
        evidence: [n.id, n.displayLabel],
      }),
    )
  }

  // 答案与选项
  if (q.qtype === 'single') {
    const opts = q.options || []
    const ans = String(q.answer).trim().toUpperCase()
    const letterOk = /^[A-Z]$/.test(ans) && ans.charCodeAt(0) - 65 < opts.length
    const textOk = opts.some((o) => o === q.answer)
    out.push(
      mkCheck({
        checkCode: 'CONS_ANSWER_OPTION',
        dimension: 'consistency',
        status: letterOk || textOk ? 'pass' : 'fail',
        severity: letterOk || textOk ? 'info' : 'error',
        message:
          letterOk || textOk
            ? '单选答案对应有效选项'
            : '单选答案无法对应选项',
        evidence: [String(q.answer), `options=${opts.length}`],
      }),
    )
  } else if (q.qtype === 'judge') {
    const ok =
      typeof q.answer === 'boolean' ||
      ['true', 'false', '对', '错', '正确', '错误', 'T', 'F'].includes(
        String(q.answer).trim(),
      )
    out.push(
      mkCheck({
        checkCode: 'CONS_ANSWER_JUDGE',
        dimension: 'consistency',
        status: ok ? 'pass' : 'fail',
        severity: ok ? 'info' : 'error',
        message: ok ? '判断题答案格式可识别' : '判断题答案格式非法',
        evidence: [String(q.answer)],
      }),
    )
  } else {
    const blank = String(q.answer ?? '').trim()
    out.push(
      mkCheck({
        checkCode: 'CONS_ANSWER_BLANK',
        dimension: 'consistency',
        status: blank ? 'pass' : 'fail',
        severity: blank ? 'info' : 'error',
        message: blank ? '填空答案非空' : '填空答案为空',
        evidence: [blank.slice(0, 40)],
      }),
    )
  }

  // 解析引用：检查解析中的操作①等
  const explOps = q.explanation.match(/操作[①②③④⑤⑥⑦⑧⑨⑩]/g) || []
  for (const op of explOps) {
    const hit = labels.some((l) => l.includes(op))
    if (!hit) {
      out.push(
        mkCheck({
          checkCode: 'CONS_EXPL_OP',
          dimension: 'consistency',
          status: 'fail',
          severity: 'error',
          message: `解析提及 ${op} 但图中无对应标签`,
          evidence: [op],
        }),
      )
    }
  }

  // 答案与内部 answerLabel 冲突（若题干指向未知操作且答案是字母，仅做弱检查）
  const unk = def.nodes.find((n) => n.type === 'unknown')
  if (unk?.internal?.answerLabel && q.qtype === 'blank') {
    const ans = String(q.answer)
    if (ans && ans !== unk.internal.answerLabel && q.stem.includes(unk.displayLabel)) {
      out.push(
        mkCheck({
          checkCode: 'CONS_ANSWER_INTERNAL',
          dimension: 'consistency',
          status: 'unknown',
          severity: 'warning',
          message: '填空答案与未知节点 answerLabel 不一致，需人工确认',
          evidence: [ans, unk.internal.answerLabel],
        }),
      )
    }
  }

  if (!q.explanation.trim()) {
    out.push(
      mkCheck({
        checkCode: 'CONS_EXPLANATION_PRESENT',
        dimension: 'consistency',
        status: 'fail',
        severity: 'error',
        message: '解析为空',
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'CONS_EXPLANATION_PRESENT',
        dimension: 'consistency',
        status: 'unknown',
        severity: 'info',
        message: '解析非空；语义正确性未自动证明',
        evidence: [q.explanation.slice(0, 60)],
      }),
    )
  }

  return out
}
