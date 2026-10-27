import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const files = [
  'g4a_group01.mjs',
  'g4a_group02.mjs',
  'g4a_group03.mjs',
  'g4a_group04.mjs',
  'g4a_group05.mjs',
  path.join('..', 'candidates-g4a-500.mjs'),
]

for (const f of files) {
  const p = path.join(__dirname, f)
  let s = fs.readFileSync(p, 'utf8')
  // Structural corruptions only (from PowerShell \\n writes):
  // 1) comment close then literal \n then export
  s = s.replace(/\*\/\\nexport /g, '*/\nexport ')
  // 2) end of candidates array then literal \n (optional export meta)
  s = s.replace(/\];\\nexport /g, '];\nexport ')
  s = s.replace(/\];\\n\s*$/g, '];\n')
  // 3) end of meta object
  s = s.replace(/\};\\n\s*$/g, '};\n')
  fs.writeFileSync(p, s)
  // verify load by checking no trailing structural \\n
  const tail = s.slice(-20).replace(/\n/g, '↵')
  console.log(f, 'tail=', JSON.stringify(s.slice(-12)))
}
