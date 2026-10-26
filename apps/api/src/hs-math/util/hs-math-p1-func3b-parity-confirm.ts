/**
 * P1-FUNC-3B：奇偶性 25 题授权 confirm（仅 draft，绝不批准）。
 * 前置：用户已明确授权；SHA-256 必须与授权声明一致。
 * 运行：pnpm --filter api run hs-math:p1-func3b-confirm
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
  '7aaa0d1880e55896ce7cb6365a2ff552b57c9820b83140e43620dcf0f95263d8'
const BASE = process.env.HS_MATH_E2E_BASE || 'http://127.0.0.1:3000'
const CODE_PREFIX = 'HSMA-RJA-CH03-PARITY-'
const EXPECTED_CODES = Array.from({ length: 25 }, (_, i) => {
  const n = String(i + 1).padStart(4, '0')
  return `${CODE_PREFIX}${n}`
})
const PARITY_KPS = [
  'rja.3.2.09',
  'rja.3.2.10',
  'rja.3.2.11',
  'rja.3.2.12',
]

const ROOT = path.resolve(__dirname, '../../../../../')
const BANK_JSON = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_03/parity_25.json',
)
const MANIFEST_PATH = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_03/parity_import_manifest.json',
)
const PREVIEW_CACHE = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_03/.p1_func3a_preview_cache.json',
)
const DOC_PATH = path.join(
  ROOT,
  'docs/high_school_math/34_p1_func3b_parity_import_acceptance.md',
)

function loadEnv() {
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >
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
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
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
    throw new Error('DB_NAME 必须为 study_system')
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
  if (!Array.isArray(bank.items) || bank.items.length !== 25) {
    throw new Error(`items 数量异常：${bank.items?.length}`)
  }
  const items = bank.items as Record<string, unknown>[]
  for (let i = 0; i < 25; i++) {
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
    ch01Draft: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE code LIKE 'HSMA-RJA-CH01-%' AND status='draft'`,
    ),
    parityDraft: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE code LIKE ? AND status='draft'`,
      [`${CODE_PREFIX}%`],
    ),
    approvedFormal: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_train_items
       WHERE status='approved' AND pool='formal'`,
    ),
    reviews: await count(
      conn,
      'SELECT COUNT(*) AS c FROM hs_math_train_item_reviews',
    ),
    sessions: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_sessions'),
    sessionItems: await count(
      conn,
      'SELECT COUNT(*) AS c FROM hs_math_train_session_items',
    ),
    chem: await count(conn, 'SELECT COUNT(*) AS c FROM chem_specialties'),
    ch3Kp: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_knowledge_points kp
       JOIN hs_math_categories c ON c.id=kp.category_id
       JOIN hs_math_specialties s ON s.id=c.specialty_id
       WHERE s.code='rja-ch3'`,
    ),
    ch1Kp: await count(
      conn,
      `SELECT COUNT(*) AS c FROM hs_math_knowledge_points kp
       JOIN hs_math_categories c ON c.id=kp.category_id
       JOIN hs_math_specialties s ON s.id=c.specialty_id
       WHERE s.code='rja-ch1'`,
    ),
  })

  const before = await snap()
  console.log('[BEFORE]', before)

  const [parityKp] = await conn.query<RowDataPacket[]>(
    `SELECT code, is_active FROM hs_math_knowledge_points WHERE code IN (?,?,?,?)`,
    PARITY_KPS,
  )
  if (
    parityKp.length !== 4 ||
    parityKp.some((r) => Number(r.is_active) !== 1)
  ) {
    throw new Error('奇偶性 4 KP 缺失或未启用 — 中止')
  }
  if (before.ch3Kp !== 27 || before.ch1Kp !== 15) {
    throw new Error(
      `KP 数量异常 ch3=${before.ch3Kp} ch1=${before.ch1Kp} — 中止`,
    )
  }
  if (before.ch01Draft !== 80) {
    throw new Error(`第一章 draft 应为 80，得 ${before.ch01Draft} — 中止`)
  }
  if (before.approvedFormal !== 0 || before.reviews !== 0) {
    throw new Error(
      `approved=${before.approvedFormal} reviews=${before.reviews} — 中止`,
    )
  }

  const [existing] = await conn.query<RowDataPacket[]>(
    `SELECT code FROM hs_math_train_items WHERE code IN (${EXPECTED_CODES.map(() => '?').join(',')})`,
    EXPECTED_CODES,
  )
  if (existing.length > 0) {
    throw new Error(
      `CODE 冲突 ${existing.length}：${existing
        .map((r) => r.code)
        .join(',')} — 中止，未覆盖`,
    )
  }
  console.log('[CODE_CONFLICT] 0')

  // dist 门禁代码探测（只读）
  const distImport = path.resolve(
    __dirname,
    '../../../dist/hs-math/admin/hs-math-admin-train-items-import.service.js',
  )
  if (
    !fs.existsSync(distImport) ||
    !fs.readFileSync(distImport, 'utf8').includes('fingerprintCanonicalItem')
  ) {
    throw new Error('API dist 未加载导入指纹门禁 — 中止')
  }
  console.log('[API_DIST] fingerprintCanonicalItem OK')

  await waitApi()
  const [admins] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
  )
  if (!admins.length) throw new Error('无 ADMIN')
  const adminToken = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET!)

  let previewToken: string | null = null
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
        previewMeta = { reused: true, expiresAt: cache.expiresAt }
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
    const reports = Array.isArray(pdata?.items) ? pdata.items : []
    const warnCodes = new Set<string>()
    for (const r of reports) {
      for (const w of r?.warnings || []) {
        warnCodes.add(String(w?.code || 'UNKNOWN'))
      }
    }
    previewMeta = {
      reused: false,
      httpStatus: pr.status,
      canConfirm: pdata?.canConfirm,
      errorCount: pdata?.errorCount,
      warningCount: pdata?.warningCount,
      itemCount: pdata?.itemCount,
      warningCodes: [...warnCodes],
    }
    const onlyHumanReview =
      warnCodes.size === 0 ||
      (warnCodes.size === 1 && warnCodes.has('MATH_HUMAN_REVIEW'))
    if (
      !(pr.status === 200 || pr.status === 201) ||
      !pdata?.canConfirm ||
      Number(pdata?.errorCount) !== 0 ||
      Number(pdata?.itemCount) !== 25 ||
      !pdata?.previewToken ||
      !onlyHumanReview
    ) {
      throw new Error(
        `重新 preview 失败或出现新风险 warning：${JSON.stringify(previewMeta)}`,
      )
    }
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
          itemCount: 25,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    console.log('[PREVIEW] PASS re-issued')
  }

  console.log('[CONFIRM] starting…')
  const cr = await api(
    'POST',
    '/hs-math/admin/train-items/import/confirm',
    adminToken,
    { previewToken, items },
  )
  const cdata = dataOf(cr.json)
  const successCount = Number(cdata?.successCount ?? 0)
  const failCount = Number(cdata?.failCount ?? -1)
  console.log('[CONFIRM] http=', cr.status, {
    mode: cdata?.mode,
    successCount,
    failCount,
    notice: cdata?.notice,
  })
  if (
    !(cr.status === 200 || cr.status === 201) ||
    successCount !== 25 ||
    failCount !== 0
  ) {
    throw new Error(
      `confirm 失败 http=${cr.status} success=${successCount} fail=${failCount} msg=${(cr.json as any)?.message}`,
    )
  }

  const after = await snap()
  console.log('[AFTER]', after)

  const historyOk =
    after.sessions === before.sessions &&
    after.sessionItems === before.sessionItems &&
    after.chem === before.chem &&
    after.ch01Draft === 80 &&
    after.ch3Kp === 27 &&
    after.ch1Kp === 15 &&
    after.approvedFormal === 0 &&
    after.reviews === 0

  if (!historyOk) {
    throw new Error(
      `历史/保护数据异常 before=${JSON.stringify(before)} after=${JSON.stringify(after)}`,
    )
  }
  if (after.items !== before.items + 25) {
    throw new Error(
      `train_items 增量异常 ${before.items}->${after.items}（期望 +25）`,
    )
  }
  if (after.parityDraft !== 25) {
    throw new Error(`parity draft 应为 25，得 ${after.parityDraft}`)
  }

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

  const bankByCode = new Map(items.map((it) => [String(it.code), it] as const))
  let matchCount = 0
  const mismatches: string[] = []

  for (const code of EXPECTED_CODES) {
    const row = rows.find((r) => String(r.code) === code)
    if (!row) {
      mismatches.push(`${code}: MISSING`)
      continue
    }
    if (String(row.status) !== 'draft') mismatches.push(`${code}: status=${row.status}`)
    if (String(row.pool) !== 'formal') mismatches.push(`${code}: pool=${row.pool}`)
    if (Number(row.is_active) !== 1) mismatches.push(`${code}: inactive`)
    if (String(row.specialty_code) !== 'rja-ch3') {
      mismatches.push(`${code}: specialty`)
    }
    if (String(row.category_code) !== '3.2') {
      mismatches.push(`${code}: category`)
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
      mismatches.push(`${code}: ANSWER ${e?.message || e}`)
      continue
    }

    const itemLinks = linksByItem.get(String(row.id)) || []
    const kpCodes = itemLinks
      .map((l) => String(l.kp_code))
      .filter(Boolean)
      .sort()
    const primaries = itemLinks.filter((l) => Number(l.is_primary) === 1)
    if (primaries.length !== 1) {
      mismatches.push(`${code}: primary_count=${primaries.length}`)
    }
    const primaryCode = primaries[0] ? String(primaries[0].kp_code) : ''

    const dbCanon = {
      code: String(row.code),
      specialtyCode: String(row.specialty_code),
      categoryCode: String(row.category_code),
      qtype: row.qtype,
      difficulty: Number(row.difficulty),
      stem: String(row.stem || '').trim(),
      options: dbNorm.optionsJson,
      answerPayload: dbNorm.answerPayload,
      analysis: String(row.analysis || '').trim(),
      knowledgePointCodes: kpCodes,
      primaryKnowledgePointCode: primaryCode,
      pool: 'formal',
    }
    const importCanon = canonicalizeImportItem({
      ...src,
      knowledgePointCodes: (src as any).knowledgePointCodes,
      primaryKnowledgePointCode: (src as any).primaryKnowledgePointCode,
      options: importNorm.optionsJson,
      answerPayload: importNorm.answerPayload,
    })!
    // align options/answer from validated forms
    importCanon.options = importNorm.optionsJson
    importCanon.answerPayload = importNorm.answerPayload

    const dbFp = fingerprintCanonicalItem(dbCanon)
    const srcFp = fingerprintCanonicalItem(importCanon)
    const manFp = fpMap.get(code)
    if (dbFp !== srcFp || (manFp && dbFp !== manFp)) {
      mismatches.push(
        `${code}: FP_MISMATCH db≠src/manifest`,
      )
      continue
    }

    const expectKp = [...((src as any).knowledgePointCodes as string[])]
      .map(String)
      .sort()
    if (JSON.stringify(kpCodes) !== JSON.stringify(expectKp)) {
      mismatches.push(`${code}: KP_SET`)
      continue
    }
    if (primaryCode !== String((src as any).primaryKnowledgePointCode)) {
      mismatches.push(`${code}: PRIMARY_KP`)
      continue
    }
    matchCount++
  }

  const [orphan] = await conn.query<RowDataPacket[]>(
    `SELECT l.id FROM hs_math_train_item_kps l
     LEFT JOIN hs_math_train_items t ON t.id=l.item_id
     WHERE t.id IS NULL LIMIT 5`,
  )
  const [passedReviews] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM hs_math_train_item_reviews r
     JOIN hs_math_train_items t ON t.id=r.item_id
     WHERE t.code LIKE ?`,
    [`${CODE_PREFIX}%`],
  )
  const reviewPassed = Number(passedReviews[0]?.c || 0)

  const contentOk = matchCount === 25 && mismatches.length === 0
  const kpOk = after.kps > before.kps && orphan.length === 0
  const overall =
    contentOk &&
    kpOk &&
    historyOk &&
    reviewPassed === 0 &&
    after.approvedFormal === 0

  const generatedAt = new Date().toISOString()
  const doc = `# P1-FUNC-3B：函数奇偶性 25 题导入验收

**日期**：${generatedAt.slice(0, 10)}  
**库**：\`study_system\`  
**授权**：用户明确授权 P1-FUNC-3B；SHA \`${EXPECTED_SHA}\`

---

## 1. 授权范围

- 文件：\`parity_25.json\`
- code：\`HSMA-RJA-CH03-PARITY-0001\` … \`0025\`
- 目标状态：全部 **draft** / pool=formal
- **未**批准；**未**写审核 passed

## 2. 文件版本

| 项 | 值 |
|----|-----|
| SHA-256 | \`${fileSha}\`（与授权一致） |
| 题数 | 25 |
| 导入内容哈希 | \`${contentHash}\` |

## 3. preview

\`\`\`json
${JSON.stringify(previewMeta, null, 2)}
\`\`\`

## 4. confirm

| 项 | 值 |
|----|-----|
| HTTP | ${cr.status} |
| mode | ${cdata?.mode ?? ''} |
| successCount | ${successCount} |
| failCount | ${failCount} |

## 5. 数据库前后

| 项 | 前 | 后 |
|----|----|----|
| train_items | ${before.items} | ${after.items} |
| train_item_kps | ${before.kps} | ${after.kps} |
| CH01 draft | ${before.ch01Draft} | ${after.ch01Draft} |
| CH03 parity draft | ${before.parityDraft} | ${after.parityDraft} |
| approved formal | ${before.approvedFormal} | ${after.approvedFormal} |
| review_records | ${before.reviews} | ${after.reviews} |
| sessions | ${before.sessions} | ${after.sessions} |
| session_items | ${before.sessionItems} | ${after.sessionItems} |
| chem_specialties | ${before.chem} | ${after.chem} |
| 第三章 KP | ${before.ch3Kp} | ${after.ch3Kp} |
| 第一章 KP | ${before.ch1Kp} | ${after.ch1Kp} |

## 6. 内容一致性

- 一致：${matchCount}/25
- 不一致：${mismatches.length === 0 ? '无' : mismatches.join('; ')}

## 7. KP 关联

${kpOk ? 'PASS' : 'FAIL'}（无孤立关联；主 KP 唯一）

## 8. 审核状态

- 人工材料：仍为 PENDING（未改文档状态为 APPROVED）
- 数据库 review 写入（parity）：${reviewPassed}
- 数据库 approved：${after.approvedFormal}
- 重点 0022/0023：仍待人工确认（draft/none）

## 9. 历史与其他模块

历史 sessions/session_items/chem/第一章 draft/KP 数：**受保护未变**

## 10. 下一阶段

${
  overall
    ? '**READY_FOR_PARITY_HUMAN_REVIEW**'
    : '**NOT_READY**'
}
`

  fs.writeFileSync(DOC_PATH, doc, 'utf8')
  console.log(`[DOC] wrote ${DOC_PATH}`)

  console.log('\n========== 【P1-FUNC-3B】 ==========')
  console.log(`SHA：${fileSha}`)
  console.log(`confirm success=${successCount} fail=${failCount}`)
  console.log(`items ${before.items}->${after.items}`)
  console.log(`parity draft=${after.parityDraft}`)
  console.log(`match=${matchCount} mismatches=${mismatches.length}`)
  console.log(`overall=${overall ? 'PASS' : 'FAIL'}`)
  console.log('===================================\n')

  await conn.end()
  if (!overall) process.exit(1)
}

main().catch((e) => {
  console.error(
    '[P1-FUNC-3B FAILED]',
    e instanceof Error ? e.message : e,
  )
  process.exit(1)
})
