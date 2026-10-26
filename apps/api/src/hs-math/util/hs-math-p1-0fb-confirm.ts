/**
 * P1-0F-B 授权后 confirm + 导入验收（仅 draft，绝不批准）。
 *
 * 前置：用户已明确授权；SHA-256 必须与授权声明一致。
 * 运行：pnpm --filter api run hs-math:p1-0fb-confirm
 */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { createConnection, type RowDataPacket } from 'mysql2/promise'
import {
  canonicalizeImportItem,
  fingerprintCanonicalItem,
  hashImportItems,
} from './import-preview-token'
import { validateAnswerPayload } from './answer-payload.validate'

const EXPECTED_SHA =
  '89b6484e6cb69f40437a6b28f603abae3c9eb19c0b08157d27947f72f7ec95c9'
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const CODE_PREFIX = 'HSMA-RJA-CH01-'
const EXPECTED_CODES = Array.from({ length: 80 }, (_, i) => {
  const n = String(i + 1).padStart(4, '0')
  return `${CODE_PREFIX}${n}`
})

const ROOT = path.resolve(__dirname, '../../../../../')
const BANK_JSON = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/chapter_01_all.json',
)
const MANIFEST_PATH = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/import_manifest.json',
)
const PREVIEW_CACHE = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/.p1_0fb_preview_cache.json',
)
const DOC_PATH = path.join(
  ROOT,
  'docs/high_school_math/20_p1_0fb_import_acceptance.md',
)

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
    json = { raw: text.slice(0, 300) }
  }
  return { status: res.status, json }
}

function dataOf(json: unknown): any {
  const j = json as any
  if (j?.success === true && j.data !== undefined) return j.data
  return j
}

async function count(conn: any, sql: string, params: unknown[] = []) {
  const [rows] = await conn.query(sql, params)
  return Number((rows[0] as any)?.c ?? 0)
}

async function waitApi() {
  for (let i = 0; i < 30; i++) {
    try {
      const h = await fetch(`${BASE}/health`)
      if (h.ok) return
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error(`API 不可达 ${BASE}`)
}

async function main() {
  const env = loadEnv()
  if ((env.DB_NAME || 'study_system') !== 'study_system') {
    throw new Error(`DB_NAME 必须为 study_system`)
  }
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET missing')

  const rawBuf = fs.readFileSync(BANK_JSON)
  const fileSha = crypto.createHash('sha256').update(rawBuf).digest('hex')
  if (fileSha !== EXPECTED_SHA) {
    throw new Error(
      `SHA 与授权不一致：actual=${fileSha} expected=${EXPECTED_SHA} — 中止，未写入`,
    )
  }
  console.log(`[SHA] MATCH ${fileSha}`)

  const bank = JSON.parse(rawBuf.toString('utf8')) as { items: unknown[] }
  if (!Array.isArray(bank.items) || bank.items.length !== 80) {
    throw new Error(`items 数量异常：${bank.items?.length}`)
  }
  const items = bank.items as Record<string, unknown>[]
  for (let i = 0; i < 80; i++) {
    if (String(items[i].code) !== EXPECTED_CODES[i]) {
      throw new Error(`code 顺序异常 index=${i}`)
    }
  }
  const contentHash = hashImportItems(items)

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
  })

  const snap = async () => ({
    items: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_items'),
    kps: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_item_kps'),
    draft: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE status='draft'`,
    ),
    approvedFormal: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE status='approved' AND pool='formal'`,
    ),
    approvedFormalActive: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE status='approved' AND pool='formal' AND is_active=1`,
    ),
    ch01: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE code LIKE ?`,
      [`${CODE_PREFIX}%`],
    ),
    sessions: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_sessions'),
    sessionItems: await count(
      conn,
      'SELECT COUNT(*) AS c FROM hs_math_train_session_items',
    ),
    chem: await count(conn, 'SELECT COUNT(*) AS c FROM chem_specialties').catch(
      () => -1,
    ),
  })

  const before = await snap()
  const [p0Before] = await conn.query<RowDataPacket[]>(
    `SELECT id, code, status, pool, content_version,
            CRC32(CONCAT_WS('|', stem, CAST(options_json AS CHAR), CAST(answer_payload_json AS CHAR), IFNULL(analysis,''))) AS sig
     FROM hs_math_train_items WHERE id IN (1,2,3,4,5) ORDER BY id`,
  )
  console.log('[BEFORE]', before)

  // 冲突检查
  const [existing] = await conn.query<RowDataPacket[]>(
    `SELECT code FROM hs_math_train_items WHERE code IN (${EXPECTED_CODES.map(() => '?').join(',')})`,
    EXPECTED_CODES,
  )
  if (existing.length > 0 && existing.length < 80) {
    throw new Error(
      `部分 code 已存在（${existing.length}/80），中止：${existing
        .slice(0, 10)
        .map((r) => r.code)
        .join(',')}`,
    )
  }
  // 若 80 全存在：后续 confirm 走幂等；仍允许继续核对

  await waitApi()
  const [admins] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  if (!admins.length) throw new Error('无 ADMIN')
  const adminToken = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET)

  let previewToken: string | null = null
  let previewReused = false
  let previewMeta: any = null

  if (fs.existsSync(PREVIEW_CACHE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(PREVIEW_CACHE, 'utf8'))
      const exp = Date.parse(String(cache.expiresAt || 0))
      if (
        cache.fileSha256 === fileSha &&
        cache.importContentHash === contentHash &&
        cache.previewToken &&
        Number.isFinite(exp) &&
        Date.now() < exp - 60_000
      ) {
        previewToken = String(cache.previewToken)
        previewReused = true
        console.log(`[PREVIEW] reuse cached token exp=${cache.expiresAt}`)
      }
    } catch {
      /* re-preview */
    }
  }

  if (!previewToken) {
    console.log('[PREVIEW] re-preview required')
    const pr = await api(
      'POST',
      '/hs-math/admin/train-items/import/preview',
      adminToken,
      { items },
    )
    const pdata = dataOf(pr.json)
    previewMeta = {
      httpStatus: pr.status,
      canConfirm: pdata?.canConfirm,
      errorCount: pdata?.errorCount,
      warningCount: pdata?.warningCount,
      itemCount: pdata?.itemCount,
    }
    if (
      !(pr.status === 200 || pr.status === 201) ||
      !pdata?.canConfirm ||
      Number(pdata?.errorCount) !== 0 ||
      Number(pdata?.itemCount) !== 80 ||
      !pdata?.previewToken
    ) {
      throw new Error(
        `重新 preview 失败：${JSON.stringify(previewMeta)} — 中止，未 confirm`,
      )
    }
    // 再查冲突（preview 侧）
    const mid = await snap()
    if (mid.items !== before.items || mid.kps !== before.kps) {
      throw new Error('preview 后数量变化 — 中止')
    }
    previewToken = String(pdata.previewToken)
    fs.writeFileSync(
      PREVIEW_CACHE,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          fileSha256: fileSha,
          importContentHash: contentHash,
          expiresAt: pdata.expiresAt,
          previewToken,
          itemCount: 80,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    console.log('[PREVIEW] PASS re-issued')
  } else {
    previewMeta = { reused: true }
  }

  console.log('[CONFIRM] starting…')
  const cr = await api(
    'POST',
    '/hs-math/admin/train-items/import/confirm',
    adminToken,
    { previewToken, items },
  )
  const cdata = dataOf(cr.json)
  const confirmOk =
    (cr.status === 200 || cr.status === 201) &&
    (cdata?.success === true || cdata?.successCount === 80 || cdata?.mode)
  console.log('[CONFIRM] http=', cr.status, {
    mode: cdata?.mode,
    successCount: cdata?.successCount,
    failCount: cdata?.failCount,
    notice: cdata?.notice,
    message: (cr.json as any)?.message,
  })
  if (!confirmOk) {
    console.error('[CONFIRM] FAIL body keys', Object.keys((cr.json as any) || {}))
    throw new Error(
      `confirm 失败 http=${cr.status} — 已停止，不清理。detail=${JSON.stringify(
        {
          message: (cr.json as any)?.message,
          error: (cr.json as any)?.error,
          mode: cdata?.mode,
          successCount: cdata?.successCount,
        },
      )}`,
    )
  }

  const after = await snap()
  console.log('[AFTER]', after)

  // 历史保护
  const historyOk =
    after.sessions === before.sessions &&
    after.sessionItems === before.sessionItems
  const [p0After] = await conn.query<RowDataPacket[]>(
    `SELECT id, code, status, pool, content_version,
            CRC32(CONCAT_WS('|', stem, CAST(options_json AS CHAR), CAST(answer_payload_json AS CHAR), IFNULL(analysis,''))) AS sig
     FROM hs_math_train_items WHERE id IN (1,2,3,4,5) ORDER BY id`,
  )
  const p0Ok =
    p0Before.length === p0After.length &&
    p0Before.every((b, i) => {
      const a = p0After[i]
      return (
        String(b.id) === String(a.id) &&
        String(b.code) === String(a.code) &&
        String(b.status) === String(a.status) &&
        String(b.pool) === String(a.pool) &&
        String(b.content_version) === String(a.content_version) &&
        String(b.sig) === String(a.sig)
      )
    }) &&
    p0After.every((r) => String(r.status) === 'disabled')

  // 正式题池
  const poolLeak = after.approvedFormalActive > before.approvedFormalActive
  const formalPoolOk = !poolLeak && after.approvedFormal === before.approvedFormal

  // 逐题核对
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as {
    items: Array<{ code: string; contentFingerprint: string }>
  }
  const fpMap = new Map(
    manifest.items.map((x) => [x.code, x.contentFingerprint]),
  )

  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT t.id, t.code, t.pool, t.qtype, t.difficulty, t.stem, t.options_json,
            t.answer_payload_json, t.analysis, t.status, t.is_active,
            s.code AS specialty_code, c.code AS category_code
     FROM hs_math_train_items t
     JOIN hs_math_specialties s ON s.id = t.specialty_id
     JOIN hs_math_categories c ON c.id = t.category_id
     WHERE t.code LIKE ?
     ORDER BY t.code`,
    [`${CODE_PREFIX}%`],
  )

  const [links] = await conn.query<RowDataPacket[]>(
    `SELECT l.item_id, l.is_primary, k.code AS kp_code
     FROM hs_math_train_item_kps l
     JOIN hs_math_knowledge_points k ON k.id = l.knowledge_point_id
     JOIN hs_math_train_items t ON t.id = l.item_id
     WHERE t.code LIKE ?`,
    [`${CODE_PREFIX}%`],
  )
  const linksByItem = new Map<string, RowDataPacket[]>()
  for (const l of links) {
    const id = String(l.item_id)
    if (!linksByItem.has(id)) linksByItem.set(id, [])
    linksByItem.get(id)!.push(l)
  }

  const bankByCode = new Map(
    items.map((it) => [String(it.code), it] as const),
  )

  let matchCount = 0
  const mismatches: string[] = []
  const statusIssues: string[] = []

  for (const code of EXPECTED_CODES) {
    const row = rows.find((r) => String(r.code) === code)
    if (!row) {
      mismatches.push(`${code}: MISSING_IN_DB`)
      continue
    }
    if (String(row.status) !== 'draft') {
      statusIssues.push(`${code}: status=${row.status}`)
    }
    if (String(row.pool) !== 'formal') {
      statusIssues.push(`${code}: pool=${row.pool}`)
    }
    const src = bankByCode.get(code)!
    let dbNorm: { optionsJson: unknown; answerPayload: unknown }
    let importNorm: { optionsJson: unknown; answerPayload: unknown }
    try {
      dbNorm = validateAnswerPayload({
        qtype: row.qtype as any,
        optionsJson: row.options_json,
        answerPayload: row.answer_payload_json,
      })
      importNorm = validateAnswerPayload({
        qtype: src.qtype as any,
        optionsJson: (src as any).options ?? null,
        answerPayload: (src as any).answerPayload,
      })
    } catch (e: any) {
      mismatches.push(`${code}: ANSWER_PROTOCOL ${e?.message || e}`)
      continue
    }
    const [itemLinks] = [linksByItem.get(String(row.id)) || []]
    const kpCodes = itemLinks
      .map((l) => String(l.kp_code))
      .filter(Boolean)
      .sort()
    const primary = itemLinks.find((l) => Number(l.is_primary) === 1)
    const primaryCode = primary ? String(primary.kp_code) : ''
    const primaries = itemLinks.filter((l) => Number(l.is_primary) === 1)
    if (primaries.length !== 1) {
      mismatches.push(`${code}: primary_kp_count=${primaries.length}`)
    }

    const dbCanon = {
      code: String(row.code),
      specialtyCode: String(row.specialty_code),
      categoryCode: String(row.category_code),
      qtype: row.qtype,
      difficulty: Number(row.difficulty),
      stem: String(row.stem || '').trim(),
      options: dbNorm.optionsJson ?? null,
      answerPayload: dbNorm.answerPayload,
      analysis: String(row.analysis || '').trim(),
      knowledgePointCodes: kpCodes,
      primaryKnowledgePointCode: primaryCode,
      pool: 'formal',
    }
    const importCanon = canonicalizeImportItem({
      ...src,
      options: importNorm.optionsJson,
      answerPayload: importNorm.answerPayload,
      difficulty: Number((src as any).difficulty),
    })
    if (!importCanon) {
      mismatches.push(`${code}: CANON_FAIL`)
      continue
    }
    importCanon.difficulty = Number(importCanon.difficulty)
    const dbFp = fingerprintCanonicalItem(dbCanon)
    const importFp = fingerprintCanonicalItem(importCanon)
    const manifestFp = fpMap.get(code)
    if (dbFp !== importFp) {
      mismatches.push(`${code}: CONTENT_FP_MISMATCH db≠import`)
      continue
    }
    if (manifestFp && dbFp !== manifestFp) {
      // 规范化后应一致；若 manifest 基于未规范化 options 可能略异——仍以 db↔import 为准
      // 再比一次：manifest 应等于 import 规范化指纹
      const srcCanon = canonicalizeImportItem(src)
      const srcFp = srcCanon ? fingerprintCanonicalItem(srcCanon) : ''
      if (manifestFp !== srcFp && manifestFp !== importFp) {
        mismatches.push(`${code}: MANIFEST_FP_DRIFT`)
        continue
      }
    }
    matchCount++
  }

  // 孤立 / 重复关联
  const orphanLinks = await count(
    conn,
    `SELECT COUNT(*) AS c FROM hs_math_train_item_kps l
     LEFT JOIN hs_math_train_items t ON t.id = l.item_id
     WHERE t.id IS NULL`,
  )
  const dupLinks = await count(
    conn,
    `SELECT COUNT(*) AS c FROM (
       SELECT item_id, knowledge_point_id, COUNT(*) AS n
       FROM hs_math_train_item_kps
       GROUP BY item_id, knowledge_point_id
       HAVING n > 1
     ) x`,
  )
  const ch01Draft = await count(
    conn,
    `SELECT COUNT(*) AS c FROM hs_math_train_items
     WHERE code LIKE ? AND status='draft'`,
    [`${CODE_PREFIX}%`],
  )
  const ch01Approved = await count(
    conn,
    `SELECT COUNT(*) AS c FROM hs_math_train_items
     WHERE code LIKE ? AND status='approved'`,
    [`${CODE_PREFIX}%`],
  )
  const testPrefixMix = await count(
    conn,
    `SELECT COUNT(*) AS c FROM hs_math_train_items
     WHERE code LIKE ? AND (
       code LIKE 'HS_MATH_P0_%' OR code LIKE 'EXAMPLE_%' OR code LIKE 'DEMO_%'
     )`,
    [`${CODE_PREFIX}%`],
  )

  const contentOk = matchCount === 80 && mismatches.length === 0
  const statusOk =
    statusIssues.length === 0 && ch01Draft === 80 && ch01Approved === 0
  const kpOk = orphanLinks === 0 && dupLinks === 0 && after.kps >= before.kps
  const addedItems = after.items - before.items
  const addedKps = after.kps - before.kps

  const overall =
    confirmOk &&
    contentOk &&
    statusOk &&
    historyOk &&
    p0Ok &&
    formalPoolOk &&
    testPrefixMix === 0
      ? 'PASS'
      : 'PARTIAL'

  const generatedAt = new Date().toISOString()
  const authQuote =
    '确认将第一章80道题导入 study_system，全部保持 draft，不执行批准。'

  const doc = `# P1-0F-B 受控导入验收

> 生成时间：${generatedAt}
> 授权：已获用户明确授权（全部 draft，不批准）

## 1. 题库版本

| 项 | 值 |
|----|-----|
| 文件 | \`chapter_01_all.json\` |
| SHA-256 | \`${fileSha}\` |
| 授权声明 SHA | \`${EXPECTED_SHA}\` |
| 一致 | **是** |
| 题数 | 80 |
| code | ${EXPECTED_CODES[0]} .. ${EXPECTED_CODES[79]} |
| importContentHash | \`${contentHash}\` |

## 2. 用户授权

- 状态：**已授权**
- 要点：仅 HSMA-RJA-CH01-0001..0080；全部 draft；不批准；异常即停。
- 授权原文摘要：\`${authQuote}\`

## 3. preview

| 项 | 值 |
|----|-----|
| 复用缓存 token | ${previewReused} |
| meta | ${JSON.stringify(previewMeta)} |
| preview 写库 | 否（before→confirm 前数量未因 preview 变化） |

## 4. 写入前快照

\`\`\`json
${JSON.stringify(before, null, 2)}
\`\`\`

P0 id1-5：${JSON.stringify(p0Before.map((r) => ({ id: r.id, code: r.code, status: r.status })))}

## 5. confirm

| 项 | 值 |
|----|-----|
| HTTP | ${cr.status} |
| mode | ${cdata?.mode || 'insert'} |
| successCount | ${cdata?.successCount} |
| failCount | ${cdata?.failCount} |
| notice | ${cdata?.notice || ''} |
| 结果 | **${confirmOk ? 'PASS' : 'FAIL'}** |

## 6. 写入后快照

\`\`\`json
${JSON.stringify(after, null, 2)}
\`\`\`

| 项 | 值 |
|----|-----|
| 新增 items | ${addedItems} |
| 新增 kps | ${addedKps} |
| CH01 draft | ${ch01Draft} |
| CH01 approved | ${ch01Approved} |

## 7. 逐题内容核对

| 项 | 值 |
|----|-----|
| 指纹一致 | **${matchCount}** / 80 |
| 不一致 | ${mismatches.length} |
| 状态问题 | ${statusIssues.length} |

${
  mismatches.length
    ? `### 不一致明细\n\n${mismatches.map((m) => `- ${m}`).join('\n')}`
    : '无内容不一致。'
}

${
  statusIssues.length
    ? `### 状态问题\n\n${statusIssues.map((m) => `- ${m}`).join('\n')}`
    : ''
}

## 8. KP 关联

| 项 | 值 |
|----|-----|
| 孤立关联 | ${orphanLinks} |
| 重复关联 | ${dupLinks} |
| 结果 | **${kpOk && contentOk ? 'PASS' : 'FAIL'}** |

## 9. 历史数据保护

| 项 | 值 |
|----|-----|
| sessions ${before.sessions}→${after.sessions} | ${historyOk ? 'PASS' : 'FAIL'} |
| session_items ${before.sessionItems}→${after.sessionItems} | ${historyOk ? 'PASS' : 'FAIL'} |
| P0 id1-5 未改且 disabled | **${p0Ok ? 'PASS' : 'FAIL'}** |

## 10. 正式题池隔离

| 项 | 值 |
|----|-----|
| approved formal 变化 | ${before.approvedFormal}→${after.approvedFormal} |
| 可抽题（approved+active） | ${before.approvedFormalActive}→${after.approvedFormalActive} |
| FORMAL_POOL_LEAK | **${poolLeak ? 'YES' : 'NO'}** |
| 结果 | **${formalPoolOk ? 'PASS' : 'FAIL'}** |

## 11. 人工审核 / 批准

- 文件侧人工审核仍为 PENDING（本阶段未改 review_checklist）
- 数据库 CH01 approved：**${ch01Approved}**
- **未执行任何批准**

## 12. 异常与剩余风险

- 导入异常处理：本次 ${overall === 'PASS' ? '无阻断异常' : '见上文不一致/状态问题'}
- 43 题仍为 NEEDS_HUMAN_REVIEW（文件侧）；draft 不等于人工 APPROVED
- 7 条 KP_CATEGORY_DIFF warning（同章跨小节）已入库，批准前须人工确认

## 13. P1-0F-C 准入建议

**${overall === 'PASS' ? 'READY' : 'NOT_READY'}**

READY 仅表示 draft 导入与完整性验收通过，**不等于**允许批量批准或开放学生正式训练。
`

  fs.writeFileSync(DOC_PATH, doc, 'utf8')
  console.log(`[DOC] ${DOC_PATH}`)

  console.log('\n========== 【P1-0F-B 实施结果】 ==========')
  console.log(`总体状态：${overall}`)
  console.log(`confirm：${confirmOk ? 'PASS' : 'FAIL'} mode=${cdata?.mode || 'insert'}`)
  console.log(`新增 draft items：${addedItems}  kps：${addedKps}`)
  console.log(`逐题一致：${matchCount}/80  不一致：${mismatches.length}`)
  console.log(`历史保护：${historyOk && p0Ok ? 'PASS' : 'FAIL'}`)
  console.log(`正式题池隔离：${formalPoolOk ? 'PASS' : 'FAIL'}`)
  console.log(`CH01 approved：${ch01Approved}`)
  console.log(`P1-0F-C：${overall === 'PASS' ? 'READY' : 'NOT_READY'}`)
  console.log('==========================================\n')

  if (overall !== 'PASS') process.exitCode = 1
  await conn.end()
}

main().catch(async (e) => {
  console.error('[P1-0F-B confirm FAILED]', e instanceof Error ? e.message : e)
  console.error('已停止。未自动清理/覆盖。')
  process.exitCode = 1
})
