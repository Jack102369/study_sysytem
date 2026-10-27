/**
 * GLOBAL-4C: classify all difficulty=3 into KEEP / REWRITE / DOWNGRADE_JUDGE
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const { candidates } = await import(
  pathToFileURL(path.join(qb, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)
const pre = JSON.parse(
  fs.readFileSync(path.join(qb, 'global4b_import_preflight_results.json'), 'utf8'),
)
const FALSE_HARD = new Set(pre.counts.d3FalseHardIds || [])

function contentSha(c) {
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

const WEAK_STEM = [
  /样本平均数可用于估计/,
  /线性回归方程一定经过每一个样本点/,
  /圆锥体积公式含系数/,
  /振幅可为负数/,
  /任意两个非零向量都可作基底/,
  /\\cos\(-x\)=\\cos x/,
  /\\sin\(\\pi-\\theta\)=\\sin\\theta/,
  /\\log_2\s*2\s*=/,
  /二分法依据/,
  /由定义\/公式直接判定/,
  /选 A。?$/,
  /个位数/,
  /参数\s*\$p=/,
]

function isWeak(c) {
  const stem = String(c.stem)
  const analysis = String(c.analysis)
  const reasons = []
  if (FALSE_HARD.has(c.id)) reasons.push('FALSE_HARD_LIST')
  if (c.qtype === 'judge' && stem.length < 80 && analysis.length < 80)
    reasons.push('TRIVIAL_JUDGE')
  if (analysis.length < 40) reasons.push('SHORT_ANALYSIS')
  if (stem.length < 25 && c.qtype !== 'judge') reasons.push('TINY_STEM')
  if (/^选\s*A/.test(analysis) || analysis === '定义。' || analysis === '由定义/公式直接判定。')
    reasons.push('BOILERPLATE')
  for (const re of WEAK_STEM) {
    if (re.test(stem) || re.test(analysis)) {
      reasons.push('WEAK_PATTERN')
      break
    }
  }
  // formula-only |a+b|^2 with all numbers given, short
  if (
    /\|\\vec a\+\\vec b\|\^2/.test(stem) &&
    analysis.length < 90 &&
    !/参数|分类|讨论/.test(stem)
  )
    reasons.push('PURE_FORMULA_PLUG')
  if (/^\$\\log/.test(stem) && stem.length < 20) reasons.push('TRIVIAL_LOG')
  return reasons
}

const d3 = candidates.filter((c) => Number(c.difficulty) === 3)
const inventory = []
for (const c of d3) {
  const reasons = isWeak(c)
  let action = 'KEEP_ATTACH_HP'
  if (reasons.includes('FALSE_HARD_LIST') || reasons.includes('TRIVIAL_JUDGE')) {
    // Prefer rewrite-as-hard same qtype; judges get hard conceptual rewrite
    action = 'REWRITE_HARD'
  } else if (
    reasons.includes('WEAK_PATTERN') ||
    reasons.includes('BOILERPLATE') ||
    reasons.includes('TRIVIAL_LOG') ||
    reasons.includes('TINY_STEM') ||
    (reasons.includes('SHORT_ANALYSIS') && reasons.includes('PURE_FORMULA_PLUG'))
  ) {
    action = 'REWRITE_HARD'
  } else if (reasons.includes('SHORT_ANALYSIS') || reasons.includes('PURE_FORMULA_PLUG')) {
    action = 'ENRICH_OR_REWRITE'
  }
  inventory.push({
    id: c.id,
    chapterNo: c.chapterNo,
    qtype: c.qtype,
    kpCode: c.kpCode,
    oldSha: contentSha(c),
    stemPreview: String(c.stem).slice(0, 100),
    reasons,
    action,
    problemType:
      action === 'REWRITE_HARD'
        ? 'FALSE_OR_WEAK_D3'
        : reasons.length
          ? 'EVIDENCE_GAP'
          : 'KEEP_CANDIDATE',
    proposedFix:
      action === 'REWRITE_HARD'
        ? '整题重写为同章同题型真压轴并写 hardProfile'
        : '保留骨架，补全解析与 7 字段 hardProfile，必要时局部加强',
  })
}

const summary = {
  total: inventory.length,
  REWRITE_HARD: inventory.filter((x) => x.action === 'REWRITE_HARD').length,
  ENRICH_OR_REWRITE: inventory.filter((x) => x.action === 'ENRICH_OR_REWRITE').length,
  KEEP_ATTACH_HP: inventory.filter((x) => x.action === 'KEEP_ATTACH_HP').length,
  byQtypeRewrite: {},
}
for (const x of inventory.filter((i) => i.action === 'REWRITE_HARD')) {
  summary.byQtypeRewrite[x.qtype] = (summary.byQtypeRewrite[x.qtype] || 0) + 1
}

const out = { batch: 'GLOBAL-4C-D3-CLASSIFY', summary, inventory }
fs.writeFileSync(path.join(__dirname, '_4c_problem_inventory.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(summary, null, 2))
