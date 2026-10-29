# SVG 工业流程图渲染器设计（STEP_06）

> **重要：SVG 渲染正确 ≠ 化学正确。** 本模块只保证拓扑与图形结构；化学与图文质检在 STEP_08。

## 1. 架构

```
IndustrialDiagramPublic
        ↓
validateIndustrialDiagramPublic()
        ↓
layoutIndustrialDiagram()     // 确定性分层布局
        ↓
renderIndustrialDiagramSvg()  // 原生 SVG 字符串
        ↓
validateIndustrialSvgRender() // 渲染报告
        ↓
前端 IndustrialFlowDiagram（blob img 展示）
```

权威协议仍在：`apps/api/src/chemistry/industrial/`。  
渲染器**不**调用 `projectIndustrialDiagramPublic()`；投影必须在调用前完成。

## 2. Public 输入协议

仅接受 `IndustrialDiagramPublic`（schemaVersion `1.0`）：

- 白名单字段：`schemaVersion/diagramId/diagramVersion/publicContentHash/orientation/title/nodes/edges`
- 拒绝：`internal`、`reviewMetadata`、`answerLabel`、`unknownKey`、`caseCode` 等
- 校验 `publicContentHash` 与语义一致

## 3. 节点样式（不依赖单一颜色）

| type | 形状/边框 | 说明 |
|------|-----------|------|
| material | 直角矩形 | 原料/物料 |
| process | 圆角矩形 | 处理步骤 |
| reaction | 双线矩形 | 反应突出 |
| separation | 直角+加粗描边 | 分离 |
| intermediate | 虚线边框 | 中间体 |
| product | 双线+绿色调 | 产品 |
| waste | 虚线灰色 | 废物/副产 |
| unknown | 虚线橙色直角 | 未知操作 |

## 4. 连线样式

| type | 样式 |
|------|------|
| material_flow | 实线 + 实心箭头 |
| reagent_input | 蓝色虚线 + 侧向折线 |
| condition | 灰色点线 + 空心箭头 |
| recycle | 紫色虚线 + 绕行回流路径 |
| byproduct | 灰色虚线 + 外扩折线 |

方向严格遵循 `from → to`，不绘制反向箭头。

## 5. 自动布局算法

- 默认 `left_to_right`，支持 `top_to_bottom`
- **非 recycle** 边参与拓扑分层（稳定排序 + 最长路径层）
- **recycle** 边不参与层计算，单独绕上/绕左侧折线
- 节点尺寸由标签长度/行数计算（min/max 宽高、内边距、行高）
- 同层间距 `NODE_GAP`，层间距 `LAYER_GAP`
- 确定性：相同 Public → 相同坐标
- 检测到重叠时确定性推开并记 `NODE_OVERLAP` 警告

### 已知限制

- 复杂交叉边可能仍穿过节点（无完整边路由避让）
- 多层多回流时回流线可能较拥挤（偏移递增）
- 不保证全局最短路径或美学最优

## 6. 文字处理

- `escapeSvgText`：`& < > " '`
- 长标签按字符数换行（最多 4 行）
- 化学式第一版普通文本（不改内容、无上下标引擎）
- Public 校验拒绝含 `<>` / 控制字符 / 事件串的标签

## 7. SVG 安全

生成 SVG **不得**含：`script`、`foreignObject`、`iframe`、事件属性、外链脚本/CSS/图片。  
前端用 **Blob URL + `<img>`** 展示，**不**对 AI 原始 SVG 做 `v-html`。

## 8. 渲染报告

`IndustrialSvgRenderReport`：`valid/errors/warnings/metrics`  
metrics 含：`diagramId/version/publicContentHash/rendererVersion/nodeCount/edgeCount/drawn*/canvas*`

## 9. 核心文件

| 文件 | 职责 |
|------|------|
| `industrial-diagram.validate.ts` | `validateIndustrialDiagramPublic` |
| `industrial-svg-layout.ts` | 布局 |
| `industrial-svg-renderer.ts` | `renderIndustrialDiagramSvg` |
| `industrial-svg-validate.ts` | 渲染检查 |
| `industrial-svg-escape.ts` | 转义 |
| `industrial-svg-selftest.ts` | 自检 |
| `industrial-svg-write-samples.ts` | 写示例 |
| `apps/web/.../IndustrialFlowDiagram.vue` | 展示 |
| `apps/web/src/api/industrial-diagram.ts` | 前端 Public DTO |

`rendererVersion`：`1.0.0`

## 10. 示例 SVG

`docs/chemistry_industrial_experiment/svg_samples/`

- `salt_purification_basic.svg`
- `seawater_resource_basic.svg`
- `metal_recovery_basic.svg`
- `salt_purification_basic_recycle.svg`
- 对应 `*.report.json`

由 `pnpm --filter api run chem:industrial-svg-write` 从 Public 生成，禁止手绘冒充。

## 11. 测试

```bash
pnpm --filter api run chem:industrial-svg-selftest
pnpm --filter api run chem:industrial-svg-write
pnpm --filter api run chem:industrial-diagram-selftest
pnpm --filter api run build
pnpm --filter web run build
```

## 12. STEP_07 接入建议

1. AI 产出 **Definition**（非任意 SVG）
2. `validateIndustrialDiagramDefinition` + case 对齐
3. `projectIndustrialDiagramPublic`
4. `renderIndustrialDiagramSvg` → 候选题附图
5. STEP_08 化学/图文质检 → STEP_09 审核

不得假设已有 DeepSeek 集成；需先确认真实 AI Provider。密钥不得硬编码。
