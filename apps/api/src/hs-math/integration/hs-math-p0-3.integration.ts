/**
 * P0-3.5 高一数学训练引擎 MySQL 集成验收（写入仅允许独立 IT 库）。
 *
 * 前置：
 *   1) 已创建库并导入 schema：mysql ... < db/hs_math_it_schema.sql
 *   2) 环境变量：HS_MATH_IT_DB_NAME=study_system_hs_math_it
 *   3) 复用 apps/api/.env 的 DB_HOST/PORT/USER/PASSWORD（库名强制覆盖为 IT 库）
 *
 * 运行：
 *   pnpm --filter api run hs-math:it
 *
 * 安全：若目标库为 study_system 或未设 HS_MATH_IT_DB_NAME，立即中止。
 */
import { ConflictException, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { User } from '../../users/user.entity'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { HsMathTrainItem } from '../entities/hs-math-train-item.entity'
import { HsMathTrainSession } from '../entities/hs-math-train-session.entity'
import { HsMathTrainSessionItem } from '../entities/hs-math-train-session-item.entity'
import { HsMathTrainService } from '../train/hs-math-train.service'
import {
  assertSafeIntegrationDatabase,
  HS_MATH_IT_DB_NAME,
  loadApiEnv,
} from './hs-math-it.safety'

type Result = { name: string; ok: boolean; detail?: string }

const PREFIX = 'hsmath_it_'
const results: Result[] = []

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function record(name: string, fn: () => Promise<void> | void) {
  return (async () => {
    try {
      await fn()
      results.push({ name, ok: true })
      console.log(`  PASS  ${name}`)
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      results.push({ name, ok: false, detail })
      console.log(`  FAIL  ${name}: ${detail}`)
    }
  })()
}

function leakKeys(obj: unknown, path = ''): string[] {
  if (obj === null || obj === undefined) return []
  if (typeof obj !== 'object') return []
  const bad: string[] = []
  const banned = [
    'answerPayloadJson',
    'answer_payload_json',
    'analysis',
    'gradeResult',
    'grade_result',
    'gradeReason',
    'grade_reason',
  ]
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = path ? `${path}.${k}` : k
    if (banned.includes(k)) bad.push(p)
    if (v && typeof v === 'object') bad.push(...leakKeys(v, p))
  }
  return bad
}

async function cleanTagged(ds: DataSource) {
  // 仅删除本轮带前缀的测试数据（不 TRUNCATE）
  await ds.query(
    `DELETE si FROM hs_math_train_session_items si
     INNER JOIN hs_math_train_sessions s ON s.id = si.session_id
     INNER JOIN users u ON u.id = s.user_id
     WHERE u.email LIKE ?`,
    [`${PREFIX}%`],
  )
  await ds.query(
    `DELETE s FROM hs_math_train_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE u.email LIKE ?`,
    [`${PREFIX}%`],
  )
  await ds.query(`DELETE FROM hs_math_train_items WHERE code LIKE ?`, [
    `${PREFIX}%`,
  ])
  await ds.query(`DELETE FROM hs_math_categories WHERE code LIKE ?`, [
    `${PREFIX}%`,
  ])
  await ds.query(`DELETE FROM hs_math_specialties WHERE code LIKE ?`, [
    `${PREFIX}%`,
  ])
  await ds.query(`DELETE FROM users WHERE email LIKE ?`, [`${PREFIX}%`])
}

async function seedFixture(ds: DataSource) {
  const userRepo = ds.getRepository(User)
  const spRepo = ds.getRepository(HsMathSpecialty)
  const catRepo = ds.getRepository(HsMathCategory)
  const itemRepo = ds.getRepository(HsMathTrainItem)

  const userA = await userRepo.save(
    userRepo.create({
      email: `${PREFIX}a@example.com`,
      passwordHash: 'x',
      nickname: 'IT-A',
      grade: '高一',
      role: 'USER',
    }),
  )
  const userB = await userRepo.save(
    userRepo.create({
      email: `${PREFIX}b@example.com`,
      passwordHash: 'x',
      nickname: 'IT-B',
      grade: '高一',
      role: 'USER',
    }),
  )
  const admin = await userRepo.save(
    userRepo.create({
      email: `${PREFIX}admin@example.com`,
      passwordHash: 'x',
      nickname: 'IT-ADMIN',
      grade: '高一',
      role: 'ADMIN',
    }),
  )

  const sp = await spRepo.save(
    spRepo.create({
      code: `${PREFIX}sp`,
      name: 'IT专项',
      bookCode: '必修一',
      chapterNo: 1,
      intro: '',
      sortOrder: 1,
      isActive: true,
    }),
  )
  const cat = await catRepo.save(
    catRepo.create({
      specialtyId: sp.id,
      code: `${PREFIX}cat`,
      name: 'IT分类',
      sortOrder: 1,
      isActive: true,
    }),
  )

  const mk = async (
    code: string,
    qtype: HsMathTrainItem['qtype'],
    stem: string,
    optionsJson: HsMathTrainItem['optionsJson'],
    answerPayloadJson: HsMathTrainItem['answerPayloadJson'],
  ) =>
    itemRepo.save(
      itemRepo.create({
        code: `${PREFIX}${code}`,
        pool: 'formal',
        qtype,
        stem,
        optionsJson,
        answerPayloadJson,
        analysis: `解析-${code}-标准答案请保密`,
        difficulty: 1,
        specialtyId: sp.id,
        categoryId: cat.id,
        status: 'approved',
        isActive: true,
        gradeRuleVersion: 'v1',
        contentVersion: 1,
      }),
    )

  const single = await mk(
    'single',
    'single',
    '集合题 single',
    {
      options: [
        { id: 'A', text: '空集' },
        { id: 'B', text: '{1}' },
      ],
    },
    { kind: 'single', optionId: 'A' },
  )
  const multi = await mk(
    'multi',
    'multi',
    '多选 multi',
    {
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
      ],
    },
    { kind: 'multi', optionIds: ['A', 'C'] },
  )
  const judge = await mk('judge', 'judge', '判断 judge', null, {
    kind: 'judge',
    value: true,
  })
  const numeric = await mk('numeric', 'numeric', '数值 numeric', null, {
    kind: 'numeric',
    value: '1.5',
    toleranceAbs: 0.01,
    toleranceRel: 0,
  })
  // 凑满至少 5 道以便 count=5
  const filler = await mk(
    'single2',
    'single',
    '填充题',
    {
      options: [
        { id: 'A', text: 'x' },
        { id: 'B', text: 'y' },
      ],
    },
    { kind: 'single', optionId: 'B' },
  )

  return {
    userA,
    userB,
    admin,
    sp,
    cat,
    items: { single, multi, judge, numeric, filler },
  }
}

function buildService(ds: DataSource) {
  return new HsMathTrainService(
    ds,
    ds.getRepository(HsMathTrainSession),
    ds.getRepository(HsMathTrainSessionItem),
    ds.getRepository(HsMathTrainItem),
    ds.getRepository(HsMathSpecialty),
    ds.getRepository(HsMathCategory),
  )
}

async function main() {
  const env = loadApiEnv()
  const itDb = assertSafeIntegrationDatabase(
    process.env.HS_MATH_IT_DB_NAME || env.HS_MATH_IT_DB_NAME,
  )
  console.log(`[HS_MATH_IT] target=${itDb} host=${env.DB_HOST}:${env.DB_PORT}`)

  const ds = new DataSource({
    type: 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    username: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: itDb,
    entities: [
      User,
      HsMathSpecialty,
      HsMathCategory,
      HsMathTrainItem,
      HsMathTrainSession,
      HsMathTrainSessionItem,
    ],
    synchronize: false,
  })

  await ds.initialize()
  assert(ds.options.database === HS_MATH_IT_DB_NAME, 'DataSource database mismatch')

  // schema smoke
  await record('schema tables exist', async () => {
    const tables: Array<{ name: string }> = await ds.query(
      `SELECT table_name AS name FROM information_schema.tables
       WHERE table_schema = ? AND table_name LIKE 'hs_math_%'`,
      [itDb],
    )
    const names = new Set(tables.map((t) => t.name))
    for (const t of [
      'hs_math_specialties',
      'hs_math_categories',
      'hs_math_train_items',
      'hs_math_train_sessions',
      'hs_math_train_session_items',
    ]) {
      assert(names.has(t), `missing table ${t}`)
    }
  })

  await cleanTagged(ds)
  const fx = await seedFixture(ds)
  const service = buildService(ds)

  let sessionId = ''
  let submittedAt: Date | string | null = null

  await record('main flow create→answer→overwrite→submit', async () => {
    const created = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
      poolMode: 'formal',
    })
    sessionId = created.id
    assert(created.status === 'in_progress', 'status')
    assert(created.actualCount === 5, 'actualCount')
    assert(created.shortfall === 0, 'shortfall')
    assert(created.items.length === 5, 'items len')
    assert(
      created.items.every((it, i) => it.sortOrder === i + 1),
      'sort_order',
    )
    const leaks = leakKeys(created)
    assert(leaks.length === 0, `leak on create: ${leaks.join(',')}`)
    assert(created.correctCount === null, 'no counts in progress')

    // DB 快照含标准答案
    const rawItems: Array<{ answer_payload_json: unknown }> = await ds.query(
      `SELECT answer_payload_json FROM hs_math_train_session_items WHERE session_id=?`,
      [sessionId],
    )
    assert(rawItems.length === 5, 'snapshot rows')
    assert(
      rawItems.every((r) => r.answer_payload_json != null),
      'snapshot answers present',
    )

    // 覆盖作答：先错再改对；numeric 故意留空 → pending
    const singles = created.items.filter((i) => i.qtype === 'single')
    assert(singles.length >= 1, 'need single')
    await service.saveAnswer(fx.userA.id, sessionId, {
      sortOrder: singles[0].sortOrder,
      userAnswerPayload: { kind: 'single', optionId: 'B' },
    })
    await service.saveAnswer(fx.userA.id, sessionId, {
      sortOrder: singles[0].sortOrder,
      userAnswerPayload: { kind: 'single', optionId: 'A' },
    })
    for (const it of created.items) {
      if (it.qtype === 'numeric') continue
      if (it.sortOrder === singles[0].sortOrder) continue
      if (it.qtype === 'single') {
        await service.saveAnswer(fx.userA.id, sessionId, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'single', optionId: 'B' },
        })
      } else if (it.qtype === 'multi') {
        await service.saveAnswer(fx.userA.id, sessionId, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'multi', optionIds: ['C', 'A'] },
        })
      } else if (it.qtype === 'judge') {
        await service.saveAnswer(fx.userA.id, sessionId, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'judge', value: true },
        })
      }
    }

    const mid = await service.getSession(fx.userA.id, sessionId)
    assert(leakKeys(mid).length === 0, `leak mid: ${leakKeys(mid)}`)

    const submitted = await service.submit(fx.userA.id, sessionId)
    assert(submitted.status === 'completed', 'completed')
    assert(submitted.submitMeta.idempotent === false, 'first submit')
    assert(submitted.correctCount === 4, `correct=${submitted.correctCount}`)
    assert(submitted.wrongCount === 0, `wrong=${submitted.wrongCount}`)
    assert(submitted.pendingCount === 1, `pending=${submitted.pendingCount}`)
    assert(submitted.accuracyPercent === 100, 'accuracy ignores pending')
    assert(submitted.submittedAt != null, 'submittedAt')
    assert(typeof submitted.durationMs === 'number', 'durationMs')
    submittedAt = submitted.submittedAt
    assert(
      submitted.items.every((i) => 'answerPayloadJson' in i && 'gradeResult' in i),
      'reveal on completed',
    )
  })

  await record('completed cannot PATCH', async () => {
    try {
      await service.saveAnswer(fx.userA.id, sessionId, {
        sortOrder: 1,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      })
      throw new Error('expected conflict')
    } catch (e) {
      assert(e instanceof ConflictException, 'ConflictException')
    }
  })

  await record('idempotent resubmit preserves submittedAt', async () => {
    const again = await service.submit(fx.userA.id, sessionId)
    assert(again.submitMeta.idempotent === true, 'idempotent')
    assert(String(again.submittedAt) === String(submittedAt), 'submittedAt stable')
  })

  // —— 用户隔离 ——
  await record('user isolation get/save/submit/cancel', async () => {
    const s = await service.createSession(fx.userB.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    try {
      await service.getSession(fx.userA.id, s.id)
      throw new Error('A should not get B')
    } catch (e) {
      assert(e instanceof NotFoundException, 'get 404')
    }
    try {
      await service.saveAnswer(fx.userA.id, s.id, {
        sortOrder: 1,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      })
      throw new Error('A should not save B')
    } catch (e) {
      assert(e instanceof NotFoundException, 'save 404')
    }
    try {
      await service.submit(fx.userA.id, s.id)
      throw new Error('A should not submit B')
    } catch (e) {
      assert(e instanceof NotFoundException, 'submit 404')
    }
    try {
      await service.cancel(fx.userA.id, s.id)
      throw new Error('A should not cancel B')
    } catch (e) {
      assert(e instanceof NotFoundException, 'cancel 404')
    }
    // ADMIN 角色也不绕过 user_id（Service 无角色旁路）
    try {
      await service.getSession(fx.admin.id, s.id)
      throw new Error('admin should not get B session via train service')
    } catch (e) {
      assert(e instanceof NotFoundException, 'admin isolation')
    }
    await service.cancel(fx.userB.id, s.id)
  })

  // —— 快照稳定性 ——
  await record('snapshot stable after item edit/disable', async () => {
    const created = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    const sid = created.id
    const first = created.items[0]
    const snapBefore: Array<{
      stem: string
      answer_payload_json: string
    }> = await ds.query(
      `SELECT stem, CAST(answer_payload_json AS CHAR) AS answer_payload_json
       FROM hs_math_train_session_items WHERE session_id=? AND sort_order=?`,
      [sid, first.sortOrder],
    )

    await ds.query(
      `UPDATE hs_math_train_items SET stem=?, answer_payload_json=?, status='disabled', is_active=0, content_version=content_version+1 WHERE id=?`,
      [
        '已被篡改的题干',
        JSON.stringify({ kind: 'single', optionId: 'B' }),
        first.itemId,
      ],
    )

    await service.saveAnswer(fx.userA.id, sid, {
      sortOrder: first.sortOrder,
      userAnswerPayload: first.qtype === 'single'
        ? { kind: 'single', optionId: (JSON.parse(snapBefore[0].answer_payload_json) as { optionId: string }).optionId }
        : first.userAnswerPayloadJson,
    })
    // 答对其余题简化：直接 submit 读快照
    const done = await service.submit(fx.userA.id, sid)
    assert(done.status === 'completed', 'submit ok')
    const snapAfter: Array<{ stem: string; answer_payload_json: string }> =
      await ds.query(
        `SELECT stem, CAST(answer_payload_json AS CHAR) AS answer_payload_json
         FROM hs_math_train_session_items WHERE session_id=? AND sort_order=?`,
        [sid, first.sortOrder],
      )
    assert(snapAfter[0].stem === snapBefore[0].stem, 'stem unchanged')
    assert(
      snapAfter[0].answer_payload_json === snapBefore[0].answer_payload_json,
      'answer snapshot unchanged',
    )
    const viewItem = done.items.find((i) => i.sortOrder === first.sortOrder)!
    assert(viewItem.stem !== '已被篡改的题干', 'view uses snapshot stem')
  })

  // —— 边界 ——
  await record('boundary: no approved / mismatch / cancel then submit', async () => {
    const inactiveSp = await ds.getRepository(HsMathSpecialty).save(
      ds.getRepository(HsMathSpecialty).create({
        code: `${PREFIX}inactive`,
        name: '停用',
        intro: '',
        sortOrder: 99,
        isActive: false,
      }),
    )
    try {
      await service.createSession(fx.userA.id, {
        specialtyId: inactiveSp.id,
        categoryId: fx.cat.id,
        difficulty: 1,
        count: 5,
        mode: 'sequential',
      })
      throw new Error('expected fail inactive specialty')
    } catch (e) {
      assert(e instanceof NotFoundException || (e as Error).message.includes('专项'), 'inactive sp')
    }

    try {
      await service.createSession(fx.userA.id, {
        specialtyId: '999999999',
        categoryId: fx.cat.id,
        difficulty: 1,
        count: 5,
        mode: 'sequential',
      })
      throw new Error('expected missing specialty')
    } catch (e) {
      assert(e instanceof NotFoundException, 'missing sp')
    }

    const s = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    await service.cancel(fx.userA.id, s.id)
    const again = await service.cancel(fx.userA.id, s.id)
    assert(again.status === 'cancelled', 'repeat cancel')
    try {
      await service.submit(fx.userA.id, s.id)
      throw new Error('cancelled submit should fail')
    } catch (e) {
      assert(e instanceof ConflictException, 'cancel blocks submit')
    }
  })

  // —— 并发 ——
  await record('concurrent A: double submit', async () => {
    const s = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    for (const it of s.items) {
      if (it.qtype === 'single') {
        await service.saveAnswer(fx.userA.id, s.id, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'single', optionId: 'A' },
        })
      } else if (it.qtype === 'multi') {
        await service.saveAnswer(fx.userA.id, s.id, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'multi', optionIds: ['A', 'C'] },
        })
      } else if (it.qtype === 'judge') {
        await service.saveAnswer(fx.userA.id, s.id, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'judge', value: true },
        })
      } else if (it.qtype === 'numeric') {
        await service.saveAnswer(fx.userA.id, s.id, {
          sortOrder: it.sortOrder,
          userAnswerPayload: { kind: 'numeric', input: '1.5' },
        })
      }
    }

    const svc1 = buildService(ds)
    const svc2 = buildService(ds)
    const [r1, r2] = await Promise.all([
      svc1.submit(fx.userA.id, s.id),
      svc2.submit(fx.userA.id, s.id),
    ])
    assert(r1.status === 'completed' && r2.status === 'completed', 'both completed view')
    const idemCount = [r1, r2].filter((r) => r.submitMeta.idempotent).length
    assert(idemCount === 1, `exactly one idempotent, got ${idemCount}`)
    const rows: Array<{ c: number }> = await ds.query(
      `SELECT COUNT(*) AS c FROM hs_math_train_sessions WHERE id=? AND status='completed'`,
      [s.id],
    )
    assert(Number(rows[0].c) === 1, 'single completed row')
  })

  await record('concurrent B: patch vs submit', async () => {
    const s = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    const target = s.items.find((i) => i.qtype === 'single')!
    const svcPatch = buildService(ds)
    const svcSubmit = buildService(ds)

    const outcomes = await Promise.allSettled([
      svcPatch.saveAnswer(fx.userA.id, s.id, {
        sortOrder: target.sortOrder,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      }),
      svcSubmit.submit(fx.userA.id, s.id),
    ])

    const sessionRows: Array<{ status: string }> = await ds.query(
      `SELECT status FROM hs_math_train_sessions WHERE id=?`,
      [s.id],
    )
    const status = sessionRows[0].status
    assert(
      status === 'completed' || status === 'in_progress',
      `unexpected status ${status}`,
    )

    if (status === 'completed') {
      // PATCH 若后到必须 Conflict；若先到则答案已纳入判题
      const patchResult = outcomes[0]
      if (patchResult.status === 'rejected') {
        assert(
          patchResult.reason instanceof ConflictException,
          'late patch conflict',
        )
      }
      const items: Array<{ user_answer_payload_json: unknown; grade_result: string }> =
        await ds.query(
          `SELECT user_answer_payload_json, grade_result FROM hs_math_train_session_items
           WHERE session_id=? AND sort_order=?`,
          [s.id, target.sortOrder],
        )
      // completed 后答案不得再被改：再 PATCH 必须失败
      try {
        await service.saveAnswer(fx.userA.id, s.id, {
          sortOrder: target.sortOrder,
          userAnswerPayload: { kind: 'single', optionId: 'B' },
        })
        throw new Error('post-complete patch should fail')
      } catch (e) {
        assert(e instanceof ConflictException, 'post complete conflict')
      }
      assert(items[0].grade_result != null, 'graded')
    }
  })

  await record('concurrent C: cancel vs submit', async () => {
    const s = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    const outcomes = await Promise.allSettled([
      buildService(ds).cancel(fx.userA.id, s.id),
      buildService(ds).submit(fx.userA.id, s.id),
    ])
    const row: Array<{ status: string }> = await ds.query(
      `SELECT status FROM hs_math_train_sessions WHERE id=?`,
      [s.id],
    )
    const st = row[0].status
    assert(st === 'cancelled' || st === 'completed', `final ${st}`)
    const okCount = outcomes.filter((o) => o.status === 'fulfilled').length
    assert(okCount >= 1, 'at least one success')
    // 另一侧若失败，应为 Conflict
    for (const o of outcomes) {
      if (o.status === 'rejected') {
        assert(
          o.reason instanceof ConflictException,
          `expected Conflict got ${o.reason}`,
        )
      }
    }
  })

  await record('concurrent D: double patch same item', async () => {
    const s = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    const target = s.items.find((i) => i.qtype === 'single')!
    await Promise.all([
      buildService(ds).saveAnswer(fx.userA.id, s.id, {
        sortOrder: target.sortOrder,
        userAnswerPayload: { kind: 'single', optionId: 'A' },
      }),
      buildService(ds).saveAnswer(fx.userA.id, s.id, {
        sortOrder: target.sortOrder,
        userAnswerPayload: { kind: 'single', optionId: 'B' },
      }),
    ])
    const cnt: Array<{ c: number }> = await ds.query(
      `SELECT COUNT(*) AS c FROM hs_math_train_session_items WHERE session_id=? AND sort_order=?`,
      [s.id, target.sortOrder],
    )
    assert(Number(cnt[0].c) === 1, 'no duplicate session_item')
    const ans: Array<{ user_answer_payload_json: { optionId?: string } }> =
      await ds.query(
        `SELECT user_answer_payload_json FROM hs_math_train_session_items
         WHERE session_id=? AND sort_order=?`,
        [s.id, target.sortOrder],
      )
    const oid = ans[0].user_answer_payload_json?.optionId
    assert(oid === 'A' || oid === 'B', `final answer ${oid}`)
  })

  await record('shortfall when count > available', async () => {
    // 仅保留 2 道 approved（其余先 disabled）——仅操作带前缀题
    await ds.query(
      `UPDATE hs_math_train_items SET status='disabled', is_active=0
       WHERE code LIKE ? AND code NOT IN (?, ?)`,
      [`${PREFIX}%`, `${PREFIX}single`, `${PREFIX}judge`],
    )
    // 恢复 single/judge
    await ds.query(
      `UPDATE hs_math_train_items SET status='approved', is_active=1 WHERE code IN (?, ?)`,
      [`${PREFIX}single`, `${PREFIX}judge`],
    )
    const created = await service.createSession(fx.userA.id, {
      specialtyId: fx.sp.id,
      categoryId: fx.cat.id,
      difficulty: 1,
      count: 5,
      mode: 'sequential',
    })
    assert(created.actualCount === 2, `actual=${created.actualCount}`)
    assert(created.shortfall === 3, `shortfall=${created.shortfall}`)
  })

  await cleanTagged(ds)
  await ds.destroy()

  const failed = results.filter((r) => !r.ok)
  console.log('\n========== HS_MATH P0-3.5 IT SUMMARY ==========')
  console.log(`database: ${itDb}`)
  console.log(`passed: ${results.length - failed.length}/${results.length}`)
  if (failed.length) {
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`)
    process.exitCode = 1
  } else {
    console.log('ALL_IT_PASS')
  }
}

main().catch((e) => {
  console.error('[HS_MATH_IT] aborted:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
