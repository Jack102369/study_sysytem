/**
 * P1-0F-C1：1.1《集合的概念》只读核查（SELECT only，绝不写库/批准）。
 *
 * pnpm --filter api run hs-math:p1-0fc1-audit
 */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { createConnection, type RowDataPacket } from 'mysql2/promise'
import {
  canonicalizeImportItem,
  fingerprintCanonicalItem,
} from './import-preview-token'
import { validateAnswerPayload } from './answer-payload.validate'

const EXPECTED_SHA =
  '89b6484e6cb69f40437a6b28f603abae3c9eb19c0b08157d27947f72f7ec95c9'
const ROOT = path.resolve(__dirname, '../../../../../')
const BANK_JSON = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/chapter_01_all.json',
)
const MANIFEST = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/import_manifest.json',
)
const OUT_JSON = path.join(
  ROOT,
  'docs/high_school_math/question_bank/chapter_01/.p1_0fc1_section11_snapshot.json',
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

async function main() {
  const env = loadEnv()
  if ((env.DB_NAME || 'study_system') !== 'study_system') {
    throw new Error('DB_NAME must be study_system')
  }

  const buf = fs.readFileSync(BANK_JSON)
  const sha = crypto.createHash('sha256').update(buf).digest('hex')
  const bank = JSON.parse(buf.toString('utf8')) as { items: any[] }
  const bank11 = bank.items.filter((it) => it.categoryCode === '1.1')
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as {
    items: Array<{ code: string; contentFingerprint: string }>
  }
  const fpMap = new Map(manifest.items.map((x) => [x.code, x.contentFingerprint]))

  const conn = await createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: 'study_system',
  })

  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT t.id, t.code, t.pool, t.qtype, t.difficulty, t.stem, t.options_json,
              t.answer_payload_json, t.analysis, t.status, t.is_active,
              t.content_version, t.grade_rule_version,
              s.code AS specialty_code, s.name AS specialty_name, s.is_active AS sp_active,
              c.code AS category_code, c.name AS category_name, c.is_active AS cat_active
       FROM hs_math_train_items t
       JOIN hs_math_specialties s ON s.id = t.specialty_id
       JOIN hs_math_categories c ON c.id = t.category_id
       WHERE s.code = 'rja-ch1' AND c.code = '1.1'
       ORDER BY t.code`,
    )

    const [links] = await conn.query<RowDataPacket[]>(
      `SELECT t.code AS item_code, k.code AS kp_code, l.is_primary,
              k.is_active AS kp_active, kc.code AS kp_category_code
       FROM hs_math_train_item_kps l
       JOIN hs_math_train_items t ON t.id = l.item_id
       JOIN hs_math_knowledge_points k ON k.id = l.knowledge_point_id
       JOIN hs_math_categories kc ON kc.id = k.category_id
       JOIN hs_math_categories tc ON tc.id = t.category_id
       JOIN hs_math_specialties s ON s.id = t.specialty_id
       WHERE s.code = 'rja-ch1' AND tc.code = '1.1'
       ORDER BY t.code, l.is_primary DESC, k.code`,
    )

    const [kpTotal] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM hs_math_train_item_kps`,
    )

    const linksByCode = new Map<string, RowDataPacket[]>()
    for (const l of links) {
      const c = String(l.item_code)
      if (!linksByCode.has(c)) linksByCode.set(c, [])
      linksByCode.get(c)!.push(l)
    }

    const bankByCode = new Map(bank11.map((it) => [String(it.code), it]))
    const comparisons: any[] = []
    let match = 0
    let mismatch = 0

    for (const row of rows) {
      const code = String(row.code)
      const src = bankByCode.get(code)
      const itemLinks = linksByCode.get(code) || []
      const kpCodes = itemLinks.map((l) => String(l.kp_code)).sort()
      const primary = itemLinks.find((l) => Number(l.is_primary) === 1)
      const primaryCode = primary ? String(primary.kp_code) : ''
      const entry: any = {
        code,
        db: {
          id: String(row.id),
          specialty: row.specialty_code,
          category: row.category_code,
          categoryName: row.category_name,
          qtype: row.qtype,
          difficulty: Number(row.difficulty),
          status: row.status,
          pool: row.pool,
          isActive: Number(row.is_active),
          contentVersion: Number(row.content_version),
          stem: row.stem,
          options: row.options_json,
          answerPayload: row.answer_payload_json,
          analysis: row.analysis,
          kpCodes,
          primaryKp: primaryCode,
          kpDetail: itemLinks.map((l) => ({
            code: l.kp_code,
            primary: Number(l.is_primary) === 1,
            kpCategory: l.kp_category_code,
            active: Number(l.kp_active) === 1,
          })),
        },
        bankPresent: Boolean(src),
        contentMatch: false,
        kpMatch: false,
        issues: [] as string[],
      }

      if (String(row.status) !== 'draft') entry.issues.push(`status=${row.status}`)
      if (String(row.pool) !== 'formal') entry.issues.push(`pool=${row.pool}`)
      if (String(row.specialty_code) !== 'rja-ch1') {
        entry.issues.push(`specialty=${row.specialty_code}`)
      }
      if (String(row.category_code) !== '1.1') {
        entry.issues.push(`category=${row.category_code}`)
      }
      if (!src) {
        entry.issues.push('MISSING_IN_BANK_1_1')
        mismatch++
        comparisons.push(entry)
        continue
      }

      let dbNorm: { optionsJson: unknown; answerPayload: unknown }
      let importNorm: { optionsJson: unknown; answerPayload: unknown }
      try {
        dbNorm = validateAnswerPayload({
          qtype: row.qtype as any,
          optionsJson: row.options_json,
          answerPayload: row.answer_payload_json,
        })
        importNorm = validateAnswerPayload({
          qtype: src.qtype,
          optionsJson: src.options ?? null,
          answerPayload: src.answerPayload,
        })
      } catch (e: any) {
        entry.issues.push(`ANSWER_PROTOCOL:${e?.message || e}`)
        mismatch++
        comparisons.push(entry)
        continue
      }

      const dbCanon = {
        code,
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
        difficulty: Number(src.difficulty),
      })!
      importCanon.difficulty = Number(importCanon.difficulty)

      const dbFp = fingerprintCanonicalItem(dbCanon)
      const importFp = fingerprintCanonicalItem(importCanon)
      entry.contentMatch = dbFp === importFp
      entry.dbFingerprint = dbFp
      entry.bankFingerprint = importFp
      entry.manifestFingerprint = fpMap.get(code) || null

      const bankKp = [...(src.knowledgePointCodes || [])].map(String).sort()
      entry.kpMatch =
        JSON.stringify(bankKp) === JSON.stringify(kpCodes) &&
        String(src.primaryKnowledgePointCode) === primaryCode
      if (!entry.kpMatch) entry.issues.push('KP_MISMATCH')
      if (!entry.contentMatch) entry.issues.push('CONTENT_MISMATCH')
      if (Number(row.content_version) !== 1) {
        entry.issues.push(`content_version=${row.content_version}`)
      }
      if (itemLinks.filter((l) => Number(l.is_primary) === 1).length !== 1) {
        entry.issues.push('PRIMARY_KP_COUNT')
      }

      if (entry.contentMatch && entry.kpMatch && entry.issues.length === 0) {
        match++
      } else {
        mismatch++
      }
      comparisons.push(entry)
    }

    // bank-only missing in DB
    for (const it of bank11) {
      if (!rows.some((r) => String(r.code) === String(it.code))) {
        mismatch++
        comparisons.push({
          code: it.code,
          bankPresent: true,
          contentMatch: false,
          issues: ['MISSING_IN_DB'],
        })
      }
    }

    const snapshot = {
      generatedAt: new Date().toISOString(),
      readOnly: true,
      sha256: sha,
      shaMatch: sha === EXPECTED_SHA,
      bank11Count: bank11.length,
      db11Count: rows.length,
      kpLinks11: links.length,
      kpLinksTotal: Number((kpTotal[0] as any).c),
      contentMatch: match,
      contentMismatch: mismatch,
      items: comparisons,
      bankItems: bank11,
    }
    fs.writeFileSync(OUT_JSON, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')

    console.log(
      JSON.stringify(
        {
          sha,
          shaMatch: sha === EXPECTED_SHA,
          bank11Count: bank11.length,
          db11Count: rows.length,
          codes: rows.map((r) => r.code),
          statuses: [...new Set(rows.map((r) => r.status))],
          contentMatch: match,
          contentMismatch: mismatch,
          kpLinks11: links.length,
          kpLinksTotal: Number((kpTotal[0] as any).c),
          issueCodes: comparisons
            .filter((c) => c.issues?.length)
            .map((c) => ({ code: c.code, issues: c.issues })),
        },
        null,
        2,
      ),
    )
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
