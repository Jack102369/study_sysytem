/** Restore REQUIRED diagram flags + offline asset SHAs for manifest IDs; rebind d3 HP sha; sync groups. */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const diag = path.resolve(__dirname, '../../diagrams/required_g4a')
const mergePath = path.join(qb, 'candidates-g4a-500.mjs')
const { candidates: raw } = await import(pathToFileURL(mergePath).href + '?t=' + Date.now())
const list = raw.map((c) => ({ ...c }))
const byId = new Map(list.map((c) => [c.id, c]))

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

const manifestOld = JSON.parse(fs.readFileSync(path.join(diag, '_manifest.json'), 'utf8'))
const reqIds = (manifestOld.items || []).map((x) => x.code)
const items = []
for (const id of reqIds) {
  const c = byId.get(id)
  if (!c) continue
  const svgP = path.join(diag, `${id}.svg`)
  const pngP = path.join(diag, `${id}.png`)
  if (!fs.existsSync(svgP) || !fs.existsSync(pngP)) continue
  const shaS = crypto.createHash('sha256').update(fs.readFileSync(svgP)).digest('hex')
  const shaP = crypto.createHash('sha256').update(fs.readFileSync(pngP)).digest('hex')
  c.diagramRequirement = 'REQUIRED'
  c.noDiagramReason = null
  c.diagramSpecification = c.diagramSpecification || {
    purpose: '几何/结构示意',
    elements: ['关键标注'],
    mustNotReveal: '不得标注最终数值答案',
  }
  c.diagramSpecification.offlineAssets = {
    svgRelative: `diagrams/required_g4a/${id}.svg`,
    pngRelative: `diagrams/required_g4a/${id}.png`,
    sha256_svg: shaS,
    sha256_png: shaP,
    generatedAt: new Date().toISOString(),
  }
  items.push({
    code: id,
    svg: `${id}.svg`,
    png: `${id}.png`,
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
      batch: 'GLOBAL-4D-HARD-D3-REBUILD',
      n: items.length,
      independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
      items,
    },
    null,
    2,
  ),
)
for (const c of byId.values()) {
  if (Number(c.difficulty) === 3 && c.hardProfile) c.hardProfile.contentSha256 = sha(c)
}
const merged = list.map((c) => byId.get(c.id))
function write(file, header, arr) {
  fs.writeFileSync(file, `${header}\nexport const candidates = ${JSON.stringify(arr, null, 2)};\n`)
}
write(mergePath, '/** GLOBAL-4D HARD-D3-REBUILD merged 500 */', merged)
for (let g = 1; g <= 5; g++) {
  write(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4D group ${g} */`,
    merged.slice((g - 1) * 100, g * 100),
  )
}
console.log(JSON.stringify({ reqN: items.length }))
