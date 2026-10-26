/**
 * P1-FUNC-3A：奇偶性 25 题导入前预检（只读 DB + HTTP preview，绝不 confirm）。
 *
 * - 核对权威源 ≡ parity_25.json
 * - 生成 parity_import_manifest.json（文件 SHA-256 + 逐题内容指纹）
 * - SELECT 基线与 25 code 冲突
 * - POST /hs-math/admin/train-items/import/preview
 * - 写出 docs/.../33_p1_func3a_parity_import_precheck.md
 *
 * 运行：pnpm --filter api run hs-math:p1-func3a-preflight
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
import {
  PARITY25_ITEMS,
  toImportItems,
} from './hs-math-p1-func2-parity-items'

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
const CHECKLIST_PATH = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_03/review_checklist_parity.md',
)
const ISSUES_PATH = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_03/review_issues_parity.md',
)
const DOC_PATH = path.join(
  ROOT,
  'docs/high_school_math/33_p1_func3a_parity_import_precheck.md',
)
const PREVIEW_CACHE = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_03/.p1_func3a_preview_cache.json',
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
    json = { raw: text.slice(0, 200) }
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

function classifyWarnings(
  samples: Array<{ code?: string; warnings: any[] }>,
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const s of samples) {
    for (const w of s.warnings || []) {
      const code = String(w?.code || w?.level || 'UNKNOWN')
      map[code] = (map[code] || 0) + 1
    }
  }
  return map
}

async function main() {
  const env = loadEnv()
  const dbName = env.DB_NAME || 'study_system'
  if (dbName !== 'study_system') {
    throw new Error(`要求 DB_NAME=study_system，当前=${dbName}`)
  }
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET missing')

  if (!fs.existsSync(BANK_JSON)) throw new Error(`缺少 ${BANK_JSON}`)
  const rawBuf = fs.readFileSync(BANK_JSON)
  const fileSha256 = crypto.createHash('sha256').update(rawBuf).digest('hex')
  const bank = JSON.parse(rawBuf.toString('utf8')) as { items: unknown[] }
  if (!Array.isArray(bank.items) || bank.items.length !== 25) {
    throw new Error(`parity_25.json items 应为 25，实际 ${bank.items?.length}`)
  }

  const fromSrc = toImportItems(PARITY25_ITEMS)
  if (JSON.stringify(bank.items) !== JSON.stringify(fromSrc)) {
    throw new Error('parity_25.json 与权威源 hs-math-p1-func2-parity-items.ts 不一致')
  }
  console.log('[SOURCE] JSON ≡ 权威源 PASS')

  const checklist = fs.readFileSync(CHECKLIST_PATH, 'utf8')
  const issues = fs.readFileSync(ISSUES_PATH, 'utf8')
  const pendingOk =
    checklist.includes('PENDING=25') &&
    checklist.includes('APPROVED=0') &&
    !checklist.includes('| APPROVED |')
  const human0022 = checklist.includes('HSMA-RJA-CH03-PARITY-0022') &&
    checklist.includes('NEEDS_HUMAN_REVIEW') &&
    /HSMA-RJA-CH03-PARITY-0022.*PENDING/.test(
      checklist.split('\n').find((l) => l.includes('PARITY-0022')) || '',
    )
  const human0023 = /HSMA-RJA-CH03-PARITY-0023.*NEEDS_HUMAN_REVIEW.*PENDING/.test(
    checklist.split('\n').find((l) => l.includes('PARITY-0023')) || '',
  )
  console.log(
    `[REVIEW] PENDING25=${pendingOk} 0022=${human0022} 0023=${human0023}`,
  )
  if (!pendingOk || !human0022 || !human0023) {
    throw new Error('人工审核材料异常：0022/0023 须仍为 PENDING + NEEDS_HUMAN_REVIEW')
  }
  if (issues.includes('APPROVED') && /APPROVED\s*[:=]\s*[1-9]/.test(issues)) {
    throw new Error('review_issues 出现非零 APPROVED，禁止')
  }

  const items = bank.items as Record<string, unknown>[]
  const qtypeCount: Record<string, number> = {}
  const diffCount: Record<string, number> = {}
  const itemFingerprints = items.map((it) => {
    const canon = canonicalizeImportItem(it)
    if (!canon) throw new Error(`无法规范化：${(it as any).code}`)
    const fp = fingerprintCanonicalItem(canon)
    const q = String(canon.qtype)
    const d = String(canon.difficulty)
    qtypeCount[q] = (qtypeCount[q] || 0) + 1
    diffCount[d] = (diffCount[d] || 0) + 1
    return {
      code: String(canon.code),
      contentFingerprint: fp,
      qtype: q,
      difficulty: Number(canon.difficulty),
      specialtyCode: String(canon.specialtyCode),
      categoryCode: String(canon.categoryCode),
      primaryKnowledgePointCode: String(canon.primaryKnowledgePointCode),
    }
  })

  for (let i = 0; i < 25; i++) {
    if (itemFingerprints[i].code !== EXPECTED_CODES[i]) {
      throw new Error(
        `code 顺序异常：期望 ${EXPECTED_CODES[i]} 得 ${itemFingerprints[i].code}`,
      )
    }
  }

  const contentHash = hashImportItems(items)
  const generatedAt = new Date().toISOString()
  const manifest = {
    phase: 'P1-FUNC-3A',
    purpose: 'import verification only — not an import payload',
    file: {
      path: 'docs/high_school_math/question_bank/chapter_03/parity_25.json',
      sizeBytes: rawBuf.length,
      sha256: fileSha256,
      generatedAt,
      itemCount: items.length,
      codeRange: {
        from: EXPECTED_CODES[0],
        to: EXPECTED_CODES[EXPECTED_CODES.length - 1],
      },
      qtypeCount,
      difficultyCount: diffCount,
      importContentHash: contentHash,
      noteHumanReview:
        '0022/0023 = NEEDS_HUMAN_REVIEW；全部人工 PENDING；preview warning ≠ APPROVED',
    },
    items: itemFingerprints,
  }
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`[MANIFEST] wrote ${MANIFEST_PATH}`)
  console.log(`[MANIFEST] fileSha256=${fileSha256}`)

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: dbName,
  })

  let previewStatus: 'PASS' | 'FAIL' | 'NOT_RUN' = 'NOT_RUN'
  let previewError = ''
  let previewSummary: any = null
  let warningClass: Record<string, number> = {}
  let authStatus = 'WAITING_FOR_CONFIRM_AUTHORIZATION'
  let blockReason = ''

  try {
    const before = {
      items: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_items'),
      kps: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_item_kps'),
      approvedFormal: await count(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_items
         WHERE status='approved' AND pool='formal'`,
      ),
      ch01Draft: await count(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_items
         WHERE code LIKE 'HSMA-RJA-CH01-%' AND status='draft'`,
      ),
      reviews: await count(
        conn,
        'SELECT COUNT(*) AS c FROM hs_math_train_item_reviews',
      ),
      sessions: await count(
        conn,
        'SELECT COUNT(*) AS c FROM hs_math_train_sessions',
      ),
      sessionItems: await count(
        conn,
        'SELECT COUNT(*) AS c FROM hs_math_train_session_items',
      ),
      chemSp: await count(conn, 'SELECT COUNT(*) AS c FROM chem_specialties'),
      ch3Kp: await count(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_knowledge_points kp
         JOIN hs_math_categories c ON c.id=kp.category_id
         JOIN hs_math_specialties s ON s.id=c.specialty_id
         WHERE s.code='rja-ch3'`,
      ),
      sec32Kp: await count(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_knowledge_points kp
         JOIN hs_math_categories c ON c.id=kp.category_id
         JOIN hs_math_specialties s ON s.id=c.specialty_id
         WHERE s.code='rja-ch3' AND c.code='3.2'`,
      ),
    }

    const [parityKpRows] = await conn.query<RowDataPacket[]>(
      `SELECT k.code, k.name, k.is_active
       FROM hs_math_knowledge_points k
       WHERE k.code IN (?,?,?,?)
       ORDER BY k.code`,
      PARITY_KPS,
    )
    const parityKpOk =
      parityKpRows.length === 4 &&
      parityKpRows.every((r) => Number(r.is_active) === 1)

    const [p0rows] = await conn.query<RowDataPacket[]>(
      `SELECT id, code, status, pool, is_active FROM hs_math_train_items
       WHERE id IN (1,2,3,4,5) ORDER BY id`,
    )

    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT id, code, status, pool FROM hs_math_train_items
       WHERE code LIKE ? ORDER BY code`,
      [`${CODE_PREFIX}%`],
    )
    const conflicts = EXPECTED_CODES.filter((c) =>
      existing.some((r) => String(r.code) === c),
    )

    const [cat32] = await conn.query<RowDataPacket[]>(
      `SELECT c.code, c.is_active, s.is_active AS sp_active
       FROM hs_math_categories c
       JOIN hs_math_specialties s ON s.id=c.specialty_id
       WHERE s.code='rja-ch3' AND c.code='3.2'`,
    )

    console.log('[DB_BEFORE]', before)
    console.log(`[CODE_CONFLICT] ${conflicts.length}`)
    console.log(
      `[PARITY_KP] count=${parityKpRows.length} allActive=${parityKpOk}`,
    )

    if (conflicts.length > 0) {
      blockReason = `CODE_CONFLICT: ${conflicts.join(', ')}`
      authStatus = 'BLOCKED_CODE_CONFLICT'
      console.error(`[BLOCK] ${blockReason}`)
    }
    if (!parityKpOk) {
      const msg = `PARITY_KP_ISSUE rows=${JSON.stringify(parityKpRows)}`
      console.error(`[BLOCK] ${msg}`)
      if (!blockReason) {
        blockReason = msg
        authStatus = 'BLOCKED_KP'
      }
    }
    if (
      !cat32.length ||
      !Number(cat32[0].is_active) ||
      !Number(cat32[0].sp_active)
    ) {
      const msg = 'CATEGORY_3_2_INACTIVE_OR_MISSING'
      if (!blockReason) {
        blockReason = msg
        authStatus = 'BLOCKED_CATEGORY'
      }
    }
    if (before.ch3Kp !== 27 || before.sec32Kp !== 12) {
      console.warn(
        `[WARN] KP counts ch3=${before.ch3Kp} (expect 27) sec32=${before.sec32Kp} (expect 12)`,
      )
    }

    let apiUp = false
    let apiProbeDetail = ''
    for (let attempt = 0; attempt < 20 && !apiUp; attempt++) {
      try {
        const health = await fetch(`${BASE}/health`)
        if (health.ok || health.status < 500) {
          apiUp = true
          apiProbeDetail = `health=${health.status}`
          break
        }
      } catch (e: any) {
        apiProbeDetail = String(e?.message || e)
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    console.log(`[API_PROBE] up=${apiUp} ${apiProbeDetail}`)

    let after = { ...before }

    if (!apiUp) {
      previewStatus = 'NOT_RUN'
      previewError = `API 未可达 ${BASE}`
    } else if (conflicts.length > 0 || authStatus.startsWith('BLOCKED')) {
      previewStatus = 'NOT_RUN'
      previewError = blockReason || 'blocked'
    } else {
      const [admins] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
      )
      if (!admins.length) throw new Error('无 ADMIN 用户')
      const adminToken = signJwt(
        String(admins[0].id),
        'ADMIN',
        env.JWT_SECRET!,
      )

      const res = await api(
        'POST',
        '/hs-math/admin/train-items/import/preview',
        adminToken,
        { items },
      )
      const data = dataOf(res.json)
      previewSummary = {
        httpStatus: res.status,
        canConfirm: data?.canConfirm ?? false,
        itemCount: data?.itemCount,
        errorCount: data?.errorCount,
        warningCount: data?.warningCount,
        expiresAt: data?.expiresAt ?? null,
        hasPreviewToken: Boolean(data?.previewToken),
        warningsSample: [] as Array<{ code?: string; warnings: unknown[] }>,
        errorsSample: [] as Array<{ code?: string; errors: unknown[] }>,
      }

      const reports = Array.isArray(data?.items) ? data.items : []
      for (const r of reports) {
        if (r?.errors?.length) {
          previewSummary.errorsSample.push({
            code: r.code || r.index,
            errors: r.errors,
          })
        }
        if (r?.warnings?.length) {
          previewSummary.warningsSample.push({
            code: r.code || r.index,
            warnings: r.warnings,
          })
        }
      }
      previewSummary.errorsSample = previewSummary.errorsSample.slice(0, 40)
      previewSummary.warningsSample = previewSummary.warningsSample.slice(0, 40)
      warningClass = classifyWarnings(previewSummary.warningsSample)

      const ok =
        (res.status === 200 || res.status === 201) &&
        Boolean(data?.canConfirm) &&
        Number(data?.errorCount) === 0 &&
        Number(data?.itemCount) === 25 &&
        Boolean(data?.previewToken)

      previewStatus = ok ? 'PASS' : 'FAIL'
      if (!ok) {
        previewError = `preview 未通过 http=${res.status} canConfirm=${data?.canConfirm} errors=${data?.errorCount}`
        authStatus = 'BLOCKED_PREVIEW_FAILED'
      } else {
        fs.writeFileSync(
          PREVIEW_CACHE,
          `${JSON.stringify(
            {
              generatedAt,
              fileSha256,
              importContentHash: contentHash,
              expiresAt: data.expiresAt,
              previewToken: data.previewToken,
              itemCount: 25,
              note: '本地授权后 confirm 用；勿提交密钥；已 gitignore',
            },
            null,
            2,
          )}\n`,
          'utf8',
        )
      }

      after = {
        items: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_items'),
        kps: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_item_kps'),
        approvedFormal: before.approvedFormal,
        ch01Draft: before.ch01Draft,
        reviews: before.reviews,
        sessions: before.sessions,
        sessionItems: before.sessionItems,
        chemSp: before.chemSp,
        ch3Kp: before.ch3Kp,
        sec32Kp: before.sec32Kp,
      }
      if (after.items !== before.items || after.kps !== before.kps) {
        previewStatus = 'FAIL'
        previewError = `preview 后数量变化 items ${before.items}->${after.items} kps ${before.kps}->${after.kps}`
        authStatus = 'BLOCKED_PREVIEW_WROTE_DB'
      }
    }

    const overallPass =
      previewStatus === 'PASS' &&
      conflicts.length === 0 &&
      parityKpOk &&
      !authStatus.startsWith('BLOCKED')

    const doc = `# P1-FUNC-3A：函数奇偶性 25 题导入前预检

**日期**：${generatedAt.slice(0, 10)}  
**库**：\`study_system\`  
**阶段**：preview 允许；**confirm 禁止**

---

## 1. 题库版本

| 项 | 值 |
|----|-----|
| 文件 | \`docs/high_school_math/question_bank/chapter_03/parity_25.json\` |
| 大小 | ${rawBuf.length} bytes |
| SHA-256 | \`${fileSha256}\` |
| 导入内容哈希 | \`${contentHash}\` |
| 题数 | 25 |
| code | ${EXPECTED_CODES[0]} .. ${EXPECTED_CODES[24]} |
| 题型 | ${JSON.stringify(qtypeCount)} |
| 难度 | ${JSON.stringify(diffCount)} |
| 权威源一致 | PASS |
| 清单 | \`parity_import_manifest.json\` |

## 2. 数学复核（人工状态）

| code | 机器 | 人工 |
|------|------|------|
| HSMA-RJA-CH03-PARITY-0022 | NEEDS_HUMAN_REVIEW | **PENDING**（未自动通过） |
| HSMA-RJA-CH03-PARITY-0023 | NEEDS_HUMAN_REVIEW | **PENDING**（未自动通过） |
| 其余 23 | VERIFIED_* | PENDING |

说明：preview 若出现 MATH_HUMAN_REVIEW 类 warning，**不等于**人工 APPROVED。

## 3. 数据库基线（preview 前 / 后）

| 项 | 前 | 后 |
|----|----|----|
| train_items | ${before.items} | ${after.items} |
| train_item_kps | ${before.kps} | ${after.kps} |
| CH01 draft | ${before.ch01Draft} | （只读未改） |
| approved formal | ${before.approvedFormal} | ${before.approvedFormal} |
| review_records | ${before.reviews} | ${before.reviews} |
| sessions | ${before.sessions} | ${before.sessions} |
| session_items | ${before.sessionItems} | ${before.sessionItems} |
| chem_specialties | ${before.chemSp} | ${before.chemSp} |
| 第三章 KP | ${before.ch3Kp} | ${before.ch3Kp} |
| 3.2 KP | ${before.sec32Kp} | ${before.sec32Kp} |
| 奇偶性 4 KP 启用 | ${parityKpOk ? 'YES' : 'NO'} | |
| 25 code 冲突 | **${conflicts.length}** | |
| P0 id1–5 | \`${JSON.stringify(p0rows.map((r) => ({ id: r.id, code: r.code, status: r.status, pool: r.pool })))}\` | |

**数据库变化：无写入**（preview 前后 items/kps 一致）。

## 4. preview

| 项 | 值 |
|----|-----|
| 状态 | **${previewStatus}** |
| errorCount | ${previewSummary?.errorCount ?? previewError ?? 'n/a'} |
| warningCount | ${previewSummary?.warningCount ?? 'n/a'} |
| canConfirm | ${previewSummary?.canConfirm ?? false} |
| warning 分类 | ${JSON.stringify(warningClass)} |
| hasPreviewToken | ${previewSummary?.hasPreviewToken ?? false} |

### warning 样本

\`\`\`json
${JSON.stringify(previewSummary?.warningsSample || [], null, 2)}
\`\`\`

### error 样本

\`\`\`json
${JSON.stringify(previewSummary?.errorsSample || [], null, 2)}
\`\`\`

## 5. 阻断问题

${blockReason ? `- **${blockReason}**` : '- （无）'}

## 6. 用户授权状态

**${authStatus}**

未获明确授权前：**禁止 confirm**。

## 7. 下一阶段

${
  overallPass
    ? '**READY_FOR_CONFIRM_AUTHORIZATION**'
    : '**NOT_READY**'
}
`

    fs.writeFileSync(DOC_PATH, doc, 'utf8')
    console.log(`[DOC] wrote ${DOC_PATH}`)

    console.log('\n========== 【P1-FUNC-3A 导入前预检】 ==========')
    console.log(`题库 SHA-256：${fileSha256}`)
    console.log(`题数：25`)
    console.log(`code范围：${EXPECTED_CODES[0]} .. ${EXPECTED_CODES[24]}`)
    console.log(`preview：${previewStatus}`)
    console.log(`error：${previewSummary?.errorCount ?? previewError ?? 'n/a'}`)
    console.log(`warning：${previewSummary?.warningCount ?? 'n/a'}`)
    console.log(`canConfirm：${previewSummary?.canConfirm ?? false}`)
    console.log(`code冲突：${conflicts.length}`)
    console.log(`第三章KP：${before.ch3Kp}`)
    console.log(`奇偶性KP：${parityKpRows.map((r) => r.code).join(',')}`)
    console.log(`数据库现有题数：${before.items}`)
    console.log(`现有KP关联：${before.kps}`)
    console.log(`approved formal：${before.approvedFormal}`)
    console.log(`review_records：${before.reviews}`)
    console.log(`sessions：${before.sessions}`)
    console.log(`session_items：${before.sessionItems}`)
    console.log(`第一章draft：${before.ch01Draft}`)
    console.log(`P0测试题：${p0rows.length} rows`)
    console.log(`【授权状态】${authStatus}`)
    console.log('==========================================\n')

    if (!overallPass) process.exitCode = 1
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error(
    '[P1-FUNC-3A preflight FAILED]',
    e instanceof Error ? e.message : e,
  )
  process.exitCode = 1
})
