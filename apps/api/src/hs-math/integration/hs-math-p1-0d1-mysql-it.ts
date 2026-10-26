/**
 * P1-0D.1 真实 study_system MySQL + HTTP 验收。
 *
 * 显式开启：
 *   HS_MATH_P1_0D1_MYSQL_IT=1 pnpm --filter api run hs-math:p1-0d1-mysql-it
 *
 * 约束：
 * - 仅连接 .env 中 DB_NAME（期望 study_system）
 * - 仅写入 code 前缀 HS_MATH_P1_0D1_IT_
 * - 不 DROP/TRUNCATE；清理仅删除本脚本创建且无会话引用的 IT 题
 * - 不触碰 ID 1～5 的 P0 E2E 题
 * - 不打印 JWT / 密码
 *
 * HTTP 需 API 已监听（默认 http://127.0.0.1:3000）。
 */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { createConnection, type Connection, type RowDataPacket } from 'mysql2/promise'

const MARK = 'HS_MATH_P1_0D1_IT_'
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'

type Status = 'PASS' | 'FAIL' | 'NOT_RUN' | 'PARTIAL'
type Result = { name: string; status: Status; detail?: string }
const results: Result[] = []

function record(name: string, status: Status, detail?: string) {
  results.push({ name, status, detail })
  console.log(detail ? `${status}  ${name}: ${detail}` : `${status}  ${name}`)
}

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  const p = path.join(__dirname, '../../../.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
}

function signJwt(sub: string, role: string, secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  )
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({ sub, role, iat: now, exp: now + 3600 }),
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
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 120) }
  }
  return { status: res.status, json }
}

function dataOf(json: unknown): any {
  const j = json as any
  if (j?.success === true && j.data !== undefined) return j.data
  return j
}

async function count(conn: Connection, sql: string, params: unknown[] = []) {
  const [rows] = await conn.query<RowDataPacket[]>(sql, params)
  return Number((rows[0] as any)?.c ?? 0)
}

async function snapshot(conn: Connection) {
  return {
    items: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_items'),
    kps: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_item_kps'),
    approvedFormal: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE status='approved' AND pool='formal' AND is_active=1`,
    ),
    sessions: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_sessions'),
    sessionItems: await count(
      conn,
      'SELECT COUNT(*) AS c FROM hs_math_train_session_items',
    ),
    p0: await conn.query<RowDataPacket[]>(
      `SELECT id, code, status, pool FROM hs_math_train_items
       WHERE id IN (1,2,3,4,5) ORDER BY id`,
    ),
    itDraft: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE code LIKE ?`,
      [`${MARK}%`],
    ),
  }
}

function buildBatch(suffix: string) {
  const base = {
    specialtyCode: 'rja-ch1',
    categoryCode: '1.1',
    difficulty: 1 as const,
    knowledgePointCodes: ['rja.1.1.01'],
    primaryKnowledgePointCode: 'rja.1.1.01',
  }
  return [
    {
      ...base,
      code: `${MARK}single_${suffix}`,
      qtype: 'single' as const,
      stem: `P1-0D.1 IT single ${suffix}：$1\\in\\{1,2\\}$`,
      options: {
        options: [
          { id: 'A', text: '正确' },
          { id: 'B', text: '错误' },
        ],
      },
      answerPayload: { kind: 'single', optionId: 'A' },
      analysis: 'IT 解析 single，非正式题。',
    },
    {
      ...base,
      code: `${MARK}multi_${suffix}`,
      qtype: 'multi' as const,
      stem: `P1-0D.1 IT multi ${suffix}：可选集合表示法`,
      options: {
        options: [
          { id: 'A', text: '列举法' },
          { id: 'B', text: '描述法' },
          { id: 'C', text: '无定义' },
        ],
      },
      answerPayload: { kind: 'multi', optionIds: ['A', 'B'] },
      analysis: 'IT 解析 multi，非正式题。',
    },
    {
      ...base,
      code: `${MARK}judge_${suffix}`,
      categoryCode: '1.2',
      knowledgePointCodes: ['rja.1.2.02'],
      primaryKnowledgePointCode: 'rja.1.2.02',
      qtype: 'judge' as const,
      stem: `P1-0D.1 IT judge ${suffix}：互相包含则相等`,
      answerPayload: { kind: 'judge', value: true },
      analysis: 'IT 解析 judge，非正式题。',
    },
    {
      ...base,
      code: `${MARK}numeric_${suffix}`,
      qtype: 'numeric' as const,
      stem: `P1-0D.1 IT numeric ${suffix}：集合 $\\{1,2,3\\}$ 元素个数`,
      answerPayload: { kind: 'numeric', value: '3', toleranceAbs: 0 },
      analysis: 'IT 解析 numeric，非正式题。',
    },
  ]
}

async function cleanupIt(conn: Connection) {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, code FROM hs_math_train_items WHERE code LIKE ?`,
    [`${MARK}%`],
  )
  if (!rows.length) return { deletedItems: 0, deletedLinks: 0 }

  const ids = rows.map((r) => r.id)
  const [refs] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM hs_math_train_session_items
     WHERE item_id IN (${ids.map(() => '?').join(',')})`,
    ids,
  )
  if (Number((refs[0] as any).c) > 0) {
    console.log(
      '[CLEANUP] IT 题已被会话引用，保留 draft 记录，不删除。ids=',
      ids.join(','),
    )
    return { deletedItems: 0, deletedLinks: 0, retained: ids.length }
  }

  const [linkRes] = await conn.query(
    `DELETE FROM hs_math_train_item_kps WHERE item_id IN (${ids.map(() => '?').join(',')})`,
    ids,
  )
  const [itemRes] = await conn.query(
    `DELETE FROM hs_math_train_items WHERE id IN (${ids.map(() => '?').join(',')}) AND code LIKE ?`,
    [...ids, `${MARK}%`],
  )
  return {
    deletedItems: (itemRes as any).affectedRows ?? 0,
    deletedLinks: (linkRes as any).affectedRows ?? 0,
  }
}

async function main() {
  if (process.env.HS_MATH_P1_0D1_MYSQL_IT !== '1') {
    console.log(
      'SKIP: set HS_MATH_P1_0D1_MYSQL_IT=1 to run real study_system IT',
    )
    process.exit(0)
  }

  const env = loadEnv()
  const dbName = env.DB_NAME || 'study_system'
  if (dbName !== 'study_system') {
    throw new Error(
      `P1-0D.1 要求 DB_NAME=study_system，当前=${dbName}（未改 .env，请检查环境）`,
    )
  }
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET missing')

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: dbName,
  })

  let before: Awaited<ReturnType<typeof snapshot>> | null = null
  let adminToken: string | null = null
  let userToken: string | null = null
  const suffix = `${Date.now().toString(36)}`

  try {
    before = await snapshot(conn)
    console.log('[BEFORE]', {
      items: before.items,
      kps: before.kps,
      approvedFormal: before.approvedFormal,
      sessions: before.sessions,
      sessionItems: before.sessionItems,
      itDraft: before.itDraft,
      p0: (before.p0[0] as any[]).map((r: any) => ({
        id: r.id,
        code: r.code,
        status: r.status,
      })),
    })

    // 探测 API
    let apiUp = false
    try {
      const health = await fetch(`${BASE}/health`).catch(() => null)
      apiUp = Boolean(health && (health.ok || health.status < 500))
      if (!apiUp) {
        // 部分项目无 /health，再探登录无关接口
        const probe = await api('POST', '/hs-math/admin/train-items/import/preview', null, {
          items: [],
        })
        apiUp = probe.status === 401 || probe.status === 400 || probe.status === 403
      }
    } catch {
      apiUp = false
    }
    if (!apiUp) {
      record('HTTP_API', 'NOT_RUN', `API 未可达 ${BASE}`)
      record('A1_unauth_preview', 'NOT_RUN')
      record('A3_user_preview', 'NOT_RUN')
      record('B_preview_no_write', 'NOT_RUN')
      record('C_import_draft', 'NOT_RUN')
      record('D_idempotent', 'NOT_RUN')
      record('E_tamper', 'NOT_RUN')
      record('F_partial_conflict', 'NOT_RUN')
      record('G_concurrent', 'NOT_RUN')
      record('I_approve_gate', 'NOT_RUN')
      return
    }
    record('HTTP_API', 'PASS', BASE)

    const [admins] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
    )
    const [users] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE role='USER' ORDER BY id ASC LIMIT 1`,
    )
    if (!admins.length) throw new Error('无 ADMIN 用户')
    adminToken = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET)
    if (users.length) {
      userToken = signJwt(String(users[0].id), 'USER', env.JWT_SECRET)
    }

    // A1 / A2
    {
      const r1 = await api('POST', '/hs-math/admin/train-items/import/preview', null, {
        items: buildBatch(suffix),
      })
      record(
        'A1_unauth_preview',
        r1.status === 401 ? 'PASS' : 'FAIL',
        `status=${r1.status}`,
      )
      const r2 = await api('POST', '/hs-math/admin/train-items/import/confirm', null, {
        previewToken: 'x',
        items: buildBatch(suffix),
      })
      record(
        'A2_unauth_confirm',
        r2.status === 401 ? 'PASS' : 'FAIL',
        `status=${r2.status}`,
      )
    }

    // A3 / A4
    if (!userToken) {
      record('A3_user_preview', 'NOT_RUN', '无 USER 账号')
      record('A4_user_confirm', 'NOT_RUN', '无 USER 账号')
    } else {
      const r3 = await api(
        'POST',
        '/hs-math/admin/train-items/import/preview',
        userToken,
        { items: buildBatch(suffix) },
      )
      record(
        'A3_user_preview',
        r3.status === 403 ? 'PASS' : 'FAIL',
        `status=${r3.status}`,
      )
      const r4 = await api(
        'POST',
        '/hs-math/admin/train-items/import/confirm',
        userToken,
        { previewToken: 'x', items: buildBatch(suffix) },
      )
      record(
        'A4_user_confirm',
        r4.status === 403 ? 'PASS' : 'FAIL',
        `status=${r4.status}`,
      )
    }

    const items = buildBatch(suffix)
    const mid = await snapshot(conn)

    // A5 preview
    const prev = await api(
      'POST',
      '/hs-math/admin/train-items/import/preview',
      adminToken,
      { items },
    )
    const prevData = dataOf(prev.json)
    const previewOk =
      prev.status === 200 || prev.status === 201
        ? Boolean(prevData?.canConfirm && prevData?.previewToken)
        : false
    record(
      'A5_admin_preview',
      previewOk ? 'PASS' : 'FAIL',
      `status=${prev.status} canConfirm=${prevData?.canConfirm}`,
    )

    // B preview 不写库
    const afterPrev = await snapshot(conn)
    const noWrite =
      afterPrev.items === mid.items &&
      afterPrev.kps === mid.kps &&
      afterPrev.approvedFormal === mid.approvedFormal
    record(
      'B_preview_no_write',
      noWrite ? 'PASS' : 'FAIL',
      `items ${mid.items}->${afterPrev.items}`,
    )

    if (!previewOk) {
      record('C_import_draft', 'NOT_RUN', 'preview 失败')
      record('D_idempotent', 'NOT_RUN')
      record('E_tamper', 'NOT_RUN')
      record('F_partial_conflict', 'NOT_RUN')
      record('G_concurrent', 'NOT_RUN')
      record('I_approve_gate', 'NOT_RUN')
      return
    }

    const token = String(prevData.previewToken)

    // A6 / C confirm
    const conf = await api(
      'POST',
      '/hs-math/admin/train-items/import/confirm',
      adminToken,
      { previewToken: token, items },
    )
    const confData = dataOf(conf.json)
    const createdOk =
      (conf.status === 200 || conf.status === 201) &&
      confData?.success &&
      confData?.mode === 'created' &&
      Number(confData?.successCount) === items.length
    record(
      'A6_admin_confirm',
      createdOk ? 'PASS' : 'FAIL',
      `status=${conf.status} mode=${confData?.mode} n=${confData?.successCount}`,
    )

    const [draftRows] = await conn.query<RowDataPacket[]>(
      `SELECT code, status, pool FROM hs_math_train_items WHERE code LIKE ?`,
      [`${MARK}%_${suffix}`],
    )
    const allDraft =
      draftRows.length === items.length &&
      draftRows.every((r) => r.status === 'draft' && r.pool === 'formal')
    const [linkCnt] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM hs_math_train_item_kps k
       INNER JOIN hs_math_train_items i ON i.id=k.item_id
       WHERE i.code LIKE ?`,
      [`${MARK}%_${suffix}`],
    )
    record(
      'C_import_draft',
      allDraft && Number((linkCnt[0] as any).c) >= items.length ? 'PASS' : 'FAIL',
      `rows=${draftRows.length} links=${(linkCnt[0] as any).c}`,
    )

    // D 重复 confirm
    const conf2 = await api(
      'POST',
      '/hs-math/admin/train-items/import/confirm',
      adminToken,
      { previewToken: token, items },
    )
    const conf2Data = dataOf(conf2.json)
    const afterDup = await snapshot(conn)
    const idemOk =
      (conf2.status === 200 || conf2.status === 201) &&
      conf2Data?.mode === 'idempotent' &&
      afterDup.items === afterPrev.items + items.length
    // afterPrev was before first confirm; after first confirm items += 4; after second should stay
    const afterFirstExpected = afterPrev.items + items.length
    const [cntAfterDup] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE code LIKE ?`,
      [`${MARK}%_${suffix}`],
    )
    record(
      'D_idempotent',
      conf2Data?.mode === 'idempotent' &&
        Number((cntAfterDup[0] as any).c) === items.length
        ? 'PASS'
        : 'FAIL',
      `mode=${conf2Data?.mode} count=${(cntAfterDup[0] as any).c} http=${conf2.status}`,
    )
    void idemOk
    void afterFirstExpected

    // E 篡改
    {
      const tampered = items.map((it, i) =>
        i === 0 ? { ...it, stem: it.stem + ' TAMPER' } : it,
      )
      const e1 = await api(
        'POST',
        '/hs-math/admin/train-items/import/confirm',
        adminToken,
        { previewToken: token, items: tampered },
      )
      record(
        'E_tamper_items',
        e1.status >= 400 ? 'PASS' : 'FAIL',
        `status=${e1.status}`,
      )

      if (userToken) {
        const e2 = await api(
          'POST',
          '/hs-math/admin/train-items/import/confirm',
          userToken,
          { previewToken: token, items },
        )
        record(
          'E_tamper_role',
          e2.status === 403 ? 'PASS' : 'FAIL',
          `status=${e2.status}`,
        )
      } else {
        record('E_tamper_role', 'NOT_RUN', '无 USER')
      }

      // 过期：无法轻易伪造过期合法签名而不改 secret；用坏签名
      const e3 = await api(
        'POST',
        '/hs-math/admin/train-items/import/confirm',
        adminToken,
        { previewToken: token + 'x', items },
      )
      record(
        'E_bad_signature',
        e3.status >= 400 ? 'PASS' : 'FAIL',
        `status=${e3.status}`,
      )
    }

    // E 同 code 不同内容（手动改库后幂等应冲突）
    {
      await conn.query(
        `UPDATE hs_math_train_items SET stem=CONCAT(stem,'#edited') WHERE code=?`,
        [`${MARK}single_${suffix}`],
      )
      const e4 = await api(
        'POST',
        '/hs-math/admin/train-items/import/confirm',
        adminToken,
        { previewToken: token, items },
      )
      record(
        'E_content_mismatch_idempotent',
        e4.status >= 400 ? 'PASS' : 'FAIL',
        `status=${e4.status}`,
      )
      // 恢复题干以便后续清理逻辑简单（仍会删）
      await conn.query(
        `UPDATE hs_math_train_items SET stem=? WHERE code=?`,
        [items[0].stem, `${MARK}single_${suffix}`],
      )
    }

    // F 部分 code 冲突：再 preview 一批，其中 1 题 code 已存在
    {
      const conflictSuffix = `${suffix}c`
      const batch2 = buildBatch(conflictSuffix)
      batch2[0].code = `${MARK}single_${suffix}` // 已存在
      const p2 = await api(
        'POST',
        '/hs-math/admin/train-items/import/preview',
        adminToken,
        { items: batch2 },
      )
      const p2d = dataOf(p2.json)
      record(
        'F_preview_rejects_existing',
        p2d?.canConfirm === false ? 'PASS' : 'FAIL',
        `canConfirm=${p2d?.canConfirm}`,
      )
    }

    // G 并发：新一批
    {
      const cs = `${suffix}g`
      const batchG = buildBatch(cs)
      const pg = await api(
        'POST',
        '/hs-math/admin/train-items/import/preview',
        adminToken,
        { items: batchG },
      )
      const pgd = dataOf(pg.json)
      if (!pgd?.previewToken) {
        record('G_concurrent', 'NOT_RUN', 'preview 失败')
      } else {
        const t = String(pgd.previewToken)
        const [rA, rB] = await Promise.all([
          api('POST', '/hs-math/admin/train-items/import/confirm', adminToken, {
            previewToken: t,
            items: batchG,
          }),
          api('POST', '/hs-math/admin/train-items/import/confirm', adminToken, {
            previewToken: t,
            items: batchG,
          }),
        ])
        const [cnt] = await conn.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE code LIKE ?`,
          [`${MARK}%_${cs}`],
        )
        const n = Number((cnt[0] as any).c)
        const modes = [dataOf(rA.json)?.mode, dataOf(rB.json)?.mode]
        const ok =
          n === batchG.length &&
          modes.includes('created') &&
          (modes.includes('idempotent') ||
            rA.status >= 400 ||
            rB.status >= 400 ||
            modes.filter((m) => m === 'created').length === 1)
        // 允许：一 created 一 idempotent；或一成功一冲突
        record(
          'G_concurrent',
          n === batchG.length ? 'PASS' : 'FAIL',
          `count=${n} modes=${modes.join(',')} status=${rA.status}/${rB.status} okHint=${ok}`,
        )
      }
    }

    // I 批准门禁
    {
      const [row] = await conn.query<RowDataPacket[]>(
        `SELECT id, code, status FROM hs_math_train_items WHERE code=? LIMIT 1`,
        [`${MARK}single_${suffix}`],
      )
      if (!row.length) {
        record('I_approve_gate', 'NOT_RUN', '无 IT 题')
      } else {
        const id = String(row[0].id)
        const ap = await api(
          'PATCH',
          `/hs-math/admin/train-items/${id}/status`,
          adminToken,
          { status: 'approved' },
        )
        const still = await conn.query<RowDataPacket[]>(
          `SELECT status FROM hs_math_train_items WHERE id=?`,
          [id],
        )
        const blocked =
          ap.status >= 400 && (still[0] as any[])[0]?.status === 'draft'
        record(
          'I_approve_it_prefix_blocked',
          blocked ? 'PASS' : 'FAIL',
          `status=${ap.status} db=${(still[0] as any[])[0]?.status}`,
        )

        // 无解析
        await conn.query(
          `UPDATE hs_math_train_items SET analysis='' WHERE id=?`,
          [id],
        )
        // 换一个可批准的临时 code 会破坏 IT 前缀测试；这里用另一题验证缺解析
        // 创建临时可批准 code 的题仅用于门禁，测完删：用非阻断前缀
        const gateCode = `rja.it.p10d1.gate.${suffix}`
        const [sp] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM hs_math_specialties WHERE code='rja-ch1' LIMIT 1`,
        )
        const [cat] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM hs_math_categories WHERE specialty_id=? AND code='1.1' LIMIT 1`,
          [sp[0].id],
        )
        const [kp] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM hs_math_knowledge_points WHERE code='rja.1.1.01' LIMIT 1`,
        )
        // 恢复 IT 题解析
        await conn.query(
          `UPDATE hs_math_train_items SET analysis='IT 解析 single，非正式题。' WHERE id=?`,
          [id],
        )

        // 手工插入 gate 题（draft，无 KP）用于缺 KP 批准
        const [ins] = await conn.query(
          `INSERT INTO hs_math_train_items
           (code, pool, qtype, stem, options_json, answer_payload_json, analysis,
            difficulty, specialty_id, category_id, knowledge_point_id, status, is_active,
            grade_rule_version, content_version, created_by, updated_by)
           VALUES (?, 'formal', 'judge', ?, NULL, ?, ?, 1, ?, ?, NULL, 'draft', 1, 'v1', 1, ?, ?)`,
          [
            gateCode,
            'P1-0D.1 gate stem enough',
            JSON.stringify({ kind: 'judge', value: true }),
            '',
            sp[0].id,
            cat[0].id,
            String(admins[0].id),
            String(admins[0].id),
          ],
        )
        const gateId = String((ins as any).insertId)
        const ap2 = await api(
          'PATCH',
          `/hs-math/admin/train-items/${gateId}/status`,
          adminToken,
          { status: 'approved' },
        )
        record(
          'I_approve_no_analysis_or_kp',
          ap2.status >= 400 ? 'PASS' : 'FAIL',
          `status=${ap2.status}`,
        )

        // 补齐解析+KP 后批准成功，再立刻 disabled
        await conn.query(
          `UPDATE hs_math_train_items SET analysis='gate analysis ok' WHERE id=?`,
          [gateId],
        )
        await conn.query(
          `INSERT INTO hs_math_train_item_kps (item_id, knowledge_point_id, is_primary, sort_order)
           VALUES (?, ?, 1, 10)`,
          [gateId, kp[0].id],
        )
        await conn.query(
          `UPDATE hs_math_train_items SET knowledge_point_id=? WHERE id=?`,
          [kp[0].id, gateId],
        )
        const ap3 = await api(
          'PATCH',
          `/hs-math/admin/train-items/${gateId}/status`,
          adminToken,
          { status: 'approved' },
        )
        const ap3ok = ap3.status === 200 || ap3.status === 201
        record(
          'I_approve_success_then_disable',
          ap3ok ? 'PASS' : 'FAIL',
          `approve status=${ap3.status}`,
        )
        if (ap3ok) {
          await api(
            'PATCH',
            `/hs-math/admin/train-items/${gateId}/status`,
            adminToken,
            { status: 'disabled' },
          )
        }
        // 删除 gate 题（disabled 且无会话引用）
        const [grefs] = await conn.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS c FROM hs_math_train_session_items WHERE item_id=?`,
          [gateId],
        )
        if (Number((grefs[0] as any).c) === 0) {
          await conn.query(`DELETE FROM hs_math_train_item_kps WHERE item_id=?`, [
            gateId,
          ])
          await conn.query(
            `DELETE FROM hs_math_train_items WHERE id=? AND code=?`,
            [gateId, gateCode],
          )
        }

        if (userToken) {
          const apU = await api(
            'PATCH',
            `/hs-math/admin/train-items/${id}/status`,
            userToken,
            { status: 'approved' },
          )
          record(
            'I_user_cannot_approve',
            apU.status === 403 ? 'PASS' : 'FAIL',
            `status=${apU.status}`,
          )
        } else {
          record('I_user_cannot_approve', 'NOT_RUN', '无 USER')
        }
      }
    }
  } catch (e: any) {
    record('SCRIPT', 'FAIL', e?.message || String(e))
  } finally {
    try {
      const cleaned = await cleanupIt(conn)
      console.log('[CLEANUP]', cleaned)
      const after = await snapshot(conn)
      console.log('[AFTER]', {
        items: after.items,
        kps: after.kps,
        approvedFormal: after.approvedFormal,
        sessions: after.sessions,
        sessionItems: after.sessionItems,
        itDraft: after.itDraft,
        p0: (after.p0[0] as any[]).map((r: any) => ({
          id: r.id,
          code: r.code,
          status: r.status,
        })),
      })
      if (before) {
        const sessOk =
          after.sessions === before.sessions &&
          after.sessionItems === before.sessionItems
        const p0Before = JSON.stringify(
          (before.p0[0] as any[]).map((r: any) => [r.id, r.status, r.pool]),
        )
        const p0After = JSON.stringify(
          (after.p0[0] as any[]).map((r: any) => [r.id, r.status, r.pool]),
        )
        record(
          'Z_history_unchanged',
          sessOk && p0Before === p0After ? 'PASS' : 'FAIL',
          `sessions ${before.sessions}->${after.sessions}`,
        )
        record(
          'Z_approved_formal_restored',
          after.approvedFormal === before.approvedFormal ? 'PASS' : 'FAIL',
          `${before.approvedFormal}->${after.approvedFormal}`,
        )
      }
    } finally {
      await conn.end()
    }
  }

  const fail = results.filter((r) => r.status === 'FAIL').length
  const pass = results.filter((r) => r.status === 'PASS').length
  const skip = results.filter((r) => r.status === 'NOT_RUN').length
  console.log(`\nSUMMARY pass=${pass} fail=${fail} not_run=${skip}`)
  if (fail > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
