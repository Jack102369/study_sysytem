/**
 * Build 500 G4A slots: chapter/difficulty/qtype quotas + group assignment.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g4a_baseline_ro.json'), 'utf8'),
)
const kpBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_g3a_readonly_baseline.json'), 'utf8'),
)

const CH_PLAN = base.chapterAllocHint500
const CH_META = {
  'rja-ch1': { chapterNo: 1, book: '必修一', name: '集合与常用逻辑用语' },
  'rja-ch2': { chapterNo: 2, book: '必修一', name: '一元二次函数、方程和不等式' },
  'rja-ch3': { chapterNo: 3, book: '必修一', name: '函数的概念与性质' },
  'rja-ch4': { chapterNo: 4, book: '必修一', name: '指数函数与对数函数' },
  'rja-ch5': { chapterNo: 5, book: '必修一', name: '三角函数' },
  'rjb-ch1': { chapterNo: 6, book: '必修二', name: '平面向量及其应用' },
  'rjb-ch2': { chapterNo: 7, book: '必修二', name: '复数' },
  'rjb-ch3': { chapterNo: 8, book: '必修二', name: '立体几何初步' },
  'rjb-ch4': { chapterNo: 9, book: '必修二', name: '统计' },
  'rjb-ch5': { chapterNo: 10, book: '必修二', name: '概率' },
}

const kpsBySpec = {}
for (const k of kpBase.kps || []) {
  ;(kpsBySpec[k.specialtyCode] ||= []).push(k)
}

// expand chapter bags
const chapterBag = []
for (const [spec, n] of Object.entries(CH_PLAN)) {
  for (let i = 0; i < n; i++) chapterBag.push(spec)
}
// difficulty bags
const diffBag = [
  ...Array(175).fill(1),
  ...Array(200).fill(2),
  ...Array(125).fill(3),
]
const qtBag = [
  ...Array(150).fill('single'),
  ...Array(75).fill('multi'),
  ...Array(50).fill('judge'),
  ...Array(100).fill('numeric'),
  ...Array(125).fill('application'),
]

function shuffle(a, seed = 42) {
  const x = [...a]
  let s = seed
  for (let i = x.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[x[i], x[j]] = [x[j], x[i]]
  }
  return x
}

const specs = shuffle(chapterBag, 7)
const diffs = shuffle(diffBag, 11)
const qts = shuffle(qtBag, 13)

const slots = []
for (let i = 0; i < 500; i++) {
  const specialtyCode = specs[i]
  const meta = CH_META[specialtyCode]
  const kps = kpsBySpec[specialtyCode] || []
  const kp = kps[i % Math.max(kps.length, 1)] || {
    code: 'UNKNOWN',
    name: 'UNKNOWN',
  }
  const idNum = i + 1
  const group = Math.ceil(idNum / 100)
  const batch20 = Math.ceil(((idNum - 1) % 100) / 20) || 1
  slots.push({
    id: `CAND-G4A-${String(idNum).padStart(3, '0')}`,
    group,
    batch20,
    chapterNo: meta.chapterNo,
    book: meta.book,
    specialtyCode,
    chapterName: meta.name,
    difficulty: diffs[i],
    qtype: qts[i],
    kpHint: { code: kp.code, name: kp.name },
  })
}

// verify quotas
const ch = {},
  d = {},
  qt = {},
  g = {}
for (const s of slots) {
  ch[s.specialtyCode] = (ch[s.specialtyCode] || 0) + 1
  d[s.difficulty] = (d[s.difficulty] || 0) + 1
  qt[s.qtype] = (qt[s.qtype] || 0) + 1
  g[s.group] = (g[s.group] || 0) + 1
}

const out = {
  n: slots.length,
  quotas: { ch, d, qt, g },
  slots,
}
fs.mkdirSync(path.join(__dirname, 'bank_global4a'), { recursive: true })
fs.writeFileSync(
  path.join(__dirname, 'bank_global4a/_g4a_slots.json'),
  JSON.stringify(out, null, 2),
)
console.log(JSON.stringify({ n: out.n, quotas: out.quotas }, null, 2))
