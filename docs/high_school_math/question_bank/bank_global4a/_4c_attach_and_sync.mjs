import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const diag = path.resolve(__dirname, '../../diagrams/required_g4a')
const mergePath = path.join(qb, 'candidates-g4a-500.mjs')

const mod = await import(pathToFileURL(mergePath).href + '?t=' + Date.now())
const candidates = (mod.candidates || []).map((c) => ({ ...c }))
if (candidates.length !== 500) throw new Error(`expected 500 got ${candidates.length}`)

const items = []
const missing = []
for (const c of candidates) {
  if (c.diagramRequirement !== 'REQUIRED') continue
  const svgP = path.join(diag, `${c.id}.svg`)
  const pngP = path.join(diag, `${c.id}.png`)
  if (!fs.existsSync(svgP) || !fs.existsSync(pngP)) {
    missing.push(c.id)
    continue
  }
  const shaS = crypto.createHash('sha256').update(fs.readFileSync(svgP)).digest('hex')
  const shaP = crypto.createHash('sha256').update(fs.readFileSync(pngP)).digest('hex')
  c.diagramSpecification = c.diagramSpecification || {
    purpose: '几何结构示意',
    elements: ['关键标注'],
    mustNotReveal: '不得标注最终数值答案',
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
      batch: 'GLOBAL-4C-D3-QUALITY-FIX',
      n: items.length,
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      items,
    },
    null,
    2,
  ),
)

candidates.sort((a, b) => parseInt(a.id.slice(-3), 10) - parseInt(b.id.slice(-3), 10))

function writeCandidates(filePath, header, arr) {
  fs.writeFileSync(filePath, `${header}\nexport const candidates = ${JSON.stringify(arr, null, 2)};\n`)
}

writeCandidates(mergePath, '/** GLOBAL-4C D3-QUALITY-FIX merged 500 */', candidates)
for (let g = 1; g <= 5; g++) {
  writeCandidates(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4C group ${g} */`,
    candidates.slice((g - 1) * 100, g * 100),
  )
}

const quotas = { d: {}, qt: {}, ch: {} }
for (const c of candidates) {
  quotas.d[c.difficulty] = (quotas.d[c.difficulty] || 0) + 1
  quotas.qt[c.qtype] = (quotas.qt[c.qtype] || 0) + 1
  quotas.ch[c.chapterNo] = (quotas.ch[c.chapterNo] || 0) + 1
}

console.log(
  JSON.stringify(
    {
      n: candidates.length,
      attached: items.length,
      missing,
      quotas,
    },
    null,
    2,
  ),
)
