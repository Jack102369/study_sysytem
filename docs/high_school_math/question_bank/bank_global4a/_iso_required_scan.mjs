import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const diag = path.join(root, '../diagrams/required_g4a')
const m = await import(pathToFileURL(path.join(root, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now())
const req = m.candidates.filter((c) => c.diagramRequirement === 'REQUIRED')
const missing = []
const items = []
for (const c of req) {
  const svg = path.join(diag, `${c.id}.svg`)
  const png = path.join(diag, `${c.id}.png`)
  const okS = fs.existsSync(svg)
  const okP = fs.existsSync(png)
  if (!okS || !okP) missing.push(c.id)
  items.push({
    code: c.id,
    chapterNo: c.chapterNo,
    svg: `${c.id}.svg`,
    png: `${c.id}.png`,
    sha256_svg: okS ? crypto.createHash('sha256').update(fs.readFileSync(svg)).digest('hex') : null,
    sha256_png: okP ? crypto.createHash('sha256').update(fs.readFileSync(png)).digest('hex') : null,
    hasSvg: okS,
    hasPng: okP,
  })
}
fs.writeFileSync(path.join(__dirname, '_required_list.json'), JSON.stringify(req.map((c) => c.id), null, 2))
fs.writeFileSync(path.join(__dirname, '_iso_required_scan.json'), JSON.stringify({ n: req.length, missing, items }, null, 2))
console.log(JSON.stringify({ n: req.length, missing: missing.length, missingIds: missing }, null, 2))
