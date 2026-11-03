import { parseModelAnalysisJson } from '../apps/api/dist/ai-ocr/util/ai-ocr-helpers.js'

const cases = [
  [
    'think-wrap',
    `<think>草稿 { "a": 1 </think>\n{"answer":"(1) (-1,-1)","analysis":"化简后验算","knowledgePoints":"对称","methodSummary":"先化简"}`,
  ],
  [
    'raw-latex',
    `{"answer":"(-1,-1)","analysis":"f(x)=\\frac{x^2+1}{x+1} 得对称中心","knowledgePoints":"a","methodSummary":"b"}`,
  ],
  [
    'trailing-comma',
    `{"answer":"1","analysis":"步骤","knowledgePoints":"k","methodSummary":"m",}`,
  ],
  [
    'array-fields',
    `{"answer":["(1) a","(2) b"],"analysis":["步1","步2"],"knowledgePoints":"k","methodSummary":"m"}`,
  ],
]

let failed = 0
for (const [name, raw] of cases) {
  const r = parseModelAnalysisJson(raw)
  console.log(name, r.ok ? 'ok' : r.reason, r.ok ? r.value.answer.slice(0, 40) : '')
  if (!r.ok) failed++
}
process.exit(failed ? 1 : 0)
