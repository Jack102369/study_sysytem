/**
 * APPLICATION-3E-3：双模型真实联调（自动 submit 调度，非手动 gradeOne*）。
 * 预算：Qwen ≤7 · DeepSeek ≤5；仅 user_id=2 + session allowlist。
 *
 * 运行：pnpm --filter api run hs-math:application3e3-dual-live
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
const DIFFICULTY = 2
const ITEM_CODE = 'HSMA-RJA-CH03-APP-0001'
const ITEM_ID = '151'
const QWEN_MAX = 7
const DS_MAX = 5
const FORBIDDEN_SESSIONS = new Set(['51', '55', '56', '107', '108'])

const ANSWER_CORRECT_TEXT = `【3E-3 虚构·正确文字】
设票价 x 元（30~60 正整数），人数 2400-30x。
y=x(2400-30x)=2400x-30x²。定义域 {30,...,60}。
y=-30(x-40)²+48000，x=40 时最大收入 48000 元。`

const ANSWER_PARTIAL_TEXT = `【3E-3 虚构·部分正确文字】
建模与定义域正确：y=2400x-30x²，x∈{30..60}。
求最值时对称轴误为 30，结论票价 30 元最大收入 45000。`

const ANSWER_MIXED_TEXT = `【3E-3 虚构·文图混合·文字部分】
建模：y=x(2400-30x)=2400x-30x²。
定义域：{30,31,...,60}。
（最大值配方见图片）`

type SceneId = 'B' | 'E' | 'C' | 'F' | 'G' | 'H' | 'A' | 'D'

type ScenePlan = {
  id: SceneId
  provider: 'qwen' | 'deepseek'
  pngs: string[]
  text?: string
  expectQwen: number
  expectDs: number
}

const ORDER: ScenePlan[] = [
  {
    id: 'B',
    provider: 'deepseek',
    pngs: ['B_correct_p1.png', 'B_correct_p2.png'],
    expectQwen: 1,
    expectDs: 1,
  },
  { id: 'E', provider: 'deepseek', pngs: ['E_blur.png'], expectQwen: 1, expectDs: 0 },
  {
    id: 'C',
    provider: 'deepseek',
    pngs: ['C_partial_p1.png', 'C_partial_p2.png'],
    expectQwen: 1,
    expectDs: 1,
  },
  {
    id: 'F',
    provider: 'deepseek',
    pngs: ['F_mixed_img.png'],
    text: ANSWER_MIXED_TEXT,
    expectQwen: 1,
    expectDs: 1,
  },
  {
    id: 'G',
    provider: 'deepseek',
    pngs: [],
    text: ANSWER_CORRECT_TEXT,
    expectQwen: 0,
    expectDs: 1,
  },
  {
    id: 'H',
    provider: 'qwen',
    pngs: ['H_partial.png'],
    expectQwen: 1,
    expectDs: 0,
  },
  {
    id: 'A',
    provider: 'qwen',
    pngs: ['A_correct_p1.png', 'A_correct_p2.png'],
    expectQwen: 1,
    expectDs: 0,
  },
  {
    id: 'D',
    provider: 'deepseek',
    pngs: ['D_wrong.png'],
    expectQwen: 1,
    expectDs: 1,
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

type SceneResult = {
  id: SceneId
  status: string
  sessionId: string
  sessionItemId: string
  imageIds: string[]
  provider: string
  gradeResult: string | null
  gradeReason: string | null
  totalScore: number | null
  maxScore: number | null
  rubric: unknown
  pipeline: string | null
  visionModel: string | null
  scoringModel: string | null
  aiModel: string | null
  recognizedWorkPreview: string
  recognitionUncertain: boolean | null
  qwenUsedBefore: number
  qwenUsedAfter: number
  dsUsedBefore: number
  dsUsedAfter: number
  latencyMs: number
  notes: string[]
  counts: {
    correct: number
    wrong: number
    pending: number
    accuracy: number | null
  }
}

async function main() {
  process.chdir(path.join(__dirname, '../../..'))
  const apiRoot = process.cwd()
  const pngDir = path.join(apiRoot, 'src/hs-math/integration/fixtures/application3e3')
  const reportPath = path.join(
    apiRoot,
    '../../docs/high_school_math/_tmp_application3e3_live_raw.json',
  )

  // 强制关全局（准备阶段）
  process.env.HS_MATH_VISION_GRADING_ENABLED = 'false'
  process.env.HS_MATH_AI_GRADING_ENABLED = 'false'

  const results: SceneResult[] = []
  const prepared: Array<{
    plan: ScenePlan
    sessionId: string
    sessionItemId: string
    imageIds: string[]
  }> = []

  let app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  const ds = app.get(DataSource)
  const train = app.get(HsMathTrainService)
  const images = app.get(HsMathApplicationImagesService)
  const ai = app.get(HsMathApplicationAiGradeService)
  const vision = app.get(HsMathQwenVisionClientService)

  try {
    const dbName = (await ds.query('SELECT DATABASE() d'))[0].d
    if (dbName !== 'study_system') throw new Error(`DB=${dbName}`)
    console.log('DB', dbName)
    console.log('VISION_OUT', ai.isVisionOutboundEnabled())
    console.log('TEXT_OUT', ai.isOutboundEnabled())

    const itemRows = await ds.query(
      `SELECT id, code, status, pool, answer_payload_json
       FROM hs_math_train_items WHERE id=?`,
      [ITEM_ID],
    )
    if (!itemRows.length) throw new Error('item 151 missing')
    const it = itemRows[0]
    if (String(it.code) !== ITEM_CODE) throw new Error(`code ${it.code}`)
    if (String(it.status) !== 'approved' || String(it.pool) !== 'formal') {
      throw new Error(`item not approved/formal: ${it.status}/${it.pool}`)
    }
    const ap =
      typeof it.answer_payload_json === 'string'
        ? JSON.parse(it.answer_payload_json)
        : it.answer_payload_json
    const rub = Array.isArray(ap?.rubric) ? ap.rubric : []
    const sum = rub.reduce((s: number, r: { maxScore: number }) => s + Number(r.maxScore), 0)
    if (Number(ap?.maxScore) !== 10 || sum !== 10) {
      throw new Error(`rubric max mismatch max=${ap?.maxScore} sum=${sum}`)
    }
    console.log('ITEM_OK', ITEM_ID, ITEM_CODE, 'rubric10')

    if (!fs.existsSync(path.join(pngDir, 'B_correct_p1.png'))) {
      throw new Error(`PNG fixtures missing in ${pngDir} — run _gen-3e3-png.ps1 first`)
    }

    // —— 准备：建 session + 上传 + 保存答案（不 submit）——
    for (const plan of ORDER) {
      const created = await train.createSession(USER_ID, {
        specialtyId: SPECIALTY_ID,
        categoryId: CATEGORY_ID,
        difficulty: DIFFICULTY,
        count: 1,
        mode: 'sequential',
        poolMode: 'formal',
        questionType: 'application',
      })
      const item = created.items[0]
      if (!item || item.itemCode !== ITEM_CODE) {
        throw new Error(`expected ${ITEM_CODE}, got ${item?.itemCode}`)
      }
      const sessionId = String(created.id)
      const sessionItemId = String(item.id)
      if (FORBIDDEN_SESSIONS.has(sessionId)) {
        throw new Error(`refused forbidden session id ${sessionId}`)
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

      const payload: {
        kind: 'application'
        gradingProvider: 'qwen' | 'deepseek'
        text?: string
        imageIds?: string[]
      } = {
        kind: 'application',
        gradingProvider: plan.provider,
      }
      if (plan.text) payload.text = plan.text
      if (imageIds.length) payload.imageIds = imageIds

      await train.saveAnswer(USER_ID, sessionId, {
        sortOrder: item.sortOrder,
        userAnswerPayload: payload,
      })

      prepared.push({ plan, sessionId, sessionItemId, imageIds })
      console.log(
        `PREP ${plan.id} session=${sessionId} item=${sessionItemId} imgs=${imageIds.join(',') || '-'} provider=${plan.provider}`,
      )
    }
  } finally {
    await app.close()
  }

  const sessionIds = prepared.map((p) => p.sessionId)
  console.log('ALLOWLIST_SESSIONS', sessionIds.join(','))

  // —— 开启开关 + 预算 + allowlist（进程内，不写密钥）——
  process.env.HS_MATH_VISION_GRADING_ENABLED = 'true'
  process.env.HS_MATH_AI_GRADING_ENABLED = 'true'
  process.env.HS_MATH_VISION_GRADING_TEST_USER_ID = USER_ID
  process.env.HS_MATH_VISION_GRADING_TEST_SESSION_IDS = sessionIds.join(',')
  process.env.HS_MATH_VISION_LIVE_HTTP_BUDGET = String(QWEN_MAX)
  process.env.HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET = String(DS_MAX)

  app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  const ds2 = app.get(DataSource)
  const train2 = app.get(HsMathTrainService)
  const ai2 = app.get(HsMathApplicationAiGradeService)
  const vision2 = app.get(HsMathQwenVisionClientService)

  try {
    if (!ai2.isVisionOutboundEnabled() || !ai2.isOutboundEnabled()) {
      throw new Error('switches not enabled in live context')
    }
    console.log('LIVE_SWITCHES_ON')
    console.log('VISION_BUDGET_MAX', vision2.getLiveHttpBudgetMax())
    console.log('TEXT_BUDGET_MAX', ai2.getTextLiveHttpBudgetMax())
    if (vision2.getLiveHttpBudgetMax() !== QWEN_MAX) {
      throw new Error(`vision budget max != ${QWEN_MAX}`)
    }
    if (ai2.getTextLiveHttpBudgetMax() !== DS_MAX) {
      throw new Error(`text budget max != ${DS_MAX}`)
    }

    for (const prep of prepared) {
      const { plan, sessionId, sessionItemId, imageIds } = prep
      const qBefore = vision2.getLiveHttpUsed()
      const dBefore = ai2.getTextLiveHttpUsed()
      const remainQ = QWEN_MAX - qBefore
      const remainD = DS_MAX - dBefore
      if (remainQ < plan.expectQwen || remainD < plan.expectDs) {
        console.warn(
          `STOP budget before ${plan.id}: remain Q=${remainQ} D=${remainD} need Q=${plan.expectQwen} D=${plan.expectDs}`,
        )
        results.push({
          id: plan.id,
          status: 'NOT_RUN',
          sessionId,
          sessionItemId,
          imageIds,
          provider: plan.provider,
          gradeResult: null,
          gradeReason: 'budget_insufficient',
          totalScore: null,
          maxScore: null,
          rubric: null,
          pipeline: null,
          visionModel: null,
          scoringModel: null,
          aiModel: null,
          recognizedWorkPreview: '',
          recognitionUncertain: null,
          qwenUsedBefore: qBefore,
          qwenUsedAfter: qBefore,
          dsUsedBefore: dBefore,
          dsUsedAfter: dBefore,
          latencyMs: 0,
          notes: ['budget_insufficient'],
          counts: { correct: 0, wrong: 0, pending: 0, accuracy: null },
        })
        continue
      }

      if (!ai2.canAutoVisionGradeSession(USER_ID, sessionId) && plan.expectQwen > 0) {
        throw new Error(`allowlist fail vision scene=${plan.id} session=${sessionId}`)
      }
      if (!ai2.canAutoTextGradeSession(USER_ID, sessionId) && plan.expectDs > 0) {
        throw new Error(`allowlist fail text scene=${plan.id} session=${sessionId}`)
      }

      const t0 = Date.now()
      console.log(`SUBMIT ${plan.id} ...`)
      await train2.submit(USER_ID, sessionId)

      // 轮询终态
      let gradeResult: string | null = null
      let gradeReason: string | null = null
      let row: Record<string, unknown> | null = null
      for (let i = 0; i < 90; i++) {
        await sleep(2000)
        const rows = await ds2.query(
          `SELECT grade_result, grade_reason, ai_model, ai_graded_at, ai_attempt_count, ai_grade_json
           FROM hs_math_train_session_items WHERE id=? AND session_id=?`,
          [sessionItemId, sessionId],
        )
        row = rows[0]
        gradeResult = row ? String(row.grade_result || '') : null
        gradeReason = row ? String(row.grade_reason || '') : null
        if (
          gradeResult === 'graded' ||
          gradeResult === 'review_required' ||
          gradeResult === 'grading_failed'
        ) {
          break
        }
        console.log(`  poll ${plan.id} #${i + 1} state=${gradeResult}`)
      }
      const latencyMs = Date.now() - t0
      const qAfter = vision2.getLiveHttpUsed()
      const dAfter = ai2.getTextLiveHttpUsed()

      const ajRaw = row?.ai_grade_json
      const aj =
        typeof ajRaw === 'string'
          ? JSON.parse(ajRaw)
          : (ajRaw as Record<string, unknown> | null)

      const sess = (
        await ds2.query(
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

      // getSession 再读
      const view = await train2.getSession(USER_ID, sessionId)
      const vi = view.items.find((x: { id: string }) => String(x.id) === sessionItemId) as {
        gradeResult?: string
        aiGrade?: Record<string, unknown>
        userAnswerPayloadJson?: { gradingProvider?: string }
      }

      const notes: string[] = []
      const dq = qAfter - qBefore
      const dd = dAfter - dBefore
      if (dq > plan.expectQwen) notes.push(`qwen_http_extra got=${dq} expect<=${plan.expectQwen}`)
      if (dd > plan.expectDs) notes.push(`ds_http_extra got=${dd} expect<=${plan.expectDs}`)
      if (qAfter > QWEN_MAX || dAfter > DS_MAX) {
        notes.push('BUDGET_OVERFLOW')
        throw new Error(`budget overflow Q=${qAfter} D=${dAfter}`)
      }
      if (plan.id === 'E' && dd > 0) {
        notes.push('E_CALLED_DEEPSEEK')
      }
      if (plan.id === 'G' && dq > 0) {
        notes.push('G_CALLED_QWEN')
      }
      if (vi?.userAnswerPayloadJson?.gradingProvider !== plan.provider) {
        notes.push('provider_mismatch_in_view')
      }
      if (gradeResult === 'graded' && aj) {
        const scores = Array.isArray(aj.rubricScores) ? aj.rubricScores : []
        const sum = scores.reduce(
          (s: number, r: { score: number }) => s + Number(r.score),
          0,
        )
        if (sum !== Number(aj.totalScore)) notes.push(`rubric_sum!=total`)
      }

      const recognized = String(aj?.recognizedWork || '').slice(0, 240)
      results.push({
        id: plan.id,
        status: 'RAN',
        sessionId,
        sessionItemId,
        imageIds,
        provider: plan.provider,
        gradeResult,
        gradeReason,
        totalScore: aj ? Number(aj.totalScore) : null,
        maxScore: aj ? Number(aj.maxScore) : null,
        rubric: aj?.rubricScores ?? null,
        pipeline: aj ? String(aj.pipeline || '') : null,
        visionModel: aj ? String(aj.visionModel || '') : null,
        scoringModel: aj ? String(aj.scoringModel || '') : null,
        aiModel: row ? String(row.ai_model || '') : null,
        recognizedWorkPreview: recognized,
        recognitionUncertain:
          aj && typeof aj.recognitionUncertain === 'boolean'
            ? aj.recognitionUncertain
            : null,
        qwenUsedBefore: qBefore,
        qwenUsedAfter: qAfter,
        dsUsedBefore: dBefore,
        dsUsedAfter: dAfter,
        latencyMs,
        notes,
        counts,
      })

      console.log(
        `DONE ${plan.id} grade=${gradeResult} score=${aj?.totalScore ?? '-'} Q=${qBefore}->${qAfter} D=${dBefore}->${dAfter} ms=${latencyMs} notes=${notes.join(';') || '-'}`,
      )

      // 异常停止
      if (notes.includes('E_CALLED_DEEPSEEK') || notes.includes('BUDGET_OVERFLOW')) {
        console.error('STOP anomaly', notes)
        break
      }
      if (qAfter >= QWEN_MAX && dAfter >= DS_MAX) {
        console.warn('budgets exhausted after', plan.id)
      }
    }

    const raw = {
      at: new Date().toISOString(),
      qwenUsed: vision2.getLiveHttpUsed(),
      qwenMax: QWEN_MAX,
      deepseekUsed: ai2.getTextLiveHttpUsed(),
      deepseekMax: DS_MAX,
      sessions: sessionIds,
      results,
    }
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(raw, null, 2), 'utf8')
    console.log('RAW_REPORT', reportPath)
    console.log('FINAL_QWEN', raw.qwenUsed, '/', QWEN_MAX)
    console.log('FINAL_DS', raw.deepseekUsed, '/', DS_MAX)
  } finally {
    await app.close()
  }
}

main().catch((e) => {
  console.error('FATAL', (e as Error).message)
  process.exit(1)
})
