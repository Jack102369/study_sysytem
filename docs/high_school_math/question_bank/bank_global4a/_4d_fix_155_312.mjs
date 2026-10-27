import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const mergePath = path.join(qb, 'candidates-g4a-500.mjs')
const { candidates } = await import(pathToFileURL(mergePath).href + '?t=' + Date.now())
const list = candidates.map((c) => ({ ...c }))
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

{
  const c = byId.get('CAND-G4A-155')
  c.stem =
    '【积定和最小】正实数 $x,y$ 满足 $xy=5$。求 $(x+y)$ 最小值的平方（填整数）'
  c.answer = '20'
  c.analysis =
    '由基本不等式 $x+y\\ge 2\\sqrt{xy}=2\\sqrt{5}$，两边平方得最小值之平方为 $20$。取等条件 $x=y=\\sqrt{5}$。考查积定和最小及取等。'
  c.hardProfile = {
    coreChallenge: '积定求和最小并处理无理形式',
    reasoningSteps: ['均值不等式', '取等', '平方得整数'],
    difficultyEvidence: '需取等意识与平方转化',
    misconceptionTrap: '漏取等或直接填无理数无法适配',
    alternativeApproach: '设 y=5/x 配方',
    verification: '20',
    contentSha256: '',
  }
}

{
  const c = byId.get('CAND-G4A-312')
  c.stem = '【锥体体积】圆锥底半径 $2$、高 $5$，求体积除以 $\\pi$ 后的值（最简分数）'
  c.answer = '20/3'
  c.analysis =
    '体积 $V=\\dfrac13\\pi r^{2}h=\\dfrac13\\pi\\cdot 4\\cdot 5=\\dfrac{20}{3}\\pi$，故 $V/\\pi=20/3$。关键在于锥体公式系数 $\\dfrac13$。'
  c.hardProfile = {
    coreChallenge: '圆锥体积公式含1/3',
    reasoningSteps: ['写公式', '代入', '约分'],
    difficultyEvidence: '1/3易漏',
    misconceptionTrap: '答20或40/3',
    alternativeApproach: '与等底等高柱比较',
    verification: '20/3',
    contentSha256: '',
  }
}

for (const c of byId.values()) {
  if (Number(c.difficulty) === 3 && c.hardProfile) {
    c.hardProfile.contentSha256 = sha(c)
  }
}

const merged = list.map((c) => byId.get(c.id))
function write(file, header, arr) {
  fs.writeFileSync(file, `${header}\nexport const candidates = ${JSON.stringify(arr, null, 2)};\n`)
}
write(mergePath, '/** GLOBAL-4D HARD-D3-REBUILD merged 500 (fixup2) */', merged)
for (let g = 1; g <= 5; g++) {
  write(
    path.join(__dirname, `g4a_group0${g}.mjs`),
    `/** GLOBAL-4D group ${g} */`,
    merged.slice((g - 1) * 100, g * 100),
  )
}
console.log('ok', byId.get('CAND-G4A-155').answer, byId.get('CAND-G4A-312').answer)
