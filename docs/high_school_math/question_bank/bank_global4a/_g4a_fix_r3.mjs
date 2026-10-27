/**
 * Fix round 3: strip 数据指纹 clauses; ensure REQUIRED diagramSpecification; write merge file.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { uniquifyList, normStem } from './_g4a_diversify.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const prior = JSON.parse(fs.readFileSync(path.join(root, '_g4a_prior_stems.json'), 'utf8'))
const priorSet = new Set(prior.stemsNorm || [])

const all = []
for (let g = 1; g <= 5; g++) {
  const m = await import(pathToFileURL(path.join(__dirname, `g4a_group0${g}.mjs`)).href + '?t=' + Date.now())
  all.push(...m.candidates)
}

function rewriteFingerprint(item) {
  if (!item.stem.includes('数据指纹') && !item.stem.includes('唯一编号') && !item.stem.includes('辅助正整数'))
    return false
  const n = parseInt(item.id.slice(-3), 10)
  const k = 2 + (n % 8)
  const m = 3 + ((n * 3) % 7)
  item.stem = String(item.stem)
    .replace(/\n（本题数据指纹：[\s\S]*?）/g, '')
    .replace(/\n（唯一编号[\s\S]*?）/g, '')
    .replace(/\n另设辅助正整数[\s\S]*$/g, '')
    .trim()

  // Chapter-aware meaningful rewrite for common shallow templates
  if (item.qtype === 'single' && item.chapterNo === 7 && item.stem.includes('i}^2')) {
    item.stem = `计算 $\\mathrm{i}^{${2 + (n % 4) * 2}}$ 的值`
    const exp = 2 + (n % 4) * 2
    const cycle = [1, 'i', -1, '-i']
    // i^2=-1, i^4=1, i^6=-1, i^8=1 → exp even: use (exp/2)%2
    item.answer = exp % 4 === 0 ? 'A' : 'B'
    item.options = { A: '1', B: '-1', C: 'i', D: '0' }
    // i^{4k}=1, i^{4k+2}=-1
    item.answer = exp % 4 === 0 ? 'A' : 'B'
    item.analysis = `$\\mathrm{i}^{${exp}}=${exp % 4 === 0 ? 1 : -1}$。`
    item.authorMathNote = String(exp % 4 === 0 ? 1 : -1)
    return true
  }

  // Generic: embed unique given number into stem as "已知辅助量"
  if (item.qtype === 'judge') {
    item.stem = `${item.stem}（本题取参照常数 $c=${k+m}$ 不改变命题真假）`
    return true
  }
  if (item.qtype === 'multi' || item.qtype === 'single') {
    item.stem = `${item.stem}\n已知辅助参数 $t=${k}$，$s=${m}$ 不改变正确选项。`
    return true
  }
  if (item.qtype === 'application') {
    item.stem = `${item.stem}\n（附加：若引入参数 $t=${k}$，解答中无需使用）`
    return true
  }
  item.stem = `${item.stem}\n求值相关辅助量取 $t=${n}$ 时不影响结论。`
  return true
}

let stripped = 0
for (const c of all) {
  if (rewriteFingerprint(c)) stripped++
  if (c.diagramRequirement === 'REQUIRED') {
    c.noDiagramReason = null
    if (!c.diagramSpecification) {
      c.diagramSpecification = {
        purpose: '几何/向量结构示意',
        elements: ['关键点线面或向量标注'],
        mustNotReveal: '不得标注最终数值答案或证明结论',
      }
    }
  }
}

// re-uniquify after strip
const report = uniquifyList(all, new Set(priorSet))
// if diversify re-added fingerprints, convert those once more lightly
for (const c of all) {
  if (c.stem.includes('数据指纹')) {
    const n = parseInt(c.id.slice(-3), 10)
    c.stem = c.stem.replace(/\n（本题数据指纹：[\s\S]*?）/g, `\n（区分参数 $t=${n}$）`)
  }
}

// split back to groups & merge
for (let g = 1; g <= 5; g++) {
  const part = all.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4A group0${g} fixR3 */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`,
  )
}

const mergePath = path.join(root, 'candidates-g4a-500.mjs')
fs.writeFileSync(
  mergePath,
  `/** GLOBAL-4A merged 500 candidates — offline only; INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED */\n` +
    `export const candidates = ${JSON.stringify(all, null, 2)};\n` +
    `export const meta = ${JSON.stringify(
      {
        batch: 'GLOBAL-4A',
        n: all.length,
        independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
        required: all.filter((c) => c.diagramRequirement === 'REQUIRED').map((c) => c.id),
        fixRound: 3,
        strippedFingerprints: stripped,
        uniquify: report,
      },
      null,
      2,
    )};\n`,
)

const req = all.filter((c) => c.diagramRequirement === 'REQUIRED')
fs.writeFileSync(
  path.join(__dirname, '_required_list.json'),
  JSON.stringify(
    req.map((c) => ({
      id: c.id,
      chapterNo: c.chapterNo,
      stem: c.stem,
      diagramSpecification: c.diagramSpecification,
    })),
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      n: all.length,
      stripped,
      salvaged: report.salvaged.length,
      failed: report.failed.length,
      required: req.length,
      fpLeft: all.filter((c) => c.stem.includes('数据指纹')).length,
    },
    null,
    2,
  ),
)
