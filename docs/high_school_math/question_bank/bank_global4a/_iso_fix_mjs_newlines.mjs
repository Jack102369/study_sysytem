import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const files = [
  path.join(__dirname, '../candidates-g4a-500.mjs'),
  path.join(__dirname, 'g4a_group01.mjs'),
  path.join(__dirname, 'g4a_group02.mjs'),
  path.join(__dirname, 'g4a_group03.mjs'),
  path.join(__dirname, 'g4a_group04.mjs'),
  path.join(__dirname, 'g4a_group05.mjs'),
]

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8')
  const before = s
  // Fix literal \n sequences that should be real newlines in header/footer only.
  // Pattern produced by bad template: */\nexport and ];\n
  s = s.replace(/\*\/\\nexport/g, '*/\nexport')
  s = s.replace(/\];\\n\s*$/g, '];\n')
  // Also if whole file somehow used \\n as separators outside JSON strings — don't touch JSON content.
  if (s !== before) {
    fs.writeFileSync(f, s)
    console.log('fixed', path.basename(f))
  } else {
    console.log('ok   ', path.basename(f))
  }
  // verify parse by checking endsWith
  const tail = s.slice(-20)
  console.log('  tail', JSON.stringify(tail))
}
