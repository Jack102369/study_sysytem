import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const { candidates } = await import(pathToFileURL(path.join(qb, 'h3_ch1_4_candidates.mjs')).href + '?t=' + Date.now())
const pack = candidates.map((c) => ({
  id: c.id,
  chapterNo: c.chapterNo,
  modelFamily: c.modelFamily || c.compareDowngrade?.structureType,
  kpCode: c.kpCode,
  stem: c.stem,
  answer: c.answer,
  analysis: c.analysis,
  maxScore: c.maxScore,
  rubric: c.rubric,
  h3Evidence: c.h3Evidence,
  contentSha256: c.hardProfile?.contentSha256,
}))
fs.writeFileSync(path.join(__dirname, '_strict_2f_review_pack.json'), JSON.stringify(pack, null, 2))
console.log('wrote', pack.length)
