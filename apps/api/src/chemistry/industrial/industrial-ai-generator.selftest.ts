/**
 * 工业 AI 出题自检（Mock；无 DB；默认不调用真实模型）。
 * pnpm --filter api run chem:industrial-ai-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { CASE_SALT_PURIFICATION } from './industrial-case.fixtures'
import { loadIndustrialAiProviderConfig, summarizeConfig } from './industrial-ai-config'
import {
  generateIndustrialAiCandidate,
  generateIndustrialAiCandidateWithMock,
} from './industrial-ai-generator.service'
import { validateIndustrialAiGenerateRequest } from './industrial-ai-generator.validate'
import type { IndustrialAiGenerateRequest } from './industrial-ai-generator.types'
import { IndustrialAiHttpProvider } from './industrial-ai-provider.http'
import { IndustrialAiMockProvider } from './industrial-ai-provider.mock'
import type { MockProviderScenario } from './industrial-ai-provider.types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function baseReq(
  over: Partial<IndustrialAiGenerateRequest> = {},
): IndustrialAiGenerateRequest {
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
    ...over,
  }
}

async function main() {
  // 配置摘要（不打印密钥）
  const cfg = summarizeConfig(loadIndustrialAiProviderConfig())
  assert(!('apiKey' in (cfg as object) && (cfg as { apiKey?: string }).apiKey), 'no apiKey in summary')
  // eslint-disable-next-line no-console
  console.log('AI config summary:', cfg)

  // 请求校验
  assert(!validateIndustrialAiGenerateRequest({}).ok, 'empty request')
  assert(!validateIndustrialAiGenerateRequest(baseReq({ specialtyCode: 'x' })).ok, 'bad specialty')
  assert(!validateIndustrialAiGenerateRequest(baseReq({ categoryCode: 'nope' })).ok, 'bad category')
  assert(!validateIndustrialAiGenerateRequest(baseReq({ qtype: 'essay' as never })).ok, 'bad qtype')
  assert(!validateIndustrialAiGenerateRequest(baseReq({ questionCount: 99 })).ok, 'bad count')
  assert(validateIndustrialAiGenerateRequest(baseReq()).ok, 'good request')

  // 正式模式拒绝 draft
  {
    const r = await generateIndustrialAiCandidate(
      baseReq({ generationMode: 'formal_candidate' }),
      { writeFiles: false, mockScenario: 'success_single' },
    )
    assert(!r.ok, 'formal must reject draft case')
    assert(r.task.errorCode === 'CASE_TRUST_REJECTED', `expect trust reject got ${r.task.errorCode}`)
  }

  // 成功：single / judge / blank
  for (const [qtype, scenario] of [
    ['single', 'success_single'],
    ['judge', 'success_judge'],
    ['blank', 'success_blank'],
  ] as const) {
    const r = await generateIndustrialAiCandidateWithMock(
      baseReq({ qtype, difficulty: qtype === 'judge' ? 2 : 1 }),
      scenario,
      { writeFiles: false },
    )
    assert(r.ok, `${qtype} should ok: ${r.task.errorMessage}`)
    assert(r.task.developmentOnly, 'development_only')
    assert(r.task.generationSource === 'mock_generated', 'mock source')
    assert(r.task.status === 'development_only', 'status')
    assert(r.candidate?.qtype === qtype, 'qtype')
    assert(r.publicDiagram, 'public')
    assert(r.svg?.includes('xmlns'), 'svg')
    assert(!r.svg!.includes('answerLabel'), 'no answer in svg')
    assert(!JSON.stringify(r.publicDiagram).includes('answerLabel'), 'no answer in public')
    assert(r.renderReport?.valid, 'render valid')
    assert(
      r.renderReport!.metrics.drawnNodeCount === r.publicDiagram!.nodes.length,
      'node count',
    )
    assert(
      r.renderReport!.metrics.drawnEdgeCount === r.publicDiagram!.edges.length,
      'edge count',
    )
  }

  // 难度 1/2/3 请求可过校验（生成仍用 mock single）
  for (const d of [1, 2, 3] as const) {
    assert(validateIndustrialAiGenerateRequest(baseReq({ difficulty: d })).ok, `diff ${d}`)
  }

  // 错误场景
  const failScenarios: MockProviderScenario[] = [
    'invalid_json',
    'invalid_schema',
    'bad_material_ref',
    'bad_step_ref',
    'bad_node',
    'bad_edge',
    'answer_leak',
    'timeout',
    'auth_failed',
    'network_error',
    'empty_response',
  ]
  for (const sc of failScenarios) {
    const r = await generateIndustrialAiCandidateWithMock(baseReq(), sc, {
      writeFiles: false,
      maxModelAttempts: 1,
    })
    assert(!r.ok, `${sc} must fail`)
    assert(r.task.status === 'generation_failed', `${sc} failed status`)
  }

  // 有限重试：timeout retryable，attempts=2 → 仍失败但不无限
  {
    const r = await generateIndustrialAiCandidateWithMock(baseReq(), 'timeout', {
      writeFiles: false,
      maxModelAttempts: 2,
    })
    assert(!r.ok, 'timeout fail')
    assert(r.task.retryCount >= 1, 'retried')
  }

  // HTTP provider 适配：配置缺失时 isAvailable=false；不发起请求
  {
    const http = new IndustrialAiHttpProvider({
      enabled: false,
      baseUrl: 'https://example.invalid',
      apiKey: '',
      model: 'x',
      timeoutMs: 1000,
      maxRetries: 0,
      configSource: 'none',
    })
    assert(!http.isAvailable(), 'http unavailable without key')
    const summary = http.getConfigSummary()
    assert(summary.apiKeyConfigured === false, 'key not configured')
  }

  // Mock 标记
  {
    const m = new IndustrialAiMockProvider('success_single')
    assert(m.kind === 'mock', 'mock kind')
    const chat = await m.chat({
      requestId: 't',
      system: 's',
      user: 'u',
    })
    assert(chat.providerKind === 'mock', 'chat mock')
  }

  // 完整链路写文件
  {
    const r = await generateIndustrialAiCandidate(baseReq(), {
      writeFiles: true,
      mockScenario: 'success_single',
    })
    assert(r.ok && r.outputDir, 'wrote dir')
    assert(existsSync(join(r.outputDir!, 'candidate.json')), 'candidate.json')
    assert(existsSync(join(r.outputDir!, 'public-diagram.json')), 'public')
    assert(existsSync(join(r.outputDir!, 'diagram.svg')), 'svg')
    assert(existsSync(join(r.outputDir!, 'generation-metadata.json')), 'meta')
    const meta = JSON.parse(
      readFileSync(join(r.outputDir!, 'generation-metadata.json'), 'utf8'),
    ) as Record<string, unknown>
    assert(!JSON.stringify(meta).includes('sk-'), 'no key in meta')
    assert(meta.developmentOnly === true, 'meta development')
    // 案例审核态未被改写
    assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'case still draft')
  }

  // 错误分类码
  {
    const r = await generateIndustrialAiCandidateWithMock(baseReq(), 'auth_failed', {
      writeFiles: false,
      maxModelAttempts: 1,
    })
    assert(r.task.errorCode === 'AI_AUTH_FAILED', 'auth code')
  }

  // eslint-disable-next-line no-console
  console.log('industrial-ai-generator.selftest: OK (mock only; live AI not executed)')
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
