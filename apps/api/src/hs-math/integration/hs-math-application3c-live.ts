/**
 * APPLICATION-3C：真实 DeepSeek 文字批改联调（最多 3 次 HTTP）。
 * 使用正式 HsMathApplicationAiGradeService + DeepseekClientService + 正式 prompt/校验。
 * HS_MATH_AI_GRADING_ENABLED 保持 false，避免 schedule 外发；仅本脚本显式 invoker 调用。
 *
 * 运行：pnpm --filter api run hs-math:application3c-live
 */
import 'reflect-metadata'
import * as fs from 'fs'
import * as path from 'path'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { DeepseekClientService } from '../../ai-reference/deepseek-client.service'
import { HsMathTrainService } from '../train/hs-math-train.service'
import { HsMathApplicationAiGradeService } from '../train/hs-math-application-ai-grade.service'
import { accuracyRatio } from '../util/accuracy'

const USER_ID = '2'
const SPECIALTY_ID = '18'
const CATEGORY_ID = '44'
const DIFFICULTY = 2
const ITEM_CODE = 'HSMA-RJA-CH03-APP-0001'
const MAX_HTTP = 3

/** A：完全正确虚构解答 */
const ANSWER_A = `【3C-A 虚构测试·请勿当真实学生作业】
设暑期票价为 x 元，x 为 30 到 60 的正整数。
每日接待人数为 2400-30x。
日票务收入：
y = x(2400-30x) = 2400x - 30x²。
定义域：x∈{30,31,…,60}。
配方：y = -30(x² - 80x) = -30[(x-40)² - 1600] = -30(x-40)² + 48000。
因为 -30<0，抛物线开口向下，在定义域内于 x=40 取最大值。
当票价为 40 元时，最大日收入为 48000 元。`

/** B：建模/定义域对，配方与结论错 */
const ANSWER_B = `【3C-B 虚构测试·请勿当真实学生作业】
设票价为 x 元（正整数，30≤x≤60）。
人数：2400-30x。
收入函数：y=x(2400-30x)=2400x-30x²。
定义域：{30,31,…,60}。
求最大值时我把配方写成 y=-30(x-30)²+某常数（把对称轴错当成 30），
于是认为票价 30 元时收入最大，算得最大收入为 2400×30-30×30²=45000 元。
结论：票价 30 元，最大收入 45000 元。`

/** C：模型错误 */
const ANSWER_C = `【3C-C 虚构测试·请勿当真实学生作业】
我认为收入就是人数，所以 y=2400-30x。
定义域随便取 x>0。
令 y'=0 得 x=80，代入得最大收入 0。
所以票价 80 元时收入最大为 0 元。`

type SampleId = 'A' | 'B' | 'C'

type SampleResult = {
  sample: SampleId
  sessionId: string
  sessionItemId: string
  httpIndex: number
  latencyMs: number
  gradeStatus: string
  gradeReason?: string
  model?: string | null
  totalScore?: number | null
  maxScore?: number | null
  rubricScores?: unknown
  errors?: unknown
  explanationPreview?: string
  usage?: unknown
  dbGradeResult?: string
  sessionCounts?: { correct: number; wrong: number; pending: number; accuracy: number | null }
  apiAiGradeTotal?: number | null
  ok: boolean
  notes: string[]
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  process.chdir(path.join(__dirname, '../../..'))
  // 强制关闭全局外发；仅本脚本 invoker 调用真实 API
  process.env.HS_MATH_AI_GRADING_ENABLED = 'false'

  let httpCount = 0
  const httpLog: Array<{ at: string; sample: string; ms: number; ok: boolean; err?: string }> =
    []

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  const train = app.get(HsMathTrainService)
  const ai = app.get(HsMathApplicationAiGradeService)
  const deepseek = app.get(DeepseekClientService)
  const ds = app.get(DataSource)

  const dbName = (await ds.query('SELECT DATABASE() d'))[0].d
  if (dbName !== 'study_system') {
    throw new Error(`拒绝：DATABASE=${dbName}`)
  }
  if (ai.isOutboundEnabled()) {
    throw new Error('拒绝：联调进程中 AI 开关不应为开启（schedule 可能外发）')
  }

  const modelCfg = (process.env.DEEPSEEK_MODEL || 'deepseek-chat').trim()
  console.log('DB', dbName)
  console.log('MODEL', modelCfg)
  console.log('OUTBOUND_SWITCH', ai.isOutboundEnabled())
  console.log('MAX_HTTP', MAX_HTTP)

  const samples: Array<{ id: SampleId; text: string }> = [
    { id: 'A', text: ANSWER_A },
    { id: 'B', text: ANSWER_B },
    { id: 'C', text: ANSWER_C },
  ]

  const results: SampleResult[] = []

  for (const sample of samples) {
    if (httpCount >= MAX_HTTP) {
      console.error('STOP: HTTP budget exhausted before sample', sample.id)
      break
    }

    const created = await train.createSession(USER_ID, {
      specialtyId: SPECIALTY_ID,
      categoryId: CATEGORY_ID,
      difficulty: DIFFICULTY,
      count: 1,
      mode: 'sequential',
      poolMode: 'formal',
    })
    const item = created.items[0]
    if (!item || item.itemCode !== ITEM_CODE) {
      throw new Error(`expected ${ITEM_CODE}, got ${item?.itemCode}`)
    }
    const sessionId = String(created.id)
    const sessionItemId = String(item.id)

    await train.saveAnswer(USER_ID, sessionId, {
      sortOrder: item.sortOrder,
      userAnswerPayload: { kind: 'application', text: sample.text },
    })
    await train.submit(USER_ID, sessionId)
    // 等待 schedule(ai_disabled) 结束，再重置以便正式批改
    await sleep(900)
    await ds.query(
      `UPDATE hs_math_train_session_items
       SET grade_result='pending_ai', grade_reason='awaiting_ai',
           ai_grade_json=NULL, ai_model=NULL, ai_graded_at=NULL, ai_attempt_count=0
       WHERE id=? AND session_id=?`,
      [sessionItemId, sessionId],
    )

    const notes: string[] = []
    let usage: unknown = null
    const t0 = Date.now()
    const g = await ai.gradeOneSessionItem({
      userId: USER_ID,
      sessionId,
      sessionItemId,
      invoker: async (p) => {
        if (httpCount >= MAX_HTTP) {
          throw new Error('http_budget_exceeded')
        }
        httpCount += 1
        const idx = httpCount
        console.log(`HTTP_CALL #${idx}/3 sample=${sample.id} start`)
        const started = Date.now()
        try {
          const out = await deepseek.gradeHsMathApplicationText(p)
          usage = out.usage ?? null
          httpLog.push({
            at: new Date().toISOString(),
            sample: sample.id,
            ms: Date.now() - started,
            ok: true,
          })
          console.log(`HTTP_CALL #${idx}/3 sample=${sample.id} ok ${Date.now() - started}ms`)
          return { content: out.content, model: out.model }
        } catch (e) {
          httpLog.push({
            at: new Date().toISOString(),
            sample: sample.id,
            ms: Date.now() - started,
            ok: false,
            err: (e as Error).message,
          })
          console.log(
            `HTTP_CALL #${idx}/3 sample=${sample.id} FAIL ${Date.now() - started}ms`,
          )
          throw e
        }
      },
    })
    const latencyMs = Date.now() - t0

    const row = (
      await ds.query(
        `SELECT grade_result, grade_reason, ai_model, ai_graded_at, ai_attempt_count, ai_grade_json
         FROM hs_math_train_session_items WHERE id=?`,
        [sessionItemId],
      )
    )[0]
    const aj =
      typeof row.ai_grade_json === 'string'
        ? JSON.parse(row.ai_grade_json)
        : row.ai_grade_json

    const sess = (
      await ds.query(
        `SELECT correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id=?`,
        [sessionId],
      )
    )[0]
    const counts = {
      correct: Number(sess.correct_count) || 0,
      wrong: Number(sess.wrong_count) || 0,
      pending: Number(sess.pending_count) || 0,
      accuracy: accuracyRatio(
        Number(sess.correct_count) || 0,
        Number(sess.wrong_count) || 0,
      ),
    }

    const view = await train.getSession(USER_ID, sessionId)
    const vi = view.items.find((i: { id: string }) => String(i.id) === sessionItemId) as {
      gradeResult?: string
      aiGrade?: { totalScore?: number; maxScore?: number; rubricScores?: unknown }
    }

    // 结构校验
    if (row.grade_result === 'graded' && aj) {
      if (aj.maxScore !== 10) notes.push(`maxScore!=10 (${aj.maxScore})`)
      if (!Array.isArray(aj.rubricScores) || aj.rubricScores.length !== 4) {
        notes.push('rubricScores length != 4')
      } else {
        const keys = aj.rubricScores.map((r: { rubricKey: string }) => r.rubricKey)
        const expect = ['model', 'domain', 'solve', 'conclusion']
        for (const k of expect) {
          if (!keys.includes(k)) notes.push(`missing key ${k}`)
        }
        const sum = aj.rubricScores.reduce(
          (s: number, r: { score: number }) => s + Number(r.score),
          0,
        )
        if (sum !== aj.totalScore) notes.push(`sum ${sum} != total ${aj.totalScore}`)
      }
      if (counts.correct !== 0 || counts.wrong !== 0) {
        notes.push('application graded leaked into correct/wrong')
      }
      if (counts.accuracy !== null) {
        notes.push('accuracy should be null for app-only graded session')
      }
    }

    // 数学质量启发式（人工复核辅助，不篡改分数）
    if (sample.id === 'A' && aj?.totalScore != null && aj.totalScore < 7) {
      notes.push('quality: A expected high score but total<7')
    }
    if (sample.id === 'B' && aj) {
      const byKey = Object.fromEntries(
        (aj.rubricScores || []).map((r: { rubricKey: string; score: number }) => [
          r.rubricKey,
          r.score,
        ]),
      )
      if ((byKey.model ?? 0) < 2) notes.push('quality: B model score unexpectedly low')
      if ((byKey.domain ?? 0) < 1) notes.push('quality: B domain score unexpectedly low')
      if (aj.totalScore === 0) notes.push('quality: B got 0 — may wipe process credit')
    }
    if (sample.id === 'C' && aj?.totalScore != null && aj.totalScore >= 8) {
      notes.push('quality: C expected low but total>=8')
    }

    const structFail = notes.some(
      (n) =>
        n.startsWith('maxScore') ||
        n.includes('rubricScores') ||
        n.includes('missing key') ||
        n.includes('sum ') ||
        n.includes('leaked into') ||
        n.includes('accuracy should'),
    )
    const ok =
      g.status === 'graded' &&
      row.grade_result === 'graded' &&
      !!aj &&
      !structFail

    const rec: SampleResult = {
      sample: sample.id,
      sessionId,
      sessionItemId,
      httpIndex: httpCount,
      latencyMs,
      gradeStatus: g.status,
      gradeReason: g.reason,
      model: row.ai_model,
      totalScore: aj?.totalScore ?? null,
      maxScore: aj?.maxScore ?? null,
      rubricScores: aj?.rubricScores ?? null,
      errors: aj?.errors ?? null,
      explanationPreview: String(aj?.personalizedExplanation || '').slice(0, 200),
      usage,
      dbGradeResult: row.grade_result,
      sessionCounts: counts,
      apiAiGradeTotal: vi?.aiGrade?.totalScore ?? null,
      ok,
      notes,
    }
    results.push(rec)
    console.log(
      `SAMPLE ${sample.id}: status=${g.status} total=${aj?.totalScore}/${aj?.maxScore} http=${httpCount} ok=${ok}`,
    )
    if (notes.length) console.log('  notes:', notes.join('; '))

    // 安全：若出现疑似密钥泄露文案则停
    const blob = JSON.stringify(aj || {})
    if (/sk-|api[_-]?key|Bearer\s+[A-Za-z0-9]/i.test(blob)) {
      console.error('STOP: suspicious secret-like content in AI json')
      break
    }
  }

  // 历史会话未动
  const hist = await ds.query(
    `SELECT id, status FROM hs_math_train_sessions WHERE id IN (51,55,56) ORDER BY id`,
  )

  const out = {
    authorized:
      '授权 APPLICATION-3C：允许重启本地 API（3000），并允许使用虚构 A/B/C 文字答案调用真实 DeepSeek deepseek-chat，最多 3 次 HTTP 请求。',
    database: dbName,
    modelConfigured: modelCfg,
    outboundSwitchDuringRun: false,
    httpTotal: httpCount,
    httpMax: MAX_HTTP,
    httpLog,
    histSessions: hist,
    results,
    finishedAt: new Date().toISOString(),
  }

  const reportPath = path.join(
    __dirname,
    '../../../../docs/high_school_math/_tmp_application3c_live_raw.json',
  )
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(out, null, 2), 'utf8')
  console.log('RAW_JSON', reportPath)
  console.log('HTTP_TOTAL', httpCount)

  await app.close()
  if (httpCount > MAX_HTTP) process.exit(2)
  if (results.length < 3 || results.some((r) => !r.ok)) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
