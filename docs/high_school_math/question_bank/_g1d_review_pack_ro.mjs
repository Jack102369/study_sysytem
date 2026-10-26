/**
 * DIAGRAM-1D-REVIEW-PACK readonly: fetch 4 items + PNG hashes. No DB write.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const docs = path.resolve(__dirname, '..')
const srcDir = path.join(docs, 'diagrams/required_g1b')
const packDir = path.join(docs, 'diagrams/independent_review_pack')

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

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

function parseJson(v) {
  if (v == null) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

const codes = ['CAND-G1B-093', 'CAND-G1B-080', 'CAND-G1B-064', 'CAND-G1B-091']
const env = loadEnv()
const conn = await createConnection({
  host: env.DB_HOST || '127.0.0.1',
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || 'study_user',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'study_system',
  charset: 'utf8mb4',
})

const [rows] = await conn.query(
  `SELECT id, code, stem, options_json, answer_payload_json, analysis,
          difficulty, content_version, status, pool, is_active, qtype
   FROM hs_math_train_items
   WHERE code IN (?,?,?,?)
   ORDER BY FIELD(code,?,?,?,?)`,
  [...codes, ...codes],
)
await conn.end()

const items = rows.map((it) => ({
  candidateCode: it.code,
  itemId: Number(it.id),
  stem: it.stem,
  options: parseJson(it.options_json),
  answer: parseJson(it.answer_payload_json),
  analysis: it.analysis,
  difficulty: it.difficulty,
  contentVersion: Number(it.content_version),
  status: it.status,
  pool: it.pool,
  isActive: it.is_active,
  qtype: it.qtype,
}))

const pngs = []
const blockers = []
for (const code of codes) {
  const name = `${code}.png`
  const p = path.join(srcDir, name)
  if (!fs.existsSync(p)) {
    blockers.push(`missing ${name}`)
    continue
  }
  const buf = fs.readFileSync(p)
  const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  let width = null
  let height = null
  if (isPng && buf.length >= 24) {
    width = buf.readUInt32BE(16)
    height = buf.readUInt32BE(20)
  }
  pngs.push({
    code,
    file: name,
    bytes: buf.length,
    sha256: sha256File(p),
    isPng,
    width,
    height,
  })
  if (!isPng) blockers.push(`${name} not valid PNG signature`)
  if (!width || !height || width < 600 || height < 400) {
    blockers.push(`${name} resolution too small or unreadable (${width}x${height})`)
  }
}

const item064 = items.find((x) => x.candidateCode === 'CAND-G1B-064')
if (!item064) blockers.push('064 missing from DB')
else {
  if (!String(item064.stem).includes('塔顶的仰角为')) {
    blockers.push('064 stem not revised to 塔顶的仰角为')
  }
  if (String(item064.stem).includes('顶角')) {
    blockers.push('064 stem still contains 顶角')
  }
  if (!(item064.status === 'draft' && item064.contentVersion === 2)) {
    blockers.push(`064 unexpected status/cv: ${item064.status}/cv${item064.contentVersion}`)
  }
}

fs.mkdirSync(packDir, { recursive: true })
for (const p of pngs) {
  fs.copyFileSync(path.join(srcDir, p.file), path.join(packDir, p.file))
}

function fmtOptions(options) {
  if (!options) return '_无选项（非选择题）_'
  const list = options.options || options
  if (!Array.isArray(list)) return '```json\n' + JSON.stringify(options, null, 2) + '\n```'
  return list.map((o) => `- **${o.id}**：${o.text}`).join('\n')
}

function fmtAnswer(answer) {
  if (!answer) return '_（无）_'
  if (answer.kind === 'single') return `单选：\`${answer.optionId}\``
  if (answer.kind === 'application') {
    const rub =
      Array.isArray(answer.rubric) && answer.rubric.length
        ? answer.rubric
            .map(
              (r) =>
                `  - \`${r.key}\` ${r.title}：${r.criteria}（${r.maxScore}分）`,
            )
            .join('\n')
        : '  _无_'
    return [
      `应用题标准答案：${answer.standardAnswer || '_（无）_'}`,
      `满分：${answer.maxScore ?? '_'}`,
      `Rubric：`,
      rub,
    ].join('\n')
  }
  return '```json\n' + JSON.stringify(answer, null, 2) + '\n```'
}

const qMd = []
qMd.push('# 独立数学审核 · 题目材料（只读摘录）')
qMd.push('')
qMd.push('> 来源：MySQL `study_system` 当前正式行（只读 SELECT）。')
qMd.push('> 图片：同目录 PNG。**请实际打开图片**，勿仅凭文字材料判断。')
qMd.push('> 本文件不含作者自检结论。')
qMd.push('')
qMd.push(`生成时间（UTC）：${new Date().toISOString()}`)
qMd.push('')

for (const it of items) {
  const png = pngs.find((p) => p.code === it.candidateCode)
  qMd.push(`---`)
  qMd.push('')
  qMd.push(`## ${it.candidateCode}`)
  qMd.push('')
  qMd.push(`| 字段 | 值 |`)
  qMd.push(`|------|-----|`)
  qMd.push(`| itemId | ${it.itemId} |`)
  qMd.push(`| qtype | ${it.qtype} |`)
  qMd.push(`| difficulty | ${it.difficulty} |`)
  qMd.push(`| status | **${it.status}** |`)
  qMd.push(`| contentVersion | **${it.contentVersion}** |`)
  qMd.push(`| pool / active | ${it.pool} / ${it.isActive} |`)
  qMd.push(`| 图片文件 | \`${png?.file || 'MISSING'}\` |`)
  if (png) {
    qMd.push(`| PNG SHA256 | \`${png.sha256}\` |`)
    qMd.push(`| PNG 尺寸 | ${png.width}×${png.height} · ${png.bytes} bytes |`)
  }
  qMd.push('')
  qMd.push('### 题干')
  qMd.push('')
  qMd.push(it.stem)
  qMd.push('')
  qMd.push('### 选项')
  qMd.push('')
  qMd.push(fmtOptions(it.options))
  qMd.push('')
  qMd.push('### 标准答案 / Rubric')
  qMd.push('')
  qMd.push(fmtAnswer(it.answer))
  qMd.push('')
  qMd.push('### 解析')
  qMd.push('')
  qMd.push(it.analysis || '_（无）_')
  qMd.push('')
}

const instr = `# 独立数学审核说明

## 角色与独立性

你是**外部独立数学审核者**。

- **不得**采用绘图作者或同一制图会话的自检结论作为通过依据。
- 参考文档 139/140/141/143 仅可作背景；**必须以本题材料包中的题干 + PNG 独立判断**。
- 请**实际打开**四张 PNG 查看，不能只读文件名或 SHA256。

## 审核题目

1. CAND-G1B-093（正方体 / 线面垂直示意）
2. CAND-G1B-080（平行四边形向量）
3. CAND-G1B-064（塔高测量；**当前题干已改为「塔顶的仰角」**，status=draft / cv=2）
4. CAND-G1B-091（斜二测坐标系对照）

材料见同目录：\`review_questions.md\` 与对应 \`CAND-G1B-*.png\`。

## 必须检查

对每道题：

1. 图片与**当前**题干条件是否一致（字母、角度、距离、向量方向等）。
2. 几何 / 向量 / 三角关系是否数学正确（可自行坐标或向量验证）。
3. 顶点、线段、角度弧、箭头标注是否正确、可读。
4. 是否泄露证明结论、正确选项或数值答案。
5. 是否引入题干未给出的关键条件（064 尤其核对：30° 是否为仰角位置）。
6. 虚实线、遮挡、坐标系区分是否合理（093 / 091）。

## 单题结论（仅允许）

- \`PASS\` — 数学与题干一致，视觉可接受，无明显泄题
- \`BLOCKED\` — 存在数学错误、题干不一致、泄题或严重不可读；须写明理由

逐题给出：**结论 + 具体理由**（至少 3～5 条检查点）。

## 禁止

- 不得修改本材料包文件以外的业务数据。
- 不得仅因“看起来像”而通过；须核对条件。
- 不得把「作者自检通过」写成你的结论。

## 回报格式建议

\`\`\`
CAND-G1B-093: PASS|BLOCKED
理由：...

CAND-G1B-080: PASS|BLOCKED
理由：...

CAND-G1B-064: PASS|BLOCKED
理由：...

CAND-G1B-091: PASS|BLOCKED
理由：...

总体：...
\`\`\`
`

fs.writeFileSync(path.join(packDir, 'review_questions.md'), qMd.join('\n'), 'utf8')
fs.writeFileSync(
  path.join(packDir, 'independent_review_instructions.md'),
  instr,
  'utf8',
)

// enforce pack contents
const packFiles = fs.readdirSync(packDir).sort()
const allowed = new Set([
  ...codes.map((c) => `${c}.png`),
  'review_questions.md',
  'independent_review_instructions.md',
])
const unexpected = packFiles.filter((f) => !allowed.has(f))
if (unexpected.length) blockers.push(`unexpected pack files: ${unexpected.join(',')}`)
for (const a of allowed) {
  if (!packFiles.includes(a)) blockers.push(`pack missing ${a}`)
}

const out = {
  phase: 'HS-MATH-BANK-DIAGRAM-1D-REVIEW-PACK',
  readonlyDb: true,
  wroteDb: false,
  packDir: 'docs/high_school_math/diagrams/independent_review_pack',
  items,
  pngs,
  packFiles,
  blockers,
  status: blockers.length ? 'BLOCKED' : 'REVIEW_PACK_READY',
}

fs.writeFileSync(
  path.join(docs, '_g1d_review_pack_meta.json'),
  JSON.stringify(out, null, 2),
)
console.log(JSON.stringify({ status: out.status, packFiles, blockers, itemStatuses: items.map((i)=>({code:i.candidateCode,status:i.status,cv:i.contentVersion})) }, null, 2))
