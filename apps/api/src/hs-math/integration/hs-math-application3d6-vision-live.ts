/**
 * APPLICATION-3D-6：对**用户网页已提交**的 session item 显式 Vision 批改（最多 1 次 HTTP）。
 *
 * 用法（勿编造 ID）：
 *   pnpm --filter api run hs-math:application3d6-vision-live -- --sessionId=XXX --sessionItemId=YYY
 *
 * 要求：HS_MATH_VISION_GRADING_ENABLED=false；仅 invoker 外发；图片须已 submitted。
 */
import 'reflect-metadata'
import * as fs from 'fs'
import * as path from 'path'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { HsMathApplicationAiGradeService } from '../train/hs-math-application-ai-grade.service'
import { HsMathQwenVisionClientService } from '../train/hs-math-qwen-vision-client.service'
import { accuracyRatio } from '../util/accuracy'

const USER_ID = '2'
const MAX_HTTP = 1

function arg(name: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3).trim() : ''
}

async function main() {
  process.chdir(path.join(__dirname, '../../..'))
  process.env.HS_MATH_VISION_GRADING_ENABLED = 'false'
  process.env.HS_MATH_AI_GRADING_ENABLED = 'false'

  const sessionId = arg('sessionId') || process.env.HS_MATH_3D6_SESSION_ID || ''
  const sessionItemId =
    arg('sessionItemId') || process.env.HS_MATH_3D6_SESSION_ITEM_ID || ''

  if (!sessionId || !sessionItemId) {
    console.error(
      'WAITING_FOR_USER: 请先在学生网页上传并提交虚构手写图，然后提供 --sessionId= 与 --sessionItemId=',
    )
    process.exit(2)
  }

  let httpCount = 0
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  const ai = app.get(HsMathApplicationAiGradeService)
  const vision = app.get(HsMathQwenVisionClientService)
  const ds = app.get(DataSource)

  const dbName = (await ds.query('SELECT DATABASE() d'))[0].d
  if (dbName !== 'study_system') {
    throw new Error(`拒绝：DATABASE=${dbName}`)
  }
  if (ai.isVisionOutboundEnabled()) {
    throw new Error('拒绝：全局 Vision 开关应为 false（仅 invoker 外发）')
  }

  const rows: Array<{
    id: string
    session_id: string
    user_id: string
    qtype: string
    grade_result: string | null
    grade_reason: string | null
    user_answer_payload_json: unknown
    item_code: string | null
  }> = await ds.query(
    `SELECT i.id, i.session_id, s.user_id, i.qtype, i.grade_result, i.grade_reason,
            i.user_answer_payload_json, i.item_code
     FROM hs_math_train_session_items i
     JOIN hs_math_train_sessions s ON s.id = i.session_id
     WHERE i.id = ? AND i.session_id = ? AND s.user_id = ?`,
    [sessionItemId, sessionId, USER_ID],
  )
  if (!rows.length) {
    throw new Error('session item 不存在或不属于 user_id=2')
  }
  const row = rows[0]
  if (row.qtype !== 'application') {
    throw new Error(`非 application：${row.qtype}`)
  }

  let payload: { kind?: string; text?: string; imageIds?: string[] } = {}
  const rawUa = row.user_answer_payload_json
  if (typeof rawUa === 'string') {
    payload = JSON.parse(rawUa)
  } else if (rawUa && typeof rawUa === 'object') {
    payload = rawUa as typeof payload
  }
  const imageIds = Array.isArray(payload.imageIds)
    ? payload.imageIds.map(String)
    : []
  if (imageIds.length < 1) {
    throw new Error('答案未引用 imageIds；请先在网页上传并提交图片')
  }
  if (imageIds.length > 5) {
    throw new Error('imageIds 超过 5')
  }

  const imgs: Array<{
    id: string
    status: string
    user_id: string
    session_item_id: string
  }> = await ds.query(
    `SELECT id, status, user_id, session_item_id
     FROM hs_math_train_session_item_images
     WHERE id IN (${imageIds.map(() => '?').join(',')})`,
    imageIds,
  )
  const byId = new Map(imgs.map((r) => [String(r.id), r]))
  for (const id of imageIds) {
    const im = byId.get(id)
    if (!im) throw new Error(`图片缺失: ${id}`)
    if (String(im.user_id) !== USER_ID) throw new Error(`图片属主不符: ${id}`)
    if (String(im.session_item_id) !== String(sessionItemId)) {
      throw new Error(`图片不属于本 sessionItem: ${id}`)
    }
    if (im.status !== 'submitted') {
      throw new Error(`图片未锁定 submitted: ${id} status=${im.status}`)
    }
  }

  // 显式入口：重置为 pending_ai 以便 claim（不扫其它历史）
  await ds.query(
    `UPDATE hs_math_train_session_items
     SET grade_result='pending_ai', grade_reason='awaiting_vision_ai',
         ai_grade_json=NULL, ai_model=NULL, ai_graded_at=NULL, ai_attempt_count=0
     WHERE id=? AND session_id=? AND grade_result <> 'graded'`,
    [sessionItemId, sessionId],
  )

  console.log('DB', dbName)
  console.log('SESSION', sessionId)
  console.log('SESSION_ITEM', sessionItemId)
  console.log('ITEM_CODE', row.item_code)
  console.log('IMAGE_IDS_ORDER', imageIds.join(','))
  console.log('IMAGE_COUNT', imageIds.length)
  console.log('VISION_SWITCH', ai.isVisionOutboundEnabled())
  console.log('MAX_HTTP', MAX_HTTP)

  let usage: unknown = null
  let returnedModel: string | null = null
  const t0 = Date.now()
  const g = await ai.gradeOneVisionSessionItem({
    userId: USER_ID,
    sessionId,
    sessionItemId,
    invoker: async (p) => {
      if (httpCount >= MAX_HTTP) throw new Error('http_budget_exceeded')
      httpCount += 1
      console.log(
        `HTTP_CALL #${httpCount}/${MAX_HTTP} images=${p.images.length} start`,
      )
      const started = Date.now()
      try {
        const out = await vision.gradeApplicationVision(p)
        usage = out.usage ?? null
        returnedModel = out.model
        console.log(
          `HTTP_CALL #${httpCount}/${MAX_HTTP} ok ${Date.now() - started}ms model=${out.model}`,
        )
        return out
      } catch (e) {
        console.log(
          `HTTP_CALL #${httpCount}/${MAX_HTTP} FAIL ${Date.now() - started}ms`,
        )
        throw e
      }
    },
  })
  const latencyMs = Date.now() - t0

  const after = (
    await ds.query(
      `SELECT grade_result, grade_reason, ai_model, ai_graded_at, ai_attempt_count, ai_grade_json
       FROM hs_math_train_session_items WHERE id=?`,
      [sessionItemId],
    )
  )[0]

  const sess = (
    await ds.query(
      `SELECT correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id=?`,
      [sessionId],
    )
  )[0]
  const accuracy = accuracyRatio(
    Number(sess.correct_count) || 0,
    Number(sess.wrong_count) || 0,
  )

  let gradeJson: Record<string, unknown> | null = null
  if (after.ai_grade_json) {
    gradeJson =
      typeof after.ai_grade_json === 'string'
        ? JSON.parse(after.ai_grade_json)
        : after.ai_grade_json
  }

  const report = {
    stage: 'APPLICATION-3D-6',
    sessionId,
    sessionItemId,
    itemCode: row.item_code,
    imageIdsOrder: imageIds,
    imageCount: imageIds.length,
    httpCount,
    maxHttp: MAX_HTTP,
    latencyMs,
    gradeStatus: g.status,
    gradeReason: g.reason ?? after.grade_reason,
    dbGradeResult: after.grade_result,
    aiModel: after.ai_model ?? returnedModel,
    aiAttemptCount: after.ai_attempt_count,
    totalScore: gradeJson?.totalScore ?? null,
    maxScore: gradeJson?.maxScore ?? null,
    rubricScores: gradeJson?.rubricScores ?? null,
    recognitionWarnings: gradeJson?.recognitionWarnings ?? null,
    confidence: gradeJson?.confidence ?? null,
    errors: gradeJson?.errors ?? null,
    explanationPreview:
      typeof gradeJson?.personalizedExplanation === 'string'
        ? String(gradeJson.personalizedExplanation).slice(0, 240)
        : null,
    recognizedWorkPreview:
      typeof gradeJson?.recognizedWork === 'string'
        ? String(gradeJson.recognizedWork).slice(0, 240)
        : null,
    usage,
    sessionCounts: {
      correct: Number(sess.correct_count) || 0,
      wrong: Number(sess.wrong_count) || 0,
      pending: Number(sess.pending_count) || 0,
      accuracy,
    },
    visionSwitchFinal: false,
    finishedAt: new Date().toISOString(),
  }

  const outPath = path.resolve(
    process.cwd(),
    '../../docs/high_school_math/_tmp_application3d6_vision_live_raw.json',
  )
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log('RAW', outPath)
  console.log('RESULT', JSON.stringify(report, null, 2))

  await app.close()
  if (httpCount > MAX_HTTP) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
