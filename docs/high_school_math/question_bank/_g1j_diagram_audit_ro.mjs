/**
 * GLOBAL-1J-DIAGRAM-AUDIT readonly export. SELECT only. DO NOT commit.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')

function loadEnv() {
  const env = { ...process.env }
  const p = path.join(root, 'apps/api/.env')
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
    }
  }
  return env
}

const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const [cols] = await conn.query(`SHOW COLUMNS FROM hs_math_train_items`)
const [rows] = await conn.query(`
SELECT i.id, i.code, i.qtype, i.difficulty, i.pool, i.status, i.is_active,
       i.content_version, i.stem, i.analysis,
       i.options_json, i.answer_payload_json,
       s.code AS specialty_code, s.name AS specialty_name,
       c.code AS category_code, c.name AS category_name
FROM hs_math_train_items i
JOIN hs_math_specialties s ON s.id = i.specialty_id
JOIN hs_math_categories c ON c.id = i.category_id
WHERE i.code REGEXP '^CAND-G1B-[0-9]{3}$'
ORDER BY i.code
`)

const item093 = rows.find((r) => r.code === 'CAND-G1B-093')

const out = {
  phase: 'HS-MATH-BANK-GLOBAL-1J-DIAGRAM-AUDIT',
  readonly: true,
  columnNames: cols.map((c) => c.Field),
  hasImageLikeColumn: cols
    .map((c) => c.Field)
    .filter((f) => /image|diagram|figure|svg|media|asset|attach|html/i.test(f)),
  candN: rows.length,
  items: rows.map((r) => ({
    code: r.code,
    qtype: r.qtype,
    difficulty: Number(r.difficulty),
    specialty: r.specialty_code,
    specialtyName: r.specialty_name,
    category: r.category_code,
    categoryName: r.category_name,
    cv: Number(r.content_version),
    stem: r.stem,
    analysisHead: String(r.analysis || '').slice(0, 400),
    analysisLen: String(r.analysis || '').length,
    stemHasImgTag: /<img\b/i.test(String(r.stem || '')),
    stemHasMdImage: /!\[[^\]]*\]\([^)]+\)/.test(String(r.stem || '')),
    stemHasSvg: /<svg\b/i.test(String(r.stem || '')),
    analysisHasImg: /<img\b|!\[[^\]]*\]\([^)]+\)|<svg\b/i.test(
      String(r.analysis || ''),
    ),
  })),
  item093: item093
    ? {
        code: item093.code,
        stem: item093.stem,
        analysis: item093.analysis,
        answer_payload_json:
          typeof item093.answer_payload_json === 'string'
            ? JSON.parse(item093.answer_payload_json)
            : item093.answer_payload_json,
        specialty: item093.specialty_name,
        category: item093.category_name,
        cv: Number(item093.content_version),
        status: item093.status,
      }
    : null,
}

fs.writeFileSync(path.join(docs, '_g1j_diagram_audit_ro.json'), JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      candN: out.candN,
      columns: out.columnNames.length,
      hasImageLikeColumn: out.hasImageLikeColumn,
      stemImgCount: out.items.filter((x) => x.stemHasImgTag || x.stemHasMdImage || x.stemHasSvg)
        .length,
      analysisImgCount: out.items.filter((x) => x.analysisHasImg).length,
      has093: !!out.item093,
    },
    null,
    2,
  ),
)
await conn.end()
