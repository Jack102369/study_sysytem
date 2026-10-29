import fs from 'node:fs'
import path from 'node:path'
import { qb } from './_hard14_lib.mjs'

function patch(file, fn) {
  const p = path.join(qb, file)
  let s = fs.readFileSync(p, 'utf8')
  const n = s
  s = fn(s)
  fs.writeFileSync(p, s)
  return s !== n
}

function setHardLevel(s, idNum, level) {
  const id = `CAND-HARD14-${idNum}`
  const re = new RegExp(
    `(id: '${id}'[\\s\\S]*?hardLevel: ')H[123](')`,
  )
  if (!re.test(s)) {
    // try double-quote style
    const re2 = new RegExp(`("id": "${id}"[\\s\\S]*?"hardLevel": ")H[123](")`)
    if (re2.test(s)) return s.replace(re2, `$1${level}$2`)
    console.log('warn: not found', id)
    return s
  }
  return s.replace(re, `$1${level}$2`)
}

patch('_hard14_cand_g2.mjs', (s) => {
  s = setHardLevel(s, '030', 'H1')
  s = setHardLevel(s, '031', 'H1')
  s = setHardLevel(s, '034', 'H1')
  s = s.replaceAll('上导数 $2x-1$', '上配方分析')
  s = s.replaceAll('分段最小值可用导数/端点完成。', '分段最小值用配方与端点比较完成。')
  s = s.replaceAll('可用导数/端点', '可用配方/端点')
  return s
})

patch('_hard14_cand_g5.mjs', (s) => setHardLevel(s, '100', 'H2'))

patch('_hard14_cand_g4.mjs', (s) => {
  const old = "stem: '下列说法正确的是（多选）'"
  const neu =
    "stem: '设 $a<b$，函数 $f(x)=\\\\sqrt{\\\\dfrac{x-a}{b-x}}$；又设 $g(x)=\\\\sqrt{\\\\dfrac{4-x^2}{1+x^2}}$。下列说法正确的是（多选）'"
  if (!s.includes(old)) {
    // try double quotes / template
    const old2 = 'stem: "下列说法正确的是（多选）"'
    if (s.includes(old2)) {
      return s.replace(
        old2,
        'stem: "设 $a<b$，函数 $f(x)=\\\\sqrt{\\\\dfrac{x-a}{b-x}}$；又设 $g(x)=\\\\sqrt{\\\\dfrac{4-x^2}{1+x^2}}$。下列说法正确的是（多选）"',
      )
    }
    console.log('warn: 070 stem pattern not found')
    return s
  }
  return s.replace(old, neu)
})

console.log('done')
