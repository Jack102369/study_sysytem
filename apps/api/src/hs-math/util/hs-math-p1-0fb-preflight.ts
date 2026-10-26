/**
 * P1-0F-B 导入前预检（只读 DB + HTTP preview，绝不 confirm）。
 *
 * - 生成 chapter_01/import_manifest.json（文件 SHA-256 + 逐题内容指纹）
 * - SELECT 核对 study_system 现状与 80 code 冲突
 * - POST /hs-math/admin/train-items/import/preview
 * - 写出 docs/.../20_p1_0fb_import_acceptance.md 预检段
 *
 * 运行：pnpm --filter api run hs-math:p1-0fb-preflight
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
const DOC_PATH = path.join(
  ROOT,
  'docs/high_school_math/20_p1_0fb_import_acceptance.md',
)
const PREVIEW_CACHE = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/.p1_0fb_preview_cache.json',
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

function verifyApiVersionOnDisk(): {
  status: 'VERIFIED' | 'API_VERSION_NOT_VERIFIED'
  detail: string
} {
  const importJs = path.join(
    __dirname,
    '../../dist/hs-math/admin/hs-math-admin-train-items-import.service.js',
  )
  const tokenJs = path.join(
    __dirname,
    '../../dist/hs-math/util/import-preview-token.js',
  )
  // ts-node 运行时 __dirname 在 src；dist 相对 apps/api
  const distImport = path.resolve(
    __dirname,
    '../../../dist/hs-math/admin/hs-math-admin-train-items-import.service.js',
  )
  const distToken = path.resolve(
    __dirname,
    '../../../dist/hs-math/util/import-preview-token.js',
  )
  const srcImport = path.resolve(
    __dirname,
    '../admin/hs-math-admin-train-items-import.service.ts',
  )
  const checks: string[] = []
  const srcOk =
    fs.existsSync(srcImport) &&
    fs.readFileSync(srcImport, 'utf8').includes('fingerprintCanonicalItem')
  checks.push(srcOk ? 'src:fingerprintCanonicalItem' : 'src:MISSING_fingerprint')
  const distPath = fs.existsSync(distImport) ? distImport : importJs
  const tokenPath = fs.existsSync(distToken) ? distToken : tokenJs
  const distOk =
    fs.existsSync(distPath) &&
    fs.readFileSync(distPath, 'utf8').includes('fingerprintCanonicalItem')
  const tokenOk =
    fs.existsSync(tokenPath) &&
    fs.readFileSync(tokenPath, 'utf8').includes('hs-math-import-v1')
  checks.push(distOk ? 'dist:fingerprintCanonicalItem' : 'dist:MISSING_fingerprint')
  checks.push(tokenOk ? 'dist:hs-math-import-v1' : 'dist:MISSING_token_v1')
  if (srcOk && distOk && tokenOk) {
    return { status: 'VERIFIED', detail: checks.join('; ') }
  }
  return { status: 'API_VERSION_NOT_VERIFIED', detail: checks.join('; ') }
}

async function main() {
  const env = loadEnv()
  const dbName = env.DB_NAME || 'study_system'
  if (dbName !== 'study_system') {
    throw new Error(`要求 DB_NAME=study_system，当前=${dbName}`)
  }
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET missing')

  const apiVer = verifyApiVersionOnDisk()
  console.log(`[API_VERSION] ${apiVer.status}: ${apiVer.detail}`)

  if (!fs.existsSync(BANK_JSON)) throw new Error(`缺少 ${BANK_JSON}`)
  const rawBuf = fs.readFileSync(BANK_JSON)
  const fileSha256 = crypto.createHash('sha256').update(rawBuf).digest('hex')
  const bank = JSON.parse(rawBuf.toString('utf8')) as { items: unknown[] }
  if (!Array.isArray(bank.items) || bank.items.length !== 80) {
    throw new Error(`chapter_01_all.json items 应为 80，实际 ${bank.items?.length}`)
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

  const contentHash = hashImportItems(items)
  const generatedAt = new Date().toISOString()
  const manifest = {
    phase: 'P1-0F-B',
    purpose: 'import verification only — not an import payload',
    file: {
      path: 'docs/high_school_math/question_bank/chapter_01/chapter_01_all.json',
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
    },
    items: itemFingerprints,
  }
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`[MANIFEST] wrote ${MANIFEST_PATH}`)
  console.log(`[MANIFEST] fileSha256=${fileSha256} contentHash=${contentHash}`)

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
  let afterPreviewItems = 0
  let afterPreviewKps = 0
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
      draft: await count(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE status='draft'`,
      ),
      disabled: await count(
        conn,
        `SELECT COUNT(*) AS c FROM hs_math_train_items WHERE status='disabled'`,
      ),
      sessions: await count(conn, 'SELECT COUNT(*) AS c FROM hs_math_train_sessions'),
      sessionItems: await count(
        conn,
        'SELECT COUNT(*) AS c FROM hs_math_train_session_items',
      ),
    }

    const [p0rows] = await conn.query<RowDataPacket[]>(
      `SELECT id, code, status, pool, is_active FROM hs_math_train_items
       WHERE id IN (1,2,3,4,5) ORDER BY id`,
    )

    const [cats] = await conn.query<RowDataPacket[]>(
      `SELECT c.code, c.name, c.is_active, s.code AS specialty_code
       FROM hs_math_categories c
       JOIN hs_math_specialties s ON s.id = c.specialty_id
       WHERE s.code = 'rja-ch1'
       ORDER BY c.code`,
    )
    const [kps] = await conn.query<RowDataPacket[]>(
      `SELECT k.code, k.name, k.is_active
       FROM hs_math_knowledge_points k
       JOIN hs_math_categories c ON c.id = k.category_id
       JOIN hs_math_specialties s ON s.id = c.specialty_id
       WHERE s.code = 'rja-ch1'
       ORDER BY k.code`,
    )

    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT id, code, status, pool, qtype, difficulty
       FROM hs_math_train_items
       WHERE code LIKE ?
       ORDER BY code`,
      [`${CODE_PREFIX}%`],
    )
    const existingSet = new Set(existing.map((r) => String(r.code)))
    const conflicts = EXPECTED_CODES.filter((c) => existingSet.has(c))
    const similarOthers = existing.filter(
      (r) => !EXPECTED_CODES.includes(String(r.code)),
    )

    console.log('[DB_BEFORE]', before)
    console.log(`[CODE_CONFLICT] ${conflicts.length}`)
    console.log(`[SIMILAR_OTHER] ${similarOthers.length}`)
    console.log(`[CATS] ${cats.length} active=${cats.filter((c) => c.is_active).length}`)
    console.log(`[KPS] ${kps.length} active=${kps.filter((k) => k.is_active).length}`)

    const catsInactive = cats.filter((c) => !Number(c.is_active))
    const kpsInactive = kps.filter((k) => !Number(k.is_active))
    const ch1Codes = ['1.1', '1.2', '1.3', '1.4', '1.5']
    const missingCats = ch1Codes.filter((c) => !cats.some((r) => r.code === c))

    if (conflicts.length > 0) {
      blockReason = `CODE_CONFLICT: ${conflicts.length} codes already exist (e.g. ${conflicts.slice(0, 5).join(', ')})`
      authStatus = 'BLOCKED_CODE_CONFLICT'
      console.error(`[BLOCK] ${blockReason}`)
    }
    if (missingCats.length || catsInactive.length) {
      const msg = `CATEGORY_ISSUE missing=${missingCats.join('|') || '-'} inactive=${catsInactive.map((c) => c.code).join('|') || '-'}`
      console.warn(`[WARN] ${msg}`)
      if (!blockReason) blockReason = msg
    }
    if (kps.length < 15 || kpsInactive.length) {
      const msg = `KP_ISSUE count=${kps.length} inactive=${kpsInactive.map((k) => k.code).join('|') || '-'}`
      console.warn(`[WARN] ${msg}`)
      if (!blockReason && (kps.length < 15 || kpsInactive.length === kps.length)) {
        blockReason = msg
      }
    }

    // HTTP API probe（优先 /health；热重载窗口可能短暂失败）
    let apiUp = false
    let apiProbeDetail = ''
    // nest --watch 可能因本目录源文件变更短暂重启；多等一会儿
    for (let attempt = 0; attempt < 30 && !apiUp; attempt++) {
      try {
        const health = await fetch(`${BASE}/health`)
        if (health.ok || health.status < 500) {
          apiUp = true
          apiProbeDetail = `health=${health.status} attempt=${attempt + 1}`
          break
        }
        apiProbeDetail = `health_status=${health.status}`
      } catch (e: any) {
        apiProbeDetail = `health_err=${e?.cause?.code || e?.message || e}`
      }
      if (!apiUp) {
        try {
          const probe = await api(
            'POST',
            '/hs-math/admin/train-items/import/preview',
            null,
            { items: [] },
          )
          if (
            probe.status === 401 ||
            probe.status === 400 ||
            probe.status === 403
          ) {
            apiUp = true
            apiProbeDetail = `preview_unauth=${probe.status} attempt=${attempt + 1}`
            break
          }
          apiProbeDetail = `unexpected_status=${probe.status}`
        } catch (e: any) {
          apiProbeDetail = `preview_err=${e?.cause?.code || e?.message || e}`
        }
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    console.log(`[API_PROBE] up=${apiUp} ${apiProbeDetail}`)

    if (!apiUp) {
      previewStatus = 'NOT_RUN'
      previewError = `API 未可达 ${BASE}`
      authStatus = 'WAITING_FOR_CONFIRM_AUTHORIZATION'
      if (apiVer.status === 'API_VERSION_NOT_VERIFIED') {
        authStatus = 'API_VERSION_NOT_VERIFIED'
      }
    } else if (conflicts.length > 0) {
      previewStatus = 'NOT_RUN'
      previewError = blockReason
    } else if (apiVer.status === 'API_VERSION_NOT_VERIFIED') {
      previewStatus = 'NOT_RUN'
      previewError = 'API_VERSION_NOT_VERIFIED — 禁止正式写入；preview 亦跳过以免误导'
      authStatus = 'API_VERSION_NOT_VERIFIED'
    } else {
      const [admins] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`,
      )
      if (!admins.length) throw new Error('无 ADMIN 用户')
      const adminToken = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET)

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
        // 不落盘完整 token；仅缓存哈希绑定信息供授权后续使用
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
      // 限制样本长度
      previewSummary.errorsSample = previewSummary.errorsSample.slice(0, 40)
      previewSummary.warningsSample = previewSummary.warningsSample.slice(0, 40)

      const ok =
        res.status === 200 || res.status === 201
          ? Boolean(data?.canConfirm) &&
            Number(data?.errorCount) === 0 &&
            Number(data?.itemCount) === 80 &&
            Boolean(data?.previewToken)
          : false

      previewStatus = ok ? 'PASS' : 'FAIL'
      if (!ok) {
        previewError = `preview 未通过 http=${res.status} canConfirm=${data?.canConfirm} errors=${data?.errorCount}`
        authStatus = 'BLOCKED_PREVIEW_FAILED'
      } else {
        // 缓存 confirm 所需绑定（不含 JWT 登录密钥；previewToken 写入本地缓存供授权后脚本使用）
        fs.writeFileSync(
          PREVIEW_CACHE,
          `${JSON.stringify(
            {
              generatedAt,
              fileSha256,
              importContentHash: contentHash,
              expiresAt: data.expiresAt,
              previewToken: data.previewToken,
              itemCount: 80,
              note: '本地授权后 confirm 用；勿提交密钥类信息到公开渠道；.gitignore 建议忽略',
            },
            null,
            2,
          )}\n`,
          'utf8',
        )
      }

      afterPreviewItems = await count(
        conn,
        'SELECT COUNT(*) AS c FROM hs_math_train_items',
      )
      afterPreviewKps = await count(
        conn,
        'SELECT COUNT(*) AS c FROM hs_math_train_item_kps',
      )
      if (
        afterPreviewItems !== before.items ||
        afterPreviewKps !== before.kps
      ) {
        previewStatus = 'FAIL'
        previewError = `preview 后数量变化 items ${before.items}->${afterPreviewItems} kps ${before.kps}->${afterPreviewKps}`
        authStatus = 'BLOCKED_PREVIEW_WROTE_DB'
      }
    }

    const doc = `# P1-0F-B 受控导入验收（预检）

> 阶段：准备 + 只读预检 + preview。**尚未 confirm。**
> 生成时间：${generatedAt}

## 题库版本

| 项 | 值 |
|----|-----|
| 文件 | \`docs/high_school_math/question_bank/chapter_01/chapter_01_all.json\` |
| 大小 | ${rawBuf.length} bytes |
| SHA-256 | \`${fileSha256}\` |
| 导入内容哈希 | \`${contentHash}\` |
| 题数 | 80 |
| code | ${EXPECTED_CODES[0]} .. ${EXPECTED_CODES[79]} |
| 题型 | ${JSON.stringify(qtypeCount)} |
| 难度 | ${JSON.stringify(diffCount)} |
| 清单 | \`import_manifest.json\` |

校验工具重写 JSON 后 SHA 与检查前对比：由执行报告记录（本脚本读取当前文件）。

## API 版本

| 项 | 值 |
|----|-----|
| 状态 | **${apiVer.status}** |
| 细节 | ${apiVer.detail} |
| 运行探测 | ${BASE} |

## 数据库写入前（只读）

| 项 | 值 |
|----|-----|
| train_items | ${before.items} |
| train_item_kps | ${before.kps} |
| approved formal | ${before.approvedFormal} |
| draft | ${before.draft} |
| disabled | ${before.disabled} |
| sessions | ${before.sessions} |
| session_items | ${before.sessionItems} |
| P0 id1-5 | ${JSON.stringify(p0rows)} |
| 80 code 冲突 | **${conflicts.length}** |
| 相似其他 code | ${similarOthers.length} |
| 章节 rja-ch1 | ${cats.length}（inactive ${catsInactive.length}） |
| KP rja-ch1 | ${kps.length}（inactive ${kpsInactive.length}） |

### 章节明细

${cats.map((c) => `- ${c.code} active=${c.is_active}`).join('\n') || '_无_'}

### 知识点明细

${kps.map((k) => `- ${k.code} active=${k.is_active}`).join('\n') || '_无_'}

${
  conflicts.length
    ? `### CODE 冲突列表\n\n${conflicts.map((c) => `- ${c}`).join('\n')}`
    : '### CODE 冲突\n\n无'
}

## preview

| 项 | 值 |
|----|-----|
| 状态 | **${previewStatus}** |
| error | ${previewError || '0'} |
| summary | ${previewSummary ? JSON.stringify({
      httpStatus: previewSummary.httpStatus,
      canConfirm: previewSummary.canConfirm,
      itemCount: previewSummary.itemCount,
      errorCount: previewSummary.errorCount,
      warningCount: previewSummary.warningCount,
      expiresAt: previewSummary.expiresAt,
      hasPreviewToken: previewSummary.hasPreviewToken,
    }) : 'null'} |
| preview 后 items | ${afterPreviewItems || before.items} |
| preview 后 kps | ${afterPreviewKps || before.kps} |

### warning 样本

\`\`\`json
${JSON.stringify(previewSummary?.warningsSample || [], null, 2)}
\`\`\`

### error 样本

\`\`\`json
${JSON.stringify(previewSummary?.errorsSample || [], null, 2)}
\`\`\`

## 预计写入（授权后）

- 80 条 \`hs_math_train_items\`（status=**draft**, pool=formal）
- 对应 \`hs_math_train_item_kps\` 关联
- 正式可抽题池变化：**0**（仍要求 approved）

## 用户授权

**${authStatus}**

请明确回复（等效授权亦可）：

> 确认将第一章80道题导入 study_system，全部保持 draft，不执行批准。

未获授权前：**禁止 confirm**。

## confirm / 导入后核对

NOT_RUN（等待授权）

## P1-0F-C 准入

NOT_READY（未完成真实导入与完整性验收）
`

    fs.writeFileSync(DOC_PATH, doc, 'utf8')
    console.log(`[DOC] wrote ${DOC_PATH}`)

    console.log('\n========== 【P1-0F-B 导入前预检】 ==========')
    console.log(`题库文件 SHA-256：${fileSha256}`)
    console.log(`总题数：80`)
    console.log(`preview：${previewStatus}`)
    console.log(
      `error：${previewSummary?.errorCount ?? previewError ?? 'n/a'}`,
    )
    console.log(`warning：${previewSummary?.warningCount ?? 'n/a'}`)
    console.log(`数据库现有题数：${before.items}`)
    console.log(`数据库现有 KP 关联数：${before.kps}`)
    console.log(`approved 正式题数：${before.approvedFormal}`)
    console.log(`80个 code 冲突数：${conflicts.length}`)
    console.log(
      `章节状态：${cats.length} 小节，inactive=${catsInactive.length}`,
    )
    console.log(`知识点状态：${kps.length} KP，inactive=${kpsInactive.length}`)
    console.log(`API 版本：${apiVer.status}`)
    console.log('预计写入：80 条 draft + KP 关联')
    console.log('预计正式题池变化：0')
    console.log(`【授权状态】${authStatus}`)
    console.log('==========================================\n')

    if (previewStatus === 'FAIL' || authStatus.startsWith('BLOCKED')) {
      process.exitCode = 1
    }
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error('[P1-0F-B preflight FAILED]', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
