/**
 * GLOBAL-1C-RECOVERY: rebuild kp-seed-g1c.mjs from surviving SQL sources.
 * No DB write.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')

const SECTION_NAMES = {
  '1.1': '集合的概念',
  '1.2': '集合间的基本关系',
  '1.3': '集合的基本运算',
  '1.4': '充分条件与必要条件',
  '1.5': '全称量词与存在量词',
  '2.1': '等式性质与不等式性质',
  '2.2': '基本不等式',
  '2.3': '二次函数与一元二次方程、不等式',
  '3.1': '函数的概念及其表示',
  '3.2': '函数的基本性质',
  '3.3': '幂函数',
  '3.4': '函数的应用（一）',
  '4.1': '指数',
  '4.2': '指数函数',
  '4.3': '对数',
  '4.4': '对数函数',
  '4.5': '函数的应用（二）',
  '5.1': '任意角和弧度制',
  '5.2': '三角函数的概念',
  '5.3': '诱导公式',
  '5.4': '三角函数的图象与性质',
  '5.5': '三角恒等变换',
  '5.6': '函数 y=Asin(ωx+φ)',
  '5.7': '三角函数的应用',
  '6.1': '平面向量的概念',
  '6.2': '平面向量的运算',
  '6.3': '平面向量基本定理及坐标表示',
  '6.4': '平面向量的应用',
  '7.1': '复数的概念',
  '7.2': '复数的四则运算',
  '7.3': '复数的三角表示',
  '8.1': '基本立体图形',
  '8.2': '立体图形的直观图',
  '8.3': '空间几何体的表面积与体积',
  '8.4': '空间点、直线、平面之间的位置关系',
  '8.5': '空间直线、平面的平行',
  '8.6': '空间直线、平面的垂直',
  '9.1': '随机抽样',
  '9.2': '用样本估计总体',
  '9.3': '统计分析案例',
  '10.1': '随机事件与概率',
  '10.2': '事件的相互独立性',
  '10.3': '频率与概率',
}

function specialtyForSection(sectionCode) {
  const ch = Number(sectionCode.split('.')[0])
  if (ch >= 1 && ch <= 5) return `rja-ch${ch}`
  if (ch >= 6 && ch <= 10) return `rjb-ch${ch - 5}`
  throw new Error(`bad section ${sectionCode}`)
}

function parseSqlRows(sqlText) {
  // Match both full and short UNION ALL forms
  const rows = []
  const reFull =
    /SELECT\s+'([^']+)'\s+AS\s+code,\s*'([^']*(?:''[^']*)*)'\s+AS\s+name,\s*'([^']+)'\s+AS\s+section_code,\s*'([^']*(?:''[^']*)*)'\s+AS\s+summary,\s*(\d+)\s+AS\s+sort_order/gi
  const reShort =
    /UNION\s+ALL\s+SELECT\s+'([^']+)',\s*'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']*(?:''[^']*)*)',\s*(\d+)/gi

  let m
  while ((m = reFull.exec(sqlText))) {
    rows.push({
      code: m[1],
      name: m[2].replace(/''/g, "'"),
      sectionCode: m[3],
      summary: m[4].replace(/''/g, "'"),
      sortOrder: Number(m[5]),
    })
  }
  // Also collect short form that may not have been matched if first SELECT used AS
  // Re-parse with a looser pattern for UNION ALL short (ch1 style)
  const reShort2 =
    /UNION ALL SELECT '([^']+)',\s*'([^']*)',\s*'([^']+)',\s*\n?\s*'([^']*)',\s*(\d+)/g
  while ((m = reShort2.exec(sqlText))) {
    if (!rows.find((r) => r.code === m[1])) {
      rows.push({
        code: m[1],
        name: m[2].replace(/''/g, "'"),
        sectionCode: m[3],
        summary: m[4].replace(/''/g, "'"),
        sortOrder: Number(m[5]),
      })
    }
  }
  return rows
}

function parseCh1(sqlText) {
  // First SELECT has AS, subsequent UNION ALL short
  const rows = []
  const first =
    /SELECT\s+'([^']+)'\s+AS\s+code,\s*'([^']*)'\s+AS\s+name,\s*'([^']+)'\s+AS\s+section_code,\s*'([^']*)'\s+AS\s+summary,\s*(\d+)\s+AS\s+sort_order/
  const fm = sqlText.match(first)
  if (fm) {
    rows.push({
      code: fm[1],
      name: fm[2],
      sectionCode: fm[3],
      summary: fm[4],
      sortOrder: Number(fm[5]),
    })
  }
  const re =
    /UNION ALL SELECT '([^']+)',\s*'([^']*)',\s*'([^']+)',\s*\n?\s*'([^']*)',\s*(\d+)/g
  let m
  while ((m = re.exec(sqlText))) {
    rows.push({
      code: m[1],
      name: m[2],
      sectionCode: m[3],
      summary: m[4],
      sortOrder: Number(m[5]),
    })
  }
  return rows
}

function parseCh3(sqlText) {
  const rows = []
  const first =
    /SELECT\s+'([^']+)'\s+AS\s+code,\s*'([^']*)'\s+AS\s+name,\s*'([^']+)'\s+AS\s+section_code,\s*'([^']*)'\s+AS\s+summary,\s*(\d+)\s+AS\s+sort_order/
  const fm = sqlText.match(first)
  if (fm) {
    rows.push({
      code: fm[1],
      name: fm[2],
      sectionCode: fm[3],
      summary: fm[4],
      sortOrder: Number(fm[5]),
    })
  }
  const re =
    /UNION ALL SELECT '([^']+)',\s*'([^']*)',\s*'([^']+)',\s*\n?\s*'([^']*)',\s*(\d+)/g
  let m
  while ((m = re.exec(sqlText))) {
    rows.push({
      code: m[1],
      name: m[2],
      sectionCode: m[3],
      summary: m[4],
      sortOrder: Number(m[5]),
    })
  }
  return rows
}

const migrate = fs.readFileSync(
  path.join(root, 'db/migrate_hs_math_p1_0.sql'),
  'utf8',
)
const ch3 = fs.readFileSync(
  path.join(root, 'db/seed_hs_math_ch03_function_kps.sql'),
  'utf8',
)
const g1c = fs.readFileSync(
  path.join(root, 'db/seed_hs_math_global1c_missing_kps.sql'),
  'utf8',
)

// Extract only the KP INSERT block from migrate (between INSERT INTO hs_math_knowledge_points and next major section)
const migrateKpBlock = migrate.slice(
  migrate.indexOf('INSERT INTO hs_math_knowledge_points'),
  migrate.indexOf('WHERE NOT EXISTS', migrate.indexOf('INSERT INTO hs_math_knowledge_points')) +
    200,
)

const existingRows = [...parseCh1(migrateKpBlock), ...parseCh3(ch3)]
const insertRows = parseSqlRows(g1c)

function toSeed(row, status) {
  const specialtyCode = specialtyForSection(row.sectionCode)
  return {
    code: row.code,
    name: row.name,
    specialtyCode,
    sectionCode: row.sectionCode,
    sectionName: SECTION_NAMES[row.sectionCode] || row.sectionCode,
    summary: row.summary,
    sortOrder: row.sortOrder,
    prerequisites: [],
    qtypes: ['single', 'multi', 'judge', 'numeric', 'application'],
    methods: ['defn'],
    status,
  }
}

const existingInDb = existingRows.map((r) => toSeed(r, 'IN_DB'))
const seedsToInsert = insertRows.map((r) => toSeed(r, 'SEED_DRAFT'))

// Deduplicate existing by code
const existMap = new Map()
for (const k of existingInDb) existMap.set(k.code, k)
const existingUnique = [...existMap.values()].sort((a, b) =>
  a.code.localeCompare(b.code),
)

const insertMap = new Map()
for (const k of seedsToInsert) insertMap.set(k.code, k)
const insertUnique = [...insertMap.values()].sort((a, b) =>
  a.code.localeCompare(b.code),
)

const overlap = insertUnique.filter((k) => existMap.has(k.code))

const outPath = path.join(__dirname, 'kp-seed-g1c.mjs')
const body = `/**
 * HS-MATH-BANK-GLOBAL-1C — 全高一 KP 种子草案（权威结构化）
 * 状态：SEED_DRAFT — 禁止本阶段执行 SQL / 写库
 *
 * RECOVERY：本文件由 GLOBAL-1C-RECOVERY 自 SQL 源重建（非 git 检出）。
 * 来源：
 * - existingInDb ← db/migrate_hs_math_p1_0.sql + db/seed_hs_math_ch03_function_kps.sql
 * - seedsToInsert ← db/seed_hs_math_global1c_missing_kps.sql
 * prerequisites/qtypes/methods 为结构占位（再生），以 code/name/section/summary/sort 为准。
 */

function s(o) { return o }

/** 库内已有（索引，不进 INSERT 草案） */
export const existingInDb = ${JSON.stringify(existingUnique, null, 2)}

/** 本阶段拟 INSERT 的缺失 KP */
export const seedsToInsert = ${JSON.stringify(insertUnique, null, 2)}

export const allKpSeeds = [...existingInDb, ...seedsToInsert]
export const kpByCode = Object.fromEntries(allKpSeeds.map((k) => [k.code, k]))
`

fs.writeFileSync(outPath, body, 'utf8')

const stats = {
  existingN: existingUnique.length,
  insertN: insertUnique.length,
  allN: existingUnique.length + insertUnique.length,
  overlap: overlap.map((k) => k.code),
  insertDupInParse: seedsToInsert.length - insertUnique.length,
  existingDupInParse: existingInDb.length - existingUnique.length,
}
fs.writeFileSync(
  path.join(__dirname, '_recovery_seed_stats.json'),
  JSON.stringify(stats, null, 2),
)
console.log(JSON.stringify(stats, null, 2))
