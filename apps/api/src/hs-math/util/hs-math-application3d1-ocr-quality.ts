/**
 * APPLICATION-3D-1：本地 OCR 质量门禁脚本。
 * - 不启动 OCR；9100/9101 不可达则判定 BLOCKED 并退出。
 * - 不调用 DeepSeek / 外部 AI。
 * - 夹具均为 PRINTED_ONLY；不得据此标 LOCAL_OCR_SUITABLE。
 *
 * 运行：pnpm --filter api run hs-math:application3d1-ocr-quality
 */
import * as fs from 'fs'
import * as path from 'path'
import { ConfigService } from '@nestjs/config'
import { OcrClientService } from '../../ai-reference/ocr-client.service'

type Sample = {
  id: string
  file: string
  kind: 'PRINTED_ONLY'
  expectHints: string[]
  graph?: boolean
}

const FIXTURE_DIR = path.join(
  __dirname,
  '../integration/fixtures/application3d1-ocr',
)

const SAMPLES: Sample[] = [
  {
    id: 'A',
    file: 'A_printed_text.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['票价', '2400', '30'],
  },
  {
    id: 'B',
    file: 'B_printed_formula.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['2400', '30'],
  },
  {
    id: 'C',
    file: 'C_printed_domain.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['30', '60'],
  },
  {
    id: 'D',
    file: 'D_printed_complete.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['40', '48000'],
  },
  {
    id: 'E',
    file: 'E_printed_full.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['定义域', '40', '48000'],
  },
  {
    id: 'F',
    file: 'F_printed_graph.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['顶点'],
    graph: true,
  },
  {
    id: 'G1',
    file: 'G1_printed_model.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['2400'],
  },
  {
    id: 'G2',
    file: 'G2_printed_domain.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['30', '60'],
  },
  {
    id: 'G3',
    file: 'G3_printed_solve.png',
    kind: 'PRINTED_ONLY',
    expectHints: ['40', '48000'],
  },
]

async function probe(url: string): Promise<{ ok: boolean; body?: string; err?: string }> {
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 3000)
    const res = await fetch(url, { signal: ac.signal })
    clearTimeout(t)
    const body = await res.text()
    return { ok: res.ok, body: body.slice(0, 200) }
  } catch (e) {
    return { ok: false, err: (e as Error).message }
  }
}

async function main() {
  process.chdir(path.join(__dirname, '../../..'))
  const cfg = new ConfigService({
    OCR_BASE_URL: process.env.OCR_BASE_URL || 'http://127.0.0.1:9100',
    OCR_FORMULA_BASE_URL:
      process.env.OCR_FORMULA_BASE_URL || 'http://127.0.0.1:9101',
  })
  // 从 .env 补齐（若存在）
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^(OCR_[^=]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  }
  const base = (process.env.OCR_BASE_URL || 'http://127.0.0.1:9100').replace(
    /\/$/,
    '',
  )
  const formula = (
    process.env.OCR_FORMULA_BASE_URL || 'http://127.0.0.1:9101'
  ).replace(/\/$/, '')

  console.log('OCR_BASE_URL', base)
  console.log('OCR_FORMULA_BASE_URL', formula)
  console.log('HOST_LOCAL_CHECK', /127\.0\.0\.1|localhost/i.test(base))

  const h0 = await probe(`${base}/health`)
  const h1 = await probe(`${formula}/health`)
  console.log('HEALTH_9100', h0)
  console.log('HEALTH_9101', h1)

  const report: Record<string, unknown> = {
    stage: 'APPLICATION-3D-1',
    ocrBase: base,
    ocrFormula: formula,
    pureLocalEndpoints: /127\.0\.0\.1|localhost/i.test(base + formula),
    healthGeneral: h0,
    healthFormula: h1,
    handwrittenCount: 0,
    printedOnlyCount: SAMPLES.length,
    samples: [] as unknown[],
    verdict: 'BLOCKED',
    reason: '',
    suitability: 'UNKNOWN_NOT_TESTED',
    graphCapability: 'GRAPH_UNSUPPORTED_OR_UNTESTED',
    finishedAt: new Date().toISOString(),
  }

  if (!h0.ok && !h1.ok) {
    report.verdict = 'BLOCKED'
    report.reason =
      '本地 OCR 服务未运行（9100/9101 均不可达）。按授权不擅自启动/安装。无法执行识别质量验证。印刷体夹具已准备，但 PRINTED_ONLY 不得冒充手写 PASS，亦不得标 LOCAL_OCR_SUITABLE。'
    report.suitability = 'NOT_EVALUATED_OCR_DOWN'
    console.log('VERDICT BLOCKED — OCR down')
    const out = path.join(
      process.cwd(),
      '../../docs/high_school_math/_tmp_application3d1_ocr_raw.json',
    )
    // cwd = apps/api
    const out2 = path.resolve(process.cwd(), '../../docs/high_school_math/_tmp_application3d1_ocr_raw.json')
    fs.mkdirSync(path.dirname(out2), { recursive: true })
    fs.writeFileSync(out2, JSON.stringify(report, null, 2), 'utf8')
    console.log('RAW', out2)
    process.exit(0)
  }

  // 若服务可用：跑印刷体探测（仍不得标 SUITABLE）
  const ocr = new OcrClientService(cfg)
  for (const s of SAMPLES) {
    const fp = path.join(FIXTURE_DIR, s.file)
    const buf = fs.readFileSync(fp)
    const t0 = Date.now()
    let text = ''
    let err: string | undefined
    let engine: string | undefined
    let confidence: number | null = null
    try {
      const mode = s.graph ? 'general' : 'smart'
      const r = await ocr.ocrByBuffer(buf, s.file, mode as 'general' | 'smart')
      text = r.text || ''
      engine = r.engine
      confidence = r.confidence
    } catch (e) {
      err = (e as Error).message
    }
    const ms = Date.now() - t0
    const hits = s.expectHints.filter((h) => text.includes(h))
    ;(report.samples as unknown[]).push({
      id: s.id,
      kind: s.kind,
      file: s.file,
      ms,
      engine,
      confidence,
      textPreview: text.slice(0, 400),
      hintHits: hits,
      hintMiss: s.expectHints.filter((h) => !text.includes(h)),
      graph: !!s.graph,
      error: err || null,
    })
    console.log(
      `SAMPLE ${s.id} ms=${ms} hits=${hits.length}/${s.expectHints.length} err=${err || '-'}`,
    )
  }

  report.verdict = 'PARTIAL'
  report.reason =
    'OCR 可达且跑了印刷体探测；无真实手写样本 → 不得 LOCAL_OCR_SUITABLE；图象理解未验证 → GRAPH_UNSUPPORTED 除非人工确认。'
  report.suitability = 'LOCAL_OCR_LIMITED_OR_UNTESTED_HANDWRITING'
  report.graphCapability = 'GRAPH_UNSUPPORTED'

  const out2 = path.resolve(
    process.cwd(),
    '../../docs/high_school_math/_tmp_application3d1_ocr_raw.json',
  )
  fs.mkdirSync(path.dirname(out2), { recursive: true })
  fs.writeFileSync(out2, JSON.stringify(report, null, 2), 'utf8')
  console.log('RAW', out2)
  console.log('VERDICT', report.verdict)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
