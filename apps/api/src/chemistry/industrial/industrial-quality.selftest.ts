/**
 * 工业质量检查自检（无 DB）。
 * pnpm --filter api run chem:industrial-quality-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { CASE_SALT_PURIFICATION } from './industrial-case.fixtures'
import { generateIndustrialAiCandidateWithMock } from './industrial-ai-generator.service'
import type { IndustrialAiGenerateRequest } from './industrial-ai-generator.types'
import { INDUSTRIAL_QUALITY_DIMENSIONS } from './industrial-quality.constants'
import {
  computeQuestionContentHash,
  isIndustrialQualityReportCurrent,
} from './industrial-quality.hash'
import { checkIndustrialCandidateQuality } from './industrial-quality.service'
import type { IndustrialQualityCandidateBundle } from './industrial-quality.types'
import { cloneDeep } from './industrial-quality.selftest-util'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function baseReq(): IndustrialAiGenerateRequest {
  return {
    specialtyCode: 'industrial_experiment',
    categoryCode: 'industrial_separation_purification',
    caseCode: 'salt_purification_basic',
    knowledgePoints: ['过滤', '固液分离'],
    difficulty: 1,
    qtype: 'single',
    questionCount: 1,
    diagramRequired: true,
    generationMode: 'development_test',
  }
}

async function buildBundle(): Promise<IndustrialQualityCandidateBundle> {
  const gen = await generateIndustrialAiCandidateWithMock(
    baseReq(),
    'success_single',
    { writeFiles: true },
  )
  assert(gen.ok && gen.candidate && gen.diagramDefinition && gen.publicDiagram && gen.svg && gen.renderReport, 'gen ok')
  return {
    candidateId: gen.task.taskId,
    developmentOnly: true,
    categoryCode: 'industrial_separation_purification',
    industrialCase: CASE_SALT_PURIFICATION,
    candidate: gen.candidate!,
    definition: gen.diagramDefinition!,
    publicDiagram: gen.publicDiagram!,
    svg: gen.svg!,
    renderReport: gen.renderReport!,
  }
}

async function main() {
  const bundle = await buildBundle()

  // 1 合法候选产生报告 + 六维
  const report = await checkIndustrialCandidateQuality(bundle, {
    writeReport: true,
    outputDir: bundle.candidateId
      ? join(
          process.cwd(),
          '..',
          '..',
          'docs',
          'chemistry_industrial_experiment',
          'generated_candidates',
          bundle.candidateId,
        )
      : undefined,
    useMockAiReviewer: true,
  })
  // 修正 outputDir：用 generate 的路径
  const genDirCandidates = [
    join(
      process.cwd(),
      '..',
      '..',
      'docs',
      'chemistry_industrial_experiment',
      'generated_candidates',
      bundle.candidateId,
    ),
    join(
      process.cwd(),
      'docs',
      'chemistry_industrial_experiment',
      'generated_candidates',
      bundle.candidateId,
    ),
  ]
  // 重新写到真实目录
  const realDir =
    genDirCandidates.find((p) => existsSync(p)) ||
    genDirCandidates[0]
  const report2 = await checkIndustrialCandidateQuality(bundle, {
    writeReport: true,
    outputDir: realDir,
    useMockAiReviewer: true,
  })
  assert(report2.requiresHumanReview === true, 'human review required')
  assert(report2.developmentOnly === true, 'dev only')
  assert(report2.formalPublishEligible === false, 'no formal publish')
  const dims = new Set(report2.checks.map((c) => c.dimension))
  for (const d of INDUSTRIAL_QUALITY_DIMENSIONS) {
    assert(dims.has(d), `missing dimension ${d}`)
  }
  assert(existsSync(join(realDir, 'quality-report.json')), 'quality-report written')

  // development_only 即使结构好也不能正式
  assert(
    report2.overallStatus === 'incomplete_verification' ||
      report2.overallStatus === 'failed_automatic_checks' ||
      report2.overallStatus === 'passed_automatic_checks',
    'overall set',
  )
  // draft 案例应有 unknown/fail 化学或课程项
  assert(
    report2.unknownIssues.length > 0 || report2.blockingIssues.length > 0,
    'dev case should have unknown or blocking',
  )

  // 错误答案
  {
    const b = cloneDeep(bundle)
    b.candidate.answer = 'Z'
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      r.checks.some((c) => c.checkCode === 'CONS_ANSWER_OPTION' && c.status === 'fail'),
      'bad answer',
    )
  }

  // 错误节点引用
  {
    const b = cloneDeep(bundle)
    b.candidate.referencedNodeIds = ['n_missing']
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      r.checks.some((c) => c.checkCode === 'CONS_NODE_ID' && c.status === 'fail'),
      'bad node',
    )
  }

  // 答案泄露
  {
    const b = cloneDeep(bundle)
    const unk = b.definition.nodes.find((n) => n.type === 'unknown')
    assert(!!unk, 'has unknown')
    unk!.displayLabel = `操作①${unk!.internal?.answerLabel || '过滤'}`
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      r.checks.some((c) => c.checkCode === 'TEACH_LABEL_LEAK' && c.status === 'fail'),
      'label leak',
    )
    assert(r.overallStatus === 'failed_automatic_checks', 'leak blocks')
  }

  // 非法 SVG
  {
    const b = cloneDeep(bundle)
    b.svg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      r.checks.some((c) => c.checkCode === 'DIAG_SVG_SAFE' && c.status === 'fail'),
      'unsafe svg',
    )
  }

  // 非法化学式
  {
    const b = cloneDeep(bundle)
    b.candidate.stem = `${b.candidate.stem}（含 H3O4）`
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      r.checks.some((c) => c.checkCode === 'CHEM_BAD_FORMULA' && c.status === 'fail'),
      'bad formula',
    )
  }

  // 工艺错误：过滤除可溶盐（肯定错误表述）
  {
    const b = cloneDeep(bundle)
    b.candidate.explanation = '用过滤除去可溶性盐杂质即可'
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      r.checks.some((c) => c.checkCode === 'FILTER_SOLUBLE_SALT' && c.status === 'fail'),
      'filter soluble',
    )
  }

  // 工艺规则不得误伤正确教学说明（E2-A 回归）
  {
    const b = cloneDeep(bundle)
    b.candidate.explanation =
      '过滤针对不溶固体；可溶性杂质需另选化学方法（本案例未覆盖）。'
    b.candidate.stem =
      '过滤的主要目的是除去不溶性杂质。过滤不能用于除去可溶性盐。'
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      !r.checks.some(
        (c) => c.checkCode === 'FILTER_SOLUBLE_SALT' && c.status === 'fail',
      ),
      'filter teaching text must not false-positive',
    )
  }

  // 图文不一致：操作①
  {
    const b = cloneDeep(bundle)
    b.candidate.stem = '流程中操作②的作用是什么？'
    b.candidate.referencedLabels = []
    const r = await checkIndustrialCandidateQuality(b, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(
      r.checks.some((c) => c.checkCode === 'CONS_OP_IN_STEM' && c.status === 'fail'),
      'op mismatch',
    )
  }

  // AI 未配置/关闭仍生成报告
  {
    const r = await checkIndustrialCandidateQuality(bundle, {
      enableAiReview: false,
      writeReport: false,
    })
    assert(r.aiReviewStatus === 'not_executed', 'ai off')
    assert(r.checks.length > 0, 'deterministic checks exist')
  }

  // Mock AI 审查 → unknown 辅助，不伪造 pass 覆盖
  {
    const r = await checkIndustrialCandidateQuality(bundle, {
      useMockAiReviewer: true,
      writeReport: false,
    })
    assert(r.aiReviewStatus === 'mock', 'mock ai')
    assert(
      r.checks.filter((c) => c.checkCode.startsWith('AI_AUX_')).every((c) => c.status === 'unknown'),
      'ai aux unknown',
    )
  }

  // 报告失效：题干变化
  {
    const current = isIndustrialQualityReportCurrent(report2, {
      industrialCase: bundle.industrialCase,
      candidate: bundle.candidate,
      definition: bundle.definition,
      publicDiagram: bundle.publicDiagram,
    })
    assert(current, 'report current')
    const changed = cloneDeep(bundle.candidate)
    changed.stem = `${changed.stem}（改）`
    assert(
      !isIndustrialQualityReportCurrent(report2, {
        industrialCase: bundle.industrialCase,
        candidate: changed,
        definition: bundle.definition,
        publicDiagram: bundle.publicDiagram,
      }),
      'stem change invalidates',
    )
    changed.stem = bundle.candidate.stem
    changed.answer = 'A'
    assert(
      !isIndustrialQualityReportCurrent(report2, {
        industrialCase: bundle.industrialCase,
        candidate: changed,
        definition: bundle.definition,
        publicDiagram: bundle.publicDiagram,
      }),
      'answer change invalidates',
    )
  }

  // 解析变化
  {
    const changed = cloneDeep(bundle.candidate)
    changed.explanation = `${changed.explanation} 补充`
    assert(
      computeQuestionContentHash(changed) !== report2.questionContentHash,
      'expl hash change',
    )
  }

  // Definition / Public 变化
  {
    const def2 = cloneDeep(bundle.definition)
    def2.diagramContentHash = '0'.repeat(64)
    assert(
      !isIndustrialQualityReportCurrent(report2, {
        industrialCase: bundle.industrialCase,
        candidate: bundle.candidate,
        definition: def2,
        publicDiagram: bundle.publicDiagram,
      }),
      'def change',
    )
    const pub2 = cloneDeep(bundle.publicDiagram)
    pub2.publicContentHash = '1'.repeat(64)
    assert(
      !isIndustrialQualityReportCurrent(report2, {
        industrialCase: bundle.industrialCase,
        candidate: bundle.candidate,
        definition: bundle.definition,
        publicDiagram: pub2,
      }),
      'pub change',
    )
  }

  // 案例变化
  {
    const c2 = cloneDeep(bundle.industrialCase)
    c2.contentHash = '2'.repeat(64)
    assert(
      !isIndustrialQualityReportCurrent(report2, {
        industrialCase: c2,
        candidate: bundle.candidate,
        definition: bundle.definition,
        publicDiagram: bundle.publicDiagram,
      }),
      'case change',
    )
  }

  // 未审核案例不能正式通过
  assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'still draft')
  assert(report2.formalPublishEligible === false, 'draft not formal')

  // 程序 fail 不被 AI 覆盖：构造泄露 + mock AI
  {
    const b = cloneDeep(bundle)
    b.svg = b.svg + 'answerLabel'
    const r = await checkIndustrialCandidateQuality(b, {
      useMockAiReviewer: true,
      writeReport: false,
    })
    assert(r.overallStatus === 'failed_automatic_checks', 'fail wins over ai')
  }

  // 不修改案例审核
  assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'case untouched')

  // 读取写出的报告
  const saved = JSON.parse(
    readFileSync(join(realDir, 'quality-report.json'), 'utf8'),
  ) as { requiresHumanReview: boolean; formalPublishEligible: boolean }
  assert(saved.requiresHumanReview === true, 'saved human')
  assert(saved.formalPublishEligible === false, 'saved no formal')

  // eslint-disable-next-line no-console
  console.log(
    'industrial-quality.selftest: OK (deterministic+mock AI; live AI review NOT_EXECUTED)',
  )
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
