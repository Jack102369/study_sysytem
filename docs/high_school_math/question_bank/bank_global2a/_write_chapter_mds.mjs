import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candPath = path.resolve(__dirname, '../candidates-g2a-100.mjs');
const { candidates } = await import(pathToFileURL(candPath).href);

const chMeta = {
  1: { file: 'ch01_candidates.md', title: '第一章 集合与常用逻辑用语', spec: 'rja-ch1' },
  2: { file: 'ch02_candidates.md', title: '第二章 一元二次函数、方程和不等式', spec: 'rja-ch2' },
  3: { file: 'ch03_candidates.md', title: '第三章 函数的概念与性质', spec: 'rja-ch3' },
  4: { file: 'ch04_candidates.md', title: '第四章 指数函数与对数函数', spec: 'rja-ch4' },
  5: { file: 'ch05_candidates.md', title: '第五章 三角函数', spec: 'rja-ch5' },
  6: { file: 'ch06_candidates.md', title: '第六章 平面向量及其应用', spec: 'rjb-ch1' },
  7: { file: 'ch07_candidates.md', title: '第七章 复数', spec: 'rjb-ch2' },
  8: { file: 'ch08_candidates.md', title: '第八章 立体几何初步', spec: 'rjb-ch3' },
  9: { file: 'ch09_candidates.md', title: '第九章 统计', spec: 'rjb-ch4' },
  10: { file: 'ch10_candidates.md', title: '第十章 概率', spec: 'rjb-ch5' },
};

for (const [ch, meta] of Object.entries(chMeta)) {
  const items = candidates.filter((c) => String(c.chapterNo) === ch);
  const lines = [
    `# ${meta.title} · GLOBAL-2A 候选`,
    '',
    `> specialty \`${meta.spec}\` · 题量 ${items.length} · **未入库**`,
    '',
  ];
  for (const x of items) {
    lines.push(`## ${x.id}`, '');
    lines.push(`- 小节：${x.sectionCode} ${x.sectionName}`);
    lines.push(`- KP：\`${x.kpCode}\` ${x.kpName}`);
    lines.push(`- 题型/难度：${x.qtype} / ${x.difficulty}`);
    lines.push(`- method：${x.methodMain}${x.methodAux ? ' + ' + x.methodAux : ''}`);
    lines.push(`- 配图：${x.diagramRequirement}`);
    lines.push(`- 来源：${x.sourceType}`);
    lines.push('', '**题干**', '', x.stem, '');
    if (x.options) {
      lines.push('**选项**', '');
      for (const k of Object.keys(x.options)) lines.push(`- ${k}. ${x.options[k]}`);
      lines.push('');
    }
    lines.push('**答案**', '', x.answer, '');
    lines.push('**解析**', '', x.analysis, '');
    if (x.rubric) {
      lines.push(`**Rubric**（满分 ${x.maxScore}）`, '');
      for (const r of x.rubric) lines.push(`- ${r.key} ${r.title} ${r.score}：${r.criterion}`);
      lines.push('');
    }
    lines.push(`**作者自检**：${x.authorMathNote}`, '', '---', '');
  }
  fs.writeFileSync(path.join(__dirname, meta.file), lines.join('\n'), 'utf8');
}
console.log('wrote', Object.keys(chMeta).length, 'chapter md files');
