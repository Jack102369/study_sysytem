/**
 * APPLICATION-3B：真实 study_system 迁移验收 + stub AI 业务闭环（不调用 DeepSeek）。
 * 运行：pnpm --filter api run hs-math:application3b-mysql-it
 *
 * 约束：
 * - 仅操作 user_id=2 新建会话，不改 session 51/55/56
 * - HS_MATH_AI_GRADING_ENABLED 保持关闭；AI 仅进程内 stub
 * - 不重启 HTTP 服务；本脚本独立 Nest ApplicationContext
 */
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { HsMathTrainService } from '../train/hs-math-train.service'
import { HsMathApplicationAiGradeService } from '../train/hs-math-application-ai-grade.service'
import { HsMathApplicationImagesService } from '../train/hs-math-application-images.service'
import { accuracyRatio } from '../util/accuracy'

const USER_ID = '2'
const SPECIALTY_ID = '18'
const CATEGORY_ID = '44'
const DIFFICULTY = 2
const ITEM_CODE = 'HSMA-RJA-CH03-APP-0001'

/** 1x1 PNG */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

type Check = { name: string; ok: boolean; detail?: string }
const checks: Check[] = []

function rec(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function stubAi(scores: {
  total: number
  parts: Array<{ key: string; score: number; feedback?: string }>
  explanation?: string
  model?: string
}) {
  return async () => ({
    model: scores.model || 'stub-application3b',
    content: JSON.stringify({
      totalScore: scores.total,
      rubricScores: scores.parts.map((p) => ({
        rubricKey: p.key,
        score: p.score,
        feedback: p.feedback || `${p.key}反馈`,
      })),
      recognizedWork: 'stub work',
      errors: scores.total < 10 ? ['stub error loc'] : [],
      personalizedExplanation:
        scores.explanation || '虚构测试答案的个性化解析（stub，非真实 DeepSeek）。',
      confidence: 0.88,
    }),
  })
}

/** submit 后异步 schedule 会因 ai_disabled 落入 grading_failed；等其结束后再 stub 批改 */
async function resetForStubGrade(
  ds: DataSource,
  sessionItemId: string,
  sessionId: string,
) {
  await sleep(800)
  await ds.query(
    `UPDATE hs_math_train_session_items
     SET grade_result='pending_ai', grade_reason='awaiting_ai',
         ai_grade_json=NULL, ai_model=NULL, ai_graded_at=NULL, ai_attempt_count=0
     WHERE id=? AND session_id=?`,
    [sessionItemId, sessionId],
  )
}

async function createAppSession(train: HsMathTrainService) {
  const created = await train.createSession(USER_ID, {
    specialtyId: SPECIALTY_ID,
    categoryId: CATEGORY_ID,
    difficulty: DIFFICULTY,
    count: 1,
    mode: 'sequential',
    poolMode: 'formal',
  })
  const item = created.items?.[0]
  if (!item || item.itemCode !== ITEM_CODE) {
    throw new Error(`expected ${ITEM_CODE}, got ${item?.itemCode}`)
  }
  return { sessionId: String(created.id), itemId: String(item.id), sortOrder: item.sortOrder }
}

async function main() {
  process.chdir(require('path').join(__dirname, '../../..'))
  // 强制关闭外发（即使误配）
  process.env.HS_MATH_AI_GRADING_ENABLED = 'false'

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  const train = app.get(HsMathTrainService)
  const ai = app.get(HsMathApplicationAiGradeService)
  const images = app.get(HsMathApplicationImagesService)
  const ds = app.get(DataSource)

  rec('ai_outbound_disabled', ai.isOutboundEnabled() === false)
  rec(
    'deepseek_key_configured_but_not_used',
    !!(process.env.DEEPSEEK_API_KEY || '').trim(),
    'key presence only; no outbound this run',
  )

  const baseline = await ds.query(
    `SELECT
       (SELECT COUNT(*) FROM hs_math_train_session_items) AS items,
       (SELECT COUNT(*) FROM hs_math_train_session_item_images) AS images,
       (SELECT COUNT(*) FROM hs_math_train_items WHERE status='approved') AS approved,
       (SELECT COUNT(*) FROM hs_math_train_session_items WHERE grade_result='pending_ai') AS pending_ai,
       (SELECT COUNT(*) FROM hs_math_train_sessions WHERE id IN (51,55,56)) AS hist_sessions`,
  )
  const b0 = baseline[0]

  // —— A 正确满分 stub ——
  {
    const s = await createAppSession(train)
    await train.saveAnswer(USER_ID, s.sessionId, {
      sortOrder: s.sortOrder,
      userAnswerPayload: {
        kind: 'application',
        text: '【虚构A】设日票价为x元，建立收入函数并求最大值，结论正确。',
      },
    })
    const submitted = await train.submit(USER_ID, s.sessionId)
    const afterSubmit = await ds.query(
      `SELECT grade_result, grade_reason FROM hs_math_train_session_items WHERE id=?`,
      [s.itemId],
    )
    rec(
      'A_submit_pending_ai',
      afterSubmit[0]?.grade_result === 'pending_ai',
      String(afterSubmit[0]?.grade_result),
    )
    await resetForStubGrade(ds, s.itemId, s.sessionId)
    const g = await ai.gradeOneSessionItem({
      userId: USER_ID,
      sessionId: s.sessionId,
      sessionItemId: s.itemId,
      invoker: stubAi({
        total: 10,
        parts: [
          { key: 'model', score: 3 },
          { key: 'domain', score: 2 },
          { key: 'solve', score: 3 },
          { key: 'conclusion', score: 2 },
        ],
        explanation: '虚构满分解答的解析。',
      }),
    })
    rec('A_grade_status', g.status === 'graded', g.status)
    const row = (
      await ds.query(
        `SELECT grade_result, ai_model, ai_graded_at, ai_grade_json, ai_attempt_count FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    const aj =
      typeof row.ai_grade_json === 'string'
        ? JSON.parse(row.ai_grade_json)
        : row.ai_grade_json
    rec('A_persist_graded', row.grade_result === 'graded')
    rec('A_total_10', aj?.totalScore === 10 && aj?.maxScore === 10, JSON.stringify(aj?.totalScore))
    rec('A_rubric_4', Array.isArray(aj?.rubricScores) && aj.rubricScores.length === 4)
    rec('A_model_stub', String(row.ai_model || '').includes('stub'), String(row.ai_model))
    rec('A_graded_at', !!row.ai_graded_at)
    rec('A_not_real_deepseek_label', String(row.ai_model) === 'stub-application3b')

    // 幂等：再次批改不得覆盖
    const again = await ai.gradeOneSessionItem({
      userId: USER_ID,
      sessionId: s.sessionId,
      sessionItemId: s.itemId,
      invoker: stubAi({
        total: 0,
        parts: [
          { key: 'model', score: 0 },
          { key: 'domain', score: 0 },
          { key: 'solve', score: 0 },
          { key: 'conclusion', score: 0 },
        ],
        model: 'stub-should-not-write',
      }),
    })
    const row2 = (
      await ds.query(
        `SELECT grade_result, ai_model, JSON_EXTRACT(ai_grade_json,'$.totalScore') AS ts FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    rec(
      'A_idempotent_skip',
      again.status === 'skipped' &&
        row2.grade_result === 'graded' &&
        Number(row2.ts) === 10 &&
        row2.ai_model === 'stub-application3b',
      `${again.status}/${row2.ai_model}/${row2.ts}`,
    )

    const view = await train.getSession(USER_ID, s.sessionId)
    const vi = view.items.find((i: { id: string }) => String(i.id) === s.itemId) as {
      aiGrade?: { totalScore: number }
      gradeResult?: string
    }
    rec(
      'A_api_aiGrade',
      vi?.gradeResult === 'graded' && vi?.aiGrade?.totalScore === 10,
      JSON.stringify(vi?.aiGrade?.totalScore),
    )
    const sess = (
      await ds.query(
        `SELECT correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id=?`,
        [s.sessionId],
      )
    )[0]
    rec(
      'A_stats_graded_not_correct_wrong',
      Number(sess.correct_count) === 0 &&
        Number(sess.wrong_count) === 0 &&
        Number(sess.pending_count) === 0,
      JSON.stringify(sess),
    )
    rec(
      'A_accuracy_null_den',
      accuracyRatio(Number(sess.correct_count), Number(sess.wrong_count)) === null,
    )
    void submitted
  }

  // —— B 部分分 ——
  {
    const s = await createAppSession(train)
    await train.saveAnswer(USER_ID, s.sessionId, {
      sortOrder: s.sortOrder,
      userAnswerPayload: {
        kind: 'application',
        text: '【虚构B】建模正确，求解有误。',
      },
    })
    await train.submit(USER_ID, s.sessionId)
    await resetForStubGrade(ds, s.itemId, s.sessionId)
    await ai.gradeOneSessionItem({
      userId: USER_ID,
      sessionId: s.sessionId,
      sessionItemId: s.itemId,
      invoker: stubAi({
        total: 7,
        parts: [
          { key: 'model', score: 3 },
          { key: 'domain', score: 2 },
          { key: 'solve', score: 1 },
          { key: 'conclusion', score: 1 },
        ],
      }),
    })
    const row = (
      await ds.query(
        `SELECT grade_result, JSON_EXTRACT(ai_grade_json,'$.totalScore') ts FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    rec('B_partial_7', row.grade_result === 'graded' && Number(row.ts) === 7, String(row.ts))
    const sess = (
      await ds.query(
        `SELECT correct_count, wrong_count FROM hs_math_train_sessions WHERE id=?`,
        [s.sessionId],
      )
    )[0]
    rec(
      'B_not_mapped_wrong',
      Number(sess.correct_count) === 0 && Number(sess.wrong_count) === 0,
    )
  }

  // —— C 合法 0 分 ——
  {
    const s = await createAppSession(train)
    await train.saveAnswer(USER_ID, s.sessionId, {
      sortOrder: s.sortOrder,
      userAnswerPayload: {
        kind: 'application',
        text: '【虚构C】完全无关的错误解答。',
      },
    })
    await train.submit(USER_ID, s.sessionId)
    await resetForStubGrade(ds, s.itemId, s.sessionId)
    await ai.gradeOneSessionItem({
      userId: USER_ID,
      sessionId: s.sessionId,
      sessionItemId: s.itemId,
      invoker: stubAi({
        total: 0,
        parts: [
          { key: 'model', score: 0 },
          { key: 'domain', score: 0 },
          { key: 'solve', score: 0 },
          { key: 'conclusion', score: 0 },
        ],
        explanation: '虚构零分解答说明。',
      }),
    })
    const row = (
      await ds.query(
        `SELECT grade_result, ai_grade_json IS NOT NULL AS has_json, JSON_EXTRACT(ai_grade_json,'$.totalScore') ts FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    rec(
      'C_legal_zero_graded',
      row.grade_result === 'graded' && Number(row.ts) === 0 && Number(row.has_json) === 1,
    )
  }

  // —— 超时 → grading_failed 不写 0 分 ——
  {
    const s = await createAppSession(train)
    await train.saveAnswer(USER_ID, s.sessionId, {
      sortOrder: s.sortOrder,
      userAnswerPayload: {
        kind: 'application',
        text: '【虚构超时】',
      },
    })
    await train.submit(USER_ID, s.sessionId)
    await resetForStubGrade(ds, s.itemId, s.sessionId)
    await ai.gradeOneSessionItem({
      userId: USER_ID,
      sessionId: s.sessionId,
      sessionItemId: s.itemId,
      invoker: async () => {
        throw new Error('timeout aborted')
      },
    })
    const row = (
      await ds.query(
        `SELECT grade_result, grade_reason, ai_grade_json FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    rec(
      'timeout_grading_failed',
      row.grade_result === 'grading_failed' && row.ai_grade_json == null,
      `${row.grade_result}/${row.grade_reason}`,
    )
    const sess = (
      await ds.query(
        `SELECT correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id=?`,
        [s.sessionId],
      )
    )[0]
    rec(
      'timeout_not_wrong',
      Number(sess.wrong_count) === 0 && Number(sess.pending_count) === 1,
      JSON.stringify(sess),
    )
  }

  // —— 校验失败不写 0 ——
  {
    const s = await createAppSession(train)
    await train.saveAnswer(USER_ID, s.sessionId, {
      sortOrder: s.sortOrder,
      userAnswerPayload: {
        kind: 'application',
        text: '【虚构坏JSON】',
      },
    })
    await train.submit(USER_ID, s.sessionId)
    await resetForStubGrade(ds, s.itemId, s.sessionId)
    await ai.gradeOneSessionItem({
      userId: USER_ID,
      sessionId: s.sessionId,
      sessionItemId: s.itemId,
      invoker: async () => ({ model: 'stub-bad', content: 'not-json' }),
    })
    const row = (
      await ds.query(
        `SELECT grade_result, ai_grade_json FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    rec(
      'schema_fail_no_zero',
      row.grade_result === 'grading_failed' && row.ai_grade_json == null,
    )
  }

  // —— D 纯图片 → review_required ——
  {
    const s = await createAppSession(train)
    const up = await images.upload(USER_ID, s.sessionId, s.itemId, {
      buffer: TINY_PNG,
      size: TINY_PNG.length,
      mimetype: 'image/png',
      originalname: 'a.png',
      fieldname: 'file',
    } as Express.Multer.File)
    await train.saveAnswer(USER_ID, s.sessionId, {
      sortOrder: s.sortOrder,
      userAnswerPayload: {
        kind: 'application',
        imageIds: [String(up.imageId)],
      },
    })
    await train.submit(USER_ID, s.sessionId)
    const row = (
      await ds.query(
        `SELECT grade_result, grade_reason, user_answer_payload_json FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    rec(
      'D_review_required',
      row.grade_result === 'review_required',
      `${row.grade_result}/${row.grade_reason}`,
    )
    const img = (
      await ds.query(
        `SELECT status, storage_key FROM hs_math_train_session_item_images WHERE id=?`,
        [up.imageId],
      )
    )[0]
    rec('D_image_submitted', img.status === 'submitted', img.status)
    const view = await train.getSession(USER_ID, s.sessionId)
    const raw = JSON.stringify(view)
    rec('D_no_storage_key_leak', !raw.includes('storage_key') && !raw.includes(String(img.storage_key)))
  }

  // —— E 文字+图片 ——
  {
    const s = await createAppSession(train)
    const up = await images.upload(USER_ID, s.sessionId, s.itemId, {
      buffer: TINY_PNG,
      size: TINY_PNG.length,
      mimetype: 'image/png',
      originalname: 'b.png',
      fieldname: 'file',
    } as Express.Multer.File)
    await train.saveAnswer(USER_ID, s.sessionId, {
      sortOrder: s.sortOrder,
      userAnswerPayload: {
        kind: 'application',
        text: '【虚构E】文字加图',
        imageIds: [String(up.imageId)],
      },
    })
    await train.submit(USER_ID, s.sessionId)
    const row = (
      await ds.query(
        `SELECT grade_result FROM hs_math_train_session_items WHERE id=?`,
        [s.itemId],
      )
    )[0]
    rec('E_mixed_review_required', row.grade_result === 'review_required', row.grade_result)
  }

  // —— 历史会话 51/55/56 未改 ——
  {
    const hist = await ds.query(
      `SELECT id, status, correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id IN (51,55,56) ORDER BY id`,
    )
    rec('hist_sessions_intact', hist.length === 3, JSON.stringify(hist.map((h: { id: string }) => h.id)))
  }

  // —— 题库 approved 与旧 pending_ai 基线（旧 pending_ai 至少仍在；新测可能增加） ——
  {
    const after = (
      await ds.query(
        `SELECT
           (SELECT COUNT(*) FROM hs_math_train_items WHERE status='approved') AS approved,
           (SELECT COUNT(*) FROM hs_math_train_items) AS train_items,
           (SELECT COUNT(*) FROM hs_math_train_sessions WHERE id IN (51,55,56) AND status='completed') AS hist_ok`,
      )
    )[0]
    rec('approved_unchanged', Number(after.approved) === Number(b0.approved), `${b0.approved}->${after.approved}`)
    rec('hist_completed', Number(after.hist_ok) === 3)
  }

  // —— 旧四题型：抽含 single 的分类，在会话内定位 single 题作答 ——
  {
    const bucket = await ds.query(
      `SELECT specialty_id, category_id, difficulty,
              SUM(qtype='single') AS single_n,
              COUNT(*) AS total_n
       FROM hs_math_train_items
       WHERE status='approved' AND pool='formal' AND is_active=1
       GROUP BY specialty_id, category_id, difficulty
       HAVING single_n >= 1
       ORDER BY total_n ASC
       LIMIT 1`,
    )
    if (!bucket[0]) {
      rec('legacy_pick_single', false, 'no bucket with single')
      rec('legacy_single_correct', false, 'n/a')
      rec('legacy_accuracy_den', false, 'n/a')
    } else {
      const sp = String(bucket[0].specialty_id)
      const cat = String(bucket[0].category_id)
      const diff = Number(bucket[0].difficulty)
      // HS_MATH_COUNTS 仅允许 5/10/20
      const created = await train.createSession(USER_ID, {
        specialtyId: sp,
        categoryId: cat,
        difficulty: diff,
        count: 5,
        mode: 'sequential',
        poolMode: 'formal',
      })
      const it = created.items.find(
        (x: { qtype: string }) => x.qtype === 'single',
      ) as { sortOrder: number; qtype: string; id: string } | undefined
      rec('legacy_pick_single', !!it, it ? `sort=${it.sortOrder}` : 'none in session')
      if (!it) {
        rec('legacy_single_correct', false, 'no single in session')
        rec('legacy_accuracy_den', false, 'n/a')
      } else {
        // in_progress 视图不返回标准答案；从会话项快照读 optionId
        const snap = (
          await ds.query(
            `SELECT answer_payload_json FROM hs_math_train_session_items WHERE id=?`,
            [it.id],
          )
        )[0]
        const std =
          typeof snap.answer_payload_json === 'string'
            ? JSON.parse(snap.answer_payload_json)
            : snap.answer_payload_json
        const optionId = std?.optionId ? String(std.optionId) : ''
        if (!optionId) {
          rec('legacy_single_correct', false, 'no optionId in snapshot')
          rec('legacy_accuracy_den', false, 'n/a')
        } else {
          await train.saveAnswer(USER_ID, String(created.id), {
            sortOrder: it.sortOrder,
            userAnswerPayload: { kind: 'single', optionId },
          })
          await train.submit(USER_ID, String(created.id))
          const row = (
            await ds.query(
              `SELECT grade_result FROM hs_math_train_session_items WHERE id=?`,
              [it.id],
            )
          )[0]
          rec('legacy_single_correct', row.grade_result === 'correct', row.grade_result)
          const sess = (
            await ds.query(
              `SELECT correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id=?`,
              [created.id],
            )
          )[0]
          const acc = accuracyRatio(
            Number(sess.correct_count),
            Number(sess.wrong_count),
          )
          rec(
            'legacy_accuracy_den',
            Number(sess.correct_count) >= 1 &&
              acc !== null &&
              Number.isFinite(acc),
            JSON.stringify({ ...sess, accuracy: acc }),
          )
        }
      }
    }
  }

  const failed = checks.filter((c) => !c.ok)
  console.log(`\nAPPLICATION-3B mysql-it: ${checks.length - failed.length}/${checks.length} PASS`)
  await app.close()
  if (failed.length) {
    console.error('FAILED:', failed.map((f) => f.name).join(', '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
