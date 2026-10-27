import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const p = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../candidates-g4a-500.mjs')
let t = fs.readFileSync(p, 'utf8')
// Replace literal backslash-n after ];
if (t.endsWith('];\\n')) {
  t = t.slice(0, -4) + '];\n'
} else {
  t = t.replace(/\];\\n\s*$/, '];\n')
}
fs.writeFileSync(p, t)
console.log('tail', JSON.stringify(t.slice(-15)))
