/** DIAGRAM-1G preflight only — read-only */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const env = { ...process.env }
const envPath = path.join(root, 'apps/api/.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && env[m[1].trim()] === undefined) env[m[1].trim()] = m[2].trim()
  }
}

const EXPECTED = [
  {
    id: '244',
    code: 'CAND-G1B-093',
    cv: 2,
    sha: 'e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1',
  },
  {
    id: '231',
    code: 'CAND-G1B-080',
    cv: 2,
    sha: 'c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc',
  },
  {
    id: '215',
    code: 'CAND-G1B-064',
    cv: 3,
    sha: 'a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7',
    stemMust: '塔顶的仰角为',
    stemMustNot: '顶角',
  },
  {
    id: '242',
    code: 'CAND-G1B-091',
    cv: 2,
    sha: 'a77867e8beb43226cd1e230b043151a00e851f560026d7882c15b0a5584f19f8',
  },
]

const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const [[dw]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1`,
)

const out = { drawable: Number(dw.n), items: [], blockers: [] }
for (const e of EXPECTED) {
  const [[it]] = await conn.query(
    `SELECT id, code, status, content_version, qtype, stem,
            answer_payload_json, analysis, source_license_status,
            source_verification_status, pool, is_active
     FROM hs_math_train_items WHERE id=? AND code=?`,
    [e.id, e.code],
  )
  if (!it) {
    out.blockers.push(`${e.code} missing`)
    continue
  }
  const [links] = await conn.query(
    `SELECT d.id AS lid, d.sort_order, o.content_sha256 AS sha
     FROM hs_math_train_item_diagrams d
     JOIN hs_math_train_item_diagram_objects o ON o.id=d.object_id
     WHERE d.item_id=? ORDER BY d.sort_order`,
    [e.id],
  )
  const [revs] = await conn.query(
    `SELECT id, content_version, review_status, content_fingerprint
     FROM hs_math_train_item_reviews WHERE item_id=?
     ORDER BY id DESC LIMIT 5`,
    [e.id],
  )
  const row = {
    code: e.code,
    status: it.status,
    cv: Number(it.content_version),
    qtype: it.qtype,
    linkCount: links.length,
    sha: links[0]?.sha || null,
    reviews: revs.map((r) => ({
      id: r.id,
      cv: Number(r.content_version),
      status: r.review_status,
      staleVsCurrent:
        Number(r.content_version) !== Number(it.content_version),
    })),
    stemHasYangjiao: e.stemMust ? String(it.stem).includes(e.stemMust) : null,
    stemHasDingjiao: e.stemMustNot
      ? String(it.stem).includes(e.stemMustNot)
      : null,
    answerPreview: String(it.answer_payload_json).slice(0, 180),
    analysisLen: String(it.analysis || '').length,
    source: {
      license: it.source_license_status,
      verification: it.source_verification_status,
    },
  }
  const ok =
    it.status === 'draft' &&
    Number(it.content_version) === e.cv &&
    links.length === 1 &&
    links[0].sha === e.sha &&
    (!e.stemMust || String(it.stem).includes(e.stemMust)) &&
    (!e.stemMustNot || !String(it.stem).includes(e.stemMustNot)) &&
    revs.every((r) => Number(r.content_version) !== Number(it.content_version))
  row.preflightOk = ok
  if (!ok) out.blockers.push(`${e.code} preflight fail`)
  out.items.push(row)
}

await conn.end()
const dest = path.join(root, 'docs/high_school_math/_g1g_preflight_live.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
process.exit(out.blockers.length ? 2 : 0)
