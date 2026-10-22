'use strict'
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, 'models')
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')) continue
  const p = path.join(dir, f)
  let s = fs.readFileSync(p, 'utf8')
  // string fields wrongly closed with "],
  s = s.replace(/"(breakthrough|coreMethod)":\s*"([^"]*)"\],/g, '"$1": "$2",')
  fs.writeFileSync(p, s)
  try {
    JSON.parse(s)
    console.log(f, 'OK')
  } catch (e) {
    console.log(f, e.message)
  }
}
