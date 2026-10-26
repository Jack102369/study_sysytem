/**
 * APPLICATION-4C-3：session 126 / item 349 真实 regrade HTTP 验收。
 * Qwen≤1 / DeepSeek≤1；不写 ENABLED=true 入 .env；结束后恢复 false。
 * 运行：pnpm --filter api run hs-math:application4c3-regrade-live
 */
import 'reflect-metadata'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter'
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor'
import { HsMathApplicationAiGradeService } from '../train/hs-math-application-ai-grade.service'
import { HsMathQwenVisionClientService } from '../train/hs-math-qwen-vision-client.service'

const USER_ID = '2'
const SESSION_ID = '126'
const SESSION_ITEM_ID = '349'
const ITEM_ID = '151'
const BASE = 'http://127.0.0.1:3000'
const QWEN_MAX = 1
const DS_MAX = 1

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function loadEnvFile() {
  const p = path.join(process.cwd(), '.env')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) continue
    const k = m[1].trim()
    let v = m[2].trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

function signHs256Jwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresSec = 3600,
) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresSec }),
  ).toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

async function api(
  method: string,
  urlPath: string,
  token: string | null,
  body?: unknown,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 300) }
  }
  return { status: res.status, json }
}

function dataOf(json: unknown): any {
  if (json && typeof json === 'object' && 'data' in (json as object)) {
    return (json as { data: unknown }).data
  }
  return json
}

function applyLiveEnv(on: boolean) {
  process.env.HS_MATH_VISION_GRADING_ENABLED = on ? 'true' : 'false'
  process.env.HS_MATH_AI_GRADING_ENABLED = on ? 'true' : 'false'
  if (on) {
    process.env.HS_MATH_VISION_GRADING_TEST_USER_ID = USER_ID
    process.env.HS_MATH_VISION_GRADING_TEST_SESSION_IDS = SESSION_ID
    process.env.HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS = SESSION_ITEM_ID
    process.env.HS_MATH_VISION_LIVE_HTTP_BUDGET = String(QWEN_MAX)
    process.env.HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET = String(DS_MAX)
  } else {
    delete process.env.HS_MATH_VISION_GRADING_TEST_USER_ID
    delete process.env.HS_MATH_VISION_GRADING_TEST_SESSION_IDS
    delete process.env.HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS
    delete process.env.HS_MATH_VISION_LIVE_HTTP_BUDGET
    delete process.env.HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET
  }
}

async function createHttpApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new TransformInterceptor())
  await app.listen(3000)
  return app
}

async function main() {
  process.chdir(path.join(__dirname, '../../..'))
  loadEnvFile()
  applyLiveEnv(false)

  const report: Record<string, unknown> = {
    auth: 'CONFIRMED A-H',
    sessionId: SESSION_ID,
    sessionItemId: SESSION_ITEM_ID,
  }

  // —— precheck ——
  let boot = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  })
  const ds = boot.get(DataSource)
  const dbName = (await ds.query('SELECT DATABASE() d'))[0].d
  if (dbName !== 'study_system') throw new Error(`DB=${dbName}`)

  const [row] = await ds.query(
    `SELECT s.user_id, s.status, s.correct_count, s.wrong_count, s.pending_count,
            si.item_id, si.qtype, si.grade_result, si.grade_reason, si.ai_attempt_count,
            CAST(si.user_answer_payload_json AS CHAR) ua,
            CAST(si.ai_grade_json AS CHAR) ag,
            CAST(si.answer_payload_json AS CHAR) ap
     FROM hs_math_train_sessions s
     JOIN hs_math_train_session_items si ON si.session_id=s.id
     WHERE s.id=? AND si.id=?`,
    [SESSION_ID, SESSION_ITEM_ID],
  )
  if (!row) throw new Error('session 126/item 349 missing')
  const ua = JSON.parse(row.ua)
  const ap = JSON.parse(row.ap)
  const byKey: Record<string, number> = {}
  for (const r of ap.rubric || []) byKey[r.key] = Number(r.maxScore)
  const preOk =
    String(row.user_id) === USER_ID &&
    row.status === 'completed' &&
    row.qtype === 'application' &&
    String(row.item_id) === ITEM_ID &&
    row.grade_result === 'review_required' &&
    row.grade_reason === 'awaiting_multimodal' &&
    Number(row.ai_attempt_count) === 0 &&
    row.ag == null &&
    ua.gradingProvider === 'deepseek' &&
    JSON.stringify(ua.imageIds) === JSON.stringify(['55', '56']) &&
    byKey.model === 3 &&
    byKey.domain === 2 &&
    byKey.solve === 3 &&
    byKey.conclusion === 2
  if (!preOk) {
    console.error('PRECHECK_FAIL', row.grade_result, row.grade_reason)
    await boot.close()
    process.exit(2)
  }
  const uaFingerprint = JSON.stringify(ua)
  const countsBefore = {
    correct: Number(row.correct_count),
    wrong: Number(row.wrong_count),
    pending: Number(row.pending_count),
  }
  report.precheck = 'PASS'
  report.countsBefore = countsBefore

  const [otherBefore] = await ds.query(
    `SELECT COUNT(*) AS c FROM hs_math_train_session_items
     WHERE id<>? AND (ai_graded_at IS NOT NULL OR grade_result IN ('grading','pending_ai'))`,
    [SESSION_ITEM_ID],
  )

  const [user] = await ds.query(
    `SELECT id, email, role FROM users WHERE id=?`,
    [USER_ID],
  )
  if (!user) throw new Error('user 2 missing')
  await boot.close()

  // —— live HTTP ——
  applyLiveEnv(true)
  const app = await createHttpApp()
  const ai = app.get(HsMathApplicationAiGradeService)
  const vision = app.get(HsMathQwenVisionClientService)
  const liveDs = app.get(DataSource)

  const health0 = await api('GET', '/health', null)
  if (health0.status !== 200) throw new Error('health not 200')
  report.healthLive = 200
  report.switchesOn = {
    vision: ai.isVisionOutboundEnabled(),
    text: ai.isOutboundEnabled(),
  }
  if (!ai.isVisionOutboundEnabled() || !ai.isOutboundEnabled()) {
    throw new Error('switches not enabled in process')
  }
  report.budgetMax = {
    qwen: vision.getLiveHttpBudgetMax(),
    deepseek: ai.getTextLiveHttpBudgetMax(),
  }

  const token = signHs256Jwt(
    { sub: String(user.id), email: user.email, role: user.role },
    process.env.JWT_SECRET || '',
  )

  const re1 = await api(
    'POST',
    `/hs-math/train/sessions/${SESSION_ID}/items/${SESSION_ITEM_ID}/regrade`,
    token,
    {},
  )
  report.regrade1Status = re1.status
  if (re1.status !== 200 && re1.status !== 201) {
    console.error('REGRADE_FAIL', re1.status, re1.json)
    throw new Error('regrade failed')
  }
  const d1 = dataOf(re1.json)
  const item1 = (d1.items || []).find(
    (i: any) => String(i.id) === SESSION_ITEM_ID,
  )
  report.afterRegrade1 = item1?.gradeResult

  // poll until terminal
  let finalItem: any = null
  for (let i = 0; i < 60; i++) {
    await sleep(3000)
    const g = await api(
      'GET',
      `/hs-math/train/sessions/${SESSION_ID}`,
      token,
    )
    const det = dataOf(g.json)
    const it = (det.items || []).find(
      (x: any) => String(x.id) === SESSION_ITEM_ID,
    )
    const gr = it?.gradeResult
    console.log(`poll#${i + 1}`, gr)
    if (
      gr === 'graded' ||
      gr === 'review_required' ||
      gr === 'grading_failed'
    ) {
      finalItem = it
      break
    }
  }
  if (!finalItem) throw new Error('poll timeout')

  const qwenUsed = vision.getLiveHttpUsed()
  const dsUsed = ai.getTextLiveHttpUsed()
  report.qwenUsed = qwenUsed
  report.deepseekUsed = dsUsed
  report.finalGradeResult = finalItem.gradeResult
  report.finalGradeReason = finalItem.gradeReason
  report.aiGrade = finalItem.aiGrade
    ? {
        totalScore: finalItem.aiGrade.totalScore,
        maxScore: finalItem.aiGrade.maxScore,
        rubricScores: finalItem.aiGrade.rubricScores,
        recognitionUncertain: finalItem.aiGrade.recognitionUncertain,
        confidence: finalItem.aiGrade.confidence,
        pipeline: finalItem.aiGrade.pipeline,
        gradingProvider: finalItem.aiGrade.gradingProvider,
        visionModel: finalItem.aiGrade.visionModel,
        scoringModel: finalItem.aiGrade.scoringModel,
        recognizedWork_head: String(finalItem.aiGrade.recognizedWork || '')
          .slice(0, 240)
          .replace(/\s+/g, ' '),
        warnings_kind: Array.isArray(finalItem.aiGrade.recognitionWarnings)
          ? finalItem.aiGrade.recognitionWarnings.length
            ? typeof finalItem.aiGrade.recognitionWarnings[0]
            : 'empty'
          : typeof finalItem.aiGrade.recognitionWarnings,
      }
    : null

  // second regrade
  const re2 = await api(
    'POST',
    `/hs-math/train/sessions/${SESSION_ID}/items/${SESSION_ITEM_ID}/regrade`,
    token,
    {},
  )
  report.regrade2Status = re2.status
  report.regrade2Rejected = re2.status >= 400
  report.qwenUsedAfterSecond = vision.getLiveHttpUsed()
  report.deepseekUsedAfterSecond = ai.getTextLiveHttpUsed()

  // DB verify
  const [after] = await liveDs.query(
    `SELECT grade_result, grade_reason, ai_attempt_count, ai_model, ai_graded_at,
            CAST(user_answer_payload_json AS CHAR) ua,
            CAST(ai_grade_json AS CHAR) ag,
            (SELECT correct_count FROM hs_math_train_sessions WHERE id=?) AS correct_count,
            (SELECT wrong_count FROM hs_math_train_sessions WHERE id=?) AS wrong_count,
            (SELECT pending_count FROM hs_math_train_sessions WHERE id=?) AS pending_count
     FROM hs_math_train_session_items WHERE id=?`,
    [SESSION_ID, SESSION_ID, SESSION_ID, SESSION_ITEM_ID],
  )
  const uaAfter = JSON.parse(after.ua)
  report.db = {
    grade_result: after.grade_result,
    grade_reason: after.grade_reason,
    ai_attempt_count: after.ai_attempt_count,
    ai_model: after.ai_model,
    ai_graded_at: after.ai_graded_at,
    answerUnchanged: JSON.stringify(uaAfter) === uaFingerprint,
    imageIds: uaAfter.imageIds,
    gradingProvider: uaAfter.gradingProvider,
    counts: {
      correct: Number(after.correct_count),
      wrong: Number(after.wrong_count),
      pending: Number(after.pending_count),
    },
  }
  report.statsNotPolluted =
    Number(after.correct_count) === countsBefore.correct &&
    Number(after.wrong_count) === countsBefore.wrong

  const [otherAfter] = await liveDs.query(
    `SELECT COUNT(*) AS c FROM hs_math_train_session_items
     WHERE id<>? AND grade_result IN ('grading','pending_ai')`,
    [SESSION_ITEM_ID],
  )
  report.otherSessionsUntouched =
    Number(otherAfter.c) <= Number(otherBefore.c) + 0

  // history list smoke
  const hist = await api('GET', '/hs-math/train/sessions?page=1&pageSize=5', token)
  report.historyStatus = hist.status

  await app.close()

  // —— restore ——
  applyLiveEnv(false)
  const restoreApp = await createHttpApp()
  const restoreAi = restoreApp.get(HsMathApplicationAiGradeService)
  const h2 = await api('GET', '/health', null)
  report.restore = {
    health: h2.status,
    vision: restoreAi.isVisionOutboundEnabled(),
    text: restoreAi.isOutboundEnabled(),
    envVision: process.env.HS_MATH_VISION_GRADING_ENABLED,
    envAi: process.env.HS_MATH_AI_GRADING_ENABLED,
  }
  // leave restored API running? close and let user restart pnpm — keep running false for health
  // Task: restart with false and health 200 — keep process alive briefly then note
  await restoreApp.close()

  // final restored listen for health confirmation then exit
  applyLiveEnv(false)
  const finalApp = await createHttpApp()
  const finalAi = finalApp.get(HsMathApplicationAiGradeService)
  const h3 = await api('GET', '/health', null)
  report.restoreFinal = {
    health: h3.status,
    vision: finalAi.isVisionOutboundEnabled(),
    text: finalAi.isOutboundEnabled(),
  }
  await finalApp.close()

  report.ui = 'UI_NOT_RUN'
  report.passHints = {
    qwenBudget: `${qwenUsed}/${QWEN_MAX}`,
    dsBudget: `${dsUsed}/${DS_MAX}`,
    graded: finalItem.gradeResult === 'graded',
  }

  const outPath = path.join(
    process.cwd(),
    '../../docs/high_school_math/_tmp_application4c3_live_raw.json',
  )
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(JSON.stringify(report, null, 2))
  console.log('REPORT', outPath)

  const ok =
    report.precheck === 'PASS' &&
    qwenUsed <= QWEN_MAX &&
    dsUsed <= DS_MAX &&
    report.regrade2Rejected === true &&
    (report.db as any).answerUnchanged === true &&
    (report.restoreFinal as any).health === 200 &&
    (report.restoreFinal as any).vision === false &&
    (report.restoreFinal as any).text === false

  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  // best-effort restore flags in process (caller must restart API)
  process.env.HS_MATH_VISION_GRADING_ENABLED = 'false'
  process.env.HS_MATH_AI_GRADING_ENABLED = 'false'
  process.exit(1)
})
