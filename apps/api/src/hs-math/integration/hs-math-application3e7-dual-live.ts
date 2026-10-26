/**
 * APPLICATION-3E-7：DeepSeek 图片部分得分真实验收（自动 submit，预算 Qwen≤2 / DS≤2）。
 * 运行：pnpm --filter api run hs-math:application3e7-dual-live
 *
 * 不写 ENABLED=true 入 .env；仅 Nest context process.env。
 */
import 'reflect-metadata'
import * as fs from 'fs'
import * as path from 'path'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { HsMathApplicationAiGradeService } from '../train/hs-math-application-ai-grade.service'
import { HsMathApplicationImagesService } from '../train/hs-math-application-images.service'
import { HsMathQwenVisionClientService } from '../train/hs-math-qwen-vision-client.service'
import { HsMathTrainService } from '../train/hs-math-train.service'
import { accuracyRatio } from '../util/accuracy'

const USER_ID = '2'
const SPECIALTY_ID = '18'
const CATEGORY_ID = '44'
const ITEM_CODE = 'HSMA-RJA-CH03-APP-0001'
const ITEM_ID = '151'
const QWEN_MAX = 2
const DS_MAX = 2
const FORBIDDEN = new Set([
  '51',
  '55',
  '56',
  '107',
  '108',
  '110',
  '111',
  '112',
  '113',
  '114',
  '115',
  '116',
  '117',
  '118',
  '119',
  '120',
])

type SceneId = 'A' | 'B'
type Plan = {
  id: SceneId
  kind: string
  pngs: string[]
  expectQwen: number
  expectDsMax: number
}

const ORDER: Plan[] = [
  {
    id: 'A',
    kind: 'PRINTED_SYNTHETIC',
    pngs: ['A_printed_partial_p1.png', 'A_printed_partial_p2.png'],
    expectQwen: 1,
    expectDsMax: 1,
  },
  {
    id: 'B',
    kind: 'PRINTED_SYNTHETIC',
    pngs: ['C_printed_partial_p1.png', 'C_printed_partial_p2.png'],
    expectQwen: 1,
    expectDsMax: 1,
  },
]

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function multerFile(buf: Buffer, name: string): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: 'image/png',
    size: buf.length,
    buffer: buf,
    destination: '',
    filename: name,
    path: '',
    stream: null as never,
  }
}

function workKeepsX50(work: string): { ok: boolean; detail: string } {
  const s = String(work || '')
  const has50 = /x\s*=\s*50|\(x\s*-\s*50\)|x-50/i.test(s)
  const rewritten40 =
    /x\s*=\s*40/.test(s) && !/x\s*=\s*50/.test(s) && !/\(x\s*-\s*50\)/.test(s)
  if (rewritten40) return { ok: false, detail: 'x=50 rewritten to x=40' }
  if (!has50) return { ok: false, detail: 'x=50 missing from recognizedWork' }
  return { ok: true, detail: 'x=50 preserved' }
}

async function main() {
  process.chdir(path.join(__dirname, '../../..'))
  const apiRoot = process.cwd()
  const pngDir = path.join(
    apiRoot,
    'src/hs-math/integration/fixtures/application3e6',
  )
  const reportPath = path.join(
    apiRoot,
    '../../docs/high_school_math/_tmp_application3e7_live_raw.json',
  )

  process.env.HS_MATH_VISION_GRADING_ENABLED = 'false'
  process.env.HS_MATH_AI_GRADING_ENABLED = 'false'

  const prepared: Array<{
    plan: Plan
    sessionId: string
    sessionItemId: string
    imageIds: string[]
  }> = []
  const results: unknown[] = []
  let safetyStop: string | null = null

  let app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  try {
    const ds = app.get(DataSource)
    const train = app.get(HsMathTrainService)
    const images = app.get(HsMathApplicationImagesService)
    const ai = app.get(HsMathApplicationAiGradeService)

    const dbName = (await ds.query('SELECT DATABASE() d'))[0].d
    if (dbName !== 'study_system') throw new Error(`DB=${dbName}`)
    console.log('DB', dbName)
    console.log(
      'SWITCHES_OFF',
      !ai.isVisionOutboundEnabled() && !ai.isOutboundEnabled(),
    )

    const [it] = await ds.query(
      `SELECT id, code, status, pool, answer_payload_json FROM hs_math_train_items WHERE id=?`,
      [ITEM_ID],
    )
    if (
      !it ||
      it.code !== ITEM_CODE ||
      it.status !== 'approved' ||
      it.pool !== 'formal'
    ) {
      throw new Error('item 151 gate fail')
    }
    const ap =
      typeof it.answer_payload_json === 'string'
        ? JSON.parse(it.answer_payload_json)
        : it.answer_payload_json
    const rubric = ap.rubric || []
    const byKey: Record<string, number> = {}
    for (const r of rubric) byKey[r.key] = Number(r.maxScore)
    if (
      byKey.model !== 3 ||
      byKey.domain !== 2 ||
      byKey.solve !== 3 ||
      byKey.conclusion !== 2 ||
      Number(ap.maxScore) !== 10
    ) {
      throw new Error('rubric not 3/2/3/2=10')
    }
    console.log('ITEM_OK', ITEM_ID, 'rubric 3/2/3/2')

    for (const fn of ORDER.flatMap((p) => p.pngs)) {
      if (!fs.existsSync(path.join(pngDir, fn))) {
        throw new Error(`missing fixture ${fn}`)
      }
    }

    for (const plan of ORDER) {
      const created = await train.createSession(USER_ID, {
        specialtyId: SPECIALTY_ID,
        categoryId: CATEGORY_ID,
        difficulty: 2,
        count: 1,
        mode: 'sequential',
        poolMode: 'formal',
        questionType: 'application',
      })
      const item = created.items[0]
      if (!item || item.itemCode !== ITEM_CODE) {
        throw new Error(`bad item ${item?.itemCode}`)
      }
      const sessionId = String(created.id)
      const sessionItemId = String(item.id)
      if (FORBIDDEN.has(sessionId)) {
        throw new Error(`forbidden session ${sessionId}`)
      }

      const imageIds: string[] = []
      for (const fn of plan.pngs) {
        const buf = fs.readFileSync(path.join(pngDir, fn))
        const up = await images.upload(
          USER_ID,
          sessionId,
          sessionItemId,
          multerFile(buf, fn),
        )
        imageIds.push(String(up.imageId))
      }

      await train.saveAnswer(USER_ID, sessionId, {
        sortOrder: item.sortOrder,
        userAnswerPayload: {
          kind: 'application',
          gradingProvider: 'deepseek',
          imageIds,
        },
      })
      prepared.push({ plan, sessionId, sessionItemId, imageIds })
      console.log(
        `PREP ${plan.id} kind=${plan.kind} session=${sessionId} item=${sessionItemId} imgs=${imageIds.join(',')}`,
      )
    }
  } finally {
    await app.close()
  }

  const sessionIds = prepared.map((p) => p.sessionId)
  console.log('ALLOWLIST', sessionIds.join(','))

  process.env.HS_MATH_VISION_GRADING_ENABLED = 'true'
  process.env.HS_MATH_AI_GRADING_ENABLED = 'true'
  process.env.HS_MATH_VISION_GRADING_TEST_USER_ID = USER_ID
  process.env.HS_MATH_VISION_GRADING_TEST_SESSION_IDS = sessionIds.join(',')
  process.env.HS_MATH_VISION_LIVE_HTTP_BUDGET = String(QWEN_MAX)
  process.env.HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET = String(DS_MAX)

  app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  try {
    const ds = app.get(DataSource)
    const train = app.get(HsMathTrainService)
    const ai = app.get(HsMathApplicationAiGradeService)
    const vision = app.get(HsMathQwenVisionClientService)

    if (!ai.isVisionOutboundEnabled() || !ai.isOutboundEnabled()) {
      throw new Error('live switches not on')
    }
    if (vision.getLiveHttpBudgetMax() !== QWEN_MAX) {
      throw new Error('qwen budget gate fail')
    }
    if (ai.getTextLiveHttpBudgetMax() !== DS_MAX) {
      throw new Error('ds budget gate fail')
    }
    console.log('LIVE_ON budgets', QWEN_MAX, DS_MAX)

    for (const prep of prepared) {
      if (safetyStop) {
        results.push({
          id: prep.plan.id,
          status: 'NOT_RUN',
          reason: safetyStop,
        })
        continue
      }
      const { plan, sessionId, sessionItemId, imageIds } = prep
      const q0 = vision.getLiveHttpUsed()
      const d0 = ai.getTextLiveHttpUsed()
      if (QWEN_MAX - q0 < plan.expectQwen) {
        console.warn(`STOP budget before ${plan.id}`)
        results.push({ id: plan.id, status: 'NOT_RUN', reason: 'budget' })
        continue
      }
      if (!ai.canAutoVisionGradeSession(USER_ID, sessionId)) {
        throw new Error(`allowlist vision fail ${plan.id}`)
      }
      if (!ai.canAutoTextGradeSession(USER_ID, sessionId)) {
        throw new Error(`allowlist text fail ${plan.id}`)
      }

      const t0 = Date.now()
      console.log(`SUBMIT ${plan.id}`)
      await train.submit(USER_ID, sessionId)

      let row: Record<string, unknown> | null = null
      let gradeResult: string | null = null
      for (let i = 0; i < 90; i++) {
        await sleep(2000)
        const rows = await ds.query(
          `SELECT grade_result, grade_reason, ai_model, ai_graded_at, ai_attempt_count, ai_grade_json,
                  user_answer_payload_json
           FROM hs_math_train_session_items WHERE id=? AND session_id=?`,
          [sessionItemId, sessionId],
        )
        row = rows[0]
        gradeResult = row ? String(row.grade_result || '') : null
        if (
          gradeResult === 'graded' ||
          gradeResult === 'review_required' ||
          gradeResult === 'grading_failed'
        ) {
          break
        }
        console.log(`  poll ${plan.id} #${i + 1} ${gradeResult}`)
      }

      const q1 = vision.getLiveHttpUsed()
      const d1 = ai.getTextLiveHttpUsed()
      if (q1 > QWEN_MAX || d1 > DS_MAX) {
        throw new Error(`budget overflow Q=${q1} D=${d1}`)
      }
      if (d1 - d0 > plan.expectDsMax) {
        console.error(
          `ANOMALY ${plan.id} DeepSeek calls ${d1 - d0} > max ${plan.expectDsMax}`,
        )
      }

      const ajRaw = row?.ai_grade_json
      const aj =
        typeof ajRaw === 'string'
          ? JSON.parse(ajRaw as string)
          : (ajRaw as Record<string, unknown> | null)
      const recognizedWork = String(aj?.recognizedWork || '')
      const x50 = workKeepsX50(recognizedWork)

      const uaRaw = row?.user_answer_payload_json
      const ua =
        typeof uaRaw === 'string'
          ? JSON.parse(uaRaw as string)
          : (uaRaw as Record<string, unknown> | null)

      const sess = (
        await ds.query(
          `SELECT correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id=?`,
          [sessionId],
        )
      )[0]
      const view = await train.getSession(USER_ID, sessionId)
      const vi = view.items.find(
        (x: { id: string }) => String(x.id) === sessionItemId,
      )

      const rec: Record<string, unknown> = {
        id: plan.id,
        status: 'RAN',
        sampleKind: plan.kind,
        sessionId,
        sessionItemId,
        imageIds,
        imageIdsOrder: imageIds,
        provider: ua?.gradingProvider ?? null,
        gradeResult,
        gradeReason: row ? row.grade_reason : null,
        aiModel: row ? row.ai_model : null,
        aiAttemptCount: row ? Number(row.ai_attempt_count) : null,
        aiGradedAt: row?.ai_graded_at ? String(row.ai_graded_at) : null,
        totalScore: aj ? aj.totalScore : null,
        maxScore: aj ? aj.maxScore : null,
        rubric: aj ? aj.rubricScores : null,
        pipeline: aj ? aj.pipeline : null,
        visionModel: aj ? aj.visionModel : null,
        scoringModel: aj ? aj.scoringModel : null,
        recognizedWorkPreview: recognizedWork.slice(0, 600),
        x50Check: x50,
        recognitionUncertain: aj?.recognitionUncertain ?? null,
        recognitionWarnings: aj?.recognitionWarnings ?? null,
        confidence: aj?.confidence ?? null,
        visionCallCount: aj?.visionCallCount ?? null,
        scoringCallCount: aj?.scoringCallCount ?? null,
        personalizedExplanation: String(
          aj?.personalizedExplanation || '',
        ).slice(0, 300),
        qwen: { before: q0, after: q1, delta: q1 - q0 },
        deepseek: { before: d0, after: d1, delta: d1 - d0 },
        latencyMs: Date.now() - t0,
        counts: {
          correct: Number(sess.correct_count) || 0,
          wrong: Number(sess.wrong_count) || 0,
          pending: Number(sess.pending_count) || 0,
          accuracy: accuracyRatio(
            Number(sess.correct_count) || 0,
            Number(sess.wrong_count) || 0,
          ),
        },
        getSessionGrade: (vi as { gradeResult?: string })?.gradeResult ?? null,
        getSessionScore:
          (vi as { aiGrade?: { totalScore?: number } })?.aiGrade?.totalScore ??
          null,
      }
      results.push(rec)
      console.log(
        `DONE ${plan.id} grade=${gradeResult} score=${aj?.totalScore ?? '-'} x50=${x50.detail} Q=${q0}->${q1} D=${d0}->${d1}`,
      )

      // 安全停止：改写 x=50→x=40
      if (!x50.ok && x50.detail.includes('rewritten')) {
        safetyStop = x50.detail
        console.error('SAFETY_STOP', safetyStop)
        continue
      }
      // uncertain 却调用了 DeepSeek
      if (aj?.recognitionUncertain === true && d1 - d0 > 0) {
        safetyStop = 'uncertain still called DeepSeek'
        console.error('SAFETY_STOP', safetyStop)
        continue
      }
    }

    const out = {
      at: new Date().toISOString(),
      qwenUsed: vision.getLiveHttpUsed(),
      qwenMax: QWEN_MAX,
      deepseekUsed: ai.getTextLiveHttpUsed(),
      deepseekMax: DS_MAX,
      sessions: sessionIds,
      safetyStop,
      results,
    }
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(out, null, 2), 'utf8')
    console.log('RAW', reportPath)
    console.log('FINAL_QWEN', out.qwenUsed, '/', QWEN_MAX)
    console.log('FINAL_DS', out.deepseekUsed, '/', DS_MAX)
  } finally {
    await app.close()
  }
}

main().catch((e) => {
  console.error('FATAL', (e as Error).message)
  process.exit(1)
})
