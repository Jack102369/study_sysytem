#!/usr/bin/env node
/**
 * 高一数学服务器同步包：在 pack:release 基础上追加
 * - db/hs_math_content_sync.sql（题库/分类/KP/方法/审题/配图元数据）
 * - api/uploads/hs-math/（题干配图文件）
 * - SERVER_UPDATE_CHECKLIST_HS_MATH.md
 *
 * 用法（同域 nginx）：
 *   $env:VITE_API_BASE_URL=""; pnpm pack:hs-math-sync
 *
 * 不含：学生学习会话、答题图、服务器 .env
 */
import { execFileSync, execSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'release', 'study-system')
const MYSQLDUMP =
  process.env.MYSQLDUMP_PATH ||
  (existsSync('C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe')
    ? 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe'
    : 'mysqldump')

/** 内容表（不含学生会话 / 日配额运行时表） */
const CONTENT_TABLES = [
  'hs_math_specialties',
  'hs_math_categories',
  'hs_math_knowledge_points',
  'hs_math_methods',
  'hs_math_train_items',
  'hs_math_train_item_kps',
  'hs_math_train_item_methods',
  'hs_math_train_item_reviews',
  'hs_math_train_item_diagram_objects',
  'hs_math_train_item_diagrams',
]

function loadEnv() {
  const env = { ...process.env }
  const p = join(root, 'apps', 'api', '.env')
  if (!existsSync(p)) throw new Error(`missing ${p}`)
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
  return env
}

function countFiles(dir) {
  if (!existsSync(dir)) return { files: 0, bytes: 0 }
  let files = 0
  let bytes = 0
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      const st = statSync(p)
      if (st.isDirectory()) walk(p)
      else {
        files += 1
        bytes += st.size
      }
    }
  }
  walk(dir)
  return { files, bytes }
}

console.log('==> 1/4 pack:release (web+api+db+nginx)')
const apiBase = process.env.VITE_API_BASE_URL
const packEnv = { ...process.env }
if (apiBase !== undefined) packEnv.VITE_API_BASE_URL = apiBase
execSync('node scripts/pack-release.mjs', {
  cwd: root,
  stdio: 'inherit',
  env: packEnv,
  shell: true,
})

console.log('==> 2/4 mysqldump hs_math content → db/hs_math_content_sync.sql')
const env = loadEnv()
const host = env.DB_HOST || '127.0.0.1'
const port = String(env.DB_PORT || 3306)
const user = env.DB_USER
const password = env.DB_PASSWORD || ''
const database = env.DB_NAME || 'study_system'
if (!user) throw new Error('DB_USER missing in apps/api/.env')

const dumpOut = join(out, 'db', 'hs_math_content_sync.sql')
const dumpArgs = [
  `-h${host}`,
  `-P${port}`,
  `-u${user}`,
  `--single-transaction`,
  `--routines=false`,
  `--triggers=false`,
  `--set-gtid-purged=OFF`,
  `--default-character-set=utf8mb4`,
  `--column-statistics=0`,
  `--no-tablespaces`,
  database,
  ...CONTENT_TABLES,
]
const dumpEnv = { ...process.env }
if (password) dumpEnv.MYSQL_PWD = password

try {
  const buf = execFileSync(MYSQLDUMP, dumpArgs, {
    env: dumpEnv,
    maxBuffer: 256 * 1024 * 1024,
  })
  const header = [
    '-- hs_math_content_sync.sql',
    `-- generatedAt=${new Date().toISOString()}`,
    `-- sourceDb=${database}@${host}:${port}`,
    `-- tables=${CONTENT_TABLES.join(',')}`,
    '-- NOTE: DROP+CREATE content tables. Does NOT include student sessions.',
    '-- Run migrate_hs_math_*.sql first on empty servers, then this file.',
    '',
  ].join('\n')
  writeFileSync(dumpOut, header + buf.toString('utf8'))
  console.log(`  wrote ${dumpOut} (${buf.length} bytes)`)
} catch (e) {
  console.error('mysqldump failed:', e?.message || e)
  console.error('MYSQLDUMP_PATH=', MYSQLDUMP)
  process.exit(1)
}

console.log('==> 3/4 copy uploads/hs-math')
const uploadsSrc = join(root, 'apps', 'api', 'uploads', 'hs-math')
const uploadsDest = join(out, 'api', 'uploads', 'hs-math')
if (!existsSync(uploadsSrc)) {
  console.warn('  WARN: missing apps/api/uploads/hs-math — diagrams may 404 on server')
  mkdirSync(uploadsDest, { recursive: true })
} else {
  mkdirSync(join(out, 'api', 'uploads'), { recursive: true })
  cpSync(uploadsSrc, uploadsDest, { recursive: true, force: true })
  const st = countFiles(uploadsDest)
  console.log(`  copied uploads/hs-math files=${st.files} bytes=${st.bytes}`)
}

console.log('==> 4/4 checklist + VERSION note')
const checklistSrc = join(root, 'SERVER_UPDATE_CHECKLIST_HS_MATH.md')
if (existsSync(checklistSrc)) {
  cpSync(checklistSrc, join(out, 'SERVER_UPDATE_CHECKLIST_HS_MATH.md'))
} else {
  console.warn('  WARN: SERVER_UPDATE_CHECKLIST_HS_MATH.md missing at repo root')
}

const verPath = join(out, 'VERSION.txt')
const prev = existsSync(verPath) ? readFileSync(verPath, 'utf8') : ''
const up = countFiles(uploadsDest)
writeFileSync(
  verPath,
  prev +
    `hsMathSync=true\n` +
    `hsMathContentSql=db/hs_math_content_sync.sql\n` +
    `hsMathUploadsFiles=${up.files}\n` +
    `hsMathUploadsBytes=${up.bytes}\n` +
    `hsMathContentTables=${CONTENT_TABLES.join(',')}\n`,
)

console.log('')
console.log('高一数学同步包完成:', out)
console.log('见 SERVER_UPDATE_CHECKLIST_HS_MATH.md')
