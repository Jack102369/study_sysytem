/**
 * POST_STEP_13 PHASE_A：只读库诊断（严禁写）。
 * pnpm --filter api run chem:industrial-readonly-audit
 *
 * 仅执行 SELECT / SHOW / INFORMATION_SCHEMA。
 * 不调用 ensureSeeded、不写库、不迁移。
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import * as mysql from 'mysql2/promise'

type AuditOut = {
  connected: boolean
  dbName: string | null
  mysqlVersion: string | null
  connectionError: string | null
  tables: Record<string, 'present' | 'absent'>
  d043: 'present' | 'absent' | 'drift' | 'not_checked'
  d045: 'present' | 'absent' | 'drift' | 'not_checked'
  d043Columns: string[]
  d045Columns: string[]
  industrial: {
    specialtyPresent: boolean | null
    categoryCount: number | null
    formalItemCount: number | null
    testItemCount: number | null
    formalWithKbLinks: number | null
    formalWithAssets: number | null
    formalEligibleApprox: number | null
    note: string
  }
  readOnlyGuarantee: string
}

function repoRoot(): string {
  const cwd = process.cwd()
  for (const r of [cwd, join(cwd, '..'), join(cwd, '..', '..')]) {
    if (existsSync(join(r, 'db', 'init.sql'))) return r
  }
  return cwd
}

function loadEnv(): Record<string, string> {
  const root = repoRoot()
  const p = join(root, 'apps/api/.env')
  const out: Record<string, string> = {}
  if (!existsSync(p)) return out
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}

const EXPECTED_D043 = [
  'id',
  'train_item_id',
  'asset_type',
  'asset_role',
  'content_hash',
  'storage_path',
  'mime_type',
  'file_size',
  'diagram_version',
  'sort_order',
  'created_at',
]
const EXPECTED_D045 = [
  'id',
  'session_item_id',
  'source_item_asset_id',
  'asset_type',
  'asset_role',
  'content_hash',
  'mime_type',
  'diagram_version',
  'sort_order',
  'created_at',
]

async function main() {
  const env = loadEnv()
  const out: AuditOut = {
    connected: false,
    dbName: env.DB_NAME || null,
    mysqlVersion: null,
    connectionError: null,
    tables: {},
    d043: 'not_checked',
    d045: 'not_checked',
    d043Columns: [],
    d045Columns: [],
    industrial: {
      specialtyPresent: null,
      categoryCount: null,
      formalItemCount: null,
      testItemCount: null,
      formalWithKbLinks: null,
      formalWithAssets: null,
      formalEligibleApprox: null,
      note: '',
    },
    readOnlyGuarantee:
      'Script issues only SELECT/SHOW/INFORMATION_SCHEMA; no INSERT/UPDATE/DELETE/DDL; no ensureSeeded.',
  }

  if (!env.DB_HOST || !env.DB_USER || !env.DB_NAME) {
    out.connectionError = 'ENV_INCOMPLETE'
    console.log(JSON.stringify(out, null, 2))
    console.log('chem:industrial-readonly-audit: NOT_EXECUTED_CONNECTION (env incomplete)')
    return
  }

  let conn: mysql.Connection | null = null
  try {
    conn = await mysql.createConnection({
      host: env.DB_HOST,
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER,
      password: env.DB_PASSWORD || '',
      database: env.DB_NAME,
      // 只读会话意图（账号仍可能有写权限；本脚本不发写语句）
      multipleStatements: false,
    })
    out.connected = true
    const [verRows] = await conn.query<mysql.RowDataPacket[]>('SELECT VERSION() AS v')
    out.mysqlVersion = String(verRows[0]?.v || '')

    const needed = [
      'chem_specialties',
      'chem_categories',
      'chem_train_items',
      'chem_train_item_links',
      'chem_train_item_assets',
      'chem_train_sessions',
      'chem_train_session_items',
      'chem_train_session_item_assets',
      'chem_wrong_items',
      'chem_wrong_events',
    ]
    for (const t of needed) {
      const [r] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) AS c FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [t],
      )
      out.tables[t] = Number(r[0]?.c) > 0 ? 'present' : 'absent'
    }

    async function cols(table: string): Promise<string[]> {
      const [r] = await conn!.query<mysql.RowDataPacket[]>(
        `SELECT column_name AS n FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ?
         ORDER BY ordinal_position`,
        [table],
      )
      return r.map((x) => String(x.n))
    }

    if (out.tables.chem_train_item_assets === 'present') {
      out.d043Columns = await cols('chem_train_item_assets')
      const missing = EXPECTED_D043.filter((c) => !out.d043Columns.includes(c))
      out.d043 = missing.length ? 'drift' : 'present'
    } else {
      out.d043 = 'absent'
    }
    if (out.tables.chem_train_session_item_assets === 'present') {
      out.d045Columns = await cols('chem_train_session_item_assets')
      const missing = EXPECTED_D045.filter((c) => !out.d045Columns.includes(c))
      out.d045 = missing.length ? 'drift' : 'present'
    } else {
      out.d045 = 'absent'
    }

    if (out.tables.chem_specialties === 'present') {
      const [sp] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT id FROM chem_specialties WHERE code='industrial_experiment' LIMIT 1`,
      )
      const spId = sp[0]?.id
      out.industrial.specialtyPresent = !!spId
      if (spId && out.tables.chem_categories === 'present') {
        const [cc] = await conn.query<mysql.RowDataPacket[]>(
          `SELECT COUNT(*) AS c FROM chem_categories WHERE specialty_id=? AND is_active=1`,
          [spId],
        )
        out.industrial.categoryCount = Number(cc[0]?.c || 0)
      }
      if (spId && out.tables.chem_train_items === 'present') {
        const [f] = await conn.query<mysql.RowDataPacket[]>(
          `SELECT COUNT(*) AS c FROM chem_train_items WHERE specialty_id=? AND pool='formal'`,
          [spId],
        )
        const [t] = await conn.query<mysql.RowDataPacket[]>(
          `SELECT COUNT(*) AS c FROM chem_train_items WHERE specialty_id=? AND pool='test'`,
          [spId],
        )
        out.industrial.formalItemCount = Number(f[0]?.c || 0)
        out.industrial.testItemCount = Number(t[0]?.c || 0)

        if (out.tables.chem_train_item_links === 'present') {
          const [kb] = await conn.query<mysql.RowDataPacket[]>(
            `SELECT COUNT(DISTINCT i.id) AS c
             FROM chem_train_items i
             INNER JOIN chem_train_item_links l ON l.item_id=i.id
             WHERE i.specialty_id=? AND i.pool='formal' AND i.status='approved' AND i.is_active=1`,
            [spId],
          )
          out.industrial.formalWithKbLinks = Number(kb[0]?.c || 0)
        }
        if (out.tables.chem_train_item_assets === 'present') {
          const [as] = await conn.query<mysql.RowDataPacket[]>(
            `SELECT COUNT(DISTINCT i.id) AS c
             FROM chem_train_items i
             INNER JOIN chem_train_item_assets a ON a.train_item_id=i.id
             WHERE i.specialty_id=? AND i.pool='formal'`,
            [spId],
          )
          out.industrial.formalWithAssets = Number(as[0]?.c || 0)
        }
        // 近似 eligibility：formal+approved+active+curriculum_ok+!verify+!ban；KB 另计
        const [el] = await conn.query<mysql.RowDataPacket[]>(
          `SELECT COUNT(*) AS c FROM chem_train_items i
           WHERE i.specialty_id=? AND i.pool='formal' AND i.status='approved'
             AND i.is_active=1 AND i.curriculum_ok=1 AND i.verify_blocked=0
             AND i.ban_default_train=0
             AND EXISTS (SELECT 1 FROM chem_train_item_links l WHERE l.item_id=i.id)`,
          [spId],
        )
        out.industrial.formalEligibleApprox = Number(el[0]?.c || 0)
        out.industrial.note =
          'formalEligibleApprox 未逐条校验 KB entity published（仅有 link 存在）；完整校验需业务服务。'
      }
    }

    console.log(JSON.stringify(out, null, 2))
    console.log('chem:industrial-readonly-audit: PASS (read-only queries only)')
  } catch (e) {
    out.connected = false
    out.connectionError = String((e as Error).message || e).slice(0, 200)
    console.log(JSON.stringify(out, null, 2))
    console.log('chem:industrial-readonly-audit: NOT_EXECUTED_CONNECTION_FAILED')
  } finally {
    if (conn) await conn.end()
  }
}

main()
