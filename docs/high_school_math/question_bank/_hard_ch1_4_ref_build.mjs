/**
 * Build difficulty reference (counterexamples) for HARD-DESIGN-1A. Read-only.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import { loadEnv, dbConfig, qb } from './_g4e_lib.mjs'

const env = loadEnv()
const recs = JSON.parse(
  fs.readFileSync(path.join(qb, 'hard_difficulty_final_recommendations.json'), 'utf8'),
).recommendations
const exportItems = JSON.parse(
  fs.readFileSync(path.join(qb, 'bank_global4a', '_hard_audit_d3_export.json'), 'utf8'),
).items
const byExp = Object.fromEntries(exportItems.map((i) => [String(i.itemId), i]))

const CH = new Set(['rja-ch1', 'rja-ch2', 'rja-ch3', 'rja-ch4'])
const chRecs = recs.filter((r) => CH.has(r.specialtyCode))

function snip(s, n = 100) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n)
}

function classifyStructure(rec, exp) {
  const stem = String(exp?.stem || '')
  const reason = String(rec.difficultyReason || '') + String(rec.keyReasoning || '')
  if (/容斥|会游泳|韦恩|至少|都不会/.test(stem + reason)) return 'SET_VENN'
  if (/幂集|2\^|集合.*元素/.test(stem)) return 'SET_BASIC'
  if (/充要|充分|必要|命题|否定|量词/.test(stem + reason)) return 'LOGIC_BASIC'
  if (/辅助角|3sin|4cos|最大值/.test(stem + reason)) return 'TRIG_AUX'
  if (/定义域/.test(stem) && /\\sqrt|\\ln|\\log|根式|对数/.test(stem)) return 'DOMAIN_INTERSECT'
  if (/增函数|抽象|f\(1\).*f\(2\)/.test(stem + reason)) return 'ABSTRACT_MONO_ONE_STEP'
  if (/指数|菌群|放射性|2\^\{|n\(t\)/.test(stem)) return 'EXP_PLUG'
  if (/换底|log_|对数方程|2\^x=/.test(stem)) return 'LOG_BASIC'
  if (/绝对值|分段|最值/.test(stem) && /\|x/.test(stem)) return 'ABS_PIECEWISE'
  if (/根分布|判别式|韦达|二次/.test(stem + reason)) return 'QUAD_ROUTINE'
  if (/奇偶|奇函数|偶函数/.test(stem)) return 'ODD_EVEN_DEF'
  if (/中位线|中点|向量/.test(stem)) return 'VECTOR_TEMPLATE'
  return 'GENERIC_RAISE'
}

const missingThinking = {
  SET_VENN: '缺非显然集合包含/含参条件转化；仅公式计数',
  SET_BASIC: '缺参数讨论与逻辑层次；仅定义套用',
  LOGIC_BASIC: '缺多层充要与量词嵌套分析',
  TRIG_AUX: '缺综合策略；一步辅助角',
  DOMAIN_INTERSECT: '缺含参边界与充分性；仅不等式求交',
  ABSTRACT_MONO_ONE_STEP: '缺深层结构利用；一步反证/单调',
  EXP_PLUG: '缺综合推理；指数代入求值',
  LOG_BASIC: '缺指对综合与参数；换底/同底运算',
  ABS_PIECEWISE: '缺深层分类必要性证明；几何/分段常规',
  QUAD_ROUTINE: '缺非显然转化/边界充分性；套路根分布',
  ODD_EVEN_DEF: '缺性质综合；定义验证',
  VECTOR_TEMPLATE: '缺空间/参数综合；教材模板证明',
  GENERIC_RAISE: '缺非显然突破点；多步但套路化',
}

const refs = []
const seenStruct = new Set()
for (const rec of chRecs) {
  const exp = byExp[String(rec.itemId)]
  const struct = classifyStructure(rec, exp)
  const key = `${rec.specialtyCode}:${struct}:${rec.recommendedDifficulty}`
  // keep diverse samples: up to 2 per structure per chapter per d-level
  const countKey = key
  const n = [...refs].filter(
    (x) =>
      x.specialtyCode === rec.specialtyCode &&
      x.structureType === struct &&
      x.recommendedDifficulty === rec.recommendedDifficulty,
  ).length
  if (n >= 2) continue
  refs.push({
    itemId: String(rec.itemId),
    code: rec.code,
    specialtyCode: rec.specialtyCode,
    qtype: rec.qtype || exp?.qtype,
    recommendedDifficulty: rec.recommendedDifficulty,
    structureType: struct,
    stemSnippet: snip(exp?.stem, 120),
    whyNotHard:
      rec.difficultyReason ||
      '原虚标 d3；按高一标准属基础/提高，无非显然压轴突破。',
    missingThinking: missingThinking[struct] || missingThinking.GENERIC_RAISE,
    comparisonHint: `对照用：压轴设计须明确超越「${struct}」套路，写出独立突破点与完整推导。`,
  })
  seenStruct.add(struct)
}

const conn = await createConnection({ ...dbConfig(env), charset: 'utf8mb4' })
const [specs] = await conn.query(
  `SELECT code, name FROM hs_math_specialties WHERE code IN ('rja-ch1','rja-ch2','rja-ch3','rja-ch4') ORDER BY sort_order`,
)
const [cats] = await conn.query(
  `SELECT s.code AS specialtyCode, c.code AS sectionCode, c.name AS sectionName
   FROM hs_math_categories c
   JOIN hs_math_specialties s ON s.id=c.specialty_id
   WHERE s.code IN ('rja-ch1','rja-ch2','rja-ch3','rja-ch4')
   ORDER BY s.sort_order, c.sort_order`,
)
const [kps] = await conn.query(
  `SELECT s.code AS specialtyCode, k.code, k.name
   FROM hs_math_knowledge_points k
   JOIN hs_math_specialties s ON s.id=k.specialty_id
   WHERE s.code IN ('rja-ch1','rja-ch2','rja-ch3','rja-ch4')
   ORDER BY s.sort_order, k.code`,
)
let methods = []
try {
  const [m] = await conn.query(
    `SELECT code, name FROM hs_math_methods ORDER BY code LIMIT 200`,
  )
  methods = m
} catch {
  methods = []
}
const [[draw]] = await conn.query(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)
const [byDiff] = await conn.query(
  `SELECT difficulty, COUNT(1) AS n FROM hs_math_train_items
   WHERE pool='formal' AND status='approved' AND is_active=1 GROUP BY difficulty ORDER BY difficulty`,
)
await conn.end()

const out = {
  phase: 'HS-MATH-HARD-CH1-4-DESIGN-1A',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  builtAt: new Date().toISOString(),
  baseline: {
    drawable: Number(draw.n),
    byDifficulty: Object.fromEntries(byDiff.map((r) => [Number(r.difficulty), Number(r.n)])),
  },
  taxonomy: { specialties: specs, sections: cats, knowledgePoints: kps, methods },
  counterexamples: refs,
  structureTypesCovered: [...seenStruct].sort(),
  note: '反例仅用于难度对照；不得修改已有题目。压轴设计须写明相对这些结构新增了何种非显然思维。',
}

fs.writeFileSync(path.join(qb, 'hard_ch1_4_difficulty_reference.json'), JSON.stringify(out, null, 2))
console.log(
  JSON.stringify(
    {
      counterexamples: refs.length,
      byChapter: Object.fromEntries(
        ['rja-ch1', 'rja-ch2', 'rja-ch3', 'rja-ch4'].map((c) => [
          c,
          refs.filter((r) => r.specialtyCode === c).length,
        ]),
      ),
      structures: out.structureTypesCovered,
      kp: kps.length,
      methods: methods.length,
      drawable: out.baseline.drawable,
    },
    null,
    2,
  ),
)
