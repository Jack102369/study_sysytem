/**
 * GLOBAL-4D: classify each weakD3Id (+ formula-plug d3) as A/B/C/D with evidence.
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const q4c = JSON.parse(fs.readFileSync(path.join(qb, 'global4c_d3_quality_results.json'), 'utf8'))
const { candidates } = await import(
  pathToFileURL(path.join(qb, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)
const byId = new Map(candidates.map((c) => [c.id, c]))

function sha(c) {
  const keys = [
    'id',
    'chapterNo',
    'kpCode',
    'qtype',
    'difficulty',
    'methodMain',
    'methodAux',
    'stem',
    'options',
    'answer',
    'analysis',
    'maxScore',
    'rubric',
    'diagramRequirement',
  ]
  const o = {}
  for (const k of keys) o[k] = c[k] ?? null
  return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex')
}

const WEAK = new Set(q4c.weakD3Ids || [])

function classifyOne(c, fromWeak) {
  const stem = String(c.stem)
  const analysis = String(c.analysis)
  const hit = []
  if (fromWeak) hit.push('IN_WEAK_LIST')
  if (analysis.length < 45) hit.push('SHORT_ANALYSIS')
  if (c.qtype === 'judge' && stem.length < 55) hit.push('SHORT_JUDGE')
  if (/空集是任何|必然事件|两点确定|系统抽样属于|振幅是|i\^4=1|表面积为|摸 1 球/.test(stem))
    hit.push('TRIVIAL_FACT')
  if (/二分法.*下一步|取中点看符号/.test(stem + analysis)) hit.push('METHOD_STEP_ONLY')
  if (/\|\\vec a\+\\vec b\|\^2=|展开得|直接代入/.test(stem + analysis) && !/参数|分类|证明/.test(stem))
    hit.push('FORMULA_PLUG')
  if (/手修差异化|紧急去重|差异化压轴/.test(String(c.hardProfile?.coreChallenge || '')))
    hit.push('GENERIC_HP')

  let cls = 'B_REBUILD_REQUIRED'
  let reason = ''
  let derivation = ''

  // D: math issues (spot)
  if (c.qtype === 'numeric' && String(c.answer).includes('666666')) {
    cls = 'D_MATH_ISSUE'
    reason = '数值答案格式/精度异常'
  } else if (/空集是任何集合的子集|必然事件的概率为 1|平面内两点确定一条直线/.test(stem)) {
    cls = 'C_DOWNGRADE_REQUIRED'
    reason = '正确但属定义级识记，适合 d1/d2，不构成压轴'
    derivation = '命题本身正确；难度止于定义回忆，无分类/构造/综合推理'
  } else if (hit.includes('METHOD_STEP_ONLY') && analysis.length < 40) {
    cls = 'C_DOWNGRADE_REQUIRED'
    reason = '二分法“下一步”属方法步骤题，宜 d2'
    derivation = '只需回忆取中点，无方程求解或误差估计综合'
  } else if (
    // Rare TRUE_D3 mis-flag: need concrete multi-step + long analysis + conceptual trap
    !hit.includes('TRIVIAL_FACT') &&
    !hit.includes('FORMULA_PLUG') &&
    !hit.includes('METHOD_STEP_ONLY') &&
    analysis.length >= 90 &&
    (/(分类|证明|参数|定义域|象限|取等|反例|容斥|中位线|线面)/.test(stem + analysis) ||
      (c.qtype === 'application' && (c.rubric || []).length >= 3 && analysis.length >= 100))
  ) {
    cls = 'A_TRUE_D3'
    reason = '启发式可能因题干短/关键词触发；实际含综合推理'
    derivation = analysis.slice(0, 200)
  } else {
    cls = 'B_REBUILD_REQUIRED'
    reason = hit.join(',') || '偏弱：缺真实压轴推理链'
    derivation = `当前主路径偏短或偏套公式。stem=${stem.slice(0, 80)}`
  }

  // Override: never batch A for short judges
  if (cls === 'A_TRUE_D3' && (c.qtype === 'judge' && stem.length < 70)) {
    cls = 'B_REBUILD_REQUIRED'
    reason = '判断题过短，即使概念正确也宜重写为带条件的综合判断或改题型'
  }

  return {
    candidateId: c.id,
    contentSha256: sha(c),
    chapterNo: c.chapterNo,
    qtype: c.qtype,
    fromWeak,
    heuristicHits: hit,
    class: cls,
    heuristicReason: reason,
    mathDerivationNote: derivation,
    difficultyJudgement: cls.startsWith('A') ? 'KEEP_D3' : cls.startsWith('C') ? 'TO_D2' : 'REPLACE_AS_D3',
    proposedAction:
      cls === 'A_TRUE_D3'
        ? '保留并强化解析/hardProfile证据'
        : cls === 'C_DOWNGRADE_REQUIRED'
          ? '降为 d2，同章另补真 d3'
          : '整题替换为真压轴（先标准解后题干）',
  }
}

const records = []
for (const id of WEAK) {
  const c = byId.get(id)
  if (!c) continue
  records.push(classifyOne(c, true))
}

// Also scan non-weak d3 for formula plugs
for (const c of candidates.filter((x) => Number(x.difficulty) === 3 && !WEAK.has(x.id))) {
  const r = classifyOne(c, false)
  if (r.class !== 'A_TRUE_D3') records.push(r)
}

const summary = {
  A_TRUE_D3: records.filter((r) => r.class === 'A_TRUE_D3').length,
  B_REBUILD_REQUIRED: records.filter((r) => r.class === 'B_REBUILD_REQUIRED').length,
  C_DOWNGRADE_REQUIRED: records.filter((r) => r.class === 'C_DOWNGRADE_REQUIRED').length,
  D_MATH_ISSUE: records.filter((r) => r.class === 'D_MATH_ISSUE').length,
  totalClassified: records.length,
  weakInput: WEAK.size,
}

const out = {
  batch: 'GLOBAL-4D-HARD-D3-CLASSIFY',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  summary,
  records,
}
fs.writeFileSync(path.join(__dirname, '_4d_classify.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(summary, null, 2))
console.log(
  'A samples',
  records.filter((r) => r.class === 'A_TRUE_D3').slice(0, 8).map((r) => r.candidateId),
)
console.log(
  'C samples',
  records.filter((r) => r.class === 'C_DOWNGRADE_REQUIRED').map((r) => r.candidateId),
)
