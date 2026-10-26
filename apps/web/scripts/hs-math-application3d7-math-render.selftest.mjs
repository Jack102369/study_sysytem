/**
 * APPLICATION-3D-7 · AI 反馈公式渲染自测（纯 Node，无浏览器）
 * 运行：node apps/web/scripts/hs-math-application3d7-math-render.selftest.mjs
 *
 * 与 apps/web/src/utils/render-math.ts 的 renderMathHtml 行为对齐（自包含副本 + katex）。
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const katex = require(join(__dirname, '../node_modules/katex'))

/** 与 src/utils/render-math.ts 保持同步 */
function renderMathHtml(raw) {
  const text = String(raw || '')
  if (!text) return ''

  const escapeHtml = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const parts = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    parts.push(escapeHtml(text.slice(last, m.index)).replace(/\n/g, '<br/>'))
    const display = m[1] != null
    const latex = (display ? m[1] : m[2] || '').trim()
    try {
      parts.push(
        katex.renderToString(latex, {
          throwOnError: false,
          displayMode: display,
        }),
      )
    } catch {
      parts.push(escapeHtml(m[0]))
    }
    last = m.index + m[0].length
  }
  parts.push(escapeHtml(text.slice(last)).replace(/\n/g, '<br/>'))
  return parts.join('')
}

function assertHasKatex(html) {
  assert.ok(html.includes('katex'), `expected katex class: ${html.slice(0, 120)}`)
}

function assertNoRawDollarFormula(html, sample) {
  // 成功渲染后不应仍以 `$y=` 形式残留（转义后的非法段除外）
  assert.ok(
    !html.includes(sample),
    `raw formula still visible: ${sample}`,
  )
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('OK', name)
}

test('plain chinese', () => {
  const h = renderMathHtml('解答完整，书写规范。')
  assert.equal(h, '解答完整，书写规范。')
  assert.ok(!h.includes('katex'))
})

test('chinese + inline formula', () => {
  const h = renderMathHtml('正确建立模型 $y=2400x-30x^2$。')
  assert.ok(h.startsWith('正确建立模型 '))
  assertHasKatex(h)
  assert.ok(h.includes('2400'))
  assertNoRawDollarFormula(h, '$y=2400x-30x^2$')
})

test('display formula', () => {
  const h = renderMathHtml('$$y=-30(x-40)^2+48000$$')
  assertHasKatex(h)
  assert.ok(h.includes('katex-display') || h.includes('display'))
  assertNoRawDollarFormula(h, '$$y=-30(x-40)^2+48000$$')
})

test('fraction', () => {
  const h = renderMathHtml('分数 $\\frac{a}{b}$')
  assertHasKatex(h)
  assert.ok(h.includes('frac') || h.includes('mfrac') || h.includes('katex'))
})

test('sqrt', () => {
  const h = renderMathHtml('根号 $\\sqrt{x}$')
  assertHasKatex(h)
})

test('set', () => {
  const h = renderMathHtml('定义域 $\\{30, 31, \\ldots, 60\\}$')
  assertHasKatex(h)
  assertNoRawDollarFormula(h, '$\\{30, 31, \\ldots, 60\\}$')
})

test('superscript subscript', () => {
  const h = renderMathHtml('$x_1^2$ 与 $a_{n}$')
  assertHasKatex(h)
})

test('inequality', () => {
  const h = renderMathHtml('$x\\ge 30$ 且 $x\\le 60$')
  assertHasKatex(h)
})

test('multiline plain with formulas', () => {
  const h = renderMathHtml('第一行 $x=40$\n第二行结论')
  assert.ok(h.includes('<br/>'))
  assertHasKatex(h)
  assert.ok(h.includes('第二行结论'))
})

test('illegal latex no throw', () => {
  const h = renderMathHtml('坏公式 $\\unknowncmd{zzz}$ 仍可读')
  assert.ok(typeof h === 'string')
  assert.ok(h.includes('仍可读'))
})

test('malicious html escaped', () => {
  const h = renderMathHtml('<script>alert(1)</script>正常')
  assert.ok(!h.includes('<script>'))
  assert.ok(h.includes('&lt;script&gt;'))
  assert.ok(h.includes('正常'))
})

test('xss img onerror escaped', () => {
  const h = renderMathHtml('<img src=x onerror=alert(1)> 文本 $a=1$')
  assert.ok(!h.includes('<img'))
  assert.ok(h.includes('&lt;img'))
  assertHasKatex(h)
})

test('session107-like rubric feedback', () => {
  const samples = [
    '正确建立了收入函数模型 $y = 2400x - 30x^2$。',
    '准确给出了定义域 $\\{30, 31, \\ldots, 60\\}$，并指出了 $x$ 为整数的约束。',
    '使用了配方法 $y=-30(x-40)^2+48000$ 进行推导。',
  ]
  for (const s of samples) {
    const h = renderMathHtml(s)
    assertHasKatex(h)
    assert.ok(!/\$[^$]+\$/.test(h.replace(/<[^>]+>/g, '')), `raw $ left in text of: ${s}`)
  }
})

test('empty safe', () => {
  assert.equal(renderMathHtml(''), '')
  assert.equal(renderMathHtml(null), '')
})

console.log(`PASS ${passed} tests`)
