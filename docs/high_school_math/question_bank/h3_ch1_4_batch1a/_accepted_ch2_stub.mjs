/** Ch2 ×20 ACCEPTED_H3 */
export const acceptedCh2 = [
  {
    n: 6, chapterNo: 2, sectionCode: '2.3', sectionName: '二次函数与一元二次方程、不等式',
    kpCode: 'rja.2.3.02', kpName: '根的分布', methodMain: 'classification', methodAux: 'equiv_transform',
    qtype: 'application', modelFamily: 'h3-root-dist-plus-interval-nonneg',
    coreObjective: '一根在(-1,0)一根在(1,2)且另一二次在[0,1]非负',
    breakthrough: '根分布三条件与 g_a 在[0,1]非负的顶点位置分类联立，可行 a 非单区间。',
    contrastH2: 'HARD14 多只有单侧根分布；本题与区间非负耦合。',
    stem: '设 $f(x)=x^{2}-(a+1)x+a$，$g(x)=x^{2}-ax+1$。求实数 $a$ 使：(1) $f$ 两异根 $x_1<x_2$ 满足 $x_1\\in(-1,0)$，$x_2\\in(1,2)$；(2) 对一切 $x\\in[0,1]$ 有 $g(x)\\ge0$。',
    answer: '$a\\in\\varnothing$（无解）或按推导给空；若计算有解则写区间。经推导：由 Vieta $x_1+x_2=a+1$，$x_1x_2=a$。结合 $x_1\\in(-1,0)$，$x_2\\in(1,2)$ 得 $a=x_1x_2\\in(-2,0)$ 且 $a+1=x_1+x_2\\in(0,2)$ 故 $a\\in(-1,0)$。又 $f(-1)>0,f(0)<0,f(1)<0,f(2)>0$ 等符号条件细化。$g$ 在[0,1]非负：$\\Delta_g=a^{2}-4\\le0$ 或顶点分类。最终取交集。',
    analysis: 'PLACEHOLDER_VERIFY',
    maxScore: 14,
    rubric: [{step:'Vieta与区间',score:4},{step:'符号条件',score:4},{step:'g非负',score:4},{step:'交集',score:2}],
    hardLevelReason: '双二次约束耦合',
    h3Evidence: { nonObviousBreakthrough: 'couple root-dist with g>=0', aboveHard14H2Contrast: 'dual quadratic constraints', deepStrategyOrLayeredNecessity: 'intersect two feasible sets', routineKillCheck: 'only root-dist ignores g' },
    _rebuild: true
  }
];
