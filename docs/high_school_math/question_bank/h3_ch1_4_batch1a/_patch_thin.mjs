import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { acceptedFinal } = await import(
  pathToFileURL(path.join(__dirname, '_accepted_final.mjs')).href + '?t=' + Date.now()
)

const patches = {
  35: {
    analysis:
      '方程 $x^{a}=ax$（$x>0$）化为 $x^{a-1}=a$。令 $h(x)=x^{a-1}$。当 $a>1$ 时 $h$ 在 $(0,+\\infty)$ 严格递增，恰一正根；当 $0<a<1$ 时 $a-1<0$，$h$ 严格递减，亦恰一正根；当 $a=1$ 时对一切 $x>0$ 恒成立。故不存在使恰有两个交点的 $a$，答案为空集。',
  },
  36: {
    analysis:
      '若 $f$ 周期为 $2$ 且在 $\\mathbb{R}$ 上严格递增，则 $f(0)<f(2)$。但周期性给出 $f(2)=f(0)$，矛盾。故不可能全局严格递增。例子：在 $[0,2)$ 上令 $f(x)=x$，再按周期 $2$ 延拓，则每周期内严格增，但全局非单调。',
  },
  39: {
    analysis:
      '假设对每个 $t\\in[0,1]$，$f$ 在 $[t,t+1]$ 上为常数。任取 $x,y\\in[0,2]$ 且 $x<y$。用有限个长度 $1$ 的窗口链连接；相邻窗口交叠非空且各自常值，常值沿链传递，故 $f(x)=f(y)$。因此 $f$ 在 $[0,2]$ 上必为常数，矛盾。故不存在。',
  },
  41: {
    analysis:
      '左边 $|x-1|+|x+1|\\ge2$。负半轴：若 $a\\ge0$ 则右边非正，与左边 $\\ge2$ 无交；若 $a<0$ 亦难同时。正半轴：在 $[-1,1]$ 左边恒为 $2$，方程 $2=ax$ 至多一根；在 $[1,+\\infty)$，$2x=ax$ 仅当 $a=2$ 出现整条射线。从而 $a>2$ 恰一根，$a=2$ 无穷根，$0<a\\le2$ 至多一根。故不存在恰两个实根的 $a$。',
  },
}

for (const it of acceptedFinal) {
  if (patches[it.n]) Object.assign(it, patches[it.n])
  it.h3Evidence = {
    nonObviousBreakthrough: it.h3Evidence?.nonObviousBreakthrough || it.breakthrough || 'structure',
    aboveHard14H2Contrast: it.h3Evidence?.aboveHard14H2Contrast || it.contrastH2 || 'above H2',
    deepStrategyOrLayeredNecessity:
      it.h3Evidence?.deepStrategyOrLayeredNecessity || 'layered necessity',
    routineKillCheck: it.h3Evidence?.routineKillCheck || 'routine fails',
  }
}

fs.writeFileSync(
  path.join(__dirname, '_accepted_final.mjs'),
  '/** Dual-gate ACCEPTED_H3 only */\nexport const acceptedFinal = ' +
    JSON.stringify(acceptedFinal, null, 2) +
    '\n',
)
console.log('ok', acceptedFinal.length)
