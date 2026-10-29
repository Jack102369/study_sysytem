import { mkCheck } from './industrial-quality.rules'
import type {
  IndustrialQualityCandidateBundle,
  IndustrialQualityCheckResult,
} from './industrial-quality.types'

export function checkTeachingDimension(
  bundle: IndustrialQualityCandidateBundle,
): IndustrialQualityCheckResult[] {
  const out: IndustrialQualityCheckResult[] = []
  const q = bundle.candidate

  out.push(
    mkCheck({
      checkCode: 'TEACH_STEM',
      dimension: 'teaching',
      status: q.stem.trim().length >= 8 ? 'pass' : 'fail',
      severity: q.stem.trim().length >= 8 ? 'info' : 'error',
      message: q.stem.trim().length >= 8 ? '题干完整' : '题干过短或不完整',
      evidence: [q.stem.slice(0, 40)],
    }),
  )

  if (q.qtype === 'single') {
    const opts = q.options || []
    const countOk = opts.length >= 2 && opts.length <= 6
    out.push(
      mkCheck({
        checkCode: 'TEACH_OPTIONS_COUNT',
        dimension: 'teaching',
        status: countOk ? 'pass' : 'fail',
        severity: countOk ? 'info' : 'error',
        message: countOk ? '单选选项数量合法' : '单选选项数量非法',
        evidence: [`count=${opts.length}`],
      }),
    )
    const uniq = new Set(opts.map((o) => o.trim()))
    out.push(
      mkCheck({
        checkCode: 'TEACH_OPTIONS_DUP',
        dimension: 'teaching',
        status: uniq.size === opts.length ? 'pass' : 'fail',
        severity: uniq.size === opts.length ? 'info' : 'error',
        message:
          uniq.size === opts.length ? '选项无重复' : '存在重复选项',
        evidence: opts,
      }),
    )
  }

  // 题干是否直接泄露答案文本
  const ansText =
    typeof q.answer === 'string'
      ? q.answer
      : typeof q.answer === 'boolean'
        ? ''
        : Array.isArray(q.answer)
          ? q.answer.join('|')
          : ''
  if (
    q.qtype === 'blank' &&
    ansText &&
    ansText.length >= 2 &&
    q.stem.includes(ansText)
  ) {
    out.push(
      mkCheck({
        checkCode: 'TEACH_ANSWER_IN_STEM',
        dimension: 'teaching',
        status: 'fail',
        severity: 'critical',
        message: '题干直接包含填空标准答案文本',
        evidence: [ansText],
      }),
    )
  } else {
    out.push(
      mkCheck({
        checkCode: 'TEACH_ANSWER_IN_STEM',
        dimension: 'teaching',
        status: 'pass',
        severity: 'info',
        message: '未检测到题干直接粘贴标准答案文本',
      }),
    )
  }

  // displayLabel 泄露 answerLabel
  for (const n of bundle.definition.nodes) {
    const ans = n.internal?.answerLabel
    if (ans && n.displayLabel.includes(ans)) {
      out.push(
        mkCheck({
          checkCode: 'TEACH_LABEL_LEAK',
          dimension: 'teaching',
          status: 'fail',
          severity: 'critical',
          message: `节点 ${n.id} displayLabel 泄露 answerLabel`,
          evidence: [n.displayLabel, ans],
        }),
      )
    }
  }

  // 开放题风险
  if (/请简述|谈谈你的理解|开放论述|任意作答/.test(q.stem)) {
    out.push(
      mkCheck({
        checkCode: 'TEACH_OPEN_ENDED',
        dimension: 'teaching',
        status: 'unknown',
        severity: 'warning',
        message: '疑似开放论述题，精确判题适配未证明',
        evidence: [q.stem.slice(0, 60)],
      }),
    )
  }

  // 题型与 answerType
  out.push(
    mkCheck({
      checkCode: 'TEACH_QTYPE_MATCH',
      dimension: 'teaching',
      status: q.qtype === q.answerType ? 'pass' : 'fail',
      severity: q.qtype === q.answerType ? 'info' : 'error',
      message:
        q.qtype === q.answerType
          ? 'qtype 与 answerType 一致'
          : 'qtype 与 answerType 不一致',
      evidence: [q.qtype, q.answerType],
    }),
  )

  // 多正确答案风险（单选）
  if (q.qtype === 'single' && Array.isArray(q.answer) && q.answer.length > 1) {
    out.push(
      mkCheck({
        checkCode: 'TEACH_MULTI_KEY',
        dimension: 'teaching',
        status: 'fail',
        severity: 'error',
        message: '单选题出现多个标准答案',
        evidence: q.answer.map(String),
      }),
    )
  }

  out.push(
    mkCheck({
      checkCode: 'TEACH_JUDGE_COMPAT',
      dimension: 'teaching',
      status: 'unknown',
      severity: 'info',
      message: '与正式 chem-train-grade 的完整兼容性留待 STEP_09 核对',
      evidence: ['no_grade_service_mutation'],
    }),
  )

  return out
}
