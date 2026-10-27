import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const man = JSON.parse(
  fs.readFileSync(
    path.join(root, '..', 'diagrams', 'required_g4a', '_manifest.json'),
    'utf8',
  ),
)
const byId = Object.fromEntries(man.items.map((i) => [i.code, i]))

// Load from groups (merge file may be corrupted)
const candidates = []
for (let g = 1; g <= 5; g++) {
  const m = await import(
    pathToFileURL(path.join(__dirname, `g4a_group0${g}.mjs`)).href + '?t=' + Date.now()
  )
  candidates.push(...m.candidates)
}

let attached = 0
for (const c of candidates) {
  if (c.diagramRequirement === 'REQUIRED' && byId[c.id]) {
    const d = byId[c.id]
    c.diagramSpecification = {
      ...(c.diagramSpecification || {}),
      offlineAssets: {
        svg: `diagrams/required_g4a/${d.svg}`,
        png: `diagrams/required_g4a/${d.png}`,
        sha256_svg: d.sha256_svg,
        sha256_png: d.sha256_png,
      },
      expectedPngSha256: d.sha256_png,
    }
    attached++
  }
}

const meta = {
  batch: 'GLOBAL-4A',
  n: candidates.length,
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  required: candidates.filter((c) => c.diagramRequirement === 'REQUIRED').map((c) => c.id),
  requiredAttached: attached,
  diagramManifestN: man.n,
  statusHint: 'QUALITY_PARTIAL',
  fixRound: 3,
  completedAt: new Date().toISOString(),
}

const header =
  '/** GLOBAL-4A merged 500 — offline; INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED */\n'
fs.writeFileSync(
  path.join(root, 'candidates-g4a-500.mjs'),
  header +
    'export const candidates = ' +
    JSON.stringify(candidates, null, 2) +
    ';\n' +
    'export const meta = ' +
    JSON.stringify(meta, null, 2) +
    ';\n',
)

for (let g = 1; g <= 5; g++) {
  const part = candidates.filter((c) => {
    const n = parseInt(c.id.slice(-3), 10)
    return n >= (g - 1) * 100 + 1 && n <= g * 100
  })
  fs.writeFileSync(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4A group0${g} final */\nexport const candidates = ${JSON.stringify(part, null, 2)};\n`,
  )
}

console.log(JSON.stringify({ n: candidates.length, attached, required: meta.required.length }, null, 2))
