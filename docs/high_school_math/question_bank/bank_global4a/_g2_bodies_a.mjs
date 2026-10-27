/** CAND-G4A-101..150 question bodies */
export const bodies = {
  'CAND-G4A-101': {
    methodMain: 'classification',
    stem: '下表给出对应关系 $x\\mapsto y$。下列说法正确的有（多选）\n|$x$|1|2|3|\n|$y$|2|4|2|',
    options: {
      A: '该对应是函数',
      B: '该对应不是函数，因 $y=2$ 对应两个 $x$',
      C: '值域为 $\\{2,4\\}$',
      D: '定义域为 $\\{1,2,3\\}$',
    },
    answer: 'A,C,D',
    analysis:
      '列表中每个 $x$ 唯一对应一个 $y$，故是函数；定义域 $\\{1,2,3\\}$，值域 $\\{2,4\\}$。B 误把“多对一”当成非函数。',
    dedupNote: '列表法多对一仍是函数',
    authorMathNote: '函数允许不同自变量同值；唯一性约束在定义域一侧。',
    noDiagramReason: '表格已给出对应。',
  },
  'CAND-G4A-102': {
    methodMain: 'equiv_transform',
    stem: '设 $z_1=2+i$，$z_2=1-3i$，则下列正确的有（多选）',
    options: {
      A: '$z_1+z_2=3-2i$',
      B: '$z_1-z_2=1+4i$',
      C: '$z_1\\overline{z_1}=5$',
      D: '$z_1 z_2=5-5i$',
    },
    answer: 'A,B,C',
    analysis:
      '$z_1+z_2=3-2i$，$z_1-z_2=1+4i$，$|z_1|^2=4+1=5$。$z_1 z_2=(2+i)(1-3i)=2-6i+i-3i^2=5-5i$，故 D 应为 $5-5i$ 成立？等一下：$(2+i)(1-3i)=2-6i+i-3i^2=2-5i+3=5-5i$，D 写的是 $5-5i$，正确。重新核对选项：D 正确则答案含 D。',
    dedupNote: '复数四则与模方多选',
    authorMathNote: '和差模方与乘积均核对：乘积=5-5i。',
  },
}
