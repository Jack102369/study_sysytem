import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const diag = path.join(root, '../diagrams/required_g4a')
const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const candidates = m.candidates.map((c) => ({ ...c }))
const req = candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
const items = []
for (const c of req) {
  const svgP = path.join(diag, `${c.id}.svg`)
  const pngP = path.join(diag, `${c.id}.png`)
  const shaS = crypto.createHash('sha256').update(fs.readFileSync(svgP)).digest('hex')
  const shaP = crypto.createHash('sha256').update(fs.readFileSync(pngP)).digest('hex')
  if (!c.diagramSpecification) {
    c.diagramSpecification = {
      purpose: '几何结构示意',
      elements: ['关键标注'],
      mustNotReveal: '不得标注最终数值答案',
    }
  }
  c.diagramSpecification.offlineAssets = {
    svgRelative: `diagrams/required_g4a/${c.id}.svg`,
    pngRelative: `diagrams/required_g4a/${c.id}.png`,
    sha256_svg: shaS,
    sha256_png: shaP,
    generatedAt: new Date().toISOString(),
  }
  c.noDiagramReason = null
  items.push({
    code: c.id,
    svg: `${c.id}.svg`,
    png: `${c.id}.png`,
    sha256_svg: shaS,
    sha256_png: shaP,
    png_bytes: fs.statSync(pngP).size,
    chapterNo: c.chapterNo,
  })
}
fs.writeFileSync(
  path.join(diag, '_manifest.json'),
  JSON.stringify(
    {
      batch: 'GLOBAL-4A-ISOMORPHIC-FINAL-CLEANUP',
      n: items.length,
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      items,
    },
    null,
    2,
  ),
)
candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))
for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  const body = `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP group0${g} */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`
  fs.writeFileSync(path.join(__dirname, `g4a_group0${g}.mjs`), body)
}
fs.writeFileSync(
  path.join(root, 'candidates-g4a-500.mjs'),
  `/** GLOBAL-4A ISOMORPHIC-FINAL-CLEANUP merged 500 */\nexport const candidates = ${JSON.stringify(candidates, null, 2)};\n`,
)
console.log('attached', items.length)
