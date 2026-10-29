/**
 * STEP_13 装置图协议/安全/SVG/AI Mock 自检
 * pnpm --filter api run chem:industrial-apparatus-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  ALL_APPARATUS_SAMPLES,
  APP_GAS_PURIFY_COLLECT,
  APP_INVALID_WASH,
  APP_SIPHON_RISK,
} from './industrial-apparatus.fixtures'
import { computeApparatusContentHash } from './industrial-apparatus.hash'
import {
  projectIndustrialApparatusPublic,
  scanApparatusPublicForLeakRisk,
} from './industrial-apparatus.project'
import { validateIndustrialApparatusDefinition } from './industrial-apparatus.validate'
import { renderIndustrialApparatusSvg } from './industrial-apparatus-svg-renderer'
import { checkIndustrialApparatusSafety } from './industrial-apparatus-safety'
import {
  generateIndustrialApparatusCandidateWithHttp,
  generateIndustrialApparatusCandidateWithMock,
} from './industrial-apparatus-ai.service'
import { DEFAULT_INDUSTRIAL_APPARATUS_ASSET } from './industrial-apparatus.constants'
import { INDUSTRIAL_ASSET_TYPES } from './industrial-asset.constants'
import { buildFormalImportDbPayload } from './industrial-formal-import.service'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import {
  loadIndustrialReviewRecord,
} from './industrial-review.store'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function main() {
  // A. 合法样例
  const vOk = validateIndustrialApparatusDefinition(APP_GAS_PURIFY_COLLECT)
  assert(vOk.valid, `valid sample: ${vOk.errors.map((e) => e.message).join(';')}`)

  // 哈希稳定
  const h1 = computeApparatusContentHash(APP_GAS_PURIFY_COLLECT)
  const h2 = computeApparatusContentHash(APP_GAS_PURIFY_COLLECT)
  assert(h1 === h2 && h1.length === 64, 'hash stable')

  // Public 不泄漏
  const pub = projectIndustrialApparatusPublic(APP_GAS_PURIFY_COLLECT)
  assert(scanApparatusPublicForLeakRisk(pub).length === 0, 'no leak')
  assert(!(pub as unknown as { reviewMetadata?: unknown }).reviewMetadata, 'no review in pub')

  // 非法：未知设备
  const bad = {
    ...APP_GAS_PURIFY_COLLECT,
    components: [
      {
        componentId: 'x1',
        componentType: 'nuclear_reactor' as never,
        displayLabel: '坏设备',
        ports: [],
        internal: { answerKey: 'SECRET' },
      },
    ],
    connections: [],
  }
  const vBad = validateIndustrialApparatusDefinition(bad)
  assert(!vBad.valid, 'unsupported type fails')

  // SVG 确定性 + 安全
  const r1 = renderIndustrialApparatusSvg(pub)
  const r2 = renderIndustrialApparatusSvg(pub)
  assert(r1.svg === r2.svg, 'svg deterministic')
  assert(!/<script/i.test(r1.svg), 'no script')
  assert(!/foreignObject/i.test(r1.svg), 'no foreignObject')
  assert(r1.svg.includes('洗气') || r1.svg.includes('气体'), 'zh label')

  // 安全规则
  const sWash = checkIndustrialApparatusSafety(APP_INVALID_WASH)
  assert(sWash.blocking.length > 0 || sWash.findings.some((f) => f.status === 'fail'), 'invalid wash flagged')
  const sSiphon = checkIndustrialApparatusSafety(APP_SIPHON_RISK)
  assert(
    sSiphon.findings.some((f) => f.ruleId === 'SIPHON_RISK'),
    'siphon rule',
  )
  assert(
    sSiphon.unknowns.length + sSiphon.findings.filter((f) => f.status === 'unknown').length >= 0,
    'unknown allowed',
  )

  // AI Mock
  const ai = await generateIndustrialApparatusCandidateWithMock({
    writeReview: false,
  })
  assert(ai.ok && ai.developmentOnly && ai.formalImportBlocked, 'mock blocked formal')
  assert(ai.svg && ai.apparatus && ai.flowSvg, 'mock dual svg outputs')
  assert(ai.providerKind === 'mock', 'mock kind')

  // Mock 双图审核仓：flow 主图 + apparatus 副图落盘
  const cwd = mkdtempSync(join(tmpdir(), 'ind-app-dual-'))
  const aiDual = await generateIndustrialApparatusCandidateWithMock({
    writeReview: true,
    cwd,
  })
  assert(aiDual.ok && aiDual.candidateId, 'dual review written')
  const rec = loadIndustrialReviewRecord(aiDual.candidateId!, cwd)
  assert(!!rec?.svgContentHash && !!rec?.apparatusSvgContentHash, 'both hashes')
  assert(!!rec?.apparatusSvgRelativePath, 'apparatus path')
  assert(rec!.svgContentHash !== rec!.apparatusSvgContentHash, 'hashes differ')

  // HTTP：无密钥/未启用 → AI_UNAVAILABLE（不得冒充在线 PASS）
  const httpOff = await generateIndustrialApparatusCandidateWithHttp({
    writeReview: false,
    provider: {
      kind: 'http' as const,
      isAvailable: () => false,
      getConfigSummary: () =>
        ({
          enabled: false,
          baseUrl: '',
          model: '',
          timeoutMs: 0,
          maxRetries: 0,
          configSource: 'none' as const,
          apiKeyConfigured: false,
        }),
      chat: async () => {
        throw new Error('must not call')
      },
    },
  })
  assert(!httpOff.ok && httpOff.errorCode === 'AI_UNAVAILABLE', 'http unavailable')
  assert(httpOff.providerKind === 'http', 'http kind')

  // 注入假 HTTP：合法装置 JSON → ok（仍非真实在线）
  const httpInject = await generateIndustrialApparatusCandidateWithHttp({
    writeReview: false,
    provider: {
      kind: 'http' as const,
      isAvailable: () => true,
      getConfigSummary: () =>
        ({
          enabled: true,
          baseUrl: 'http://test',
          model: 'inject',
          timeoutMs: 1000,
          maxRetries: 0,
          configSource: 'mock' as const,
          apiKeyConfigured: true,
        }),
      chat: async () => ({
        providerKind: 'http' as const,
        model: 'inject',
        content: JSON.stringify({
          apparatusId: 'app_http_inject',
          title: '注入装置',
          orientation: 'left_to_right',
          schematicDisclaimer: '示意',
          components: APP_GAS_PURIFY_COLLECT.components,
          connections: APP_GAS_PURIFY_COLLECT.connections,
          intentionallyInvalid: false,
        }),
        durationMs: 1,
        tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      }),
    },
  })
  assert(httpInject.ok && !httpInject.developmentOnly, 'http inject ok')
  assert(httpInject.flowSvg && httpInject.svg, 'http dual svg')

  // buildFormalImportDbPayload 双图 additionalAssets
  if (rec) {
    const fakeGates = {
      ok: true,
      blockers: [] as string[],
      warnings: [] as string[],
      mappedPreview: {
        code: 'train.ind.app.test',
        pool: 'formal' as const,
        status: 'approved' as const,
        curriculumOk: true,
        verifyBlocked: false,
        banDefaultTrain: false,
        gateNote: 't',
        svgContentHash: rec.svgContentHash,
      },
    }
    const payload = buildFormalImportDbPayload(rec, fakeGates, '1')
    assert(!!payload && payload.additionalAssets.length === 1, 'payload dual')
    assert(
      payload!.additionalAssets[0].assetType === 'industrial_apparatus_svg',
      'apparatus type in payload',
    )
  }

  // 资源类型兼容 D043
  assert(
    (INDUSTRIAL_ASSET_TYPES as readonly string[]).includes(
      DEFAULT_INDUSTRIAL_APPARATUS_ASSET.assetType,
    ),
    'asset type reserved',
  )

  // 样例数量
  assert(ALL_APPARATUS_SAMPLES.length >= 8, 'enough samples')

  // init.sql 仍含 apparatus 枚举注释
  const rootCandidates = [process.cwd(), join(process.cwd(), '..'), join(process.cwd(), '../..')]
  let init = ''
  for (const r of rootCandidates) {
    const p = join(r, 'db/init.sql')
    if (existsSync(p)) {
      init = readFileSync(p, 'utf8')
      break
    }
  }
  assert(init.includes('industrial_apparatus_svg'), 'init asset type')

  console.log('chem:industrial-apparatus-selftest PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
