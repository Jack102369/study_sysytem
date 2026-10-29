# STEP_06 · SVG工业流程图生成器

| 字段 | 内容 |
|------|------|
| 步骤编号 | STEP_06 |
| 步骤名称 | SVG工业流程图生成器 |
| 开发目标 | 程序根据受控 JSON 生成 SVG；不信任 AI 原始 SVG |
| 前置条件 | STEP_05 JSON 协议已定 |
| 当前状态 | **COMPLETED** |
| 完成时间 | 2026-10-29 |

---

## 计划工作

1. 实现 `validateIndustrialDiagramPublic`
2. 确定性自动布局（LTR/TTB，recycle 独立路径）
3. 原生 SVG 渲染 + 安全转义 + 渲染报告
4. 自检与示例 SVG 写出
5. 前端 `IndustrialFlowDiagram`（缩放/滚动，blob 展示）
6. 文档与进度同步

---

## 实际完成内容

- Public 运行时校验（白名单、禁内部字段、哈希校验）
- 分层拓扑布局 + recycle 绕行
- 8 节点类型 / 5 连线类型视觉区分（形状/虚线/双框，非仅颜色）
- `renderIndustrialDiagramSvg` 纯函数式生成
- 4 个示例 SVG + report.json
- Vue 展示组件：加载/空/错误、放大缩小重置适应、移动端横向滚动
- 自检覆盖线性/分支/回流/恶意文本/稳定性等
- 后端构建、前端 vue-tsc+vite build 通过

---

## 实际修改/新增文件

### API

- `industrial-diagram.validate.ts`（新增 Public 校验）
- `industrial-svg-types.ts`
- `industrial-svg-escape.ts`
- `industrial-svg-layout.ts`
- `industrial-svg-renderer.ts`
- `industrial-svg-validate.ts`
- `industrial-svg-selftest.ts`
- `industrial-svg-write-samples.ts`
- `apps/api/package.json`（脚本）

### Web

- `apps/web/src/api/industrial-diagram.ts`
- `apps/web/src/components/chemistry/IndustrialFlowDiagram.vue`

### Docs

- `docs/.../svg_samples/*.svg` + `*.report.json`
- `SVG_RENDERER_DESIGN.md`
- 本文件及进度/测试/决策/NEXT_SESSION

---

## 测试命令

```bash
pnpm --filter api run chem:industrial-svg-selftest
pnpm --filter api run chem:industrial-svg-write
pnpm --filter api run chem:industrial-diagram-selftest
pnpm --filter api run chem:industrial-case-selftest
pnpm --filter api run chem:seed-selftest
pnpm --filter api run build
pnpm --filter web run build
```

---

## 测试结果

全部上列命令：**通过**（2026-10-29）。  
浏览器可视化验收：**未执行**。

---

## 验收结果

满足 STEP_06 完成标准（SVG 生成、Public-only、布局方向、安全、前端组件、文档、无 DB/无新依赖/未改训练与数学）。

---

## 遗留问题

- 复杂交叉边可能仍穿过节点（无完整边路由）
- 多层多回流线可能拥挤
- 浏览器缩放与移动端视觉未人工验收
- STEP_02/03 MySQL 实库仍待验证

---

## 下一步建议

STEP_07：AI 工业实验出题系统（先确认真实 AI Provider，禁止假设 LocalGenerator=LLM）。
